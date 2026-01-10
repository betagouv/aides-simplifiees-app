#!/bin/bash

# Health check script for Aides Simplifiées infrastructure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"
cd "$INFRA_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

echo "Health Check [$ENV]"

# Load env file
if [ -f "$ENV_FILE" ]; then
    set -a
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            eval "export $line" 2>/dev/null || true
        fi
    done < "$ENV_FILE"
    set +a
fi

MONITORING_SECRET="${MONITORING_SECRET:-}"
COMPOSE_CMD="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

DOCKER_AVAILABLE=false
if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
    DOCKER_AVAILABLE=true
fi

check_service() {
    local service=$1
    local url=$2
    local use_secret=${3:-false}

    local curl_cmd="curl -s -o /dev/null -w \"%{http_code}\""
    if [ "$use_secret" = "true" ] && [ -n "$MONITORING_SECRET" ]; then
        curl_cmd="curl -s -o /dev/null -w \"%{http_code}\" -H \"x-monitoring-secret: $MONITORING_SECRET\""
    fi

    local status=$(eval "$curl_cmd \"$url\"" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo -e "$service: ${GREEN}OK${NC}"
        return 0
    elif [ "$status" = "503" ]; then
        echo -e "$service: ${YELLOW}unhealthy${NC}"
        return 1
    else
        echo -e "$service: ${RED}FAILED${NC} ($status)"
        return 1
    fi
}

check_docker_service() {
    local service=$1
    [ "$DOCKER_AVAILABLE" = false ] && return 0

    if $COMPOSE_CMD ps --services 2>/dev/null | grep -q "^$service$"; then
        local state=$($COMPOSE_CMD ps --format json "$service" 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        if [ "$state" = "running" ]; then
            echo -e "$service: ${GREEN}running${NC}"
            return 0
        else
            echo -e "$service: ${YELLOW}$state${NC}"
            return 1
        fi
    else
        echo -e "$service: ${YELLOW}not found${NC}"
        return 1
    fi
}

overall=0

echo ""
echo "Docker Services:"
if [ "$DOCKER_AVAILABLE" = true ]; then
    # In dev, main-app runs locally, not in docker
    if [ "$ENV" = "dev" ]; then
        DOCKER_SERVICES=("openfisca" "leximpact" "db")
    else
        DOCKER_SERVICES=("main-app" "openfisca" "leximpact" "db")
    fi
    for svc in "${DOCKER_SERVICES[@]}"; do
        check_docker_service "$svc" || overall=1
    done
else
    echo -e "${YELLOW}Docker not available${NC}"
fi

echo ""
echo "HTTP Endpoints:"
case "$ENV" in
    dev) MAIN_PORT="3333" ;;  # Local dev server
    preprod) MAIN_PORT="8081" ;;
    *) MAIN_PORT="8080" ;;
esac

check_service "main-app" "http://localhost:$MAIN_PORT" || overall=1
check_service "health" "http://localhost:$MAIN_PORT/health" true || overall=1

# Check exposed services in dev
if [ "$ENV" = "dev" ]; then
    check_service "openfisca" "http://localhost:5001/spec" || overall=1
    check_service "leximpact" "http://localhost:3000/" || overall=1
fi

echo ""
echo "Database:"
if [ "$DOCKER_AVAILABLE" = true ]; then
    if $COMPOSE_CMD exec -T db pg_isready -U aides-simplifiees > /dev/null 2>&1; then
        echo -e "postgres: ${GREEN}OK${NC}"
    else
        echo -e "postgres: ${RED}FAILED${NC}"
        overall=1
    fi
fi

echo ""
if [ $overall -eq 0 ]; then
    echo -e "${GREEN}All systems operational${NC}"
else
    echo -e "${RED}Some issues detected${NC}"
fi

exit $overall
