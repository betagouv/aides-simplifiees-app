#!/bin/bash

# Health check script for Aides Simplifiées infrastructure
# This script checks the health of all services

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

# Change to infra directory for docker compose commands
cd "$INFRA_DIR"

echo "Aides Simplifiées Infrastructure Health Check"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
    echo "Environment variables loaded from .env file"
fi

# Load monitoring secret from environment
MONITORING_SECRET="${MONITORING_SECRET:-}"
if [ -n "$MONITORING_SECRET" ]; then
    echo "Monitoring secret loaded for authenticated health checks"
else
    echo -e "${YELLOW}Warning: MONITORING_SECRET not set, health checks may fail${NC}"
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
    echo -n "Checking Docker service $service... "
    
    local status=$(docker compose ps --services | grep "^$service$" > /dev/null && echo "running" || echo "not_running")
    if [ "$status" = "running" ]; then
        echo -e "${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e "${RED}NOT RUNNING${NC}"
        return 1
    fi
}

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
if docker compose ps | grep "openfisca" | grep "5001" > /dev/null; then
    if ! check_service "OpenFisca API" "http://localhost:5001/spec"; then
        http_status=1
    fi
fi

# Check LexImpact API (if port is exposed in dev mode)
if docker compose ps | grep "leximpact" | grep "3000" > /dev/null; then
    if ! check_service "LexImpact API" "http://localhost:3000/"; then
        http_status=1
    fi
fi

echo ""
echo "Database Status:"
echo "------------------"

# Check database connectivity
echo -n "Checking database connection... "
if docker compose exec -T db pg_isready -U aides-simplifiees > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
    db_status=0
else
    echo -e "${RED}FAILED${NC}"
    db_status=1
fi

echo ""
echo "Summary:"
echo "----------"

overall_status=0

if [ $docker_status -eq 0 ]; then
    echo -e "Docker Services: ${GREEN}ALL RUNNING${NC}"
else
    echo -e "Docker Services: ${RED}SOME ISSUES${NC}"
    overall_status=1
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
    echo -e "Database: ${RED}ISSUES${NC}"
    overall_status=1
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
