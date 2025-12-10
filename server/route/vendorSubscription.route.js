import express from 'express';
import auth from '../middlewares/auth.js';
import * as subscriptionController from '../controllers/vendorSubscription.controller.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════

// Get all subscription plans
router.get('/plans', subscriptionController.getAllPlans);

// Get single plan by ID or slug
router.get('/plans/:identifier', subscriptionController.getPlan);

// ═══════════════════════════════════════════════════════
// VENDOR ROUTES (Authenticated)
// ═══════════════════════════════════════════════════════

// Get my subscription
router.get('/my-subscription', auth, subscriptionController.getMySubscription);

// Upgrade subscription
router.post('/upgrade', auth, subscriptionController.upgradeSubscription);

// Cancel subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

// Start trial
router.post('/start-trial', auth, subscriptionController.startTrial);

// ═══════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════

// Create subscription plan
router.post('/admin/plans', auth, subscriptionController.adminCreatePlan);

// Update subscription plan
router.put('/admin/plans/:id', auth, subscriptionController.adminUpdatePlan);

// Delete subscription plan
router.delete('/admin/plans/:id', auth, subscriptionController.adminDeletePlan);

// Set vendor subscription manually
router.post('/admin/vendors/:vendorId/subscription', auth, subscriptionController.adminSetVendorSubscription);

// Get subscription stats
router.get('/admin/stats', auth, subscriptionController.adminGetStats);

export default router;

