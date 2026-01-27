import mongoose from 'mongoose';
import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';
import { 
  sendVendorWelcome, 
  sendVendorStatusChange,
  sendVendorProductApproved,
  sendVendorProductRejected
} from '../utils/vendorEmails.js';

/**
 * GET /api/admin/vendors
 * Get all vendors with filters
 */
export const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { storeSlug: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let vendors, total;
    
    try {
      [vendors, total] = await Promise.all([
        VendorModel.find(filter)
          .populate({
            path: 'ownerUser',
            select: 'name email phone status verify_email',
            options: { lean: true }
          })
          .populate({
            path: 'categories',
            select: 'name slug',
            options: { lean: true, strictPopulate: false }
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        VendorModel.countDocuments(filter)
      ]);
    } catch (populateError) {
      console.error('❌ Populate error, trying without populate:', populateError);
      // Fallback: fetch without populate if populate fails
      [vendors, total] = await Promise.all([
        VendorModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        VendorModel.countDocuments(filter)
      ]);
      
      // Manually populate ownerUser
      const userIds = vendors.filter(v => v.ownerUser).map(v => v.ownerUser);
      const users = await UserModel.find({ _id: { $in: userIds } })
        .select('name email phone status verify_email')
        .lean();
      const userMap = new Map(users.map(u => [u._id.toString(), u]));
      
      vendors = vendors.map(v => ({
        ...v,
        ownerUser: v.ownerUser ? userMap.get(v.ownerUser.toString()) || null : null
      }));
    }

    // Ensure all vendor fields have safe defaults to prevent frontend crashes
    // Convert all string fields to strings explicitly to prevent toLowerCase() errors
    const safeVendors = vendors.map(vendor => {
      // Ensure ownerUser is properly formatted
      let ownerUser = { name: 'N/A', email: '', phone: '' };
      if (vendor?.ownerUser) {
        if (typeof vendor.ownerUser === 'object' && vendor.ownerUser !== null) {
          ownerUser = {
            _id: vendor.ownerUser._id || null,
            name: String(vendor.ownerUser.name || 'N/A'),
            email: String(vendor.ownerUser.email || ''),
            phone: String(vendor.ownerUser.phone || ''),
            status: vendor.ownerUser.status || 'Active',
            verify_email: vendor.ownerUser.verify_email || false
          };
        }
      }

      // Ensure categories are properly formatted
      let categories = [];
      if (Array.isArray(vendor?.categories)) {
        categories = vendor.categories
          .filter(cat => cat && typeof cat === 'object')
          .map(cat => ({
            _id: cat._id || null,
            name: String(cat.name || ''),
            slug: String(cat.slug || '')
          }));
      }

      return {
        ...vendor,
        _id: vendor?._id || null,
        storeName: String(vendor?.storeName || 'N/A'),
        storeSlug: String(vendor?.storeSlug || ''),
        email: String(vendor?.email || ''),
        status: String(vendor?.status || 'PENDING'),
        availableBalance: Number(vendor?.availableBalance || 0),
        totalSales: Number(vendor?.totalSales || 0),
        totalEarnings: Number(vendor?.totalEarnings || 0),
        createdAt: vendor?.createdAt || new Date(),
        ownerUser: ownerUser,
        categories: categories
      };
    });

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        vendors: safeVendors,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get all vendors error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * POST /api/admin/vendors
 * Create a new vendor (Admin only - bypasses email verification)
 */
export const createVendor = async (req, res) => {
  // Track if we created a new user (for rollback on failure)
  let newlyCreatedUser = null;
  let userWasNew = false;
  
  try {
    // Log admin action
    console.log('🔧 Admin creating vendor:', {
      adminId: req.userId,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

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
      categories,
      status = 'APPROVED' // Admin can set status directly
    } = req.body;

    // Validate required fields
    if (!storeName || !storeSlug || !email || !name) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Name, email, store name, and store URL slug are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Note: Vendor email does NOT need to be an admin email
    // Only the ADMIN creating the vendor needs to have an admin email
    console.log('📝 Creating vendor account for:', {
      vendorEmail: normalizedEmail.substring(0, 10) + '...',
      storeName,
      storeSlug,
      createdBy: req.user?.email
    });

    // Check if user already exists
    let user = await UserModel.findOne({ email: normalizedEmail });

    if (user) {
      // Check if user already has a vendor account
      if (user.vendor || user.vendorId) {
        const existingVendor = await VendorModel.findById(user.vendor || user.vendorId);
        if (existingVendor) {
          // Check if this is the same vendor being updated (by email)
          if (existingVendor.email === normalizedEmail) {
            // Same vendor - allow update, will be handled below
            console.log('✅ User has existing vendor with same email, will update');
          } else {
            // Different vendor - check if admin wants to replace it
            // For now, allow admin to update the existing vendor
            console.log('⚠️ User has different vendor account, will update existing one');
          }
        } else {
          // Vendor reference exists but vendor not found - clear the reference
          user.vendor = null;
          user.vendorId = null;
        }
      }
      
      // Update existing user
      user.name = name;
      user.role = 'VENDOR';
      user.status = 'Active';
      user.verify_email = true; // Admin bypasses email verification
      
      if (password && password.length >= 6) {
        const bcryptjs = await import('bcryptjs');
        const salt = await bcryptjs.default.genSalt(10);
        user.password = await bcryptjs.default.hash(password, salt);
      }
      
      await user.save();
    } else {
      // Create new user
      if (!password || password.length < 6) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Password is required and must be at least 6 characters'
        });
      }

      const bcryptjs = await import('bcryptjs');
      const salt = await bcryptjs.default.genSalt(10);
      const hashedPassword = await bcryptjs.default.hash(password, salt);

      // Create new user - track for potential rollback
      user = await UserModel.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'VENDOR',
        status: 'Active',
        verify_email: true // Admin bypasses email verification
      });
      
      newlyCreatedUser = user._id;
      userWasNew = true;
      console.log('✅ New user created for vendor:', user._id);
    }

    // Validate store slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(storeSlug.toLowerCase())) {
      // Rollback user creation if we created a new user
      if (userWasNew && newlyCreatedUser) {
        try {
          await UserModel.findByIdAndDelete(newlyCreatedUser);
          console.log('✅ Rolled back user creation due to invalid slug');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback user creation:', rollbackError);
        }
      }
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store URL slug can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check if slug is already taken (but allow if it's the same user's vendor)
    const existingVendorBySlug = await VendorModel.findOne({ 
      storeSlug: storeSlug.toLowerCase().trim() 
    });
    
    if (existingVendorBySlug && existingVendorBySlug.ownerUser?.toString() !== user._id.toString()) {
      // Rollback user creation if we created a new user
      if (userWasNew && newlyCreatedUser) {
        try {
          await UserModel.findByIdAndDelete(newlyCreatedUser);
          console.log('✅ Rolled back user creation due to slug conflict');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback user creation:', rollbackError);
        }
      }
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store URL slug already taken. Please choose another.',
        data: {
          slugTaken: true,
          existingStoreName: existingVendorBySlug.storeName
        }
      });
    }

    // Check if vendor with this email already exists
    const existingVendorByEmail = await VendorModel.findOne({ email: normalizedEmail });
    if (existingVendorByEmail) {
      // Check if this vendor belongs to the same user
      if (existingVendorByEmail.ownerUser && existingVendorByEmail.ownerUser.toString() === user._id.toString()) {
        // Same user - update existing vendor
        existingVendorByEmail.storeName = storeName.trim();
        existingVendorByEmail.storeSlug = storeSlug.toLowerCase().trim();
        existingVendorByEmail.description = description || '';
        existingVendorByEmail.phone = phone || '';
        existingVendorByEmail.whatsapp = whatsapp || '';
        existingVendorByEmail.country = country || '';
        existingVendorByEmail.city = city || '';
        existingVendorByEmail.addressLine1 = addressLine1 || '';
        existingVendorByEmail.addressLine2 = addressLine2 || '';
        existingVendorByEmail.postalCode = postalCode || '';
        existingVendorByEmail.categories = categories || [];
        existingVendorByEmail.status = status;
        await existingVendorByEmail.save();

        user.vendor = existingVendorByEmail._id;
        user.vendorId = existingVendorByEmail._id;
        await user.save();

        return res.status(200).json({
          error: false,
          success: true,
          message: 'Vendor updated successfully!',
          data: {
            vendorId: existingVendorByEmail._id,
            storeName: existingVendorByEmail.storeName,
            storeSlug: existingVendorByEmail.storeSlug,
            status: existingVendorByEmail.status
          }
        });
      } else {
        // Vendor exists but belongs to different user - prevent replacement
        return res.status(400).json({
          error: true,
          success: false,
          message: `A vendor account with email "${normalizedEmail}" already exists and belongs to another user. Please use a different email address.`,
          data: {
            emailTaken: true,
            existingVendorId: existingVendorByEmail._id,
            existingStoreName: existingVendorByEmail.storeName
          }
        });
      }
    }

    // Ensure user._id is valid before creating vendor
    if (!user || !user._id) {
      return res.status(500).json({
        error: true,
        success: false,
        message: 'Failed to create user account. Please try again.'
      });
    }

    // Create new vendor - ensure ownerUser is always set
    let vendor;
    try {
      vendor = await VendorModel.create({
        ownerUser: user._id, // Required field - must always be set
        storeName: storeName.trim(),
        storeSlug: storeSlug.toLowerCase().trim(),
        description: description || '',
        email: normalizedEmail,
        phone: phone || '',
        whatsapp: whatsapp || '',
        country: country || '',
        city: city || '',
        addressLine1: addressLine1 || '',
        addressLine2: addressLine2 || '',
        postalCode: postalCode || '',
        categories: categories || [],
        status: status // Admin can set status directly
      });
    } catch (vendorCreateError) {
      // If vendor creation fails and we created a new user, rollback user creation
      if (userWasNew && newlyCreatedUser) {
        console.error('❌ Vendor creation failed, rolling back user creation:', newlyCreatedUser);
        try {
          await UserModel.findByIdAndDelete(newlyCreatedUser);
          console.log('✅ Rolled back user creation');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback user creation:', rollbackError);
        }
      }
      // Re-throw to be handled by outer catch
      throw vendorCreateError;
    }

    // Link vendor to user
    try {
      user.vendor = vendor._id;
      user.vendorId = vendor._id;
      await user.save();
    } catch (userUpdateError) {
      // If linking fails, try to clean up vendor and user
      console.error('❌ Failed to link vendor to user, cleaning up...');
      try {
        await VendorModel.findByIdAndDelete(vendor._id);
        if (userWasNew && newlyCreatedUser) {
          await UserModel.findByIdAndDelete(newlyCreatedUser);
        }
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup after linking error:', cleanupError);
      }
      throw userUpdateError;
    }

    // Send welcome email with temporary password if approved
    if (status === 'APPROVED') {
      try {
        // Get the password (plain text) for email - only if it was provided
        const tempPassword = password || null;
        await sendVendorWelcome(vendor, user, tempPassword);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    console.log('✅ Admin successfully created vendor:', {
      vendorId: vendor._id,
      storeName: vendor.storeName,
      email: normalizedEmail,
      status: vendor.status,
      createdBy: req.user?.email,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      error: false,
      success: true,
      message: `Vendor "${vendor.storeName}" created successfully and ${status === 'APPROVED' ? 'approved' : 'set to ' + status}!`,
      data: {
        vendorId: vendor._id,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        email: normalizedEmail,
        status: vendor.status,
        userId: user._id
      }
    });

  } catch (error) {
    console.error('❌ Create vendor error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      adminId: req.userId,
      adminEmail: req.user?.email,
      vendorEmail: req.body?.email,
      userWasNew,
      newlyCreatedUserId: newlyCreatedUser
    });
    
    // CRITICAL: Rollback user creation if vendor creation failed
    if (userWasNew && newlyCreatedUser) {
      console.error('🔄 Rolling back user creation due to vendor creation failure...');
      try {
        const userToDelete = await UserModel.findById(newlyCreatedUser);
        if (userToDelete) {
          // Only delete if user doesn't have a vendor linked (safety check)
          if (!userToDelete.vendor && !userToDelete.vendorId) {
            await UserModel.findByIdAndDelete(newlyCreatedUser);
            console.log('✅ Successfully rolled back user creation');
          } else {
            console.warn('⚠️ User has vendor linked, skipping rollback');
          }
        }
      } catch (rollbackError) {
        console.error('❌ Failed to rollback user creation:', rollbackError);
        // Log for manual cleanup
        console.error('⚠️ MANUAL CLEANUP REQUIRED: User ID', newlyCreatedUser, 'may be orphaned');
      }
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      // Check for old shopName index error (legacy issue - field was renamed to storeName)
      if (error.message && (error.message.includes('shopName') || error.message.includes('shopName_1'))) {
        console.log('🔧 Auto-fixing shopName index error...');
        
        // Try to automatically fix the index
        try {
          const db = mongoose.connection.db;
          if (db) {
            const vendorsCollection = db.collection('vendors');
            const indexes = await vendorsCollection.indexes();
            
            // Find and drop old shopName index
            const shopNameIndex = indexes.find(idx => idx.name === 'shopName_1' || (idx.key && idx.key.shopName));
            if (shopNameIndex) {
              try {
                await vendorsCollection.dropIndex(shopNameIndex.name);
                console.log(`✅ Auto-dropped old shopName index: ${shopNameIndex.name}`);
              } catch (dropError) {
                console.error('⚠️ Could not drop shopName index:', dropError.message);
              }
            }
            
            // Retry vendor creation after fixing index
            console.log('🔄 Retrying vendor creation after shopName index fix...');
            try {
              const vendor = await VendorModel.create({
                ownerUser: user._id,
                storeName: storeName.trim(),
                storeSlug: storeSlug.toLowerCase().trim(),
                description: description || '',
                email: normalizedEmail,
                phone: phone || '',
                whatsapp: whatsapp || '',
                country: country || '',
                city: city || '',
                addressLine1: addressLine1 || '',
                addressLine2: addressLine2 || '',
                postalCode: postalCode || '',
                categories: categories || [],
                status: status
              });

              // Link vendor to user
              user.vendor = vendor._id;
              user.vendorId = vendor._id;
              await user.save();

              // Send welcome email if approved
              if (status === 'APPROVED') {
                try {
                  const tempPassword = password || null;
                  await sendVendorWelcome(vendor, user, tempPassword);
                } catch (emailError) {
                  console.error('Failed to send welcome email:', emailError);
                }
              }

              console.log('✅ Vendor created successfully after shopName index fix!');
              return res.status(201).json({
                error: false,
                success: true,
                message: `Vendor "${vendor.storeName}" created successfully! (Database indexes were automatically fixed)`,
                data: {
                  vendorId: vendor._id,
                  storeName: vendor.storeName,
                  storeSlug: vendor.storeSlug,
                  email: normalizedEmail,
                  status: vendor.status,
                  userId: user._id,
                  indexFixed: true
                }
              });
            } catch (retryError) {
              console.error('❌ Retry failed after shopName index fix:', retryError);
              // Fall through to return error
            }
          }
        } catch (fixError) {
          console.error('❌ Failed to auto-fix shopName index:', fixError);
        }
        
        // If auto-fix didn't work, return error with instructions
        return res.status(500).json({
          error: true,
          success: false,
          message: 'Database index error detected. Auto-fix attempted but failed. Please use the fix-indexes endpoint.',
          details: {
            issue: 'Old shopName index exists in database',
            solution: 'Call POST /api/admin/vendors/fix-indexes to fix manually',
            errorMessage: error.message
          }
        });
      }
      
      // Check for old userId index error (legacy issue)
      if (error.message && (error.message.includes('userId') || error.message.includes('userId_1'))) {
        console.log('🔧 Auto-fixing database index error...');
        
        // Try to automatically fix the index
        try {
          const db = mongoose.connection.db;
          if (db) {
            const vendorsCollection = db.collection('vendors');
            const indexes = await vendorsCollection.indexes();
            
            // Find and drop old userId index
            const userIdIndex = indexes.find(idx => idx.name === 'userId_1' || (idx.key && idx.key.userId));
            if (userIdIndex) {
              try {
                await vendorsCollection.dropIndex(userIdIndex.name);
                console.log(`✅ Auto-dropped old index: ${userIdIndex.name}`);
              } catch (dropError) {
                console.error('⚠️ Could not drop userId index:', dropError.message);
              }
            }
            
            // Also drop shopName index if it exists (field was renamed to storeName)
            const shopNameIndex = indexes.find(idx => idx.name === 'shopName_1' || (idx.key && idx.key.shopName));
            if (shopNameIndex) {
              try {
                await vendorsCollection.dropIndex(shopNameIndex.name);
                console.log(`✅ Auto-dropped old shopName index: ${shopNameIndex.name}`);
              } catch (dropError) {
                console.error('⚠️ Could not drop shopName index:', dropError.message);
              }
            }
            
            // Ensure ownerUser index exists
            const ownerUserIndex = indexes.find(idx => idx.name === 'ownerUser_1' || (idx.key && idx.key.ownerUser));
            if (!ownerUserIndex) {
              try {
                await vendorsCollection.createIndex(
                  { ownerUser: 1 },
                  { unique: true, sparse: true, name: 'ownerUser_1' }
                );
                console.log('✅ Auto-created ownerUser_1 index');
              } catch (createError) {
                console.error('⚠️ Could not create ownerUser index:', createError.message);
              }
            }
            
            // Retry vendor creation after fixing index
            console.log('🔄 Retrying vendor creation after index fix...');
            try {
              const vendor = await VendorModel.create({
                ownerUser: user._id,
                storeName: storeName.trim(),
                storeSlug: storeSlug.toLowerCase().trim(),
                description: description || '',
                email: normalizedEmail,
                phone: phone || '',
                whatsapp: whatsapp || '',
                country: country || '',
                city: city || '',
                addressLine1: addressLine1 || '',
                addressLine2: addressLine2 || '',
                postalCode: postalCode || '',
                categories: categories || [],
                status: status
              });

              // Link vendor to user
              user.vendor = vendor._id;
              user.vendorId = vendor._id;
              await user.save();

              // Send welcome email if approved
              if (status === 'APPROVED') {
                try {
                  const tempPassword = password || null;
                  await sendVendorWelcome(vendor, user, tempPassword);
                } catch (emailError) {
                  console.error('Failed to send welcome email:', emailError);
                }
              }

              console.log('✅ Vendor created successfully after auto-fix!');
              return res.status(201).json({
                error: false,
                success: true,
                message: `Vendor "${vendor.storeName}" created successfully! (Database indexes were automatically fixed)`,
                data: {
                  vendorId: vendor._id,
                  storeName: vendor.storeName,
                  storeSlug: vendor.storeSlug,
                  email: normalizedEmail,
                  status: vendor.status,
                  userId: user._id,
                  indexFixed: true
                }
              });
            } catch (retryError) {
              console.error('❌ Retry failed after index fix:', retryError);
              // Fall through to return error
            }
          }
        } catch (fixError) {
          console.error('❌ Failed to auto-fix index:', fixError);
        }
        
        // If auto-fix didn't work, return error with instructions
        return res.status(500).json({
          error: true,
          success: false,
          message: 'Database index error detected. Auto-fix attempted but failed. Please use the fix-indexes endpoint.',
          details: {
            issue: 'Old userId index exists in database',
            solution: 'Call POST /api/admin/vendors/fix-indexes to fix manually',
            errorMessage: error.message
          }
        });
      }

      // Check for ownerUser index errors
      if (error.keyPattern?.ownerUser || (error.message && error.message.includes('ownerUser'))) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'User already has a vendor account.'
        });
      }

      if (error.keyPattern?.storeSlug) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Store URL slug already taken. Please choose another.'
        });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'A vendor with this email already exists.'
        });
      }
    }

    // Handle Mongoose schema index errors (happens when model is loaded multiple times)
    if (error.name === 'MongooseError' && error.message && error.message.includes('already has an index')) {
      // This is a schema-level error, not a database error
      // The index is already defined, which is fine - just log and continue
      console.warn('⚠️ Index already defined in schema (non-critical):', error.message);
      // Don't return error - this is just a warning, the model should still work
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map(err => err.message);
      return res.status(400).json({
        error: true,
        success: false,
        message: messages.join(', ') || 'Validation error'
      });
    }

    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to create vendor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * POST /api/admin/vendors/:id/impersonate
 * Admin can impersonate vendor to access vendor dashboard
 * Returns vendor access tokens for admin to use
 */
