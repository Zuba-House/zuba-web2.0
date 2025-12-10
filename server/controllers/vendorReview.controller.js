/**
 * Vendor Review Controller
 * Manages customer reviews for vendors
 */

import VendorReviewModel from '../models/vendorReview.model.js';
import VendorModel from '../models/vendor.model.js';
import OrderModel from '../models/order.model.js';
import UserModel from '../models/user.model.js';

/**
 * Get vendor reviews
 * GET /api/vendor-reviews/vendor/:vendorId
 */
export const getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, rating, verified, sortBy = 'createdAt' } = req.query;
    
    const result = await VendorReviewModel.getVendorReviews(vendorId, {
      page: parseInt(page),
      limit: parseInt(limit),
      rating: rating ? parseInt(rating) : null,
      verified: verified === 'true' ? true : verified === 'false' ? false : null,
      sortBy,
      sortOrder: sortBy === 'helpful' ? -1 : -1
    });
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get vendor reviews error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendor reviews'
    });
  }
};

/**
 * Get vendor rating summary
 * GET /api/vendor-reviews/vendor/:vendorId/summary
 */
export const getVendorRatingSummary = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const summary = await VendorReviewModel.getVendorRatingSummary(vendorId);
    
    return res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get vendor rating summary error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get rating summary'
    });
  }
};

/**
 * Create review for vendor
 * POST /api/vendor-reviews
 */
export const createReview = async (req, res) => {
  try {
    const customerId = req.userId;
    const {
      vendorId,
      orderId,
      productId,
      rating,
      ratings,
      title,
      comment,
      pros,
      cons,
      images
    } = req.body;
    
    // Validate required fields
    if (!vendorId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID, rating, and comment are required'
      });
    }
    
    // Check if customer can review
    const canReview = await VendorReviewModel.canCustomerReview(customerId, vendorId, orderId);
    if (!canReview.canReview) {
      return res.status(400).json({
        success: false,
        error: canReview.reason
      });
    }
    
    // Get customer details
    const customer = await UserModel.findById(customerId).select('name avatar');
    
    // Create review
    const review = new VendorReviewModel({
      vendorId,
      customerId,
      customerName: customer?.name || 'Anonymous',
      customerAvatar: customer?.avatar,
      orderId,
      orderNumber: canReview.order?.orderNumber,
      productId,
      rating,
      ratings,
      title,
      comment,
      pros: pros || [],
      cons: cons || [],
      images: images || [],
      isVerifiedPurchase: true,
      purchaseDate: canReview.order?.createdAt,
      status: 'approved' // Auto-approve verified purchase reviews
    });
    
    await review.save();
    
    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this vendor for this order'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create review'
    });
  }
};

/**
 * Update review
 * PUT /api/vendor-reviews/:reviewId
 */
export const updateReview = async (req, res) => {
  try {
    const customerId = req.userId;
    const { reviewId } = req.params;
    const { rating, comment, reason } = req.body;
    
    const review = await VendorReviewModel.findOne({
      _id: reviewId,
      customerId
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found or you do not have permission to edit it'
      });
    }
    
    if (!review.isEditable) {
      return res.status(400).json({
        success: false,
        error: 'Review is no longer editable'
      });
    }
    
    await review.edit(rating, comment, reason);
    
    return res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update review'
    });
  }
};

/**
 * Delete review
 * DELETE /api/vendor-reviews/:reviewId
 */
export const deleteReview = async (req, res) => {
  try {
    const customerId = req.userId;
    const { reviewId } = req.params;
    
    const review = await VendorReviewModel.findOne({
      _id: reviewId,
      customerId
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found or you do not have permission to delete it'
      });
    }
    
    await review.deleteOne();
    
    return res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete review'
    });
  }
};

/**
 * Vote on review (helpful/not helpful)
 * POST /api/vendor-reviews/:reviewId/vote
 */
