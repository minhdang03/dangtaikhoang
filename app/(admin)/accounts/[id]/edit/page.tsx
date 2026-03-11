"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ServiceOption {
  id: string;
  name: string;
  icon: string;
}

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [form, setForm] = useState({
    serviceId: "",
    label: "",
    slug: "",
    shareType: "account" as "account" | "invite" | "solo",
    email: "",
    password: "",
    totalSlots: "5",
    price1m: "50000",
    price3m: "0",
    price6m: "0",
    price12m: "0",
    renewalDate: "",
    notes: "",
    joinLink: "",
    requireEmail: false,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then(r => r.json()),
      fetch(`/api/accounts/${id}`).then(r => r.json()),
    ]).then(([svcs, data]) => {
      setServices(svcs);
      setForm({
        serviceId: data.serviceId,
        label: data.label,
        slug: data.slug || "",
        shareType: data.shareType || "account",
        email: data.email || "",
        password: data.password || "",
        totalSlots: String(data.totalSlots),
        price1m: String(data.price1m || 0),
        price3m: String(data.price3m || 0),
        price6m: String(data.price6m || 0),
        price12m: String(data.price12m || 0),
        renewalDate: data.renewalDate?.split("T")[0] || "",
        notes: data.notes || "",
        joinLink: data.joinLink || "",
        requireEmail: data.requireEmail || false,
      });
    });
  }, [id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  function setShareType(type: "account" | "invite" | "solo") {
    setForm(f => ({
      ...f,
      shareType: type,
      totalSlots: type === "solo" ? "1" : f.totalSlots,
      requireEmail: type === "invite" ? true : f.requireEmail,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push(`/accounts/${id}`);
    router.refresh();
  }

  const isInvite = form.shareType === "invite";
  const isSolo = form.shareType === "solo";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">Sửa tài khoản</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <Select label="Dịch vụ" value={form.serviceId} onChange={set("serviceId")}>
            {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </Select>
          <Input label="Tên gợi nhớ" value={form.label} onChange={set("label")} required />
          <div>
            <Input
              label="URL thân thiện (slug)"
              placeholder="vd: netflix-gia-dinh"
              value={form.slug}
              onChange={set("slug")}
            />
            {form.slug && (
              <p className="text-[10px] text-gray-400 mt-1">Link: /shop?service=<span className="text-blue-500">{form.slug}</span></p>
            )}
          </div>

          {/* Loại chia sẻ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại chia sẻ</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShareType("account")}
                className={`p-2.5 rounded-xl border-2 text-left transition-colors ${
                  form.shareType === "account" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-base mb-0.5">🔑</div>
                <div className={`text-xs font-semibold ${form.shareType === "account" ? "text-blue-700" : "text-gray-700"}`}>Dùng chung</div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">Nhiều người/acc</div>
              </button>
              <button
                type="button"
                onClick={() => setShareType("solo")}
                className={`p-2.5 rounded-xl border-2 text-left transition-colors ${
                  isSolo ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-base mb-0.5">👤</div>
                <div className={`text-xs font-semibold ${isSolo ? "text-purple-700" : "text-gray-700"}`}>Riêng lẻ</div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">1 acc/người</div>
              </button>
              <button
                type="button"
                onClick={() => setShareType("invite")}
                className={`p-2.5 rounded-xl border-2 text-left transition-colors ${
                  isInvite ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-base mb-0.5">🔗</div>
                <div className={`text-xs font-semibold ${isInvite ? "text-blue-700" : "text-gray-700"}`}>Link mời</div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">Canva, Adobe…</div>
              </button>
            </div>
          </div>

          {/* Email + password: hiện khi account hoặc solo */}
          {!isInvite && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Email đăng nhập"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={set("email")}
                required
              />
              <Input
                label="Mật khẩu"
                type="text"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                required
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          {!isSolo && (
            <Input label="Số slots" type="number" min="1" value={form.totalSlots} onChange={set("totalSlots")} required />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bảng giá <span className="text-xs text-gray-400 font-normal">(0 = không bán gói đó)</span></label>
            <div className="grid grid-cols-2 gap-2">
              <Input label="1 tháng (₫)" type="number" min="0" step="1000" placeholder="0" value={form.price1m} onChange={set("price1m")} />
              <Input label="3 tháng (₫)" type="number" min="0" step="1000" placeholder="0" value={form.price3m} onChange={set("price3m")} />
              <Input label="6 tháng (₫)" type="number" min="0" step="1000" placeholder="0" value={form.price6m} onChange={set("price6m")} />
              <Input label="12 tháng (₫)" type="number" min="0" step="1000" placeholder="0" value={form.price12m} onChange={set("price12m")} />
            </div>
          </div>
          <Input label="Ngày gia hạn" type="date" value={form.renewalDate} onChange={set("renewalDate")} required />
          <TextArea label="Ghi chú" value={form.notes} onChange={set("notes")} rows={2} />
        </div>

        {/* Link mời + require email: chỉ hiện khi invite */}
        {isInvite && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
            <h3 className="font-semibold text-gray-700 text-sm">🔗 Link mời tham gia</h3>
            <Input
              label="Link mời"
              placeholder="https://canva.com/brand/join/..."
              value={form.joinLink}
              onChange={set("joinLink")}
              required
            />
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              ℹ️ Khách hàng sẽ thấy nút "Tham gia" thay vì email/mật khẩu khi tra cứu đơn.
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">Lưu thay đổi</Button>
        </div>
      </form>
    </div>
  );
}
