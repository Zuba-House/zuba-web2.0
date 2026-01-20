import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import { requireAdminPanelAccess } from '../middlewares/adminEmailCheck.js';
import * as couponController from '../controllers/coupon.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', optionalAuth, couponController.validateCoupon);
router.post('/apply', optionalAuth, couponController.applyCoupon);
router.get('/', couponController.getActiveCoupons);

// Admin/Marketing Manager routes - require authentication and admin panel access
router.post('/', auth, requireAdminPanelAccess, couponController.createCoupon);
router.get('/all', auth, requireAdminPanelAccess, couponController.getAllCoupons);
router.put('/:id', auth, requireAdminPanelAccess, couponController.updateCoupon);
router.delete('/:id', auth, requireAdminPanelAccess, couponController.deleteCoupon);

export default router;

