# AI Coding Platform

A lightweight, full-stack coding platform built with React, Express, MongoDB, and the Google Gemini API. It features a Monaco-based code editor, secure C++ code execution, and a Copilot-style AI assistant.

## Features
- **Code Execution:** Securely compile and execute C++ code natively (with timeouts and limits).
- **Monaco Editor:** VS Code-like editing experience with syntax highlighting and formatting.
- **AI Assistant (Gemini):**
  - Chat about your code, explain errors, and get hints.
  - Generate code from natural language prompts.
  - Convert code between languages (C++, Java, Python, JavaScript).
- **Authentication & Limits:**
  - Anonymous users are limited to 3 code executions per hour.
  - Authenticated users get unlimited executions and history tracking (WIP).

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS v4, Monaco Editor, React Router.
- **Backend:** Node.js, Express, Mongoose, @google/genai, express-rate-limit.

## Folder Structure
- `/client`: Vite + React frontend application.
- `/server`: Express backend API.

## Installation & Setup

1. **Install dependencies:**
   \`\`\`bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install
   \`\`\`

2. **Environment Variables:**
   Rename `server/.env.example` to `server/.env` and update the values:
   \`\`\`
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-coding-platform
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   \`\`\`

3. **Running the App:**
   Start the backend (Terminal 1):
   \`\`\`bash
   cd server
   npm run dev
   \`\`\`
   
   Start the frontend (Terminal 2):
   \`\`\`bash
   cd client
   npm run dev
   \`\`\`

## Security & Execution Architecture
Code execution currently uses Node's `child_process.spawn`. It writes user code to a temporary directory, compiles it with `g++`, and runs the executable. Strict timeout limits (`EXECUTION_TIMEOUT`) are enforced. For production deployments, this service should be replaced with an isolated Docker container approach.

> **Note:** The Gemini API Key is kept entirely on the server. The frontend never communicates with Gemini directly.
