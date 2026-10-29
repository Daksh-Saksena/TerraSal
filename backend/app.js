import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import telemetryRoutes from './routes/telemetry.js';

// Load .env if present
try {
  process.loadEnvFile();
} catch {
  // .env is optional
}

const app = express();

// Parse and validate CORS origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // If wildcard origin specified
    if (process.env.CORS_ORIGIN === '*') return callback(null, true);

    // Check explicitly configured origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // In non-production, allow all localhost ports
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments if enabled or by default
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked request from origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Root health ping
app.get('/', (req, res) => {
  res.json({
    name: 'TerraSal API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Mount routes under /api
app.use('/api/telemetry', telemetryRoutes);
app.use('/api', apiRoutes);

// Also mount directly under root for flexibility (e.g. /fields, /analyze, /health)
app.use('/telemetry', telemetryRoutes);
app.use('/', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.path}`,
    availableEndpoints: [
      '/api/health',
      '/api/fields',
      '/api/village/benchmarks',
      '/api/regions',
      '/api/trends',
      '/api/crops',
      '/api/analyze',
      '/api/telemetry'
    ]
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[App Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    status
  });
});

export default app;
