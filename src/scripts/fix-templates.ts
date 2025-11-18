import mongoose from 'mongoose';
import Template from '@/models/Template';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function fixTemplateStatus() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update Graduation template to active
    const result = await (Template as any).updateOne(
      { name: "Graduation" },
      { $set: { isActive: true } }
    );

    if (result.matchedCount > 0) {
      console.log('✅ Graduation template updated to active');
    } else {
      console.log('⚠️  Graduation template not found');
    }

    // Verify all templates
    const allTemplates = await (Template as any).find({}, 'name isActive');
    console.log('📋 Current template status:');
    allTemplates.forEach(template => {
      console.log(`   - ${template.name}: isActive = ${template.isActive}`);
    });

    console.log('🎉 Fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing templates:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix
fixTemplateStatus()
  .then(() => {
    console.log('Fix script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix script failed:', error);
    process.exit(1);
  });