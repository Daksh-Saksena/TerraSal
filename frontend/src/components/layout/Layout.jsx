import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';

const pageTitles = {
  '/': 'Dashboard',
  '/analyze': 'Salinity Analyzer',
  '/map': 'Regional Map View',
  '/trends': 'Historical Trends',
  '/recommendations': 'Advisory Center',
  '/settings': 'Settings & Configuration',
};

export default function Layout({ children }) {
  const location = useLocation();
  const { state } = useApp();
  const pageTitle = pageTitles[location.pathname] ?? 'TerraSal';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar pageTitle={pageTitle} />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
