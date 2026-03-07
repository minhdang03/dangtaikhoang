# CLAUDE.md — Hướng dẫn cho Claude

> File này giúp Claude hiểu ngay context, workflow và conventions của project.
> Copy file này sang project mới để Claude tự biết cách làm việc.

---

## Thông tin Developer

- **Solo developer**: Minh Đăng (@minhdang03)
- **Thiết bị chính**: Mac Apple Silicon (Docker server + Cloudflare Tunnel)
- **Thiết bị phụ**: iOS (Safari để test, Claude để code)
- **Ngôn ngữ app**: Tiếng Việt

---

## Workflow Chuẩn

### Từ iOS (hàng ngày)
1. Mô tả yêu cầu cho Claude
2. Claude chỉnh sửa code, commit, push lên `main`
3. GitHub Actions tự build Docker image (~3 phút)
4. Mac tự deploy qua `deploy.sh` (~1 phút sau build)
5. Test trên Safari iOS qua Cloudflare URL

### Từ Mac (buổi tối / khi rảnh)
1. `git pull origin main`
2. Chỉnh sửa phức tạp hơn
3. `git push origin main` → auto deploy

### Khi thêm tính năng mới
- Nếu nhỏ: push thẳng lên `main`
- Nếu lớn / chưa chắc: push lên `dev` → test → merge vào `main`

---

## Tech Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Framework | Next.js (App Router) + TypeScript | Full-stack, 1 repo |
| UI | Tailwind CSS | Mobile-first, không dùng thư viện UI nặng |
| Storage | JSON files (`/data/*.json`) | Đủ cho ~100 users, không cần DB |
| Auth | NextAuth.js v5 (credentials) | 1 admin account duy nhất |
| Deploy | Docker + docker-compose.prod.yml | Mac chạy container |
| CI/CD | GitHub Actions → GHCR | Push → build → image (x86_64) |
| Public | Cloudflare Tunnel (Docker) | HTTPS tự động, mỗi project có cloudflared riêng |
| Backup | `backup.sh` + LaunchAgent | Mỗi ngày 2AM, giữ 30 ngày |

---

## Cấu trúc Project

```
project/
├── app/
│   ├── (auth)/           # Login pages
│   ├── (dashboard)/      # Các module chính
│   │   ├── layout.tsx    # Nav chung
│   │   ├── page.tsx      # Dashboard
│   │   └── [module]/     # Thêm module mới ở đây
│   └── api/
│       └── [module]/     # API routes theo module
├── components/
│   └── ui/               # Reusable UI components
├── lib/
│   ├── db.ts             # Data access layer
│   ├── auth.ts           # NextAuth config
│   └── types.ts          # TypeScript types
├── data/                 # JSON files (gitignored, Docker volume)
├── .env                  # Secrets (gitignored): NEXTAUTH_SECRET, TUNNEL_TOKEN
├── Dockerfile
├── docker-compose.yml        # Dev
├── docker-compose.prod.yml   # Production: app + cloudflared
├── deploy.sh                 # Mac auto-deploy script
├── backup.sh                 # Data backup script
├── com.{project}.deploy.plist   # LaunchAgent: deploy mỗi 60s
└── com.{project}.backup.plist   # LaunchAgent: backup mỗi ngày 2AM
```

---

## Conventions

### Code
- **Ngôn ngữ UI**: Tiếng Việt (labels, messages, alerts)
- **Mobile-first**: Mọi UI phải dùng được trên iOS Safari trước
- **No over-engineering**: Không thêm abstraction chưa cần thiết
- **API routes**: Luôn check auth session trước khi xử lý
- **Server Components**: KHÔNG fetch API routes nội bộ, gọi DB trực tiếp (middleware chặn request không có session)

### Git
- **Commit message**: Dùng tiếng Anh hoặc Việt, prefix `feat:` / `fix:` / `chore:`
- **Branch `main`**: Production, mọi push đều auto-deploy
- **Branch `dev`**: Staging, dùng khi test feature lớn

### Thêm module mới
1. Tạo `app/(dashboard)/[tên-module]/page.tsx`
2. Tạo `app/api/[tên-module]/route.ts`
3. Thêm types vào `lib/types.ts`
4. Thêm data functions vào `lib/db.ts`
5. Thêm link vào navigation

---

## Docker & Deploy — QUAN TRỌNG

### Port
- **Mỗi project dùng 1 port riêng, thống nhất xuyên suốt** (Dockerfile, docker-compose, tunnel)
- Port trong Dockerfile (`EXPOSE`, `ENV PORT`) = port trong docker-compose (`ports: "XXXX:XXXX"`) = port trong Cloudflare tunnel
- Ví dụ project này: port **8083** ở mọi nơi
- **KHÔNG dùng port mapping khác nhau** (ví dụ `8083:3000`) — gây nhầm lẫn

### Dockerfile template
```dockerfile
EXPOSE {PORT}
ENV PORT={PORT}
ENV HOSTNAME="0.0.0.0"
```

### docker-compose.prod.yml template
```yaml
services:
  app:
    image: ghcr.io/{user}/{repo}:latest
    container_name: {project}-app
    ports:
      - "{PORT}:{PORT}"
    environment:
      NEXTAUTH_URL: ${NEXTAUTH_URL:-https://{domain}}
      NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}"
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-https://{domain}}
      NODE_ENV: production
      AUTH_TRUST_HOST: "true"    # BẮT BUỘC cho NextAuth v5 qua Cloudflare
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:{PORT}"]
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: {project}-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: "${TUNNEL_TOKEN}"
```

