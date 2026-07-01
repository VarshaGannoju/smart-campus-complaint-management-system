const express = require('express');
const router = express.Router();

const {
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignComplaint,
  getDashboardStats
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');

// ==============================
// ROLE CHECK MIDDLEWARE
// ==============================
const adminOrDepartment = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'department') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin or Department only.'
  });
};

// ==============================
// ROUTES
// ==============================

// ✅ BOTH admin + department can view complaints
router.get('/complaints', protect, adminOrDepartment, getAllComplaints);

// ❌ Only admin can see stats
router.get('/stats', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
}, getDashboardStats);

// ✅ Admin + department can update status
router.patch('/complaints/:id/status', protect, adminOrDepartment, updateComplaintStatus);

router.patch('/complaints/:id/priority', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
}, updateComplaintPriority);

router.patch('/complaints/:id/assign', protect, (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
}, assignComplaint);

module.exports = router;
