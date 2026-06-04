import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  loadVendorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationHref,
} from '../utils/vendorNotifications';

const POLL_MS = 30000;

const NotificationBell = ({ className = '' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const prevUnreadRef = useRef(0);
  const knownIdsRef = useRef(new Set());

  const refresh = useCallback(async (showToasts = false) => {
    setLoading(true);
    try {
      const { notifications: list, unreadCount: count } = await loadVendorNotifications();
      setNotifications(list);
      setUnreadCount(count);

      if (showToasts && count > prevUnreadRef.current) {
        const newOnes = list.filter(
          (n) => !n.isRead && !knownIdsRef.current.has(n.id)
        );
        newOnes.slice(0, 3).forEach((n) => {
          toast(`${n.title} — ${n.message}`, { icon: '🔔', duration: 5000 });
          knownIdsRef.current.add(n.id);
        });
      }

      list.forEach((n) => knownIdsRef.current.add(n.id));
      prevUnreadRef.current = count;
    } catch (err) {
      console.error('Notification refresh failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(false);
    const interval = setInterval(() => refresh(true), POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) refresh(false);
  };

  const handleItemClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    navigate(getNotificationHref(notification));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    prevUnreadRef.current = 0;
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(100vw-24px,380px)] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#c45c26] hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-10 text-center text-gray-500 text-sm italic">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleItemClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-orange-50/50 border-l-[3px] border-l-[#efb291]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm truncate ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {notification.timeAgo}
                      </p>
                    </div>
                    {notification.isRead && (
                      <Check className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/orders');
              }}
              className="w-full py-2.5 text-sm text-center text-[#c45c26] hover:bg-gray-50 font-medium border-t border-gray-100"
            >
              View all orders
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
