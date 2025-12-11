import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';

/**
 * POST /api/vendor/apply
 * Public endpoint - Apply to become a vendor
 * Anyone can apply, no auth required
 */
export const applyToBecomeVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      storeName,
      storeSlug,
      description,
      phone,
      whatsapp,
      country,
      city,
      addressLine1,
      addressLine2,
      postalCode,
      categories
    } = req.body;

    // Validate required fields
    if (!storeName || !storeSlug || !email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store name, slug, and email are required'
      });
    }

    // Validate store slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(storeSlug.toLowerCase())) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store slug can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check if slug is already taken
    const existingVendor = await VendorModel.findOne({ 
      storeSlug: storeSlug.toLowerCase().trim() 
    });
    if (existingVendor) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store slug already taken. Please choose another.'
      });
    }

    // Get or create user account
    let user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
    if (user) {
      // User exists - check if already has vendor account
      if (user.vendor || user.vendorId) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'This email already has a vendor account'
        });
      }
      // Update user role to VENDOR (will be linked after vendor creation)
      user.role = 'VENDOR';
      
      // Send OTP if email not verified
      if (!user.verify_email) {
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = verifyCode;
        user.otpExpires = Date.now() + 600000;
        await user.save();

      // Send OTP email
      console.log('📧 Sending vendor registration OTP email to:', email);
      try {
        const emailSent = await sendEmailFun({
          sendTo: email,
          subject: "Verify Your Email - Zuba House Vendor Registration",
          text: "",
          html: VerificationEmail(user.name, verifyCode)
        });

        if (emailSent) {
          console.log('✅ Vendor OTP email sent successfully to:', email);
        } else {
          console.error('❌ Failed to send vendor OTP email to:', email);
          // Log warning but don't fail registration
          console.warn('⚠️ Registration will continue, but email verification may not work until email service is configured.');
        }
      } catch (emailError) {
        console.error('❌ Error sending vendor OTP email:', emailError);
        // Don't fail registration, but log the error
      }
      }
    } else {
      // Create new user account
      if (!password || password.length < 6) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Password is required and must be at least 6 characters'
        });
      }

      if (!name) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Name is required'
        });
      }

      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      // Generate OTP for email verification
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

      user = await UserModel.create({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'VENDOR',
        status: 'Active',
        verify_email: false,
        otp: verifyCode,
        otpExpires: Date.now() + 600000 // 10 minutes
      });

      // Send OTP email (using same pattern as order emails)
      console.log('📧 Preparing to send vendor registration OTP email to:', email);
      const recipients = [email];
      try {
        const emailResult = await sendEmailFun({
          sendTo: recipients,
          subject: "Verify Your Email - Zuba House Vendor Registration",
          text: "",
          html: VerificationEmail(name, verifyCode)
        });
        console.log('✅ Vendor OTP email sent successfully:', {
          to: email,
          result: emailResult
        });
      } catch (emailError) {
        console.error('❌ Failed to send vendor OTP email:', {
          to: email,
          error: emailError.message,
          stack: emailError.stack
        });
        // Don't fail registration if email fails, but log the error
      }
    }

    // Create vendor profile
    const vendor = await VendorModel.create({
      ownerUser: user._id,
      storeName: storeName.trim(),
      storeSlug: storeSlug.toLowerCase().trim(),
      description: description || '',
      email: email.toLowerCase().trim(),
      phone: phone || '',
      whatsapp: whatsapp || '',
      country: country || '',
      city: city || '',
      addressLine1: addressLine1 || '',
      addressLine2: addressLine2 || '',
      postalCode: postalCode || '',
      categories: categories || [],
      status: 'PENDING' // Requires admin approval
    });

    // Link vendor to user
    user.vendor = vendor._id;
    user.vendorId = vendor._id; // Keep both for backward compatibility
    await user.save();

    // TODO: Send email notification to admin for approval

    return res.status(201).json({
      error: false,
      success: true,
      message: user.verify_email 
        ? 'Vendor application submitted successfully! Your application is under review.'
        : 'Please verify your email to complete registration. Check your inbox for the OTP code.',
      data: {
        vendorId: vendor._id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        status: vendor.status,
        emailVerified: user.verify_email,
        requiresEmailVerification: !user.verify_email
      }
    });
  } catch (error) {
    console.error('Apply to become vendor error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to submit vendor application'
    });
  }
};

/**
 * POST /api/vendor/verify-email
 * Public endpoint - Verify vendor email with OTP
 */
export const verifyVendorEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'User not found'
      });
    }

    if (!user.vendor && !user.vendorId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'No vendor application found for this email'
      });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires && user.otpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.verify_email = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return res.status(200).json({
        error: false,
        success: true,
        message: 'Email verified successfully! Your vendor application is under review.'
      });
    } else if (!isCodeValid) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid OTP code'
      });
    } else {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'OTP expired. Please request a new code.'
      });
    }
  } catch (error) {
    console.error('Verify vendor email error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to verify email'
    });
  }
};

/**
 * POST /api/vendor/resend-otp
 * Public endpoint - Resend OTP for vendor email verification
 */
