import mongoose from 'mongoose';

/**
 * Vendor Analytics Model
 * Tracks vendor performance, sales, traffic, and customer data
 * WooCommerce-style analytics and reporting
 */

const vendorAnalyticsSchema = new mongoose.Schema({
  // ═══════════════════════════════════════════════════════
  // 🏪 VENDOR REFERENCE
  // ═══════════════════════════════════════════════════════
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },

  // ═══════════════════════════════════════════════════════
  // 📅 TIME PERIOD
  // ═══════════════════════════════════════════════════════
  period: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    week: {
      type: Number,
      min: 1,
      max: 53
    },
    day: {
      type: Number,
      min: 1,
      max: 31
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  // ═══════════════════════════════════════════════════════
  // 💰 SALES METRICS
  // ═══════════════════════════════════════════════════════
  sales: {
    // Revenue
    grossRevenue: {
      type: Number,
      default: 0
    },
    netRevenue: {
      type: Number,
      default: 0
    }, // After commission and fees
    refunds: {
      type: Number,
      default: 0
    },
    discounts: {
      type: Number,
      default: 0
    },
    shipping: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    
    // Orders
    totalOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    pendingOrders: {
      type: Number,
      default: 0
    },
    processingOrders: {
      type: Number,
      default: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0
    },
    refundedOrders: {
      type: Number,
      default: 0
    },
    
    // Items
    totalItems: {
      type: Number,
      default: 0
    },
    averageItemsPerOrder: {
      type: Number,
      default: 0
    },
    
    // Order values
    averageOrderValue: {
      type: Number,
      default: 0
    },
    highestOrderValue: {
      type: Number,
      default: 0
    },
    lowestOrderValue: {
      type: Number,
      default: 0
    },
    
    // Conversion
    conversionRate: {
      type: Number,
      default: 0
    }, // % of visitors who made a purchase
    
    // Order status breakdown
    ordersByStatus: {
      received: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      processing: { type: Number, default: 0 },
      shipped: { type: Number, default: 0 },
      outForDelivery: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      returned: { type: Number, default: 0 }
    }
  },

  // ═══════════════════════════════════════════════════════
  // 📦 PRODUCT METRICS
  // ═══════════════════════════════════════════════════════
  products: {
    // Counts
    totalProducts: {
      type: Number,
      default: 0
    },
    publishedProducts: {
      type: Number,
      default: 0
    },
    draftProducts: {
      type: Number,
      default: 0
    },
    outOfStockProducts: {
      type: Number,
      default: 0
    },
    lowStockProducts: {
      type: Number,
      default: 0
    },
    
    // Views
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    viewToCartRate: {
      type: Number,
      default: 0
    }, // % added to cart
    viewToSaleRate: {
      type: Number,
      default: 0
    }, // % that resulted in sale
    
    // Top products
    topSellingProducts: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      productSku: String,
      unitsSold: Number,
      revenue: Number,
      views: Number
    }],
    
    // Top categories
    topCategories: [{
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      },
      categoryName: String,
      unitsSold: Number,
      revenue: Number
    }],
    
    // New products added this period
    newProducts: {
      type: Number,
      default: 0
    }
  },

  // ═══════════════════════════════════════════════════════
  // 👥 CUSTOMER METRICS
  // ═══════════════════════════════════════════════════════
  customers: {
    // Counts
    totalCustomers: {
      type: Number,
      default: 0
    },
    newCustomers: {
      type: Number,
      default: 0
    },
    returningCustomers: {
      type: Number,
      default: 0
    },
    
    // Retention
    customerRetentionRate: {
      type: Number,
      default: 0
    },
    repeatPurchaseRate: {
      type: Number,
      default: 0
    },
    
    // Customer value
    averageCustomerValue: {
      type: Number,
      default: 0
    },
    customerLifetimeValue: {
      type: Number,
      default: 0
    },
    
    // Demographics
    customersByCountry: [{
      countryCode: String,
      countryName: String,
      count: Number,
      revenue: Number,
      percentage: Number
    }],
    
    customersByCity: [{
      city: String,
      country: String,
      count: Number,
      revenue: Number
    }],
    
    // Top customers
    topCustomers: [{
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      customerName: String,
      totalSpent: Number,
      orderCount: Number,
      averageOrderValue: Number
    }]
  },

  // ═══════════════════════════════════════════════════════
  // 🌐 TRAFFIC METRICS
  // ═══════════════════════════════════════════════════════
  traffic: {
    // Views
    shopViews: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    pageViews: {
      type: Number,
      default: 0
    },
    
    // Engagement
    bounceRate: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    }, // seconds
    pagesPerSession: {
      type: Number,
      default: 0
    },
    
    // Sources
    trafficSources: [{
      source: {
        type: String,
        enum: ['direct', 'search', 'social', 'referral', 'email', 'paid', 'other']
      },
      medium: String,
      campaign: String,
      visitors: Number,
      percentage: Number,
      conversions: Number
    }],
    
    // Social media sources
    socialSources: [{
      platform: {
        type: String,
        enum: ['facebook', 'instagram', 'twitter', 'pinterest', 'tiktok', 'youtube', 'linkedin', 'other']
      },
      visitors: Number,
      conversions: Number
    }],
    
    // Search engines
    searchEngines: [{
      engine: String,
      visitors: Number,
      keywords: [String]
    }],
    
    // Devices
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    
    // Browsers
    browserBreakdown: [{
      browser: String,
      count: Number,
      percentage: Number
    }],
    
    // Countries
    countryBreakdown: [{
      countryCode: String,
      countryName: String,
      visitors: Number,
      percentage: Number
    }]
  },

  // ═══════════════════════════════════════════════════════
  // 💵 FINANCIAL METRICS
  // ═══════════════════════════════════════════════════════
  financials: {
    // Earnings
    grossEarnings: {
      type: Number,
      default: 0
    },
    commission: {
      type: Number,
      default: 0
    },
    fees: {
      type: Number,
      default: 0
    },
    netEarnings: {
      type: Number,
      default: 0
    },
    
    // Payouts
    withdrawals: {
      type: Number,
      default: 0
    },
    pendingEarnings: {
      type: Number,
      default: 0
    },
    availableBalance: {
      type: Number,
      default: 0
    },
    
    // Payment methods used by customers
    paymentMethods: [{
      method: String,
      count: Number,
      revenue: Number,
      percentage: Number
    }],
    
    // Expenses (if vendor tracks them)
    expenses: {
      advertising: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      materials: { type: Number, default: 0 },
      platform: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Profit
    profit: {
      type: Number,
      default: 0
    },
    profitMargin: {
      type: Number,
      default: 0
    }
  },

  // ═══════════════════════════════════════════════════════
  // 📣 MARKETING METRICS
  // ═══════════════════════════════════════════════════════
  marketing: {
    // Promotions
    activePromotions: {
      type: Number,
      default: 0
    },
    totalDiscounts: {
      type: Number,
      default: 0
    },
    couponUsage: {
      type: Number,
      default: 0
    },
    
    // Coupons
    couponsCreated: {
      type: Number,
      default: 0
    },
    couponsUsed: {
      type: Number,
      default: 0
    },
    couponRevenue: {
      type: Number,
      default: 0
    },
    
    // Featured products
    featuredProductViews: {
      type: Number,
      default: 0
    },
    featuredProductSales: {
      type: Number,
      default: 0
    },
    
    // Email (if applicable)
    emailsSent: { type: Number, default: 0 },
    emailOpenRate: { type: Number, default: 0 },
    emailClickRate: { type: Number, default: 0 },
    emailConversions: { type: Number, default: 0 }
  },

  // ═══════════════════════════════════════════════════════
  // ⭐ PERFORMANCE METRICS
  // ═══════════════════════════════════════════════════════
  performance: {
    // Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    newReviews: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    
    // Response rates
    responseRate: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }, // hours
    
    // Fulfillment
    averageFulfillmentTime: {
      type: Number,
      default: 0
    }, // hours
    onTimeDeliveryRate: {
      type: Number,
      default: 0
    },
    
    // Issues
    disputeCount: {
      type: Number,
      default: 0
    },
    disputeRate: {
      type: Number,
      default: 0
    },
    chargebackCount: {
      type: Number,
      default: 0
    },
    
    // Overall score
    performanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // ═══════════════════════════════════════════════════════
  // 📈 COMPARISON DATA
  // ═══════════════════════════════════════════════════════
  comparison: {
    // Growth vs previous period
    revenueGrowth: { type: Number, default: 0 },
    orderGrowth: { type: Number, default: 0 },
    customerGrowth: { type: Number, default: 0 },
    trafficGrowth: { type: Number, default: 0 },
    conversionGrowth: { type: Number, default: 0 },
    
    // Previous period values (for reference)
    previousPeriod: {
      revenue: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      customers: { type: Number, default: 0 },
      visitors: { type: Number, default: 0 }
    }
  },

  // ═══════════════════════════════════════════════════════
  // 🎯 GOALS & TARGETS
  // ═══════════════════════════════════════════════════════
  goals: {
    revenueTarget: { type: Number, default: 0 },
    revenueAchieved: { type: Number, default: 0 },
    ordersTarget: { type: Number, default: 0 },
    ordersAchieved: { type: Number, default: 0 },
    customersTarget: { type: Number, default: 0 },
    customersAchieved: { type: Number, default: 0 }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
vendorAnalyticsSchema.index({ vendorId: 1, 'period.type': 1, 'period.startDate': -1 });
vendorAnalyticsSchema.index({ vendorId: 1, 'period.year': 1, 'period.month': 1 });
vendorAnalyticsSchema.index({ 'period.startDate': -1 });
vendorAnalyticsSchema.index({ 'period.type': 1 });

// Compound unique index to prevent duplicates
vendorAnalyticsSchema.index(
  { vendorId: 1, 'period.type': 1, 'period.year': 1, 'period.month': 1, 'period.day': 1 },
  { unique: true, sparse: true }
);

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Get or create analytics record for a period
vendorAnalyticsSchema.statics.getOrCreatePeriod = async function(vendorId, periodType, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let startDate, endDate;
  const query = { vendorId, 'period.type': periodType, 'period.year': year };
  
  switch (periodType) {
    case 'daily':
      startDate = new Date(year, month - 1, day, 0, 0, 0);
      endDate = new Date(year, month - 1, day, 23, 59, 59);
      query['period.month'] = month;
      query['period.day'] = day;
      break;
      
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      startDate = new Date(weekStart.setHours(0, 0, 0, 0));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59);
      const weekNum = Math.ceil((day + new Date(year, month - 1, 1).getDay()) / 7);
      query['period.week'] = weekNum;
      break;
      
    case 'monthly':
      startDate = new Date(year, month - 1, 1, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59);
      query['period.month'] = month;
      break;
      
    case 'yearly':
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);
      break;
  }
  
  let analytics = await this.findOne(query);
  
  if (!analytics) {
    analytics = new this({
      vendorId,
      period: {
        type: periodType,
        year,
        month: periodType !== 'yearly' ? month : undefined,
        day: periodType === 'daily' ? day : undefined,
        startDate,
        endDate
      }
    });
    await analytics.save();
  }
  
  return analytics;
};

