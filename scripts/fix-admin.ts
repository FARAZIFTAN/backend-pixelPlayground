import mongoose from 'mongoose';
import User from '../src/models/User';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function fixAdminUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin user found:', {
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      isDeleted: admin.isDeleted,
      isEmailVerified: admin.isEmailVerified
    });

    // Update admin user
    admin.isActive = true;
    admin.isDeleted = false;
    admin.isEmailVerified = true;
    await admin.save();

    console.log('✅ Admin user updated successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAdminUser();