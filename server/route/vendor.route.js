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

// Admin routes
router.get('/admin/all', auth, vendorController.getAllVendors);
router.post('/admin/:id/approve', auth, vendorController.approveVendor);
router.post('/admin/:id/reject', auth, vendorController.rejectVendor);

export default router;

