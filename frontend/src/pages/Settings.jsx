import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Cpu, Bell, Database,
  User, Map, Plus, Trash2, Edit3, Wifi, WifiOff,
  CheckCircle, AlertTriangle, Save, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Settings.css';

const sensorDevices = [
  { id: 'sensor-001', name: 'TS-Node-LDH-01', type: 'EC + Water Table', fieldId: 'field-001', status: 'online', lastPing: '2 min ago', battery: 87 },
  { id: 'sensor-002', name: 'TS-Node-HSR-01', type: 'EC + Soil Moisture', fieldId: 'field-002', status: 'online', lastPing: '5 min ago', battery: 62 },
  { id: 'sensor-003', name: 'TS-Node-GNG-01', type: 'EC + Temperature', fieldId: 'field-003', status: 'online', lastPing: '1 min ago', battery: 44 },
  { id: 'sensor-004', name: 'TS-Node-BTH-01', type: 'EC + Humidity', fieldId: 'field-005', status: 'online', lastPing: '8 min ago', battery: 91 },
  { id: 'sensor-005', name: 'TS-Node-AMR-01', type: 'EC + Water Table', fieldId: 'field-004', status: 'offline', lastPing: '3 hours ago', battery: 15 },
];

const apiSources = [
  { name: 'IMD Weather API', description: 'India Meteorological Department rainfall and forecast data', status: 'not-configured', key: '' },
  { name: 'CGWB Groundwater API', description: 'Central Ground Water Board — water table depth data', status: 'not-configured', key: '' },
  { name: 'ICAR Soil Database', description: 'Indian Council of Agricultural Research soil classification', status: 'not-configured', key: '' },
  { name: 'PM-KISAN Farmer Registry', description: 'Government farmer identification and location data', status: 'not-configured', key: '' },
];

