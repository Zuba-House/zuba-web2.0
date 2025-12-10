import mongoose from 'mongoose';

/**
 * Enhanced Vendor Model - WooCommerce Style
 * Supports subscription tiers, KYC verification, performance scoring, and more
 */

const VendorSchema = new mongoose.Schema({
  // ═══════════════════════════════════════════════════════
  // 🆔 BASIC IDENTIFICATION
  // ═══════════════════════════════════════════════════════
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    sparse: true
  },

  // Unique vendor code (auto-generated)
  vendorCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
    // Format: ZUBA-V-000001
  },

  // ═══════════════════════════════════════════════════════
  // 📊 VENDOR STATUS
  // ═══════════════════════════════════════════════════════
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'inactive', 'banned'],
    default: 'pending',
    required: true
  },

  // Status change history
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ═══════════════════════════════════════════════════════
  // 🏪 SHOP INFORMATION (Enhanced)
  // ═══════════════════════════════════════════════════════
  shopName: {
    type: String,
    required: false,
    trim: true,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || (v.length >= 3 && v.length <= 50);
      },
      message: 'Shop name must be between 3 and 50 characters'
    }
  },
  shopSlug: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  shopDescription: {
    type: String,
    default: '',
    maxlength: [2000, 'Shop description cannot exceed 2000 characters']
  },
  shopTagline: {
    type: String,
    default: '',
    maxlength: 200
  },
  shopLogo: {
    type: String,
    default: ''
  },
  shopBanner: {
    type: String,
    default: ''
  },
  // Additional shop images (gallery)
  shopImages: [{
    url: String,
    publicId: String,
    caption: String
  }],
  // Shop video (promotional)
  shopVideo: {
    url: String,
    publicId: String,
    thumbnail: String
  },

  // ═══════════════════════════════════════════════════════
  // 🏢 BUSINESS INFORMATION (Enhanced)
  // ═══════════════════════════════════════════════════════
  businessName: {
    type: String,
    required: false,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'cooperative', 'business', 'company'],
    required: false
  },
  industry: {
    type: String,
    enum: [
      'fashion', 'jewelry', 'art', 'home_decor', 'textiles', 'crafts',
      'beauty', 'food', 'electronics', 'books', 'toys', 'health',
      'sports', 'automotive', 'garden', 'pets', 'other'
    ],
    default: 'other'
  },
  yearEstablished: {
    type: Number,
    min: 1900
  },
  taxId: {
    type: String,
    default: '',
    trim: true
  },
  registrationNumber: {
    type: String,
    default: '',
    trim: true
  },
  vatNumber: {
    type: String,
    default: '',
    trim: true
  },
  registeredCountry: {
    type: String,
    default: ''
  },

  // ═══════════════════════════════════════════════════════
  // 📞 CONTACT INFORMATION (Enhanced)
  // ═══════════════════════════════════════════════════════
  phone: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  // Support contact (separate from main contact)
  supportEmail: {
    type: String,
    default: '',
    trim: true
  },
  supportPhone: {
    type: String,
    default: '',
    trim: true
  },
  whatsapp: {
    type: String,
    default: '',
    trim: true
  },

  // ═══════════════════════════════════════════════════════
  // 📍 ADDRESSES (Multiple)
  // ═══════════════════════════════════════════════════════
  // Primary business address
  address: {
    street: { type: String, default: '' },
    unit: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
    latitude: Number,
    longitude: Number
  },
  // Warehouse/Fulfillment address
  warehouseAddress: {
    street: { type: String, default: '' },
    unit: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
    contactPerson: String,
    contactPhone: String
  },
  // Billing address (if different)
  billingAddress: {
    street: { type: String, default: '' },
    unit: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  // Additional pickup locations
  additionalLocations: [{
    name: String,
    street: String,
    unit: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    contactPerson: String,
    contactPhone: String,
    isActive: { type: Boolean, default: true }
  }],

  // ═══════════════════════════════════════════════════════
  // 💳 BANKING INFORMATION (Enhanced)
  // ═══════════════════════════════════════════════════════
  bankAccount: {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    branchName: { type: String, default: '' },
    routingNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
    swiftCode: { type: String, default: '' },
    bankCountry: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date
  },
  // Alternative payment methods
  paypalEmail: { type: String, default: '' },
  stripeAccountId: { type: String, default: '' },
  mobileMoneyNumber: { type: String, default: '' },
  // Backup bank accounts
  backupBankAccounts: [{
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    currency: String,
    isActive: { type: Boolean, default: false }
  }],

  // ═══════════════════════════════════════════════════════
  // 🔐 VERIFICATION & KYC (Enhanced)
  // ═══════════════════════════════════════════════════════
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date,
    default: null
  },
  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,
  // Phone Verification
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: Date,
  // Identity Verification (KYC Level 1)
  identityVerified: {
    type: Boolean,
    default: false
  },
  identityVerifiedAt: Date,
  identityDocuments: [{
    documentType: {
      type: String,
      enum: ['passport', 'drivers_license', 'national_id', 'residence_permit']
    },
    documentNumber: String,
    frontImage: String,
    backImage: String,
    expiryDate: Date,
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String
  }],
  // Business Verification (KYC Level 2)
  businessVerified: {
    type: Boolean,
    default: false
  },
  businessVerifiedAt: Date,
  verificationDocuments: [{
    type: { type: String, enum: ['id', 'business_license', 'tax_certificate', 'bank_statement', 'utility_bill', 'other'] },
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String
  }],
  // Bank Account Verification
  bankVerified: {
    type: Boolean,
    default: false
  },
  bankVerifiedAt: Date,
  // Overall Verification Level
  verificationLevel: {
    type: String,
    enum: ['none', 'basic', 'intermediate', 'advanced', 'premium'],
    default: 'none'
  },
  verificationBadge: {
    type: String,
    enum: ['none', 'verified', 'trusted', 'premium'],
    default: 'none'
  },
  // OTP
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },

  // ═══════════════════════════════════════════════════════
  // 💎 SUBSCRIPTION TIER
  // ═══════════════════════════════════════════════════════
  subscriptionTier: {
    type: String,
    enum: ['free', 'bronze', 'silver', 'gold', 'platinum'],
    default: 'free'
  },
  subscriptionDetails: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan'
    },
    startDate: Date,
    renewalDate: Date,
    expiryDate: Date,
    isActive: { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: true },
    paymentMethod: String,
    transactionId: String,
    // Trial period
    isTrialActive: { type: Boolean, default: false },
    trialEndDate: Date
  },

  // ═══════════════════════════════════════════════════════
  // 💸 COMMISSION SETTINGS (Enhanced)
  // ═══════════════════════════════════════════════════════
  // Commission rate (as percentage 0-100, NOT 0-1)
  commissionRate: {
    type: Number,
    default: 12, // 12% default commission
    min: 0,
    max: 100
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  // Category-specific commission rates
  categoryCommissionRates: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    rate: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  }],
  // Special commission rate
  hasSpecialRate: {
    type: Boolean,
    default: false
  },
  specialRateReason: String,
  specialRateExpiry: Date,

  // ═══════════════════════════════════════════════════════
  // 💵 FINANCIAL INFORMATION (Enhanced)
  // ═══════════════════════════════════════════════════════
  earnings: {
    totalEarnings: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    reservedBalance: { type: Number, default: 0, min: 0 }, // For refunds/disputes
    withdrawnAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    minimumWithdrawal: { type: Number, default: 50 }, // $50 minimum
    // Auto-withdrawal settings
    autoWithdrawal: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly'],
        default: 'weekly'
      },
      dayOfWeek: Number, // 0-6 (Sunday-Saturday)
      dayOfMonth: Number, // 1-31
      lastAutoWithdrawal: Date
    },
    // Monthly earnings tracking
    monthlyEarnings: [{
      year: Number,
      month: Number,
      grossSales: Number,
      commission: Number,
      netEarnings: Number,
      ordersCount: Number
    }]
  },

  // ═══════════════════════════════════════════════════════
  // 📈 STATISTICS (Enhanced)
  // ═══════════════════════════════════════════════════════
  stats: {
    // Product Stats
    totalProducts: { type: Number, default: 0, min: 0 },
    publishedProducts: { type: Number, default: 0, min: 0 },
    draftProducts: { type: Number, default: 0, min: 0 },
    outOfStockProducts: { type: Number, default: 0, min: 0 },
    
    // Sales Stats
    totalSales: { type: Number, default: 0, min: 0 },
    thisMonthSales: { type: Number, default: 0, min: 0 },
    lastMonthSales: { type: Number, default: 0, min: 0 },
    
    // Order Stats
    totalOrders: { type: Number, default: 0, min: 0 },
    completedOrders: { type: Number, default: 0, min: 0 },
    pendingOrders: { type: Number, default: 0, min: 0 },
    cancelledOrders: { type: Number, default: 0, min: 0 },
    returnedOrders: { type: Number, default: 0, min: 0 },
    
    // Customer Stats
    totalCustomers: { type: Number, default: 0, min: 0 },
    repeatCustomers: { type: Number, default: 0, min: 0 },
    
    // Rating & Reviews
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    totalRatings: { type: Number, default: 0, min: 0 },
    ratingDistribution: {
      oneStar: { type: Number, default: 0 },
      twoStar: { type: Number, default: 0 },
      threeStar: { type: Number, default: 0 },
      fourStar: { type: Number, default: 0 },
      fiveStar: { type: Number, default: 0 }
    },
    
    // Performance Metrics
    responseRate: { type: Number, default: 0, min: 0, max: 100 },
    responseTime: { type: Number, default: 0 }, // hours
    orderFulfillmentTime: { type: Number, default: 0 }, // hours
    cancellationRate: { type: Number, default: 0, min: 0, max: 100 },
    returnRate: { type: Number, default: 0, min: 0, max: 100 },
    onTimeDeliveryRate: { type: Number, default: 0, min: 0, max: 100 },
    
    // Performance Score (0-100)
    performanceScore: { type: Number, default: 0, min: 0, max: 100 },
    
    // Traffic Stats
    shopViews: { type: Number, default: 0, min: 0 },
    productViews: { type: Number, default: 0, min: 0 }
  },

  // ═══════════════════════════════════════════════════════
  // 📅 APPLICATION INFORMATION
  // ═══════════════════════════════════════════════════════
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date,
    default: null
  },
  rejectionDate: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  suspensionDate: Date,
  suspensionReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastLoginDate: Date,
  lastActivityDate: Date,

  // ═══════════════════════════════════════════════════════
  // ⚙️ SETTINGS (Enhanced)
  // ═══════════════════════════════════════════════════════
  settings: {
    // Store Settings
    storeOpen: { type: Boolean, default: true },
    allowDirectPurchase: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    enableChat: { type: Boolean, default: true },
    
    // Vacation Mode
    vacationMode: {
      enabled: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date,
      message: String
    },
    
    // Inventory Management
    inventoryManagement: {
      enabled: { type: Boolean, default: true },
      lowStockThreshold: { type: Number, default: 5 },
      outOfStockNotification: { type: Boolean, default: true }
    },
    
    // Order Settings
    orderSettings: {
      autoAccept: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      maxOrderValue: Number,
      minOrderValue: Number
    },
    
    // Return Policy
    returnPolicy: {
      acceptReturns: { type: Boolean, default: true },
      returnWindow: { type: Number, default: 30 }, // days
      returnShippingPaidBy: {
        type: String,
        enum: ['vendor', 'customer', 'shared'],
        default: 'customer'
      },
      policyText: String
    },
    
    // Notifications
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true },
      newOrderAlert: { type: Boolean, default: true },
      lowStockAlert: { type: Boolean, default: true },
      reviewAlert: { type: Boolean, default: true },
      withdrawalAlert: { type: Boolean, default: true }
    },
    
    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String]
    }
  },

  // ═══════════════════════════════════════════════════════
  // 🌐 SOCIAL LINKS (Enhanced)
  // ═══════════════════════════════════════════════════════
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    pinterest: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },

  // ═══════════════════════════════════════════════════════
  // 🎯 FEATURES (Based on subscription)
  // ═══════════════════════════════════════════════════════
  features: {
    canAddProducts: { type: Boolean, default: true },
    maxProducts: { type: Number, default: 50 },
    canUsePromotions: { type: Boolean, default: false },
    canUseCoupons: { type: Boolean, default: false },
    canUseAdvancedAnalytics: { type: Boolean, default: false },
    canUseCustomDomain: { type: Boolean, default: false },
    canRemoveBranding: { type: Boolean, default: false },
    canUseBulkOperations: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    dedicatedAccountManager: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    storageLimit: { type: Number, default: 500 } // MB
  },

  // ═══════════════════════════════════════════════════════
  // 🚚 SHIPPING SETTINGS
  // ═══════════════════════════════════════════════════════
  shipping: {
    provider: {
      type: String,
      enum: ['platform', 'self', 'easypost', 'canada_post', 'ups', 'fedex', 'dhl'],
      default: 'platform'
    },
    processingTime: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 3 },
      unit: {
        type: String,
        enum: ['hours', 'days'],
        default: 'days'
      }
    },
    defaultPackaging: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch'],
        default: 'cm'
      }
    }
  },

  // ═══════════════════════════════════════════════════════
  // 📝 ADDITIONAL
  // ═══════════════════════════════════════════════════════
  notes: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  // Admin notes history
  adminNotesHistory: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ═══════════════════════════════════════════════════════
  // 🔑 ACCOUNT SETUP
  // ═══════════════════════════════════════════════════════
  setupToken: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  setupTokenExpires: {
    type: Date,
    default: null
  },
  accountCreated: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 🔧 PRE-SAVE MIDDLEWARE
