# Dockerfile pour LexImpact Territoires
# Ce Dockerfile est maintenu ici car le projet source ne fournit pas de Dockerfile
ARG NODE_IMAGE=node:22.21.1-alpine3.22

FROM $NODE_IMAGE AS base

# Set up PNPM_HOME and PATH (once for all stages)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable corepack for pnpm management (once for all stages)
RUN corepack enable && corepack prepare pnpm@10 --activate

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development
ENV NODE_ENV=development
ENV PORT=3000
WORKDIR /app

# Copy package.json (pnpm will generate its own lockfile)
COPY package.json ./
RUN pnpm install

# Copy source code (will be overridden by volume mount in docker-compose)
COPY . .

# Generate SvelteKit files before any build operations
RUN pnpm exec svelte-kit sync

EXPOSE $PORT

# Development command - supports HMR/watch
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# All dependencies stage
FROM base AS deps
WORKDIR /app

COPY package.json ./
RUN --mount=type=cache,id=pnpm-store-deps,target=/pnpm/store pnpm install --frozen-lockfile=false
# Add missing prismjs dependency that's imported in layout.svelte
RUN --mount=type=cache,id=pnpm-store-deps,target=/pnpm/store pnpm add prismjs

# Production dependencies only
FROM base AS production-deps
WORKDIR /app

COPY package.json ./
RUN --mount=type=cache,id=pnpm-store-prod,target=/pnpm/store pnpm install --frozen-lockfile=false --prod

# Build stage
FROM base AS build
WORKDIR /app

# Copy package.json for dependency installation
COPY package.json ./

# Install all dependencies (including devDependencies for build)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate SvelteKit files before build
RUN pnpm exec svelte-kit sync

# Build the application with increased memory limit
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN pnpm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S svelte -u 1001

# Copy package.json and production dependencies
COPY package.json ./
COPY --from=production-deps /app/node_modules ./node_modules

# Copy built application and static files
COPY --from=build /app/build ./build
COPY --from=build /app/static ./static
COPY --from=build /app/package.json ./

# Change ownership to non-root user
RUN chown -R svelte:nodejs /app
USER svelte

EXPOSE $PORT

CMD ["node", "./build/index.js"]
