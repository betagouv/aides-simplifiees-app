# Multi-stage build for AdonisJS + Vue.js application
FROM node:22.11.0-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy tsconfig and other config files
COPY tsconfig*.json ./
COPY adonisrc.ts ./

#########################################
# Dependencies stage
#########################################
FROM base AS deps

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

#########################################
# Build stage
#########################################
FROM base AS build

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Publicodes
RUN pnpm run build:publicodes

# Build icons
RUN pnpm run detect:icons
RUN pnpm run build:icons

# Build iframe integration
RUN pnpm run build:iframe-integration

# Type check
RUN pnpm run typecheck

# Build the application
RUN pnpm run build

#########################################
# Production dependencies stage
#########################################
FROM base AS prod-deps

# Install only production dependencies (skip scripts like husky prepare)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

#########################################
# Production stage
#########################################
FROM node:22.11.0-alpine AS production

# Install pnpm in production stage
RUN npm install -g pnpm@10

# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S adonisjs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps --chown=adonisjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=adonisjs:nodejs /app/build ./
COPY --from=build --chown=adonisjs:nodejs /app/public ./public
COPY --from=build --chown=adonisjs:nodejs /app/publicodes ./publicodes

# Copy package.json for script access
COPY --chown=adonisjs:nodejs package.json ./

# Set user
USER adonisjs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "bin/server.js"]
