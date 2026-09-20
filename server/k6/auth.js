import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD, JSON_HEADERS } from './config.js';

/**
 * Authentication Performance Test (/api/auth/*)
 *
 * SAFETY RULES:
 * 1. This test NEVER floods user registration to prevent polluting the MongoDB database.
 * 2. If TEST_EMAIL and TEST_PASSWORD are provided, it tests login, token verification (/me), and logout.
 * 3. If credentials are NOT provided, it tests authentication security barriers (rejecting unauthenticated /me and invalid login attempts).
 *
 * To run with full credentials:
 *   $env:TEST_EMAIL="your_test_user@example.com"
 *   $env:TEST_PASSWORD="your_password"
 *   k6 run k6/auth.js
 */

export const options = {
  stages: [
    { duration: '5s', target: 5 },   // Ramp to 5 users
    { duration: '15s', target: 10 }, // Sustain 10 users
    { duration: '5s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // Failure rate under 5%
    http_req_failed: ['rate<0.05'],
    // Authentication endpoints should respond quickly (under 1 second p95)
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

  if (hasCredentials) {
    // -------------------------------------------------------------
    // Full Authenticated Flow: Login -> Profile (/me) -> Logout
    // -------------------------------------------------------------
    group('Authenticated Flow', () => {
      // 1. Login
      const loginPayload = JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
        headers: JSON_HEADERS,
      });

      const loginOk = check(loginRes, {
        'login returns 200': (r) => r.status === 200,
        'login returns jwt token': (r) => {
          try {
            return Boolean(r.json().token);
          } catch (e) {
            return false;
          }
        },
      });

      let token = '';
      if (loginOk) {
        try {
          token = loginRes.json().token;
        } catch (e) {}
      }

      // 2. Fetch profile using Bearer token or session cookie
      if (token) {
        const authHeaders = {
          ...JSON_HEADERS,
          'Authorization': `Bearer ${token}`,
        };

        const meRes = http.get(`${BASE_URL}/api/auth/me`, {
          headers: authHeaders,
        });

        check(meRes, {
          'me profile returns 200': (r) => r.status === 200,
          'me returns user profile': (r) => {
            try {
              return Boolean(r.json().user);
            } catch (e) {
              return false;
            }
          },
        });

        // 3. Logout
        const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
          headers: authHeaders,
        });

        check(logoutRes, {
          'logout returns 200': (r) => r.status === 200,
          'logout success is true': (r) => {
            try {
              return r.json().success === true;
            } catch (e) {
              return false;
            }
          },
        });
      }
    });
  } else {
    // -------------------------------------------------------------
    // Safe Auth Boundary Tests (no DB mutations or account locking)
    // -------------------------------------------------------------
    group('Auth Security Boundaries', () => {
      // 1. Protected endpoint (/me) should properly reject unauthenticated requests
      const meUnauthRes = http.get(`${BASE_URL}/api/auth/me`, {
        headers: JSON_HEADERS,
      });

      check(meUnauthRes, {
        'unauthorized /me returns 401 or null user': (r) => r.status === 401 || (r.status === 200 && r.json()?.user === null),
        'unauthorized message or null user returned': (r) => {
          try {
            return r.json().success === false || r.json().user === null;
          } catch (e) {
            return false;
          }
        },
      });

      // 2. Invalid login credentials should be cleanly rejected without 500 error
      const badLoginPayload = JSON.stringify({
        email: 'nonexistent_test_user@example.com',
        password: 'wrongpassword123',
      });

      const badLoginRes = http.post(`${BASE_URL}/api/auth/login`, badLoginPayload, {
        headers: JSON_HEADERS,
        responseCallback: http.expectedStatuses(401),
      });

      check(badLoginRes, {
        'invalid credentials returns 401': (r) => r.status === 401,
        'invalid credentials error message': (r) => {
          try {
            return r.json().success === false;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }

  sleep(1);
}
