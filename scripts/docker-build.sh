#!/bin/bash
set -e

# Get version from package.json if 'version' is passed, otherwise use the provided tag
if [ "$1" = "version" ]; then
  TAG=$(node -p "require('./package.json').version")
  # When building with version, also tag as 'latest'
  TAGS="-t ghcr.io/betagouv/aides-simplifiees-app:$TAG -t ghcr.io/betagouv/aides-simplifiees-app:latest"
  echo "Building multi-platform Docker image..."
  echo "Targets: ghcr.io/betagouv/aides-simplifiees-app:$TAG, ghcr.io/betagouv/aides-simplifiees-app:latest"
else
  TAG="${1:-latest}"
  TAGS="-t ghcr.io/betagouv/aides-simplifiees-app:$TAG"
  echo "Building multi-platform Docker image..."
  echo "Target: ghcr.io/betagouv/aides-simplifiees-app:$TAG"
fi

echo "Platforms: linux/amd64, linux/arm64"
echo ""

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  $TAGS \
  --push \
  .

echo ""
echo "Build and push completed successfully!"
if [ "$1" = "version" ]; then
  echo "Images available at:"
  echo "  - ghcr.io/betagouv/aides-simplifiees-app:$TAG"
  echo "  - ghcr.io/betagouv/aides-simplifiees-app:latest"
else
  echo "Image available at: ghcr.io/betagouv/aides-simplifiees-app:$TAG"
fi