// Get vendor analytics summary
vendorAnalyticsSchema.statics.getVendorSummary = async function(vendorId, startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        'period.startDate': { $gte: startDate },
        'period.endDate': { $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$sales.grossRevenue' },
        totalOrders: { $sum: '$sales.totalOrders' },
        totalCustomers: { $sum: '$customers.newCustomers' },
        totalVisitors: { $sum: '$traffic.uniqueVisitors' },
        avgRating: { $avg: '$performance.averageRating' },
        totalCommission: { $sum: '$financials.commission' },
        netEarnings: { $sum: '$financials.netEarnings' }
      }
    }
  ]);
  
  return result[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalVisitors: 0,
    avgRating: 0,
    totalCommission: 0,
    netEarnings: 0
  };
};

// Get trend data for charts
vendorAnalyticsSchema.statics.getTrendData = async function(vendorId, periodType, count = 12) {
  const results = await this.find({
    vendorId,
    'period.type': periodType
  })
    .sort({ 'period.startDate': -1 })
    .limit(count)
    .select('period sales.grossRevenue sales.totalOrders traffic.uniqueVisitors')
    .lean();
  
  return results.reverse();
};

// Calculate and update comparison data
vendorAnalyticsSchema.statics.updateComparison = async function(analyticsId) {
  const current = await this.findById(analyticsId);
  if (!current) return null;
  
  // Find previous period
  const previousStartDate = new Date(current.period.startDate);
  switch (current.period.type) {
    case 'daily':
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      break;
    case 'weekly':
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      break;
    case 'monthly':
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      break;
    case 'yearly':
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      break;
  }
  
  const previous = await this.findOne({
    vendorId: current.vendorId,
    'period.type': current.period.type,
    'period.startDate': { $lte: previousStartDate },
    'period.endDate': { $gte: previousStartDate }
  });
  
  if (previous) {
    const calcGrowth = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    
    current.comparison = {
      revenueGrowth: calcGrowth(current.sales.grossRevenue, previous.sales.grossRevenue),
      orderGrowth: calcGrowth(current.sales.totalOrders, previous.sales.totalOrders),
      customerGrowth: calcGrowth(current.customers.totalCustomers, previous.customers.totalCustomers),
      trafficGrowth: calcGrowth(current.traffic.uniqueVisitors, previous.traffic.uniqueVisitors),
      previousPeriod: {
        revenue: previous.sales.grossRevenue,
        orders: previous.sales.totalOrders,
        customers: previous.customers.totalCustomers,
        visitors: previous.traffic.uniqueVisitors
      }
    };
    
    await current.save();
  }
  
  return current;
};

