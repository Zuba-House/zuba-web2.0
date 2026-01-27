import ReviewRequestModel from '../models/reviewRequest.model.js';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import ReviewModel from '../models/reviews.model.js.js';
import UserModel from '../models/user.model.js';
import sendEmailFun from '../config/sendEmail.js';
import { ReviewRequestEmailTemplate } from '../utils/reviewRequestEmailTemplate.js';
import crypto from 'crypto';

const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Generate a secure token for review request
 */
const generateReviewToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * POST /api/admin/review-requests/send
 * Send review requests for delivered orders
 */
export const sendReviewRequests = async (req, res) => {
    try {
        const { orderIds, productIds } = req.body;

        // If specific orders/products provided, use them; otherwise find all delivered orders
        let orders;
        if (orderIds && orderIds.length > 0) {
            orders = await OrderModel.find({
                _id: { $in: orderIds },
                status: 'Delivered',
                reviewRequestEnabled: true
            });
        } else {
            // Find all delivered orders that haven't had review requests sent yet
            orders = await OrderModel.find({
                status: 'Delivered',
                reviewRequestEnabled: true,
                reviewRequestsSent: false
            });
        }

        if (orders.length === 0) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'No eligible orders found for review requests'
            });
        }

        const results = {
            sent: 0,
            skipped: 0,
            errors: []
        };

        // Process each order
        for (const order of orders) {
            try {
                // Get customer info
                let customerName = '';
                let customerEmail = '';

                if (order.userId) {
                    const user = await UserModel.findById(order.userId).select('name email');
                    if (user) {
                        customerName = user.name || '';
                        customerEmail = user.email || '';
                    }
                } else if (order.guestCustomer) {
                    customerName = order.guestCustomer.name || '';
                    customerEmail = order.guestCustomer.email || '';
                }

                if (!customerEmail) {
                    results.skipped++;
                    results.errors.push({
                        orderId: order._id,
                        reason: 'No customer email found'
                    });
                    continue;
                }

                // Process each product in the order
                const productsToReview = productIds 
                    ? order.products.filter(p => productIds.includes(p.productId))
                    : order.products;

                for (const orderItem of productsToReview) {
                    try {
                        // Check if review request already exists
                        const existingRequest = await ReviewRequestModel.findOne({
                            orderId: order._id,
                            productId: orderItem.productId,
                            status: { $in: ['pending', 'sent'] }
                        });

                        if (existingRequest) {
                            results.skipped++;
                            continue;
                        }

                        // Check if user already reviewed this product
                        if (order.userId) {
                            const existingReview = await ReviewModel.findOne({
                                userId: order.userId,
                                productId: orderItem.productId,
                                status: 'approved'
                            });

                            if (existingReview) {
                                results.skipped++;
                                continue;
                            }
                        }

                        // Get product details
                        const product = await ProductModel.findById(orderItem.productId);
                        if (!product) {
                            results.skipped++;
                            continue;
                        }

                        // Create review request
                        const reviewToken = generateReviewToken();
                        const reviewLink = `${CLIENT_URL}/review/${reviewToken}?orderId=${order._id}&productId=${orderItem.productId}`;
                        const productLink = `${CLIENT_URL}/product/${orderItem.productId}`;

                        const reviewRequest = new ReviewRequestModel({
                            orderId: order._id,
                            productId: orderItem.productId,
                            userId: order.userId || null,
                            customerName: customerName,
                            customerEmail: customerEmail,
                            reviewToken: reviewToken,
                            productName: product.name,
                            productImage: orderItem.image || product.featuredImage || product.images?.[0]?.url || '',
                            orderNumber: order._id.toString().slice(-8).toUpperCase(),
                            status: 'pending',
                            adminStatus: 'pending'
                        });

                        await reviewRequest.save();

                        // Send email
                        const emailHtml = ReviewRequestEmailTemplate({
                            customerName: customerName,
                            productName: product.name,
                            productImage: orderItem.image || product.featuredImage || product.images?.[0]?.url || '',
                            reviewLink: reviewLink,
                            productLink: productLink,
                            orderNumber: reviewRequest.orderNumber
                        });

                        const emailSent = await sendEmailFun({
                            sendTo: customerEmail,
                            subject: `🌟 Share Your Experience - Review Your ${product.name}`,
                            text: `Hi ${customerName},\n\nThank you for your purchase! We'd love to hear your feedback about ${product.name}.\n\nClick here to write a review: ${reviewLink}\n\nThank you!\nZuba House Team`,
                            html: emailHtml
                        });

                        if (emailSent) {
                            reviewRequest.status = 'sent';
                            reviewRequest.emailSent = true;
                            reviewRequest.emailSentAt = new Date();
                            await reviewRequest.save();
                            results.sent++;
                        } else {
                            results.errors.push({
                                orderId: order._id,
                                productId: orderItem.productId,
                                reason: 'Email sending failed'
                            });
                        }
                    } catch (error) {
                        console.error(`Error processing product ${orderItem.productId}:`, error);
                        results.errors.push({
                            orderId: order._id,
                            productId: orderItem.productId,
                            reason: error.message
                        });
                    }
                }

                // Mark order as having review requests sent
                if (results.sent > 0) {
                    order.reviewRequestsSent = true;
                    order.reviewRequestsSentAt = new Date();
                    await order.save();
                }
            } catch (error) {
                console.error(`Error processing order ${order._id}:`, error);
                results.errors.push({
                    orderId: order._id,
                    reason: error.message
                });
            }
        }

        return res.status(200).json({
            error: false,
            success: true,
            message: `Review requests processed: ${results.sent} sent, ${results.skipped} skipped`,
            data: results
        });
    } catch (error) {
        console.error('Send review requests error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to send review requests'
        });
    }
};

