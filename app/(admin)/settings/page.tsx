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
    newPassword: "",
    shopTitle: "Dịch vụ chia sẻ",
    shopDescription: "Đăng ký dịch vụ với giá tốt nhất",
    transferNote: "{sdt}",
    ogImage: "",
    telegramBotToken: "",
    telegramChatId: "",
    contactFacebook: "",
    contactTelegram: "",
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
        contactFacebook: data.contactFacebook || "",
        contactTelegram: data.contactTelegram || "",
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
      contactFacebook: form.contactFacebook,
      contactTelegram: form.contactTelegram,
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
    setForm(f => ({ ...f, newPassword: "" }));
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Cài đặt</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Shop */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900">🛒 Trang shop</h2>
          <Input
            label="Tên shop"
            placeholder="VD: Dịch vụ chia sẻ"
            value={form.shopTitle}
            onChange={set("shopTitle")}
          />
          <Input
            label="Mô tả ngắn"
            placeholder="VD: Đăng ký dịch vụ với giá tốt nhất"
            value={form.shopDescription}
            onChange={set("shopDescription")}
          />
          <Input
            label="Ảnh OG (URL khi share link)"
            placeholder="https://example.com/og-image.png"
            value={form.ogImage}
            onChange={set("ogImage")}
          />
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Nội dung chuyển khoản"
                placeholder="{sdt} hoặc CK {sdt}"
                value={form.transferNote}
                onChange={set("transferNote")}
              />
            </div>
            <div className="w-24">
              <Input
                label="Nhắc hết hạn (ngày)"
                type="number"
                min="1"
                max="30"
                value={form.reminderDays}
                onChange={set("reminderDays")}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            <span className="font-mono bg-gray-100 px-1 rounded">{"{sdt}"}</span> = số điện thoại khách
          </p>
        </section>

        {/* Bank */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900">🏦 Tài khoản ngân hàng</h2>
          <Select label="Ngân hàng" value={form.bankId} onChange={set("bankId")}>
            {BANKS.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Số tài khoản"
                placeholder="0123456789"
                value={form.accountNo}
                onChange={set("accountNo")}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Tên chủ tài khoản"
                placeholder="NGUYEN VAN A"
                value={form.accountName}
                onChange={set("accountName")}
              />
            </div>
          </div>
          {form.accountNo && form.accountName && (
            <p className="text-xs text-blue-600">✅ QR VietQR tự tạo khi lập phiếu thu</p>
          )}
        </section>

        {/* Telegram */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900">📱 Telegram</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Bot Token"
                placeholder="123456:ABC-DEF..."
                value={form.telegramBotToken}
                onChange={set("telegramBotToken")}
              />
            </div>
            <div className="w-36">
              <Input
                label="Chat ID"
                placeholder="-100123..."
                value={form.telegramChatId}
                onChange={set("telegramChatId")}
              />
            </div>
          </div>
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
        </section>

        {/* Contact */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900">📞 Liên hệ khi hết slot</h2>
          <p className="text-xs text-gray-400 -mt-1">Để trống nếu không muốn hiện nút liên hệ.</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Facebook / Messenger"
                placeholder="https://m.me/yourpage"
                value={form.contactFacebook}
                onChange={set("contactFacebook")}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Telegram"
                placeholder="https://t.me/username"
                value={form.contactTelegram}
                onChange={set("contactTelegram")}
              />
            </div>
          </div>
        </section>

        {/* Password */}
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
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

      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
        <Button variant="secondary" className="w-full" onClick={() => signOut({ callbackUrl: "/login" })}>
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
