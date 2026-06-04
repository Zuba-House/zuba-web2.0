import VendorModel from '../models/vendor.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';
import PayoutModel from '../models/payout.model.js';

export const DEMO_PAYMENT_PREFIX = 'DEMO-OWNIT-';
export const DEMO_SEED_VERSION = 3;
const COMMISSION_RATE = 15;

/** Minimum demo order count — reseed if older seed had fewer */
const MIN_DEMO_ORDERS = 24;

const DEMO = {
  withdrawn: 965.23
};

const round2 = (n) => parseFloat(Number(n).toFixed(2));

const buildItem = (vendor, product, gross, quantity, vendorStatus, daysAgo = 0) => {
  const subTotal = round2(gross * quantity);
  const platformCommission = round2((subTotal * COMMISSION_RATE) / 100);
  const vendorEarning = round2(subTotal - platformCommission);

  return {
    productId: String(product._id),
    productTitle: product.name,
    quantity,
    price: gross,
    subTotal,
    image: product.featuredImage || product.images?.[0]?.url || '',
    vendor: vendor._id,
    vendorId: vendor._id,
    vendorShopName: vendor.storeName,
    vendorStatus,
    commissionType: 'PERCENT',
    commissionValue: COMMISSION_RATE,
    commissionAmount: platformCommission,
    commissionRate: COMMISSION_RATE,
    vendorEarning,
    unitPrice: gross,
    trackingNumber: vendorStatus === 'SHIPPED' ? `RW-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : '',
    shippedAt: vendorStatus === 'SHIPPED' ? new Date(Date.now() - daysAgo * 86400000) : null,
    deliveredAt: vendorStatus === 'DELIVERED' ? new Date(Date.now() - daysAgo * 86400000) : null
  };
};

const buildOrder = (vendor, items, daysAgo, suffix) => {
  const createdAt = new Date(Date.now() - daysAgo * 86400000);
  const totalAmt = round2(items.reduce((sum, item) => sum + item.subTotal, 0));
  const vendorEarning = round2(items.reduce((sum, item) => sum + item.vendorEarning, 0));
  const primaryStatus = items[0]?.vendorStatus || 'RECEIVED';
  const statusMap = {
    RECEIVED: 'Received',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered'
  };

  return {
    paymentId: `${DEMO_PAYMENT_PREFIX}${suffix}`,
    payment_status: 'paid',
    fulfillmentCompleted: true,
    order_status: 'confirm',
    status: statusMap[primaryStatus] || 'Received',
    isGuestOrder: true,
    guestCustomer: {
      name: 'Demo Customer',
      email: 'demo.customer@zubahouse.com',
      phone: '+250788000000'
    },
    customerName: 'Demo Customer',
    phone: '+250788000000',
    shippingAddress: {
      addressLine1: 'KN 4 Ave',
      city: 'Kigali',
      country: 'Rwanda',
      countryCode: 'RW',
      postalCode: '00000'
    },
    products: items,
    vendors: [{
      vendorId: vendor._id,
      vendorShopName: vendor.storeName,
      totalAmount: totalAmt,
      commission: round2(totalAmt - vendorEarning),
      vendorEarning
    }],
    vendorSummary: [{
      vendor: vendor._id,
      vendorShopName: vendor.storeName,
      grossAmount: totalAmt,
      commissionAmount: round2(totalAmt - vendorEarning),
      netEarning: vendorEarning,
      payoutStatus: primaryStatus === 'DELIVERED' ? 'PAID' : 'PENDING',
      itemsCount: items.length
    }],
    totalAmt,
    subtotal: totalAmt,
    finalTotal: totalAmt,
    createdAt,
    updatedAt: createdAt
  };
};

/** Demo order plan — lifetime totals, includes today's activity (daysAgo: 0) */
const ORDER_PLAN = [
  // 16 completed sales (delivered)
  { status: 'DELIVERED', gross: 89, qty: 1, daysAgo: 52, product: 0 },
  { status: 'DELIVERED', gross: 95, qty: 1, daysAgo: 48, product: 1 },
  { status: 'DELIVERED', gross: 72, qty: 2, daysAgo: 44, product: 2 },
  { status: 'DELIVERED', gross: 110, qty: 1, daysAgo: 40, product: 3 },
  { status: 'DELIVERED', gross: 88, qty: 1, daysAgo: 36, product: 4 },
  { status: 'DELIVERED', gross: 102, qty: 1, daysAgo: 32, product: 5 },
  { status: 'DELIVERED', gross: 76, qty: 1, daysAgo: 28, product: 0 },
  { status: 'DELIVERED', gross: 98, qty: 2, daysAgo: 24, product: 1 },
  { status: 'DELIVERED', gross: 85, qty: 1, daysAgo: 20, product: 2 },
  { status: 'DELIVERED', gross: 118, qty: 1, daysAgo: 16, product: 3 },
  { status: 'DELIVERED', gross: 92, qty: 1, daysAgo: 12, product: 4 },
  { status: 'DELIVERED', gross: 105, qty: 1, daysAgo: 9, product: 5 },
  { status: 'DELIVERED', gross: 78, qty: 1, daysAgo: 7, product: 0 },
  { status: 'DELIVERED', gross: 96, qty: 1, daysAgo: 5, product: 1 },
  { status: 'DELIVERED', gross: 112, qty: 1, daysAgo: 3, product: 2 },
  { status: 'DELIVERED', gross: 68, qty: 1, daysAgo: 0, product: 3 }, // sale today

  // 6 shipped (2 today)
  { status: 'SHIPPED', gross: 125, qty: 1, daysAgo: 0, product: 4 },
  { status: 'SHIPPED', gross: 98, qty: 1, daysAgo: 0, product: 5 },
  { status: 'SHIPPED', gross: 142, qty: 2, daysAgo: 1, product: 0 },
  { status: 'SHIPPED', gross: 87, qty: 1, daysAgo: 2, product: 1 },
  { status: 'SHIPPED', gross: 115, qty: 1, daysAgo: 4, product: 2 },
  { status: 'SHIPPED', gross: 93, qty: 1, daysAgo: 6, product: 3 },

  // 3 processing (1 today)
  { status: 'PROCESSING', gross: 156, qty: 1, daysAgo: 0, product: 4 },
  { status: 'PROCESSING', gross: 134, qty: 1, daysAgo: 1, product: 5 },
  { status: 'PROCESSING', gross: 88, qty: 2, daysAgo: 2, product: 0 },

  // 2 new received (1 today)
  { status: 'RECEIVED', gross: 79, qty: 1, daysAgo: 0, product: 1 },
  { status: 'RECEIVED', gross: 64, qty: 1, daysAgo: 1, product: 2 }
];

const clearExistingDemoData = async (vendorId) => {
  await OrderModel.deleteMany({ paymentId: { $regex: `^${DEMO_PAYMENT_PREFIX}` } });
  await PayoutModel.deleteMany({
    vendor: vendorId,
    transactionRef: { $regex: /^DEMO-MOMO-OWNIT/ }
  });
};

export async function seedOwnItDemoData({ force = false } = {}) {
  const vendor = await VendorModel.findOne({
    storeName: { $regex: /own\s*it/i }
  });

  if (!vendor) {
    console.log('Own It demo seed: vendor not found, skipping');
    return { skipped: true, reason: 'vendor_not_found' };
  }

  const existingDemoOrders = await OrderModel.countDocuments({
    paymentId: { $regex: `^${DEMO_PAYMENT_PREFIX}` }
  });

  const needsReseed =
    force ||
    existingDemoOrders === 0 ||
    existingDemoOrders < MIN_DEMO_ORDERS ||
    (vendor.commissionValue ?? 10) !== COMMISSION_RATE;

  if (!needsReseed) {
    console.log('Own It demo seed: balances look correct, skipping');
    return { skipped: true, reason: 'already_seeded', vendorId: vendor._id };
  }

  if (existingDemoOrders > 0) {
    await clearExistingDemoData(vendor._id);
  }

  const products = await ProductModel.find({ vendor: vendor._id }).limit(6);
  if (products.length === 0) {
    console.log('Own It demo seed: no products found, skipping');
    return { skipped: true, reason: 'no_products', vendorId: vendor._id };
  }

  const p = (index) => products[index % products.length];

  const demoOrders = ORDER_PLAN.map((spec, i) => {
    const item = buildItem(vendor, p(spec.product), spec.gross, spec.qty, spec.status, spec.daysAgo);
    const suffix = `${String(i + 1).padStart(3, '0')}`;
    return buildOrder(vendor, [item], spec.daysAgo, suffix);
  });

  await OrderModel.insertMany(demoOrders);

  const allItems = demoOrders.flatMap((o) => o.products);
  const deliveredItems = allItems.filter((item) => item.vendorStatus === 'DELIVERED');
  const pendingItems = allItems.filter((item) => item.vendorStatus !== 'DELIVERED');

  const totalGross = round2(allItems.reduce((s, item) => s + item.subTotal, 0));
  const totalNet = round2(allItems.reduce((s, item) => s + item.vendorEarning, 0));
  const totalCommission = round2(totalGross - totalNet);
  const productsSold = allItems.reduce((s, item) => s + (item.quantity || 1), 0);
  const deliveredNet = round2(deliveredItems.reduce((s, item) => s + item.vendorEarning, 0));
  const pendingNet = round2(pendingItems.reduce((s, item) => s + item.vendorEarning, 0));
  const availableBalance = round2(Math.max(0, deliveredNet - DEMO.withdrawn));

  const statusCounts = allItems.reduce((acc, item) => {
    acc[item.vendorStatus] = (acc[item.vendorStatus] || 0) + 1;
    return acc;
  }, {});

  await PayoutModel.create({
    vendor: vendor._id,
    amount: DEMO.withdrawn,
    currency: 'USD',
    status: 'PAID',
    requestedBy: vendor.ownerUser,
    notes: 'Demo withdrawal — MTN MoMo, Kigali, Rwanda',
    paymentMethodSnapshot: {
      payoutMethod: 'MOMO',
      accountName: vendor.storeName,
      momoNumber: '+250788123456',
      momoProvider: 'MTN'
    },
    transactionRef: 'DEMO-MOMO-OWNIT-96523',
    requestedAt: new Date(Date.now() - 7 * 86400000),
    approvedAt: new Date(Date.now() - 6 * 86400000),
    paidAt: new Date(Date.now() - 5 * 86400000)
  });

  await ProductModel.updateMany(
    { vendor: vendor._id },
    {
      $set: {
        status: 'published',
        approvalStatus: 'APPROVED',
        productOwnerType: 'VENDOR'
      }
    }
  );

  const publishedCount = await ProductModel.countDocuments({
    vendor: vendor._id,
    status: 'published',
    approvalStatus: 'APPROVED'
  });

  await VendorModel.findByIdAndUpdate(vendor._id, {
    $set: {
      status: 'APPROVED',
      country: 'Rwanda',
      city: 'Kigali',
      commissionType: 'PERCENT',
      commissionValue: COMMISSION_RATE,
      totalEarnings: deliveredNet,
      availableBalance,
      withdrawnAmount: DEMO.withdrawn,
      pendingBalance: pendingNet,
      totalSales: deliveredItems.length,
      payoutMethod: 'MOMO',
      isVerified: true,
      onboardingCompleted: true,
      payoutDetails: {
        accountName: vendor.storeName,
        momoNumber: '+250788123456',
        momoProvider: 'MTN'
      },
      'stats.totalProducts': products.length,
      'stats.publishedProducts': publishedCount,
      'stats.totalOrders': demoOrders.length
    }
  });

  console.log(`Own It demo seed v${DEMO_SEED_VERSION} complete for "${vendor.storeName}"`);
  return {
    seeded: true,
    vendorId: vendor._id,
    orders: demoOrders.length,
    productsSold,
    totalGross,
    totalNet,
    totalCommission,
    deliveredNet,
    pendingNet,
    availableBalance,
    withdrawn: DEMO.withdrawn,
    commissionRate: COMMISSION_RATE,
    statusCounts
  };
}

export default seedOwnItDemoData;
