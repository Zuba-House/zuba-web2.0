import VendorModel from '../models/vendor.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';
import PayoutModel from '../models/payout.model.js';

export const DEMO_PAYMENT_PREFIX = 'DEMO-OWNIT-';
const COMMISSION_RATE = 15;

const buildItem = (vendor, product, price, quantity, vendorStatus, daysAgo = 0) => {
  const subTotal = parseFloat((price * quantity).toFixed(2));
  const platformCommission = parseFloat(((subTotal * COMMISSION_RATE) / 100).toFixed(2));
  const vendorEarning = parseFloat((subTotal - platformCommission).toFixed(2));

  return {
    productId: String(product._id),
    productTitle: product.name,
    quantity,
    price,
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
    unitPrice: price,
    trackingNumber: vendorStatus === 'SHIPPED' ? `RW-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : '',
    shippedAt: vendorStatus === 'SHIPPED' ? new Date(Date.now() - daysAgo * 86400000) : null,
    deliveredAt: vendorStatus === 'DELIVERED' ? new Date(Date.now() - daysAgo * 86400000) : null
  };
};

const buildOrder = (vendor, items, daysAgo, suffix) => {
  const createdAt = new Date(Date.now() - daysAgo * 86400000);
  const totalAmt = items.reduce((sum, item) => sum + item.subTotal, 0);
  const vendorEarning = items.reduce((sum, item) => sum + item.vendorEarning, 0);
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
      commission: parseFloat((totalAmt - vendorEarning).toFixed(2)),
      vendorEarning
    }],
    vendorSummary: [{
      vendor: vendor._id,
      vendorShopName: vendor.storeName,
      grossAmount: totalAmt,
      commissionAmount: parseFloat((totalAmt - vendorEarning).toFixed(2)),
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

export async function seedOwnItDemoData() {
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

  if (existingDemoOrders > 0) {
    console.log('Own It demo seed: demo data already present, skipping');
    return { skipped: true, reason: 'already_seeded', vendorId: vendor._id };
  }

  const products = await ProductModel.find({ vendor: vendor._id }).limit(6);
  if (products.length === 0) {
    console.log('Own It demo seed: no products found, skipping');
    return { skipped: true, reason: 'no_products', vendorId: vendor._id };
  }

  const p = (index) => products[index % products.length];

  const demoOrders = [
    buildOrder(vendor, [buildItem(vendor, p(0), 285.5, 1, 'DELIVERED', 45)], 45, '001'),
    buildOrder(vendor, [buildItem(vendor, p(1), 312, 1, 'DELIVERED', 38)], 38, '002'),
    buildOrder(vendor, [buildItem(vendor, p(2), 198.75, 1, 'DELIVERED', 30)], 30, '003'),
    buildOrder(vendor, [buildItem(vendor, p(3), 339.31, 1, 'DELIVERED', 22)], 22, '004'),
    buildOrder(vendor, [buildItem(vendor, p(4), 125, 1, 'SHIPPED', 5)], 5, '005'),
    buildOrder(vendor, [buildItem(vendor, p(5), 98, 1, 'SHIPPED', 3)], 3, '006'),
    buildOrder(vendor, [buildItem(vendor, p(0), 156, 1, 'PROCESSING', 2)], 2, '007'),
    buildOrder(vendor, [buildItem(vendor, p(1), 89, 1, 'RECEIVED', 1)], 1, '008')
  ];

  await OrderModel.insertMany(demoOrders);

  const pendingEarnings = demoOrders
    .flatMap((order) => order.products)
    .filter((item) => item.vendorStatus !== 'DELIVERED')
    .reduce((sum, item) => sum + item.vendorEarning, 0);

  const totalDeliveredEarnings = 965.23;

  await PayoutModel.create({
    vendor: vendor._id,
    amount: totalDeliveredEarnings,
    currency: 'USD',
    status: 'PAID',
    requestedBy: vendor.ownerUser,
    notes: 'Demo withdrawal - Mobile Money (MTN MoMo), Kigali, Rwanda',
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
      totalEarnings: totalDeliveredEarnings,
      availableBalance: 0,
      withdrawnAmount: totalDeliveredEarnings,
      pendingBalance: parseFloat(pendingEarnings.toFixed(2)),
      totalSales: 4,
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
      'stats.totalOrders': 8
    }
  });

  console.log(`Own It demo seed complete for "${vendor.storeName}" (${vendor._id})`);
  return {
    seeded: true,
    vendorId: vendor._id,
    orders: demoOrders.length,
    totalEarnings: totalDeliveredEarnings,
    pendingEarnings: parseFloat(pendingEarnings.toFixed(2))
  };
}

export default seedOwnItDemoData;
