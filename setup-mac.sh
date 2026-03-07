#!/bin/bash
# Setup Mac lần đầu - chạy 1 lần duy nhất
# Usage: bash setup-mac.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
USERNAME="$(whoami)"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="/var/log"

echo "======================================"
echo "  Setup dangtaikhoang trên Mac"
echo "======================================"
echo "Repo: $REPO_DIR"
echo "User: $USERNAME"
echo ""

# 1. Quyền thực thi cho scripts
echo "→ Cấp quyền thực thi..."
chmod +x "$REPO_DIR/deploy.sh"
chmod +x "$REPO_DIR/backup.sh"

# 2. Tạo thư mục log
echo "→ Tạo thư mục log..."
sudo mkdir -p "$LOG_DIR"
sudo touch "$LOG_DIR/dangtaikhoang-deploy.log"
sudo chmod 666 "$LOG_DIR/dangtaikhoang-deploy.log"

# 3. Thay USERNAME trong plist files
echo "→ Cấu hình LaunchAgent với username: $USERNAME..."
sed "s|/Users/USERNAME/|$HOME/|g" \
  "$REPO_DIR/com.dangtaikhoang.deploy.plist" \
  > "$LAUNCH_AGENTS_DIR/com.dangtaikhoang.deploy.plist"

sed "s|/Users/USERNAME/|$HOME/|g" \
  "$REPO_DIR/com.dangtaikhoang.backup.plist" \
  > "$LAUNCH_AGENTS_DIR/com.dangtaikhoang.backup.plist"

# 4. Load LaunchAgents
echo "→ Load LaunchAgents..."
launchctl unload "$LAUNCH_AGENTS_DIR/com.dangtaikhoang.deploy.plist" 2>/dev/null || true
launchctl load "$LAUNCH_AGENTS_DIR/com.dangtaikhoang.deploy.plist"

launchctl unload "$LAUNCH_AGENTS_DIR/com.dangtaikhoang.backup.plist" 2>/dev/null || true
launchctl load "$LAUNCH_AGENTS_DIR/com.dangtaikhoang.backup.plist"

# 5. Tạo thư mục data nếu chưa có
echo "→ Tạo thư mục data..."
mkdir -p "$REPO_DIR/data"
mkdir -p "$HOME/dangtaikhoang-backups"

# 6. Kiểm tra .env
if [ ! -f "$REPO_DIR/.env" ]; then
  echo ""
  echo "⚠️  Chưa có file .env!"
  echo "   Chạy lệnh sau để tạo:"
  echo ""
  echo "   cp $REPO_DIR/.env.example $REPO_DIR/.env"
  echo "   # Sau đó mở .env và điền NEXTAUTH_SECRET"
  echo "   # Tạo secret: openssl rand -base64 32"
  echo ""
else
  # Kiểm tra NEXTAUTH_SECRET có phải default không
  if grep -q "change-this-to-a-random-secret" "$REPO_DIR/.env"; then
    echo ""
    echo "⚠️  NEXTAUTH_SECRET vẫn là mặc định!"
    echo "   Chạy lệnh sau để tạo secret mới:"
    echo "   openssl rand -base64 32"
    echo "   Sau đó paste vào $REPO_DIR/.env"
    echo ""
  fi
fi

echo ""
echo "======================================"
echo "  ✅ Setup hoàn tất!"
echo "======================================"
echo ""
echo "LaunchAgents đã load:"
echo "  • deploy.sh  → chạy mỗi 60 giây"
echo "  • backup.sh  → chạy mỗi ngày lúc 2AM"
echo ""
echo "Bước tiếp theo:"
echo "  1. Đảm bảo .env đã có NEXTAUTH_SECRET"
echo "  2. Đảm bảo Cloudflare Tunnel đang chạy"
echo "  3. Merge PR → push lên main → app tự deploy"
echo ""
echo "Xem log deploy:"
echo "  tail -f /var/log/dangtaikhoang-deploy.log"
echo ""