// ═══════════════════════════════════════════════════════
// 💡 INSTANCE METHODS
// ═══════════════════════════════════════════════════════

// Increment sale
vendorAnalyticsSchema.methods.recordSale = async function(orderData) {
  this.sales.totalOrders += 1;
  this.sales.totalItems += orderData.itemCount || 1;
  this.sales.grossRevenue += orderData.grossAmount || 0;
  this.sales.netRevenue += orderData.netAmount || 0;
  
  // Update averages
  if (this.sales.totalOrders > 0) {
    this.sales.averageOrderValue = this.sales.grossRevenue / this.sales.totalOrders;
    this.sales.averageItemsPerOrder = this.sales.totalItems / this.sales.totalOrders;
  }
  
  // Update highest/lowest
  if (!this.sales.highestOrderValue || orderData.grossAmount > this.sales.highestOrderValue) {
    this.sales.highestOrderValue = orderData.grossAmount;
  }
  if (!this.sales.lowestOrderValue || orderData.grossAmount < this.sales.lowestOrderValue) {
    this.sales.lowestOrderValue = orderData.grossAmount;
  }
  
  return await this.save();
};

// Record page view
vendorAnalyticsSchema.methods.recordPageView = async function(viewData = {}) {
  this.traffic.pageViews += 1;
  if (viewData.isUnique) {
    this.traffic.uniqueVisitors += 1;
  }
  if (viewData.isShopView) {
    this.traffic.shopViews += 1;
  }
  
  return await this.save();
};

