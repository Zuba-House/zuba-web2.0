import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema(
  {
    ownerUser: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Owner user is required']
      // Note: unique index is created separately to ensure sparse: true works correctly
    },
    storeName: { 
      type: String, 
      required: true,
      trim: true
    },
    storeSlug: { 
      type: String, 
      unique: true, 
      sparse: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Store slug can only contain lowercase letters, numbers, and hyphens']
    },
    logoUrl: {
      type: String,
      default: null
    },
    bannerUrl: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    shortDescription: {
      type: String,
      default: ''
    },
    categories: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category' 
    }],
    country: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    addressLine1: {
      type: String,
      default: ''
    },
    addressLine2: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    whatsapp: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true
    },
    // Commission settings (override global, optional)
    commissionType: {
      type: String,
      enum: ['PERCENT', 'FLAT'],
      default: 'PERCENT'
    },
    commissionValue: { 
      type: Number, 
      default: 15,
      min: 0,
      max: 100 // For percentage
    },
    // Payout / banking info
    payoutMethod: {
      type: String,
      enum: ['NONE', 'BANK_TRANSFER', 'PAYPAL', 'MOMO'],
      default: 'NONE'
    },
    payoutDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      routingNumber: String,
      paypalEmail: String,
      momoNumber: String,
      momoProvider: String
    },
    // SEO
    seoTitle: {
      type: String,
      default: ''
    },
    seoDescription: {
      type: String,
      default: ''
    },
    seoKeywords: [String],
    // Stats & balances
    totalSales: { 
      type: Number, 
      default: 0,
      min: 0
    },
    totalEarnings: { 
      type: Number, 
      default: 0,
      min: 0
    },
    availableBalance: { 
      type: Number, 
      default: 0,
      min: 0
    },
    pendingBalance: { 
      type: Number, 
      default: 0,
      min: 0
    },
    withdrawnAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Settings
    shippingPolicy: {
      type: String,
      default: ''
    },
    returnPolicy: {
      type: String,
      default: ''
    },
    handlingTimeDays: { 
      type: Number, 
      default: 2,
      min: 0
    },
    isFeatured: { 
      type: Boolean, 
      default: false 
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    // Store verification
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDate: {
      type: Date,
      default: null
    },
    // Social links
    socialLinks: {
      website: String,
      instagram: String,
      facebook: String,
      twitter: String,
      tiktok: String,
      youtube: String
    },
    // Store stats
    stats: {
      totalProducts: {
        type: Number,
        default: 0
      },
      publishedProducts: {
        type: Number,
        default: 0
      },
      totalOrders: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalReviews: {
        type: Number,
        default: 0
      }
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for performance
VendorSchema.index({ status: 1, isFeatured: 1 });
VendorSchema.index({ 'stats.totalProducts': -1 });
VendorSchema.index({ totalSales: -1 });

// Unique sparse index on ownerUser (allows null but ensures uniqueness for non-null values)
// This must be created separately to ensure sparse: true works correctly
VendorSchema.index({ ownerUser: 1 }, { unique: true, sparse: true });

// Virtual for checking if vendor can withdraw
VendorSchema.virtual('canWithdraw').get(function() {
  return this.availableBalance > 0 && 
         this.payoutMethod !== 'NONE' && 
         this.status === 'APPROVED';
});

// Method to update balance (safe atomic operation)
VendorSchema.methods.updateBalance = async function(amount, type = 'EARNING') {
  if (type === 'EARNING') {
    this.totalEarnings += amount;
    this.availableBalance += amount;
  } else if (type === 'WITHDRAWAL') {
    if (amount > this.availableBalance) {
      throw new Error('Insufficient balance');
    }
    this.availableBalance -= amount;
    this.withdrawnAmount += amount;
  } else if (type === 'PENDING') {
    this.pendingBalance += amount;
  }
  await this.save();
};

// Check if model already exists to prevent redefinition
const VendorModel = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

export default VendorModel;

