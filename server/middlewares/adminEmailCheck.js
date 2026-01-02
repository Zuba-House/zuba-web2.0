import { isAdminEmail } from '../config/adminEmails.js';

/**
 * Middleware to check if user's email is in the admin email list
 * This is an additional security layer on top of role-based checks
 */
export const requireAdminEmail = async (req, res, next) => {
  try {
    // Get user email from request (should be set by auth middleware)
    const UserModel = (await import('../models/user.model.js')).default;
    const user = await UserModel.findById(req.userId).select('email role');
    
    if (!user) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is in admin list
    if (!isAdminEmail(user.email)) {
      console.log('❌ Admin email check failed:', {
        userId: req.userId,
        email: user.email,
        role: user.role,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Access denied. Admin email required. Your email must be in the admin email list to perform this action.',
        code: 'ADMIN_EMAIL_REQUIRED'
      });
    }

    // Also ensure role is ADMIN
    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('✅ Admin email check passed:', {
      userId: req.userId,
      email: user.email,
      role: userRole
    });

    next();
  } catch (error) {
    console.error('Admin email check error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Authorization check failed'
    });
  }
};

export default requireAdminEmail;

