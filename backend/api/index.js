import app from '../app.js';
import { initializeDB } from '../db/index.js';
let initPromise = null;
export default async function handler(req, res) {
  try {
    if (!initPromise) {
      initPromise = initializeDB().catch(err => {
        initPromise = null;
        console.error('[Vercel Serverless] DB initialization error:', err.message);
        throw err;
      });
    }
    await initPromise;
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless] Handler error:', err.message);
    res.status(500).json({
      error: 'Backend Initialization Error',
      message: err.message,
      hint: !process.env.TURSO_DATABASE_URL
        ? 'Please configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel project environment variables.'
        : undefined
    });
  }
}