import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';
import VendorModel from '../models/vendor.model.js';

/**
 * Middleware to require vendor authentication
 * Checks if user is logged in AND has vendor role AND vendor is approved
 */
export const requireVendor = async (req, res, next) => {
  try {
    // First check if user is authenticated
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.accessToken || 
                  req.query?.token;

    if (!token) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'Authentication token required'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          success: false,
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        error: true,
        success: false,
        message: 'Invalid token'
      });
    }

    // Get user from database
    const user = await UserModel.findById(decoded.id || decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Account is not active'
      });
    }

    // Check if user has VENDOR role
    if (user.role !== 'VENDOR') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Vendor access only'
      });
    }

    // Check if user has vendorId
    if (!user.vendorId) {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'No vendor account linked'
      });
    }

    // Get vendor and check status
    const vendor = await VendorModel.findById(user.vendorId);
    
    if (!vendor) {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Vendor account not found'
      });
    }

    // Check vendor status
    if (vendor.status !== 'APPROVED') {
      return res.status(403).json({
        error: true,
        success: false,
        message: `Vendor account is ${vendor.status}. Please wait for approval.`,
        vendorStatus: vendor.status
      });
    }

    // Attach user and vendor to request
    req.userId = user._id;
    req.user = user;
    req.vendorId = vendor._id;
    req.vendor = vendor;

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

/**
 * Optional vendor check - allows access if vendor exists but doesn't require approval
 * Useful for onboarding flows
 */
export const optionalVendor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.accessToken || 
                  req.query?.token;

    if (!token) {
      return next(); // Continue without vendor context
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
      const user = await UserModel.findById(decoded.id || decoded.userId).select('-password');
      
      if (user && user.role === 'VENDOR' && user.vendorId) {
        const vendor = await VendorModel.findById(user.vendorId);
        if (vendor) {
          req.userId = user._id;
          req.user = user;
          req.vendorId = vendor._id;
          req.vendor = vendor;
        }
      }
    } catch (error) {
      // Continue without vendor context
    }

    next();
  } catch (error) {
    next(); // Continue on error
  }
};

