/**
 * Migration script to add visibility and isAIGenerated fields to existing templates
 * 
 * This script updates all existing templates with default values:
 * - visibility: 'public' (all existing templates become public)
 * - isAIGenerated: false (existing templates are not AI-generated)
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoboothDB';

async function migrateTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const templatesCollection = db.collection('templates');

    // Count existing templates without visibility field
    const templatesWithoutVisibility = await templatesCollection.countDocuments({
      visibility: { $exists: false }
    });

    console.log(`📊 Found ${templatesWithoutVisibility} templates without visibility field`);

    if (templatesWithoutVisibility === 0) {
      console.log('✨ No templates need migration');
      return;
    }

    // Update all templates without visibility field
    const result = await templatesCollection.updateMany(
      {
        $or: [
          { visibility: { $exists: false } },
          { isAIGenerated: { $exists: false } }
        ]
      },
      {
        $set: {
          visibility: 'public',
          isAIGenerated: false
        }
      }
    );

    console.log(`✅ Migration completed!`);
    console.log(`   - Modified: ${result.modifiedCount} templates`);
    console.log(`   - Matched: ${result.matchedCount} templates`);

    // Verify migration
    const publicTemplates = await templatesCollection.countDocuments({ visibility: 'public' });
    const privateTemplates = await templatesCollection.countDocuments({ visibility: 'private' });
    const aiTemplates = await templatesCollection.countDocuments({ isAIGenerated: true });

    console.log('\n📈 Current Statistics:');
    console.log(`   - Public templates: ${publicTemplates}`);
    console.log(`   - Private templates: ${privateTemplates}`);
    console.log(`   - AI-generated templates: ${aiTemplates}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('👋 Database connection closed');
  }
}

// Run migration
migrateTemplates()
  .then(() => {
    console.log('✨ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
