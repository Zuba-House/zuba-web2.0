import mongoose from 'mongoose';

/**
 * Subscription Plan Model
 * WooCommerce-style vendor subscription tiers
 * 5 Tiers: Free, Bronze, Silver, Gold, Platinum
 */

const subscriptionPlanSchema = new mongoose.Schema({
  // ═══════════════════════════════════════════════════════
  // 🏷️ PLAN IDENTIFICATION
  // ═══════════════════════════════════════════════════════
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Free', 'Bronze', 'Silver', 'Gold', 'Platinum']
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  shortDescription: {
    type: String,
    maxlength: 150
  },

  // ═══════════════════════════════════════════════════════
  // 💰 PRICING
  // ═══════════════════════════════════════════════════════
  pricing: {
    monthly: {
      type: Number,
      default: 0,
      min: 0
    },
    yearly: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Yearly discount percentage
  yearlyDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // ═══════════════════════════════════════════════════════
  // 📊 PLAN LIMITS
  // ═══════════════════════════════════════════════════════
  limits: {
    // Product limits
    maxProducts: {
      type: Number,
      default: 50 // Free tier default
    },
    maxImagesPerProduct: {
      type: Number,
      default: 3
    },
    maxCategories: {
      type: Number,
      default: 5
    },
    
    // Storage limits (in MB)
    storageLimit: {
      type: Number,
      default: 500 // 500MB for free tier
    },
    
    // Order limits (-1 = unlimited)
    maxOrders: {
      type: Number,
      default: -1
    },
    
    // Staff accounts
    maxStaffAccounts: {
      type: Number,
      default: 0
    }
  },

  // ═══════════════════════════════════════════════════════
  // 💸 COMMISSION SETTINGS
  // ═══════════════════════════════════════════════════════
  commission: {
    rate: {
      type: Number,
      required: true,
      default: 15, // 15% for free tier
      min: 0,
      max: 100
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  },

  // ═══════════════════════════════════════════════════════
  // ✅ FEATURES INCLUDED
  // ═══════════════════════════════════════════════════════
  features: {
    // Basic Features (all tiers)
    basicDashboard: { type: Boolean, default: true },
    productManagement: { type: Boolean, default: true },
    orderManagement: { type: Boolean, default: true },
    basicReports: { type: Boolean, default: true },
    
    // Advanced Features
    advancedAnalytics: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false },
    removeBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    bulkOperations: { type: Boolean, default: false },
    exportData: { type: Boolean, default: false },
    
    // Marketing Features
    promotions: { type: Boolean, default: false },
    couponCodes: { type: Boolean, default: false },
    emailMarketing: { type: Boolean, default: false },
    seoTools: { type: Boolean, default: false },
    socialMediaIntegration: { type: Boolean, default: false },
    featuredProducts: { type: Boolean, default: false },
    
    // Support Features
    emailSupport: { type: Boolean, default: true },
    chatSupport: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    phoneSupport: { type: Boolean, default: false },
    dedicatedManager: { type: Boolean, default: false },
    
    // Integration Features
    shippingIntegration: { type: Boolean, default: false },
    paymentGatewayOptions: { type: Boolean, default: false },
    inventorySync: { type: Boolean, default: false },
    multiWarehouse: { type: Boolean, default: false },
    
    // Additional Features
    variableProducts: { type: Boolean, default: true },
    digitalProducts: { type: Boolean, default: false },
    subscriptionProducts: { type: Boolean, default: false },
    auctionProducts: { type: Boolean, default: false }
  },

  // ═══════════════════════════════════════════════════════
  // 🎨 DISPLAY SETTINGS
  // ═══════════════════════════════════════════════════════
  badge: {
    icon: {
      type: String,
      default: '🏷️'
    },
    color: {
      type: String,
      default: '#6c757d'
    },
    backgroundColor: {
      type: String,
      default: '#f8f9fa'
    },
    text: String
  },
  
  // Display order in plan listing
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Highlighting
  isPopular: {
    type: Boolean,
    default: false
  },
  
  isRecommended: {
    type: Boolean,
    default: false
  },
  
  // Custom highlight text
  highlightText: {
    type: String,
    default: ''
  },

  // ═══════════════════════════════════════════════════════
  // ⚙️ PLAN SETTINGS
  // ═══════════════════════════════════════════════════════
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Trial period (days)
  trialDays: {
    type: Number,
    default: 0
  },
  
  // Grace period after expiry (days)
  gracePeriodDays: {
    type: Number,
    default: 7
  },
  
  // Can downgrade to this plan
  allowDowngrade: {
    type: Boolean,
    default: true
  },
  
  // Can upgrade from this plan
  allowUpgrade: {
    type: Boolean,
    default: true
  },

  // ═══════════════════════════════════════════════════════
  // 📋 FEATURE LIST (for display)
  // ═══════════════════════════════════════════════════════
  featureList: [{
    text: String,
    included: {
      type: Boolean,
      default: true
    },
    highlight: {
      type: Boolean,
      default: false
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
// Note: name and slug already have unique: true which creates indexes automatically
subscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });
subscriptionPlanSchema.index({ 'pricing.monthly': 1 });

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Get all active plans sorted by display order
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1 });
};

// Get default plan
subscriptionPlanSchema.statics.getDefaultPlan = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Get plan by name
subscriptionPlanSchema.statics.getPlanByName = function(name) {
  return this.findOne({ name, isActive: true });
};

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
subscriptionPlanSchema.virtual('isFree').get(function() {
  return this.pricing.monthly === 0;
});

subscriptionPlanSchema.virtual('yearlySavings').get(function() {
  const monthlyTotal = this.pricing.monthly * 12;
  return monthlyTotal - this.pricing.yearly;
});

const SubscriptionPlanModel = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlanModel;

