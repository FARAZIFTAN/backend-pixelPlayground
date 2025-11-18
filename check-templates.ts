import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

async function checkTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const Template = mongoose.model('Template', new mongoose.Schema({}, { strict: false }));
    const templates = await Template.find({});

    console.log(`📊 Total templates in database: ${templates.length}`);
    templates.forEach((t: any, i: number) => {
      console.log(`${i + 1}. ${t.name} - ${t.category} - Active: ${t.isActive}`);
      console.log(`   Thumbnail: ${t.thumbnail}`);
      console.log(`   Frame URL: ${t.frameUrl}`);
      console.log(`   Frame Count: ${t.frameCount}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTemplates();