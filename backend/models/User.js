const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Never return password in queries
  },

  // 🔥 UPDATED ROLE SYSTEM
  role: {
    type: String,
    enum: ['student', 'admin', 'department'], // ✅ added department
    default: 'student'
  },

  // 👤 For students
  rollNumber: {
    type: String,
    trim: true,
    uppercase: true
  },

  // 🏢 For department users
  department: {
    type: String,
    trim: true,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index(
  { rollNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      rollNumber: { $exists: true, $type: 'string', $gt: '' }
    }
  }
);


// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});


// 🔑 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', userSchema);
