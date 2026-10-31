import { useState, useRef, useEffect } from 'react';
import { Bell, Search, RefreshCw, ChevronDown, CheckCheck, Sun, Moon, Globe, Shield, User, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRelativeTime } from '../../utils/formatters';
import './Topbar.css';
export default function Topbar({ pageTitle }) {
  const {
    state, theme, toggleTheme, role, setRole,
    language, setLanguage, t, activeFarm,
    markNotificationRead, markAllRead, refetch,
    openLoginModal, soundEnabled, toggleSound
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const notifRef = useRef(null);
  const roleRef = useRef(null);
  const langRef = useRef(null);
  const unreadCount = state.notifications.filter(n => !n.read).length;
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const handleRefresh = async () => {
    setRefreshing(true);
    if (refetch) await refetch();
    setTimeout(() => setRefreshing(false), 800);
  };
  const getNotifIcon = (type) => {
    const dotColors = {
      critical: '#dc2626',
      warning: '#ea580c',
      info: '#0284c7',
      success: '#16a34a'
    };
    return (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: dotColors[type] || '#64748b',
          display: 'inline-block',
          flexShrink: 0
        }}
      />
    );
  };
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{pageTitle}</h2>
      </div>
      <div className="topbar-right">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search fields, districts..."
          />
        </div>
        <div className="role-switch-wrap">
          <button
            className={`role-badge-btn ${role === 'panchayat' ? 'panchayat' : 'farmer'}`}
            onClick={openLoginModal}
            title="Switch User / Login Portal"
            id="role-switch-btn"
          >
            {role === 'panchayat' ? <Shield size={14} /> : <User size={14} />}
            <span className="role-btn-text">
              {role === 'panchayat' ? 'Panchayat Officer' : `Farmer: ${activeFarm?.farmerName || 'Farmer'} (${activeFarm?.name || ''})`}
            </span>
            <span className="switch-user-pill">Switch</span>
          </button>
        </div>
        <button
          className="icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="theme-toggle-btn"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          className={`icon-btn sound-toggle-btn ${soundEnabled ? 'sound-active' : 'sound-muted'}`}
          onClick={toggleSound}
          title={soundEnabled ? 'UI Sound Effects: ON (Click to mute)' : 'UI Sound Effects: Muted (Click to enable)'}
          id="sound-toggle-btn"
          aria-label="Toggle sound effects"
          data-sound={soundEnabled ? 'toggleOff' : 'toggleOn'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} style={{ color: 'var(--text-muted)' }} />}
        </button>
        <button
          className={`icon-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          title="Refresh data"
        >
          <RefreshCw size={16} />
        </button>
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
      </div>
    </header>
  );
}