import { useState, useRef, useEffect } from 'react';
import { Bell, Search, RefreshCw, ChevronDown, CheckCheck, Sun, Moon, Globe, Shield, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRelativeTime } from '../../utils/formatters';
import './Topbar.css';

export default function Topbar({ pageTitle }) {
  const {
    state, theme, toggleTheme, role, setRole,
    language, setLanguage, t, activeFarm,
    markNotificationRead, markAllRead, refetch
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const notifRef = useRef(null);
  const roleRef = useRef(null);
  const langRef = useRef(null);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
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
    const icons = { critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' };
    return icons[type] ?? '⚪';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{pageTitle}</h2>
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

        {/* Role Switcher (Panchayat vs Farmer) */}
        <div className="role-switch-wrap" ref={roleRef}>
          <button
            className={`role-badge-btn ${role === 'panchayat' ? 'panchayat' : 'farmer'}`}
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            title="Switch View Mode"
          >
            {role === 'panchayat' ? <Shield size={14} /> : <User size={14} />}
            <span className="role-btn-text">
              {role === 'panchayat' ? t('rolePanchayat') : `${t('roleFarmer')}${activeFarm ? `: ${activeFarm.farmerName || activeFarm.name}` : ''}`}
            </span>
            <ChevronDown size={12} />
          </button>

          {showRoleMenu && (
            <div className="dropdown-menu-box role-dropdown">
              <div className="dropdown-header-title">{t('roleLabel')}</div>
              <button
                className={`dropdown-item-btn ${role === 'panchayat' ? 'active' : ''}`}
                onClick={() => { setRole('panchayat'); setShowRoleMenu(false); }}
              >
                <Shield size={15} className="text-primary" />
                <div className="dropdown-item-text">
                  <strong>{t('rolePanchayat')}</strong>
                  <span className="dropdown-item-desc">{t('allPlots')}</span>
                </div>
              </button>
              <button
                className={`dropdown-item-btn ${role === 'farmer' ? 'active' : ''}`}
                onClick={() => { setRole('farmer'); setShowRoleMenu(false); }}
              >
                <User size={15} className="text-secondary" />
                <div className="dropdown-item-text">
                  <strong>{t('roleFarmer')}</strong>
                  <span className="dropdown-item-desc">{activeFarm ? `${activeFarm.farmerName} (${activeFarm.name})` : t('myPlot')}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Language Selector (EN, HI, PA) */}
        <div className="lang-switch-wrap" ref={langRef}>
          <button
            className="icon-btn lang-btn"
            onClick={() => setShowLangMenu(!showLangMenu)}
            title="Language / भाषा / ਭਾਸ਼ਾ"
          >
            <Globe size={15} />
            <span className="lang-code-tag">{language.toUpperCase()}</span>
          </button>

          {showLangMenu && (
            <div className="dropdown-menu-box lang-dropdown">
              <button
                className={`dropdown-item-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
              >
                <span>🇬🇧 English</span>
              </button>
              <button
                className={`dropdown-item-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
              >
                <span>🇮🇳 हिन्दी (Hindi)</span>
              </button>
              <button
                className={`dropdown-item-btn ${language === 'pa' ? 'active' : ''}`}
                onClick={() => { setLanguage('pa'); setShowLangMenu(false); }}
              >
                <span>🌾 ਪੰਜਾਬੀ (Punjabi)</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Switcher: tweakcn Supabase Light / Dark */}
        <button
          className="icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="theme-toggle-btn"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

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
      </div>
    </header>
  );
}
