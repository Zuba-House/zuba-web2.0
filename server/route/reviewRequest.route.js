import { Router } from 'express';
import auth from '../middlewares/auth.js';
import requireAdminEmail from '../middlewares/adminEmailCheck.js';
import {
    sendReviewRequests,
    getReviewRequests,
    getReviewRequest,
    approveReviewRequest,
    rejectReviewRequest,
    toggleReviewRequest,
    getReviewRequestByToken,
    submitReviewFromRequest
} from '../controllers/reviewRequest.controller.js';

const router = Router();

// Public routes (for customers)
router.get('/:token', getReviewRequestByToken);
router.post('/:token/submit', submitReviewFromRequest);

// Admin routes (require full admin access)
router.use(auth);
router.use(requireAdminEmail);

router.post('/send', sendReviewRequests);
router.get('/', getReviewRequests);
router.get('/:id', getReviewRequest);
router.post('/:id/approve', approveReviewRequest);
router.post('/:id/reject', rejectReviewRequest);

export default router;

