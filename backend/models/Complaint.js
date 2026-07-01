const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    minlength: 5,
    maxlength: 100
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: 10,
    maxlength: 1000
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Classroom Equipment',
      'Faculty Availability',
      'Hostel Maintenance',
      'Water Supply & Sanitation',
      'Exam Schedule Conflicts',
      'Harassment or Misbehavior',
      'Others'
    ]
  },

  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },

  // 👤 Who submitted complaint
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  isAnonymous: {
    type: Boolean,
    default: false
  },

  // 🔥 FIXED: Simplified department names
  assignedTo: {
    type: String,
    default: 'Unassigned',
    enum: [
      'Unassigned',
      'Maintenance',
      'Hostel',
      'Academic',
      'Examination',
      'Student Affairs'
    ]
  },

  adminRemarks: {
    type: String,
    default: '',
    maxlength: 500
  },

  statusHistory: [
    {
      status: String,
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      remark: String
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});


// 🔄 Update timestamp
complaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


module.exports = mongoose.model('Complaint', complaintSchema);