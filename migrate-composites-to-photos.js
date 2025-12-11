// Migrate Existing Composites to Photos Gallery
require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function migrateComposites() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = client.db();
    
    // 1. Check existing photos
    const existingPhotosCount = await db.collection('photos').countDocuments();
    console.log(`📊 Existing photos in gallery: ${existingPhotosCount}\n`);
    
    // 2. Get all composites
    const composites = await db.collection('finalcomposites').find({}).toArray();
    console.log(`📸 Total composites found: ${composites.length}\n`);
    
    if (composites.length === 0) {
      console.log('⚠️  No composites found. Create a composite first!');
      return;
    }
    
    // 3. Get template names for better titles
    const templates = await db.collection('templates').find({}).toArray();
    const templateMap = {};
    templates.forEach(t => {
      templateMap[t._id.toString()] = t.name;
    });
    
    // 4. Migrate composites to photos
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const composite of composites) {
      // Check if already migrated
      const exists = await db.collection('photos').findOne({
        userId: composite.userId,
        imageUrl: composite.compositeUrl
      });
      
      if (exists) {
        console.log(`⏭️  Skipped: Already in gallery - ${composite._id}`);
        skippedCount++;
        continue;
      }
      
      // Get template name
      const templateName = composite.templateId 
        ? (templateMap[composite.templateId] || 'Untitled')
        : 'Untitled';
      
      // Create photo entry
      const photo = {
        userId: composite.userId,
        title: `${templateName} - ${new Date(composite.createdAt).toLocaleDateString('id-ID')}`,
        description: `Created from ${templateName} template`,
        imageUrl: composite.compositeUrl,
        thumbnailUrl: composite.thumbnailUrl || composite.compositeUrl,
        isPublic: composite.isPublic || false,
        templateId: composite.templateId || null,
        views: composite.views || 0,
        likes: composite.likes || 0,
        createdAt: composite.createdAt,
        updatedAt: composite.updatedAt || composite.createdAt
      };
      
      await db.collection('photos').insertOne(photo);
      console.log(`✅ Migrated: ${photo.title} (${photo._id})`);
      migratedCount++;
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Migrated: ${migratedCount} composites`);
    console.log(`⏭️  Skipped: ${skippedCount} composites (already in gallery)`);
    console.log(`📊 Total photos in gallery: ${existingPhotosCount + migratedCount}`);
    
    // 5. Show sample photos
    console.log('\n=== Sample Photos in Gallery ===');
    const samplePhotos = await db.collection('photos').find({}).limit(5).toArray();
    samplePhotos.forEach(photo => {
      console.log(`- ${photo.title} | Public: ${photo.isPublic} | Views: ${photo.views} | Likes: ${photo.likes}`);
    });
    
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

migrateComposites();
