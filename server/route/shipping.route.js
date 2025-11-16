import express from 'express';
import { optionalAuth } from '../middlewares/auth.js';
import * as shippingController from '../controllers/shipping.controller.js';

const router = express.Router();

// Public routes - anyone can get shipping rates
router.post('/rates', optionalAuth, shippingController.getShippingRates);
router.get('/track/:trackingNumber', shippingController.trackShipment);

// Protected routes (require authentication)
router.post('/create-shipment', optionalAuth, shippingController.createShipment);

export default router;

