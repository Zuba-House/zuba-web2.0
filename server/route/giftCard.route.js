import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import requireAdminEmail from '../middlewares/adminEmailCheck.js';
import * as giftCardController from '../controllers/giftCard.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', optionalAuth, giftCardController.validateGiftCard);
router.post('/apply', optionalAuth, giftCardController.applyGiftCard);

// User routes
router.get('/my-cards', optionalAuth, giftCardController.getMyGiftCards);

// Admin routes - require authentication and admin email
router.post('/', auth, requireAdminEmail, giftCardController.createGiftCard);
router.get('/all', auth, requireAdminEmail, giftCardController.getAllGiftCards);
router.put('/:id', auth, requireAdminEmail, giftCardController.updateGiftCard);
router.post('/:id/add-balance', auth, requireAdminEmail, giftCardController.addBalance);

export default router;

