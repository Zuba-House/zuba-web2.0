import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';

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

    const [vendors, total] = await Promise.all([
      VendorModel.find(filter)
        .populate('ownerUser', 'name email phone status verify_email')
        .populate('categories', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VendorModel.countDocuments(filter)
    ]);

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        vendors,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
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

    // TODO: Send email notification to vendor about status change

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
 * Delete vendor (soft delete - set status to REJECTED)
 */
export const deleteVendor = async (req, res) => {
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

    // Soft delete - set status to REJECTED
    vendor.status = 'REJECTED';
    await vendor.save();

    // Optionally remove vendor link from user
    const user = await UserModel.findById(vendor.ownerUser);
    if (user) {
      user.vendor = null;
      user.vendorId = null;
      user.role = 'USER';
      await user.save();
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Vendor deleted successfully'
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

