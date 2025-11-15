import mongoose from "mongoose";

const reviewsSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required'],
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        trim: true,
        maxlength: [200, 'Review title cannot exceed 200 characters']
    },
    review: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    userName: {
        type: String,
        default: ''
    },
    userAvatar: {
        type: String,
        default: ''
    },
    images: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'spam'],
        default: 'pending',
        index: true
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpfulCount: {
        type: Number,
        default: 0,
        min: 0
    },
    helpfulUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    adminResponse: {
        text: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    // Legacy support
    image: {
        type: String,
        default: ''
    }
},{
    timestamps: true
});

// Indexes
reviewsSchema.index({ productId: 1, status: 1 });
reviewsSchema.index({ userId: 1, productId: 1 });
reviewsSchema.index({ rating: -1 });
reviewsSchema.index({ helpfulCount: -1 });
reviewsSchema.index({ createdAt: -1 });
reviewsSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Methods
reviewsSchema.methods.markHelpful = async function(userId) {
    if (!this.helpfulUsers.includes(userId)) {
        this.helpfulUsers.push(userId);
        this.helpfulCount += 1;
        await this.save();
    }
};

reviewsSchema.methods.unmarkHelpful = async function(userId) {
    const index = this.helpfulUsers.indexOf(userId);
    if (index > -1) {
        this.helpfulUsers.splice(index, 1);
        this.helpfulCount = Math.max(0, this.helpfulCount - 1);
        await this.save();
    }
};

const ReviewModel = mongoose.model('reviews', reviewsSchema);

export default ReviewModel;