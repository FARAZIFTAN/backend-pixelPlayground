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
    
    // Find all active users
    const users = await User.find({ isDeleted: false }).select('name email role isActive');
    console.log('\n=== Active Users in Database ===');
    console.log(`Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Active: ${user.isActive}`);
    });
    
    // Test password for a specific user
    console.log('\n=== Testing Password ===');
    const testEmail = process.argv[2] || 'admin@example.com';
    const testPassword = process.argv[3] || 'admin123';
    
    console.log(`Testing login for: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    const user = await User.findOne({ email: testEmail.toLowerCase(), isDeleted: false }).select('+password');
    
    if (!user) {
      console.log('❌ User not found in database');
    } else {
      console.log('✅ User found');
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
      
      // Test password comparison
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   Password match: ${isValid ? '✅ YES' : '❌ NO'}`);
      
      if (!isValid) {
        console.log('\n⚠️  Password does not match. Try these common passwords:');
        const commonPasswords = ['admin123', 'password123', 'test123', '12345678', 'admin'];
        for (const pwd of commonPasswords) {
          const match = await bcrypt.compare(pwd, user.password);
          if (match) {
            console.log(`   ✅ Correct password is: "${pwd}"`);
            break;
          }
        }
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
