const jwt = require('jsonwebtoken');
const User = require('../models/User');


// ===============================
// 🔐 PROTECT ROUTE (VERIFY TOKEN)
// ===============================
const protect = async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT: include role + department
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    req.user = user; // contains: _id, role, department

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or expired.'
    });
  }
};


// ===============================
// 👑 ADMIN ONLY
// ===============================
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Admins only.'
  });
};


// ===============================
// 🏢 DEPARTMENT ONLY (NEW)
// ===============================
const departmentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'department') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Departments only.'
  });
};


module.exports = {
  protect,
  adminOnly,
  departmentOnly
};