### GitHub Actions build x86_64 only
- Mac Apple Silicon (ARM) không dùng được GHCR image trực tiếp
- **Build local trên Mac**: `docker build -t ghcr.io/{user}/{repo}:latest .`
- Hoặc cấu hình GitHub Actions build multi-platform (`linux/amd64,linux/arm64`)

### Cloudflare Tunnel
- **Mỗi project có cloudflared riêng** trong docker-compose.prod.yml (cùng network)
- Tunnel service URL: `http://{project}-app:{PORT}` (container hostname, cùng Docker network)
- **KHÔNG dùng chung cloudflared giữa các project** — khác network, không resolve được hostname
- **KHÔNG chạy cloudflared native trên Mac** nếu đã có Docker cloudflared (gây conflict 2 connector)
- Tạo tunnel mới trong Cloudflare Zero Trust → copy TUNNEL_TOKEN vào `.env`

### .env file (gitignored)
```
NEXTAUTH_SECRET=xxx          # openssl rand -base64 32
TUNNEL_TOKEN=eyJ...          # Từ Cloudflare Zero Trust dashboard
```

---

## Lỗi Thường Gặp & Cách Fix

### 1. NextAuth `UntrustedHost` error
- **Nguyên nhân**: NextAuth v5 không trust domain khi chạy qua reverse proxy/tunnel
- **Fix**: Thêm `AUTH_TRUST_HOST: "true"` vào environment trong docker-compose
- Cũng nên thêm `trustHost: true` trong `lib/auth.ts` cho chắc

### 2. Server Component fetch API route → SyntaxError
- **Nguyên nhân**: Server Component gọi `fetch('/api/...')` → middleware chặn (không có session cookie) → trả HTML thay vì JSON
- **Fix**: Gọi DB trực tiếp trong Server Component, KHÔNG qua fetch API

### 3. Docker `no matching manifest for linux/arm64`
- **Nguyên nhân**: GitHub Actions build image cho x86_64, Mac là ARM
- **Fix**: Build local `docker build -t ghcr.io/{user}/{repo}:latest .`

### 4. Cloudflare Error 502 Bad Gateway
- **Nguyên nhân**: cloudflared không reach được app container (khác network hoặc sai hostname)
- **Fix**: Đảm bảo app và cloudflared cùng Docker network (cùng docker-compose file)

### 5. Cloudflare Error 1033
- **Nguyên nhân**: Không có cloudflared nào đang chạy cho tunnel đó
- **Fix**: Kiểm tra container cloudflared có đang chạy, TUNNEL_TOKEN đúng

### 6. Docker `exec format error` với Alpine
- **Nguyên nhân**: Lệnh `addgroup --system --gid` không đúng syntax BusyBox Alpine
- **Fix**: Bỏ user creation trong Dockerfile nếu không cần thiết

---

## Infrastructure trên Mac

```
Mac (server)
├── Docker containers (mỗi project):
│   ├── {project}-app (port riêng)
│   └── {project}-cloudflared (tunnel riêng)
├── LaunchAgent: deploy.sh chạy mỗi 60 giây
├── LaunchAgent: backup.sh chạy mỗi ngày 2AM
└── Cloudflare Tunnel → {domain} → http://{project}-app:{port}
```

### Port map các project
| Project | Port | Domain |
|---------|------|--------|
| Project 1 | 8081 | ... |
| Project 2 | 8082 | ... |
| dangtaikhoang | 8083 | dangtaikhoang.minhdanglu.com |

### Reload sau khi thay đổi plist
```bash
launchctl unload ~/Library/LaunchAgents/com.{project}.deploy.plist
launchctl load ~/Library/LaunchAgents/com.{project}.deploy.plist
```

---

## Checklist Go Live (cho project mới)

- [ ] Chọn port riêng (không trùng project khác)
- [ ] Dockerfile: `EXPOSE {PORT}` + `ENV PORT={PORT}`
- [ ] docker-compose.prod.yml: `ports: "{PORT}:{PORT}"` + cloudflared service
- [ ] `AUTH_TRUST_HOST: "true"` trong environment
- [ ] `.env`: set `NEXTAUTH_SECRET` mạnh + `TUNNEL_TOKEN`
- [ ] Tạo Cloudflare tunnel → route domain → `http://{project}-app:{PORT}`
- [ ] Build Docker local (nếu Mac ARM): `docker build -t ghcr.io/{user}/{repo}:latest .`
- [ ] `docker compose -f docker-compose.prod.yml up -d`
- [ ] Đổi admin password (không dùng mặc định)
- [ ] LaunchAgent deploy + backup đã load trên Mac
- [ ] Test từ iOS Safari: login, thêm data

---

## Dùng file này cho project mới

Khi tạo project mới, copy file này và update:
1. Tên project/repo
2. Port (chọn port chưa dùng)
3. Domain Cloudflare
4. Tên LaunchAgent plist files
5. TUNNEL_TOKEN mới

Claude sẽ tự hiểu workflow và làm đúng chuẩn.
