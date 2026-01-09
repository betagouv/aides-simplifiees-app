#!/bin/bash

# Health check script for Aides Simplifiées infrastructure
# This script checks the health of all services

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"

# Change to infra directory for docker compose commands
cd "$INFRA_DIR"

echo "Aides Simplifiées Infrastructure Health Check"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect environment (dev/preprod/prod)
ENV="${ENV:-dev}"
if [ "$ENV" = "prod" ] || [ "$ENV" = "production" ]; then
    ENV_FILE="$PROJECT_ROOT/.env.prod"
    COMPOSE_FILE="docker-compose.prod.yml"
elif [ "$ENV" = "preprod" ] || [ "$ENV" = "staging" ]; then
    ENV_FILE="$PROJECT_ROOT/.env.preprod"
    COMPOSE_FILE="docker-compose.preprod.yml"
else
    ENV_FILE="$PROJECT_ROOT/.env"
    COMPOSE_FILE="docker-compose.dev.yml"
fi

echo "Environment: $ENV"
echo "Compose file: $COMPOSE_FILE"

# Load environment variables from .env file if it exists
if [ -f "$ENV_FILE" ]; then
    # Use set -a to export variables, but handle the file more carefully
    # to avoid bash syntax errors from unquoted values with special chars
    set -a
    # Use grep to filter out comments and empty lines, then eval each line
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            # Export the variable
            eval "export $line" 2>/dev/null || true
        fi
    done < "$ENV_FILE"
    set +a
    echo "Environment variables loaded from $ENV_FILE"
else
    echo -e "${YELLOW}Warning: $ENV_FILE not found${NC}"
fi

# Load monitoring secret from environment
MONITORING_SECRET="${MONITORING_SECRET:-}"
if [ -n "$MONITORING_SECRET" ]; then
    echo "Monitoring secret loaded for authenticated health checks"
else
    echo -e "${YELLOW}Warning: MONITORING_SECRET not set, health checks may fail${NC}"
fi

# Docker compose command with proper file
COMPOSE_CMD="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

# Check if Docker is available
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null; then
    if docker info &> /dev/null 2>&1; then
        DOCKER_AVAILABLE=true
        echo "Docker is available"
    else
        echo -e "${YELLOW}Docker command found but daemon not accessible${NC}"
    fi
else
    echo -e "${YELLOW}Docker not available, skipping container checks${NC}"
fi

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local expected_status=${3:-200}
    local use_monitoring_secret=${4:-false}

    echo -n "Checking $service... "

    local curl_cmd="curl -s -o /dev/null -w \"%{http_code}\""
    if [ "$use_monitoring_secret" = "true" ] && [ -n "$MONITORING_SECRET" ]; then
        curl_cmd="curl -s -o /dev/null -w \"%{http_code}\" -H \"x-monitoring-secret: $MONITORING_SECRET\""
    fi

    local status_code=$(eval "$curl_cmd \"$url\"" 2>/dev/null)
    if echo "$status_code" | grep -E "^(200|404|500)$" > /dev/null; then
        if [ "$status_code" = "500" ]; then
            echo -e "${YELLOW}REACHABLE (500 - app issue)${NC}"
        else
            echo -e "${GREEN}OK${NC}"
        fi
        return 0
    else
        echo -e "${RED}FAILED (status: $status_code)${NC}"
        return 1
    fi
}

