/**
 * Vendor Controller
 * Handles vendor application, approval, and management
 */

import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import ProductModel from '../models/product.model.js';
import sendEmailFun from '../config/sendEmail.js';
import bcryptjs from 'bcryptjs';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import genertedRefreshToken from '../utils/generatedRefreshToken.js';

/**
 * Send OTP for vendor email verification
 * POST /api/vendors/send-otp
 */
export const sendVendorOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if vendor application already exists with this email
    let vendor = await VendorModel.findOne({ email: email.toLowerCase().trim() });
    
    if (vendor) {
      // Update existing vendor's OTP
      vendor.otp = otp;
      vendor.otpExpires = otpExpires;
      await vendor.save();
    } else {
      // Create temporary vendor record for OTP (will be updated on application submission)
      vendor = new VendorModel({
        email: email.toLowerCase().trim(),
        otp: otp,
        otpExpires: otpExpires,
        status: 'pending'
      });
      await vendor.save();
    }

    // Send OTP email
    try {
      const VerificationEmail = (await import('../utils/verifyEmailTemplate.js')).default;
      
      await sendEmailFun({
        sendTo: email.toLowerCase().trim(),
        subject: 'Verify Your Email - Vendor Application - Zuba House',
        text: '',
        html: VerificationEmail('Vendor Applicant', otp)
      });

      return res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: 10 // minutes
      });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Send vendor OTP error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
};

/**
 * Verify OTP for vendor email
 * POST /api/vendors/verify-otp
 */
export const verifyVendorOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    const vendor = await VendorModel.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!vendor) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this email. Please request a new OTP.'
      });
    }

    // Check if OTP matches
    if (vendor.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please check and try again.'
      });
    }

    // Check if OTP is expired
    if (!vendor.otpExpires || new Date() > vendor.otpExpires) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Mark email as verified
    vendor.emailVerified = true;
    vendor.otp = null; // Clear OTP after verification
    vendor.otpExpires = null;
    await vendor.save();

    return res.json({
      success: true,
      message: 'Email verified successfully',
      emailVerified: true
    });

  } catch (error) {
    console.error('Verify vendor OTP error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
};

/**
 * Apply to become a vendor
 * POST /api/vendors/apply
 */
export const applyToBecomeVendor = async (req, res) => {
  try {
    const userId = req.userId; // May be undefined for guest applications
    
    const {
      shopName,
      shopDescription,
      businessName,
      businessType,
      phone,
      email,
      address,
      taxId,
      registrationNumber,
      name // User's name for guest applications
    } = req.body;

    // Validate required fields (email verification is already done via OTP)
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Now validate other required fields (only after email is verified)
    if (!shopName || !businessName || !businessType || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shopName, businessName, businessType, phone'
      });
    }

    // Check if email is verified
    const existingVendor = await VendorModel.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!existingVendor || !existingVendor.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email verification is required. Please verify your email with OTP first.'
      });
    }

    // Generate shop slug
    const shopSlug = shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if shop name is already taken
    const shopNameExists = await VendorModel.findOne({ shopSlug });
    if (shopNameExists) {
      return res.status(400).json({
        success: false,
        error: 'Shop name is already taken. Please choose another name.'
      });
    }

    // For logged-in users, check if they already have an application
    if (userId) {
      const existingVendor = await VendorModel.findOne({ userId });
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          error: 'You already have a vendor application. Status: ' + existingVendor.status
        });
      }
    } else {
      // For guest applications, check if email is already used
      const existingVendorByEmail = await VendorModel.findOne({ email: email.toLowerCase().trim() });
      if (existingVendorByEmail) {
        return res.status(400).json({
          success: false,
          error: 'An application with this email already exists. Please login to check your application status.'
        });
      }
    }

    // Update existing vendor record (created during OTP verification) with full application data
    // Note: userId can be null for guest applications - use undefined to avoid sparse index issues
    existingVendor.shopName = shopName.trim();
    existingVendor.shopSlug = shopSlug;
    existingVendor.shopDescription = shopDescription || '';
    existingVendor.businessName = businessName.trim();
    existingVendor.businessType = businessType;
    existingVendor.phone = phone.trim();
    existingVendor.address = address || {};
    existingVendor.taxId = taxId || '';
    existingVendor.registrationNumber = registrationNumber || '';
    existingVendor.status = 'pending';
    
    // Only add userId if it exists (to avoid null in sparse index)
    if (userId) {
      existingVendor.userId = userId;
    }

    await existingVendor.save();
    
    // Update user role if user is logged in (but keep as USER until approved)
    if (userId) {
      await UserModel.findByIdAndUpdate(userId, {
        vendorId: existingVendor._id
      });
    }

    // Send confirmation email to vendor (separate from verification email)
    try {
      const recipientName = userId ? (await UserModel.findById(userId))?.name : (name || 'Applicant');
      const recipientEmail = email.toLowerCase().trim();
      
      await sendEmailFun({
        sendTo: recipientEmail,
        subject: 'Vendor Application Received - Zuba House',
        text: '',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0b2735 0%, #1a4a5c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #efb291; font-size: 24px;">Application Received!</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${recipientName}</strong>,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                We have received your application to become a vendor on Zuba House.
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #efb291; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #0b2735; font-size: 15px;"><strong>Application Status:</strong> <span style="color: #ffc107;">Pending Review</span></p>
                <p style="margin: 5px 0 0 0; color: #555; font-size: 14px;">Shop Name: <strong>${shopName.trim()}</strong></p>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                <strong>📧 Important:</strong> Please check your email and verify your email address to complete your application. Our team will review your application and get back to you within 2-3 business days.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                You will receive an email notification once your application has been reviewed.
              </p>
              ${!userId ? '<p style="color: #856404; background-color: #fff3cd; padding: 15px; border-radius: 5px; font-size: 14px;"><strong>Note:</strong> To track your application status, please create an account using the same email address after your application is approved.</p>' : ''}
              <p style="color: #333; font-size: 14px; margin-top: 30px;">
                Thank you for your interest in selling on Zuba House!
              </p>
              <p style="color: #333; font-size: 14px;">
                Best regards,<br>
                <strong>The Zuba House Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending vendor application email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Vendor application submitted successfully. Please check your email to verify your email address.',
      vendor: {
        id: vendor._id,
        shopName: vendor.shopName,
        status: vendor.status,
        emailVerified: vendor.emailVerified
      }
    });

  } catch (error) {
    console.error('Apply to become vendor error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'userId') {
        return res.status(400).json({
          success: false,
          error: 'You already have a vendor application with this account.'
        });
      }
      return res.status(400).json({
        success: false,
        error: `${field} is already taken.`
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit vendor application'
    });
  }
};


