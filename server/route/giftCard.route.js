import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import * as giftCardController from '../controllers/giftCard.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', optionalAuth, giftCardController.validateGiftCard);
router.post('/apply', optionalAuth, giftCardController.applyGiftCard);

// User routes
router.get('/my-cards', optionalAuth, giftCardController.getMyGiftCards);

// Admin routes - require authentication
router.post('/', auth, giftCardController.createGiftCard);
router.get('/all', auth, giftCardController.getAllGiftCards);
router.put('/:id', auth, giftCardController.updateGiftCard);
router.post('/:id/add-balance', auth, giftCardController.addBalance);

export default router;

