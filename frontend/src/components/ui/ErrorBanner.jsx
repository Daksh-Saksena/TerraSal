import React from 'react';
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './ErrorBanner.css';

export default function ErrorBanner() {
  const { state, refetch } = useApp();

  if (!state.error) return null;

  return (
    <div className="error-banner fade-in">
      <div className="error-banner-content">
        <div className="error-icon-box">
          <AlertCircle size={20} />
        </div>
        <div className="error-text">
          <div className="error-title">Backend Connection Required</div>
          <div className="error-description">
            {state.error}
          </div>
          <div className="error-hint">
            <Terminal size={13} />
            <span>Make sure the backend is running: <code>cd backend && npm start</code></span>
          </div>
        </div>
      </div>
      <button className="error-retry-btn" onClick={refetch}>
        <RefreshCw size={15} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
