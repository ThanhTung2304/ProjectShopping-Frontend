import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import notificationApi from "../../../api/notificationApi";
import styles from "./NotificationDropdown.module.css";

const ORDER_TYPES = new Set(["ORDER_STATUS_UPDATED", "ORDER_CANCELLED", "ORDER_DELIVERED"]);

const formatTime = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function NotificationDropdown({ isAuthenticated, className = "", iconClassName = "" }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(Number(res?.data?.unreadCount || 0));
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({ page: 0, size: 8 });
      setNotifications(res?.data?.content || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchUnreadCount();
    if (!isAuthenticated) return undefined;

    const intervalId = window.setInterval(fetchUnreadCount, 60000);
    return () => window.clearInterval(intervalId);
  }, [fetchUnreadCount, isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
      void fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount, isOpen]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleToggle = () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications((items) =>
          items.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Keep the dropdown usable even if the read-state request fails.
      }
    }

    setIsOpen(false);
    if (ORDER_TYPES.has(notification?.type)) {
      navigate("/profile");
    } else {
      navigate("/profile");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore; the next poll/open will resync the unread count.
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={`${className} ${styles.trigger}`}
        type="button"
        aria-label="Thong bao"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <span className={iconClassName} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </span>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel} role="dialog" aria-label="Danh sach thong bao">
          <div className={styles.panelHeader}>
            <strong>Thong bao</strong>
            <button type="button" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              Doc tat ca
            </button>
          </div>

          <div className={styles.list}>
            {loading ? (
              <p className={styles.empty}>Dang tai thong bao...</p>
            ) : notifications.length === 0 ? (
              <p className={styles.empty}>Chua co thong bao moi.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  className={`${styles.item} ${notification.isRead ? "" : styles.unread}`}
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className={styles.itemTitle}>{notification.title}</span>
                  <span className={styles.itemMessage}>{notification.message}</span>
                  <span className={styles.itemTime}>{formatTime(notification.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
