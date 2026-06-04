/**
 * COPY TO: server/utils/vendorNotifications.js
 */
import NotificationModel from '../models/notification.model.js';
import VendorModel from '../models/vendor.model.js';
import { sendPushToUser } from '../controllers/notification.controller.js';

async function resolveVendor(vendorRef) {
  if (!vendorRef) return null;
  if (vendorRef.ownerUser) return vendorRef;
  const id = vendorRef._id?.toString?.() || String(vendorRef);
  return VendorModel.findById(id).select('ownerUser storeName').lean();
}

export async function notifyVendor(vendorRef, options) {
  const {
    type = 'general',
    title,
    message,
    orderId = null,
    productId = null,
    push = true,
  } = options;

  if (!title || !message) return null;

  try {
    const vendor = await resolveVendor(vendorRef);
    if (!vendor?.ownerUser) return null;

    const userId = vendor.ownerUser;

    const notification = await NotificationModel.create({
      userId,
      type,
      title,
      message,
      orderId,
      productId,
      isRead: false,
    });

    if (push) {
      sendPushToUser(userId, {
        title,
        body: message,
        data: {
          channel: 'vendor',
          channelId: 'vendor',
          type,
          orderId: orderId ? String(orderId) : undefined,
          productId: productId ? String(productId) : undefined,
        },
      }).catch((err) => {
        console.error('[vendorNotifications] push failed:', err?.message || err);
      });
    }

    return notification;
  } catch (err) {
    console.error('[vendorNotifications] create failed:', err?.message || err);
    return null;
  }
}

export async function notifyVendorNewOrder(vendor, order, vendorItems = []) {
  const orderRef = order.orderNumber || order._id?.toString?.().slice(-6).toUpperCase();
  const itemCount = vendorItems.length || (order.products || []).length;
  const total = vendorItems.reduce((sum, i) => sum + (i.subTotal || i.price * i.quantity || 0), 0);

  return notifyVendor(vendor, {
    type: 'new_order',
    title: 'New order received',
    message: `Order #${orderRef} — ${itemCount} item(s)${total ? ` · $${Number(total).toFixed(2)}` : ''}`,
    orderId: order._id,
    push: true,
  });
}

export async function notifyVendorProductApproved(vendor, product) {
  return notifyVendor(vendor, {
    type: 'product_approved',
    title: 'Product approved',
    message: `"${product.name}" is now live in your store.`,
    productId: product._id,
  });
}

export async function notifyVendorProductRejected(vendor, product, reason = '') {
  return notifyVendor(vendor, {
    type: 'product_rejected',
    title: 'Product needs changes',
    message: `"${product.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
    productId: product._id,
  });
}

export async function notifyVendorStatusChange(vendor, status, notes = '') {
  const titles = {
    APPROVED: 'Store approved',
    REJECTED: 'Application rejected',
    SUSPENDED: 'Account suspended',
    PENDING: 'Application pending',
  };
  const messages = {
    APPROVED: 'Your vendor account is approved. You can start selling!',
    REJECTED: notes || 'Your vendor application was not approved. Contact support for details.',
    SUSPENDED: notes || 'Your vendor account has been suspended. Contact support.',
    PENDING: 'Your application is under review. We will notify you when it is decided.',
  };

  return notifyVendor(vendor, {
    type: 'account_status',
    title: titles[status] || `Account update: ${status}`,
    message: messages[status] || `Your vendor status is now ${status}.`,
  });
}

export async function notifyVendorPayout(vendor, payout, event) {
  const amount = Number(payout.amount || 0).toFixed(2);
  const configs = {
    approved: {
      type: 'payout_update',
      title: 'Withdrawal approved',
      message: `Your withdrawal request for $${amount} was approved.`,
    },
    rejected: {
      type: 'payout_update',
      title: 'Withdrawal declined',
      message: `Your withdrawal request for $${amount} was declined.${payout.rejectionReason ? ` ${payout.rejectionReason}` : ''}`,
    },
    paid: {
      type: 'payout_update',
      title: 'Withdrawal paid',
      message: `Your withdrawal of $${amount} has been processed.`,
    },
  };
  const cfg = configs[event];
  if (!cfg) return null;
  return notifyVendor(vendor, { ...cfg, push: true });
}
