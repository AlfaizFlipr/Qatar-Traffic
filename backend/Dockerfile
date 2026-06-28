# ── Backend Dockerfile ─────────────────────────────────────────
# Multi-stage build: compile TypeScript → run Playwright base image
# Uses official mcr.microsoft.com/playwright image so we don't
# need to manually install 100+ system packages (saves ~2 GB disk).
# ───────────────────────────────────────────────────────────────

# Stage 1 – builder (compile TypeScript)
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2 – runtime (Playwright + Chromium already baked in)
FROM mcr.microsoft.com/playwright:v1.61.0-jammy AS runtime

WORKDIR /app

# Only production deps (skip postinstall – playwright browser already in base)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
