# Account Sharing Manager

Ứng dụng web quản lý tài khoản chia sẻ (ChatGPT, Netflix, Google Drive...) cho gia đình và bạn bè.

## Tính năng

- Quản lý tài khoản chia sẻ & mật khẩu tập trung
- Theo dõi ai đang dùng slot nào
- Quản lý & thu phí hàng tháng tự động
- Tích hợp VietQR (miễn phí) tạo QR chuyển khoản
- Nhắc nhở tài khoản sắp hết hạn
- Giao diện mobile-first, dùng được trên iOS Safari
- Tự host trên Mac, tự động deploy khi push code

## Tech Stack

- **Next.js** + TypeScript + Tailwind CSS
- **JSON files** (không cần database)
- **NextAuth.js** (admin login)
- **Docker** + GitHub Actions CI/CD
- **Cloudflare Tunnel** (HTTPS public access)

---

## Setup trên Mac (lần đầu)

### 1. Clone repo

```bash
git clone https://github.com/minhdang03/dangtaikhoang
cd dangtaikhoang
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền:
```
NEXTAUTH_SECRET=<chạy: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Chạy setup script (1 lần duy nhất)

```bash
bash setup-mac.sh
```

Script này sẽ tự động:
- Cấp quyền execute cho các scripts
- Tạo thư mục log
- Cài LaunchAgent: deploy mỗi 60 giây
- Cài LaunchAgent: backup mỗi ngày lúc 2AM

### 4. Setup Cloudflare Tunnel

```bash
brew install cloudflare/warp/cloudflared
cloudflared tunnel login
cloudflared tunnel create dangtaikhoang-tunnel
cloudflared tunnel route dns dangtaikhoang-tunnel your-domain.com

# Chạy tunnel mỗi lần boot
cloudflared service install
```

### 5. Push code → app tự deploy

```bash
git push origin main
# GitHub Actions build (~3 phút) → Mac pull & restart (~1 phút)
```

---

## Workflow hàng ngày

```
iOS: Mô tả yêu cầu cho Claude
  → Claude push lên main
  → GitHub Actions build
  → Mac auto-deploy
  → Test trên Safari iOS
```

Chi tiết xem [CLAUDE.md](./CLAUDE.md).

---

## Sử dụng App

**Login**: Truy cập domain → mật khẩu mặc định `admin123` (đổi ngay sau login đầu)

**Cài đặt ban đầu**:
1. Settings → Đổi mật khẩu admin
2. Settings → Nhập thông tin ngân hàng (cho VietQR)

**Luồng chính**:
1. Thêm tài khoản chia sẻ (Netflix, ChatGPT...) với số slots & giá/tháng
2. Thêm người dùng (tên, SĐT)
3. Gán người dùng vào slot của tài khoản
4. Mỗi tháng: Tạo phiếu thu → chia sẻ link QR cho người dùng → Confirm khi đã trả

---

## Data & Backup

Dữ liệu lưu trong `./data/*.json` (gitignored, Docker volume).

Backup tự động: mỗi ngày 2AM → `~/dangtaikhoang-backups/data-YYYY-MM-DD/`, giữ 30 ngày.

Xem log:
```bash
tail -f /var/log/dangtaikhoang-deploy.log
```

---

## Checklist Go Live

- [ ] Đổi `admin123` → mật khẩu mạnh trong Settings
- [ ] `NEXTAUTH_SECRET` đã set (không phải placeholder)
- [ ] Cấu hình ngân hàng trong Settings
- [ ] `bash setup-mac.sh` đã chạy thành công
- [ ] Cloudflare Tunnel đang chạy
- [ ] Test từ iOS Safari: login, thêm data, xem QR