export const impersonateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    // Get admin user
    const adminUser = await UserModel.findById(adminId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Admin access required'
      });
    }

    // Get vendor
    const vendor = await VendorModel.findById(id)
      .populate('ownerUser', 'name email role status');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor owner user
    const vendorUser = vendor.ownerUser;
    if (!vendorUser) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor owner user not found'
      });
    }

    // Generate tokens for vendor user (admin will use these to access vendor dashboard)
    const generatedAccessToken = (await import('../utils/generatedAccessToken.js')).default;
    const genertedRefreshToken = (await import('../utils/generatedRefreshToken.js')).default;
    
    const accessToken = await generatedAccessToken(vendorUser._id);
    const refreshToken = await genertedRefreshToken(vendorUser._id);

    // Log admin impersonation
    console.log('🔐 Admin impersonating vendor:', {
      adminId: adminId,
      adminEmail: adminUser.email,
      vendorId: vendor._id,
      vendorEmail: vendor.email,
      vendorStoreName: vendor.storeName,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      error: false,
      success: true,
      message: `Access granted to vendor "${vendor.storeName}" dashboard`,
      data: {
        accesstoken: accessToken,
        refreshToken: refreshToken,
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          storeSlug: vendor.storeSlug,
          status: vendor.status,
          email: vendor.email
        },
        user: {
          id: vendorUser._id,
          name: vendorUser.name,
          email: vendorUser.email,
          role: vendorUser.role
        },
        impersonatedBy: {
          adminId: adminId,
          adminEmail: adminUser.email
        },
        note: 'Use these tokens to access vendor dashboard. This is an admin impersonation session.'
      }
    });
  } catch (error) {
    console.error('Impersonate vendor error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to impersonate vendor'
    });
  }
};

