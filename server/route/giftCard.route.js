import express from 'express';
import auth, { optionalAuth } from '../middlewares/auth.js';
import { requireAdminPanelAccess } from '../middlewares/adminEmailCheck.js';
import * as giftCardController from '../controllers/giftCard.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', optionalAuth, giftCardController.validateGiftCard);
router.post('/apply', optionalAuth, giftCardController.applyGiftCard);

// User routes
router.get('/my-cards', optionalAuth, giftCardController.getMyGiftCards);

// Admin/Marketing Manager routes - require authentication and admin panel access
router.post('/', auth, requireAdminPanelAccess, giftCardController.createGiftCard);
router.get('/all', auth, requireAdminPanelAccess, giftCardController.getAllGiftCards);
router.put('/:id', auth, requireAdminPanelAccess, giftCardController.updateGiftCard);
router.post('/:id/add-balance', auth, requireAdminPanelAccess, giftCardController.addBalance);

export default router;

