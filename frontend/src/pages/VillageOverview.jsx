import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Users, Activity, Droplets, ShieldCheck,
  AlertTriangle, ArrowUpRight, TrendingUp, Layers,
  Compass, MapPin, BookOpen, CheckCircle2, ChevronRight,
  RefreshCw, X, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import './VillageOverview.css';

// Fixes gray-tile bug in modal/conditionally-rendered maps
function MapResizeController() {
  const map = useMap();
  React.useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);
  return null;
}

// Custom Marker for village pins based on recovery
const createVillageIcon = (zoneColor) => new L.DivIcon({
  className: 'village-map-pin',
  html: `<div class="village-pin-outer" style="border-color: ${zoneColor}"><div class="village-pin-core" style="background: ${zoneColor}"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

export default function VillageOverview() {
  const { state, setActiveFarmId, openPinDropModal, loadData } = useApp();
  const navigate = useNavigate();
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [filterZone, setFilterZone] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchBenchmarks = async () => {
    try {
      const res = await fetch(getApiUrl('/api/village/benchmarks'));
      if (res.ok) {
        const data = await res.json();
        setBenchmarkData(data);
      }
    } catch (err) {
      console.warn('Failed to load village benchmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
  }, [state.fields]);

  const handleRefreshAdvisories = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/village/regenerate-ai', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBenchmarkData(prev => ({
          ...prev,
          advisories: data.advisories,
        }));
      }
    } catch (err) {
      console.error('Failed to refresh field advisories:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const fields = state.fields || [];
  const stats = benchmarkData?.villageStats || {
    totalFields: fields.length,
    totalAcres: fields.reduce((s, f) => s + (f.area || 0), 0),
    avgRecovery: Math.round(fields.reduce((s, f) => s + (f.soilRecovery || 50), 0) / (fields.length || 1)),
    avgStrain: parseFloat((fields.reduce((s, f) => s + (f.soilStrain || 12), 0) / (fields.length || 1)).toFixed(1)),
    greenFarms: fields.filter(f => (f.soilRecovery || 50) >= 67).length,
    yellowFarms: fields.filter(f => (f.soilRecovery || 50) >= 34 && (f.soilRecovery || 50) < 67).length,
    redFarms: fields.filter(f => (f.soilRecovery || 50) < 34).length,
    villageSaltTons: 24.8
  };

  const filteredFields = fields.filter(f => {
    const rec = f.soilRecovery ?? 50;
    if (filterZone === 'GREEN') return rec >= 67;
    if (filterZone === 'YELLOW') return rec >= 34 && rec < 67;
    if (filterZone === 'RED') return rec < 34;
    return true;
  });

  const handleSelectFarm = (id) => {
    setActiveFarmId(id);
    navigate('/');
  };

  const advisories = benchmarkData?.advisories || [];

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="village-header-bar">
        <div>
          <h1>Village Panchayat Soil Health Hub</h1>
          <p>Collective monitoring and cross-field salinity intelligence across all village plots</p>
        </div>
        <div>
          <button className="village-add-farm-btn" onClick={openPinDropModal}>
            <MapPin size={15} />
            <span>Add Field Plot</span>
          </button>
        </div>
      </div>

      {/* Village KPI Strip */}
      <div className="grid-4 village-kpi-row">
        <div className="card village-stat-card">
          <div className="vstat-top">
            <span className="vstat-label">Village Avg Recovery</span>
            <ShieldCheck size={18} className="vstat-icon green" />
          </div>
          <div className="vstat-value" style={{ color: stats.avgRecovery >= 67 ? '#22c55e' : stats.avgRecovery >= 34 ? '#f59e0b' : '#ef4444' }}>
            {stats.avgRecovery}%
          </div>
          <div className="vstat-sub">
            {stats.greenFarms} Green · {stats.yellowFarms} Yellow · {stats.redFarms} Red
          </div>
        </div>

        <div className="card village-stat-card">
          <div className="vstat-top">
            <span className="vstat-label">Root Osmotic Stress</span>
            <Activity size={18} className="vstat-icon orange" />
          </div>
          <div className="vstat-value">{stats.avgStrain} <span className="vstat-unit">load</span></div>
          <div className="vstat-sub">Cumulative root zone salinity stress</div>
        </div>

        <div className="card village-stat-card">
          <div className="vstat-top">
            <span className="vstat-label">Active Village Plots</span>
            <Users size={18} className="vstat-icon teal" />
          </div>
          <div className="vstat-value">{stats.totalFields} <span className="vstat-unit">farms</span></div>
          <div className="vstat-sub">{stats.totalAcres} total acres monitored</div>
        </div>

        <div className="card village-stat-card">
          <div className="vstat-top">
            <span className="vstat-label">Seasonal Salt Burden</span>
            <Droplets size={18} className="vstat-icon red" />
          </div>
          <div className="vstat-value">{stats.villageSaltTons} <span className="vstat-unit">tons</span></div>
          <div className="vstat-sub">Total mineral salts deposited</div>
        </div>
      </div>

      {/* Main Grid: Village Community Map + Peer Advisories */}
      <div className="village-main-grid">
        {/* Left: Village Pin Map */}
        <div className="card village-map-card">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><MapPin size={16} /></div>
              Village Plots Coordinate Map
            </div>
            <span className="chip"><Compass size={11} /> Click any pin to open farm</span>
          </div>

          <div className="village-leaflet-wrap">
            <MapContainer
              center={[30.2, 75.0]}
              zoom={7}
              style={{ height: '380px', width: '100%', borderRadius: '10px' }}
            >
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />
              <MapResizeController />
              {fields.map(farm => {
                const rec = farm.soilRecovery ?? 50;
                const zoneColor = rec >= 67 ? '#22c55e' : rec >= 34 ? '#f59e0b' : '#ef4444';
                const lat = farm.lat || 30.5;
                const lng = farm.lng || 75.2;

                return (
                  <Marker
                    key={farm.id}
                    position={[lat, lng]}
                    icon={createVillageIcon(zoneColor)}
                  >
                    <Popup>
                      <div className="village-popup">
                        <div className="vpop-header">
                          <strong>{farm.name}</strong>
                          <span className="vpop-farmer">{farm.farmerName}</span>
                        </div>
                        <div className="vpop-stats">
                          <div>Recovery: <strong style={{ color: zoneColor }}>{rec}%</strong></div>
                          <div>Strain: <strong>{farm.soilStrain || 12.0}</strong></div>
                          <div>EC: <strong>{farm.groundwaterEC} dS/m</strong></div>
                          <div>Crop: <strong>{farm.cropType}</strong></div>
                        </div>
                        <button
                          className="vpop-switch-btn"
                          onClick={() => handleSelectFarm(farm.id)}
                        >
                          Switch to this Farm &rarr;
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Right: Community Soil Advisories */}
        <div className="card village-advisory-card">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><BookOpen size={16} /></div>
              <span>Community Soil Advisories</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="chip" style={{ color: 'var(--color-teal)' }}>
                Field Extension Bulletin
              </span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleRefreshAdvisories}
                disabled={regenerating}
                title="Refresh field advisories"
              >
                <RefreshCw size={13} className={regenerating ? 'spin' : ''} />
                <span>{regenerating ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          <div className="village-advisories-list">
            {regenerating ? (
              <div className="ai-loading-box">
                <RefreshCw size={24} className="spin text-teal" />
                <p>Updating cross-field soil data and agronomic recommendations...</p>
              </div>
            ) : advisories.length > 0 ? (
              advisories.map((item, index) => {
                const isWarning = item.type === 'water_table_warning' || item.type === 'critical_drainage';
                const isRotation = item.type === 'crop_rotation';
                const highlight = item.highlight || (isWarning ? 'warning-highlight' : isRotation ? 'info-highlight' : 'drip-highlight');
                const Icon = isWarning ? AlertTriangle : isRotation ? TrendingUp : CheckCircle2;
                const iconColor = isWarning ? 'text-orange' : isRotation ? 'text-blue' : 'text-teal';

                return (
                  <div key={item.id || index} className={`vadvisory-item ${highlight} fade-in`}>
                    <div className="vadvisory-title">
                      <Icon size={16} className={iconColor} />
                      <span>{item.badge || item.title}</span>
                    </div>
                    <p className="vadvisory-text">
                      {item.message}
                    </p>
                    {item.action && (
                      <div className="vadvisory-action">
                        {item.action}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-advisories-box">
                <p>No advisories computed. Add village plots to view cross-field recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Field Comparison Matrix */}
      <div className="card village-table-card">
        <div className="card-header">
          <div className="section-title">
            <div className="section-title-icon"><Layers size={16} /></div>
            Village Field Directory & Comparison
          </div>

          {/* Filter Pills */}
          <div className="village-filter-pills">
            {['ALL', 'GREEN', 'YELLOW', 'RED'].map(zone => (
              <button
                key={zone}
                className={`vfilter-pill ${filterZone === zone ? 'active' : ''}`}
                onClick={() => setFilterZone(zone)}
              >
                {zone === 'ALL' ? 'All Plots' : `${zone} Zone`}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="village-table">
            <thead>
              <tr>
                <th>Plot & Farmer</th>
                <th>Location / Coords</th>
                <th>Crop & Acreage</th>
                <th>Soil & Irrigation</th>
                <th>Groundwater EC</th>
                <th>Water Table</th>
                <th>Soil Strain</th>
                <th>Recovery %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map(farm => {
                const rec = farm.soilRecovery ?? 50;
                const strain = farm.soilStrain ?? 12.0;
                const zoneColor = rec >= 67 ? '#22c55e' : rec >= 34 ? '#f59e0b' : '#ef4444';

                return (
                  <tr key={farm.id} className="vtable-row">
                    <td>
                      <div className="vcell-farm-name">{farm.name}</div>
                      <div className="vcell-farmer-name">{farm.farmerName || 'Village Farmer'}</div>
                    </td>
                    <td>
                      <div className="vcell-loc">{farm.location}</div>
                      <div className="vcell-coords">{farm.lat ? `${farm.lat.toFixed(3)}°N, ${farm.lng.toFixed(3)}°E` : '-'}</div>
                    </td>
                    <td>
                      <span className="vcell-crop-badge">{farm.cropType}</span>
                      <span className="vcell-area">{farm.area} ac</span>
                    </td>
                    <td>
                      <div className="vcell-soil">{farm.soilType}</div>
                      <div className="vcell-irrig">{farm.irrigationMethod}</div>
                    </td>
                    <td>
                      <strong style={{ color: farm.groundwaterEC > 5 ? '#ef4444' : farm.groundwaterEC > 3 ? '#f59e0b' : '#22c55e' }}>
                        {farm.groundwaterEC} dS/m
                      </strong>
                    </td>
                    <td>{farm.waterTableDepth} m</td>
                    <td>
                      <span className="vcell-strain" style={{ color: strain >= 14 ? '#f97316' : '#cbd5e1' }}>
                        {strain} / 21
                      </span>
                    </td>
                    <td>
                      <div className="vcell-recovery-box">
                        <span className="vcell-rec-dot" style={{ background: zoneColor }} />
                        <strong style={{ color: zoneColor }}>{rec}%</strong>
                      </div>
                    </td>
                    <td>
                      <button
                        className="vtable-open-btn"
                        onClick={() => handleSelectFarm(farm.id)}
                      >
                        <span>Open</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