// ═══════════════════════════════════════════════════════
VendorSchema.pre('save', async function(next) {
  try {
    // Generate vendor code if not exists (with timestamp to prevent race conditions)
    if (!this.vendorCode) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.vendorCode = `ZUBA-V-${timestamp}${random}`;
    }
    
    // Generate shop slug from shop name
    if (this.shopName && !this.shopSlug) {
      this.shopSlug = this.shopName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Calculate performance score (only if stats modified)
    if (this.isModified('stats') && typeof this.calculatePerformanceScore === 'function') {
      this.calculatePerformanceScore();
    }
    
    // Set commission rate based on subscription tier (if not custom)
    if (this.isModified('subscriptionTier') && !this.hasSpecialRate) {
      const tierCommission = {
        free: 15,
        bronze: 12,
        silver: 10,
        gold: 8,
        platinum: 5
      };
      this.commissionRate = tierCommission[this.subscriptionTier] || 12;
    }
    
    // Set features based on subscription tier
    if (this.isModified('subscriptionTier')) {
      const tierFeatures = {
        free: { maxProducts: 50, storageLimit: 500, canUsePromotions: false, canUseCoupons: false, canUseAdvancedAnalytics: false },
        bronze: { maxProducts: 200, storageLimit: 2048, canUsePromotions: true, canUseCoupons: true, canUseAdvancedAnalytics: false },
        silver: { maxProducts: 500, storageLimit: 10240, canUsePromotions: true, canUseCoupons: true, canUseAdvancedAnalytics: true },
        gold: { maxProducts: 2000, storageLimit: 51200, canUsePromotions: true, canUseCoupons: true, canUseAdvancedAnalytics: true, apiAccess: true },
        platinum: { maxProducts: -1, storageLimit: 204800, canUsePromotions: true, canUseCoupons: true, canUseAdvancedAnalytics: true, apiAccess: true, dedicatedAccountManager: true, prioritySupport: true }
      };
      const features = tierFeatures[this.subscriptionTier] || tierFeatures.free;
      if (this.features) {
        Object.assign(this.features, features);
      }
    }
    
    next();
  } catch (error) {
    console.error('Vendor pre-save error:', error);
    next(error);
  }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
VendorSchema.index({ status: 1 });
VendorSchema.index({ isVerified: 1 });
VendorSchema.index({ subscriptionTier: 1 });
VendorSchema.index({ 'verification.verificationLevel': 1 });
VendorSchema.index({ 'stats.performanceScore': -1 });
VendorSchema.index({ 'stats.averageRating': -1 });
VendorSchema.index({ 'earnings.availableBalance': -1 });
VendorSchema.index({ createdAt: -1 });
VendorSchema.index({ email: 1 });
// Note: vendorCode already has unique: true which creates an index automatically

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
VendorSchema.virtual('hasVerificationBadge').get(function() {
  return this.isVerified && this.status === 'approved';
});

VendorSchema.virtual('isActive').get(function() {
  return this.status === 'approved' && this.settings?.storeOpen !== false;
});

VendorSchema.virtual('isOnVacation').get(function() {
  if (!this.settings?.vacationMode?.enabled) return false;
  const now = new Date();
  const start = this.settings.vacationMode.startDate;
  const end = this.settings.vacationMode.endDate;
  return start && end && now >= start && now <= end;
});

VendorSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'vendorId'
});

