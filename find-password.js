const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const testEmail = process.argv[2] || 'karyaklik@gmail.com';
    console.log(`\n=== Finding Password for: ${testEmail} ===\n`);
    
    const user = await User.findOne({ email: testEmail.toLowerCase(), isDeleted: false }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log(`User: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}\n`);
    
    // Test common passwords
    const commonPasswords = [
      'karyaklik',
      'karyaklik123',
      'KaryaKlik',
      'KaryaKlik123',
      'admin',
      'admin123',
      'Admin123',
      'password',
      'password123',
      'Password123',
      '12345678',
      '123456789',
      'qwerty123',
      'test123',
      'user123',
    ];
    
    console.log('Testing common passwords...\n');
    let found = false;
    
    for (const pwd of commonPasswords) {
      const match = await bcrypt.compare(pwd, user.password);
      if (match) {
        console.log(`✅✅✅ FOUND! Password is: "${pwd}"`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log('❌ Password not found in common list');
      console.log('\nTry to reset password or check with user directly');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
