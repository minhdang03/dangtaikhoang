#!/bin/bash
# Backup data folder hàng ngày
# Setup: launchctl load ~/Library/LaunchAgents/com.dangtaikhoang.backup.plist

REPO_DIR="/Users/$(whoami)/dangtaikhoang"
BACKUP_DIR="/Users/$(whoami)/dangtaikhoang-backups"
DATE=$(date '+%Y-%m-%d')
LOG_FILE="/var/log/dangtaikhoang-deploy.log"

mkdir -p "$BACKUP_DIR"

# Copy data folder, giữ 30 bản gần nhất
cp -r "$REPO_DIR/data" "$BACKUP_DIR/data-$DATE"

# Xóa backup cũ hơn 30 ngày
find "$BACKUP_DIR" -maxdepth 1 -name "data-*" -mtime +30 -exec rm -rf {} +

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed: data-$DATE" >> "$LOG_FILE"
