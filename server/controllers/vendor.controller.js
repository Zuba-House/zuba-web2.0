/**
 * Vendor Controller
 * Handles vendor application, approval, and management
 */

import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import ProductModel from '../models/product.model.js';
import sendEmailFun from '../config/sendEmail.js';

/**
 * Apply to become a vendor
 * POST /api/vendors/apply
 */
export const applyToBecomeVendor = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user already has a vendor application
    const existingVendor = await VendorModel.findOne({ userId });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        error: 'You already have a vendor application. Status: ' + existingVendor.status
      });
    }

    const {
      shopName,
      shopDescription,
      businessName,
      businessType,
      phone,
      email,
      address,
      taxId,
      registrationNumber
    } = req.body;

    // Validate required fields
    if (!shopName || !businessName || !businessType || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shopName, businessName, businessType, phone, email'
      });
    }

    // Check if shop name is already taken
    const shopSlug = shopName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const shopNameExists = await VendorModel.findOne({ shopSlug });
    if (shopNameExists) {
      return res.status(400).json({
        success: false,
        error: 'Shop name is already taken. Please choose another name.'
      });
    }

    // Create vendor application
    const vendor = new VendorModel({
      userId,
      shopName: shopName.trim(),
      shopDescription: shopDescription || '',
      businessName: businessName.trim(),
      businessType,
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      address: address || {},
      taxId: taxId || '',
      registrationNumber: registrationNumber || '',
      status: 'pending'
    });

    await vendor.save();

    // Update user role (but keep as USER until approved)
    await UserModel.findByIdAndUpdate(userId, {
      vendorId: vendor._id
    });

    // Send confirmation email to vendor
    try {
      const user = await UserModel.findById(userId);
      if (user && user.email) {
        await sendEmailFun({
          sendTo: user.email,
          subject: 'Vendor Application Received - Zuba House',
          text: '',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Thank You for Your Application!</h2>
              <p>Dear ${user.name},</p>
              <p>We have received your application to become a vendor on Zuba House.</p>
              <p><strong>Application Status:</strong> Pending Review</p>
              <p>Our team will review your application and get back to you within 2-3 business days.</p>
              <p>You will receive an email notification once your application has been reviewed.</p>
              <p>Thank you for your interest in selling on Zuba House!</p>
              <p>Best regards,<br>Zuba House Team</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending vendor application email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Vendor application submitted successfully',
      vendor: {
        id: vendor._id,
        shopName: vendor.shopName,
        status: vendor.status
      }
    });

  } catch (error) {
    console.error('Apply to become vendor error:', error);
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
      .select('-bankAccount -adminNotes');

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
      .select('-bankAccount -adminNotes -rejectionReason');

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
          isVerified: vendor.isVerified
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
      .select('-bankAccount')
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

    vendor.status = 'approved';
    vendor.approvalDate = new Date();
    vendor.approvedBy = adminId;
    await vendor.save();

    // Send approval email
    try {
      const user = await UserModel.findById(vendor.userId);
      if (user && user.email) {
        const approvalLink = `${process.env.CLIENT_URL || 'https://www.zubahouse.com'}/vendor/complete-registration?token=${vendor._id}`;
        
        await sendEmailFun({
          sendTo: user.email,
          subject: 'Congratulations! Your Vendor Application Has Been Approved - Zuba House',
          text: '',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Congratulations!</h2>
              <p>Dear ${user.name},</p>
              <p>We are pleased to inform you that your vendor application has been <strong>approved</strong>!</p>
              <p>Your shop "<strong>${vendor.shopName}</strong>" is now ready to be set up.</p>
              <p>Please complete your vendor registration by clicking the link below:</p>
              <p><a href="${approvalLink}" style="background-color: #efb291; color: #0b2735; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Complete Registration</a></p>
              <p>After completing your registration, you'll be able to:</p>
              <ul>
                <li>Upload and manage your products</li>
                <li>Set up promotions and discounts</li>
                <li>Track your sales and earnings</li>
                <li>Withdraw your earnings</li>
              </ul>
              <p>Welcome to Zuba House!</p>
              <p>Best regards,<br>Zuba House Team</p>
            </div>
          `
        });
      }
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
      const user = await UserModel.findById(vendor.userId);
      if (user && user.email) {
        await sendEmailFun({
          sendTo: user.email,
          subject: 'Vendor Application Status - Zuba House',
          text: '',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Application Status Update</h2>
              <p>Dear ${user.name},</p>
              <p>We regret to inform you that your vendor application has been <strong>rejected</strong>.</p>
              <p><strong>Reason:</strong> ${vendor.rejectionReason}</p>
              <p>If you have any questions or would like to reapply, please contact our support team.</p>
              <p>Best regards,<br>Zuba House Team</p>
            </div>
          `
        });
      }
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
