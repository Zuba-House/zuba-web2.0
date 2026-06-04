import VendorModel from '../models/vendor.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';
import PayoutModel from '../models/payout.model.js';

export const DEMO_PAYMENT_PREFIX = 'DEMO-OWNIT-';
const COMMISSION_RATE = 15;

/** Demo targets (USD, 15% Zuba House commission) */
const DEMO = {
  deliveredNet: 965.23,
  pendingNet: 397.8,
  withdrawn: 965.23
};

const round2 = (n) => parseFloat(Number(n).toFixed(2));
const netFromGross = (gross) => round2(gross * (1 - COMMISSION_RATE / 100));
const grossFromNet = (net) => round2(net / (1 - COMMISSION_RATE / 100));

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

const clearExistingDemoData = async (vendorId) => {
  await OrderModel.deleteMany({ paymentId: { $regex: `^${DEMO_PAYMENT_PREFIX}` } });
  await PayoutModel.deleteMany({
    vendor: vendorId,
    transactionRef: { $regex: /^DEMO-MOMO-OWNIT/ }
  });
};

/**
 * Seed / refresh demo data for Own It! (Rwanda, USD, 15% commission).
 * Idempotent — removes old demo records and recreates balanced figures.
 */
export async function seedOwnItDemoData({ force = true } = {}) {
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
    Math.abs((vendor.totalEarnings || 0) - DEMO.deliveredNet) > 0.5 ||
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

  // Delivered — net $965.23 total (withdrawn via MoMo)
  const deliveredItems = [
    buildItem(vendor, p(0), 320, 1, 'DELIVERED', 45),
    buildItem(vendor, p(1), 280, 1, 'DELIVERED', 38),
    buildItem(vendor, p(2), 255.56, 1, 'DELIVERED', 30),
    buildItem(vendor, p(3), 280, 1, 'DELIVERED', 22)
  ];
  const deliveredNetActual = round2(deliveredItems.reduce((s, item) => s + item.vendorEarning, 0));
  const deliveredAdjust = round2(DEMO.deliveredNet - deliveredNetActual);
  if (Math.abs(deliveredAdjust) > 0) {
    const last = deliveredItems[3];
    const grossBump = round2(deliveredAdjust / (1 - COMMISSION_RATE / 100));
    last.subTotal = round2(last.subTotal + grossBump);
    last.price = last.subTotal;
    last.commissionAmount = round2((last.subTotal * COMMISSION_RATE) / 100);
    last.vendorEarning = round2(last.subTotal - last.commissionAmount);
    last.unitPrice = last.price;
  }

  // Pending — net $397.80 total
  const pendingSpecs = [
    { gross: 125, status: 'SHIPPED', days: 5, product: 4 },
    { gross: 98, status: 'SHIPPED', days: 3, product: 5 },
    { gross: 156, status: 'PROCESSING', days: 2, product: 0 },
    { gross: 89, status: 'RECEIVED', days: 1, product: 1 }
  ];
  const pendingItems = pendingSpecs.map((spec) =>
    buildItem(vendor, p(spec.product), spec.gross, 1, spec.status, spec.days)
  );
  const pendingNetActual = round2(pendingItems.reduce((s, item) => s + item.vendorEarning, 0));
  const pendingAdjust = round2(DEMO.pendingNet - pendingNetActual);
  if (pendingAdjust !== 0) {
    const last = pendingItems[3];
    const grossBump = round2(pendingAdjust / (1 - COMMISSION_RATE / 100));
    last.subTotal = round2(last.subTotal + grossBump);
    last.price = last.subTotal;
    last.commissionAmount = round2((last.subTotal * COMMISSION_RATE) / 100);
    last.vendorEarning = round2(last.subTotal - last.commissionAmount);
    last.unitPrice = last.price;
  }

  const demoOrders = [
    ...deliveredItems.map((item, i) => buildOrder(vendor, [item], 45 - i * 7, `D${i + 1}`)),
    ...pendingItems.map((item, i) => buildOrder(vendor, [item], pendingSpecs[i].days, `P${i + 1}`))
  ];

  await OrderModel.insertMany(demoOrders);

  const allItems = demoOrders.flatMap((o) => o.products);
  const totalGross = round2(allItems.reduce((s, item) => s + item.subTotal, 0));
  const totalNet = round2(allItems.reduce((s, item) => s + item.vendorEarning, 0));
  const totalCommission = round2(totalGross - totalNet);
  const productsSold = allItems.reduce((s, item) => s + (item.quantity || 1), 0);
  const deliveredNet = round2(deliveredItems.reduce((s, item) => s + item.vendorEarning, 0));
  const pendingNet = round2(pendingItems.reduce((s, item) => s + item.vendorEarning, 0));

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
      availableBalance: 0,
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

  console.log(`Own It demo seed complete for "${vendor.storeName}"`);
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
    withdrawn: DEMO.withdrawn,
    commissionRate: COMMISSION_RATE
  };
}

export default seedOwnItDemoData;
