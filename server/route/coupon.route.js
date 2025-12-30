import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import requireAdminEmail from '../middlewares/adminEmailCheck.js';
import * as couponController from '../controllers/coupon.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', optionalAuth, couponController.validateCoupon);
router.post('/apply', optionalAuth, couponController.applyCoupon);
router.get('/', couponController.getActiveCoupons);

// Admin routes - require authentication and admin email
router.post('/', auth, requireAdminEmail, couponController.createCoupon);
router.get('/all', auth, requireAdminEmail, couponController.getAllCoupons);
router.put('/:id', auth, requireAdminEmail, couponController.updateCoupon);
router.delete('/:id', auth, requireAdminEmail, couponController.deleteCoupon);

export default router;

