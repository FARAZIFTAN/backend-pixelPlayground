const { MongoClient } = require('mongodb');

async function checkPhotos() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelplayground';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('âœ… Connected to MongoDB\n');
        
        const db = client.db();
        
        // Count photos
        const photosCount = await db.collection('photos').countDocuments();
        console.log('Photos count:', photosCount);
        
        // Get all photos
        const photos = await db.collection('photos').find({}).toArray();
        console.log('\nPhotos in collection:');
        console.log(JSON.stringify(photos, null, 2));
        
        // Check composites
        const compositesCount = await db.collection('finalcomposites').countDocuments();
        console.log('\n\nFinal Composites count:', compositesCount);
        
        // Get sample composites
        const composites = await db.collection('finalcomposites').find({}).limit(3).toArray();
        console.log('\nSample composites:');
        console.log(JSON.stringify(composites, null, 2));
        
    } catch (error) {
        console.error('âŒ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkPhotos();
