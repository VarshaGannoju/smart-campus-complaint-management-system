const Complaint = require('../models/Complaint');

const ASSIGNABLE_DEPARTMENTS = [
  'Unassigned',
  'Maintenance',
  'Hostel',
  'Academic',
  'Examination',
  'Student Affairs'
];

const normalizeDepartment = (value = '') => {
  const normalized = String(value).trim().toLowerCase();

  const map = {
    'maintenance': 'Maintenance',
    'maintenance department': 'Maintenance',
    'hostel': 'Hostel',
    'hostel department': 'Hostel',
    'academic': 'Academic',
    'academic department': 'Academic',
    'examination': 'Examination',
    'examination cell': 'Examination',
    'student affairs': 'Student Affairs',
    'administration': 'Student Affairs'
  };

  return map[normalized] || null;
};

// ==============================
// GET COMPLAINTS (ADMIN + DEPARTMENT)
// ==============================
const getAllComplaints = async (req, res) => {
  try {
    const { category, priority, status, sortBy } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    // Role-based filter: department users only see their department complaints.
    if (req.user.role === 'department') {
      const mappedDepartment = normalizeDepartment(req.user.department);

      if (!mappedDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department mapping for current user.'
        });
      }

      filter.assignedTo = mappedDepartment;
    }

    const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    const dbSort = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    let complaints = await Complaint.find(filter)
      .populate('submittedBy', 'name email rollNumber department')
      .sort(dbSort);

    if (sortBy === 'priority_desc') {
      complaints.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    } else if (sortBy === 'priority_asc') {
      complaints.sort((a, b) => (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0));
    }

    const masked = complaints.map(c => {
      const obj = c.toObject();
      if (obj.isAnonymous) {
        obj.submittedBy = { name: 'Anonymous', email: '(hidden)', _id: null };
      }
      return obj;
    });

    res.json({ success: true, count: masked.length, complaints: masked });
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ==============================
// UPDATE STATUS
// ==============================
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Resolved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user.role === 'department') {
      const mappedDepartment = normalizeDepartment(req.user.department);
      if (!mappedDepartment || complaint.assignedTo !== mappedDepartment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can update only complaints assigned to your department.'
        });
      }
    }

    complaint.status = status;
    complaint.adminRemarks = remark || complaint.adminRemarks;

    if (!Array.isArray(complaint.statusHistory)) {
      complaint.statusHistory = [];
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      remark: remark || `Status updated to ${status}`
    });

    await complaint.save();

    const io = req.app.get('io');

    if (io) {
      io.to(`user_${complaint.submittedBy.toString()}`).emit('complaint_updated', {
        complaintId: complaint._id,
        title: complaint.title,
        newStatus: status,
        remark: remark || '',
        message: `Your complaint "${complaint.title}" is now ${status}.`
      });

      io.to('admin_room').emit('complaint_status_changed', {
        complaintId: complaint._id,
        title: complaint.title,
        newStatus: status,
        updatedBy: req.user.name || 'Admin'
      });
    }

    res.json({ success: true, message: `Status updated to "${status}"`, complaint });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ==============================
// UPDATE PRIORITY
// ==============================
const updateComplaintPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.priority = priority;
    await complaint.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${complaint.submittedBy.toString()}`).emit('priority_updated', {
        complaintId: complaint._id,
        title: complaint.title,
        priority,
        message: `Priority for "${complaint.title}" is now ${priority}.`
      });
    }

    res.json({ success: true, message: 'Priority updated', complaint });
  } catch (err) {
    console.error('Priority error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ==============================
// ASSIGN COMPLAINT
// ==============================
const assignComplaint = async (req, res) => {
  try {
    const { assignedTo: rawAssignedTo } = req.body;
    const assignedTo = normalizeDepartment(rawAssignedTo);

    if (!assignedTo || !ASSIGNABLE_DEPARTMENTS.includes(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department assignment.'
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${complaint.submittedBy.toString()}`).emit('complaint_assigned', {
        complaintId: complaint._id,
        title: complaint.title,
        assignedTo,
        message: `Your complaint "${complaint.title}" was assigned to ${assignedTo}.`
      });
    }

    res.json({ success: true, message: `Assigned to ${assignedTo}`, complaint });
  } catch (err) {
    console.error('Assign error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ==============================
// GET DASHBOARD STATS
// ==============================
const getDashboardStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const critical = await Complaint.countDocuments({ priority: 'Critical' });
    const high = await Complaint.countDocuments({ priority: 'High' });

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        critical,
        high,
        categoryStats
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignComplaint,
  getDashboardStats
};
