# CodeForge k6 Performance & Load Testing Suite

This directory contains automated performance, load, and stress test suites for the CodeForge backend using [k6](https://k6.io/).

---

## 1. Requirements

Before running the tests, ensure:
1. **CodeForge Backend Server Running**:
   The server should be active (by default on `http://localhost:5000`):
   ```bash
   cd server
   npm run dev
   ```
2. **k6 Installed**:
   - **Windows (winget)**:
     ```powershell
     winget install k6 --source winget
     ```
   - **Windows (Chocolatey)**:
     ```powershell
     choco install k6
     ```
   - **macOS (Homebrew)**:
     ```bash
     brew install k6
     ```
   - **Linux / Docker / Direct download**:
     Visit [k6 Installation Documentation](https://grafana.com/docs/k6/latest/set-up/install-k6/).
3. **MongoDB Running & Connected**: Required for authentication tests (`/api/auth/*`).
4. **Google Gemini API Key Configured**: Configured in `server/.env` as `GEMINI_API_KEY` (required for `/api/ai/*` tests).

---

## 2. Environment Variables

All tests are configurable without editing source code:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:5000` | Base URL of the backend API |
| `TEST_EMAIL` | *(empty)* | Email of an existing test user |
| `TEST_PASSWORD` | *(empty)* | Password of the test user |
| `AUTH_TOKEN` | *(empty)* | Pre-generated JWT bearer token (skips login step) |

---

## 3. Test Suites & Commands

Execute tests from the `server/` root directory:

### A. Code Execution Load Test (`k6/code-run.js`)
Tests `POST /api/code/run` by sending a safe C++ program and validating compilation, execution, and output.
- **k6 command**:
  ```bash
  k6 run k6/code-run.js
  ```
- **npm shortcut**:
  ```bash
  npm run k6:code
  ```
> **Note on Rate Limiting**: CodeForge enforces an anonymous limit of 3 executions/day. Provide `TEST_EMAIL` and `TEST_PASSWORD` or `AUTH_TOKEN` to run sustained load tests with authentication:
> ```powershell
> $env:TEST_EMAIL="test@example.com"
> $env:TEST_PASSWORD="Password123"
> k6 run k6/code-run.js
> ```

---

### B. AI Chat Load Test (`k6/ai-chat.js`)
Tests `POST /api/ai/chat` with developer questions.
- **k6 command**:
  ```bash
  k6 run k6/ai-chat.js
  ```
- **npm shortcut**:
  ```bash
  npm run k6:chat
  ```
> **Warning**: Calls the live Gemini LLM API. Concurrency is intentionally capped at 2–3 VUs with sleep intervals to protect API quota.

---

### C. AI Code Generation Load Test (`k6/ai-generate.js`)
Tests `POST /api/ai/generate` by requesting C++ function code.
- **k6 command**:
  ```bash
  k6 run k6/ai-generate.js
  ```
- **npm shortcut**:
  ```bash
  npm run k6:generate
  ```

---

### D. Authentication Flow Test (`k6/auth.js`)
Tests login, token retrieval, profile lookup (`/me`), and logout.
- **k6 command**:
  ```bash
  k6 run k6/auth.js
  ```
- **npm shortcut**:
  ```bash
  npm run k6:auth
  ```
> **Safe Database Policy**: Does not register new users during load testing. If `TEST_EMAIL` and `TEST_PASSWORD` are not provided, it tests authentication security boundaries (rejection of unauthenticated and bad credentials).

---

### E. Full End-to-End Test (`k6/full-api-test.js`)
Runs an integrated workflow exercising Health, Code Execution, Auth, and AI Chat in structured groups.
- **k6 command**:
  ```bash
  k6 run k6/full-api-test.js
  ```
- **npm shortcut**:
  ```bash
  npm run k6:full
  ```

---

## 4. Customizing BASE_URL

### PowerShell (Windows)
```powershell
$env:BASE_URL="http://localhost:5000"
k6 run k6/code-run.js
```
Or inline via the `-e` flag:
```powershell
k6 run -e BASE_URL=http://localhost:5000 k6/code-run.js
```

### Bash (macOS / Linux)
```bash
BASE_URL="http://localhost:5000" k6 run k6/code-run.js
```

---

## 5. Understanding k6 Metrics

When a test completes, k6 displays summary statistics:

- **`http_req_duration`**: Total round-trip time for requests (includes sending, waiting for response TTFB, and downloading body).
  - **`avg`**: Arithmetic mean response time.
  - **`p(90)` / `p(95)`**: 90th and 95th percentiles. 95% of requests took less than this duration.
- **`http_req_failed`**: The percentage of requests that returned HTTP error status codes (4xx or 5xx).
- **`http_reqs`**: Total number of HTTP requests dispatched during the test run, along with the average requests per second (RPS).
- **`iterations`**: Number of complete iterations executed by all VUs.
- **`vus`**: Active Virtual Users at the end of the test.
- **`vus_max`**: Maximum number of Virtual Users allocated.

---

## 6. Safety & Best Practices

1. **Start with Low VUs**: Do not immediately ramp to hundreds of VUs. Containers and database connections should be scaled gradually.
2. **Protect Gemini API Quotas**: AI chat and code generation endpoints make outbound calls to Google Gemini. Running massive concurrency will hit TPM/RPM quotas and cause HTTP 429/503 errors.
3. **Safe Code Payloads**: Keep test code snippets deterministic, bounded, and free from infinite loops to prevent worker starvation.
4. **Use Test Credentials Only**: Never commit production credentials into test files or version control. Always pass sensitive variables through `$env:TEST_EMAIL` or command-line flags.
