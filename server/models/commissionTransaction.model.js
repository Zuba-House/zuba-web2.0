import mongoose from 'mongoose';

/**
 * Commission Transaction Model
 * Tracks commission for each order/product sold
 * WooCommerce-style per-order commission tracking
 */

const commissionTransactionSchema = new mongoose.Schema({
  // ═══════════════════════════════════════════════════════
  // 🆔 TRANSACTION IDENTIFICATION
  // ═══════════════════════════════════════════════════════
  transactionCode: {
    type: String,
    unique: true,
    required: true
    // Format: COM-20250110-000001
  },

  // ═══════════════════════════════════════════════════════
  // 📦 ORDER REFERENCE
  // ═══════════════════════════════════════════════════════
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  orderNumber: {
    type: String,
    required: true
  },

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
  // 📦 PRODUCT DETAILS
  // ═══════════════════════════════════════════════════════
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  productName: {
    type: String
  },
  
  productSku: {
    type: String
  },
  
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Variation details (if variable product)
  variationId: {
    type: String,
    default: null
  },
  
  variationDetails: {
    type: String,
    default: null
  },

  // ═══════════════════════════════════════════════════════
  // 💰 FINANCIAL DETAILS
  // ═══════════════════════════════════════════════════════
  
  // Gross amount (product price × quantity)
  grossAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Commission rate applied
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Commission type
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  
  // Commission amount deducted
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // What vendor receives (grossAmount - commissionAmount - fees)
  vendorEarnings: {
    type: Number,
    required: true
  },
  
  // Platform's cut
  platformEarnings: {
    type: Number,
    required: true,
    min: 0
  },

  // ═══════════════════════════════════════════════════════
  // 💳 ADDITIONAL FEES
  // ═══════════════════════════════════════════════════════
  fees: {
    transactionFee: {
      type: Number,
      default: 0
    },
    paymentGatewayFee: {
      type: Number,
      default: 0
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    otherFees: {
      type: Number,
      default: 0
    }
  },
  
  // Total fees deducted
  totalFees: {
    type: Number,
    default: 0
  },

  // ═══════════════════════════════════════════════════════
  // 💱 CURRENCY
  // ═══════════════════════════════════════════════════════
  currency: {
    type: String,
    default: 'USD'
  },

  // ═══════════════════════════════════════════════════════
  // 📊 STATUS TRACKING
  // ═══════════════════════════════════════════════════════
  status: {
    type: String,
    enum: [
      'pending',      // Order placed, awaiting payment confirmation
      'processing',   // Payment confirmed, order being processed
      'cleared',      // Funds cleared and available for withdrawal
      'reserved',     // Held for potential refund/dispute
      'refunded',     // Order refunded
      'disputed',     // Under dispute
      'cancelled',    // Order cancelled
      'released'      // Funds released to vendor
    ],
    default: 'pending',
    index: true
  },
  
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
  // ⏰ CLEARANCE SETTINGS
  // ═══════════════════════════════════════════════════════
  // Days to hold before clearing (based on subscription tier)
  clearanceDays: {
    type: Number,
    default: 7
  },
  
  // When funds become available
  clearanceDate: {
    type: Date
  },
  
  // When funds were actually cleared
  clearedAt: {
    type: Date
  },

  // ═══════════════════════════════════════════════════════
  // 💸 WITHDRAWAL REFERENCE
  // ═══════════════════════════════════════════════════════
  withdrawalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Withdrawal',
    default: null
  },
  
  withdrawnAt: {
    type: Date
  },

  // ═══════════════════════════════════════════════════════
  // 🏷️ TRANSACTION CATEGORY
  // ═══════════════════════════════════════════════════════
  category: {
    type: String,
    enum: [
      'sale',         // Normal product sale
      'refund',       // Refund transaction (negative)
      'chargeback',   // Chargeback from payment provider
      'fee',          // Platform fee
      'adjustment',   // Manual adjustment
      'bonus',        // Bonus/incentive
      'tip'           // Customer tip (if supported)
    ],
    default: 'sale'
  },

  // ═══════════════════════════════════════════════════════
  // 📝 NOTES & METADATA
  // ═══════════════════════════════════════════════════════
  notes: {
    type: String
  },
  
  adminNotes: {
    type: String
  },
  
  // Additional metadata
  metadata: {
    customerCountry: String,
    customerCity: String,
    paymentMethod: String,
    deviceType: String,
    ipAddress: String,
    userAgent: String
  },

  // ═══════════════════════════════════════════════════════
  // 🔗 RELATED TRANSACTIONS
  // ═══════════════════════════════════════════════════════
  // For refunds, link to original transaction
  originalTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionTransaction',
    default: null
  },
  
  // If this transaction has been refunded
  refundedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionTransaction',
    default: null
  },
  
  isRefunded: {
    type: Boolean,
    default: false
  },
  
  refundedAmount: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
