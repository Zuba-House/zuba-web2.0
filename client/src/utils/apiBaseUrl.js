/**
 * API base URL for local dev and production.
 * Server default port is 5000 (see server/config/env.js), not 8000.
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && String(envUrl).trim()) {
    return String(envUrl).trim().replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  return 'https://zuba-api.onrender.com';
}
