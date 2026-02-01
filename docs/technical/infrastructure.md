# Infrastructure & Architecture

This document details the Docker infrastructure, service architecture, and deployment procedures for the **Aides Simplifiées** application.

## Global Architecture

The application relies on a micro-services architecture orchestrated by Docker Compose.

```mermaid
graph TB
    subgraph "Docker Infrastructure"
        subgraph "Application Layer"
            main["main-app<br/>AdonisJS + Vue.js<br/>Port 8080 (Prod)"]
            openfisca[openfisca<br/>Calculation Engine<br/>Python Flask]
            leximpact[leximpact<br/>Territorial Data<br/>Node.js]
        end

        subgraph "Data Layer"
            db[(PostgreSQL 17)]
            backup[db-backup<br/>Prod only]
        end
    end

    subgraph "External"
        users[👥 Users]
        proxy[Reverse Proxy / LB]
    end

    users -->|HTTPS| proxy
    proxy -->|HTTP| main
    main -->|Internal API| openfisca
    main -->|Internal API| leximpact
    main -->|SQL| db
    backup -.->|Dump| db
```

### Services

| Service | Technology | Description |
|---------|-------------|-------------|
| **main-app** | AdonisJS + Vue.js | Main application, web server, API, frontend (Inertia). |
| **openfisca** | Python / Flask | [OpenFisca France](https://github.com/openfisca/openfisca-france). Legislative calculation engine. |
| **leximpact** | Node.js | [LexImpact Territoires](https://git.leximpact.dev/leximpact/territoires/territoires). Geographic data API. |
| **db** | PostgreSQL 17 | Relational database. |

## Environments

Multiple Docker Compose configurations are used depending on the context (`infra/docker-compose.*.yml`).

| Env | Usage | Main App | Party Services | Exposed Ports |
|-----|-------|----------|----------------|---------------|
| **dev** | Daily Development | **Local** (Host) | Docker | DB (5432), OpenFisca (5001), LexImpact (3000) |
| **preprod** | Staging / QA | Docker | Docker | App (8081) |
| **prod** | Production | Docker | Docker | App (8080) |

> **Note:** In development (`make dev`), the main application runs on the host machine (via `pnpm dev`) for hot-reload, while dependencies (DB, OpenFisca, etc.) run in Docker.

## Configuration

### Environment Variables

Configuration is centralized at the project root.
- **Development**: `.env` (for AdonisJS and Docker dev)
- **Preproduction**: `.env.preprod`
- **Production**: `.env.prod`

Docker Compose is configured to use these files.

Key infrastructure variables:

| Variable | Dev (Localhost) | Prod (Docker) |
|----------|-----------------|---------------|
| `DB_HOST` | `localhost` | `db` |
| `OPENFISCA_URL` | `http://localhost:5001/calculate` | `http://openfisca:5000/calculate` |
| `LEXIMPACT_URL` | `http://localhost:3000` | `http://leximpact:3000` |

### Secrets

To generate secure keys (APP_KEY, DB_PASSWORD...):
```bash
make secrets
```

## Deployment

### Server Prerequisites
- Docker & Docker Compose
- Git
- Make

### External Services Validation
At startup (production/staging only), the application validates connectivity to external services:
- **Matomo**: API authentication test
- **OpenFisca**: Service availability check

Validation failures log warnings to Sentry but do not block startup. See `start/external_services_validation.ts`.

## Docker Images

We use specific scripts to build and push multi-architecture images (`amd64` and `arm64`) to the GitHub Container Registry.

### Commands

| Command | Usage | Script Used |
|---------|-------|-------------|
| `make build-main-app-preprod` | Manual build for Preproduction | `infra/scripts/docker-build-app.sh preprod` |
| `make build-main-app-version` | Manual build for Release | `infra/scripts/docker-build-app.sh version` |
| `make build-leximpact` | Build LexImpact service | `infra/scripts/docker-build-leximpact.sh latest` |

### Build Script Strategy

The script `infra/scripts/docker-build-app.sh` handles:
1.  **Multi-Platform Build**: Uses `docker buildx` to target `linux/amd64` and `linux/arm64`.
2.  **Tagging**:
    - `preprod` -> Tags image as `:preprod`.
    - `version` -> Reads `package.json` version, tags as `:x.y.z` AND `:latest`.
3.  **Registry**: Pushes to `ghcr.io/betagouv/aides-simplifiees-app`.

### CI/CD Integration

These commands can be used in GitHub Actions workflows to automatically build and push images upon meaningful events (push to main, release creation).

## Resource Limits

Docker container resource limits are configurable via environment variables. This allows tuning CPU and memory allocation per environment without modifying Docker Compose files.

### Configuration

Resource limits are defined in environment files (`.env.prod`, `.env.preprod`) and consumed by Docker Compose via variable substitution with defaults.

| Variable | Description | Prod Default | Preprod Default |
|----------|-------------|--------------|-----------------|
| `APP_CPU_LIMIT` | Main app CPU limit | 2.0 | 0.5 |
| `APP_MEM_LIMIT` | Main app memory limit | 512M | 192M |
| `OPENFISCA_CPU_LIMIT` | OpenFisca CPU limit | 3.5 | 1.0 |
| `OPENFISCA_MEM_LIMIT` | OpenFisca memory limit | 3G | 1G |
| `LEXIMPACT_CPU_LIMIT` | LexImpact CPU limit | 1.0 | 0.25 |
| `LEXIMPACT_MEM_LIMIT` | LexImpact memory limit | 256M | 64M |
| `DB_CPU_LIMIT` | PostgreSQL CPU limit | 2.0 | 0.5 |
| `DB_MEM_LIMIT` | PostgreSQL memory limit | 1G | 256M |
| `BACKUP_CPU_LIMIT` | Backup service CPU limit | 0.25 | 0.1 |
| `BACKUP_MEM_LIMIT` | Backup service memory limit | 64M | 32M |

Each limit variable has a corresponding `*_RESERVATION` variable for minimum guaranteed resources.

### Server Sizing Guidelines

For a server with **4 CPU / 8 GB RAM**:

| Environment | Total CPU Limits | Total Memory Limits |
|-------------|------------------|---------------------|
| Production | ~8.75 (soft) | ~4.8 GB |
| Preprod | ~2.35 (soft) | ~1.5 GB |
| **Combined** | ~11.1 (soft) | ~6.3 GB |

> **Note**: CPU limits are "soft" - containers share available cores. Memory limits are hard caps.

### Tuning Recommendations

- **OpenFisca** is memory-intensive (~300MB per worker). With 4 workers in production, allocate at least 2GB.
- **PostgreSQL** benefits from memory for query caching. Allocate 512MB-1GB for production workloads.
- **Main App** is lightweight. 256-512MB is sufficient for most traffic.
- Reserve ~1GB for the host OS and system processes.

### Monitoring Resource Usage

```bash
# Live container stats
docker stats

# Check current limits
docker inspect --format='{{.Name}}: Memory={{.HostConfig.Memory}} CPUs={{.HostConfig.NanoCpus}}' $(docker ps -q)
```