VendorSchema.virtual('reviews', {
  ref: 'VendorReview',
  localField: '_id',
  foreignField: 'vendorId'
});

VendorSchema.virtual('subscriptionPlan', {
  ref: 'SubscriptionPlan',
  localField: 'subscriptionDetails.planId',
  foreignField: '_id',
  justOne: true
});

// ═══════════════════════════════════════════════════════
// 🔧 INSTANCE METHODS
// ═══════════════════════════════════════════════════════

// Check if vendor can withdraw
VendorSchema.methods.canWithdraw = function(amount) {
  return this.status === 'approved' && 
         this.earnings.availableBalance >= amount && 
         amount >= (this.earnings.minimumWithdrawal || 50);
};

// Add earnings
VendorSchema.methods.addEarnings = function(amount) {
  this.earnings.totalEarnings += amount;
  this.earnings.pendingBalance += amount;
  return this.save();
};

// Approve/clear pending earnings
VendorSchema.methods.approveEarnings = function(amount = null) {
  const toApprove = amount || this.earnings.pendingBalance;
  this.earnings.availableBalance += toApprove;
  this.earnings.pendingBalance -= toApprove;
  return this.save();
};

// Withdraw funds
VendorSchema.methods.withdraw = function(amount) {
  if (!this.canWithdraw(amount)) {
    throw new Error('Cannot withdraw this amount');
  }
  this.earnings.availableBalance -= amount;
  this.earnings.withdrawnAmount += amount;
  return this.save();
};