/**
 * Get vendor application status
 * GET /api/vendors/my-application
 */
export const getMyVendorApplication = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const vendor = await VendorModel.findOne({ userId })
      .populate('userId', 'name email avatar')
      .select('-bankAccount -adminNotes -emailVerificationToken');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'No vendor application found'
      });
    }

    return res.json({
      success: true,
      vendor
    });

  } catch (error) {
    console.error('Get vendor application error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendor application'
    });
  }
};

/**
 * Complete vendor registration (after approval)
 * POST /api/vendors/complete-registration
 */
export const completeVendorRegistration = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const vendor = await VendorModel.findOne({ userId });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor application not found'
      });
    }

    if (vendor.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Your vendor application has not been approved yet'
      });
    }

    const {
      shopLogo,
      shopBanner,
      bankAccount,
      verificationDocuments
    } = req.body;

    // Update vendor profile
    if (shopLogo) vendor.shopLogo = shopLogo;
    if (shopBanner) vendor.shopBanner = shopBanner;
    if (bankAccount) vendor.bankAccount = bankAccount;
    if (verificationDocuments) vendor.verificationDocuments = verificationDocuments;

    await vendor.save();

    // Update user role to VENDOR
    await UserModel.findByIdAndUpdate(userId, {
      role: 'VENDOR'
    });

    return res.json({
      success: true,
      message: 'Vendor registration completed successfully',
      vendor
    });

  } catch (error) {
    console.error('Complete vendor registration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete vendor registration'
    });
  }
};

/**
 * Setup vendor account (for guest applications after approval)
 * POST /api/vendors/setup-account
 */
