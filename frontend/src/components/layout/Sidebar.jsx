import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, Map, TrendingUp,
  BookOpen, Settings, Leaf, ChevronLeft, ChevronRight,
  Waves, Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import FarmSwitcher from '../farms/FarmSwitcher';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, key: 'navDashboard', defaultLabel: 'Dashboard' },
  { path: '/village', icon: Users, key: 'navVillage', defaultLabel: 'Village Hub' },
  { path: '/analyze', icon: FlaskConical, key: 'navAnalyzer', defaultLabel: 'Analyzer' },
  { path: '/map', icon: Map, key: 'navMap', defaultLabel: 'Map View' },
  { path: '/trends', icon: TrendingUp, key: 'navTrends', defaultLabel: 'Trends' },
  { path: '/recommendations', icon: BookOpen, key: 'navRecommendations', defaultLabel: 'Advisory' },
  { path: '/settings', icon: Settings, key: 'navSettings', defaultLabel: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { state, toggleSidebar, t } = useApp();
  const collapsed = state.sidebarCollapsed;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Waves size={20} />
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">TerraSal</span>
            <span className="logo-tagline">{t('appName')}</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, key, defaultLabel }) => {
          const isActive = location.pathname === path;
          const label = t ? t(key) : defaultLabel;
          return (
            <Link
              key={path}
              to={path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <div className="nav-icon">
                <Icon size={18} />
              </div>
              {!collapsed && <span className="nav-label">{label}</span>}
              {isActive && <div className="nav-active-bar" />}
            </Link>
          );
        })}
      </nav>

      {/* Village Farm Sessions (Gemini chat-style) */}
      {!collapsed && <FarmSwitcher />}

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-version">
            <Leaf size={12} />
            <span>TerraSal v1.0-beta</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={toggleSidebar} title="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