// Reserve funds (for potential refunds)
VendorSchema.methods.reserveFunds = function(amount) {
  if (this.earnings.availableBalance < amount) {
    throw new Error('Insufficient available balance');
  }
  this.earnings.availableBalance -= amount;
  this.earnings.reservedBalance = (this.earnings.reservedBalance || 0) + amount;
  return this.save();
};

// Release reserved funds
VendorSchema.methods.releaseReservedFunds = function(amount) {
  if ((this.earnings.reservedBalance || 0) < amount) {
    throw new Error('Insufficient reserved balance');
  }
  this.earnings.reservedBalance -= amount;
  this.earnings.availableBalance += amount;
  return this.save();
};

// Calculate performance score
VendorSchema.methods.calculatePerformanceScore = function() {
  const stats = this.stats;
  
  const weights = {
    rating: 0.25,
    responseRate: 0.20,
    fulfillmentTime: 0.15,
    onTimeDelivery: 0.15,
    cancellationRate: 0.10,
    returnRate: 0.10,
    completionRate: 0.05
  };
  
  const ratingScore = (stats.averageRating / 5) * 100;
  const responseScore = stats.responseRate || 0;
  const fulfillmentScore = Math.max(0, 100 - ((stats.orderFulfillmentTime || 0) / 72) * 100);
  const onTimeScore = stats.onTimeDeliveryRate || 0;
  const cancellationScore = 100 - (stats.cancellationRate || 0);
  const returnScore = 100 - (stats.returnRate || 0);
  const completionScore = stats.totalOrders > 0 
    ? ((stats.completedOrders || 0) / stats.totalOrders) * 100 
    : 0;
  
  this.stats.performanceScore = Math.round(
    (ratingScore * weights.rating) +
    (responseScore * weights.responseRate) +
    (fulfillmentScore * weights.fulfillmentTime) +
    (onTimeScore * weights.onTimeDelivery) +
    (cancellationScore * weights.cancellationRate) +
    (returnScore * weights.returnRate) +
    (completionScore * weights.completionRate)
  );
  
  return this.stats.performanceScore;
};

