import { fetchDataFromApi, editData } from './api';
import { vendorApi } from './api';

const READ_KEY = 'vendorNotifReadIds';
const BASELINE_KEY = 'vendorNotifBaselineAt';

export function getReadIds() {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markReadLocal(id) {
  const ids = getReadIds();
  if (!ids.includes(id)) {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids, id]));
  }
}

export function markAllReadLocal(notificationIds) {
  const ids = new Set([...getReadIds(), ...notificationIds]);
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function mapApiNotification(n) {
  return {
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    isRead: n.isRead,
    orderId: n.orderId,
    productId: n.productId,
    source: 'api',
    timeAgo: formatTimeAgo(n.createdAt),
  };
}

function mapLocalNotification(item) {
  return {
    ...item,
    timeAgo: formatTimeAgo(item.createdAt),
    source: 'local',
  };
}

/** Build notifications from vendor APIs when server in-app list is empty. */
async function buildActivityNotifications() {
  const items = [];
  const since = localStorage.getItem(BASELINE_KEY);
  const sinceMs = since ? new Date(since).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000;

  try {
    const [ordersRes, productsRes, payoutsRes, profileRes] = await Promise.all([
      vendorApi.getOrders({ page: 1, limit: 20 }),
      vendorApi.getProducts({ page: 1, limit: 30 }),
      vendorApi.getPayouts({ page: 1, limit: 15 }),
      vendorApi.getProfile(),
    ]);

    const orders = ordersRes?.data?.data?.items || [];
    orders.forEach((order) => {
      const created = new Date(order.createdAt).getTime();
      if (created < sinceMs) return;
      const id = `order-${order._id}`;
      items.push({
        id,
        type: 'new_order',
        title: 'New order received',
        message: `Order #${String(order.orderNumber || order._id).slice(-8)} · ${order.customerName || 'Customer'} · ${order.vendorTotal != null ? `$${Number(order.vendorTotal).toFixed(2)}` : ''}`,
        createdAt: order.createdAt,
        isRead: false,
        orderId: order._id,
        href: `/orders/${order._id}`,
      });
    });

    const products = productsRes?.data?.data?.items || productsRes?.data?.data?.products || [];
    products.forEach((product) => {
      const updated = new Date(product.updatedAt || product.createdAt).getTime();
      if (updated < sinceMs) return;
      const approval = product.approvalStatus;
      if (approval === 'APPROVED') {
        items.push({
          id: `product-${product._id}-approved`,
          type: 'product_approved',
          title: 'Product approved',
          message: `"${product.name}" is live in your store.`,
          createdAt: product.updatedAt || product.createdAt,
          isRead: false,
          productId: product._id,
          href: '/products',
        });
      } else if (approval === 'REJECTED') {
        items.push({
          id: `product-${product._id}-rejected`,
          type: 'product_rejected',
          title: 'Product needs changes',
          message: `"${product.name}" was not approved.`,
          createdAt: product.updatedAt || product.createdAt,
          isRead: false,
          productId: product._id,
          href: `/products/${product._id}/edit`,
        });
      } else if (approval === 'PENDING') {
        items.push({
          id: `product-${product._id}-pending`,
          type: 'general',
          title: 'Product under review',
          message: `"${product.name}" is waiting for admin approval.`,
          createdAt: product.updatedAt || product.createdAt,
          isRead: false,
          productId: product._id,
          href: '/products',
        });
      }
    });

    const payouts = payoutsRes?.data?.data?.items || [];
    payouts.forEach((payout) => {
      const updated = new Date(payout.updatedAt || payout.createdAt).getTime();
      if (updated < sinceMs) return;
      const status = payout.status;
      let title = 'Withdrawal update';
      let message = `Withdrawal of $${Number(payout.amount || 0).toFixed(2)}`;
      if (status === 'APPROVED') {
        title = 'Withdrawal approved';
        message += ' was approved.';
      } else if (status === 'REJECTED') {
        title = 'Withdrawal declined';
        message += ' was declined.';
      } else if (status === 'PAID') {
        title = 'Withdrawal paid';
        message += ' has been paid.';
      } else if (status === 'REQUESTED') {
        title = 'Withdrawal requested';
        message += ' is pending review.';
      } else return;

      items.push({
        id: `payout-${payout._id}-${status}`,
        type: 'payout_update',
        title,
        message,
        createdAt: payout.updatedAt || payout.createdAt,
        isRead: false,
        href: '/finance/withdrawals',
      });
    });

    const profile = profileRes?.data?.data;
    if (profile?.status && profile.status !== 'APPROVED') {
      const statusMessages = {
        PENDING: { title: 'Account pending', message: 'Your store is under review.' },
        SUSPENDED: { title: 'Account suspended', message: 'Contact support for help.' },
        REJECTED: { title: 'Application rejected', message: 'Contact support if you have questions.' },
      };
      const msg = statusMessages[profile.status];
      if (msg) {
        items.push({
          id: `account-${profile.status}`,
          type: 'account_status',
          title: msg.title,
          message: msg.message,
          createdAt: profile.updatedAt || new Date().toISOString(),
          isRead: false,
          href: '/settings/account',
        });
      }
    }
  } catch (err) {
    console.error('[vendorNotifications] activity fetch failed:', err);
  }

  return items.map(mapLocalNotification);
}

export async function loadVendorNotifications() {
  if (!localStorage.getItem(BASELINE_KEY)) {
    localStorage.setItem(BASELINE_KEY, new Date().toISOString());
  }

  const readIds = getReadIds();
  let notifications = [];
  let fromApi = false;

  try {
    const res = await fetchDataFromApi('/api/notifications');
    if (res?.error === false && Array.isArray(res.notifications)) {
      notifications = res.notifications.map(mapApiNotification);
      fromApi = true;
    }
  } catch (err) {
    console.error('[vendorNotifications] API fetch failed:', err);
  }

  if (!fromApi || notifications.length === 0) {
    const local = await buildActivityNotifications();
    const merged = new Map();
    notifications.forEach((n) => merged.set(n.id, n));
    local.forEach((n) => {
      if (!merged.has(n.id)) merged.set(n.id, n);
    });
    notifications = [...merged.values()];
  }

  notifications = notifications
    .map((n) => ({
      ...n,
      isRead: n.isRead || readIds.includes(n.id),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, fromApi };
}

export async function markNotificationRead(notification) {
  if (notification.source === 'api' && notification.id) {
    try {
      await editData(`/api/notifications/${notification.id}/read`, {});
    } catch (err) {
      console.error('[vendorNotifications] mark read API failed:', err);
    }
  }
  markReadLocal(notification.id);
}

export async function markAllNotificationsRead(notifications) {
  const apiItems = notifications.filter((n) => n.source === 'api');
  if (apiItems.length > 0) {
    try {
      await editData('/api/notifications/read-all', {});
    } catch (err) {
      console.error('[vendorNotifications] mark all read API failed:', err);
    }
  }
  markAllReadLocal(notifications.map((n) => n.id));
}

export function getNotificationHref(notification) {
  if (notification.href) return notification.href;
  if (notification.orderId) return `/orders/${notification.orderId}`;
  if (notification.productId) return `/products/${notification.productId}/edit`;
  if (notification.type === 'payout_update') return '/finance/withdrawals';
  if (notification.type === 'account_status') return '/settings/account';
  if (notification.type === 'new_order') return '/orders';
  return '/dashboard';
}
