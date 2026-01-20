import { isAdminEmail, canAccessAdminPanel, isMarketingManagerEmail } from '../config/adminEmails.js';

/**
 * Middleware to check if user can access admin panel (ADMIN or MARKETING_MANAGER)
 * This allows both full admins and marketing managers to access the admin panel
 */
export const requireAdminPanelAccess = async (req, res, next) => {
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

    // Check if email can access admin panel (admin or marketing manager)
    if (!canAccessAdminPanel(user.email)) {
      console.log('❌ Admin panel access check failed:', {
        userId: req.userId,
        email: user.email,
        role: user.role,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Access denied. Your email must be authorized to access the admin panel.',
        code: 'ADMIN_PANEL_ACCESS_REQUIRED'
      });
    }

    // Ensure role is ADMIN or MARKETING_MANAGER
    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'MARKETING_MANAGER') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Admin or Marketing Manager access required'
      });
    }

    // Store user role in request for use in other middlewares
    req.userRole = userRole;
    req.isMarketingManager = userRole === 'MARKETING_MANAGER';

    console.log('✅ Admin panel access check passed:', {
      userId: req.userId,
      email: user.email,
      role: userRole
    });

    next();
  } catch (error) {
    console.error('Admin panel access check error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Authorization check failed'
    });
  }
};

/**
 * Middleware to check if user's email is in the admin email list (FULL ADMIN ONLY)
 * This is for routes that require full admin access (orders, users, etc.)
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

    // Check if email is in admin list (full admin only, not marketing manager)
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
        message: 'Access denied. Full admin access required. Your email must be in the admin email list to perform this action.',
        code: 'ADMIN_EMAIL_REQUIRED'
      });
    }

    // Also ensure role is ADMIN (not MARKETING_MANAGER)
    const userRole = (user.role || '').toUpperCase();
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Full admin access required. Marketing managers do not have access to this feature.'
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

