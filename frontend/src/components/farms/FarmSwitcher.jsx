import React from 'react';
import { Plus, User, Trash2, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './FarmSwitcher.css';

export default function FarmSwitcher() {
  const { state, activeFarm, setActiveFarmId, openPinDropModal, deleteFarm } = useApp();
  const fields = state.fields || [];

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    if (confirm(`Remove farm profile "${name}" from this village kiosk?`)) {
      deleteFarm(id);
    }
  };

  return (
    <div className="farm-switcher-container">
      <div className="farm-switcher-header">
        <div className="farm-switcher-title">
          <Activity size={13} />
          <span>Village Farm Sessions</span>
        </div>
        <button
          className="farm-switcher-add-btn"
          onClick={openPinDropModal}
          title="Drop pin on map to add a new farm"
        >
          <Plus size={14} />
          <span>New Farm</span>
        </button>
      </div>

      <div className="farm-switcher-list">
        {fields.map(farm => {
          const isActive = farm.id === activeFarm?.id;
          const recovery = farm.soilRecovery ?? 50;
          const zoneColor = recovery >= 67 ? '#22c55e' : recovery >= 34 ? '#f59e0b' : '#ef4444';
          const strain = farm.soilStrain ?? 12.0;

          return (
            <div
              key={farm.id}
              className={`farm-session-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFarmId(farm.id)}
            >
              <div className="farm-session-left">
                {/* Mini WHOOP Recovery Ring Indicator */}
                <div className="farm-mini-ring" style={{ borderColor: `${zoneColor}60` }}>
                  <span className="farm-mini-recovery" style={{ color: zoneColor }}>
                    {recovery}%
                  </span>
                </div>

                <div className="farm-session-text">
                  <div className="farm-session-title">
                    <span className="farm-name-text">{farm.name}</span>
                    {isActive && <CheckCircle2 size={12} className="farm-active-check" />}
                  </div>
                  <div className="farm-session-sub">
                    <span className="farmer-sub-name">{farm.farmerName || 'Farmer'}</span>
                    <span className="dot-sep">·</span>
                    <span className="crop-sub-name">{farm.cropType}</span>
                    <span className="dot-sep">·</span>
                    <span className="strain-sub-val" style={{ color: strain >= 14 ? '#f97316' : '#94a3b8' }}>
                      S:{strain}
                    </span>
                  </div>
                </div>
              </div>

              <div className="farm-session-actions">
                <button
                  className="farm-delete-btn"
                  onClick={(e) => handleDelete(e, farm.id, farm.name)}
                  title="Remove farm"
                >
                  <Trash2 size={12} />
                </button>
                <ChevronRight size={13} className="farm-arrow" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
