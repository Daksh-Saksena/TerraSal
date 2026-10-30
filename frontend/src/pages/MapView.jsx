import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Layers, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRiskColor } from '../utils/formatters';
import RiskBadge from '../components/ui/RiskBadge';
import './MapView.css';

// Fix for default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;

// Fixes gray-tile bug by invalidating Leaflet container size after mount
function MapResizeController() {
  const map = useMap();
    useEffect(() => {
      const t1 = setTimeout(() => map.invalidateSize(), 150);
      const t2 = setTimeout(() => map.invalidateSize(), 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [map]);
    return null;
  }

const TREND_ICONS = { improving: '↓', stable: '→', worsening: '↑', critical: '⚠' };
  const TREND_COLORS = { improving: '#22c55e', stable: '#94a3b8', worsening: '#f97316', critical: '#ef4444' };

  const stateColors = {
    'Punjab': '#008a50',
    'Haryana': '#f59e0b',
    'Rajasthan': '#f97316',
  };

  const farmPinIcon = (color) => new L.DivIcon({
    className: 'farm-plot-pin',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  export default function MapView() {
    const { state, t } = useApp();
    const mockRegions = state.regions || [];
    const fields = state.fields || [];

    const [selectedState, setSelectedState] = useState('All');
    const [selectedRisk, setSelectedRisk] = useState('All');
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showPlots, setShowPlots] = useState(true);

    const summary = {
      totalDistricts: mockRegions.length,
      criticalDistricts: mockRegions.filter(r => r.riskLevel === 'CRITICAL').length,
      highRiskDistricts: mockRegions.filter(r => r.riskLevel === 'HIGH').length,
      totalAffectedArea: mockRegions.reduce((s, r) => s + r.affectedArea, 0),
      totalFarmersAffected: mockRegions.reduce((s, r) => s + r.farmersAffected, 0),
    };

    const filtered = mockRegions.filter(r => {
      if (selectedState !== 'All' && r.state !== selectedState) return false;
      if (selectedRisk !== 'All' && r.riskLevel !== selectedRisk) return false;
      return true;
    });

    const getMarkerRadius = (score) => {
      if (score >= 80) return 18;
      if (score >= 60) return 15;
      if (score >= 35) return 12;
      return 10;
    };

    const handleExportCSV = () => {
      const headers = ['District', 'State', 'Risk Score', 'Risk Level', 'Avg EC (dS/m)', 'Water Table Depth (m)', 'Dominant Crop', 'Affected Area (ha)', 'Farmers Affected'];
      const rows = filtered.map(r => [
        `"${r.district}"`,
        `"${r.state}"`,
        r.riskScore,
        r.riskLevel,
        r.avgEC,
        r.waterTableDepth,
        `"${r.dominantCrop}"`,
        r.affectedArea,
        r.farmersAffected
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Regional_Salinity_Map_Data_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="page-container fade-in">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{t('navMap')}</h1>
              <p>Multi-layer geospatial salinity tracking across regional aquifers and village plots</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export Map Dataset as CSV">
              <Download size={14} />
              <span>{t('exportCSV')}</span>
            </button>
          </div>

          {/* Summary Row */}
          <div className="map-summary-row">
            <div className="map-stat-card">
              <div className="map-stat-val">{summary.totalDistricts}</div>
              <div className="map-stat-label">Districts Monitored</div>
            </div>
            <div className="map-stat-card critical">
              <div className="map-stat-val">{summary.criticalDistricts}</div>
              <div className="map-stat-label">Critical Districts</div>
            </div>
            <div className="map-stat-card warning">
              <div className="map-stat-val">{summary.highRiskDistricts}</div>
              <div className="map-stat-label">High Risk Districts</div>
            </div>
            <div className="map-stat-card">
              <div className="map-stat-val">{(summary.totalAffectedArea / 1000).toFixed(0)}k ha</div>
              <div className="map-stat-label">Affected Area</div>
            </div>
            <div className="map-stat-card">
              <div className="map-stat-val">{(summary.totalFarmersAffected / 1000).toFixed(1)}k</div>
              <div className="map-stat-label">Farmers Affected</div>
            </div>
          </div>

          <div className="map-layout">
            {/* Map */}
            <div className="map-section">
                {/* Layer toggles & Filters */}
                <div className="map-filters" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <div className="map-filter-group">
                    <span className="filter-label"><Layers size={12} /> Layers:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={e => setShowHeatmap(e.target.checked)}
                      />
                      Salinity Plume Heatmap
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      <input
                        type="checkbox"
                        checked={showPlots}
                        onChange={e => setShowPlots(e.target.checked)}
                      />
                      Monitored Village Plots ({fields.length})
                    </label>
                  </div>

                  <div className="map-filter-group">
                    <span className="filter-label">State:</span>
                    {['All', 'Punjab', 'Haryana', 'Rajasthan'].map(s => (
                      <button
                        key={s}
                        className={`filter-btn ${selectedState === s ? 'active' : ''}`}
                        onClick={() => setSelectedState(s)}
                        style={selectedState === s && s !== 'All' ? { borderColor: stateColors[s], color: stateColors[s], background: `${stateColors[s]}15` } : {}}
                      >
                        {s}
                      </button>
                    ))}
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
                </div>

                {/* Leaflet Map */}
                <div className="map-container-wrap">
                  <MapContainer
                    center={[29.5, 74.8]}
                    zoom={7}
                    style={{ height: '520px', width: '100%' }}
                    zoomControl={true}
                  >
                    <TileLayer
                      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      maxZoom={19}
                    />
                    <MapResizeController />

                    {/* Salinity Plume Heatmap Layer */}
                    {showHeatmap && filtered.map(region => (
                      <Circle
                        key={`heat-${region.id}`}
                        center={[region.lat, region.lng]}
                        radius={region.riskScore >= 70 ? 28000 : 18000}
                        pathOptions={{
                          fillColor: getRiskColor(region.riskLevel),
                          fillOpacity: 0.14,
                          color: getRiskColor(region.riskLevel),
                          weight: 1,
                          opacity: 0.3
                        }}
                      />
                    ))}

                    {/* District Center Markers */}
                    {filtered.map(region => (
                      <CircleMarker
                        key={region.id}
                        center={[region.lat, region.lng]}
                        radius={getMarkerRadius(region.riskScore)}
                        fillColor={getRiskColor(region.riskLevel)}
                        color={getRiskColor(region.riskLevel)}
                        weight={2}
                        opacity={0.9}
                        fillOpacity={0.65}
                        eventHandlers={{
                          click: () => setSelectedRegion(region),
                        }}
                      >
                        <Popup>
                          <div className="map-popup">
                            <div className="popup-header">
                              <strong>{region.district}</strong>
                              <span className="popup-state">{region.state}</span>
                            </div>
                            <div className="popup-metrics">
                              <div className="popup-metric">
                                <span>Risk Score</span>
                                <strong style={{ color: getRiskColor(region.riskLevel) }}>{region.riskScore}/100</strong>
                              </div>
                              <div className="popup-metric">
                                <span>Avg EC</span>
                                <strong>{region.avgEC} dS/m</strong>
                              </div>
                              <div className="popup-metric">
                                <span>Water Table</span>
                                <strong>{region.waterTableDepth}m</strong>
                              </div>
                              <div className="popup-metric">
                                <span>Main Crop</span>
                                <strong>{region.dominantCrop}</strong>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* Village Farm Pins */}
                    {showPlots && fields.map(field => {
                      const fLat = field.lat || 30.9;
                      const fLng = field.lng || 75.85;
                      const color = field.riskLevel === 'CRITICAL' ? '#ef4444' : field.riskLevel === 'HIGH' ? '#f97316' : '#22c55e';
                      return (
                        <Marker
                          key={`farm-${field.id}`}
                          position={[fLat, fLng]}
                          icon={farmPinIcon(color)}
                        >
                          <Popup>
                            <div className="map-popup">
                              <div className="popup-header">
                                <strong>{field.name}</strong>
                                <span className="popup-state">{field.farmerName || 'Farmer'}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '4px', color: field.sensorConnected ? '#22c55e' : '#94a3b8' }}>
                                {field.sensorConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                                {field.sensorConnected ? 'Live Sensor Telemetry' : 'Manual Survey'}
                              </div>
                              <div className="popup-metrics">
                                <div className="popup-metric">
                                  <span>Crop</span>
                                  <strong>{field.cropType}</strong>
                                </div>
                                <div className="popup-metric">
                                  <span>EC</span>
                                  <strong>{field.groundwaterEC ?? field.metrics?.ec ?? 0} dS/m</strong>
                                </div>
                                <div className="popup-metric">
                                  <span>Recovery</span>
                                  <strong>{field.soilRecovery ?? 50}%</strong>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>

                  {/* Legend */}
                  <div className="map-legend">
                    <div className="legend-title">Risk Level</div>
                    {[
                      { level: 'CRITICAL', label: 'Critical (≥80)' },
                      { level: 'HIGH', label: 'High (60 to 79)' },
                      { level: 'MODERATE', label: 'Moderate (35 to 59)' },
                      { level: 'LOW', label: 'Low (<35)' },
                    ].map(item => (
                      <div key={item.level} className="legend-item">
                        <span className="legend-dot" style={{ background: getRiskColor(item.level) }} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Region Table */}
              <div className="map-sidebar-panel">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="card-title">District Summary ({filtered.length})</span>
                  </div>
                  <div className="region-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>District</th>
                          <th>EC</th>
                          <th>Risk</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered
                          .sort((a, b) => b.riskScore - a.riskScore)
                          .map(region => (
                            <tr
                              key={region.id}
                              className={selectedRegion?.id === region.id ? 'selected-row' : ''}
                              onClick={() => setSelectedRegion(region)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                                  {region.district}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  {region.state}
                                </div>
                              </td>
                              <td>
                                <span style={{ color: getRiskColor(region.riskLevel), fontWeight: 600 }}>
                                  {region.avgEC}
                                </span>
                              </td>
                              <td><RiskBadge level={region.riskLevel} showIcon={false} /></td>
                              <td style={{ color: TREND_COLORS[region.trend] }}>
                                {TREND_ICONS[region.trend]} {region.trend}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Region Detail */}
                {selectedRegion && (
                  <div className="card selected-region-card fade-in">
                    <div className="card-header">
                      <span className="card-title">Selected District</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedRegion(null)}
                        style={{ padding: '4px 10px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="selected-region-header">
                      <div>
                        <h3 style={{ marginBottom: 2 }}>{selectedRegion.district}</h3>
                        <span className="chip">{selectedRegion.state}</span>
                      </div>
                      <RiskBadge level={selectedRegion.riskLevel} size="lg" />
                    </div>
                    <div className="selected-region-stats">
                      {[
                        { label: 'Risk Score', value: `${selectedRegion.riskScore}/100`, color: getRiskColor(selectedRegion.riskLevel) },
                        { label: 'Avg EC', value: `${selectedRegion.avgEC} dS/m` },
                        { label: 'Water Table', value: `${selectedRegion.waterTableDepth}m` },
                        { label: 'Main Crop', value: selectedRegion.dominantCrop },
                        { label: 'Affected Area', value: `${(selectedRegion.affectedArea / 1000).toFixed(1)}k ha` },
                        { label: 'Farmers', value: `${selectedRegion.farmersAffected.toLocaleString()}` },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="selected-stat">
                          <span className="selected-stat-label">{label}</span>
                          <span className="selected-stat-val" style={color ? { color } : {}}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
}
