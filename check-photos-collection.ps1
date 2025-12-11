# Check Photos Collection in MongoDB
Write-Host "=== Checking Photos Collection ===" -ForegroundColor Cyan

# Connect to MongoDB and check photos collection
$mongoCommand = @"
const { MongoClient } = require('mongodb');

async function checkPhotos() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelplayground';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');
        
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
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkPhotos();
"@

$mongoCommand | Out-File -FilePath "check-photos-collection.js" -Encoding utf8

Write-Host "Running MongoDB check..." -ForegroundColor Yellow
node check-photos-collection.js

Write-Host "`n=== Analysis ===" -ForegroundColor Cyan
Write-Host "If photos count is 0, it means:" -ForegroundColor Yellow
Write-Host "1. No composite has been created AFTER implementing auto-save feature" -ForegroundColor Gray
Write-Host "2. Existing composites were created BEFORE the update" -ForegroundColor Gray
Write-Host "`nSolution: Create a NEW composite to test auto-save" -ForegroundColor Green
