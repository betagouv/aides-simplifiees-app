ARG NODE_IMAGE=node:22.16.0-alpine3.22

FROM $NODE_IMAGE AS base

# Set up PNPM_HOME and PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable corepack for pnpm management
RUN corepack enable && corepack prepare pnpm@10 --activate

# All dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store-deps,target=/pnpm/store pnpm install --frozen-lockfile

# Production dependencies stage
FROM base AS production-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store-prod,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN --mount=type=cache,id=pnpm-store-build,target=/pnpm/store pnpm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3333
WORKDIR /app

# Create non-root user and temp directory
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonisjs -u 1001 -G nodejs && \
    mkdir -p /app/tmp && \
    chown -R adonisjs:nodejs /app/tmp

COPY --from=production-deps --chown=adonisjs:nodejs /app/node_modules /app/node_modules
COPY --from=build --chown=adonisjs:nodejs /app/build /app/build

USER adonisjs
EXPOSE $PORT
CMD ["node", "build/bin/server.js"]