export const voteReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    
    const review = await VendorReviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    await review.vote(userId, isHelpful);
    
    return res.json({
      success: true,
      message: isHelpful ? 'Marked as helpful' : 'Marked as not helpful',
      helpfulCount: review.helpfulCount,
      notHelpfulCount: review.notHelpfulCount
    });
  } catch (error) {
    console.error('Vote review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to vote on review'
    });
  }
};

/**
 * Report review
 * POST /api/vendor-reviews/:reviewId/report
 */
export const reportReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.params;
    const { reason, description } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }
    
    const review = await VendorReviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check if user already reported
    const alreadyReported = review.reports.some(
      r => r.reportedBy.toString() === userId.toString()
    );
    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this review'
      });
    }
    
    await review.report(userId, reason, description);
    
    return res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to report review'
    });
  }
};

// ═══════════════════════════════════════════════════════
// VENDOR CONTROLLERS (for vendor dashboard)
// ═══════════════════════════════════════════════════════

/**
 * Get reviews for my shop (vendor)
 * GET /api/vendor-reviews/my-reviews
 */
export const getMyShopReviews = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;
    
    const vendor = await VendorModel.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const query = { vendorId: vendor._id };
    if (status) query.status = status;
    
    const reviews = await VendorReviewModel.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('customerId', 'name avatar')
      .populate('productId', 'name images');
    
    const total = await VendorReviewModel.countDocuments(query);
    
    return res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my shop reviews error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reviews'
    });
  }
};

/**
 * Respond to review (vendor)
 * POST /api/vendor-reviews/:reviewId/respond
 */
export const respondToReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { reviewId } = req.params;
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        error: 'Response is required'
      });
    }
    
    const vendor = await VendorModel.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const review = await VendorReviewModel.findOne({
      _id: reviewId,
      vendorId: vendor._id
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    await review.addVendorResponse(response, userId);
    
    return res.json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to respond to review'
    });
  }
};

// ═══════════════════════════════════════════════════════
// ADMIN CONTROLLERS
// ═══════════════════════════════════════════════════════

/**
 * Admin: Get all reviews
 * GET /api/vendor-reviews/admin/all
 */
export const adminGetAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, vendorId, rating } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;
    if (rating) query.rating = parseInt(rating);
    
    const reviews = await VendorReviewModel.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('customerId', 'name email avatar')
      .populate('vendorId', 'shopName shopSlug')
      .populate('productId', 'name');
    
    const total = await VendorReviewModel.countDocuments(query);
    
    return res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin get all reviews error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reviews'
    });
  }
};

/**
 * Admin: Moderate review
 * PUT /api/vendor-reviews/admin/:reviewId/moderate
 */
export const adminModerateReview = async (req, res) => {
  try {
    const adminId = req.userId;
    const { reviewId } = req.params;
    const { status, rejectionReason } = req.body;
    
    const review = await VendorReviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    review.status = status;
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      review.rejectionReason = rejectionReason;
    }
    
    await review.save();
    
    return res.json({
      success: true,
      message: `Review ${status}`,
      review
    });
  } catch (error) {
    console.error('Admin moderate review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to moderate review'
    });
  }
};

/**
 * Admin: Delete review
 * DELETE /api/vendor-reviews/admin/:reviewId
 */
export const adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await VendorReviewModel.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete review'
    });
  }
};

/**
 * Admin: Feature/unfeature review
 * PUT /api/vendor-reviews/admin/:reviewId/feature
 */
export const adminFeatureReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { featured } = req.body;
    
    const review = await VendorReviewModel.findByIdAndUpdate(
      reviewId,
      { isFeatured: featured },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    return res.json({
      success: true,
      message: featured ? 'Review featured' : 'Review unfeatured',
      review
    });
  } catch (error) {
    console.error('Admin feature review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to feature review'
    });
  }
};

export default {
  getVendorReviews,
  getVendorRatingSummary,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  reportReview,
  getMyShopReviews,
  respondToReview,
  adminGetAllReviews,
  adminModerateReview,
  adminDeleteReview,
  adminFeatureReview
};

