# TerraSal

Soil salinity tracking and crop advisory tool for farmers, panchayats, and agricultural extension workers.

## Overview

Agricultural areas in parts of Punjab, Haryana, and Rajasthan frequently struggle with shallow water tables and soil salinization. When saline groundwater rises or irrigation water evaporates without adequate drainage, salts build up in the root zone and damage crop yields.

TerraSal was built to give farmers and field officers an easy way to monitor root zone salinity, time irrigation around the weather, and make practical decisions about crops and soil treatments.

## What it does

- **Two viewing modes**: A focused plot view for individual farmers with straightforward guidance, and a village overview for panchayats and extension workers to compare plots, track village-wide metrics, and export reports.
- **Languages**: Supports English, Hindi, and Punjabi so local farmers and field workers can read reports and alerts in their preferred language.
- **7-day weather and leaching advice**: Checks upcoming weather to help plan irrigation. For example, if heavy rain is due in 48 hours, it advises delaying canal irrigation so natural rainwater can leach salts away without wasting water.
- **Crop switch simulation**: Implements the standard FAO Maas-Hoffman equation to calculate expected yield loss at a given soil electrical conductivity (ECe) and show potential yield improvements from switching to more salt-tolerant crops like barley, mustard, or cotton.
- **Soil lab calibration and gypsum dosing**: Takes measured ECe, pH, and Sodium Adsorption Ratio (SAR) from a laboratory soil test, determines whether the soil is saline, sodic, or saline-sodic, and calculates how many tons of agricultural gypsum per acre are needed to restore soil structure.
- **Field map**: Displays registered farm plots on an interactive map with salinity risk levels, regional aquifer context, and CSV export.
- **Telemetry ingestion**: Includes an API endpoint to receive periodic soil EC and moisture readings from field sensor probes.

## Project structure

```
TerraSal/
├── backend/
│   ├── app.js               Express application and middleware
│   ├── server.js            Server entry point
│   ├── routes/
│   │   ├── api.js           Fields, benchmarks, weather, and calculation routes
│   │   └── telemetry.js     Sensor telemetry ingestion endpoint
│   ├── services/
│   │   ├── salinityEngine.js Salinity risk models and Maas-Hoffman calculations
│   │   ├── weatherService.js Weather forecasts and caching
│   │   ├── cropDatabase.js  Crop salinity threshold database
│   │   └── aiService.js     Agronomic advisory text generator
│   ├── db/
│   │   ├── index.js         Database connection (Turso and local SQLite)
│   │   └── database.sqlite  Local database file
│   └── test/                Node.js native test runner test suite
└── frontend/
    ├── src/
    │   ├── context/AppContext.jsx Global state, role switcher, language switcher
    │   ├── utils/i18n.js          English, Hindi, and Punjabi dictionaries
    │   ├── pages/
    │   │   ├── Dashboard.jsx      Farmer overview, risk cards, and 7-day weather
    │   │   ├── VillageOverview.jsx Village benchmarks and plot comparisons
    │   │   ├── Analyzer.jsx       Diagnostic tool, crop switch simulator, and lab calculator
    │   │   ├── MapView.jsx        Plot map with district data
    │   │   ├── Recommendations.jsx Agronomic advice and printable guide
    │   │   └── Trends.jsx         Historical sensor readings
    │   └── components/            UI elements, modal dialogs, and charts
    ├── package.json
    └── vite.config.js
```

## Getting started

### Requirements

- Node.js 20 or higher
- npm 10 or higher

### Backend

```bash
cd backend
npm install
npm test
npm start
```

The backend server runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run build
npm run dev
```

The frontend development server runs on `http://localhost:5173`.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend status and database health check |
| GET | `/api/fields` | List of all registered farm plots |
| POST | `/api/fields` | Register a new farm plot |
| DELETE | `/api/fields/:id` | Remove a registered farm plot |
| GET | `/api/weather/coords?lat=&lon=` | Current weather for given coordinates |
| GET | `/api/weather/forecast?lat=&lon=` | 7-day rainfall forecast and leaching guidance |
| POST | `/api/analyze` | Multi-factor soil salinity risk evaluation |
| POST | `/api/simulate-crop` | Crop yield impact and crop switch comparison |
| POST | `/api/lab-calibrate` | Soil classification and gypsum dosage calculation |
| POST | `/api/telemetry` | Record incoming sensor telemetry |
| GET | `/api/village/benchmarks` | Village-level averages and soil health summary |

## References

- Ayers, R. S. and Westcot, D. W. (1985). *Water quality for agriculture*. FAO Irrigation and Drainage Paper 29.
- US Salinity Laboratory Staff (1954). *Diagnosis and Improvement of Saline and Alkali Soils*. Agriculture Handbook No. 60.
- Maas, E. V. and Hoffman, G. J. (1977). *Crop salt tolerance - current assessment*. Journal of the Irrigation and Drainage Division, ASCE, 103(IR2), 115-134.

