import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';

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

      user = await UserModel.create({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'VENDOR',
        status: 'Active',
        verify_email: false
      });
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
    // TODO: Send confirmation email to vendor

    return res.status(201).json({
      error: false,
      success: true,
      message: 'Vendor application submitted successfully! Your application is under review.',
      data: {
        vendorId: vendor._id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        status: vendor.status
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

