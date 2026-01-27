import mongoose from "mongoose";

const reviewRequestSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: [true, 'Order ID is required'],
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    // Guest customer info
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    // Review request status
    status: {
        type: String,
        enum: ['pending', 'sent', 'reviewed', 'expired', 'cancelled'],
        default: 'pending',
        index: true
    },
    // Email tracking
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date,
        default: null
    },
    emailOpened: {
        type: Boolean,
        default: false
    },
    emailOpenedAt: {
        type: Date,
        default: null
    },
    // Review link token for security
    reviewToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Review submission tracking
    reviewSubmitted: {
        type: Boolean,
        default: false
    },
    reviewSubmittedAt: {
        type: Date,
        default: null
    },
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reviews',
        default: null
    },
    // Admin management
    adminStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
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
    // Expiration
    expiresAt: {
        type: Date,
        default: function() {
            // Expire after 30 days
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
        index: true
    },
    // Reminder tracking
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderSentAt: {
        type: Date,
        default: null
    },
    // Product info snapshot (for reference)
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        default: ''
    },
    orderNumber: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
reviewRequestSchema.index({ orderId: 1, productId: 1 });
reviewRequestSchema.index({ customerEmail: 1, status: 1 });
// reviewToken already has index: true in field definition, no need for separate index
reviewRequestSchema.index({ status: 1, adminStatus: 1 });
// expiresAt already has index: true in field definition, no need for separate index

// Method to check if request is expired
reviewRequestSchema.methods.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
};

// Method to mark as reviewed
reviewRequestSchema.methods.markAsReviewed = async function(reviewId) {
    this.status = 'reviewed';
    this.reviewSubmitted = true;
    this.reviewSubmittedAt = new Date();
    this.reviewId = reviewId;
    await this.save();
};

// Method to mark email as opened
reviewRequestSchema.methods.markEmailOpened = async function() {
    if (!this.emailOpened) {
        this.emailOpened = true;
        this.emailOpenedAt = new Date();
        await this.save();
    }
};

const ReviewRequestModel = mongoose.model('reviewRequest', reviewRequestSchema);

export default ReviewRequestModel;

