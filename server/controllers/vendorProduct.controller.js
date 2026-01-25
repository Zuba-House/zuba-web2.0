import ProductModel from '../models/product.model.js';
import VendorModel from '../models/vendor.model.js';
import { 
  sendAdminProductSubmission, 
  sendVendorProductSubmitted 
} from '../utils/vendorEmails.js';

/**
 * GET /api/vendor/products
 * List vendor's products (scoped to vendor)
 */
export const list = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const { page = 1, limit = 20, search = '', status, approvalStatus } = req.query;

    const filter = { vendor: vendorId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('categories', 'name slug')
        .lean(),
      ProductModel.countDocuments(filter)
    ]);

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('vendorProduct.list error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * POST /api/vendor/products
 * Create a new product (vendor-scoped)
 */
export const create = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const data = req.body;

    // Get vendor details for emails
    const vendor = await VendorModel.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    // Ensure vendor fields are set
    const productData = {
      ...data,
      vendor: vendorId,
      vendorId: vendorId, // Keep both for backward compatibility
      vendorShopName: vendor.storeName || '',
      productOwnerType: 'VENDOR',
      approvalStatus: 'PENDING_REVIEW', // Requires admin approval
      status: 'draft' // Start as draft until approved
    };

    const product = new ProductModel(productData);
    await product.save();

    // Populate category for email
    await product.populate('category', 'name slug');

    console.log(`📦 New product submitted by vendor ${vendor.storeName}: ${product.name}`);

    // Send email notifications (non-blocking)
    // 1. Email to vendor confirming submission
    sendVendorProductSubmitted(vendor, product).catch(err => {
      console.error('Failed to send vendor product submitted email:', err);
    });

    // 2. Email to admin about new submission
    sendAdminProductSubmission(vendor, product).catch(err => {
      console.error('Failed to send admin product submission email:', err);
    });

    return res.status(201).json({
      error: false,
      success: true,
      message: 'Product submitted successfully! It will be reviewed within 24-48 hours.',
      data: product
    });
  } catch (error) {
    console.error('vendorProduct.create error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * GET /api/vendor/products/:id
 * Get single product (vendor-scoped)
 */
export const get = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const productId = req.params.id;

    const product = await ProductModel.findOne({
      _id: productId,
      vendor: vendorId
    })
      .populate('categories', 'name slug')
      .populate('vendor', 'storeName storeSlug');

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
    console.error('vendorProduct.get error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/vendor/products/:id
 * Update product (vendor-scoped)
 */
export const update = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const productId = req.params.id;
    const updates = req.body;

    // Remove fields vendor shouldn't change
    delete updates.vendor;
    delete updates.vendorId;
    delete updates.productOwnerType;
    delete updates.approvalStatus; // Only admin can change this

    // If updating, set approval back to pending if it was approved
    if (updates.status === 'PUBLISHED' || Object.keys(updates).length > 0) {
      updates.approvalStatus = 'PENDING_REVIEW';
    }

    const product = await ProductModel.findOneAndUpdate(
      { _id: productId, vendor: vendorId },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug');

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
      message: 'Product updated successfully. Waiting for approval.',
      data: product
    });
  } catch (error) {
    console.error('vendorProduct.update error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * DELETE /api/vendor/products/:id
 * Permanently delete product (vendor-scoped)
 */
export const remove = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const productId = req.params.id;

    // Find the product first to verify ownership
    const product = await ProductModel.findOne({
      _id: productId,
      vendor: vendorId
    });

    if (!product) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Product not found'
      });
    }

    // Permanently delete the product
    await ProductModel.findByIdAndDelete(productId);

    console.log(`🗑️ Product permanently deleted by vendor: ${product.name} (ID: ${productId})`);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Product deleted permanently'
    });
  } catch (error) {
    console.error('vendorProduct.remove error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * GET /api/vendor/products/available
 * Browse products available for claiming (products without a vendor)
 * Vendors can see all products that don't have a vendor assigned yet
 */
export const browseAvailable = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const { page = 1, limit = 20, search = '', category, sort = 'newest' } = req.query;

    // Build filter: products without vendor assigned
    // Only show products that don't have a vendor (null or doesn't exist)
    // This ensures one product = one vendor (no duplicates)
    const filter = {
      $or: [
        { vendor: null }, // No vendor assigned
        { vendor: { $exists: false } } // Vendor field doesn't exist
      ],
      status: 'published' // Only show published products
    };

    // Search filter
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name_asc':
        sortOption = { name: 1 };
        break;
      case 'name_desc':
        sortOption = { name: -1 };
        break;
      case 'price_low':
        sortOption = { 'pricing.price': 1, price: 1 };
        break;
      case 'price_high':
        sortOption = { 'pricing.price': -1, price: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name slug')
        .populate('categories', 'name slug')
        .select('-__v')
        .lean(),
      ProductModel.countDocuments(filter)
    ]);

    console.log(`📦 Vendor ${vendorId} browsing available products: ${total} found`);

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('vendorProduct.browseAvailable error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * POST /api/vendor/products/:id/claim
 * Claim/add an existing product to vendor's store
 * One product can only belong to one vendor (no duplicates)
 */
export const claimProduct = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const productId = req.params.id;

    // Get vendor details
    const vendor = await VendorModel.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor is approved
    if (vendor.status !== 'APPROVED') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Only approved vendors can claim products. Your account is pending approval.'
      });
    }

    // Find the product
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product already has a vendor
    if (product.vendor && product.vendor.toString() !== vendorId.toString()) {
      const existingVendor = await VendorModel.findById(product.vendor).select('storeName');
      return res.status(400).json({
        error: true,
        success: false,
        message: `This product already belongs to "${existingVendor?.storeName || 'another vendor'}". Each product can only belong to one vendor.`,
        data: {
          existingVendor: existingVendor?.storeName || 'Unknown',
          productId: product._id,
          productName: product.name
        }
      });
    }

    // Check if vendor already owns this product
    if (product.vendor && product.vendor.toString() === vendorId.toString()) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'You already own this product',
        data: {
          productId: product._id,
          productName: product.name
        }
      });
    }

    // Check if product is published
    if (product.status !== 'published') {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Only published products can be claimed'
      });
    }

    // Claim the product - assign to vendor
    product.vendor = vendorId;
    product.vendorId = vendorId; // Backward compatibility
    product.vendorShopName = vendor.storeName || '';
    product.productOwnerType = 'VENDOR';
    // Keep existing approvalStatus if it exists, otherwise set to APPROVED for claimed products
    if (!product.approvalStatus) {
      product.approvalStatus = 'APPROVED';
    }
    // Keep product published status
    product.status = 'published';

    await product.save();

    // Populate for response
    await product.populate('category', 'name slug');
    await product.populate('vendor', 'storeName storeSlug');

    console.log(`✅ Product "${product.name}" claimed by vendor "${vendor.storeName}" (ID: ${vendorId})`);

    return res.status(200).json({
      error: false,
      success: true,
      message: `Product "${product.name}" has been successfully added to your store!`,
      data: product
    });
  } catch (error) {
    console.error('vendorProduct.claimProduct error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to claim product'
    });
  }
};