/**
 * GET /api/admin/review-requests
 * Get all review requests with filters
 */
export const getReviewRequests = async (req, res) => {
    try {
        const { status, adminStatus, page = 1, limit = 20, search } = req.query;
        
        const query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (adminStatus) {
            query.adminStatus = adminStatus;
        }
        
        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { productName: { $regex: search, $options: 'i' } },
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const reviewRequests = await ReviewRequestModel.find(query)
            .populate('orderId', 'status totalAmt createdAt')
            .populate('productId', 'name featuredImage images')
            .populate('userId', 'name email')
            .populate('reviewId', 'rating review status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ReviewRequestModel.countDocuments(query);

        return res.status(200).json({
            error: false,
            success: true,
            data: {
                reviewRequests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get review requests error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to fetch review requests'
        });
    }
};

/**
 * GET /api/admin/review-requests/:id
 * Get single review request
 */
export const getReviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        
        const reviewRequest = await ReviewRequestModel.findById(id)
            .populate('orderId')
            .populate('productId')
            .populate('userId')
            .populate('reviewId')
            .populate('approvedBy', 'name email')
            .populate('rejectedBy', 'name email');

        if (!reviewRequest) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Review request not found'
            });
        }

        return res.status(200).json({
            error: false,
            success: true,
            data: reviewRequest
        });
    } catch (error) {
        console.error('Get review request error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to fetch review request'
        });
    }
};

/**
 * POST /api/admin/review-requests/:id/approve
 * Approve a review request (and the associated review if submitted)
 */
export const approveReviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewId } = req.body;

        const reviewRequest = await ReviewRequestModel.findById(id);
        if (!reviewRequest) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Review request not found'
            });
        }

        reviewRequest.adminStatus = 'approved';
        reviewRequest.approvedBy = req.userId;
        reviewRequest.approvedAt = new Date();

        // If review is already submitted, approve it too
        if (reviewId || reviewRequest.reviewId) {
            const reviewToApprove = await ReviewModel.findById(reviewId || reviewRequest.reviewId);
            if (reviewToApprove) {
                reviewToApprove.status = 'approved';
                reviewToApprove.isApproved = true;
                reviewToApprove.approvedBy = req.userId;
                reviewToApprove.approvedAt = new Date();
                await reviewToApprove.save();
                
                // Update product rating
                await reviewToApprove.updateProductRating();
            }
        }

        await reviewRequest.save();

        return res.status(200).json({
            error: false,
            success: true,
            message: 'Review request approved successfully',
            data: reviewRequest
        });
    } catch (error) {
        console.error('Approve review request error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to approve review request'
        });
    }
};

/**
 * POST /api/admin/review-requests/:id/reject
 * Reject a review request
 */
