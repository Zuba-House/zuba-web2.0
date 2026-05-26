import ProductModel from '../models/product.model.js';
import UserModel from '../models/user.model.js';
import AddressModel from '../models/address.model.js';
import VendorModel from '../models/vendor.model.js';
import OrderConfirmationEmail from '../utils/orderEmailTemplate.js';
import AdminOrderNotificationEmail from '../utils/adminOrderNotificationEmailTemplate.js';
import sendEmailFun from '../config/sendEmail.js';
import { sendVendorNewOrder } from '../utils/vendorEmails.js';

/** Payment is settled — safe to decrement stock and send confirmation emails. */
export function isPaymentConfirmedForFulfillment(paymentStatus) {
  const status = String(paymentStatus || '').trim().toUpperCase();
  return ['PAID', 'COMPLETED', 'SUCCESS', 'SUCCEEDED'].includes(status);
}

async function decrementInventoryForOrder(order) {
  const products = Array.isArray(order.products) ? order.products : [];
  for (const orderProduct of products) {
    const productId = orderProduct.productId?.toString?.() || orderProduct.productId;
    if (!productId) continue;

    const product = await ProductModel.findById(productId);
    if (!product) {
      console.error(`[fulfillment] Product not found: ${productId}`);
      continue;
    }

    if (orderProduct.productType === 'variable' && orderProduct.variationId) {
      const variationIndex = product.variations?.findIndex(
        (v) => v._id && v._id.toString() === String(orderProduct.variationId)
      );

      if (variationIndex !== -1 && product.variations) {
        const currentVariationStock = product.variations[variationIndex].stock || 0;
        const newVariationStock = Math.max(0, currentVariationStock - orderProduct.quantity);
        product.variations[variationIndex].stock = newVariationStock;
        if (newVariationStock <= 0) {
          product.variations[variationIndex].stockStatus = 'out_of_stock';
        }
        const totalStock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        product.countInStock = totalStock;
        if (totalStock <= 0) {
          product.stockStatus = 'out_of_stock';
        }
      } else {
        console.error(`[fulfillment] Variation not found: ${orderProduct.variationId}`);
      }
    } else {
      const currentStock = product.countInStock || 0;
      const newStock = Math.max(0, currentStock - orderProduct.quantity);
      product.countInStock = newStock;
      if (newStock <= 0) {
        product.stockStatus = 'out_of_stock';
      }
    }

    product.sale = (product.sale || 0) + orderProduct.quantity;
    product.totalSales = (product.totalSales || 0) + orderProduct.quantity;
    await product.save();
  }
}

async function notifyVendorsForOrder(order) {
  const vendorIds = new Set();
  for (const item of order.products || []) {
    const vendorId = item.vendor?.toString?.() || item.vendorId?.toString?.();
    if (vendorId) vendorIds.add(vendorId);
  }

  for (const vendorId of vendorIds) {
    try {
      const vendor = await VendorModel.findById(vendorId);
      if (!vendor?.email) continue;
      const vendorItems = (order.products || []).filter(
        (p) => (p.vendor?.toString?.() || p.vendorId?.toString?.()) === vendorId
      );
      await sendVendorNewOrder(vendor, order, vendorItems);
    } catch (err) {
      console.error('[fulfillment] Vendor notification failed:', err?.message || err);
    }
  }
}

async function sendCustomerAndAdminEmails(order) {
  let userEmail = null;
  let userName = null;
  let userInfo = null;

  if (order.userId) {
    const user = await UserModel.findById(order.userId);
    if (user?.email) {
      userEmail = user.email;
      userName = user.name;
      userInfo = {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        phone: user.mobile,
      };
    }
  } else if (order.guestCustomer?.email) {
    userEmail = order.guestCustomer.email;
    userName = order.guestCustomer.name;
    userInfo = {
      name: order.guestCustomer.name,
      email: order.guestCustomer.email,
      phone: order.guestCustomer.phone,
    };
  }

  if (userEmail) {
    try {
      await sendEmailFun({
        sendTo: [userEmail],
        subject: 'Order Confirmation - Zuba House',
        text: '',
        html: OrderConfirmationEmail(userName || 'Customer', order),
      });
      console.log('[fulfillment] Customer confirmation email sent:', userEmail);
    } catch (emailError) {
      console.error('[fulfillment] Customer email failed:', emailError?.message || emailError);
    }
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'sales@zubahouse.com';
    let shippingAddress = order.shippingAddress || null;
    if (!shippingAddress && order.delivery_address) {
      try {
        shippingAddress = await AddressModel.findById(order.delivery_address);
      } catch {
        /* non-blocking */
      }
    }
    await sendEmailFun({
      sendTo: [adminEmail],
      subject: `New Order #${order._id} - ${userName || 'Guest Customer'}`,
      text: '',
      html: AdminOrderNotificationEmail(order, userInfo, shippingAddress),
    });
    console.log('[fulfillment] Admin notification email sent:', adminEmail);
  } catch (adminEmailError) {
    console.error('[fulfillment] Admin email failed:', adminEmailError?.message || adminEmailError);
  }
}

/**
 * Idempotent post-payment fulfillment: inventory, customer/admin email, vendor alerts.
 * Called only after payment is confirmed (web COMPLETED or Stripe paid).
 */
export async function fulfillOrderAfterPayment(order) {
  if (!order) return null;
  if (order.fulfillmentCompleted) {
    return order;
  }

  await decrementInventoryForOrder(order);
  await sendCustomerAndAdminEmails(order);
  await notifyVendorsForOrder(order);

  order.fulfillmentCompleted = true;
  await order.save();
  console.log('[fulfillment] Order fulfilled:', order._id);
  return order;
}
