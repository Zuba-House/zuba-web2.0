import mongoose from "mongoose";

/**
 * Enhanced Withdrawal Model
 * WooCommerce-style withdrawal system with batch processing
 */

const withdrawalSchema = new mongoose.Schema({
  // ═══════════════════════════════════════════════════════
  // 🆔 WITHDRAWAL IDENTIFICATION
  // ═══════════════════════════════════════════════════════
  withdrawalCode: {
    type: String,
    unique: true,
    sparse: true
    // Format: WD-20250110-000001
  },

  // ═══════════════════════════════════════════════════════
  // 🏪 VENDOR REFERENCE
  // ═══════════════════════════════════════════════════════
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  
  // Vendor details snapshot (for historical record)
  vendorSnapshot: {
    shopName: String,
    email: String,
    subscriptionTier: String
  },

  // ═══════════════════════════════════════════════════════
  // 💰 AMOUNT DETAILS
  // ═══════════════════════════════════════════════════════
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Fees
  processingFee: {
    type: Number,
    default: 0
  },
  
  platformFee: {
    type: Number,
    default: 0
  },
  
  // Net amount after fees
  netAmount: {
    type: Number,
    required: true
  },
  
  // Exchange rate (if currency conversion needed)
  exchangeRate: {
    type: Number,
    default: 1
  },
  
  // Converted amount (in destination currency)
  convertedAmount: {
    type: Number
  },
  
  destinationCurrency: {
    type: String
  },

  // ═══════════════════════════════════════════════════════
  // 💳 PAYMENT METHOD & BANK ACCOUNT
  // ═══════════════════════════════════════════════════════
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'mobile_money', 'crypto', 'check', 'wire'],
    default: 'bank_transfer'
  },
  
  // Bank account details (snapshot at time of request)
  bankAccount: {
    accountHolderName: {
      type: String,
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    },
    branchName: {
      type: String,
      default: ''
    },
    routingNumber: {
      type: String,
      default: ''
    },
    iban: {
      type: String,
      default: ''
    },
    swiftCode: {
      type: String,
      default: ''
    },
    bankCountry: {
      type: String,
      default: ''
    },
    bankAddress: {
      type: String,
      default: ''
    }
  },
  
  // Alternative payment details
  paypalEmail: String,
  stripeAccountId: String,
  mobileMoneyNumber: String,
  cryptoWallet: {
    address: String,
    network: String, // 'bitcoin', 'ethereum', 'usdt', etc.
  },

  // ═══════════════════════════════════════════════════════
  // 📊 STATUS TRACKING
  // ═══════════════════════════════════════════════════════
  status: {
    type: String,
    enum: [
      'pending',      // Awaiting admin review
      'processing',   // Being processed
      'approved',     // Approved, ready for payout
      'rejected',     // Rejected by admin
      'completed',    // Successfully paid out
      'failed',       // Payment failed
      'cancelled',    // Cancelled by vendor
      'on_hold'       // Put on hold (for investigation)
    ],
    default: 'pending',
    index: true
  },
  
  // Status change history
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
    type: Date,
    default: Date.now
    }
  }],

  // ═══════════════════════════════════════════════════════
  // 👨‍💼 ADMIN REVIEW
  // ═══════════════════════════════════════════════════════
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },

  // ═══════════════════════════════════════════════════════
  // 💸 TRANSACTION DETAILS
  // ═══════════════════════════════════════════════════════
  // Transaction ID from payment gateway
  transactionId: {
    type: String,
    default: ''
  },
  
  // Reference number (internal or external)
  transactionReference: {
    type: String,
    default: ''
  },
  
  // Payment gateway response
  gatewayResponse: {
    success: Boolean,
    code: String,
    message: String,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  
  // Confirmation number (for bank transfers)
  confirmationNumber: String,

  // ═══════════════════════════════════════════════════════
  // 📦 BATCH PROCESSING
  // ═══════════════════════════════════════════════════════
  // For bulk payouts
  batchId: {
    type: String,
    index: true
  },
  batchDate: Date,
  batchSequence: Number, // Position in batch
  
  // Scheduled payout date
  scheduledDate: Date,
  
  // Priority (for processing order)
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // ═══════════════════════════════════════════════════════
  // 📅 DATES
  // ═══════════════════════════════════════════════════════
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  completedAt: {
    type: Date,
    default: null
  },
  failedAt: Date,
  
  // Expected completion date
  expectedCompletionDate: Date,

  // ═══════════════════════════════════════════════════════
  // 📝 NOTES & METADATA
  // ═══════════════════════════════════════════════════════
  vendorNotes: {
    type: String,
    default: ''
  },
  
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Legacy field (backward compatibility)
  notes: {
    type: String,
    default: ''
  },
  
  // Supporting documents
  documents: [{
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'id_verification', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Internal flags
  flags: {
    requiresVerification: { type: Boolean, default: false },
    isLargeAmount: { type: Boolean, default: false },
    isFirstWithdrawal: { type: Boolean, default: false },
    isAutoApproved: { type: Boolean, default: false },
    requiresManualReview: { type: Boolean, default: false }
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    source: String // 'dashboard', 'api', 'auto'
  },

  // ═══════════════════════════════════════════════════════
  // 🔄 RETRY INFORMATION
  // ═══════════════════════════════════════════════════════
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastRetryAt: Date,
  nextRetryAt: Date,
  retryHistory: [{
    attemptNumber: Number,
    attemptedAt: Date,
    error: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
withdrawalSchema.index({ vendor: 1, status: 1 });
withdrawalSchema.index({ vendor: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, requestedAt: -1 });
withdrawalSchema.index({ batchId: 1 });
// Note: withdrawalCode already has unique: true which creates an index automatically
withdrawalSchema.index({ scheduledDate: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });

// ═══════════════════════════════════════════════════════
// 🔧 PRE-SAVE MIDDLEWARE
// ═══════════════════════════════════════════════════════
withdrawalSchema.pre('save', async function(next) {
  // Generate withdrawal code if not exists
  if (!this.withdrawalCode) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
      }
    });
    this.withdrawalCode = `WD-${date}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate net amount if not set
  if (this.isNew && !this.netAmount) {
    this.netAmount = this.amount - (this.processingFee || 0) - (this.platformFee || 0);
  }
  
  // Set flags
  if (this.isNew) {
    // Large amount flag (configurable threshold)
    const LARGE_AMOUNT_THRESHOLD = 5000;
    this.flags.isLargeAmount = this.amount >= LARGE_AMOUNT_THRESHOLD;
    
    // Check if first withdrawal
    const previousWithdrawals = await this.constructor.countDocuments({
      vendor: this.vendor,
      status: 'completed'
    });
    this.flags.isFirstWithdrawal = previousWithdrawals === 0;
    
    // Require manual review for large amounts or first withdrawals
    this.flags.requiresManualReview = this.flags.isLargeAmount || this.flags.isFirstWithdrawal;
  }
  
  next();
});

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Get pending withdrawals for processing
withdrawalSchema.statics.getPendingWithdrawals = function(options = {}) {
  const { limit = 50, priority = null, vendor = null } = options;
  
  const query = { status: 'pending' };
  if (priority) query.priority = priority;
  if (vendor) query.vendor = vendor;
  
  return this.find(query)
    .sort({ priority: -1, requestedAt: 1 })
    .limit(limit)
    .populate('vendor', 'shopName email subscriptionTier');
};

// Get withdrawal statistics
withdrawalSchema.statics.getStats = async function(vendorId = null, dateRange = {}) {
  const match = {};
  if (vendorId) match.vendor = new mongoose.Types.ObjectId(vendorId);
  if (dateRange.start) match.createdAt = { $gte: dateRange.start };
  if (dateRange.end) match.createdAt = { ...match.createdAt, $lte: dateRange.end };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalFees: { $sum: { $add: ['$processingFee', '$platformFee'] } }
      }
    }
  ]);
  
  return stats;
};

// Create batch for processing
withdrawalSchema.statics.createBatch = async function(withdrawalIds, batchId = null) {
  if (!batchId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    batchId = `BATCH-${date}-${Date.now()}`;
  }
  
  const batchDate = new Date();
  
  const result = await this.updateMany(
    { _id: { $in: withdrawalIds }, status: 'pending' },
    {
      $set: {
        batchId,
        batchDate,
        status: 'processing'
      },
      $push: {
        statusHistory: {
          status: 'processing',
          note: `Added to batch ${batchId}`,
          updatedAt: batchDate
        }
      }
    }
  );
  
  // Set batch sequence
  const withdrawals = await this.find({ batchId }).sort({ requestedAt: 1 });
  for (let i = 0; i < withdrawals.length; i++) {
    withdrawals[i].batchSequence = i + 1;
    await withdrawals[i].save();
  }
  
  return { batchId, count: result.modifiedCount };
};

// Process batch
withdrawalSchema.statics.processBatch = async function(batchId) {
  const withdrawals = await this.find({ batchId, status: 'processing' })
    .sort({ batchSequence: 1 });
  
  const results = {
    success: [],
    failed: [],
    total: withdrawals.length
  };
  
  for (const withdrawal of withdrawals) {
    try {
      // Here you would integrate with payment gateway
      // For now, we'll just mark as approved
      await withdrawal.approve(null, 'Batch processed');
      results.success.push(withdrawal._id);
    } catch (error) {
      results.failed.push({ id: withdrawal._id, error: error.message });
    }
  }
  
  return results;
};

// Get vendor's withdrawal history
withdrawalSchema.statics.getVendorHistory = function(vendorId, options = {}) {
  const { page = 1, limit = 20, status = null } = options;
  
  const query = { vendor: vendorId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Auto-approve eligible withdrawals
withdrawalSchema.statics.autoApprove = async function(criteria = {}) {
  const {
    maxAmount = 1000,
    minVendorScore = 80,
    excludeFirstWithdrawal = true
  } = criteria;
  
  const query = {
    status: 'pending',
    amount: { $lte: maxAmount },
    'flags.requiresManualReview': false
  };
  
  if (excludeFirstWithdrawal) {
    query['flags.isFirstWithdrawal'] = false;
  }
  
  const eligible = await this.find(query).populate('vendor');
  const approved = [];
  
  for (const withdrawal of eligible) {
    if (withdrawal.vendor.stats?.performanceScore >= minVendorScore) {
      withdrawal.status = 'approved';
      withdrawal.flags.isAutoApproved = true;
      withdrawal.approvedAt = new Date();
      withdrawal.statusHistory.push({
        status: 'approved',
        note: 'Auto-approved based on criteria',
        updatedAt: new Date()
      });
      await withdrawal.save();
      approved.push(withdrawal._id);
    }
  }
  
  return approved;
};

// ═══════════════════════════════════════════════════════
// 💡 INSTANCE METHODS
// ═══════════════════════════════════════════════════════

// Approve withdrawal
withdrawalSchema.methods.approve = async function(userId = null, note = '') {
  if (this.status !== 'pending' && this.status !== 'processing') {
    throw new Error('Cannot approve withdrawal in current status');
  }
  
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.statusHistory.push({
    status: 'approved',
    note: note || 'Withdrawal approved',
    updatedBy: userId,
    updatedAt: new Date()
  });
  
  return await this.save();
};

// Reject withdrawal
withdrawalSchema.methods.reject = async function(userId, reason) {
  if (this.status !== 'pending' && this.status !== 'processing') {
    throw new Error('Cannot reject withdrawal in current status');
  }
  
  this.status = 'rejected';
  this.rejectedBy = userId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.statusHistory.push({
    status: 'rejected',
    note: reason,
    updatedBy: userId,
    updatedAt: new Date()
  });
  
  // Return funds to vendor
  const VendorModel = mongoose.model('Vendor');
  await VendorModel.findByIdAndUpdate(this.vendor, {
    $inc: {
      'earnings.availableBalance': this.amount,
      'earnings.pendingBalance': -this.amount
    }
  });
  
  return await this.save();
};

// Mark as completed
withdrawalSchema.methods.complete = async function(transactionId, transactionReference = '') {
  if (this.status !== 'approved') {
    throw new Error('Cannot complete withdrawal that is not approved');
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  this.transactionId = transactionId;
  this.transactionReference = transactionReference;
  this.statusHistory.push({
    status: 'completed',
    note: `Transaction ID: ${transactionId}`,
    updatedAt: new Date()
  });
  
  return await this.save();
};

// Mark as failed
withdrawalSchema.methods.fail = async function(error, shouldRetry = true) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.retryCount += 1;
  
  this.retryHistory.push({
    attemptNumber: this.retryCount,
    attemptedAt: new Date(),
    error: error.message || error
  });
  
  this.statusHistory.push({
    status: 'failed',
    note: `Failed: ${error.message || error}`,
    updatedAt: new Date()
  });
  
  // Schedule retry if applicable
  if (shouldRetry && this.retryCount < this.maxRetries) {
    this.nextRetryAt = new Date(Date.now() + (this.retryCount * 60 * 60 * 1000)); // Exponential backoff
    this.status = 'pending';
  }
  
  // Return funds to vendor on permanent failure
  if (this.retryCount >= this.maxRetries) {
    const VendorModel = mongoose.model('Vendor');
    await VendorModel.findByIdAndUpdate(this.vendor, {
      $inc: {
        'earnings.availableBalance': this.amount,
        'earnings.pendingBalance': -this.amount
      }
    });
  }
  
  return await this.save();
};

// Cancel withdrawal
withdrawalSchema.methods.cancel = async function(reason = '') {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel pending withdrawals');
  }
  
  this.status = 'cancelled';
  this.statusHistory.push({
    status: 'cancelled',
    note: reason || 'Cancelled by vendor',
    updatedAt: new Date()
  });
  
  // Return funds to vendor
  const VendorModel = mongoose.model('Vendor');
  await VendorModel.findByIdAndUpdate(this.vendor, {
    $inc: {
      'earnings.availableBalance': this.amount,
      'earnings.pendingBalance': -this.amount
    }
  });
  
  return await this.save();
};

// Put on hold
withdrawalSchema.methods.putOnHold = async function(userId, reason) {
  const previousStatus = this.status;
  this.status = 'on_hold';
  this.statusHistory.push({
    status: 'on_hold',
    note: `Put on hold from ${previousStatus}: ${reason}`,
    updatedBy: userId,
    updatedAt: new Date()
  });
  
  return await this.save();
};

// Add admin note
withdrawalSchema.methods.addAdminNote = async function(note, userId = null) {
  this.adminNotes = this.adminNotes ? `${this.adminNotes}\n[${new Date().toISOString()}] ${note}` : note;
  this.statusHistory.push({
    status: this.status,
    note: `Admin note: ${note}`,
    updatedBy: userId,
    updatedAt: new Date()
  });
  
  return await this.save();
};

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
withdrawalSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

withdrawalSchema.virtual('isProcessing').get(function() {
  return this.status === 'processing';
});

withdrawalSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

withdrawalSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && this.retryCount < this.maxRetries;
});

withdrawalSchema.virtual('totalFees').get(function() {
  return (this.processingFee || 0) + (this.platformFee || 0);
});

withdrawalSchema.virtual('processingTimeHours').get(function() {
  if (!this.completedAt || !this.requestedAt) return null;
  return Math.round((this.completedAt - this.requestedAt) / (1000 * 60 * 60));
});

const WithdrawalModel = mongoose.model("Withdrawal", withdrawalSchema);

export default WithdrawalModel;
