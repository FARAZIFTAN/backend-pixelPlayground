// Seed script to populate templates in database
// Run with: node scripts/seed-templates.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Template schema (duplicate from model for standalone script)
const layoutPositionSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    thumbnail: String,
    frameUrl: String,
    isPremium: Boolean,
    frameCount: Number,
    layoutPositions: [layoutPositionSchema],
    isActive: Boolean,
    createdBy: String,
  },
  { timestamps: true }
);

const Template = mongoose.model('Template', templateSchema);

// Initial templates data (from templates.ts)
const templates = [
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
    isActive: true,
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
    isActive: true,
  },
];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if templates already exist
    const existingCount = await Template.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing templates`);
      console.log('❓ Do you want to clear and reseed? (yes/no)');
      
      // For now, just skip if exists
      console.log('⏭️  Skipping seed (templates already exist)');
      console.log('💡 To force reseed, delete templates manually in MongoDB first');
      await mongoose.disconnect();
      return;
    }

    // Insert templates
    console.log('🌱 Seeding templates...');
    const result = await Template.insertMany(templates);
    console.log(`✅ Successfully seeded ${result.length} templates`);

    // Display seeded templates
    result.forEach((template) => {
      console.log(`  📄 ${template.name} (${template.category}) - ID: ${template._id}`);
    });

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run seed
seedTemplates();