export const setupVendorAccount = async (req, res) => {
  try {
    const { token, email, password, name } = req.body;

    if (!token || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, email, password, name'
      });
    }

    // Find vendor by setup token
    const vendor = await VendorModel.findOne({
      setupToken: token,
      email: email.toLowerCase().trim(),
      status: 'approved'
    });

    if (!vendor) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired setup token'
      });
    }

    // Check if token is expired
    if (vendor.setupTokenExpires && new Date() > vendor.setupTokenExpires) {
      return res.status(400).json({
        success: false,
        error: 'Setup token has expired. Please contact support for a new link.'
      });
    }

    // Check if account already created
    if (vendor.accountCreated || vendor.userId) {
      return res.status(400).json({
        success: false,
        error: 'Account has already been created for this vendor application'
      });
    }

    // Check if user with this email already exists
    let user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
    if (user) {
      // User exists, link vendor to existing account
      vendor.userId = user._id;
      vendor.accountCreated = true;
      vendor.setupToken = null; // Clear token
      vendor.setupTokenExpires = null;
      await vendor.save();

      // Update user
      user.vendorId = vendor._id;
      user.role = 'VENDOR';
      await user.save();

      // Generate tokens
      const accesstoken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);

      return res.json({
        success: true,
        message: 'Vendor account linked successfully',
        data: {
          accesstoken,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          vendor: {
            id: vendor._id,
            shopName: vendor.shopName,
            status: vendor.status
          }
        }
      });
    } else {
      // Create new user account
      const salt = await bcryptjs.genSalt(10);
      const hashPassword = await bcryptjs.hash(password, salt);

      user = new UserModel({
        email: email.toLowerCase().trim(),
        password: hashPassword,
        name: name.trim(),
        verify_email: true, // Auto-verify since they came from approved vendor application
        role: 'VENDOR',
        vendorId: vendor._id
      });

      await user.save();

      // Link vendor to user
      vendor.userId = user._id;
      vendor.accountCreated = true;
      vendor.setupToken = null; // Clear token
      vendor.setupTokenExpires = null;
      await vendor.save();

      // Generate tokens
      const accesstoken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);

      return res.json({
        success: true,
        message: 'Vendor account created successfully',
        data: {
          accesstoken,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          vendor: {
            id: vendor._id,
            shopName: vendor.shopName,
            status: vendor.status
          }
        }
      });
    }

  } catch (error) {
    console.error('Setup vendor account error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to setup vendor account'
    });
  }
};

/**
 * Verify setup token
 * GET /api/vendors/verify-setup-token
 */
export const verifySetupToken = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: 'Token and email are required'
      });
    }

    const vendor = await VendorModel.findOne({
      setupToken: token,
      email: email.toLowerCase().trim(),
      status: 'approved'
    }).select('shopName setupTokenExpires accountCreated userId');

    if (!vendor) {
      return res.status(400).json({
        success: false,
        error: 'Invalid setup token'
      });
    }

    // Check if token is expired
    if (vendor.setupTokenExpires && new Date() > vendor.setupTokenExpires) {
      return res.status(400).json({
        success: false,
        error: 'Setup token has expired',
        expired: true
      });
    }

    // Check if account already created
    if (vendor.accountCreated || vendor.userId) {
      return res.status(400).json({
        success: false,
        error: 'Account has already been created',
        alreadyCreated: true
      });
    }

    return res.json({
      success: true,
      vendor: {
        shopName: vendor.shopName,
        email: email
      }
    });

  } catch (error) {
    console.error('Verify setup token error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify setup token'
    });
  }
};

/**
 * Get vendor profile (public)
 * GET /api/vendors/:shopSlug
 */
export const getVendorProfile = async (req, res) => {
  try {
    const { shopSlug } = req.params;

    const vendor = await VendorModel.findOne({ 
      shopSlug,
      status: 'approved'
    })
      .populate('userId', 'name avatar')
      .select('-bankAccount -adminNotes -rejectionReason -setupToken -emailVerificationToken');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    return res.json({
      success: true,
      vendor
    });

  } catch (error) {
    console.error('Get vendor profile error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendor profile'
    });
  }
};

/**
 * Get vendor dashboard data
 * GET /api/vendors/dashboard
 */
