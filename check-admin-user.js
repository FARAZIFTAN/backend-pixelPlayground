const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isActive: Boolean,
  isDeleted: Boolean,
  isPremium: Boolean,
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function checkAdminUser(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('=== User Details ===');
    console.log('ID:', user._id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role || '(not set)');
    console.log('isActive:', user.isActive !== false);
    console.log('isDeleted:', user.isDeleted || false);
    console.log('isPremium:', user.isPremium || false);
    
    console.log('\n=== Status ===');
    if (user.role === 'admin') {
      console.log('✅ This user is an ADMIN');
    } else {
      console.log('⚠️ This user is NOT an admin (role:', user.role || 'not set', ')');
    }
    
    if (user.isDeleted) {
      console.log('❌ This user is DELETED');
    }
    
    if (user.isActive === false) {
      console.log('❌ This user is INACTIVE');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'admin@karyaklik.com';

checkAdminUser(email);
