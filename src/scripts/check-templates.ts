import mongoose from 'mongoose';
const Template = require('../models/Template');
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

async function checkTemplates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count total templates
    const totalCount = await (Template as any).countDocuments();
    console.log(`📊 Total templates in database: ${totalCount}`);

    // Get all templates with basic info
    const templates = await (Template as any).find({}, 'name category isActive isPremium').lean();
    console.log('📋 Template details:');
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.category}) - Active: ${template.isActive}, Premium: ${template.isPremium}`);
    });

    // Count active templates
    const activeCount = await (Template as any).countDocuments({ isActive: true });
    console.log(`✅ Active templates: ${activeCount}`);

    console.log('🎉 Check completed successfully!');

  } catch (error) {
    console.error('❌ Error checking templates:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run check
checkTemplates()
  .then(() => {
    console.log('Check script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check script failed:', error);
    process.exit(1);
  });