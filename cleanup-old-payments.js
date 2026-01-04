/**
 * Script to cleanup old payments with invalid package types
 * Run with: node cleanup-old-payments.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanupOldPayments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }), 'payments');

    // Find all payments with old package types
    const oldPayments = await Payment.find({
      packageType: { $in: ['basic', 'plus', 'enterprise'] }
    });

    console.log(`\n📊 Found ${oldPayments.length} payments with old package types:`);
    
    if (oldPayments.length > 0) {
      oldPayments.forEach((payment, index) => {
        console.log(`${index + 1}. ID: ${payment._id}, Type: ${payment.packageType}, Status: ${payment.status}, User: ${payment.userId}`);
      });

      // Delete all pending old payments
      const deleteResult = await Payment.deleteMany({
        packageType: { $in: ['basic', 'plus', 'enterprise'] },
        status: { $in: ['pending_payment', 'pending_verification'] }
      });

      console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} pending old payments`);

      // Update approved old payments to 'pro' type
      const updateResult = await Payment.updateMany(
        {
          packageType: { $in: ['basic', 'plus', 'enterprise'] },
          status: 'approved'
        },
        {
          $set: { 
            packageType: 'pro',
            packageName: 'KaryaKlik Pro'
          }
        }
      );

      console.log(`✏️  Updated ${updateResult.modifiedCount} approved old payments to 'pro' type`);
    }

    console.log('\n✅ Cleanup completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOldPayments();