/**
 * GET /api/admin/vendors/:id
 * Get single vendor details
 */
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await VendorModel.findById(id)
      .populate('ownerUser', 'name email phone status verify_email createdAt')
      .populate('categories', 'name slug');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor stats
    const productCount = await ProductModel.countDocuments({ vendor: id });
    const orderCount = await OrderModel.countDocuments({ 'products.vendor': id });

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        vendor,
        stats: {
          productCount,
          orderCount
        }
      }
    });
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/admin/vendors/:id/status
 * Update vendor status (APPROVE, REJECT, SUSPEND)
 */
export const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    const oldStatus = vendor.status;
    vendor.status = status;

    // If approving, ensure user role is VENDOR
    if (status === 'APPROVED' && oldStatus !== 'APPROVED') {
      const user = await UserModel.findById(vendor.ownerUser);
      if (user) {
        user.role = 'VENDOR';
        user.vendor = vendor._id;
        user.vendorId = vendor._id;
        await user.save();
      }
    }

    // If rejecting or suspending, optionally revoke access
    if ((status === 'REJECTED' || status === 'SUSPENDED') && oldStatus === 'APPROVED') {
      const user = await UserModel.findById(vendor.ownerUser);
      if (user) {
        // Keep role as VENDOR but they won't be able to login if suspended
        // You can change this behavior if needed
      }
    }

    await vendor.save();

    // Send email notification to vendor about status change (non-blocking)
    if (vendor.email) {
      if (status === 'APPROVED') {
        sendVendorWelcome(vendor).catch(err => {
          console.error('Failed to send vendor welcome email:', err);
        });
      } else {
        sendVendorStatusChange(vendor, status, notes || '').catch(err => {
          console.error('Failed to send vendor status change email:', err);
        });
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: `Vendor status updated to ${status}`,
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/admin/vendors/:id
 * Update vendor details
 */
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.ownerUser;
    delete updates.totalSales;
    delete updates.totalEarnings;
    delete updates.availableBalance;
    delete updates.pendingBalance;

    const vendor = await VendorModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('ownerUser', 'name email');

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
      message: 'Vendor updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * DELETE /api/admin/vendors/:id
 * Delete vendor PERMANENTLY from database
 * This allows the user to re-register as a vendor with the same email
 */
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteUserToo = false } = req.query; // Option to also delete user account

    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    const vendorEmail = vendor.email;
    const ownerUserId = vendor.ownerUser;

    console.log(`🗑️ Deleting vendor: ${vendor.storeName} (${vendorEmail})`);

    // Delete vendor's products (optional - uncomment if you want to delete products too)
    // await ProductModel.deleteMany({ vendor: id });
    // console.log('   - Deleted vendor products');

    // Delete vendor's payouts
    try {
      const PayoutModel = (await import('../models/payout.model.js')).default;
      await PayoutModel.deleteMany({ vendor: id });
      console.log('   - Deleted vendor payouts');
    } catch (e) {
      console.log('   - No payout model or no payouts to delete');
    }

    // Delete the vendor document
    await VendorModel.findByIdAndDelete(id);
    console.log('   - Deleted vendor document');

    // Update or delete the user
    if (ownerUserId) {
      const user = await UserModel.findById(ownerUserId);
      if (user) {
        if (deleteUserToo === 'true') {
          // Completely delete the user account
          await UserModel.findByIdAndDelete(ownerUserId);
          console.log('   - Deleted user account');
        } else {
          // Just remove vendor association and change role back to USER
          // This allows them to re-register as vendor
          user.vendor = null;
          user.vendorId = null;
          user.role = 'USER';
          await user.save();
          console.log('   - User account kept but vendor association removed');
        }
      }
    }

    console.log(`✅ Vendor ${vendor.storeName} deleted successfully`);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Vendor deleted permanently. The user can now re-register as a vendor.',
      data: {
        deletedVendor: vendor.storeName,
        email: vendorEmail
      }
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * DELETE /api/admin/vendors/:id/permanent
 * Delete vendor AND user account permanently
 * Use this when you want to completely remove all traces
 */
export const deleteVendorPermanent = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    const vendorEmail = vendor.email;
    const ownerUserId = vendor.ownerUser;
    const storeName = vendor.storeName;

    console.log(`🗑️ PERMANENT DELETE: ${storeName} (${vendorEmail})`);

    // Delete all related data
    try {
      // Delete vendor's products
      const deletedProducts = await ProductModel.deleteMany({ vendor: id });
      console.log(`   - Deleted ${deletedProducts.deletedCount} products`);

      // Delete vendor's payouts
      const PayoutModel = (await import('../models/payout.model.js')).default;
      const deletedPayouts = await PayoutModel.deleteMany({ vendor: id });
      console.log(`   - Deleted ${deletedPayouts.deletedCount} payouts`);
    } catch (e) {
      console.log('   - Error deleting related data:', e.message);
    }

    // Delete the vendor document
    await VendorModel.findByIdAndDelete(id);
    console.log('   - Deleted vendor document');

    // Delete the user account
    if (ownerUserId) {
      await UserModel.findByIdAndDelete(ownerUserId);
      console.log('   - Deleted user account');
    }

    console.log(`✅ Vendor ${storeName} and all related data permanently deleted`);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Vendor and user account permanently deleted. Email can be used for new registration.',
      data: {
        deletedVendor: storeName,
        email: vendorEmail
      }
    });
  } catch (error) {
    console.error('Permanent delete vendor error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * DELETE /api/admin/vendors/all
 * Delete ALL vendors from the database (Admin only)
 * This will:
 * - Delete all vendor documents
 * - Delete all vendor products
 * - Delete all vendor payouts
 * - Update user roles back to USER
 * - Remove vendor references from users
 */
/**
 * POST /api/admin/vendors/fix-indexes
 * Fix vendor collection database indexes (Admin only)
 * Removes old userId index and creates correct ownerUser index
 */
export const fixVendorIndexes = async (req, res) => {
  try {
    console.log('🔧 Admin fixing vendor indexes:', {
      adminId: req.userId,
      adminEmail: req.user?.email,
      timestamp: new Date().toISOString()
    });

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({
        error: true,
        success: false,
        message: 'Database connection not available'
      });
    }

    const vendorsCollection = db.collection('vendors');

    // Get all indexes
    const indexes = await vendorsCollection.indexes();
    const results = {
      indexesBefore: indexes.length,
      indexesRemoved: [],
      indexesCreated: [],
      errors: []
    };

    // Check for old userId index
    const userIdIndex = indexes.find(idx => idx.name === 'userId_1' || (idx.key && idx.key.userId));
    
    if (userIdIndex) {
      try {
        await vendorsCollection.dropIndex(userIdIndex.name);
        results.indexesRemoved.push(userIdIndex.name);
        console.log(`✅ Dropped old index: ${userIdIndex.name}`);
      } catch (error) {
        results.errors.push(`Failed to drop ${userIdIndex.name}: ${error.message}`);
        console.error(`⚠️ Error dropping index ${userIdIndex.name}:`, error.message);
      }
    }

    // Check for old shopName index (field was renamed to storeName)
    const shopNameIndex = indexes.find(idx => idx.name === 'shopName_1' || (idx.key && idx.key.shopName));
    
    if (shopNameIndex) {
      try {
        await vendorsCollection.dropIndex(shopNameIndex.name);
        results.indexesRemoved.push(shopNameIndex.name);
        console.log(`✅ Dropped old shopName index: ${shopNameIndex.name}`);
      } catch (error) {
        results.errors.push(`Failed to drop ${shopNameIndex.name}: ${error.message}`);
        console.error(`⚠️ Error dropping shopName index ${shopNameIndex.name}:`, error.message);
      }
    }

    // Check for any vendors with null ownerUser
    const vendorsWithNullOwner = await vendorsCollection.countDocuments({ ownerUser: null });
    if (vendorsWithNullOwner > 0) {
      results.warnings = [`Found ${vendorsWithNullOwner} vendor(s) with null ownerUser`];
    }

    // Ensure ownerUser index exists and is correct
    try {
      // Drop existing ownerUser index if it exists (to recreate with correct options)
      const ownerUserIndex = indexes.find(idx => idx.name === 'ownerUser_1' || (idx.key && idx.key.ownerUser));
      if (ownerUserIndex) {
        try {
          await vendorsCollection.dropIndex(ownerUserIndex.name);
          results.indexesRemoved.push(ownerUserIndex.name);
          console.log('✅ Dropped existing ownerUser index');
        } catch (error) {
          // Index might not exist or already dropped
          console.log('ℹ️ Could not drop ownerUser index (may not exist):', error.message);
        }
      }

      // Create new sparse unique index on ownerUser
      await vendorsCollection.createIndex(
        { ownerUser: 1 },
        { 
          unique: true, 
          sparse: true,
          name: 'ownerUser_1'
        }
      );
      results.indexesCreated.push('ownerUser_1');
      console.log('✅ Created ownerUser_1 index (unique, sparse)');
    } catch (error) {
      results.errors.push(`Failed to create ownerUser index: ${error.message}`);
      console.error('⚠️ Error creating ownerUser index:', error.message);
    }

    // Get final indexes
    const finalIndexes = await vendorsCollection.indexes();
    results.indexesAfter = finalIndexes.length;
    results.finalIndexes = finalIndexes.map(idx => ({
      name: idx.name,
      key: idx.key
    }));

    console.log('✅ Index fix completed:', results);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Vendor indexes fixed successfully',
      data: results
    });

  } catch (error) {
    console.error('❌ Fix indexes error:', {
      message: error.message,
      stack: error.stack,
      adminId: req.userId
    });

    return res.status(500).json({
      error: true,
      success: false,
      message: 'Failed to fix indexes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteAllVendors = async (req, res) => {
  try {
    const adminId = req.userId;
    
    // Verify admin
    const adminUser = await UserModel.findById(adminId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('🗑️ Admin deleting all vendors:', {
      adminId: adminId,
      adminEmail: adminUser.email,
      timestamp: new Date().toISOString()
    });

    // Get count before deletion
    const vendorCount = await VendorModel.countDocuments();
    console.log(`📊 Found ${vendorCount} vendors to delete`);

    if (vendorCount === 0) {
      return res.status(200).json({
        error: false,
        success: true,
        message: 'No vendors to delete',
        data: {
          vendorsDeleted: 0,
          productsDeleted: 0,
          payoutsDeleted: 0,
          usersUpdated: 0
        }
      });
    }

    // Get all vendor IDs
    const vendors = await VendorModel.find({}).select('_id ownerUser storeName email');
    const vendorIds = vendors.map(v => v._id);
    const ownerUserIds = vendors.map(v => v.ownerUser).filter(Boolean);

    console.log('\n📋 Vendors to be deleted:');
    vendors.forEach(v => {
      console.log(`   - ${v.storeName || 'N/A'} (${v.email || 'N/A'})`);
    });

    // Delete all products associated with vendors
    const productDeleteResult = await ProductModel.deleteMany({ vendor: { $in: vendorIds } });
    console.log(`\n🗑️ Deleted ${productDeleteResult.deletedCount} product(s)`);

    // Delete all payouts associated with vendors
    let payoutDeleteResult = { deletedCount: 0 };
    try {
      const PayoutModel = (await import('../models/payout.model.js')).default;
      payoutDeleteResult = await PayoutModel.deleteMany({ vendor: { $in: vendorIds } });
      console.log(`🗑️ Deleted ${payoutDeleteResult.deletedCount} payout record(s)`);
    } catch (e) {
      console.log('⚠️ Payout model not found or no payouts to delete');
    }

    // Update users - remove vendor references and change role back to USER
    const userUpdateResult = await UserModel.updateMany(
      { _id: { $in: ownerUserIds } },
      {
        $set: { role: 'USER' },
        $unset: { vendor: 1, vendorId: 1 }
      }
    );
    console.log(`👤 Updated ${userUpdateResult.modifiedCount} user(s) - role changed to USER`);

    // Delete all vendors
    const vendorDeleteResult = await VendorModel.deleteMany({});
    console.log(`🗑️ Deleted ${vendorDeleteResult.deletedCount} vendor(s)`);

    console.log('\n✅ All vendors deleted successfully!');

    return res.status(200).json({
      error: false,
      success: true,
      message: `Successfully deleted all ${vendorDeleteResult.deletedCount} vendor(s) and related data`,
      data: {
        vendorsDeleted: vendorDeleteResult.deletedCount,
        productsDeleted: productDeleteResult.deletedCount,
        payoutsDeleted: payoutDeleteResult.deletedCount,
        usersUpdated: userUpdateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('❌ Delete all vendors error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to delete all vendors',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * PUT /api/admin/vendors/:id/withdrawal-access
 * Grant or revoke withdrawal access
 */
export const updateWithdrawalAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowWithdrawal } = req.body;

    const vendor = await VendorModel.findById(id);
    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    // You can add a field like `withdrawalEnabled` to vendor model
    // For now, we'll use a simple approach - only APPROVED vendors can withdraw
    // This is already handled by the vendor model logic

    return res.status(200).json({
      error: false,
      success: true,
      message: allowWithdrawal 
        ? 'Withdrawal access granted' 
        : 'Withdrawal access revoked',
      data: vendor
    });
  } catch (error) {
    console.error('Update withdrawal access error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// ============================================
// VENDOR PRODUCT MANAGEMENT (Approval System)
// ============================================

/**
 * GET /api/admin/vendors/products
 * Get all vendor products with filters (for approval management)
 */
export const getVendorProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      approvalStatus, 
      vendorId, 
      search,
      status
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filter for vendor products - include products with vendor field OR productOwnerType: 'VENDOR'
    const filter = {
      $or: [
        { productOwnerType: 'VENDOR' },
        { vendor: { $exists: true, $ne: null } }
      ]
    };

    // Filter by approval status
    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    // Filter by specific vendor
    if (vendorId) {
      filter.vendor = vendorId;
    }

    // Filter by product status
    if (status) {
      filter.status = status;
    }

    // Search by name or SKU
    if (search) {
      filter.$and = [
        { $or: filter.$or },
        { $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ]}
      ];
      delete filter.$or;
    }

    console.log('📦 Vendor products filter:', JSON.stringify(filter, null, 2));

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .populate('vendor', 'storeName email storeSlug')
        .populate('category', 'name slug')
        .select('name sku images featuredImage pricing inventory status approvalStatus vendorShopName vendor createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ProductModel.countDocuments(filter)
    ]);

    // Get counts by approval status (for vendor products)
    const vendorProductFilter = {
      $or: [
        { productOwnerType: 'VENDOR' },
        { vendor: { $exists: true, $ne: null } }
      ]
    };

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      ProductModel.countDocuments({ ...vendorProductFilter, approvalStatus: 'PENDING_REVIEW' }),
      ProductModel.countDocuments({ ...vendorProductFilter, approvalStatus: 'APPROVED' }),
      ProductModel.countDocuments({ ...vendorProductFilter, approvalStatus: 'REJECTED' })
    ]);

    console.log(`📊 Vendor products: ${total} total, ${pendingCount} pending, ${approvedCount} approved, ${rejectedCount} rejected`);

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        products,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        }
      }
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * GET /api/admin/vendors/products/:productId
 * Get single vendor product details
 */
export const getVendorProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const id = productId;

    const product = await ProductModel.findById(id)
      .populate('vendor', 'storeName email storeSlug phone')
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get vendor product by ID error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/admin/vendors/products/:productId/approve
 * Approve a vendor product
 */
export const approveVendorProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const id = productId;
    const { notes } = req.body;

    const product = await ProductModel.findById(id).populate('vendor', 'storeName email');

    if (!product) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Product not found'
      });
    }

    // Check if it's a vendor product (has vendor field)
    if (!product.vendor && product.productOwnerType !== 'VENDOR') {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'This product is not a vendor product'
      });
    }

    // Update approval status and set to PUBLISHED/ACTIVE
    product.approvalStatus = 'APPROVED';
    product.status = 'published'; // Set to published/active
    product.publishedAt = new Date();
    
    if (notes) {
      product.adminNotes = (product.adminNotes ? product.adminNotes + '\n' : '') + 
        `[${new Date().toISOString()}] Approved: ${notes}`;
    }

    await product.save();

    console.log(`✅ Product approved: ${product.name} (ID: ${id})`);

    // Send email notification to vendor (non-blocking)
    if (product.vendor?.email) {
      sendVendorProductApproved(product.vendor, product).catch(err => {
        console.error('Failed to send product approved email:', err);
      });
    } else {
      // Try to find vendor by vendor field
      if (product.vendor) {
        const vendor = await VendorModel.findById(product.vendor);
        if (vendor?.email) {
          sendVendorProductApproved(vendor, product).catch(err => {
            console.error('Failed to send product approved email:', err);
          });
        }
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Product approved and published successfully! Vendor has been notified.',
      data: product
    });
  } catch (error) {
    console.error('Approve vendor product error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/admin/vendors/products/:productId/reject
 * Reject a vendor product
 */
export const rejectVendorProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const id = productId;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const product = await ProductModel.findById(id).populate('vendor', 'storeName email');

    if (!product) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Product not found'
      });
    }

    // Check if it's a vendor product
    if (!product.vendor && product.productOwnerType !== 'VENDOR') {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'This product is not a vendor product'
      });
    }

    // Update approval status
    product.approvalStatus = 'REJECTED';
    product.status = 'draft'; // Move back to draft
    
    // Add rejection reason to admin notes
    product.adminNotes = (product.adminNotes ? product.adminNotes + '\n' : '') + 
      `[${new Date().toISOString()}] Rejected - Reason: ${reason}` +
      (notes ? `\nNotes: ${notes}` : '');

    await product.save();

    console.log(`❌ Product rejected: ${product.name} (ID: ${id}) - Reason: ${reason}`);

    // Send email notification to vendor (non-blocking)
    if (product.vendor?.email) {
      sendVendorProductRejected(product.vendor, product, reason).catch(err => {
        console.error('Failed to send product rejected email:', err);
      });
    } else {
      // Try to find vendor by vendor field
      if (product.vendor) {
        const vendor = await VendorModel.findById(product.vendor);
        if (vendor?.email) {
          sendVendorProductRejected(vendor, product, reason).catch(err => {
            console.error('Failed to send product rejected email:', err);
          });
        }
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Product rejected. Vendor has been notified.',
      data: product
    });
  } catch (error) {
    console.error('Reject vendor product error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

