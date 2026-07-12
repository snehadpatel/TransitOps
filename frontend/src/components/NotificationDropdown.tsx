import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface Notification {
  id: string;
  type: 'LICENSE_EXPIRY' | 'INSURANCE_EXPIRY' | 'MAINTENANCE_DUE' | 'TRIP_UPDATE';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.get<Notification[]>('/notifications?limit=10');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch {
      // Silent fail - use mock data for demo
      setNotifications([
        {
          id: '1',
          type: 'LICENSE_EXPIRY',
          title: 'Driver License Expiring',
          message: 'John Doe\'s license expires in 15 days',
          isRead: false,
          createdAt: new Date().toISOString(),
          link: '/drivers',
        },
        {
          id: '2',
          type: 'INSURANCE_EXPIRY',
          title: 'Vehicle Insurance Due',
          message: 'MH12AB1234 insurance expires in 20 days',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          link: '/fleet',
        },
        {
          id: '3',
          type: 'TRIP_UPDATE',
          title: 'Trip Completed',
          message: 'Trip #TRP-2024-001 has been completed',
          isRead: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          link: '/trips',
        },
      ]);
      setUnreadCount(2);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const socket = getSocket();
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      setUnreadCount(prev => prev + 1);
    });
    return () => {
      socket.off('notification');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification.id}/read`, {});
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // Silent fail
      }
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'LICENSE_EXPIRY':
        return 'fa-id-card';
      case 'INSURANCE_EXPIRY':
        return 'fa-file-shield';
      case 'MAINTENANCE_DUE':
        return 'fa-screwdriver-wrench';
      case 'TRIP_UPDATE':
        return 'fa-route';
      default:
        return 'fa-bell';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'LICENSE_EXPIRY':
        return '#ef4b5f';
      case 'INSURANCE_EXPIRY':
        return '#f5a623';
      case 'MAINTENANCE_DUE':
        return '#4fc3f7';
      case 'TRIP_UPDATE':
        return '#17c1a3';
      default:
        return '#4f6ef7';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-icon-btn"
        style={{ position: 'relative' }}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--tx-danger)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            background: 'var(--tx-surface-solid)',
            border: '1px solid var(--tx-border)',
            borderRadius: 'var(--tx-radius-sm)',
            boxShadow: 'var(--tx-shadow-lg)',
            zIndex: 1050,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--tx-border)' }}>
            <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Notifications</h6>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--tx-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <i className="fas fa-bell"></i>
                <div>No notifications</div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--tx-border)',
                    cursor: 'pointer',
                    background: notification.isRead ? 'transparent' : 'rgba(79, 110, 247, 0.05)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tx-primary-light)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notification.isRead ? 'transparent' : 'rgba(79, 110, 247, 0.05)')
                  }
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${getNotificationColor(notification.type)}22`,
                      color: getNotificationColor(notification.type),
                      flexShrink: 0,
                    }}
                  >
                    <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px', color: 'var(--tx-text)' }}>{notification.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--tx-text-muted)', lineHeight: 1.4 }}>{notification.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--tx-text-muted)', marginTop: '4px' }}>{formatTime(notification.createdAt)}</div>
                  </div>
                  {!notification.isRead && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--tx-primary)',
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--tx-border)', textAlign: 'center' }}>
              <a href="/notifications" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--tx-primary)', textDecoration: 'none' }}>
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
