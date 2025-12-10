import mongoose from 'mongoose';

/**
 * Vendor Review Model
 * Customer reviews for vendors (not just products)
 * WooCommerce-style vendor rating system with sub-ratings
 */

const vendorReviewSchema = new mongoose.Schema({
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
  // 👤 CUSTOMER REFERENCE
  // ═══════════════════════════════════════════════════════
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  customerName: {
    type: String,
    required: true
  },
  
  customerAvatar: {
    type: String
  },

  // ═══════════════════════════════════════════════════════
  // 📦 ORDER/PRODUCT REFERENCE
  // ═══════════════════════════════════════════════════════
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  orderNumber: {
    type: String
  },
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  productName: {
    type: String
  },

  // ═══════════════════════════════════════════════════════
  // ⭐ OVERALL RATING
  // ═══════════════════════════════════════════════════════
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // ═══════════════════════════════════════════════════════
  // 📊 DETAILED RATINGS (Sub-ratings)
  // ═══════════════════════════════════════════════════════
  ratings: {
    productQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    shippingSpeed: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    },
    customerService: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // ═══════════════════════════════════════════════════════
  // 📝 REVIEW CONTENT
  // ═══════════════════════════════════════════════════════
  title: {
    type: String,
    maxlength: 200,
    trim: true
  },
  
  comment: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  
  // Pros and cons
  pros: [{
    type: String,
    maxlength: 200
  }],
  
  cons: [{
    type: String,
    maxlength: 200
  }],

  // ═══════════════════════════════════════════════════════
  // 📸 IMAGES/MEDIA
  // ═══════════════════════════════════════════════════════
  images: [{
    url: String,
    publicId: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Video review (if supported)
  video: {
    url: String,
    publicId: String,
    thumbnail: String,
    duration: Number
  },

  // ═══════════════════════════════════════════════════════
  // ✅ VERIFICATION
  // ═══════════════════════════════════════════════════════
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  purchaseDate: {
    type: Date
  },

  // ═══════════════════════════════════════════════════════
  // 📊 MODERATION STATUS
  // ═══════════════════════════════════════════════════════
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reported', 'hidden'],
    default: 'approved',
    index: true
  },
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  rejectionReason: {
    type: String
  },

  // ═══════════════════════════════════════════════════════
  // 💬 VENDOR RESPONSE
  // ═══════════════════════════════════════════════════════
  vendorResponse: {
    response: {
      type: String,
      maxlength: 1000
    },
    respondedAt: {
      type: Date
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },

  // ═══════════════════════════════════════════════════════
  // 👍 HELPFULNESS
  // ═══════════════════════════════════════════════════════
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  notHelpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Users who voted
  helpfulVotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: Boolean,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ═══════════════════════════════════════════════════════
  // 🚩 REPORTING
  // ═══════════════════════════════════════════════════════
  reportedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'harassment', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],

  // ═══════════════════════════════════════════════════════
  // 📌 FEATURE FLAGS
  // ═══════════════════════════════════════════════════════
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isPinned: {
    type: Boolean,
    default: false
  },

  // ═══════════════════════════════════════════════════════
  // 🔒 EDIT HISTORY
  // ═══════════════════════════════════════════════════════
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    previousRating: Number,
    previousComment: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Time window for editing (e.g., 30 days)
  editableUntil: {
    type: Date
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
vendorReviewSchema.index({ vendorId: 1, status: 1 });
vendorReviewSchema.index({ vendorId: 1, rating: -1 });
vendorReviewSchema.index({ customerId: 1 });
vendorReviewSchema.index({ orderId: 1 });
vendorReviewSchema.index({ rating: -1 });
vendorReviewSchema.index({ createdAt: -1 });
vendorReviewSchema.index({ helpfulCount: -1 });
vendorReviewSchema.index({ isVerifiedPurchase: 1 });
// Prevent duplicate reviews for same order
vendorReviewSchema.index({ vendorId: 1, customerId: 1, orderId: 1 }, { unique: true, sparse: true });

// ═══════════════════════════════════════════════════════
// 🔧 PRE-SAVE MIDDLEWARE
// ═══════════════════════════════════════════════════════
vendorReviewSchema.pre('save', function(next) {
  // Set editable until date (30 days from creation)
  if (this.isNew && !this.editableUntil) {
    const editableDate = new Date();
    editableDate.setDate(editableDate.getDate() + 30);
    this.editableUntil = editableDate;
  }
  
  // Calculate average of sub-ratings if not provided
  if (!this.rating && this.ratings) {
    const subRatings = Object.values(this.ratings).filter(r => r != null);
    if (subRatings.length > 0) {
      this.rating = Math.round(subRatings.reduce((a, b) => a + b, 0) / subRatings.length);
    }
  }
  
  next();
});

// ═══════════════════════════════════════════════════════
// 🔧 POST-SAVE MIDDLEWARE - Update Vendor Stats
// ═══════════════════════════════════════════════════════
vendorReviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    try {
      const VendorModel = mongoose.model('Vendor');
      
      // Get all approved reviews for this vendor
      const reviews = await this.constructor.find({
        vendorId: this.vendorId,
        status: 'approved'
      });
      
      // Calculate stats
      const totalReviews = reviews.length;
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0;
      
      // Calculate rating distribution
      const ratingDistribution = {
        oneStar: reviews.filter(r => r.rating === 1).length,
        twoStar: reviews.filter(r => r.rating === 2).length,
        threeStar: reviews.filter(r => r.rating === 3).length,
        fourStar: reviews.filter(r => r.rating === 4).length,
        fiveStar: reviews.filter(r => r.rating === 5).length
      };
      
      // Update vendor stats
      await VendorModel.findByIdAndUpdate(this.vendorId, {
        'stats.averageRating': avgRating,
        'stats.totalReviews': totalReviews,
        'stats.ratingDistribution': ratingDistribution
      });
    } catch (error) {
      console.error('Error updating vendor stats after review:', error);
    }
  }
});

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Get vendor's reviews with pagination
vendorReviewSchema.statics.getVendorReviews = async function(vendorId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = -1,
    rating = null,
    verified = null,
    withImages = null
  } = options;
  
  const query = { vendorId, status: 'approved' };
  
  if (rating) query.rating = rating;
  if (verified !== null) query.isVerifiedPurchase = verified;
  if (withImages) query['images.0'] = { $exists: true };
  
  const reviews = await this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('customerId', 'name avatar')
    .populate('productId', 'name images');
  
  const total = await this.countDocuments(query);
  
  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get vendor's rating summary
vendorReviewSchema.statics.getVendorRatingSummary = async function(vendorId) {
  const result = await this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        avgProductQuality: { $avg: '$ratings.productQuality' },
        avgCommunication: { $avg: '$ratings.communication' },
        avgShippingSpeed: { $avg: '$ratings.shippingSpeed' },
        avgPackaging: { $avg: '$ratings.packaging' },
        avgCustomerService: { $avg: '$ratings.customerService' },
        avgValueForMoney: { $avg: '$ratings.valueForMoney' }
      }
    }
  ]);
  
  // Get rating distribution
  const distribution = await this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
  
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(d => {
    ratingDistribution[d._id] = d.count;
  });
  
  return {
    ...(result[0] || {
      averageRating: 0,
      totalReviews: 0
    }),
    ratingDistribution
  };
};

