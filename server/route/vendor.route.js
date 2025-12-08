import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import * as vendorController from '../controllers/vendor.controller.js';

const router = express.Router();

// Public routes
router.get('/:shopSlug', vendorController.getVendorProfile);

// Vendor routes (allow guest applications)
router.post('/apply', optionalAuth, vendorController.applyToBecomeVendor);
router.get('/my-application', auth, vendorController.getMyVendorApplication);
router.post('/complete-registration', auth, vendorController.completeVendorRegistration);
router.get('/dashboard', auth, vendorController.getVendorDashboard);
router.post('/withdraw', auth, vendorController.requestWithdrawal);
router.get('/products', auth, vendorController.getVendorProducts);

// Account setup routes (for guest vendors after approval)
router.get('/verify-setup-token', vendorController.verifySetupToken);
router.post('/setup-account', vendorController.setupVendorAccount);

// OTP routes (public)
router.post('/send-otp', vendorController.sendVendorOTP);
router.post('/verify-otp', vendorController.verifyVendorOTP);

// Admin routes
router.get('/admin/all', auth, vendorController.getAllVendors);
router.post('/admin/:id/approve', auth, vendorController.approveVendor);
router.post('/admin/:id/reject', auth, vendorController.rejectVendor);
router.post('/admin/:id/suspend', auth, vendorController.suspendVendor);
router.post('/admin/:id/activate', auth, vendorController.activateVendor);
router.delete('/admin/:id', auth, vendorController.deleteVendor);

export default router;

