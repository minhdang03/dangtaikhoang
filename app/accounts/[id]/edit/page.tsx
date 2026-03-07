"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const SERVICES = [
  { id: "chatgpt", name: "ChatGPT Plus", icon: "🤖" },
  { id: "netflix", name: "Netflix", icon: "🎬" },
  { id: "google_drive", name: "Google Drive", icon: "💾" },
  { id: "spotify", name: "Spotify", icon: "🎵" },
  { id: "youtube", name: "YouTube Premium", icon: "▶️" },
];

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    serviceId: "chatgpt",
    label: "",
    email: "",
    password: "",
    totalSlots: "5",
    monthlyFee: "50000",
    renewalDate: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/accounts/${id}`).then(r => r.json()).then(data => {
      setForm({
        serviceId: data.serviceId,
        label: data.label,
        email: data.email,
        password: data.password,
        totalSlots: String(data.totalSlots),
        monthlyFee: String(data.monthlyFee),
        renewalDate: data.renewalDate?.split("T")[0] || "",
        notes: data.notes || "",
      });
    });
  }, [id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">Sửa tài khoản</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <Select label="Dịch vụ" value={form.serviceId} onChange={set("serviceId")}>
            {SERVICES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </Select>
          <Input label="Tên gợi nhớ" value={form.label} onChange={set("label")} required />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
          <Input label="Mật khẩu" value={form.password} onChange={set("password")} required />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Số slots" type="number" min="1" value={form.totalSlots} onChange={set("totalSlots")} required />
            <Input label="Giá/slot/tháng (₫)" type="number" min="0" step="1000" value={form.monthlyFee} onChange={set("monthlyFee")} required />
          </div>
          <Input label="Ngày gia hạn" type="date" value={form.renewalDate} onChange={set("renewalDate")} required />
          <TextArea label="Ghi chú" value={form.notes} onChange={set("notes")} />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">Lưu thay đổi</Button>
        </div>
      </form>
    </div>
  );
}