// Record product view
vendorAnalyticsSchema.methods.recordProductView = async function(productId, isUnique = false) {
  this.products.totalViews += 1;
  if (isUnique) {
    this.products.uniqueViews += 1;
  }
  
  return await this.save();
};

// Update customer stats
vendorAnalyticsSchema.methods.recordCustomer = async function(isNew = true) {
  this.customers.totalCustomers += 1;
  if (isNew) {
    this.customers.newCustomers += 1;
  } else {
    this.customers.returningCustomers += 1;
  }
  
  return await this.save();
};

// Calculate performance score
vendorAnalyticsSchema.methods.calculatePerformanceScore = function() {
  const weights = {
    rating: 0.25,
    responseRate: 0.15,
    onTimeDelivery: 0.20,
    disputeRate: 0.15,
    conversionRate: 0.10,
    returnRate: 0.15
  };
  
  const ratingScore = (this.performance.averageRating / 5) * 100;
  const responseScore = this.performance.responseRate;
  const deliveryScore = this.performance.onTimeDeliveryRate;
  const disputeScore = 100 - (this.performance.disputeRate * 10);
  const conversionScore = Math.min(this.sales.conversionRate * 20, 100);
  const returnRate = this.sales.totalOrders > 0 
    ? (this.sales.refundedOrders / this.sales.totalOrders) * 100 
    : 0;
  const returnScore = 100 - returnRate;
  
  this.performance.performanceScore = Math.round(
    (ratingScore * weights.rating) +
    (responseScore * weights.responseRate) +
    (deliveryScore * weights.onTimeDelivery) +
    (Math.max(0, disputeScore) * weights.disputeRate) +
    (conversionScore * weights.conversionRate) +
    (returnScore * weights.returnRate)
  );
  
  return this.performance.performanceScore;
};

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
vendorAnalyticsSchema.virtual('periodLabel').get(function() {
  const p = this.period;
  switch (p.type) {
    case 'daily':
      return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    case 'weekly':
      return `${p.year} Week ${p.week}`;
    case 'monthly':
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[p.month - 1]} ${p.year}`;
    case 'yearly':
      return `${p.year}`;
    default:
      return '';
  }
});

vendorAnalyticsSchema.virtual('goalProgress').get(function() {
  return {
    revenue: this.goals.revenueTarget > 0 ? (this.goals.revenueAchieved / this.goals.revenueTarget) * 100 : 0,
    orders: this.goals.ordersTarget > 0 ? (this.goals.ordersAchieved / this.goals.ordersTarget) * 100 : 0,
    customers: this.goals.customersTarget > 0 ? (this.goals.customersAchieved / this.goals.customersTarget) * 100 : 0
  };
});

const VendorAnalyticsModel = mongoose.model('VendorAnalytics', vendorAnalyticsSchema);

export default VendorAnalyticsModel;

