import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  // ========== USER REFERENCE ==========
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for guest applications
    default: null,
    sparse: true // Sparse index: only enforces uniqueness for non-null values
  },

  // ========== VENDOR STATUS ==========
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'inactive'],
    default: 'pending',
    required: true
  },

  // ========== SHOP INFORMATION ==========
  shopName: {
    type: String,
    required: false, // Will be required on final application submission
    trim: true,
    unique: true,
    sparse: true, // Allow multiple null values
    lowercase: true,
    minlength: [3, 'Shop name must be at least 3 characters'],
    maxlength: [50, 'Shop name cannot exceed 50 characters']
  },
  shopSlug: {
    type: String,
    required: false, // Will be generated from shopName if not provided
    unique: true,
    sparse: true, // Allow null values for uniqueness
    lowercase: true,
    trim: true
  },
  shopDescription: {
    type: String,
    default: '',
    maxlength: [1000, 'Shop description cannot exceed 1000 characters']
  },
  shopLogo: {
    type: String,
    default: ''
  },
  shopBanner: {
    type: String,
    default: ''
  },

  // ========== BUSINESS INFORMATION ==========
  businessName: {
    type: String,
    required: false, // Will be required on final application submission
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'business', 'company'],
    required: false // Will be required on final application submission
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

  // ========== CONTACT INFORMATION ==========
  phone: {
    type: String,
    required: false, // Will be required on final application submission
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

  // ========== ADDRESS INFORMATION ==========
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },

  // ========== BANKING INFORMATION (for withdrawals) ==========
  bankAccount: {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    routingNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
    swiftCode: { type: String, default: '' }
  },

  // ========== VERIFICATION ==========
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date,
    default: null
  },
  verificationDocuments: [{
    type: { type: String, enum: ['id', 'business_license', 'tax_certificate', 'other'] },
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // ========== COMMISSION SETTINGS ==========
  commissionRate: {
    type: Number,
    default: 0.12, // 12% default commission
    min: 0,
    max: 1
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },

  // ========== FINANCIAL INFORMATION ==========
  earnings: {
    totalEarnings: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    withdrawnAmount: { type: Number, default: 0, min: 0 }
  },

  // ========== STATISTICS ==========
  stats: {
    totalProducts: { type: Number, default: 0, min: 0 },
    totalSales: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 }
  },

  // ========== APPLICATION INFORMATION ==========
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
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // ========== SETTINGS ==========
  settings: {
    allowDirectPurchase: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    enableChat: { type: Boolean, default: true }
  },

  // ========== SOCIAL LINKS ==========
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },

  // ========== ADDITIONAL ==========
  notes: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },

  // ========== ACCOUNT SETUP ==========
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

// Generate shop slug from shop name
VendorSchema.pre('save', function(next) {
  // Always generate shopSlug from shopName if not already set
  if (this.shopName && !this.shopSlug) {
    this.shopSlug = this.shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  // Ensure shopSlug is set (required for validation)
  if (!this.shopSlug && this.shopName) {
    this.shopSlug = this.shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes
// Note: userId and shopSlug already have unique: true, which creates indexes automatically
// Only add indexes for fields that don't have unique constraint
VendorSchema.index({ status: 1 });
VendorSchema.index({ isVerified: 1 });
VendorSchema.index({ 'earnings.availableBalance': -1 });

// Virtual for verification badge
VendorSchema.virtual('hasVerificationBadge').get(function() {
  return this.isVerified && this.status === 'approved';
});

// Methods
VendorSchema.methods.canWithdraw = function(amount) {
  return this.status === 'approved' && 
         this.earnings.availableBalance >= amount && 
         amount > 0;
};

VendorSchema.methods.addEarnings = function(amount) {
  this.earnings.totalEarnings += amount;
  this.earnings.pendingBalance += amount;
  return this.save();
};

VendorSchema.methods.approveEarnings = function() {
  this.earnings.availableBalance += this.earnings.pendingBalance;
  this.earnings.pendingBalance = 0;
  return this.save();
};

VendorSchema.methods.withdraw = function(amount) {
  if (!this.canWithdraw(amount)) {
    throw new Error('Cannot withdraw this amount');
  }
  this.earnings.availableBalance -= amount;
  this.earnings.withdrawnAmount += amount;
  return this.save();
};

const VendorModel = mongoose.model('Vendor', VendorSchema);

export default VendorModel;

