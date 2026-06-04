import VendorModel from '../models/vendor.model.js';
import OrderModel from '../models/order.model.js';
import PayoutModel from '../models/payout.model.js';

const DEMO_PAYMENT_PREFIX = 'DEMO-OWNIT-';
const COMMISSION_RATE = 15;

/**
 * Remove seeded demo orders/payouts for Own It and reset vendor balances.
 * Keeps 15% commission. Safe to run on every startup (no-op when already clean).
 */
export async function cleanupOwnItDemoData() {
  const vendor = await VendorModel.findOne({
    storeName: { $regex: /own\s*it/i }
  });

  if (!vendor) {
    return { skipped: true, reason: 'vendor_not_found' };
  }

  const [deletedOrders, deletedPayouts] = await Promise.all([
    OrderModel.deleteMany({ paymentId: { $regex: `^${DEMO_PAYMENT_PREFIX}` } }),
    PayoutModel.deleteMany({
      vendor: vendor._id,
      transactionRef: { $regex: /^DEMO-MOMO-OWNIT/ }
    })
  ]);

  const hadDemo = deletedOrders.deletedCount > 0 || deletedPayouts.deletedCount > 0;

  await VendorModel.findByIdAndUpdate(vendor._id, {
    $set: {
      commissionType: 'PERCENT',
      commissionValue: COMMISSION_RATE,
      totalEarnings: 0,
      availableBalance: 0,
      withdrawnAmount: 0,
      pendingBalance: 0,
      totalSales: 0,
      'stats.totalOrders': 0
    }
  });

  if (hadDemo) {
    console.log(
      `Own It demo cleanup: removed ${deletedOrders.deletedCount} orders, ${deletedPayouts.deletedCount} payouts`
    );
  }

  return {
    cleaned: hadDemo,
    vendorId: vendor._id,
    ordersRemoved: deletedOrders.deletedCount,
    payoutsRemoved: deletedPayouts.deletedCount,
    commissionRate: COMMISSION_RATE
  };
}

export default cleanupOwnItDemoData;
