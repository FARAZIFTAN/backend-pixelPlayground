import { Schema, model, models, Document, Model } from 'mongoose';

export interface IUsageLimit extends Document {
  userId: Schema.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD (untuk grouping harian)
  
  // AI Frame Generation
  aiGenerationCount: number;
  aiGenerationLimit: number;
  
  // Custom Frame Upload
  frameUploadCount: number;
  frameUploadLimit: number;
  
  // Package Info
  packageType: 'free' | 'pro';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementAIGeneration(): Promise<IUsageLimit>;
  incrementFrameUpload(): Promise<IUsageLimit>;
}

// Model interface untuk static methods
export interface IUsageLimitModel extends Model<IUsageLimit> {
  getOrCreateToday(
    userId: Schema.Types.ObjectId,
    packageType?: 'free' | 'pro'
  ): Promise<IUsageLimit>;
}

const usageLimitSchema = new Schema<IUsageLimit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
      // Format: YYYY-MM-DD
    },
    
    // AI Frame Generation
    aiGenerationCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    aiGenerationLimit: {
      type: Number,
      required: true,
      default: 0, // Free user = 0 (no access)
    },
    
    // Custom Frame Upload
    frameUploadCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    frameUploadLimit: {
      type: Number,
      required: true,
      default: 0, // Free user = 0 (no access)
    },
    
    // Package Info
    packageType: {
      type: String,
      required: true,
      enum: ['free', 'pro'],
      default: 'free',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index untuk userId + date (untuk query harian)
usageLimitSchema.index({ userId: 1, date: 1 }, { unique: true });

// Static method untuk get atau create usage limit hari ini
usageLimitSchema.statics.getOrCreateToday = async function(
  userId: Schema.Types.ObjectId,
  packageType: 'free' | 'pro' = 'free'
) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Define limits per package
  const limits = {
    free: { aiGeneration: 0, frameUpload: 0 },
    pro: { aiGeneration: 999999, frameUpload: 999999 }, // Unlimited
  };
  
  const packageLimits = limits[packageType];
  
  let usageLimit = await this.findOne({ userId, date: today });
  
  if (!usageLimit) {
    usageLimit = await this.create({
      userId,
      date: today,
      aiGenerationCount: 0,
      aiGenerationLimit: packageLimits.aiGeneration,
      frameUploadCount: 0,
      frameUploadLimit: packageLimits.frameUpload,
      packageType,
    });
  } else if (usageLimit.packageType !== packageType) {
    // Update limits jika package berubah
    usageLimit.packageType = packageType;
    usageLimit.aiGenerationLimit = packageLimits.aiGeneration;
    usageLimit.frameUploadLimit = packageLimits.frameUpload;
    await usageLimit.save();
  }
  
  return usageLimit;
};

// Method untuk increment AI generation
usageLimitSchema.methods.incrementAIGeneration = async function() {
  if (this.aiGenerationCount >= this.aiGenerationLimit) {
    throw new Error('Daily AI generation limit reached');
  }
  this.aiGenerationCount += 1;
  await this.save();
  return this;
};

// Method untuk increment frame upload
usageLimitSchema.methods.incrementFrameUpload = async function() {
  if (this.frameUploadCount >= this.frameUploadLimit) {
    throw new Error('Daily frame upload limit reached');
  }
  this.frameUploadCount += 1;
  await this.save();
  return this;
};

const UsageLimit = (models.UsageLimit || model<IUsageLimit, IUsageLimitModel>('UsageLimit', usageLimitSchema)) as IUsageLimitModel;

export default UsageLimit;