export const getVendorDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const vendor = await VendorModel.findOne({ userId });
    
    if (!vendor || vendor.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Vendor access denied'
      });
    }

    // Get vendor products count
    const productsCount = await ProductModel.countDocuments({ vendorId: vendor._id });
    
    // Get published products count
    const publishedProductsCount = await ProductModel.countDocuments({ 
      vendorId: vendor._id,
      status: 'published'
    });

    // Get pending products count
    const pendingProductsCount = await ProductModel.countDocuments({ 
      vendorId: vendor._id,
      status: 'pending'
    });

    // Update vendor stats
    vendor.stats.totalProducts = productsCount;
    await vendor.save();

    return res.json({
      success: true,
      dashboard: {
        vendor: {
          id: vendor._id,
          shopName: vendor.shopName,
          status: vendor.status,
          isVerified: vendor.isVerified,
          emailVerified: vendor.emailVerified
        },
        earnings: vendor.earnings,
        stats: {
          ...vendor.stats,
          totalProducts: productsCount,
          publishedProducts: publishedProductsCount,
          pendingProducts: pendingProductsCount
        }
      }
    });

  } catch (error) {
    console.error('Get vendor dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendor dashboard'
    });
  }
};

/**
 * Admin: Get all vendor applications
 * GET /api/vendors/admin/all
 */
export const getAllVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const vendors = await VendorModel.find(query)
      .populate('userId', 'name email avatar')
      .populate('approvedBy', 'name email')
      .select('-bankAccount -setupToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VendorModel.countDocuments(query);

    return res.json({
      success: true,
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all vendors error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendors'
    });
  }
};

/**
 * Admin: Approve vendor application
 * POST /api/vendors/admin/:id/approve
 */
