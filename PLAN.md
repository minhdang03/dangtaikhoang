# Plan: UX Fixes + Slot startDate + Shop

## 1. UX Fixes (nhanh)

### 1a. Header "Quản lý tài khoản" → clickable về home
- File: `components/MobileNav.tsx`
- Wrap title trong `<Link href="/">`

### 1b. Email copyable trong account detail
- File: `app/accounts/[id]/page.tsx`
- Thêm `<CopyButton>` vào hàng Email (giống password đã làm)

---

## 2. Slot startDate riêng per user

Hiện tại khi gán user vào slot, `startDate` tự set = ngày hôm nay.
Cần cho phép chọn ngày bắt đầu (hôm nay, ngày mai, hoặc pick date).

### 2a. Cập nhật form "Gán người dùng"
- File: `app/accounts/[id]/page.tsx`
- Thêm field `startDate` (input type="date", default = hôm nay)

### 2b. Hiển thị startDate trong slot list
- Hiện thêm ngày bắt đầu dưới tên người dùng mỗi slot

---

## 3. Shop cho khách

### Flow:
```
/shop → xem dịch vụ → bấm "Đặt slot"
→ form (tên, SĐT/Zalo, FB link)
→ trang thanh toán QR (/shop/order/[id])
→ admin thấy đơn trên dashboard → xác nhận → auto tạo User + Subscription
→ nếu không confirm trong 2h → order tự expire, không lưu user
```

### 3a. Prisma model mới: `Order`
```
model Order {
  id            String   @id @default(uuid())
  accountId     String
  account       Account  (relation)
  customerName  String
  customerPhone String
  customerFb    String   @default("")
  amount        Float
  status        String   @default("pending") // pending | confirmed | expired
  createdAt     DateTime @default(now())
  expiresAt     DateTime
}
```
- Migration mới: `prisma/migrations/20260307000001_add_orders/`

### 3b. Middleware update
- File: `lib/auth.config.ts`
- Thêm `isShop = nextUrl.pathname.startsWith("/shop")` → public
- Thêm `isApiShop = nextUrl.pathname.startsWith("/api/shop")` → public

### 3c. Shop layout riêng (không có MobileNav admin)
- File: `app/shop/layout.tsx`
- Simple header "🛒 Dịch vụ chia sẻ" + Toast, không có nav admin

### 3d. Trang shop chính
- File: `app/shop/page.tsx` (client component)
- Gọi `/api/shop/services` → nhóm theo serviceType
- Mỗi dịch vụ: tên, icon, giá/tháng, số slot còn trống
- Nút "Đặt slot" → modal form (tên, SĐT/Zalo, FB)
- Submit → POST `/api/shop/orders` → redirect `/shop/order/[id]`

### 3e. Trang thanh toán đơn hàng
- File: `app/shop/order/[id]/page.tsx` (client component)
- Hiển thị: tên dịch vụ, giá, QR chuyển khoản (VietQR)
- Nội dung chuyển khoản: mã đơn hàng
- "Đã chuyển khoản → chờ admin xác nhận"
- Hiển thị countdown 2h hết hạn

### 3f. API Routes (public, no auth)
- `GET /api/shop/services` → danh sách dịch vụ có slot trống
- `POST /api/shop/orders` → tạo đơn hàng (validate: còn slot không)
- `GET /api/shop/orders/[id]` → xem trạng thái đơn

### 3g. API Routes (admin auth)
- `GET /api/orders` → danh sách pending orders cho admin
- `PUT /api/orders/[id]` → confirm (tạo User + Sub + Payment) hoặc expire

### 3h. Admin: Dashboard thêm section "Đơn đặt slot"
- File: `app/page.tsx`
- Thêm section hiển thị pending orders (max 5)
- Nút "Xác nhận" → gọi PUT /api/orders/[id] với status "confirmed"
- Khi confirm: auto tạo User (nếu chưa có SĐT), Subscription, Payment (paid)

---

## Thứ tự thực hiện:
1. UX fixes (header + email copy)
2. Slot startDate
3. Prisma Order model + migration
4. Middleware update
5. Shop layout + pages
6. Shop API routes
7. Admin orders API + dashboard section
