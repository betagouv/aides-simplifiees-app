SHELL := /bin/bash
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

# Default environment for Docker operations
ENV ?= dev

# Docker compose file selection
COMPOSE_FILE := infra/docker-compose.$(ENV).yml

# Environment file and Database name selection
ifeq ($(ENV), prod)
    ENV_FILE := .env.prod
    DB_NAME := aides-simplifiees-prod
else ifeq ($(ENV), preprod)
    ENV_FILE := .env.preprod
    DB_NAME := aides-simplifiees-preprod
else
    # Dev
    ENV_FILE := .env
    DB_NAME := aides-simplifiees
endif

# Docker compose command with flags
COMPOSE_CMD := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

.PHONY: help dev prod preprod build up down logs status health clean

# Aides Simplifiées - Unified Makefile

help: ## Show this help message
	@echo "Aides Simplifiées - Available Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Infrastructure Management

secrets: ## Generate secure values for secrets
	@DB_PASS=$$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25); \
	APP_KEY=$$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32); \
	ADMIN_PASS=$$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-20); \
	MONITOR_SECRET=$$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-40); \
	echo "DB_PASSWORD=$$DB_PASS"; \
	echo "APP_KEY=$$APP_KEY"; \
	echo "ADMIN_PASSWORD=$$ADMIN_PASS"; \
	echo "MONITORING_SECRET=$$MONITOR_SECRET"

# Environment Management

dev: ## Start development dependencies (DB, OpenFisca, LexImpact)
	@$(MAKE) up ENV=dev
	@echo "Dependencies started: PostgreSQL :5432, OpenFisca :5001, LexImpact :3000"
	@echo "First time: node ace migration:run --force && node ace db:seed"
	@echo "Then: pnpm dev"

prod: ## Start production environment
	@$(MAKE) pull ENV=prod
	@$(MAKE) up ENV=prod

preprod: ## Start preproduction environment
	@$(MAKE) pull ENV=preprod
	@$(MAKE) up ENV=preprod

# Docker Operations

build: ## Build all services
	@$(COMPOSE_CMD) build

up: ## Start all services
	@$(COMPOSE_CMD) up -d

down: ## Stop all services
	@$(COMPOSE_CMD) down

restart: down up ## Restart all services

logs: ## Show logs for all services
	@$(COMPOSE_CMD) logs -f --tail=100

status: ## Show service status
	@$(COMPOSE_CMD) ps

health: ## Check service health
	@ENV=$(ENV) ./infra/scripts/health-check.sh

clean: ## Stop and remove everything (including volumes!)
	@$(COMPOSE_CMD) down -v --remove-orphans
	@docker system prune -f

pull: ## Pull latest images
	@$(COMPOSE_CMD) pull

# Docker Image Building

build-main-app-preprod: ## Build and push main-app image for preprod
	@./infra/scripts/docker-build-app.sh preprod

build-main-app-version: ## Build and push main-app image with version tag + latest
	@./infra/scripts/docker-build-app.sh version

build-leximpact: ## Build and push LexImpact image
	@./infra/scripts/docker-build-leximpact.sh latest

# Service-specific Commands

main-app-logs: ## Show main-app logs only
	@$(COMPOSE_CMD) logs -f main-app

openfisca-logs: ## Show OpenFisca logs only
	@$(COMPOSE_CMD) logs -f openfisca

leximpact-logs: ## Show LexImpact logs only
	@$(COMPOSE_CMD) logs -f leximpact

db-logs: ## Show database logs only
	@$(COMPOSE_CMD) logs -f db

main-app-shell: ## Open shell in main-app container
	@$(COMPOSE_CMD) exec main-app sh

openfisca-shell: ## Open shell in OpenFisca container
	@$(COMPOSE_CMD) exec openfisca bash

leximpact-shell: ## Open shell in LexImpact container
	@$(COMPOSE_CMD) exec leximpact sh

db-shell: ## Open database shell
	@$(COMPOSE_CMD) exec db psql -U aides-simplifiees -d $(DB_NAME)

# Database Management

db-migrate: ## Run database migrations via Docker
	@$(COMPOSE_CMD) run --rm db-migrate

db-seed: ## Run database seeders via Docker
	@$(COMPOSE_CMD) run --rm db-seed

db-backup: ## Create database backup
	@mkdir -p infra/backups_$(ENV)
	@$(COMPOSE_CMD) exec db pg_dump -U aides-simplifiees $(DB_NAME) > infra/backups_$(ENV)/backup_$$(date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database from backup
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make db-restore BACKUP=... ENV=..."; exit 1; fi
	@echo "Restoring $(BACKUP)..."
	@$(COMPOSE_CMD) exec -T db psql -U aides-simplifiees -d $(DB_NAME) < $(BACKUP)