export const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    const vendor = await VendorModel.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor application not found'
      });
    }

    if (vendor.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Vendor is already approved'
      });
    }

    // Check if email is verified
    // Email verification is already done during application submission (OTP verification)
    // No need to check again - emailVerified is set to true when OTP is verified

    vendor.status = 'approved';
    vendor.approvalDate = new Date();
    vendor.approvedBy = adminId;
    
    // Generate secure setup token for account creation (valid for 7 days)
    const crypto = await import('crypto');
    const setupToken = crypto.randomBytes(32).toString('hex');
    vendor.setupToken = setupToken;
    vendor.setupTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await vendor.save();

    // Send comprehensive approval email
    try {
      const user = vendor.userId ? await UserModel.findById(vendor.userId) : null;
      const recipientEmail = vendor.email;
      const recipientName = user ? user.name : (vendor.businessName || 'Vendor');
      
      // Create account setup link
      const setupLink = `${process.env.CLIENT_URL || 'https://www.zubahouse.com'}/vendor/setup-account?token=${setupToken}&email=${encodeURIComponent(recipientEmail)}`;
      
      // Dashboard link (for existing users)
      const dashboardLink = `${process.env.CLIENT_URL || 'https://www.zubahouse.com'}/vendor/dashboard`;
      
      await sendEmailFun({
        sendTo: recipientEmail,
        subject: '🎉 Congratulations! Your Vendor Application Has Been Approved - Zuba House',
        text: '',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #0b2735 0%, #1a4a5c 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; color: #efb291; font-size: 28px; font-weight: bold;">🎉 Congratulations!</h1>
                        <p style="margin: 10px 0 0 0; color: #e5e2db; font-size: 16px;">Your Vendor Application Has Been Approved</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                          Dear <strong>${recipientName}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                          We are thrilled to inform you that your vendor application has been <strong style="color: #0b2735;">APPROVED</strong>! 🎊
                        </p>
                        
                        <div style="background-color: #f8f9fa; border-left: 4px solid #efb291; padding: 20px; margin: 25px 0; border-radius: 5px;">
                          <p style="margin: 0 0 10px 0; color: #0b2735; font-size: 18px; font-weight: bold;">Your Shop Details:</p>
                          <p style="margin: 5px 0; color: #555; font-size: 15px;"><strong>Shop Name:</strong> ${vendor.shopName}</p>
                          <p style="margin: 5px 0; color: #555; font-size: 15px;"><strong>Shop URL:</strong> <a href="${process.env.CLIENT_URL || 'https://www.zubahouse.com'}/vendor/${vendor.shopSlug}" style="color: #efb291; text-decoration: none;">zubahouse.com/vendor/${vendor.shopSlug}</a></p>
                          <p style="margin: 5px 0; color: #555; font-size: 15px;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✓ Approved</span></p>
                        </div>
                        
                        ${!user ? `
                        <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
                          <p style="margin: 0 0 15px 0; color: #856404; font-size: 16px; font-weight: bold;">📝 Next Step: Create Your Account</p>
                          <p style="margin: 0 0 15px 0; color: #856404; font-size: 14px; line-height: 1.6;">
                            To access your vendor dashboard and start selling, you need to create an account. Click the button below to set up your password and complete your vendor profile.
                          </p>
                          <div style="text-align: center; margin: 20px 0;">
                            <a href="${setupLink}" style="background: linear-gradient(135deg, #efb291 0%, #e5a67d 100%); color: #0b2735; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s;">
                              🚀 Create Account & Access Dashboard
                            </a>
                          </div>
                          <p style="margin: 15px 0 0 0; color: #856404; font-size: 12px; text-align: center;">
                            This link will expire in 7 days for security reasons.
                          </p>
                        </div>
                        ` : `
                        <div style="background-color: #d4edda; border: 2px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 5px;">
                          <p style="margin: 0 0 15px 0; color: #155724; font-size: 16px; font-weight: bold;">✅ Account Ready</p>
                          <p style="margin: 0 0 15px 0; color: #155724; font-size: 14px; line-height: 1.6;">
                            Since you already have an account, you can access your vendor dashboard immediately!
                          </p>
                          <div style="text-align: center; margin: 20px 0;">
                            <a href="${dashboardLink}" style="background: linear-gradient(135deg, #efb291 0%, #e5a67d 100%); color: #0b2735; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                              🎯 Go to Vendor Dashboard
                            </a>
                          </div>
                        </div>
                        `}
                        
                        <div style="margin: 30px 0;">
                          <p style="margin: 0 0 15px 0; color: #0b2735; font-size: 18px; font-weight: bold;">What You Can Do Now:</p>
                          <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 2;">
                            <li>📦 <strong>Upload Products:</strong> Add your products and start selling to millions of customers</li>
                            <li>💰 <strong>Set Pricing:</strong> Manage your product prices and create special offers</li>
                            <li>🏷️ <strong>Create Promotions:</strong> Set up discounts and promotional campaigns</li>
                            <li>📊 <strong>Track Sales:</strong> Monitor your sales, orders, and customer reviews</li>
                            <li>💵 <strong>Manage Earnings:</strong> View your earnings and request withdrawals</li>
                            <li>📈 <strong>Analytics:</strong> Access detailed analytics about your shop performance</li>
                          </ul>
                        </div>
                        
                        <div style="background-color: #e7f3ff; border-left: 4px solid #0b2735; padding: 15px; margin: 25px 0; border-radius: 5px;">
                          <p style="margin: 0 0 10px 0; color: #0b2735; font-size: 15px; font-weight: bold;">💡 Pro Tips:</p>
                          <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
                            <li>Complete your shop profile with logo and banner for better visibility</li>
                            <li>Add detailed product descriptions and high-quality images</li>
                            <li>Set competitive prices to attract more customers</li>
                            <li>Respond to customer reviews to build trust</li>
                            <li>Use promotions to boost sales during special events</li>
                          </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0; padding-top: 30px; border-top: 2px solid #e5e2db;">
                          <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">Need Help?</p>
                          <p style="margin: 0; color: #555; font-size: 14px;">
                            Visit our <a href="${process.env.CLIENT_URL || 'https://www.zubahouse.com'}/help-center" style="color: #efb291; text-decoration: none; font-weight: bold;">Help Center</a> or 
                            <a href="mailto:support@zubahouse.com" style="color: #efb291; text-decoration: none; font-weight: bold;">contact support</a>
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #0b2735; padding: 30px; text-align: center; border-radius: 0 0 10px 10px;">
                        <p style="margin: 0 0 10px 0; color: #e5e2db; font-size: 14px;">Welcome to the Zuba House Vendor Family!</p>
                        <p style="margin: 0; color: #efb291; font-size: 16px; font-weight: bold;">We're excited to have you on board! 🚀</p>
                        <p style="margin: 15px 0 0 0; color: #e5e2db; font-size: 12px;">
                          Best regards,<br>
                          <strong>The Zuba House Team</strong>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Vendor approved successfully',
      vendor
    });

  } catch (error) {
    console.error('Approve vendor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve vendor'
    });
  }
};

