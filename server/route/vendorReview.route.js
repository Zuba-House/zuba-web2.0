import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import * as reviewController from '../controllers/vendorReview.controller.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════

// Get vendor reviews (public)
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

// Get vendor rating summary (public)
router.get('/vendor/:vendorId/summary', reviewController.getVendorRatingSummary);

// ═══════════════════════════════════════════════════════
// CUSTOMER ROUTES (Authenticated)
// ═══════════════════════════════════════════════════════

// Create review
router.post('/', auth, reviewController.createReview);

// Update review
router.put('/:reviewId', auth, reviewController.updateReview);

// Delete review
router.delete('/:reviewId', auth, reviewController.deleteReview);

// Vote on review (helpful/not helpful)
router.post('/:reviewId/vote', auth, reviewController.voteReview);

// Report review
router.post('/:reviewId/report', auth, reviewController.reportReview);

// ═══════════════════════════════════════════════════════
// VENDOR ROUTES
// ═══════════════════════════════════════════════════════

// Get reviews for my shop
router.get('/my-reviews', auth, reviewController.getMyShopReviews);

// Respond to review
router.post('/:reviewId/respond', auth, reviewController.respondToReview);

// ═══════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════

// Get all reviews
router.get('/admin/all', auth, reviewController.adminGetAllReviews);

// Moderate review
router.put('/admin/:reviewId/moderate', auth, reviewController.adminModerateReview);

// Delete review
router.delete('/admin/:reviewId', auth, reviewController.adminDeleteReview);

// Feature/unfeature review
router.put('/admin/:reviewId/feature', auth, reviewController.adminFeatureReview);

export default router;

