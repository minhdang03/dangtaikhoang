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
    transferNote: "{sdt}",
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
        transferNote: data.transferNote || "{sdt}",
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
      transferNote: form.transferNote,
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