/**
 * Admin: Reject vendor application
 * POST /api/vendors/admin/:id/reject
 */
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const vendor = await VendorModel.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor application not found'
      });
    }

    vendor.status = 'rejected';
    vendor.rejectionDate = new Date();
    vendor.rejectionReason = reason || 'Application did not meet our requirements';
    vendor.approvedBy = adminId;
    await vendor.save();

    // Send rejection email
    try {
      const user = vendor.userId ? await UserModel.findById(vendor.userId) : null;
      const recipientEmail = vendor.email;
      const recipientName = user ? user.name : (vendor.businessName || 'Applicant');
      
      await sendEmailFun({
        sendTo: recipientEmail,
        subject: 'Vendor Application Status - Zuba House',
        text: '',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Application Status Update</h2>
            <p>Dear ${recipientName},</p>
            <p>We regret to inform you that your vendor application has been <strong>rejected</strong>.</p>
            <p><strong>Reason:</strong> ${vendor.rejectionReason}</p>
            <p>If you have any questions or would like to reapply, please contact our support team.</p>
            <p>Best regards,<br>Zuba House Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Vendor application rejected',
      vendor
    });

  } catch (error) {
    console.error('Reject vendor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject vendor'
    });
  }
};

/**
 * Admin: Suspend vendor
 * POST /api/vendors/admin/:id/suspend
 */
export const suspendVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const vendor = await VendorModel.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    if (vendor.status === 'suspended') {
      return res.status(400).json({
        success: false,
        error: 'Vendor is already suspended'
      });
    }

    const previousStatus = vendor.status;
    vendor.status = 'suspended';
    vendor.adminNotes = (vendor.adminNotes || '') + `\n[Suspended by admin on ${new Date().toISOString()}] Reason: ${reason || 'No reason provided'}`;
    await vendor.save();

    // Send suspension email
    try {
      const user = vendor.userId ? await UserModel.findById(vendor.userId) : null;
      const recipientEmail = vendor.email;
      const recipientName = user ? user.name : (vendor.businessName || 'Vendor');
      
      await sendEmailFun({
        sendTo: recipientEmail,
        subject: 'Vendor Account Suspended - Zuba House',
        text: '',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Account Suspended</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${recipientName}</strong>,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                We regret to inform you that your vendor account has been <strong style="color: #dc3545;">suspended</strong>.
              </p>
              ${reason ? `<div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #721c24; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
              </div>` : ''}
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                During this suspension, you will not be able to:
              </p>
              <ul style="color: #555; font-size: 14px; line-height: 1.8;">
                <li>Add or edit products</li>
                <li>Receive new orders</li>
                <li>Access your vendor dashboard</li>
                <li>Request withdrawals</li>
              </ul>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                If you have any questions or believe this is an error, please contact our support team immediately.
              </p>
              <p style="color: #333; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                <strong>The Zuba House Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending suspension email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Vendor suspended successfully',
      vendor: {
        id: vendor._id,
        shopName: vendor.shopName,
        status: vendor.status,
        previousStatus
      }
    });

  } catch (error) {
    console.error('Suspend vendor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to suspend vendor'
    });
  }
};

/**
 * Admin: Activate/Reactivate vendor
 * POST /api/vendors/admin/:id/activate
 */
export const activateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    const vendor = await VendorModel.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    if (vendor.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Vendor is already active'
      });
    }

    const previousStatus = vendor.status;
    vendor.status = 'approved';
    vendor.adminNotes = (vendor.adminNotes || '') + `\n[Reactivated by admin on ${new Date().toISOString()}]`;
    await vendor.save();

    // Send activation email
    try {
      const user = vendor.userId ? await UserModel.findById(vendor.userId) : null;
      const recipientEmail = vendor.email;
      const recipientName = user ? user.name : (vendor.businessName || 'Vendor');
      
      await sendEmailFun({
        sendTo: recipientEmail,
        subject: 'Vendor Account Reactivated - Zuba House',
        text: '',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Account Reactivated</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${recipientName}</strong>,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Great news! Your vendor account has been <strong style="color: #28a745;">reactivated</strong>.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                You can now access your vendor dashboard and continue selling on Zuba House.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'https://www.zubahouse.com'}/vendor/dashboard" style="background: linear-gradient(135deg, #efb291 0%, #e5a67d 100%); color: #0b2735; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  Access Dashboard
                </a>
              </div>
              <p style="color: #333; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                <strong>The Zuba House Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending activation email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Vendor activated successfully',
      vendor: {
        id: vendor._id,
        shopName: vendor.shopName,
        status: vendor.status,
        previousStatus
      }
    });

  } catch (error) {
    console.error('Activate vendor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to activate vendor'
    });
  }
};

