# TerraSal — Root Zone Salinity Intelligence Platform

TerraSal is an open-source root-zone salinity tracking and prediction platform tailored for agricultural regions affected by waterlogging and secondary salinization (e.g., Punjab, Haryana, Rajasthan).

It bridges IoT groundwater telemetry, satellite weather forecasting, FAO Maas-Hoffman agronomic models, and localized multi-language advisories for village panchayats and individual farmers.

---

## 🌾 Key Features

1. **Dual Role Modes (Topbar Switcher):**
   - **Panchayat / Extension Officer Mode:** Village-wide macro analytics, all plot pins on GIS maps, benchmark cross-field comparisons, and bulk CSV report exports for the Agriculture Department.
   - **Individual Farmer Mode:** Focused personal plot view, simple soil health dial, immediate irrigation guidance, and printable farm advisory sheets.

2. **Multi-Language Support (EN, HI, PA):**
   - Seamless one-click switching between **English**, **हिन्दी (Hindi)**, and **ਪੰਜਾਬੀ (Punjabi)** across all metrics, action cards, and navigation.

3. **7-Day Meteorological Leaching Forecast:**
   - In-memory cached weather forecast with smart agro-climatic advice:
     - *Rain anticipated in 48h*: Advises farmers to delay canal flood irrigation to harness natural rainwater for salt flushing.
     - *Prolonged dry spell*: Advises light, frequent irrigations with calculated leaching fraction to prevent capillary salt rise.

4. **What-If Crop Switch & Leaching Simulator (`/analyze`):**
   - Interactive simulator implementing the **FAO Maas-Hoffman equation**:
     $$Y = 100 - b \times (EC_e - a)$$
   - Computes expected yield loss, yield advantage recovered by switching crops (e.g. Rice to Barley or Cotton), and required leaching fraction ($LF$).

5. **Soil Lab Calibration & Gypsum Dosing (`/analyze`):**
   - Enter measured Soil ECe (dS/m), Soil pH, and Sodium Adsorption Ratio (SAR).
   - Computes Exchangeable Sodium Percentage (ESP), classifies soil (*Normal*, *Saline*, *Sodic / Alkali*, *Saline-Sodic*), and calculates exact Agricultural Gypsum requirement in tons/acre.

6. **Geospatial Salinity Risk Map (`/map`):**
   - District-level aquifer monitoring across Punjab, Haryana, and Rajasthan.
   - Toggleable **Salinity Plume Heatmap** layer and individual village farm markers with live sensor telemetry status.
   - One-click dataset export to CSV.

7. **Telemetry API with Optional Sensor Key:**
   - Real-time IoT sensor endpoint (`POST /api/telemetry`) with historical `readings` storage and alert deduplication.

---

## 🛠️ Project Structure

```
TerraSal/
├── backend/
│   ├── app.js               # Express application configuration & CORS
│   ├── server.js            # Server entry point
│   ├── routes/
│   │   ├── api.js           # Fields, benchmarks, weather forecast, simulator & lab routes
│   │   └── telemetry.js     # Live IoT sensor telemetry ingestion
│   ├── services/
│   │   ├── salinityEngine.js# Salinity prediction, FAO Maas-Hoffman & Soil Lab logic
│   │   ├── weatherService.js# OpenWeatherMap & 7-day forecast generator with caching
│   │   ├── cropDatabase.js  # Crop tolerance thresholds
│   │   └── aiService.js     # Field advisory generation
│   ├── db/
│   │   ├── index.js         # libSQL/Turso & local SQLite client with auto-migrations
│   │   └── database.sqlite  # Local SQLite database (git-ignored)
│   └── test/                # Node.js built-in test runner test suite
└── frontend/
    ├── src/
    │   ├── context/AppContext.jsx # Global app context, role & i18n state
    │   ├── utils/i18n.js          # Multi-language dictionary (English, Hindi, Punjabi)
    │   ├── pages/
    │   │   ├── Dashboard.jsx      # Farmer & Panchayat overview + 7-Day weather forecast
    │   │   ├── VillageOverview.jsx# Village-wide benchmarks & CSV export
    │   │   ├── Analyzer.jsx       # Diagnostic, What-If simulator & Soil Lab calibration
    │   │   ├── MapView.jsx        # Multi-layer GIS map & district dataset export
    │   │   ├── Recommendations.jsx# Agronomic practices & printable PDF guide
    │   │   └── Trends.jsx         # Historical sensor telemetry trends
    │   └── components/            # UI components, charts, and modal dialogs
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **npm**: v10+

### 2. Backend Setup
```bash
cd backend
npm install
npm test            # Runs backend tests (13 tests across API, DB & Salinity Engine)
npm start           # Starts backend API on http://localhost:3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run lint        # Verifies ESLint rules (0 errors)
npm run build       # Production build
npm run dev         # Starts Vite dev server on http://localhost:5173
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & DB check |
| `GET` | `/api/fields` | Batch-optimized query of all registered plots |
| `POST` | `/api/fields` | Register a new farm plot (pin-drop or manual) |
| `DELETE` | `/api/fields/:id` | Remove a farm plot |
| `GET` | `/api/weather/coords?lat=&lon=` | Current weather for given coordinates |
| `GET` | `/api/weather/forecast?lat=&lon=` | 7-day rain forecast & leaching advice |
| `POST` | `/api/analyze` | Multi-factor soil salinity risk diagnostic |
| `POST` | `/api/simulate-crop` | What-If crop switch & leaching simulation |
| `POST` | `/api/lab-calibrate` | Soil testing lab evaluation & gypsum dosage |
| `POST` | `/api/telemetry` | Ingest IoT sensor reading (`x-sensor-key` optional) |
| `GET` | `/api/village/benchmarks` | Village-wide recovery, strain & stats |

---

## 📜 Scientific Foundations

- **FAO Irrigation and Drainage Paper 29**: Water quality for agriculture (Ayers & Westcot).
- **US Salinity Laboratory Staff (Handbook 60)**: Diagnosis and Improvement of Saline and Alkali Soils.
- **Maas & Hoffman (1977)**: Crop salt tolerance: current assessment.

