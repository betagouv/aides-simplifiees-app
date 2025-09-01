# Docker Setup for Aides Simplifiées

This document provides comprehensive instructions for running the Aides Simplifiées application using Docker.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start (Development)

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd aides-simplifiees-app
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for all services to be healthy:**
   ```bash
   docker-compose ps
   ```

4. **Access the application:**
   - Application: http://localhost:3333
   - Database: localhost:5432

5. **Run database migrations (first time only):**
   ```bash
   docker-compose exec app node ace migration:run
   ```

## Production Deployment

### 1. Environment Configuration

Create a `.env` file with your production values. Key variables include:

```bash
# Generate a secure app key
APP_KEY=your-32-character-secure-key

# Database configuration
DB_PASSWORD=your-secure-database-password
DB_DATABASE=aides_simplifiees

# Admin configuration
ADMIN_LOGIN=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-admin-password

# Public URL
PUBLIC_APP_URL=https://yourdomain.com

# External services
MATOMO_URL=your-matomo-url
MATOMO_TOKEN=your-matomo-token
OPENFISCA_URL=https://openfisca.aides.beta.numerique.gouv.fr/calculate
LEXIMPACT_URL=https://leximpact.aides.beta.numerique.gouv.fr
```

### 2. Deploy with Production Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Set up Nginx (Recommended)

The production setup includes an Nginx reverse proxy. Create the required configuration:

```bash
mkdir -p nginx
```

Create `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3333;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Docker Commands Reference

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Run migrations
docker-compose exec app node ace migration:run

# Run seeders
docker-compose exec app node ace db:seed

# Access application shell
docker-compose exec app sh

# Access database
docker-compose exec postgres psql -U postgres -d aides_simplifiees
```

### Production

```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Update application (zero-downtime)
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps app

# Database backup (manual)
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres aides_simplifiees > backup.sql
```

## Architecture Overview

### Multi-Stage Dockerfile

The application uses a multi-stage Docker build:

1. **Base Stage**: Sets up Node.js 22.11.0 and pnpm
2. **Dependencies Stage**: Installs all dependencies
3. **Build Stage**: Builds the application, includes:
   - Publicodes compilation
   - Icon building
   - Iframe integration
   - TypeScript compilation
   - AdonisJS build
4. **Production Dependencies**: Installs only production dependencies
5. **Production Stage**: Final lightweight image with built application

### Services

#### Development (`docker-compose.yml`)
- **app**: AdonisJS application (port 3333)
- **postgres**: PostgreSQL 16 database (port 5432)
- **redis**: Redis for session storage (port 6379, optional)

#### Production (`docker-compose.prod.yml`)
- **app**: Scaled AdonisJS application with resource limits
- **postgres**: PostgreSQL with backup automation
- **nginx**: Reverse proxy and load balancer
- **postgres-backup**: Automated daily database backups

## Database Management

### Migrations

```bash
# Development
docker-compose exec app node ace migration:run

# Production
docker-compose -f docker-compose.prod.yml exec app node ace migration:run

# Rollback
docker-compose exec app node ace migration:rollback
```

### Backups

Development (manual):
```bash
docker-compose exec postgres pg_dump -U postgres aides_simplifiees > backup.sql
```

Production (automated):
- Daily backups at midnight
- 7-day retention policy
- Backups stored in `./database/backups/`

## Monitoring and Logs

### Health Checks

All services include health checks:
- **App**: HTTP health endpoint
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

### Logging

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# All logs
docker-compose logs -f

# Production logs with timestamps
docker-compose -f docker-compose.prod.yml logs -f --timestamps
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using port 3333
   lsof -i :3333
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Database connection issues:**
   ```bash
   # Check if PostgreSQL is ready
   docker-compose exec postgres pg_isready -U postgres
   
   # Restart database service
   docker-compose restart postgres
   ```

3. **Build failures:**
   ```bash
   # Clean build with no cache
   docker-compose build --no-cache
   
   # Remove all containers and rebuild
   docker-compose down -v
   docker-compose up -d --build
   ```

4. **Permission issues:**
   ```bash
   # Fix file permissions (Linux/macOS)
   sudo chown -R $USER:$USER .
   ```

### Performance Optimization

1. **Build performance:**
   - Use `.dockerignore` to exclude unnecessary files
   - Multi-stage builds reduce final image size
   - Layer caching optimizes rebuilds

2. **Runtime performance:**
   - Configure resource limits in production
   - Use multiple app replicas for load distribution
   - Implement database connection pooling

3. **Storage optimization:**
   - Regular cleanup of unused images: `docker image prune`
   - Database backup rotation (7-day retention)
   - Log rotation for application logs

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use Docker secrets for sensitive data in production
   - Rotate database passwords regularly

2. **Network Security:**
   - Use custom networks for service isolation
   - Restrict exposed ports to necessary services only
   - Implement SSL/TLS termination at reverse proxy

3. **Container Security:**
   - Run applications as non-root user
   - Use official base images
   - Regularly update base images and dependencies

## Support

For issues related to:
- **Docker setup**: Check this documentation and Docker logs
- **Application errors**: Check application logs and AdonisJS documentation
- **Database issues**: Check PostgreSQL logs and connection settings

## Contributing

When making changes to Docker configuration:

1. Test changes in development environment
2. Update this documentation
3. Test production deployment in staging
4. Update CI/CD workflows if necessary
