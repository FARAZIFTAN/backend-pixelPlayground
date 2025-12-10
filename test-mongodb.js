// Test MongoDB Connection
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔗 Testing MongoDB Connection...');
console.log('📍 URI (masked):', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

mongoose.connect(MONGODB_URI, {
  bufferCommands: false,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  maxPoolSize: 10,
  minPoolSize: 2,
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📍 Connected to:', MONGODB_URI.split('@')[1].split('/')[0]);
    console.log('🗄️  Database:', mongoose.connection.db.databaseName);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', err.message);
    console.error('🔗 Tried to connect to:', MONGODB_URI.split('@')[1].split('/')[0]);
    process.exit(1);
  });
