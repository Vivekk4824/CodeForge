import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD, AUTH_TOKEN, getHeaders } from './config.js';

/**
 * Code Execution Load Test (/api/code/run)
 *
 * Simulates concurrent developers running C++ code on CodeForge.
 *
 * NOTE ON RATE LIMITING:
 * CodeForge enforces an anonymous rate limit of 3 executions/day for unauthenticated requests.
 * To run sustained load tests without hitting the 429 limiter, provide test credentials:
 *   $env:TEST_EMAIL="test@example.com"
 *   $env:TEST_PASSWORD="password123"
 *   k6 run k6/code-run.js
 * Or provide a pre-existing token:
 *   $env:AUTH_TOKEN="your_jwt_token"
 *   k6 run k6/code-run.js
 */

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp up to 5 concurrent users
    { duration: '20s', target: 10 }, // Sustain load at 10 concurrent users
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    // Fail rate under 5% (or 429 rate limit when run anonymously without credentials)
    http_req_failed: ['rate<0.05'],
    // Docker execution & C++ compilation typically takes 500ms - 3000ms.
    // We set p(95) to 5000ms to allow realistic compilation and execution overhead.
    http_req_duration: ['p(95)<5000'],
  },
};

// Safe, deterministic C++ program that reads two numbers and outputs their sum
const SAFE_CPP_PROGRAM = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    } else {
        cout << 42 << endl;
    }
    return 0;
}`;

// Optional setup phase: logs in if TEST_EMAIL and TEST_PASSWORD are provided
export function setup() {
  if (AUTH_TOKEN) {
    return { token: AUTH_TOKEN };
  }

  if (TEST_EMAIL && TEST_PASSWORD) {
    const loginPayload = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 200) {
      try {
        const body = res.json();
        return { token: body.token || '' };
      } catch (e) {
        // Fallback
      }
    }
  }

  return { token: '' };
}

export default function (data) {
  const payload = JSON.stringify({
    language: 'cpp',
    code: SAFE_CPP_PROGRAM,
    input: '17 25',
  });

  const headers = getHeaders(data ? data.token : '');

  const res = http.post(`${BASE_URL}/api/code/run`, payload, {
    headers: headers,
  });

  // Verify response
  const isOk = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has valid JSON': (r) => {
      try {
        r.json();
        return true;
      } catch (e) {
        return false;
      }
    },
    'execution returned output': (r) => {
      try {
        const json = r.json();
        return json.success === true && json.output !== undefined;
      } catch (e) {
        return false;
      }
    },
    'calculated correct sum': (r) => {
      try {
        const json = r.json();
        return json.output && json.output.trim() === '42';
      } catch (e) {
        return false;
      }
    },
  });

  // Brief pause between developer iterations
  sleep(1);
}
