#!/bin/bash
# Deploy script for Mac Mini - pull latest image & restart
# LaunchAgent runs every 60 seconds (com.dangtaikhoang.deploy.plist)

set -e

# Configuration
REPO_DIR="/Users/$(whoami)/dangtaikhoang"  # Change to your path
IMAGE_NAME="ghcr.io/minhdang03/dangtaikhoang"
CONTAINER_NAME="dangtaikhoang-app"
LOG_FILE="/var/log/dangtaikhoang-deploy.log"

# Create log file if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
touch "$LOG_FILE"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Deploy check started ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  log "ERROR: Docker daemon is not running"
  exit 1
fi

cd "$REPO_DIR"

# Pull latest code
log "Pulling latest code from git..."
git fetch origin 2>&1 >> "$LOG_FILE"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null)

if [ "$LOCAL" != "$REMOTE" ]; then
  log "New code detected. Deploying..."

  # Pull latest image
  log "Pulling latest Docker image..."
  docker pull "$IMAGE_NAME:latest" 2>&1 >> "$LOG_FILE"

  # Stop old container
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "Stopping old container..."
    docker stop "$CONTAINER_NAME" 2>&1 >> "$LOG_FILE"
    docker rm "$CONTAINER_NAME" 2>&1 >> "$LOG_FILE"
  fi

  # Start new container
  log "Starting new container..."
  cd "$REPO_DIR"
  docker compose -f docker-compose.prod.yml up -d 2>&1 >> "$LOG_FILE"

  log "Deploy completed successfully"
  echo "✅ Deployed successfully at $(date)" >> "$LOG_FILE"
else
  log "No new code. Skipping deploy."
fi

log "=== Deploy check finished ==="
