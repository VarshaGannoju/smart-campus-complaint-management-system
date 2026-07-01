/**
 * SAFE SEED SCRIPT
 * Run: node seed.js
 * ✔ Does NOT delete existing users
 * ✔ Adds only missing users
 * ✔ Passwords are hashed correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ======================
    // 👑 ADMIN
    // ======================
    const existingAdmin = await User.findOne({ email: 'admin@campus.edu' });

    if (!existingAdmin) {
      await User.create({
        name: 'Campus Admin',
        email: 'admin@campus.edu',
        password: 'admin123',
        role: 'admin'
      });
      console.log('👑 Admin created');
    } else {
      console.log('👑 Admin already exists');
    }

    // ======================
    // 👤 STUDENT
    // ======================
    const existingStudent = await User.findOne({ email: 'student@campus.edu' });

    if (!existingStudent) {
      await User.create({
        name: 'Demo Student',
        email: 'student@campus.edu',
        password: 'student123',
        role: 'student',
        rollNumber: '24B81A67K9',
        department: 'Computer Science'
      });
      console.log('👤 Student created');
    } else {
      console.log('👤 Student already exists');
    }

    // ======================
    // 🏢 DEPARTMENTS
    // ======================
    const departments = [
      {
        name: 'Maintenance Department',
        email: 'maintenance@campus.edu',
        password: '123456',
        role: 'department',
        department: 'Maintenance'
      },
      {
        name: 'Hostel Department',
        email: 'hostel@campus.edu',
        password: '123456',
        role: 'department',
        department: 'Hostel'
      },
      {
        name: 'Examination Cell',
        email: 'exam@campus.edu',
        password: '123456',
        role: 'department',
        department: 'Examination'
      },
      {
        name: 'Student Affairs',
        email: 'studentaffairs@campus.edu',
        password: '123456',
        role: 'department',
        department: 'Student Affairs'
      }
    ];

    for (const dept of departments) {
      const exists = await User.findOne({ email: dept.email });

      if (!exists) {
        await User.create(dept); // ✅ hashing works
        console.log(`🏢 Created: ${dept.email}`);
      } else {
        console.log(`🏢 Already exists: ${dept.email}`);
      }
    }

    // ======================
    // 🎉 DONE
    // ======================
    console.log('\n🎉 SAFE SEED COMPLETE!');
    console.log('==========================================');

    console.log('👑 Admin: admin@campus.edu / admin123');
    console.log('👤 Student: student@campus.edu / student123');

    console.log('\n🏢 Departments:');
    console.log('maintenance@campus.edu / 123456');
    console.log('hostel@campus.edu / 123456');
    console.log('exam@campus.edu / 123456');
    console.log('studentaffairs@campus.edu / 123456');

    console.log('==========================================\n');

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();