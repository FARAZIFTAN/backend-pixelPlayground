// Quick verification of photos table
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function verify() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== PHOTOS TABLE VERIFICATION ===\n');
    
    const count = await db.collection('photos').countDocuments();
    console.log(`✅ Total photos: ${count}\n`);
    
    if (count > 0) {
      const photos = await db.collection('photos').find({}).toArray();
      
      console.log('Photos details:');
      photos.forEach((p, i) => {
        console.log(`${i+1}. ${p.title}`);
        console.log(`   - isPublic: ${p.isPublic}`);
        console.log(`   - views: ${p.views}, likes: ${p.likes}`);
        console.log(`   - created: ${p.createdAt}\n`);
      });
      
      // Count by visibility
      const publicCount = await db.collection('photos').countDocuments({ isPublic: true });
      const privateCount = await db.collection('photos').countDocuments({ isPublic: false });
      
      console.log('\n=== Summary ===');
      console.log(`📸 Total: ${count}`);
      console.log(`🔒 Private: ${privateCount}`);
      console.log(`🌍 Public: ${publicCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

verify();
