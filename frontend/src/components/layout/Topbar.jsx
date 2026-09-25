import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, RefreshCw, ChevronDown, X, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRelativeTime } from '../../utils/formatters';
import './Topbar.css';

export default function Topbar({ pageTitle }) {
  const { state, markNotificationRead, markAllRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const getNotifIcon = (type) => {
    const icons = { critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' };
    return icons[type] ?? '⚪';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{pageTitle}</h2>
        <div className="topbar-meta">
          <span className="live-dot" />
          <span>Live Data · Updated 2 min ago</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search fields, districts..."
          />
        </div>

        {/* Refresh */}
        <button
          className={`icon-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          title="Refresh data"
        >
          <RefreshCw size={16} />
        </button>

        {/* Notifications */}
        <div className="notif-wrap" ref={notifRef}>
          <button
            className="icon-btn notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-list">
                {state.notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.read ? 'read' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <span className="notif-type-icon">{getNotifIcon(n.type)}</span>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{getRelativeTime(n.timestamp)}</div>
                    </div>
                    {!n.read && <div className="notif-unread-dot" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="user-chip">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <span className="user-name">Agri Officer</span>
            <span className="user-role">Punjab Region</span>
          </div>
          <ChevronDown size={13} className="text-muted" />
        </div>
      </div>
    </header>
  );
}
