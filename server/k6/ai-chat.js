import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JSON_HEADERS } from './config.js';

/**
 * AI Chat Load Test (/api/ai/chat)
 *
 * CAUTION:
 * This endpoint proxies requests to Google Gemini. Running aggressive load tests
 * WILL consume API quota and may incur external cloud API costs.
 * Keep concurrency (VUs) and iterations intentionally LOW.
 */

export const options = {
  stages: [
    { duration: '5s', target: 2 },  // Warm up with 2 concurrent users
    { duration: '15s', target: 3 }, // Sustain at 3 concurrent users
    { duration: '5s', target: 0 },  // Ramp down
  ],
  thresholds: {
    // Under 5% failure rate for Gemini API calls
    http_req_failed: ['rate<0.05'],
    // External LLMs typically have 1-5s TTFT/generation latency.
    http_req_duration: ['p(95)<8000'],
  },
};

export default function () {
  const payload = JSON.stringify({
    context: {
      language: 'cpp',
      problem: 'Find maximum subarray sum',
    },
    history: [],
    userMessage: 'What is the time complexity of Kadane algorithm?',
  });

  const res = http.post(`${BASE_URL}/api/ai/chat`, payload, {
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
    'response contains answer text': (r) => {
      try {
        const text = r.json().text;
        return typeof text === 'string' && text.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  // Generous sleep between iterations to avoid Gemini rate limits (RPM / TPM)
  sleep(2);
}
