import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Users, Activity, Droplets, ShieldCheck,
  AlertTriangle, ArrowUpRight, TrendingUp, Layers,
  Compass, MapPin, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import './VillageOverview.css';

// Custom Marker for village pins based on recovery
const createVillageIcon = (zoneColor) => new L.DivIcon({
  className: 'village-map-pin',
  html: `<div class="village-pin-outer" style="border-color: ${zoneColor}; box-shadow: 0 0 10px ${zoneColor}"><div class="village-pin-core" style="background: ${zoneColor}"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

export default function VillageOverview() {
  const { state, setActiveFarmId, openPinDropModal } = useApp();
  const navigate = useNavigate();
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [filterZone, setFilterZone] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const res = await fetch('/api/village/benchmarks');
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
    fetchBenchmarks();
  }, [state.fields]);

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

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="village-header-bar">
        <div>
          <h1>Village Panchayat Soil Health Hub</h1>
          <p>Collective monitoring and cross-field salinity intelligence across all village plots</p>
        </div>
        <button className="village-add-farm-btn" onClick={openPinDropModal}>
          <MapPin size={15} />
          <span>Drop Pin for New Farm</span>
        </button>
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
            <span className="vstat-label">Village Avg Strain</span>
            <Activity size={18} className="vstat-icon orange" />
          </div>
          <div className="vstat-value">{stats.avgStrain} <span className="vstat-unit">/ 21.0</span></div>
          <div className="vstat-sub">Cumulative root osmotic load</div>
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
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
                subdomains="abcd"
              />
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

        {/* Right: Peer Learning & Community Agronomy */}
        <div className="card village-advisory-card">
          <div className="card-header">
            <div className="section-title">
              <div className="section-title-icon"><Sparkles size={16} /></div>
              Cross-Field Peer Intelligence
            </div>
            <span className="chip" style={{ color: 'var(--color-teal)' }}>Agronomist Match</span>
          </div>

          <div className="village-advisories-list">
            <div className="vadvisory-item drip-highlight">
              <div className="vadvisory-title">
                <CheckCircle2 size={16} className="text-teal" />
                <span>Peer Irrigation Best Practice</span>
              </div>
              <p className="vadvisory-text">
                <strong>Balwinder Singh</strong> & <strong>Rawat Singh</strong> are achieving <strong>80%+ Recovery</strong> by utilizing drip irrigation with early-morning fertigation cycles.
              </p>
              <div className="vadvisory-action">
                Recommended Action: Neighboring farmers on flood irrigation can save ~42% irrigation water and reduce root salt stress by adopting this protocol.
              </div>
            </div>

            <div className="vadvisory-item warning-highlight">
              <div className="vadvisory-title">
                <AlertTriangle size={16} className="text-orange" />
                <span>Canal Cluster Water Table Warning</span>
              </div>
              <p className="vadvisory-text">
                Plots near Sri Ganganagar South Block have a shallow water table at <strong>1.2m</strong>. Capillary rise is pumping <strong>2.4 mm/day</strong> of salt-laden water into the cotton root zone.
              </p>
              <div className="vadvisory-action">
                Recommended Action: Schedule collective subsurface drainage cleaning before next sowing season.
              </div>
            </div>

            <div className="vadvisory-item info-highlight">
              <div className="vadvisory-title">
                <TrendingUp size={16} className="text-teal" />
                <span>Crop Rotation Opportunity</span>
              </div>
              <p className="vadvisory-text">
                For plots exceeding 5.0 dS/m EC, transitioning next winter cycle from sensitive Wheat to salt-tolerant <strong>Barley</strong> or <strong>Sugar Beet</strong> will preserve 85% normal yield.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Field Comparison Matrix */}
      <div className="card village-table-card">
        <div className="card-header">
          <div className="section-title">
            <div className="section-title-icon"><Layers size={16} /></div>
            Village Cross-Field Comparison Matrix
          </div>

          {/* Filter Pills */}
          <div className="village-filter-pills">
            {['ALL', 'GREEN', 'YELLOW', 'RED'].map(z => (
              <button
                key={z}
                className={`vfilter-btn ${filterZone === z ? 'active' : ''}`}
                onClick={() => setFilterZone(z)}
              >
                {z === 'ALL' ? 'All Plots' : `${z} Zone`}
              </button>
            ))}
          </div>
        </div>

        <div className="village-table-wrap">
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
                const zoneColor = rec >= 67 ? '#22c55e' : rec >= 34 ? '#f59e0b' : '#ef4444';
                const strain = farm.soilStrain ?? 12.0;

                return (
                  <tr key={farm.id} className="vtable-row">
                    <td>
                      <div className="vcell-farm-name">{farm.name}</div>
                      <div className="vcell-farmer-name">{farm.farmerName || 'Village Farmer'}</div>
                    </td>
                    <td>
                      <div className="vcell-loc">{farm.location}</div>
                      <div className="vcell-coords">{farm.lat ? `${farm.lat.toFixed(3)}°N, ${farm.lng.toFixed(3)}°E` : '—'}</div>
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
