import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X, MapPin, Cloud, Droplets, Wind,
  Check, AlertTriangle, ArrowRight, Loader2, Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SOIL_TYPES, CROP_TYPES, IRRIGATION_METHODS, DRAINAGE_QUALITIES
} from '../../utils/constants';
import './PinDropModal.css';

// Fix for custom pin icon in Leaflet
const pinIcon = new L.DivIcon({
  className: 'custom-pin-icon',
  html: `<div class="pin-marker-pulse"><div class="pin-marker-dot"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle map clicks and drop the pin
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PinDropModal() {
  const { state, closePinDropModal, addFarm } = useApp();

  const [coords, setCoords] = useState({ lat: 30.4500, lng: 74.8000 });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [farmerName, setFarmerName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [area, setArea] = useState(25);
  const [cropType, setCropType] = useState('wheat');
  const [soilType, setSoilType] = useState('loamy');
  const [irrigationMethod, setIrrigationMethod] = useState('flood');
  const [drainageQuality, setDrainageQuality] = useState('moderate');
  const [groundwaterEC, setGroundwaterEC] = useState(3.5);
  const [waterTableDepth, setWaterTableDepth] = useState(2.2);
  const [notes, setNotes] = useState('');

  // Fetch weather when coordinates change
  const fetchWeather = async (lat, lon) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather/coords?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (state.isPinDropModalOpen) {
      fetchWeather(coords.lat, coords.lng);
    }
  }, [state.isPinDropModalOpen]);

  const handleLocationSelect = (lat, lng) => {
    const roundedLat = parseFloat(lat.toFixed(5));
    const roundedLng = parseFloat(lng.toFixed(5));
    setCoords({ lat: roundedLat, lng: roundedLng });
    fetchWeather(roundedLat, roundedLng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmName.trim()) {
      setErrorMsg('Please enter a Farm or Plot Name');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await addFarm({
        name: farmName,
        farmerName: farmerName || 'Village Farmer',
        location: weather?.cityName ? `${weather.cityName} (${coords.lat.toFixed(3)}°N, ${coords.lng.toFixed(3)}°E)` : `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`,
        lat: coords.lat,
        lng: coords.lng,
        area: parseFloat(area),
        cropType,
        soilType,
        irrigationMethod,
        drainageQuality,
        groundwaterEC: parseFloat(groundwaterEC),
        waterTableDepth: parseFloat(waterTableDepth),
        rainfallLast30Days: weather?.rainfallLast30DaysEst || 15,
        notes
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register farm');
    } finally {
      setSubmitting(false);
    }
  };

  if (!state.isPinDropModalOpen) return null;

  return (
    <div className="modal-overlay fade-in">
      <div className="pindrop-modal card">
        {/* Modal Header */}
        <div className="pindrop-header">
          <div className="pindrop-title-group">
            <div className="pindrop-icon-box">
              <MapPin size={20} />
            </div>
            <div>
              <h3>Pin Your Farm — Panchayat Kiosk</h3>
              <p>Click on the map to pinpoint your exact plot and generate a WHOOP soil health profile</p>
            </div>
          </div>
          <button className="pindrop-close-btn" onClick={closePinDropModal}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="pindrop-error-banner">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pindrop-body">
          {/* Left Column: Interactive Map */}
          <div className="pindrop-map-pane">
            <div className="pindrop-map-header">
              <span className="pindrop-map-instruction">
                <Compass size={13} /> Click anywhere on map to drop pin
              </span>
              <span className="pindrop-coords-pill">
                {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
              </span>
            </div>

            <div className="pindrop-leaflet-wrapper">
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={8}
                style={{ height: '360px', width: '100%', borderRadius: '10px' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                  subdomains="abcd"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                <Marker position={[coords.lat, coords.lng]} icon={pinIcon} />
              </MapContainer>
            </div>

            {/* Live Weather Box for Selected Pin */}
            <div className="pindrop-weather-box">
              <div className="weather-box-title">
                <Cloud size={14} />
                <span>Live Micro-Climate for Pinned Coordinates</span>
                {weatherLoading && <Loader2 size={13} className="spin" />}
              </div>
              {weather ? (
                <div className="weather-metrics-row">
                  <div className="weather-metric">
                    <span className="weather-val">{weather.temperature}°C</span>
                    <span className="weather-lbl">{weather.weatherDesc}</span>
                  </div>
                  <div className="weather-metric">
                    <span className="weather-val">{weather.humidity}%</span>
                    <span className="weather-lbl">Humidity</span>
                  </div>
                  <div className="weather-metric">
                    <span className="weather-val">{weather.rainfallLast30DaysEst} mm</span>
                    <span className="weather-lbl">30d Rain (est)</span>
                  </div>
                  <div className="weather-metric">
                    <span className="weather-val">{weather.windSpeed} m/s</span>
                    <span className="weather-lbl">Wind</span>
                  </div>
                </div>
              ) : (
                <div className="weather-loading-text">Fetching OpenWeatherMap telemetry...</div>
              )}
            </div>
          </div>

          {/* Right Column: Farmer & Field Details */}
          <div className="pindrop-form-pane">
            <div className="form-group">
              <label>Farmer's Name</label>
              <input
                type="text"
                placeholder="e.g. Sardar Sukhdev Singh"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Farm / Plot Name</label>
              <input
                type="text"
                placeholder="e.g. Canal View Plot #3"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Plot Area (Acres)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary Crop</label>
                <select value={cropType} onChange={(e) => setCropType(e.target.value)}>
                  {CROP_TYPES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Soil Texture</label>
                <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                  {SOIL_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Irrigation Type</label>
                <select value={irrigationMethod} onChange={(e) => setIrrigationMethod(e.target.value)}>
                  {IRRIGATION_METHODS.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Drainage Quality</label>
                <select value={drainageQuality} onChange={(e) => setDrainageQuality(e.target.value)}>
                  {DRAINAGE_QUALITIES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Water Table Depth: <strong>{waterTableDepth} m</strong></label>
                <input
                  type="range"
                  min="0.5"
                  max="7.0"
                  step="0.1"
                  value={waterTableDepth}
                  onChange={(e) => setWaterTableDepth(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="slider-label-row">
                <label>Groundwater EC (Salinity): <strong>{groundwaterEC} dS/m</strong></label>
                <span className={`ec-tag ${groundwaterEC > 5 ? 'critical' : groundwaterEC > 3 ? 'high' : 'safe'}`}>
                  {groundwaterEC > 5 ? 'Severe Salt' : groundwaterEC > 3 ? 'Elevated' : 'Safe/Moderate'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="9.0"
                step="0.1"
                value={groundwaterEC}
                onChange={(e) => setGroundwaterEC(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Farmer Notes / Field Observation</label>
              <textarea
                rows="2"
                placeholder="e.g. Tubewell water smells brackish; white crust observed after rain"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="pindrop-actions">
              <button type="button" className="btn-cancel" onClick={closePinDropModal}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Analyzing Soil...</span>
                  </>
                ) : (
                  <>
                    <span>Register Farm & Run Diagnostic</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