export const resendVendorOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email is required'
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

    // If user doesn't exist yet, that's okay - they can register first
    // OTP will be sent during registration
    if (!user) {
      return res.status(200).json({
        error: false,
        success: true,
        message: 'Please complete registration first. OTP will be sent after registration.'
      });
    }

    if (user.verify_email) {
      return res.status(200).json({
        error: false,
        success: true,
        message: 'Email is already verified'
      });
    }

    // Generate new OTP
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = verifyCode;
    user.otpExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    // Send OTP email (using same pattern as order emails)
    console.log('📧 Preparing to resend vendor OTP email to:', email);
    const recipients = [email];
    try {
      const emailResult = await sendEmailFun({
        sendTo: recipients,
        subject: "Verify Your Email - Zuba House Vendor Registration",
        text: "",
        html: VerificationEmail(user.name || email, verifyCode)
      });
      
      if (emailResult) {
        console.log('✅ Vendor OTP email resent successfully:', {
          to: email,
          result: emailResult
        });
        return res.status(200).json({
          error: false,
          success: true,
          message: 'OTP code sent to your email. Please check your inbox (and spam folder).'
        });
      } else {
        console.error('❌ Failed to send vendor OTP email - sendEmailFun returned false');
        return res.status(500).json({
          error: true,
          success: false,
          message: 'Failed to send OTP email. Please check your email configuration or try again later.'
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending vendor OTP email:', {
        to: email,
        error: emailError.message,
        stack: emailError.stack
      });
      return res.status(500).json({
        error: true,
        success: false,
        message: 'Failed to send OTP email. Please check your email configuration.',
        debug: process.env.NODE_ENV !== 'production' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Resend vendor OTP error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to resend OTP'
    });
  }
};

/**
 * GET /api/vendor/application-status/:email
 * Public endpoint - Check vendor application status
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email is required'
      });
    }

    const user = await UserModel.findOne({ 
      email: email.toLowerCase().trim() 
    }).populate('vendor');

    if (!user || !user.vendor) {
      return res.status(200).json({
        error: false,
        success: true,
        message: 'No vendor application found for this email',
        data: {
          hasApplication: false
        }
      });
    }

    const vendor = await VendorModel.findById(user.vendor);

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        hasApplication: true,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        status: vendor.status,
        createdAt: vendor.createdAt
      }
    });
  } catch (error) {
    console.error('Get application status error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to check application status'
    });
  }
};

/**
 * GET /api/vendor/me
 * Get vendor profile
 */
export const getMyProfile = async (req, res) => {
  try {
    const vendor = await VendorModel.findById(req.vendorId)
      .populate('ownerUser', 'name email')
      .populate('categories', 'name slug');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/vendor/me
 * Update vendor profile
 */
export const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      'storeName',
      'storeSlug',
      'logoUrl',
      'bannerUrl',
      'description',
      'shortDescription',
      'country',
      'city',
      'addressLine1',
      'addressLine2',
      'postalCode',
      'phone',
      'whatsapp',
      'email',
      'shippingPolicy',
      'returnPolicy',
      'handlingTimeDays',
      'seoTitle',
      'seoDescription',
      'seoKeywords',
      'categories',
      'socialLinks'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    // Validate store slug if provided
    if (updates.storeSlug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(updates.storeSlug.toLowerCase())) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Store slug can only contain lowercase letters, numbers, and hyphens'
        });
      }

      // Check if slug is already taken by another vendor
      const existingVendor = await VendorModel.findOne({
        storeSlug: updates.storeSlug.toLowerCase().trim(),
        _id: { $ne: req.vendorId }
      });

      if (existingVendor) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Store slug already taken'
        });
      }

      updates.storeSlug = updates.storeSlug.toLowerCase().trim();
    }

    const vendor = await VendorModel.findOneAndUpdate(
      { _id: req.vendorId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('ownerUser', 'name email');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Profile updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * GET /api/vendor/dashboard
 * Get vendor dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const OrderModel = (await import('../models/order.model.js')).default;
    const ProductModel = (await import('../models/product.model.js')).default;

    // Get orders with vendor items (match by either vendor or vendorId)
    const orders = await OrderModel.find({
      $or: [
        { 'products.vendor': vendorId },
        { 'products.vendorId': vendorId }
      ]
    }).select('products createdAt order_status payment_status');

    let totalOrders = 0;
    let totalRevenue = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderStatusCounts = {
      RECEIVED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0
    };

    orders.forEach((order) => {
      const isToday = new Date(order.createdAt) >= today;
      
      order.products.forEach((item) => {
        const itemVendorId = item.vendor || item.vendorId;
        if (itemVendorId && itemVendorId.toString() === String(vendorId)) {
          totalOrders += 1;
          const earning = item.vendorEarning || item.subTotal || 0;
          totalRevenue += earning;

          if (isToday) {
            todayOrders += 1;
            todayRevenue += earning;
          }

          // Count by vendor status
          if (item.vendorStatus && orderStatusCounts[item.vendorStatus] !== undefined) {
            orderStatusCounts[item.vendorStatus]++;
          }
        }
      });
    });

    // Get product counts
    const totalProducts = await ProductModel.countDocuments({ vendor: vendorId });
    const publishedProducts = await ProductModel.countDocuments({
      vendor: vendorId,
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED'
    });

    // Get vendor for balance info
    const vendor = await VendorModel.findById(vendorId).select('totalSales totalEarnings availableBalance pendingBalance');

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue,
          todayOrders,
          todayRevenue,
          totalProducts,
          publishedProducts,
          orderStatusCounts
        },
        earnings: {
          totalSales: vendor?.totalSales || 0,
          totalEarnings: vendor?.totalEarnings || 0,
          availableBalance: vendor?.availableBalance || 0,
          pendingBalance: vendor?.pendingBalance || 0
        }
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

