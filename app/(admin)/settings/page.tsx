"use client";
import { useState, useEffect } from "react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signOut } from "next-auth/react";
import { BANKS } from "@/lib/vietqr";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    bankId: "MB",
    bankBin: "970422",
    accountNo: "",
    accountName: "",
    reminderDays: "7",
    adminPassword: "",
    newPassword: "",
    shopTitle: "Dịch vụ chia sẻ",
    shopDescription: "Đăng ký dịch vụ với giá tốt nhất",
    transferNote: "{sdt}",
    ogImage: "",
    telegramBotToken: "",
    telegramChatId: "",
  });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      setForm(f => ({
        ...f,
        bankId: data.bankId || "MB",
        bankBin: data.bankBin || "970422",
        accountNo: data.accountNo || "",
        accountName: data.accountName || "",
        reminderDays: String(data.reminderDays || 7),
        shopTitle: data.shopTitle || "Dịch vụ chia sẻ",
        shopDescription: data.shopDescription || "Đăng ký dịch vụ với giá tốt nhất",
        transferNote: data.transferNote || "{sdt}",
        ogImage: data.ogImage || "",
        telegramBotToken: data.telegramBotToken || "",
        telegramChatId: data.telegramChatId || "",
      }));
    });
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (key === "bankId") {
      const bank = BANKS.find(b => b.id === e.target.value);
      if (bank) setForm(f => ({ ...f, bankId: bank.id, bankBin: bank.bin }));
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload: Record<string, string | number> = {
      bankId: form.bankId,
      bankBin: form.bankBin,
      accountNo: form.accountNo,
      accountName: form.accountName,
      reminderDays: Number(form.reminderDays),
      shopTitle: form.shopTitle,
      shopDescription: form.shopDescription,
      transferNote: form.transferNote,
      ogImage: form.ogImage,
      telegramBotToken: form.telegramBotToken,
      telegramChatId: form.telegramChatId,
    };
    if (form.newPassword) {
      payload.adminPassword = form.newPassword;
    }
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm(f => ({ ...f, adminPassword: "", newPassword: "" }));
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Cài đặt</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Shop settings */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">🛒 Trang shop</h2>
          <Input
            label="Tên shop (hiển thị trên header)"
            placeholder="VD: Dịch vụ chia sẻ"
            value={form.shopTitle}
            onChange={set("shopTitle")}
          />
          <Input
            label="Mô tả ngắn (hiển thị dưới header)"
            placeholder="VD: Đăng ký dịch vụ với giá tốt nhất"
            value={form.shopDescription}
            onChange={set("shopDescription")}
          />
          <Input
            label="Ảnh OG (URL ảnh khi share link)"
            placeholder="https://example.com/og-image.png"
            value={form.ogImage}
            onChange={set("ogImage")}
          />
          <Input
            label="Nội dung chuyển khoản"
            placeholder="VD: {sdt} hoặc CK {sdt}"
            value={form.transferNote}
            onChange={set("transferNote")}
          />
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex flex-col gap-1">
            <p>Biến có thể dùng: <span className="font-mono bg-white border border-gray-200 px-1 rounded">{"{sdt}"}</span> = số điện thoại khách</p>
            <p className="text-gray-400">Ví dụ: <span className="font-mono">{`"{sdt}"`}</span> → <span className="font-mono">0912345678</span></p>
          </div>
        </section>

        {/* Bank settings */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">🏦 Tài khoản ngân hàng nhận tiền</h2>
          <Select
            label="Ngân hàng"
            value={form.bankId}
            onChange={set("bankId")}
          >
            {BANKS.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Input
            label="Số tài khoản"
            placeholder="VD: 0123456789"
            value={form.accountNo}
            onChange={set("accountNo")}
          />
          <Input
            label="Tên chủ tài khoản"
            placeholder="VD: NGUYEN VAN A"
            value={form.accountName}
            onChange={set("accountName")}
          />
          {form.accountNo && form.accountName && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
              ✅ QR VietQR sẽ được tạo tự động khi tạo phiếu thu.
            </div>
          )}
        </section>

        {/* Reminder settings */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">🔔 Nhắc nhở</h2>
          <Input
            label="Nhắc trước khi hết hạn (ngày)"
            type="number"
            min="1"
            max="30"
            value={form.reminderDays}
            onChange={set("reminderDays")}
          />
        </section>

        {/* Telegram */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">📱 Thông báo Telegram</h2>
          <Input
            label="Bot Token"
            placeholder="123456:ABC-DEF..."
            value={form.telegramBotToken}
            onChange={set("telegramBotToken")}
          />
          <Input
            label="Chat ID"
            placeholder="-1001234567890"
            value={form.telegramChatId}
            onChange={set("telegramChatId")}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={async () => {
              const res = await fetch("/api/settings/test-telegram", { method: "POST" });
              if (res.ok) alert("Đã gửi tin nhắn thử!");
              else {
                const data = await res.json();
                alert(data.error || "Lỗi gửi tin nhắn");
              }
            }}
          >
            🧪 Gửi tin nhắn thử
          </Button>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex flex-col gap-1">
            <p>Khi có đơn hàng mới, bot sẽ gửi thông báo kèm nút Duyệt/Từ chối.</p>
            <p className="text-gray-400">Webhook URL: <code className="bg-white border border-gray-200 px-1 rounded">https://dangtaikhoang.minhdanglu.com/api/telegram/webhook</code></p>
          </div>
        </section>

        {/* Password */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">🔐 Đổi mật khẩu admin</h2>
          <Input
            label="Mật khẩu mới (để trống nếu không đổi)"
            type="password"
            placeholder="Mật khẩu mới..."
            value={form.newPassword}
            onChange={set("newPassword")}
          />
        </section>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {saved ? "✅ Đã lưu!" : "Lưu cài đặt"}
        </Button>
      </form>

      {/* Logout */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3">Tài khoản</h2>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
