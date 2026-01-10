#!/bin/bash
set -e

# =============================================================================
# LexImpact Docker Build Script
# =============================================================================
# Builds the LexImpact Territoires Docker image for Aides Simplifiées
# Usage: scripts/docker-build-leximpact.sh [TAG]
# =============================================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REGISTRY="${REGISTRY:-ghcr.io/betagouv}"
TAG="${1:-latest}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

show_help() {
    echo "LexImpact Docker Build Script"
    echo ""
    echo "Usage:"
    echo "  $0 [TAG]                   # Build LexImpact Territoires image"
    echo ""
    echo "Examples:"
    echo "  $0 latest                  # Build with 'latest' tag"
    echo "  $0 v1.2.3                  # Build with specific tag"
    echo ""
    echo "Environment variables:"
    echo "  REGISTRY=ghcr.io/betagouv  # Container registry (default)"
    echo ""
    echo "Prerequisites:"
    echo "  - Requires ../territoires repository (auto-cloned if missing)"
    echo "  - Dockerfile: infra/dockerfiles/leximpact.Dockerfile"
}

if [ "$TAG" = "help" ] || [ "$TAG" = "-h" ] || [ "$TAG" = "--help" ]; then
    show_help
    exit 0
fi

echo -e "${BLUE}Building multi-platform LexImpact Territoires Docker image...${NC}"
echo -e "${YELLOW}Target:${NC} $REGISTRY/leximpact-territoires:$TAG"
echo -e "${YELLOW}Platforms:${NC} linux/amd64, linux/arm64"
echo ""

# Check if territoires repository exists
if [ ! -d "$PROJECT_ROOT/../territoires" ]; then
    echo "📥 Cloning territoires repository..."
    git clone https://git.leximpact.dev/leximpact/territoires/territoires.git "$PROJECT_ROOT/../territoires"
    echo ""
fi

# Verify Dockerfile exists
if [ ! -f "$PROJECT_ROOT/infra/dockerfiles/leximpact.Dockerfile" ]; then
    echo "❌ Dockerfile not found: $PROJECT_ROOT/infra/dockerfiles/leximpact.Dockerfile"
    exit 1
fi

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -f "$PROJECT_ROOT/infra/dockerfiles/leximpact.Dockerfile" \
    -t "$REGISTRY/leximpact-territoires:$TAG" \
    --push \
    "$PROJECT_ROOT/../territoires"

echo ""
echo -e "${GREEN}✅ Build and push completed successfully!${NC}"
echo "Image available at: $REGISTRY/leximpact-territoires:$TAG"