commissionTransactionSchema.index({ vendorId: 1, status: 1 });
commissionTransactionSchema.index({ vendorId: 1, createdAt: -1 });
commissionTransactionSchema.index({ orderId: 1 });
commissionTransactionSchema.index({ clearanceDate: 1 });
commissionTransactionSchema.index({ transactionCode: 1 });
commissionTransactionSchema.index({ category: 1 });
commissionTransactionSchema.index({ createdAt: -1 });

// ═══════════════════════════════════════════════════════
// 🔧 PRE-SAVE MIDDLEWARE
// ═══════════════════════════════════════════════════════
commissionTransactionSchema.pre('save', async function(next) {
  // Generate transaction code if not exists
  if (!this.transactionCode) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
      }
    });
    this.transactionCode = `COM-${date}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate clearance date if not set
  if (!this.clearanceDate && this.status === 'pending') {
    const clearanceDate = new Date();
    clearanceDate.setDate(clearanceDate.getDate() + this.clearanceDays);
    this.clearanceDate = clearanceDate;
  }
  
  // Calculate total fees
  this.totalFees = (
    (this.fees.transactionFee || 0) +
    (this.fees.paymentGatewayFee || 0) +
    (this.fees.tax || 0) +
    (this.fees.otherFees || 0)
  );
  
  next();
});

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Get vendor's pending earnings
commissionTransactionSchema.statics.getVendorPendingEarnings = async function(vendorId) {
  const result = await this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$vendorEarnings' } } }
  ]);
  return result[0]?.total || 0;
};

// Get vendor's available earnings (cleared)
commissionTransactionSchema.statics.getVendorAvailableEarnings = async function(vendorId) {
  const result = await this.aggregate([
    { $match: { vendorId: new mongoose.Types.ObjectId(vendorId), status: 'cleared' } },
    { $group: { _id: null, total: { $sum: '$vendorEarnings' } } }
  ]);
  return result[0]?.total || 0;
};

// Get vendor's total earnings
commissionTransactionSchema.statics.getVendorTotalEarnings = async function(vendorId) {
  const result = await this.aggregate([
    { 
      $match: { 
        vendorId: new mongoose.Types.ObjectId(vendorId), 
        status: { $in: ['cleared', 'released'] },
        category: 'sale'
      } 
    },
    { $group: { _id: null, total: { $sum: '$vendorEarnings' } } }
  ]);
  return result[0]?.total || 0;
};

// Get vendor's monthly summary
commissionTransactionSchema.statics.getVendorMonthlySummary = async function(vendorId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const result = await this.aggregate([
    { 
      $match: { 
        vendorId: new mongoose.Types.ObjectId(vendorId),
        createdAt: { $gte: startDate, $lte: endDate }
      } 
    },
    { 
      $group: { 
        _id: '$status',
        totalGross: { $sum: '$grossAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        totalEarnings: { $sum: '$vendorEarnings' },
        count: { $sum: 1 }
      } 
    }
  ]);
  
  return result;
};

// Clear pending transactions that have passed clearance date
commissionTransactionSchema.statics.clearPendingTransactions = async function() {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      status: 'pending',
      clearanceDate: { $lte: now }
    },
    {
      $set: { status: 'cleared', clearedAt: now },
      $push: {
        statusHistory: {
          status: 'cleared',
          note: 'Automatically cleared after clearance period',
          updatedAt: now
        }
      }
    }
  );
  
  return result;
};

// Create commission transaction from order
commissionTransactionSchema.statics.createFromOrder = async function(order, vendor, product, quantity, price) {
  const commissionRate = vendor.commission?.rate || 12;
  const commissionType = vendor.commission?.type || 'percentage';
  const clearanceDays = vendor.subscriptionTier === 'platinum' ? 3 : 
                        vendor.subscriptionTier === 'gold' ? 5 : 7;
  
  const grossAmount = price * quantity;
  let commissionAmount;
  
  if (commissionType === 'percentage') {
    commissionAmount = (grossAmount * commissionRate) / 100;
  } else {
    commissionAmount = commissionRate * quantity;
  }
  
  const vendorEarnings = grossAmount - commissionAmount;
  
  const transaction = new this({
    orderId: order._id,
    orderNumber: order.orderNumber || order._id.toString(),
    vendorId: vendor._id,
    productId: product._id,
    productName: product.name || product.productTitle,
    productSku: product.sku,
    quantity,
    grossAmount,
    commissionRate,
    commissionType,
    commissionAmount,
    vendorEarnings,
    platformEarnings: commissionAmount,
    clearanceDays,
    status: 'pending'
  });
  
  await transaction.save();
  return transaction;
};

// ═══════════════════════════════════════════════════════
// 💡 INSTANCE METHODS
// ═══════════════════════════════════════════════════════

// Mark as cleared
commissionTransactionSchema.methods.markAsCleared = async function(userId = null) {
  this.status = 'cleared';
  this.clearedAt = new Date();
  this.statusHistory.push({
    status: 'cleared',
    note: 'Transaction cleared',
    updatedBy: userId,
    updatedAt: new Date()
  });
  return await this.save();
};

// Process refund
commissionTransactionSchema.methods.processRefund = async function(refundAmount, userId = null, note = '') {
  if (refundAmount > this.grossAmount) {
    throw new Error('Refund amount cannot exceed gross amount');
  }
  
  // Calculate proportional refund
  const refundRatio = refundAmount / this.grossAmount;
  const vendorRefund = this.vendorEarnings * refundRatio;
  
  this.isRefunded = true;
  this.refundedAmount = refundAmount;
  this.status = refundAmount === this.grossAmount ? 'refunded' : 'cleared';
  this.statusHistory.push({
    status: 'refunded',
    note: note || `Refunded ${refundAmount}`,
    updatedBy: userId,
    updatedAt: new Date()
  });
  
  // Create refund transaction
  const RefundTransaction = new this.constructor({
    orderId: this.orderId,
    orderNumber: this.orderNumber,
    vendorId: this.vendorId,
    productId: this.productId,
    productName: this.productName,
    grossAmount: -refundAmount,
    commissionRate: this.commissionRate,
    commissionType: this.commissionType,
    commissionAmount: -(this.commissionAmount * refundRatio),
    vendorEarnings: -vendorRefund,
    platformEarnings: -(this.platformEarnings * refundRatio),
    status: 'cleared',
    category: 'refund',
    originalTransactionId: this._id,
    notes: `Refund for order ${this.orderNumber}`
  });
  
  await RefundTransaction.save();
  this.refundedTransactionId = RefundTransaction._id;
  await this.save();
  
  return { originalTransaction: this, refundTransaction: RefundTransaction };
};

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
commissionTransactionSchema.virtual('isCleared').get(function() {
  return this.status === 'cleared' || this.status === 'released';
});

commissionTransactionSchema.virtual('canBeWithdrawn').get(function() {
  return this.status === 'cleared' && !this.withdrawalId;
});

commissionTransactionSchema.virtual('netAmount').get(function() {
  return this.vendorEarnings - this.totalFees;
});

const CommissionTransactionModel = mongoose.model('CommissionTransaction', commissionTransactionSchema);

export default CommissionTransactionModel;

