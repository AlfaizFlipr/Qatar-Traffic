# ── Admin Dockerfile ───────────────────────────────────────────
# Multi-stage: build Vite SPA → serve with Nginx
# ───────────────────────────────────────────────────────────────

# Stage 1 – builder
FROM node:20-alpine AS builder

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 – Nginx static server
FROM nginx:1.25-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
