# 📋 Account Sharing Manager

Ứng dụng web quản lý tài khoản chia sẻ (ChatGPT, Netflix, Google Drive...) cho gia đình và bạn bè.

## ✨ Tính năng

- 🔐 Quản lý tài khoản chia sẻ & mật khẩu
- 👥 Theo dõi ai đang dùng slot nào
- 💰 Quản lý thanh toán hàng tháng
- 📱 Giao diện mobile-first với bottom navigation
- 🏦 Tích hợp VietQR (miễn phí) cho thanh toán ngân hàng
- 🔔 Nhắc nhở tài khoản sắp hết hạn
- 🖥️ Tự host trên Mac Mini (không cần server)
- 🚀 Tự động deploy khi push code (GitHub Actions + Docker)

## 🛠 Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: JSON files (không cần PostgreSQL)
- **Auth**: NextAuth.js (credentials)
- **Deployment**: Docker + Cloudflare Tunnel
- **CI/CD**: GitHub Actions

## 🚀 Chạy Local

### Development

```bash
git clone https://github.com/minhdang03/dangtaikhoang
cd dangtaikhoang
npm install
npm run dev
```

Mở http://localhost:3000 → Đăng nhập: `admin123`

### Production (Docker)

```bash
cp .env.example .env
# Điền NEXTAUTH_SECRET
docker compose up -d
```

## 🌍 Deploy trên Mac Mini + Cloudflare Tunnel

### 1. Cấu hình GitHub Actions

GitHub Actions sẽ tự động build & push Docker image lên GitHub Container Registry khi bạn push code.

```bash
# GitHub sẽ dùng token mặc định - không cần cấu hình thêm
```

### 2. Setup Deploy Script trên Mac Mini

#### Bước 1: Tạo thư mục project

```bash
# Thay USERNAME thành user của bạn
mkdir -p /Users/USERNAME/dangtaikhoang
cd /Users/USERNAME/dangtaikhoang
git clone https://github.com/minhdang03/dangtaikhoang .
```

#### Bước 2: Cấu hình .env

```bash
cp .env.example .env
# Chỉnh sửa .env
# NEXTAUTH_SECRET=<generate random: openssl rand -base64 32>
# NEXTAUTH_URL=https://dangtaikhoang.example.com  (nếu có custom domain)
```

#### Bước 3: Setup auto-deploy (chạy mỗi 5 phút)

```bash
# Chỉnh sửa path trong deploy.sh
sed -i '' 's|/Users/$(whoami)/dangtaikhoang|/Users/USERNAME/dangtaikhoang|g' deploy.sh

# Cấp quyền execute
chmod +x deploy.sh

# Chỉnh sửa launchd plist
sed -i '' 's|USERNAME|'${USER}'|g' com.dangtaikhoang.deploy.plist

# Copy plist vào launchd
cp com.dangtaikhoang.deploy.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.dangtaikhoang.deploy.plist

# Kiểm tra trạng thái
launchctl list | grep dangtaikhoang
```

#### Bước 4: Setup Cloudflare Tunnel

```bash
# Cài đặt cloudflared
brew install cloudflare/warp/cloudflared

# Đăng nhập (sẽ mở browser để authenticate)
cloudflared tunnel login

# Tạo tunnel (thay dangtaikhoang-tunnel theo tên bạn muốn)
cloudflared tunnel create dangtaikhoang-tunnel

# Tạo config file: ~/.cloudflared/config.yml
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: dangtaikhoang-tunnel
credentials-file: /Users/USERNAME/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: dangtaikhoang.example.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Chạy tunnel
cloudflared tunnel run dangtaikhoang-tunnel
```

#### Bước 5: Cấu hình DNS (trên Cloudflare)

1. Vào Cloudflare Dashboard
2. Chọn domain của bạn
3. DNS > Records > Add Record:
   - Type: CNAME
   - Name: `dangtaikhoang`
   - Target: `dangtaikhoang-tunnel.cfargotunnel.com`

Hoặc chạy command:
```bash
cloudflared tunnel route dns dangtaikhoang-tunnel dangtaikhoang.example.com
```

#### Bước 6: Setup launchd để chạy tunnel on boot

```bash
# Tạo plist
cat > ~/Library/LaunchAgents/com.cloudflare.tunnel.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>dangtaikhoang-tunnel</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/cloudflared.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/cloudflared.log</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
```

## 🔄 Workflow tự động

1. **Local development**: `npm run dev`
2. **Commit & Push**: `git push origin main`
3. **GitHub Actions**: Tự build Docker image → push lên `ghcr.io`
4. **Mac Mini (mỗi 5 phút)**: `deploy.sh` check git → pull image mới → restart container
5. **Cloudflare Tunnel**: Expose port 3000 ra internet với domain

## 📖 Cách sử dụng App

### Login
- URL: https://dangtaikhoang.example.com
- Username: `admin`
- Password: (từ .env `NEXTAUTH_SECRET`, mặc định `admin123`)

### Thay đổi mật khẩu
1. Vào **Cài đặt** → **Đổi mật khẩu admin**
2. Nhập mật khẩu mới

### Cấu hình VietQR
1. **Cài đặt** → **Tài khoản ngân hàng**
2. Chọn ngân hàng, nhập số tài khoản + tên chủ TK
3. QR tự động tạo cho mỗi phiếu thu

### Quản lý tài khoản
1. **Tài khoản** → **+ Thêm**
2. Chọn dịch vụ, nhập tên gợi nhớ, email, password
3. Đặt số slots & giá/slot/tháng
4. Click vào tài khoản → **+ Gán người dùng** để assign slots

### Tạo phiếu thu
1. **Thanh toán** → **📋 Tạo phiếu thu** (bulk tất cả)
2. Hoặc tạo từng phiếu cho người dùng cụ thể
3. Click phiếu → xem QR → người dùng chuyển khoản
4. Admin confirm → trạng thái chuyển "Đã TT"

## 📊 Data Storage

Tất cả dữ liệu lưu trong thư mục `/data`:
```
data/
├── services.json       # Danh sách dịch vụ
├── accounts.json       # Tài khoản chia sẻ
├── users.json          # Người dùng
├── subscriptions.json  # Slot assignments
├── payments.json       # Lịch sử thanh toán
└── settings.json       # Cài đặt (bank, password)
```

**⚠️ Không commit vào Git!** (đã trong .gitignore)

## 🛡️ Backup

Backup thư mục `data` định kỳ:
```bash
tar -czf dangtaikhoang-backup-$(date +%Y%m%d).tar.gz /Users/USERNAME/dangtaikhoang/data
```

## 🐛 Troubleshooting

### Docker image không pull được
```bash
docker login ghcr.io
# Dùng Personal Access Token (PAT) làm password
```

### Deploy script không chạy
```bash
# Kiểm tra launchd job
launchctl list | grep dangtaikhoang

# Xem logs
tail -f /var/log/dangtaikhoang-deploy.log
```

### Cloudflare Tunnel bị ngắt
```bash
# Restart
launchctl unload ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
launchctl load ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
```

## 📝 License

MIT - Tự do sử dụng, sửa đổi
