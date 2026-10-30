import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Layers, Wifi, WifiOff, MapPin, Sprout, Droplets, AlertTriangle, ArrowRight, Compass, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getRiskColor } from '../utils/formatters';
import RiskBadge from '../components/ui/RiskBadge';
import './MapView.css';
delete L.Icon.Default.prototype._getIconUrl;
function MapController({ selectedCoords, allCoords }) {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);
  useEffect(() => {
    if (selectedCoords && selectedCoords[0] && selectedCoords[1]) {
      map.flyTo(selectedCoords, 15, { duration: 1.2 });
    } else if (allCoords && allCoords.length > 0) {
      if (allCoords.length === 1) {
        map.setView(allCoords[0], 13);
      } else {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [selectedCoords, allCoords, map]);
  return null;
}
const createFarmPin = (riskLevel) => {
  const color = riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'HIGH' ? '#f97316' : riskLevel === 'MODERATE' ? '#f59e0b' : '#22c55e';
  return new L.DivIcon({
    className: 'real-farm-pin',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
        <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:${color};opacity:0.25;animation:pulse 2s infinite;"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #ffffff;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};
export default function MapView() {
  const { state, activeFarm, setActiveFarmId, openPinDropModal, role, t } = useApp();
  const navigate = useNavigate();
  const fields = state.fields || [];
  const displayedFields = role === 'farmer' && activeFarm
    ? [activeFarm]
    : fields;
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedField, setSelectedField] = useState(activeFarm || displayedFields[0] || null);
  const [flyCoords, setFlyCoords] = useState(null);
  const [showPlumes, setShowPlumes] = useState(true);
  const filtered = displayedFields.filter(f => {
    if (selectedCrop !== 'All' && (f.cropType || '').toLowerCase() !== selectedCrop.toLowerCase()) return false;
    if (selectedRisk !== 'All' && f.riskLevel !== selectedRisk) return false;
    return true;
  });
  const availableCrops = ['All', ...new Set(displayedFields.map(f => f.cropType).filter(Boolean))];
  const validCoords = filtered
    .filter(f => f.lat && f.lng)
    .map(f => [f.lat, f.lng]);
  const defaultCenter = activeFarm?.lat && activeFarm?.lng
    ? [activeFarm.lat, activeFarm.lng]
    : validCoords[0] || [30.9, 75.85];
  const totalAcreage = filtered.reduce((sum, f) => sum + (f.area || 0), 0);
  const highRiskCount = filtered.filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'HIGH').length;
  const avgEC = filtered.length > 0
    ? (filtered.reduce((sum, f) => sum + (f.groundwaterEC ?? f.metrics?.ec ?? 3.5), 0) / filtered.length).toFixed(1)
    : '0';
  const handleSelectFieldInList = (field) => {
    setSelectedField(field);
    setActiveFarmId(field.id);
    if (field.lat && field.lng) {
      setFlyCoords([field.lat, field.lng]);
    }
  };
  const handleOpenDiagnostic = (field) => {
    setActiveFarmId(field.id);
    navigate('/analyze');
  };
  const handleExportCSV = () => {
    const headers = ['Plot ID', 'Farm Name', 'Farmer', 'Location', 'Latitude', 'Longitude', 'Area (Acres)', 'Crop', 'Soil Type', 'EC (dS/m)', 'Water Table (m)', 'Risk Level', 'Recovery %'];
    const rows = filtered.map(f => [
      f.id,
      `"${f.name || ''}"`,
      `"${f.farmerName || ''}"`,
      `"${f.location || ''}"`,
      f.lat || '',
      f.lng || '',
      f.area || 0,
      f.cropType || '',
      f.soilType || '',
      f.groundwaterEC ?? f.metrics?.ec ?? 0,
      f.waterTableDepth ?? f.metrics?.waterTable ?? 0,
      f.riskLevel || 'MODERATE',
      f.soilRecovery ?? 50
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TerraSal_Village_Plots_Map_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{role === 'farmer' ? 'My Farm Location & Soil Map' : 'Village Plots & Aquifer Map'}</h1>
          <p>
            {role === 'farmer'
              ? `Real-time root-zone salinity buffer and sensor mapping for plot: ${activeFarm?.name || 'Your Farm'}`
              : `Geospatial salinity plume tracking across ${fields.length} registered village plots`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {role === 'panchayat' && (
            <button className="btn btn-primary btn-sm" onClick={openPinDropModal} title="Register a new village plot">
              <MapPin size={14} />
              <span>+ Add Field Pin</span>
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export CSV for Agriculture Department">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
      <div className="map-summary-row">
        <div className="map-stat-card">
          <div className="map-stat-val">{filtered.length}</div>
          <div className="map-stat-label">{role === 'farmer' ? 'My Plots' : 'Registered Plots'}</div>
        </div>
        <div className="map-stat-card">
          <div className="map-stat-val">{totalAcreage} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Acres</span></div>
          <div className="map-stat-label">Total Monitored Area</div>
        </div>
        <div className="map-stat-card critical">
          <div className="map-stat-val">{highRiskCount}</div>
          <div className="map-stat-label">High/Critical Salinity</div>
        </div>
        <div className="map-stat-card warning">
          <div className="map-stat-val">{avgEC} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>dS/m</span></div>
          <div className="map-stat-label">Avg Measured EC</div>
        </div>
      </div>
      <div className="map-layout-grid">
        <div className="map-main-col">
          <div className="map-filter-bar">
            <div className="map-filter-group">
              <span className="filter-label"><Layers size={13} /> Layer:</span>
              <label className="map-layer-toggle">
                <input
                  type="checkbox"
                  checked={showPlumes}
                  onChange={e => setShowPlumes(e.target.checked)}
                />
                <span>Root Salinity Plumes</span>
              </label>
            </div>
            <div className="map-filter-group">
              <span className="filter-label">Risk:</span>
              {['All', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(r => (
                <button
                  key={r}
                  className={`filter-btn ${selectedRisk === r ? 'active' : ''}`}
                  onClick={() => setSelectedRisk(r)}
                  style={selectedRisk === r && r !== 'All' ? { borderColor: getRiskColor(r), color: getRiskColor(r), background: `${getRiskColor(r)}15` } : {}}
                >
                  {r}
                </button>
              ))}
            </div>
            {availableCrops.length > 2 && (
              <div className="map-filter-group">
                <span className="filter-label">Crop:</span>
                {availableCrops.map(c => (
                  <button
                    key={c}
                    className={`filter-btn ${selectedCrop === c ? 'active' : ''}`}
                    onClick={() => setSelectedCrop(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="map-container-wrap" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <MapContainer
              center={defaultCenter}
              zoom={role === 'farmer' ? 14 : 11}
              style={{ height: '540px', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />
              <MapController selectedCoords={flyCoords} allCoords={validCoords} />
              {showPlumes && filtered.map(field => {
                if (!field.lat || !field.lng) return null;
                const ec = field.groundwaterEC ?? field.metrics?.ec ?? 3.5;
                const radiusMeters = Math.max(120, Math.round(Math.sqrt(field.area || 10) * 80));
                const color = getRiskColor(field.riskLevel);
                return (
                  <Circle
                    key={`plume-${field.id}`}
                    center={[field.lat, field.lng]}
                    radius={radiusMeters}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.18,
                      color: color,
                      weight: 1.5,
                      dashArray: ec > 4.0 ? '4 4' : undefined
                    }}
                  />
                );
              })}
              {filtered.map(field => {
                if (!field.lat || !field.lng) return null;
                const isSelected = selectedField?.id === field.id;
                return (
                  <Marker
                    key={field.id}
                    position={[field.lat, field.lng]}
                    icon={createFarmPin(field.riskLevel)}
                    eventHandlers={{
                      click: () => {
                        setSelectedField(field);
                        setActiveFarmId(field.id);
                      }
                    }}
                  >
                    <Popup>
                      <div className="map-popup" style={{ minWidth: '220px', padding: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem', display: 'block', color: '#0f172a' }}>{field.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Farmer: {field.farmerName || 'Farmer'}</span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: '#fff',
                              background: getRiskColor(field.riskLevel)
                            }}
                          >
                            {field.riskLevel}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#475569', marginBottom: '8px', lineHeight: 1.4 }}>
                          <div><strong>Location:</strong> {field.location}</div>
                          <div><strong>Crop:</strong> {field.cropType} · {field.area} Acres</div>
                          <div><strong>EC:</strong> <strong>{field.groundwaterEC ?? field.metrics?.ec ?? 3.5} dS/m</strong></div>
                          <div><strong>Water Table:</strong> {field.waterTableDepth ?? field.metrics?.waterTable ?? 2.5}m</div>
                        </div>
                        <button
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            background: '#008a50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleOpenDiagnostic(field)}
                        >
                          <span>Open Full Diagnostic</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
        <div className="map-sidebar-col">
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>
                  {role === 'farmer' ? 'My Monitored Plot' : `Registered Village Plots (${filtered.length})`}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click any plot to focus camera
                </span>
              </div>
            </div>
            <div className="map-plots-list" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No plots match the selected filter.
                </div>
              ) : (
                filtered.map(field => {
                  const isSelected = selectedField?.id === field.id;
                  const ecVal = field.groundwaterEC ?? field.metrics?.ec ?? 3.5;
                  return (
                    <div
                      key={field.id}
                      className={`map-plot-item ${isSelected ? 'active-plot' : ''}`}
                      onClick={() => handleSelectFieldInList(field)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        background: isSelected ? 'rgba(0, 138, 80, 0.12)' : 'var(--bg-hover, rgba(255,255,255,0.03))',
                        border: `1px solid ${isSelected ? 'var(--primary, #008a50)' : 'var(--border-color, rgba(255,255,255,0.08))'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{field.name}</strong>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: '#fff',
                            background: getRiskColor(field.riskLevel)
                          }}
                        >
                          {field.riskLevel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Farmer: <strong>{field.farmerName || 'Farmer'}</strong></span> · <span>{field.cropType}</span> ({field.area} Ac)
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span>EC: <strong style={{ color: ecVal > 4 ? '#ef4444' : '#22c55e' }}>{ecVal} dS/m</strong></span>
                        <span>Water Table: <strong>{field.waterTableDepth ?? field.metrics?.waterTable ?? 2.5}m</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}