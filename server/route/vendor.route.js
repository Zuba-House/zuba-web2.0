import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import * as vendorController from '../controllers/vendor.controller.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════
// STATIC ROUTES FIRST (before dynamic :param routes)
// ═══════════════════════════════════════════════════════

// OTP routes (public)
router.post('/send-otp', vendorController.sendVendorOTP);
router.post('/verify-otp', vendorController.verifyVendorOTP);

// Account setup routes (for guest vendors after approval)
router.get('/verify-setup-token', vendorController.verifySetupToken);
router.post('/setup-account', vendorController.setupVendorAccount);

// Vendor application & dashboard routes
router.post('/apply', optionalAuth, vendorController.applyToBecomeVendor);
router.get('/my-application', auth, vendorController.getMyVendorApplication);
router.post('/complete-registration', auth, vendorController.completeVendorRegistration);
router.get('/dashboard', auth, vendorController.getVendorDashboard);
router.post('/withdraw', auth, vendorController.requestWithdrawal);
router.get('/products', auth, vendorController.getVendorProducts);
router.get('/orders', auth, vendorController.getVendorOrders);
router.put('/orders/:orderId/products/:productId/status', auth, vendorController.updateProductStatus);
router.put('/orders/:orderId/products/:productId/tracking', auth, vendorController.addTrackingNumber);

// ═══════════════════════════════════════════════════════
// ADMIN ROUTES (before dynamic :shopSlug route)
// ═══════════════════════════════════════════════════════
router.get('/admin/all', auth, vendorController.getAllVendors);
router.post('/admin/:id/approve', auth, vendorController.approveVendor);
router.post('/admin/:id/reject', auth, vendorController.rejectVendor);
router.post('/admin/:id/suspend', auth, vendorController.suspendVendor);
router.post('/admin/:id/activate', auth, vendorController.activateVendor);
router.delete('/admin/:id', auth, vendorController.deleteVendor);
router.get('/admin/withdrawals', auth, vendorController.getAllWithdrawals);
router.put('/admin/withdrawals/:id/approve', auth, vendorController.approveWithdrawal);
router.put('/admin/withdrawals/:id/reject', auth, vendorController.rejectWithdrawal);

// ═══════════════════════════════════════════════════════
// DYNAMIC ROUTES LAST (catch-all pattern)
// ═══════════════════════════════════════════════════════
// Public vendor profile route - MUST BE LAST
router.get('/:shopSlug', vendorController.getVendorProfile);

export default router;
