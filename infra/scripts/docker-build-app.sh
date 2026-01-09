#!/bin/bash
set -e

# =============================================================================
# Main App Docker Build Script
# =============================================================================
# Builds the main Aides Simplifiées application Docker image
# Usage: scripts/docker-build-app.sh [TAG|version]
# =============================================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REGISTRY="${REGISTRY:-ghcr.io/betagouv}"
TAG_INPUT="${1:-latest}"

show_help() {
    echo "Main App Docker Build Script"
    echo ""
    echo "Usage:"
    echo "  $0 [TAG|version]           # Build main application image"
    echo ""
    echo "Examples:"
    echo "  $0 latest                  # Build with 'latest' tag"
    echo "  $0 version                 # Build with package.json version + 'latest'"
    echo "  $0 v1.2.3                  # Build with specific tag"
    echo ""
    echo "Environment variables:"
    echo "  REGISTRY=ghcr.io/betagouv  # Container registry (default)"
}

if [ "$TAG_INPUT" = "help" ] || [ "$TAG_INPUT" = "-h" ] || [ "$TAG_INPUT" = "--help" ]; then
    show_help
    exit 0
fi

if [ "$TAG_INPUT" = "version" ]; then
    VERSION_TAG=$(node -p "require('./package.json').version" 2>/dev/null)
    if [ -z "$VERSION_TAG" ]; then
        echo "❌ Could not read version from package.json"
        exit 1
    fi
    TAGS="-t $REGISTRY/aides-simplifiees-app:$VERSION_TAG -t $REGISTRY/aides-simplifiees-app:latest"
    echo -e "${BLUE}Building multi-platform main app Docker image...${NC}"
    echo -e "${YELLOW}Targets:${NC}"
    echo "  - $REGISTRY/aides-simplifiees-app:$VERSION_TAG"
    echo "  - $REGISTRY/aides-simplifiees-app:latest"
else
    TAG="$TAG_INPUT"
    TAGS="-t $REGISTRY/aides-simplifiees-app:$TAG"
    echo -e "${BLUE}Building multi-platform main app Docker image...${NC}"
    echo -e "${YELLOW}Target:${NC} $REGISTRY/aides-simplifiees-app:$TAG"
fi

echo -e "${YELLOW}Platforms:${NC} linux/amd64, linux/arm64"
echo ""

docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -f infra/dockerfiles/main-app.Dockerfile \
    $TAGS \
    --push \
    .

echo ""
echo -e "${GREEN}✅ Build and push completed successfully!${NC}"
if [ "$TAG_INPUT" = "version" ]; then
    echo "Images available at:"
    echo "  - $REGISTRY/aides-simplifiees-app:$VERSION_TAG"
    echo "  - $REGISTRY/aides-simplifiees-app:latest"
else
    echo "Image available at: $REGISTRY/aides-simplifiees-app:$TAG"
fi