// Get vendor level based on performance score
VendorSchema.methods.getVendorLevel = function() {
  const score = this.stats.performanceScore;
  if (score >= 90) return { level: 'elite', badge: '⭐⭐⭐⭐⭐', label: 'Elite Seller' };
  if (score >= 80) return { level: 'top', badge: '⭐⭐⭐⭐', label: 'Top Seller' };
  if (score >= 70) return { level: 'good', badge: '⭐⭐⭐', label: 'Good Seller' };
  if (score >= 60) return { level: 'average', badge: '⭐⭐', label: 'Average Seller' };
  return { level: 'new', badge: '⭐', label: 'New Seller' };
};

// Update stats from orders
VendorSchema.methods.updateStats = async function() {
  const ProductModel = mongoose.model('Product');
  const OrderModel = mongoose.model('Order');
  
  // Update product counts
  const productStats = await ProductModel.aggregate([
    { $match: { vendorId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  this.stats.totalProducts = await ProductModel.countDocuments({ vendorId: this._id });
  this.stats.publishedProducts = 0;
  this.stats.draftProducts = 0;
  
  productStats.forEach(stat => {
    if (stat._id === 'published') this.stats.publishedProducts = stat.count;
    if (stat._id === 'draft') this.stats.draftProducts = stat.count;
  });
  
  // Count out of stock products
  this.stats.outOfStockProducts = await ProductModel.countDocuments({ 
    vendorId: this._id,
    $or: [
      { stockStatus: 'out_of_stock' },
      { 'inventory.stockStatus': 'out_of_stock' },
      { countInStock: 0 }
    ]
  });
  
  // Update order stats
  const orderStats = await OrderModel.aggregate([
    { $match: { 'products.vendorId': this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  this.stats.totalOrders = await OrderModel.countDocuments({ 'products.vendorId': this._id });
  
  orderStats.forEach(stat => {
    const status = stat._id?.toLowerCase() || '';
    if (status === 'delivered' || status === 'completed') this.stats.completedOrders = stat.count;
    if (status === 'pending' || status === 'received') this.stats.pendingOrders = stat.count;
    if (status === 'cancelled') this.stats.cancelledOrders = stat.count;
  });
  
  // Calculate rates
  if (this.stats.totalOrders > 0) {
    this.stats.cancellationRate = (this.stats.cancelledOrders / this.stats.totalOrders) * 100;
    this.stats.returnRate = (this.stats.returnedOrders / this.stats.totalOrders) * 100;
  }
  
  // Calculate performance score
  this.calculatePerformanceScore();
  
  await this.save();
  return this.stats;
};

// Change status with history tracking
VendorSchema.methods.changeStatus = async function(newStatus, reason = '', changedBy = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.statusHistory = this.statusHistory || [];
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    reason,
    changedAt: new Date()
  });
  
  // Set date fields
  if (newStatus === 'approved' && oldStatus !== 'approved') {
    this.approvalDate = new Date();
  }
  if (newStatus === 'rejected') {
    this.rejectionDate = new Date();
    this.rejectionReason = reason;
  }
  if (newStatus === 'suspended') {
    this.suspensionDate = new Date();
    this.suspensionReason = reason;
  }
  
  return await this.save();
};

// Add admin note
VendorSchema.methods.addAdminNote = async function(note, addedBy) {
  this.adminNotesHistory = this.adminNotesHistory || [];
  this.adminNotesHistory.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  this.adminNotes = note; // Also update the main field
  return await this.save();
};

// Check subscription status
VendorSchema.methods.isSubscriptionActive = function() {
  if (this.subscriptionTier === 'free') return true;
  if (!this.subscriptionDetails) return false;
  
  const now = new Date();
  if (this.subscriptionDetails.isTrialActive && this.subscriptionDetails.trialEndDate > now) {
    return true;
  }
  
  return this.subscriptionDetails.isActive && 
         (!this.subscriptionDetails.expiryDate || this.subscriptionDetails.expiryDate > now);
};

// Upgrade subscription
VendorSchema.methods.upgradeSubscription = async function(tier, planId = null, paymentDetails = {}) {
  this.subscriptionTier = tier;
  this.subscriptionDetails = {
    ...this.subscriptionDetails,
    planId,
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    ...paymentDetails
  };
  return await this.save();
};

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Get top vendors by performance
VendorSchema.statics.getTopVendors = function(limit = 10) {
  return this.find({ status: 'approved' })
    .sort({ 'stats.performanceScore': -1 })
    .limit(limit)
    .select('shopName shopSlug shopLogo stats.averageRating stats.performanceScore subscriptionTier');
};

// Get vendors by subscription tier
VendorSchema.statics.getBySubscriptionTier = function(tier) {
  return this.find({ subscriptionTier: tier, status: 'approved' });
};

// Get featured vendors
VendorSchema.statics.getFeaturedVendors = function(limit = 6) {
  return this.find({ 
    status: 'approved',
    'stats.performanceScore': { $gte: 80 },
    subscriptionTier: { $in: ['gold', 'platinum'] }
  })
    .sort({ 'stats.averageRating': -1 })
    .limit(limit)
    .select('shopName shopSlug shopLogo shopTagline stats.averageRating stats.totalReviews');
};

// Search vendors
VendorSchema.statics.searchVendors = function(query, options = {}) {
  const { limit = 20, page = 1, industry, tier } = options;
  
  const searchQuery = {
    status: 'approved',
    $or: [
      { shopName: { $regex: query, $options: 'i' } },
      { shopDescription: { $regex: query, $options: 'i' } },
      { shopTagline: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (industry) searchQuery.industry = industry;
  if (tier) searchQuery.subscriptionTier = tier;
  
  return this.find(searchQuery)
    .sort({ 'stats.performanceScore': -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

const VendorModel = mongoose.model('Vendor', VendorSchema);

export default VendorModel;

