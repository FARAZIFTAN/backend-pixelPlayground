import { Schema, model, models, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  googleId?: string;
  phone?: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  lastLogin?: Date;
  loginHistory: Array<{
    ipAddress: string;
    userAgent: string;
    loginAt: Date;
  }>;
  settings?: {
    notifications?: {
      emailNotifications?: boolean;
      templateAlerts?: boolean;
      weeklyReports?: boolean;
    };
    theme?: {
      theme?: string;
      language?: string;
    };
  };
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generateResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: function(this: IUser) {
        // Password not required for Google OAuth users
        return !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot be more than 20 characters'],
    },
    profilePicture: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    loginHistory: {
      type: [{
        ipAddress: String,
        userAgent: String,
        loginAt: Date,
      }],
      default: [],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    deletedAt: {
      type: Date,
      select: false,
    },
    settings: {
      type: {
        notifications: {
          type: {
            emailNotifications: {
              type: Boolean,
              default: true,
            },
            templateAlerts: {
              type: Boolean,
              default: true,
            },
            weeklyReports: {
              type: Boolean,
              default: false,
            },
          },
          default: {},
        },
        theme: {
          type: {
            theme: {
              type: String,
              enum: ['light', 'dark'],
              default: 'dark',
            },
            language: {
              type: String,
              enum: ['en', 'id'],
              default: 'en',
            },
          },
          default: {},
        },
      },
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for soft delete queries
userSchema.index({ isDeleted: 1, isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function (): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Method to generate reset password token
userSchema.methods.generateResetPasswordToken = function (): string {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return token;
};

const User: Model<IUser> = models.User || model<IUser>('User', userSchema);

export default User;