/**
 * Admin: Delete vendor
 * DELETE /api/vendors/admin/:id
 */
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    const vendor = await VendorModel.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Check if vendor has products
    const productsCount = await ProductModel.countDocuments({ vendorId: vendor._id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete vendor. They have ${productsCount} product(s). Please remove or reassign products first.`
      });
    }

    // Check if vendor has earnings
    if (vendor.earnings.totalEarnings > 0 || vendor.earnings.availableBalance > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete vendor with earnings. Please process withdrawals first.'
      });
    }

    const vendorData = {
      shopName: vendor.shopName,
      email: vendor.email
    };

    // Remove vendorId from user if exists
    if (vendor.userId) {
      await UserModel.findByIdAndUpdate(vendor.userId, {
        $unset: { vendorId: 1 },
        role: 'USER' // Revert role to USER
      });
    }

    // Delete vendor
    await VendorModel.findByIdAndDelete(id);

    // Send deletion notification email
    try {
      await sendEmailFun({
        sendTo: vendor.email,
        subject: 'Vendor Account Deleted - Zuba House',
        text: '',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: #6c757d; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Account Deleted</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Dear Vendor,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                This is to inform you that your vendor account for "<strong>${vendorData.shopName}</strong>" has been deleted from our system.
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                If you have any questions or believe this is an error, please contact our support team immediately.
              </p>
              <p style="color: #333; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                <strong>The Zuba House Team</strong>
              </p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending deletion email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Vendor deleted successfully',
      deletedVendor: vendorData
    });

  } catch (error) {
    console.error('Delete vendor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete vendor'
    });
  }
};

/**
 * Request withdrawal
 * POST /api/vendors/withdraw
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, bankAccount } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid withdrawal amount is required'
      });
    }

    const vendor = await VendorModel.findOne({ userId, status: 'approved' });
    
    if (!vendor) {
      return res.status(403).json({
        success: false,
        error: 'Vendor access denied'
      });
    }

    if (!vendor.canWithdraw(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance or invalid amount'
      });
    }

    // Update bank account if provided
    if (bankAccount) {
      vendor.bankAccount = { ...vendor.bankAccount, ...bankAccount };
    }

    // Check if bank account is set up
    if (!vendor.bankAccount.accountNumber || !vendor.bankAccount.bankName) {
      return res.status(400).json({
        success: false,
        error: 'Bank account information is required. Please update your bank details first.'
      });
    }

    // Create withdrawal request (you may want to create a separate Withdrawal model)
    // For now, we'll just deduct the amount and mark it as withdrawn
    await vendor.withdraw(amount);

    // Send notification email
    try {
      const user = await UserModel.findById(userId);
      if (user && user.email) {
        await sendEmailFun({
          sendTo: user.email,
          subject: 'Withdrawal Request Received - Zuba House',
          text: '',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Withdrawal Request Received</h2>
              <p>Dear ${user.name},</p>
              <p>Your withdrawal request of <strong>${amount.toFixed(2)} USD</strong> has been received.</p>
              <p>We will process your withdrawal within 3-5 business days.</p>
              <p>Best regards,<br>Zuba House Team</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending withdrawal email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        amount,
        remainingBalance: vendor.earnings.availableBalance
      }
    });

  } catch (error) {
    console.error('Request withdrawal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process withdrawal request'
    });
  }
};

/**
 * Get vendor products
 * GET /api/vendors/products
 */
export const getVendorProducts = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 50, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const vendor = await VendorModel.findOne({ userId, status: 'approved' });
    
    if (!vendor) {
      return res.status(403).json({
        success: false,
        error: 'Vendor access denied'
      });
    }

    const query = { vendorId: vendor._id };
    if (status) {
      query.status = status;
    }

    const products = await ProductModel.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProductModel.countDocuments(query);

    return res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get vendor products error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendor products'
    });
  }
};
