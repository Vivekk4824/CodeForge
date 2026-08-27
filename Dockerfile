# ============================================================================
# STAGE 1: Build Backend (Node.js + Dependencies)
# ============================================================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --omit=dev

# ============================================================================
# STAGE 2: Production Backend (API Only)
# ============================================================================
FROM node:20-alpine AS backend-prod

WORKDIR /app/server

# Copy dependencies from builder
COPY --from=backend-builder /app/server/node_modules ./node_modules
COPY server . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]

# ============================================================================
# STAGE 3: C++ Executor (Warm Pool Container)
# ============================================================================
FROM gcc:14-alpine AS cpp-executor

RUN apk add --no-cache g++ gdb

WORKDIR /usr/src/app

CMD ["sh"]

# ============================================================================
# STAGE 4: Python Executor (Warm Pool Container)
# ============================================================================
FROM python:3.11-slim AS python-executor

RUN pip install --no-cache-dir numpy pandas requests

WORKDIR /usr/src/app

CMD ["sh"]

# ============================================================================
# STAGE 5: Node.js Executor (Warm Pool Container)
# ============================================================================
FROM node:20-alpine AS js-executor

WORKDIR /usr/src/app

RUN npm install -g --no-save express axios

CMD ["sh"]

# ============================================================================
# STAGE 6: Java Executor (Warm Pool Container)
# ============================================================================
FROM eclipse-temurin:21-jdk-alpine AS java-executor

WORKDIR /usr/src/app

CMD ["sh"]
