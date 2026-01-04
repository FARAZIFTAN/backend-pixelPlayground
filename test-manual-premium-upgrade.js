// Script untuk simulasi user upgrade ke premium
// Jalankan: node test-manual-premium-upgrade.js <email>

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.aovhe.mongodb.net/photobooth?retryWrites=true&w=majority&appName=Cluster0';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function upgradeToPremium(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log('\nBEFORE UPDATE:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('isPremium:', user.isPremium);
    console.log('premiumExpiresAt:', user.premiumExpiresAt);

    // Simulate premium upgrade
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days premium

    user.isPremium = true;
    user.premiumExpiresAt = expiryDate;
    await user.save();

    console.log('\nAFTER UPDATE:');
    console.log('isPremium:', user.isPremium);
    console.log('premiumExpiresAt:', user.premiumExpiresAt);
    console.log('\n✅ User upgraded to premium successfully!');
    console.log('\n📌 Now check admin dashboard - it should auto-refresh in max 30 seconds');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node test-manual-premium-upgrade.js <user-email>');
  process.exit(1);
}

upgradeToPremium(email);
