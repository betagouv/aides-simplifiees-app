#!/bin/bash
set -e

# Default to 'latest' if no tag is provided
TAG="${1:-latest}"

echo "Building multi-platform Docker image..."
echo "Target: ghcr.io/betagouv/aides-simplifiees-app:$TAG"
echo "Platforms: linux/amd64, linux/arm64"
echo ""

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/betagouv/aides-simplifiees-app:$TAG \
  --push \
  .

echo ""
echo "Build and push completed successfully!"
echo "Image available at: ghcr.io/betagouv/aides-simplifiees-app:$TAG"
