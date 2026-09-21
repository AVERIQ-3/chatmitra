# Multi-stage Dockerfile for Node.js Express + Vite full-stack app

# Stage 1: Build phase
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build client and server bundles (outputs to dist/ and dist/server.cjs)
RUN npm run build

# Stage 2: Production runner phase
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled output and package configuration from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose app port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the Node.js production server
CMD ["node", "dist/server.cjs"]