export const rejectReviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const reviewRequest = await ReviewRequestModel.findById(id);
        if (!reviewRequest) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Review request not found'
            });
        }

        reviewRequest.adminStatus = 'rejected';
        reviewRequest.rejectedBy = req.userId;
        reviewRequest.rejectedAt = new Date();
        reviewRequest.rejectionReason = reason || '';

        // If review is already submitted, reject it too
        if (reviewRequest.reviewId) {
            const reviewToReject = await ReviewModel.findById(reviewRequest.reviewId);
            if (reviewToReject) {
                reviewToReject.status = 'rejected';
                reviewToReject.isApproved = false;
                reviewToReject.rejectionReason = reason || 'Rejected by admin';
                await reviewToReject.save();
            }
        }

        await reviewRequest.save();

        return res.status(200).json({
            error: false,
            success: true,
            message: 'Review request rejected successfully',
            data: reviewRequest
        });
    } catch (error) {
        console.error('Reject review request error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to reject review request'
        });
    }
};

/**
 * PUT /api/admin/orders/:id/review-request-toggle
 * Toggle review request for an order
 */
export const toggleReviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        const order = await OrderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Order not found'
            });
        }

        order.reviewRequestEnabled = enabled !== undefined ? enabled : !order.reviewRequestEnabled;
        await order.save();

        return res.status(200).json({
            error: false,
            success: true,
            message: `Review request ${order.reviewRequestEnabled ? 'enabled' : 'disabled'} for order`,
            data: {
                orderId: order._id,
                reviewRequestEnabled: order.reviewRequestEnabled
            }
        });
    } catch (error) {
        console.error('Toggle review request error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to toggle review request'
        });
    }
};

/**
 * GET /api/review/:token
 * Get review request by token (for customer review page)
 */
export const getReviewRequestByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const { orderId, productId } = req.query;

        const query = { reviewToken: token };
        if (orderId) query.orderId = orderId;
        if (productId) query.productId = productId;

        const reviewRequest = await ReviewRequestModel.findOne(query)
            .populate('orderId', 'status products')
            .populate('productId', 'name featuredImage images description')
            .populate('userId', 'name email');

        if (!reviewRequest) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Review request not found or invalid token'
            });
        }

        // Check if expired
        if (reviewRequest.isExpired()) {
            reviewRequest.status = 'expired';
            await reviewRequest.save();
            return res.status(400).json({
                error: true,
                success: false,
                message: 'This review request has expired'
            });
        }

        // Mark email as opened if not already
        await reviewRequest.markEmailOpened();

        return res.status(200).json({
            error: false,
            success: true,
            data: reviewRequest
        });
    } catch (error) {
        console.error('Get review request by token error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to fetch review request'
        });
    }
};

/**
 * POST /api/review/:token/submit
 * Submit review from review request link
 */
export const submitReviewFromRequest = async (req, res) => {
    try {
        const { token } = req.params;
        const { rating, review, title, userName, images } = req.body;

        // Validate required fields
        if (!rating || !review) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'Rating and review text are required'
            });
        }

        const reviewRequest = await ReviewRequestModel.findOne({ reviewToken: token })
            .populate('orderId')
            .populate('productId');

        if (!reviewRequest) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Review request not found or invalid token'
            });
        }

        // Check if expired
        if (reviewRequest.isExpired()) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'This review request has expired'
            });
        }

        // Check if already reviewed
        if (reviewRequest.reviewSubmitted) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'You have already submitted a review for this product'
            });
        }

        // Check for existing review
        const existingReview = await ReviewModel.findOne({
            productId: reviewRequest.productId,
            userId: reviewRequest.userId || null,
            customerEmail: reviewRequest.customerEmail
        });

        if (existingReview) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Create review
        const newReview = new ReviewModel({
            productId: reviewRequest.productId,
            userId: reviewRequest.userId || null,
            rating: parseInt(rating),
            review: review,
            title: title || review.substring(0, 100),
            userName: userName || reviewRequest.customerName,
            customerName: reviewRequest.customerName,
            customerEmail: reviewRequest.customerEmail,
            images: images || [],
            status: 'pending',
            isApproved: false,
            verifiedPurchase: true // Always verified since it came from an order
        });

        await newReview.save();

        // Update review request
        await reviewRequest.markAsReviewed(newReview._id);
        reviewRequest.adminStatus = 'pending'; // Needs admin approval
        await reviewRequest.save();

        return res.status(200).json({
            error: false,
            success: true,
            message: 'Review submitted successfully! It will be reviewed by our team shortly.',
            data: {
                review: newReview,
                reviewRequest: reviewRequest
            }
        });
    } catch (error) {
        console.error('Submit review from request error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to submit review'
        });
    }
};

export default {
    sendReviewRequests,
    getReviewRequests,
    getReviewRequest,
    approveReviewRequest,
    rejectReviewRequest,
    toggleReviewRequest,
    getReviewRequestByToken,
    submitReviewFromRequest
};

