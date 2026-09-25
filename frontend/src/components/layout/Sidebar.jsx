import React from 'react';
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
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/village', icon: Users, label: 'Village Hub' },
  { path: '/analyze', icon: FlaskConical, label: 'Analyzer' },
  { path: '/map', icon: Map, label: 'Map View' },
  { path: '/trends', icon: TrendingUp, label: 'Trends' },
  { path: '/recommendations', icon: BookOpen, label: 'Advisory' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useApp();
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
            <span className="logo-tagline">Panchayat Kiosk</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
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
