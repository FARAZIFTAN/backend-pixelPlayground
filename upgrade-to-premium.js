const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  isPremium: Boolean,
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function upgradeToPremium(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('📌 Current status:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  isPremium:', user.isPremium || false);

    user.isPremium = true;
    await user.save();

    console.log('\n✅ User upgraded to PREMIUM!');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  isPremium:', user.isPremium);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node upgrade-to-premium.js <email>');
  console.log('Example: node upgrade-to-premium.js user@example.com');
  process.exit(1);
}

upgradeToPremium(email);
