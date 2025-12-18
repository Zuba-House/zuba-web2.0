import { Router } from 'express';
import auth from '../middlewares/auth.js';
import * as adminVendorController from '../controllers/adminVendor.controller.js';
import * as adminPayoutController from '../controllers/adminPayout.controller.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Check if user is admin (you can add admin middleware here)
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({
      error: true,
      success: false,
      message: 'Admin access only'
    });
  }
  next();
};

router.use(requireAdmin);

// Vendor management routes
router.get('/', adminVendorController.getAllVendors);
router.get('/:id', adminVendorController.getVendorById);
router.put('/:id', adminVendorController.updateVendor);
router.put('/:id/status', adminVendorController.updateVendorStatus);
router.put('/:id/withdrawal-access', adminVendorController.updateWithdrawalAccess);
router.delete('/:id', adminVendorController.deleteVendor);

// Payout management routes
router.get('/payouts/all', adminPayoutController.getAllPayouts);
router.get('/payouts/stats', adminPayoutController.getPayoutStats);
router.get('/payouts/:id', adminPayoutController.getPayoutById);
router.post('/payouts/:id/approve', adminPayoutController.approvePayout);
router.post('/payouts/:id/reject', adminPayoutController.rejectPayout);
router.post('/payouts/:id/mark-paid', adminPayoutController.markPayoutAsPaid);

export default router;

