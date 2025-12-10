// Assuming you already have auth middleware that sets req.user from JWT
// This middleware should be used AFTER your existing auth middleware

import VendorModel from '../models/vendor.model.js';

/**
 * Middleware to require vendor access
 * Must be used AFTER auth middleware that sets req.userId, req.userRole, req.vendorId
 */
const requireVendor = async (req, res, next) => {
  try {
    // Check if user is authenticated (from auth middleware)
    if (!req.userId) {
      return res.status(401).json({ 
        error: true,
        success: false,
        message: 'Not authenticated' 
      });
    }

    // Check role and vendorId (set by auth middleware)
    if (req.userRole !== 'VENDOR' || !req.vendorId) {
      return res.status(403).json({ 
        error: true,
        success: false,
        message: 'Vendor access only' 
      });
    }

    // Optionally fetch and attach vendor to request
    try {
      const vendor = await VendorModel.findById(req.vendorId);
      if (vendor) {
        req.vendor = vendor;
        // Ensure vendorId is set
        req.vendorId = vendor._id;
      }
    } catch (vendorError) {
      console.error('Error fetching vendor:', vendorError);
      // Continue anyway - vendorId is already set
    }

    next();
  } catch (error) {
    console.error('Vendor auth middleware error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Authentication error'
    });
  }
};

export { requireVendor };
export default { requireVendor };

