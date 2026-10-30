import { useState } from 'react';
import { Shield, User, X, Check, Sprout, Building, ArrowRight, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './LoginModal.css';
export default function LoginModal() {
  const {
    state,
    isLoginModalOpen,
    closeLoginModal,
    role,
    farmerId,
    loginAsPanchayat,
    loginAsFarmer,
    openPinDropModal,
    t
  } = useApp();
  const fields = state.fields || [];
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmerId || fields[0]?.id || '');
  if (!isLoginModalOpen) return null;
  const handleSelectPanchayat = () => {
    loginAsPanchayat();
  };
  const handleSelectFarmer = () => {
    if (selectedFarmerId) {
      loginAsFarmer(selectedFarmerId);
    } else if (fields[0]?.id) {
      loginAsFarmer(fields[0].id);
    }
  };
  const selectedFarmObj = fields.find(f => f.id === selectedFarmerId) || fields[0];
  return (
    <div className="login-modal-overlay fade-in" onClick={closeLoginModal}>
      <div className="login-modal-container" onClick={e => e.stopPropagation()}>
        <div className="login-modal-header">
          <div>
            <span className="login-portal-tag">Access Portal</span>
            <h2>Select Login Mode</h2>
            <p className="login-modal-subtitle">
              Choose your operating role. Individual farmers see only their farm's real data and guidance.
            </p>
          </div>
          <button className="login-modal-close" onClick={closeLoginModal} title="Close">
            <X size={20} />
          </button>
        </div>
        <div className="login-portals-grid">
          <div className={`login-portal-card ${role === 'panchayat' ? 'current-active' : ''}`}>
            <div className="portal-card-top">
              <div className="portal-icon-box panchayat">
                <Building size={24} />
              </div>
              <div className="portal-badge panchayat">Village Administration</div>
            </div>
            <h3>Panchayat Agriculture Officer</h3>
            <p className="portal-desc">
              Manage all village plots, track community salinity risk, broadcast agricultural advisories, and export official reports.
            </p>
            <ul className="portal-features-list">
              <li><Check size={14} className="check-icon" /> View all {fields.length} village plots & farmers</li>
              <li><Check size={14} className="check-icon" /> Village-wide salinity plume tracking</li>
              <li><Check size={14} className="check-icon" /> Cross-plot soil recovery benchmarks</li>
              <li><Check size={14} className="check-icon" /> Official Agriculture Department CSV export</li>
            </ul>
            <button
              className="btn btn-primary portal-enter-btn"
              onClick={handleSelectPanchayat}
            >
              <span>Login as Panchayat Officer</span>
              <ArrowRight size={16} />
            </button>
          </div>
          <div className={`login-portal-card ${role === 'farmer' ? 'current-active' : ''}`}>
            <div className="portal-card-top">
              <div className="portal-icon-box farmer">
                <Sprout size={24} />
              </div>
              <div className="portal-badge farmer">Individual Farmer</div>
            </div>
            <h3>Individual Farmer Portal</h3>
            <p className="portal-desc">
              Personalized soil recovery shield. Strictly displays your own farm's real measurements, daily watering decision, and gypsum doses.
            </p>
            <div className="farmer-select-box">
              <label className="farmer-select-label">Select Your Registered Farm:</label>
              {fields.length > 0 ? (
                <select
                  className="farmer-dropdown"
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.farmerName || 'Farmer'} - {f.name} ({f.area} Ac · {f.cropType})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="no-farms-prompt">
                  <span>No registered farms found in database.</span>
                </div>
              )}
              {selectedFarmObj && (
                <div className="selected-farm-preview">
                  <div className="sfp-row">
                    <span className="sfp-label">Plot:</span>
                    <strong>{selectedFarmObj.name}</strong>
                  </div>
                  <div className="sfp-row">
                    <span className="sfp-label">Farmer:</span>
                    <span>{selectedFarmObj.farmerName || 'Registered Farmer'}</span>
                  </div>
                  <div className="sfp-row">
                    <span className="sfp-label">Location:</span>
                    <span className="sfp-loc">{selectedFarmObj.location}</span>
                  </div>
                  <div className="sfp-row">
                    <span className="sfp-label">Current Salinity:</span>
                    <strong style={{ color: (selectedFarmObj.groundwaterEC || 0) > 4 ? '#ef4444' : '#22c55e' }}>
                      {selectedFarmObj.groundwaterEC ?? selectedFarmObj.metrics?.ec ?? 3.5} dS/m
                    </strong>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="btn-link register-new-btn"
                onClick={() => {
                  closeLoginModal();
                  openPinDropModal();
                }}
              >
                <MapPin size={13} />
                <span>+ Register Another Farm / Plot</span>
              </button>
            </div>
            <button
              className="btn btn-secondary portal-enter-btn farmer-btn"
              onClick={handleSelectFarmer}
              disabled={fields.length === 0}
            >
              <span>Login as Farmer ({selectedFarmObj?.farmerName || 'Farmer'})</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}