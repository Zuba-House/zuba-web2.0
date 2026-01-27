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

/**
 * Middleware to allow product management for ADMIN or MARKETING_MANAGER roles
 * This allows users with these roles to create/update products even if not in email list
 * Products created by non-full-admins will require approval
 * 
 * AUTO-ASSIGNMENT: Any user who is NOT the super admin (olivier.niyo250@gmail.com)
 * will be automatically treated as MARKETING_MANAGER for product management
 */
export const requireProductManagementAccess = async (req, res, next) => {
  try {
    // Get user from request (should be set by auth middleware)
    const UserModel = (await import('../models/user.model.js')).default;
    const user = await UserModel.findById(req.userId).select('email role');
    
    if (!user) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'User not found'
      });
    }

    // Super admin email (only full admin)
    const SUPER_ADMIN_EMAIL = 'olivier.niyo250@gmail.com';
    const isSuperAdmin = user.email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase().trim();
    
    // Check if user is super admin OR has ADMIN/MARKETING_MANAGER role
    // If not super admin and role is not ADMIN/MARKETING_MANAGER, automatically treat as MARKETING_MANAGER
    let userRole = (user.role || '').toUpperCase();
    let shouldUpdateRole = false;
    
    if (isSuperAdmin) {
      // Super admin is always full admin
      userRole = 'ADMIN';
    } else {
      // Not super admin - automatically treat as MARKETING_MANAGER
      if (userRole !== 'ADMIN' && userRole !== 'MARKETING_MANAGER') {
        // User doesn't have admin/marketing manager role - assign it
        userRole = 'MARKETING_MANAGER';
        shouldUpdateRole = true;
        console.log('🔄 Auto-assigning MARKETING_MANAGER role to user:', user.email);
      }
    }

    // Update user role in database if needed (non-blocking)
    if (shouldUpdateRole) {
      UserModel.findByIdAndUpdate(req.userId, { role: 'MARKETING_MANAGER' }, { new: true })
        .then(updatedUser => {
          if (updatedUser) {
            console.log('✅ Successfully updated user role to MARKETING_MANAGER:', user.email);
          }
        })
        .catch(err => {
          console.error('⚠️ Failed to update user role (non-critical):', err.message);
        });
    }

    // Store user role and check if user is full admin (super admin only)
    req.userRole = userRole;
    req.isMarketingManager = userRole === 'MARKETING_MANAGER' || (!isSuperAdmin && userRole === 'ADMIN');
    req.isFullAdmin = isSuperAdmin; // Only super admin is full admin
    req.canAutoApprove = req.isFullAdmin; // Only super admin can auto-approve

    console.log('✅ Product management access granted:', {
      userId: req.userId,
      email: user.email,
      role: userRole,
      isSuperAdmin: isSuperAdmin,
      isFullAdmin: req.isFullAdmin,
      canAutoApprove: req.canAutoApprove,
      wasAutoAssigned: shouldUpdateRole
    });

    next();
  } catch (error) {
    console.error('Product management access check error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Authorization check failed'
    });
  }
};

export default requireAdminEmail;

