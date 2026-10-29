/**
 * API configuration utility for TerraSal frontend.
 *
 * In local development:
 *   If VITE_API_URL is omitted or empty, relative paths (e.g. '/api/fields')
 *   are forwarded via Vite's proxy to http://localhost:3000.
 *
 * In production on Vercel:
 *   If backend is deployed as a separate Vercel project, configure:
 *   VITE_API_URL=https://<your-backend-project>.vercel.app
 *   All endpoints will resolve correctly to the hosted backend.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

/**
 * Returns the fully qualified URL for an API endpoint.
 * Ensures consistent handling whether VITE_API_URL includes trailing '/api' or not.
 *
 * @param {string} endpoint - Relative path (e.g. '/api/fields' or '/api/weather/coords')
 * @returns {string} Resolvable API URL
 */
export function getApiUrl(endpoint) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!API_BASE_URL) {
    return path;
  }

  // Avoid duplicate '/api' if base URL already includes '/api'
  if (API_BASE_URL.endsWith('/api') && path.startsWith('/api/')) {
    return `${API_BASE_URL}${path.slice(4)}`;
  }

  return `${API_BASE_URL}${path}`;
}
