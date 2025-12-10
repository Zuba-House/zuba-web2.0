/**
 * Vendor Subscription Controller
 * Manages subscription plans and vendor subscriptions
 */

import SubscriptionPlanModel from '../models/subscriptionPlan.model.js';
import VendorModel from '../models/vendor.model.js';

/**
 * Get all subscription plans
 * GET /api/vendor-subscriptions/plans
 */
export const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlanModel.getActivePlans();
    
    return res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription plans'
    });
  }
};

/**
 * Get single plan by ID or slug
 * GET /api/vendor-subscriptions/plans/:identifier
 */
export const getPlan = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let plan;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await SubscriptionPlanModel.findById(identifier);
    } else {
      plan = await SubscriptionPlanModel.findOne({ slug: identifier, isActive: true });
    }
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }
    
    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription plan'
    });
  }
};

/**
 * Get vendor's current subscription
 * GET /api/vendor-subscriptions/my-subscription
 */
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.userId;
    
    const vendor = await VendorModel.findOne({ userId })
      .populate('subscriptionDetails.planId')
      .select('subscriptionTier subscriptionDetails features');
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    return res.json({
      success: true,
      subscription: {
        tier: vendor.subscriptionTier,
        details: vendor.subscriptionDetails,
        features: vendor.features,
        isActive: vendor.isSubscriptionActive()
      }
    });
  } catch (error) {
    console.error('Get my subscription error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription'
    });
  }
};

/**
 * Upgrade/change subscription
 * POST /api/vendor-subscriptions/upgrade
 */
export const upgradeSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId, paymentMethod, paymentDetails } = req.body;
    
    const vendor = await VendorModel.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    const plan = await SubscriptionPlanModel.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found or inactive'
      });
    }
    
    // Here you would integrate with payment gateway
    // For now, we'll just update the subscription
    
    const oldTier = vendor.subscriptionTier;
    await vendor.upgradeSubscription(plan.slug, planId, {
      paymentMethod,
      transactionId: paymentDetails?.transactionId
    });
    
    return res.json({
      success: true,
      message: `Successfully upgraded from ${oldTier} to ${plan.name}`,
      subscription: {
        tier: vendor.subscriptionTier,
        details: vendor.subscriptionDetails,
        features: vendor.features
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upgrade subscription'
    });
  }
};

/**
 * Cancel subscription (downgrade to free)
 * POST /api/vendor-subscriptions/cancel
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { reason } = req.body;
    
    const vendor = await VendorModel.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    if (vendor.subscriptionTier === 'free') {
      return res.status(400).json({
        success: false,
        error: 'You are already on the free plan'
      });
    }
    
    // Set to expire at end of current period instead of immediate cancellation
    vendor.subscriptionDetails.autoRenew = false;
    vendor.subscriptionDetails.cancellationReason = reason;
    vendor.subscriptionDetails.cancelledAt = new Date();
    await vendor.save();
    
    return res.json({
      success: true,
      message: 'Subscription will be cancelled at end of billing period',
      expiryDate: vendor.subscriptionDetails.expiryDate
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
};

/**
 * Start trial
 * POST /api/vendor-subscriptions/start-trial
 */
export const startTrial = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId } = req.body;
    
    const vendor = await VendorModel.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    // Check if vendor has already used trial
    if (vendor.subscriptionDetails?.trialUsed) {
      return res.status(400).json({
        success: false,
        error: 'Trial has already been used'
      });
    }
    
    const plan = await SubscriptionPlanModel.findById(planId);
    if (!plan || !plan.isActive || plan.trialDays <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Trial not available for this plan'
      });
    }
    
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);
    
    vendor.subscriptionTier = plan.slug;
    vendor.subscriptionDetails = {
      planId,
      startDate: new Date(),
      isActive: true,
      isTrialActive: true,
      trialEndDate,
      trialUsed: true
    };
    
    await vendor.save();
    
    return res.json({
      success: true,
      message: `Started ${plan.trialDays}-day trial for ${plan.name}`,
      trialEndDate
    });
  } catch (error) {
    console.error('Start trial error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to start trial'
    });
  }
};

// ═══════════════════════════════════════════════════════
// ADMIN CONTROLLERS
// ═══════════════════════════════════════════════════════

/**
 * Admin: Create subscription plan
 * POST /api/vendor-subscriptions/admin/plans
 */
export const adminCreatePlan = async (req, res) => {
  try {
    const planData = req.body;
    
    const plan = new SubscriptionPlanModel(planData);
    await plan.save();
    
    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Admin create plan error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription plan'
    });
  }
};

/**
 * Admin: Update subscription plan
 * PUT /api/vendor-subscriptions/admin/plans/:id
 */
export const adminUpdatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const plan = await SubscriptionPlanModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Admin update plan error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update subscription plan'
    });
  }
};

/**
 * Admin: Delete subscription plan
 * DELETE /api/vendor-subscriptions/admin/plans/:id
 */
export const adminDeletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if any vendors are using this plan
    const vendorsUsingPlan = await VendorModel.countDocuments({
      'subscriptionDetails.planId': id
    });
    
    if (vendorsUsingPlan > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete plan. ${vendorsUsingPlan} vendor(s) are currently using it.`
      });
    }
    
    const plan = await SubscriptionPlanModel.findByIdAndDelete(id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete plan error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete subscription plan'
    });
  }
};

/**
 * Admin: Manually set vendor subscription
 * POST /api/vendor-subscriptions/admin/vendors/:vendorId/subscription
 */
export const adminSetVendorSubscription = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { tier, planId, expiryDate, notes } = req.body;
    
    const vendor = await VendorModel.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    vendor.subscriptionTier = tier;
    vendor.subscriptionDetails = {
      ...vendor.subscriptionDetails,
      planId,
      isActive: true,
      startDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      adminAssigned: true,
      adminNotes: notes
    };
    
    await vendor.save();
    
    return res.json({
      success: true,
      message: `Vendor subscription set to ${tier}`,
      vendor: {
        _id: vendor._id,
        shopName: vendor.shopName,
        subscriptionTier: vendor.subscriptionTier,
        subscriptionDetails: vendor.subscriptionDetails
      }
    });
  } catch (error) {
    console.error('Admin set vendor subscription error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to set vendor subscription'
    });
  }
};

/**
 * Admin: Get subscription stats
 * GET /api/vendor-subscriptions/admin/stats
 */
export const adminGetStats = async (req, res) => {
  try {
    const stats = await VendorModel.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$subscriptionTier',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalVendors = stats.reduce((sum, s) => sum + s.count, 0);
    const tierBreakdown = {};
    stats.forEach(s => {
      tierBreakdown[s._id || 'unknown'] = {
        count: s.count,
        percentage: ((s.count / totalVendors) * 100).toFixed(1)
      };
    });
    
    return res.json({
      success: true,
      stats: {
        totalVendors,
        tierBreakdown
      }
    });
  } catch (error) {
    console.error('Admin get subscription stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get subscription stats'
    });
  }
};

export default {
  getAllPlans,
  getPlan,
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  startTrial,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminSetVendorSubscription,
  adminGetStats
};