// Check if customer can review vendor (has purchased from them)
vendorReviewSchema.statics.canCustomerReview = async function(customerId, vendorId, orderId = null) {
  // Check if already reviewed
  const existingReview = await this.findOne({
    vendorId,
    customerId,
    ...(orderId && { orderId })
  });
  
  if (existingReview) {
    return { canReview: false, reason: 'Already reviewed' };
  }
  
  // Check if customer has purchased from this vendor
  const Order = mongoose.model('Order');
  const orderQuery = {
    userId: customerId,
    'products.vendorId': vendorId,
    status: 'Delivered'
  };
  
  if (orderId) {
    orderQuery._id = orderId;
  }
  
  const order = await Order.findOne(orderQuery);
  
  if (!order) {
    return { canReview: false, reason: 'No completed purchase from this vendor' };
  }
  
  return { canReview: true, order };
};

// ═══════════════════════════════════════════════════════
// 💡 INSTANCE METHODS
// ═══════════════════════════════════════════════════════

// Add vendor response
vendorReviewSchema.methods.addVendorResponse = async function(response, userId) {
  this.vendorResponse = {
    response,
    respondedAt: new Date(),
    respondedBy: userId,
    isPublic: true
  };
  return await this.save();
};

// Vote helpful/not helpful
vendorReviewSchema.methods.vote = async function(userId, isHelpful) {
  // Remove existing vote from this user
  this.helpfulVotes = this.helpfulVotes.filter(
    v => v.userId.toString() !== userId.toString()
  );
  
  // Add new vote
  this.helpfulVotes.push({
    userId,
    isHelpful,
    votedAt: new Date()
  });
  
  // Update counts
  this.helpfulCount = this.helpfulVotes.filter(v => v.isHelpful).length;
  this.notHelpfulCount = this.helpfulVotes.filter(v => !v.isHelpful).length;
  
  return await this.save();
};

// Report review
vendorReviewSchema.methods.report = async function(userId, reason, description = '') {
  this.reports.push({
    reportedBy: userId,
    reason,
    description,
    reportedAt: new Date()
  });
  this.reportedCount = this.reports.length;
  
  // Auto-hide if too many reports
  if (this.reportedCount >= 5) {
    this.status = 'reported';
  }
  
  return await this.save();
};

// Edit review (within edit window)
vendorReviewSchema.methods.edit = async function(newRating, newComment, reason = '') {
  if (new Date() > this.editableUntil) {
    throw new Error('Review is no longer editable');
  }
  
  // Save history
  this.editHistory.push({
    previousRating: this.rating,
    previousComment: this.comment,
    editedAt: new Date(),
    reason
  });
  
  this.rating = newRating;
  this.comment = newComment;
  this.isEdited = true;
  
  return await this.save();
};

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
vendorReviewSchema.virtual('helpfulnessRatio').get(function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  return total > 0 ? (this.helpfulCount / total) * 100 : 0;
});

vendorReviewSchema.virtual('hasVendorResponse').get(function() {
  return !!(this.vendorResponse && this.vendorResponse.response);
});

vendorReviewSchema.virtual('hasImages').get(function() {
  return this.images && this.images.length > 0;
});

vendorReviewSchema.virtual('isEditable').get(function() {
  return new Date() <= this.editableUntil;
});

const VendorReviewModel = mongoose.model('VendorReview', vendorReviewSchema);

export default VendorReviewModel;

