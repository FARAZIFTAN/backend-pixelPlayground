const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Define User Schema with proper middleware
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

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const email = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!email || !newPassword) {
      console.log('Usage: node reset-password.js <email> <new-password>');
      console.log('Example: node reset-password.js karyaklik@gmail.com admin123');
      process.exit(1);
    }
    
    console.log(`Resetting password for: ${email}`);
    console.log(`New password: ${newPassword}\n`);
    
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name} (${user.role})`);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password directly
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetPassword();
