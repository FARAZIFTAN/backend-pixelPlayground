const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET;

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.log('Usage: node decode-token.js <token>');
  console.log('Example: node decode-token.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

console.log('\n=== Token Decoder ===\n');
console.log('Token (first 50 chars):', token.substring(0, 50) + '...\n');

try {
  // Decode without verification (to see payload)
  const decodedWithoutVerify = jwt.decode(token);
  console.log('📋 Decoded Payload (without verification):');
  console.log(JSON.stringify(decodedWithoutVerify, null, 2));
  
  // Verify and decode
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token Verified Successfully!');
  console.log('\n📋 Verified Payload:');
  console.log(JSON.stringify(verified, null, 2));
  
  // Check expiration
  if (verified.exp) {
    const expiryDate = new Date(verified.exp * 1000);
    const now = new Date();
    const isExpired = expiryDate < now;
    
    console.log('\n⏰ Expiration Info:');
    console.log('  Expires at:', expiryDate.toLocaleString());
    console.log('  Current time:', now.toLocaleString());
    console.log('  Status:', isExpired ? '❌ EXPIRED' : '✅ VALID');
    
    if (!isExpired) {
      const timeLeft = expiryDate - now;
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      console.log('  Time left:', daysLeft, 'days', hoursLeft, 'hours');
    }
  }
  
  // Check role
  console.log('\n👤 User Info:');
  console.log('  User ID:', verified.userId);
  console.log('  Email:', verified.email);
  console.log('  Name:', verified.name);
  console.log('  Role:', verified.role || '(not set)');
  
  if (verified.role === 'admin') {
    console.log('\n✅ This is an ADMIN token');
  } else {
    console.log('\n⚠️ This is a USER token (role:', verified.role || 'not set', ')');
  }
  
} catch (error) {
  console.error('\n❌ Token Verification Failed:', error.message);
  
  // Still try to decode
  try {
    const decoded = jwt.decode(token);
    console.log('\n📋 Decoded Payload (unverified):');
    console.log(JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.error('Cannot decode token');
  }
}
