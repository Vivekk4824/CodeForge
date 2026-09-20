/**
 * Common configuration for CodeForge k6 load and performance tests
 *
 * All values can be overridden via environment variables when running k6:
 *   k6 run -e BASE_URL=http://localhost:5000 k6/code-run.js
 *   $env:BASE_URL="http://localhost:5000"; k6 run k6/code-run.js
 */

// Base URL for the CodeForge backend API
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Optional test credentials for endpoints requiring authentication or rate limit bypass
export const TEST_EMAIL = __ENV.TEST_EMAIL || '';
export const TEST_PASSWORD = __ENV.TEST_PASSWORD || '';
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Common HTTP Headers
export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Builds HTTP headers including Bearer authorization if a token is supplied
 * @param {string} [token] - Optional JWT token
 * @returns {object} Headers object
 */
export function getHeaders(token = '') {
  const activeToken = token || AUTH_TOKEN;
  if (activeToken) {
    return {
      ...JSON_HEADERS,
      'Authorization': `Bearer ${activeToken}`,
    };
  }
  return JSON_HEADERS;
}
