import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JSON_HEADERS } from './config.js';

/**
 * AI Code Generation Load Test (/api/ai/generate)
 *
 * CAUTION:
 * This endpoint calls Google Gemini to generate source code.
 * Running high-VU tests will quickly consume rate quotas and increase cloud costs.
 * Concurrency is intentionally kept minimal (2-3 VUs).
 */

export const options = {
  stages: [
    { duration: '5s', target: 2 },  // Warm up with 2 concurrent users
    { duration: '15s', target: 3 }, // Sustain 3 concurrent users
    { duration: '5s', target: 0 },  // Ramp down
  ],
  thresholds: {
    // Under 5% failure rate
    http_req_failed: ['rate<0.05'],
    // Gemini code generation can take 2-6s depending on model load.
    http_req_duration: ['p(95)<8000'],
  },
};

export default function () {
  const payload = JSON.stringify({
    language: 'cpp',
    requirement: 'Generate a C++ function to find the maximum element in an array.',
  });

  const res = http.post(`${BASE_URL}/api/ai/generate`, payload, {
    headers: JSON_HEADERS,
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has valid JSON': (r) => {
      try {
        r.json();
        return true;
      } catch (e) {
        return false;
      }
    },
    'response success is true': (r) => {
      try {
        return r.json().success === true;
      } catch (e) {
        return false;
      }
    },
    'response contains generated code': (r) => {
      try {
        const code = r.json().code;
        return typeof code === 'string' && code.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  // Generous pause to respect API rate limits
  sleep(2);
}
