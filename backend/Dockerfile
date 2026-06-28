# ── Backend Dockerfile ─────────────────────────────────────────
# Multi-stage build: compile TypeScript → run lean Node image
# ───────────────────────────────────────────────────────────────

# Stage 1 – builder
FROM node:20-slim AS builder

WORKDIR /app

# Install ALL deps (including devDeps needed to compile TS)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2 – runtime
FROM node:20-slim AS runtime

# Playwright / Chromium dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libpangocairo-1.0-0 \
    libcups2 \
    libxrandr2 \
    libasound2 \
    libgbm1 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Install Playwright Chromium browser
RUN npx playwright install chromium

EXPOSE 5000

CMD ["node", "dist/server.js"]
