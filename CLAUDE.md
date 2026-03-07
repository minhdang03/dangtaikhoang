# CLAUDE.md — Hướng dẫn cho Claude

> File này giúp Claude hiểu ngay context, workflow và conventions của project.
> Copy file này sang project mới để Claude tự biết cách làm việc.

---

## Thông tin Developer

- **Solo developer**: Minh Đăng (@minhdang03)
- **Thiết bị chính**: Mac (Docker server + Cloudflare Tunnel)
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
| Auth | NextAuth.js (credentials) | 1 admin account duy nhất |
| Deploy | Docker + docker-compose.prod.yml | Mac chạy container |
| CI/CD | GitHub Actions → GHCR | Push → build → image |
| Public | Cloudflare Tunnel | HTTPS tự động, không cần port forward |
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
├── Dockerfile
├── docker-compose.yml        # Dev
├── docker-compose.prod.yml   # Production (dùng image từ GHCR)
├── deploy.sh                 # Mac auto-deploy script
├── backup.sh                 # Data backup script
├── com.dangtaikhoang.deploy.plist   # LaunchAgent: deploy mỗi 60s
└── com.dangtaikhoang.backup.plist   # LaunchAgent: backup mỗi ngày 2AM
```

---

## Conventions

### Code
- **Ngôn ngữ UI**: Tiếng Việt (labels, messages, alerts)
- **Mobile-first**: Mọi UI phải dùng được trên iOS Safari trước
- **No over-engineering**: Không thêm abstraction chưa cần thiết
- **API routes**: Luôn check auth session trước khi xử lý

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

## Infrastructure trên Mac

```
Mac (server)
├── Docker container: dangtaikhoang-app (port 3000)
├── LaunchAgent: deploy.sh chạy mỗi 60 giây
├── LaunchAgent: backup.sh chạy mỗi ngày 2AM
└── Cloudflare Tunnel → app.domain.com → localhost:3000
```

### Reload sau khi thay đổi plist
```bash
launchctl unload ~/Library/LaunchAgents/com.dangtaikhoang.deploy.plist
launchctl load ~/Library/LaunchAgents/com.dangtaikhoang.deploy.plist
```

---

## Checklist Go Live

- [ ] Đổi admin password (không dùng mặc định)
- [ ] Set `NEXTAUTH_SECRET` mạnh (`openssl rand -base64 32`)
- [ ] Cấu hình thông tin ngân hàng trong Settings
- [ ] Backup LaunchAgent đã load trên Mac
- [ ] Test từ iOS Safari: login, thêm data, xem QR
- [ ] Cloudflare Tunnel có domain rõ ràng

---

## Dùng file này cho project mới

Khi tạo project mới, copy file này và update:
1. Tên project/repo
2. Tech stack (nếu khác)
3. Port (nếu khác 3000)
4. Tên LaunchAgent plist files

Claude sẽ tự hiểu workflow và làm đúng chuẩn.
