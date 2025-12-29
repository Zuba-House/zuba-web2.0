import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import * as couponController from '../controllers/coupon.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', optionalAuth, couponController.validateCoupon);
router.post('/apply', optionalAuth, couponController.applyCoupon);
router.get('/', couponController.getActiveCoupons);

// Admin routes - require authentication
router.post('/', auth, couponController.createCoupon);
router.get('/all', auth, couponController.getAllCoupons);
router.put('/:id', auth, couponController.updateCoupon);
router.delete('/:id', auth, couponController.deleteCoupon);

export default router;

