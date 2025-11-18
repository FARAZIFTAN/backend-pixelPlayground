import mongoose from 'mongoose';
import Template, { ITemplate } from '../models/Template';
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

// Initial template data - use Partial to allow missing Document fields
const templates: Partial<ITemplate>[] = [
  {
    name: "Graduation",
    category: "Education",
    thumbnail: "/assets/templates/graduation/graduation-1.png",
    frameUrl: "/assets/templates/graduation/graduation-1.png",
    isPremium: false,
    frameCount: 3,
    layoutPositions: [
      { x: 27, y: 99, width: 487, height: 318 },
      { x: 28, y: 490, width: 485, height: 323 },
      { x: 27, y: 883, width: 486, height: 317 },
    ],
    isActive: true, // ✅ Changed from false to true
  },
  {
    name: "Morris",
    category: "Artistic",
    thumbnail: "/assets/templates/morris/morris-1.png",
    frameUrl: "/assets/templates/morris/morris-1.png",
    isPremium: false,
    frameCount: 3,
    layoutPositions: [
      { x: 26, y: 181, width: 485, height: 315 },
      { x: 27, y: 560, width: 498, height: 317 },
      { x: 27, y: 947, width: 486, height: 323 },
    ],
    isActive: true, // ✅ Already true
  },
];

async function seedTemplates() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if templates already exist
    const existingCount = await Template.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} templates`);
      console.log('Do you want to:');
      console.log('1. Skip seeding');
      console.log('2. Clear and re-seed');
      console.log('3. Add new templates (keep existing)');
      
      // For now, we'll skip if data exists
      console.log('Skipping seed (data already exists)');
      await mongoose.disconnect();
      return;
    }

    console.log('📝 Seeding templates...');
    
    const createdTemplates = await Template.insertMany(templates as any);
    
    console.log(`✅ Successfully created ${createdTemplates.length} templates:`);
    createdTemplates.forEach((template) => {
      console.log(`   - ${template.name} (${template.category})`);
    });

    console.log('🎉 Seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seed
seedTemplates()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
