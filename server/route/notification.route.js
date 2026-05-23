import { Router } from 'express';
import auth from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/adminOnly.js';
import {
  registerPushToken,
  unregisterPushToken,
  broadcastNotifications,
  sendToUserNotification,
  getNotificationHistory,
  getUnreadCount,
  getRegisteredDevices,
  listInAppNotifications,
  markInAppNotificationRead,
  markAllInAppNotificationsRead,
} from '../controllers/notification.controller.js';

const router = Router();

router.get('/', auth, listInAppNotifications);
router.put('/read-all', auth, markAllInAppNotificationsRead);
router.put('/:id/read', auth, markInAppNotificationRead);

router.post('/register-token', auth, registerPushToken);
router.delete('/unregister-token', auth, unregisterPushToken);
router.post('/broadcast', auth, adminOnly, broadcastNotifications);
router.post('/send-to-user', auth, adminOnly, sendToUserNotification);
router.get('/history', auth, adminOnly, getNotificationHistory);
router.get('/unread-count', auth, adminOnly, getUnreadCount);
router.get('/devices', auth, adminOnly, getRegisteredDevices);

export default router;
