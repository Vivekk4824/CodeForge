import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD, AUTH_TOKEN, JSON_HEADERS, getHeaders } from './config.js';

/**
 * Full End-to-End API Load Test
 *
 * Exercises all primary backend capabilities under moderate load:
 * 1. System Health API (/api/health)
 * 2. Code Execution API (/api/code/run)
 * 3. AI Assistant API (/api/ai/chat)
 * 4. Authentication API (/api/auth/*)
 */

export const options = {
  stages: [
    { duration: '10s', target: 3 }, // Warm up with 3 VUs
    { duration: '20s', target: 5 }, // Sustain at 5 VUs
    { duration: '10s', target: 0 }, // Graceful ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.08'], // Allow headroom for external AI / container queues
    http_req_duration: ['p(95)<6000'],
  },
};

const SAFE_CPP_PROGRAM = `#include <iostream>
using namespace std;
int main() {
    cout << "CodeForge OK" << endl;
    return 0;
}`;

export function setup() {
  if (AUTH_TOKEN) {
    return { token: AUTH_TOKEN };
  }

  if (TEST_EMAIL && TEST_PASSWORD) {
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }), {
      headers: JSON_HEADERS,
    });

    if (res.status === 200) {
      try {
        return { token: res.json().token || '' };
      } catch (e) {}
    }
  }

  return { token: '' };
}

export default function (data) {
  const token = data ? data.token : '';

  // 1. Health Check
  group('Health Check', () => {
    const healthRes = http.get(`${BASE_URL}/api/health`, {
      headers: JSON_HEADERS,
    });
    check(healthRes, {
      'health returns 200': (r) => r.status === 200,
      'health status is success': (r) => {
        try {
          return r.json().success === true;
        } catch (e) {
          return false;
        }
      },
    });
  });

  // 2. Code Execution
  group('Code Execution', () => {
    const runPayload = JSON.stringify({
      language: 'cpp',
      code: SAFE_CPP_PROGRAM,
      input: '',
    });

    const runRes = http.post(`${BASE_URL}/api/code/run`, runPayload, {
      headers: getHeaders(token),
    });

    check(runRes, {
      'code run status is 200': (r) => r.status === 200,
      'code output received': (r) => {
        try {
          const json = r.json();
          return json.success === true && json.output.includes('CodeForge OK');
        } catch (e) {
          return false;
        }
      },
    });
  });

  // 3. Authentication (Safe verification)
  group('Authentication', () => {
    if (token) {
      const meRes = http.get(`${BASE_URL}/api/auth/me`, {
        headers: getHeaders(token),
      });
      check(meRes, {
        'authenticated profile returns 200': (r) => r.status === 200,
      });
    } else {
      const unauthRes = http.get(`${BASE_URL}/api/auth/me`, {
        headers: JSON_HEADERS,
      });
      check(unauthRes, {
        'unauthorized profile returns 401': (r) => r.status === 401,
      });
    }
  });

  // 4. AI Chat (Lightweight prompt to avoid rate limiting)
  group('AI Chat', () => {
    const aiPayload = JSON.stringify({
      context: { language: 'cpp' },
      history: [],
      userMessage: 'Hello, what is a binary tree in one sentence?',
    });

    const aiRes = http.post(`${BASE_URL}/api/ai/chat`, aiPayload, {
      headers: JSON_HEADERS,
    });

    check(aiRes, {
      'ai chat returns 200': (r) => r.status === 200,
      'ai chat text received': (r) => {
        try {
          const json = r.json();
          return json.success === true && typeof json.text === 'string';
        } catch (e) {
          return false;
        }
      },
    });
  });

  // Pause between full test iterations
  sleep(2);
}
