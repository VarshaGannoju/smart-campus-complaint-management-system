const Complaint = require('../models/Complaint');

const getDepartmentForCategory = (category = '') => {
  const categoryToDepartment = {
    'Classroom Equipment': 'Maintenance',
    'Faculty Availability': 'Academic',
    'Hostel Maintenance': 'Hostel',
    'Water Supply & Sanitation': 'Maintenance',
    'Exam Schedule Conflicts': 'Examination',
    'Harassment or Misbehavior': 'Student Affairs',
    'Others': 'Unassigned'
  };

  return categoryToDepartment[category] || 'Unassigned';
};

const normalizeDepartment = (value = '') => {
  const normalized = String(value).trim().toLowerCase();

  const map = {
    maintenance: 'Maintenance',
    'maintenance department': 'Maintenance',
    hostel: 'Hostel',
    'hostel department': 'Hostel',
    academic: 'Academic',
    'academic department': 'Academic',
    examination: 'Examination',
    'examination cell': 'Examination',
    'student affairs': 'Student Affairs',
    administration: 'Student Affairs'
  };

  return map[normalized] || null;
};

const sanitizeComplaint = (complaint, requestingRole) => {
  const obj = complaint.toObject ? complaint.toObject() : { ...complaint };

  if (obj.isAnonymous) {
    if (requestingRole !== 'admin') {
      obj.submittedBy = null;
    } else {
      obj.submittedBy = { name: 'Anonymous', email: '(hidden)', _id: null };
    }
  }

  return obj;
};

const submitComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, isAnonymous } = req.body;
    const assignedTo = getDepartmentForCategory(category);

    if (!title || !description || !category || !priority) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      assignedTo,
      isAnonymous: Boolean(isAnonymous),
      submittedBy: req.user._id,
      statusHistory: [
        {
          status: 'Pending',
          changedBy: req.user._id,
          remark: assignedTo === 'Unassigned'
            ? 'Complaint submitted'
            : `Complaint submitted and auto-assigned to ${assignedTo}`
        }
      ]
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_complaint', {
        message: `New ${priority} complaint in "${category}"`,
        complaint: {
          _id: complaint._id,
          title: complaint.title,
          category: complaint.category,
          assignedTo: complaint.assignedTo,
          priority: complaint.priority,
          isAnonymous: complaint.isAnonymous,
          createdAt: complaint.createdAt
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      complaint: sanitizeComplaint(complaint, req.user.role)
    });
  } catch (err) {
    console.error('Submit complaint error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting complaint.' });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const user = req.user;
    let complaints = [];

    if (user.role === 'admin') {
      complaints = await Complaint.find()
        .populate('submittedBy', 'name email')
        .sort({ createdAt: -1 });
    } else if (user.role === 'department') {
      const department = normalizeDepartment(user.department);
      if (!department) {
        return res.status(400).json({ success: false, message: 'Invalid department mapping.' });
      }

      complaints = await Complaint.find({ assignedTo: department })
        .populate('submittedBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      complaints = await Complaint.find({ submittedBy: user._id }).sort({ createdAt: -1 });
    }

    const sanitized = complaints.map((complaint) => sanitizeComplaint(complaint, user.role));

    res.json({
      success: true,
      count: sanitized.length,
      complaints: sanitized
    });
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });

    const sanitized = complaints.map((complaint) => sanitizeComplaint(complaint, req.user.role));

    res.json({
      success: true,
      count: sanitized.length,
      complaints: sanitized
    });
  } catch (err) {
    console.error('Get my complaints error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name email rollNumber department');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (
      req.user.role === 'student' &&
      complaint.submittedBy?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (req.user.role === 'department') {
      const department = normalizeDepartment(req.user.department);
      if (!department || complaint.assignedTo !== department) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({
      success: true,
      complaint: sanitizeComplaint(complaint, req.user.role)
    });
  } catch (err) {
    console.error('Get complaint error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  submitComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById
};
