#!/bin/bash
# Deploy script for Mac Mini - build locally & restart
# LaunchAgent runs every 60 seconds (com.dangtaikhoang.deploy.plist)

set -e

# Configuration
REPO_DIR="/Users/$(whoami)/Documents/NextJS/dangtaikhoang"
LOCAL_IMAGE="dangtaikhoang-app:latest"
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
log "Fetching latest code from git..."
git fetch origin 2>&1 >> "$LOG_FILE"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null)

if [ "$LOCAL" != "$REMOTE" ]; then
  log "New code detected ($LOCAL → $REMOTE). Deploying..."

  # Pull latest code
  git pull origin main 2>&1 >> "$LOG_FILE" || git pull origin master 2>&1 >> "$LOG_FILE"

  # Build Docker image locally (ARM native on Mac)
  log "Building Docker image locally..."
  docker build -t "$LOCAL_IMAGE" . 2>&1 >> "$LOG_FILE"

  # Restart containers
  log "Restarting containers..."
  docker compose -f docker-compose.prod.yml up -d 2>&1 >> "$LOG_FILE"

  log "✅ Deploy completed successfully"
else
  log "No new code. Skipping deploy."
fi

log "=== Deploy check finished ==="