export default function Settings() {
  const { state } = useApp();
  const mockFields = state.fields || [];

  const [activeSection, setActiveSection] = useState('fields');
  const [saved, setSaved] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    criticalAlerts: true,
    highRiskAlerts: true,
    weeklyReport: true,
    sensorOffline: true,
    emailAlerts: true,
    smsAlerts: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAlertToggle = (key) => {
    setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Settings & Configuration</h1>
        <p>Manage fields, sensors, data sources, and notification preferences</p>
      </div>

      <div className="settings-layout">
        {/* Settings Nav */}
        <div className="settings-nav card">
          {[
            { key: 'fields', icon: Map, label: 'Field Management' },
            { key: 'sensors', icon: Cpu, label: 'Sensor Devices' },
            { key: 'datasources', icon: Database, label: 'Data Sources' },
            { key: 'notifications', icon: Bell, label: 'Notifications' },
            { key: 'account', icon: User, label: 'Account' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className={`settings-nav-btn ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="settings-content">

          {/* Field Management */}
          {activeSection === 'fields' && (
            <div className="settings-section fade-in">
              <div className="settings-section-header">
                <div>
                  <h2>Field Management</h2>
                  <p>Configure and manage your monitored agricultural fields</p>
                </div>
                <button className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  Add Field
                </button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Field Name</th>
                      <th>Location</th>
                      <th>Area</th>
                      <th>Crop</th>
                      <th>Sensor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockFields.map(field => (
                      <tr key={field.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{field.name}</td>
                        <td>{field.location}</td>
                        <td>{field.area} acres</td>
                        <td style={{ textTransform: 'capitalize' }}>{field.cropType}</td>
                        <td>
                          {field.sensorConnected ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-safe)', fontSize: '0.75rem' }}>
                              <Wifi size={12} /> Connected
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              <WifiOff size={12} /> Offline
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${field.riskLevel.toLowerCase()}`}>
                            {field.riskLevel}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="icon-btn" style={{ width: 28, height: 28 }} title="Edit">
                              <Edit3 size={13} />
                            </button>
                            <button className="icon-btn btn-danger" style={{ width: 28, height: 28 }} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sensor Devices */}
          {activeSection === 'sensors' && (
            <div className="settings-section fade-in">
              <div className="settings-section-header">
                <div>
                  <h2>Sensor Devices</h2>
                  <p>Monitor and manage TerraSal IoT sensor nodes in the field</p>
                </div>
                <button className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  Add Sensor
                </button>
              </div>

              <div className="sensor-grid">
                {sensorDevices.map(sensor => {
                  const field = mockFields.find(f => f.id === sensor.fieldId);
                  return (
                    <div key={sensor.id} className={`card sensor-card ${sensor.status}`}>
                      <div className="sensor-header">
                        <div>
                          <div className="sensor-name">{sensor.name}</div>
                          <div className="sensor-type">{sensor.type}</div>
                        </div>
                        <span className={`sensor-status-badge ${sensor.status}`}>
                          {sensor.status === 'online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                          {sensor.status}
                        </span>
                      </div>
                      <div className="sensor-meta">
                        <div className="sensor-meta-item">
                          <span>Field</span>
                          <strong>{field?.name ?? 'Unknown'}</strong>
                        </div>
                        <div className="sensor-meta-item">
                          <span>Last Ping</span>
                          <strong>{sensor.lastPing}</strong>
                        </div>
                        <div className="sensor-meta-item">
                          <span>Battery</span>
                          <strong style={{ color: sensor.battery < 20 ? '#ef4444' : sensor.battery < 40 ? '#f59e0b' : '#22c55e' }}>
                            {sensor.battery}%
                          </strong>
                        </div>
                      </div>
                      <div className="progress-bar-wrap">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${sensor.battery}%`,
                            background: sensor.battery < 20 ? '#ef4444' : sensor.battery < 40 ? '#f59e0b' : '#22c55e',
                          }}
                        />
                      </div>
                      {sensor.status === 'offline' && (
                        <div className="alert alert-critical" style={{ margin: 0 }}>
                          <AlertTriangle size={14} />
                          Sensor offline — check field installation and power supply.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Sources */}
          {activeSection === 'datasources' && (
            <div className="settings-section fade-in">
              <div className="settings-section-header">
                <div>
                  <h2>External Data Sources</h2>
                  <p>Connect to government and third-party APIs to enrich salinity predictions</p>
                </div>
              </div>

              <div className="api-sources-list">
                {apiSources.map((api, i) => (
                  <div key={i} className="card api-source-card">
                    <div className="api-source-header">
                      <div>
                        <h3>{api.name}</h3>
                        <p style={{ fontSize: '0.875rem', margin: 0 }}>{api.description}</p>
                      </div>
                      <span className="chip" style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.08)' }}>
                        Not configured
                      </span>
                    </div>
                    <div className="api-key-wrap">
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Enter API key (not available yet)"
                        disabled
                      />
                      <button className="btn btn-secondary btn-sm" disabled>
                        Connect
                      </button>
                    </div>
                    <div className="api-note">
                      🔧 API integration will be available in TerraSal V2. Contact support to join the beta program.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="settings-section fade-in">
              <div className="settings-section-header">
                <div>
                  <h2>Notification Preferences</h2>
                  <p>Configure alerts and reporting preferences</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                  {saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>

              <div className="card">
                <div className="notif-settings-section">
                  <h3 className="notif-group-title">Alert Triggers</h3>
                  {[
                    { key: 'criticalAlerts', label: 'Critical Risk Alerts', desc: 'Notify immediately when any field reaches CRITICAL status' },
                    { key: 'highRiskAlerts', label: 'High Risk Alerts', desc: 'Notify when any field transitions to HIGH risk level' },
                    { key: 'sensorOffline', label: 'Sensor Offline Alerts', desc: 'Notify when a sensor stops transmitting data' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="notif-toggle-row">
                      <div className="notif-toggle-info">
                        <div className="notif-toggle-label">{label}</div>
                        <div className="notif-toggle-desc">{desc}</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={alertSettings[key]}
                          onChange={() => handleAlertToggle(key)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="divider" />

                <div className="notif-settings-section">
                  <h3 className="notif-group-title">Reports</h3>
                  {[
                    { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Receive a weekly digest of field status and trends' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="notif-toggle-row">
                      <div className="notif-toggle-info">
                        <div className="notif-toggle-label">{label}</div>
                        <div className="notif-toggle-desc">{desc}</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={alertSettings[key]}
                          onChange={() => handleAlertToggle(key)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="divider" />

                <div className="notif-settings-section">
                  <h3 className="notif-group-title">Channels</h3>
                  {[
                    { key: 'emailAlerts', label: 'Email Notifications', desc: 'Send alerts to registered email address' },
                    { key: 'smsAlerts', label: 'SMS Notifications', desc: 'Send SMS alerts to registered mobile number (charges may apply)' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="notif-toggle-row">
                      <div className="notif-toggle-info">
                        <div className="notif-toggle-label">{label}</div>
                        <div className="notif-toggle-desc">{desc}</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={alertSettings[key]}
                          onChange={() => handleAlertToggle(key)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Account */}
          {activeSection === 'account' && (
            <div className="settings-section fade-in">
              <div className="settings-section-header">
                <div>
                  <h2>Account Settings</h2>
                  <p>Manage your profile and organization details</p>
                </div>
              </div>

              <div className="card">
                <div className="account-profile">
                  <div className="account-avatar">A</div>
                  <div className="account-info">
                    <h3>Agriculture Officer</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Punjab Agriculture Department</p>
                    <span className="chip" style={{ marginTop: 8 }}>Punjab Region · 6 Fields</span>
                  </div>
                </div>

                <div className="divider" />

                <div className="account-fields">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" defaultValue="Agriculture Officer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" defaultValue="officer@punjabagri.gov.in" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organization</label>
                    <input className="form-input" defaultValue="Punjab Agriculture Department" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Region</label>
                    <input className="form-input" defaultValue="Punjab, India" />
                  </div>
                </div>

                <div className="account-actions">
                  <button className="btn btn-primary" onClick={handleSave}>
                    {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Profile</>}
                  </button>
                  <button className="btn btn-secondary">Change Password</button>
                </div>
              </div>

              <div className="card platform-info">
                <div className="card-header">
                  <span className="card-title">Platform Information</span>
                </div>
                <div className="platform-info-grid">
                  {[
                    { label: 'Platform Version', value: 'TerraSal v1.0.0-beta' },
                    { label: 'Model Version', value: 'Salinity Engine v1.0' },
                    { label: 'Data Coverage', value: 'Punjab, Haryana, Rajasthan' },
                    { label: 'Fields Monitored', value: '6 active' },
                    { label: 'Data Last Synced', value: 'Aug 04, 2026 at 11:00 AM' },
                    { label: 'Next Sync', value: 'Aug 05, 2026 at 09:00 AM' },
                  ].map(({ label, value }) => (
                    <div key={label} className="platform-info-item">
                      <span className="platform-info-label">{label}</span>
                      <span className="platform-info-val">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