# Function to check Docker service status
check_docker_service() {
    local service=$1

    if [ "$DOCKER_AVAILABLE" = false ]; then
        return 0  # Skip check if Docker not available
    fi

    echo -n "Checking Docker service $service... "

    # Use the proper compose command with the correct file
    if $COMPOSE_CMD ps --services 2>/dev/null | grep -q "^$service$"; then
        local status=$($COMPOSE_CMD ps --format json "$service" 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        if [ "$status" = "running" ]; then
            echo -e "${GREEN}RUNNING${NC}"
            return 0
        else
            echo -e "${YELLOW}NOT RUNNING (state: $status)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}NOT FOUND${NC}"
        return 1
    fi
}

echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "Docker Services Status:"
    echo "-------------------------"

    # Check Docker services
    DOCKER_SERVICES=("main-app" "openfisca" "leximpact" "db")
    docker_status=0

    for service in "${DOCKER_SERVICES[@]}"; do
        if ! check_docker_service "$service"; then
            docker_status=1
        fi
    done
else
    echo "Skipping Docker service checks (Docker not available)"
    docker_status=0  # Don't fail if Docker not available in preprod
fi

echo ""
echo "HTTP Health Checks:"
echo "----------------------"

# Check HTTP endpoints
http_status=0

# Use consistent port 8080 for all environments
MAIN_PORT="8080"
echo "Using consistent port 8080 for all environments"
echo ""

# Check main application
if ! check_service "Main Application (HTTP)" "http://localhost:$MAIN_PORT"; then
    http_status=1
fi

# Check health endpoint specifically
if ! check_service "Health Endpoint" "http://localhost:$MAIN_PORT/health" 200 true; then
    http_status=1
fi

# Check OpenFisca API (if port is exposed in dev mode)
if [ "$DOCKER_AVAILABLE" = true ]; then
    if $COMPOSE_CMD ps 2>/dev/null | grep "openfisca" | grep -q "5001"; then
        if ! check_service "OpenFisca API" "http://localhost:5001/spec"; then
            http_status=1
        fi
    fi
fi

# Check LexImpact API (if port is exposed in dev mode)
if [ "$DOCKER_AVAILABLE" = true ]; then
    if $COMPOSE_CMD ps 2>/dev/null | grep "leximpact" | grep -q "3000"; then
        if ! check_service "LexImpact API" "http://localhost:3000/"; then
            http_status=1
        fi
    fi
fi

echo ""
echo "Database Status:"
echo "------------------"

# Check database connectivity
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -n "Checking database connection... "
    if $COMPOSE_CMD exec -T db pg_isready -U aides-simplifiees > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        db_status=0
    else
        echo -e "${RED}FAILED${NC}"
        db_status=1
    fi
else
    echo "Skipping database check (Docker not available)"
    db_status=0  # Don't fail if Docker not available
fi

echo ""
echo "Summary:"
echo "----------"

overall_status=0

if [ "$DOCKER_AVAILABLE" = true ]; then
    if [ $docker_status -eq 0 ]; then
        echo -e "Docker Services: ${GREEN}ALL RUNNING${NC}"
    else
        echo -e "Docker Services: ${RED}SOME ISSUES${NC}"
        overall_status=1
    fi
else
    echo -e "Docker Services: ${YELLOW}SKIPPED (not available)${NC}"
fi

if [ $http_status -eq 0 ]; then
    echo -e "HTTP Endpoints: ${GREEN}ALL OK${NC}"
else
    echo -e "HTTP Endpoints: ${RED}SOME ISSUES${NC}"
    overall_status=1
fi

if [ $db_status -eq 0 ]; then
    echo -e "Database: ${GREEN}OK${NC}"
else
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo -e "Database: ${RED}ISSUES${NC}"
        overall_status=1
    else
        echo -e "Database: ${YELLOW}SKIPPED${NC}"
    fi
fi

echo ""
if [ $overall_status -eq 0 ]; then
    echo -e "${GREEN}All systems operational!${NC}"
else
    echo -e "${RED}Some issues detected. Check logs with 'make logs'${NC}"
fi

echo ""
echo "Useful commands:"
echo "  make logs          - View all logs"
echo "  make status        - Check service status"
echo "  make main-app-logs - Main application logs"
echo "  make openfisca-logs- OpenFisca logs"
echo "  make leximpact-logs- LexImpact logs"
echo "  make restart       - Restart services"

exit $overall_status
