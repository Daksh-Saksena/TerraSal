import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, Map, TrendingUp,
  BookOpen, Settings, Leaf, ChevronLeft, ChevronRight,
  Waves, Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import FarmSwitcher from '../farms/FarmSwitcher';
import './Sidebar.css';
const panchayatNavItems = [
  { path: '/', icon: LayoutDashboard, key: 'navDashboard', defaultLabel: 'Village Dashboard' },
  { path: '/village', icon: Users, key: 'navVillage', defaultLabel: 'Village Hub' },
  { path: '/analyze', icon: FlaskConical, key: 'navAnalyzer', defaultLabel: 'Diagnostic Lab' },
  { path: '/map', icon: Map, key: 'navMap', defaultLabel: 'Village Field Map' },
  { path: '/trends', icon: TrendingUp, key: 'navTrends', defaultLabel: 'Village Trends' },
  { path: '/recommendations', icon: BookOpen, key: 'navRecommendations', defaultLabel: 'Advisories' },
  { path: '/settings', icon: Settings, key: 'navSettings', defaultLabel: 'Settings' },
];
const farmerNavItems = [
  { path: '/', icon: LayoutDashboard, key: 'navDashboard', defaultLabel: 'My Farm Dashboard' },
  { path: '/map', icon: Map, key: 'navMap', defaultLabel: 'My Field Map' },
  { path: '/analyze', icon: FlaskConical, key: 'navAnalyzer', defaultLabel: 'Soil Salinity Diagnostic' },
  { path: '/trends', icon: TrendingUp, key: 'navTrends', defaultLabel: 'My Field Trends' },
  { path: '/recommendations', icon: BookOpen, key: 'navRecommendations', defaultLabel: 'Treatment & Gypsum' },
  { path: '/settings', icon: Settings, key: 'navSettings', defaultLabel: 'Settings' },
];
export default function Sidebar() {
  const location = useLocation();
  const { state, role, toggleSidebar, t } = useApp();
  const collapsed = state.sidebarCollapsed;
  const currentNavItems = role === 'farmer' ? farmerNavItems : panchayatNavItems;
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Waves size={20} />
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">TerraSal</span>
            <span className="logo-tagline">Soil Salinity Intelligence</span>
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {currentNavItems.map(({ path, icon: Icon, key, defaultLabel }) => {
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
              {!collapsed && <span className="nav-label">{defaultLabel}</span>}
              {isActive && <div className="nav-active-bar" />}
            </Link>
          );
        })}
      </nav>
      {!collapsed && <FarmSwitcher />}
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