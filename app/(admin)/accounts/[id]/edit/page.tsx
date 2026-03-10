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
    email: "",
    password: "",
    totalSlots: "5",
    monthlyFee: "50000",
    yearlyFee: "0",
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
        email: data.email,
        password: data.password,
        totalSlots: String(data.totalSlots),
        monthlyFee: String(data.monthlyFee),
        yearlyFee: String(data.yearlyFee || 0),
        renewalDate: data.renewalDate?.split("T")[0] || "",
        notes: data.notes || "",
        joinLink: data.joinLink || "",
        requireEmail: data.requireEmail || false,
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
            {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
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
          <Input
            label="Giá/slot/năm (₫) — tùy chọn"
            type="number"
            min="0"
            step="1000"
            placeholder="0 = không bán theo năm"
            value={form.yearlyFee}
            onChange={set("yearlyFee")}
          />
          {Number(form.yearlyFee) > 0 && Number(form.monthlyFee) > 0 && (
            <p className="text-xs text-green-600 -mt-2">
              💡 Tiết kiệm {Math.round((1 - Number(form.yearlyFee) / (Number(form.monthlyFee) * 12)) * 100)}% so với mua theo tháng
            </p>
          )}
          <Input label="Ngày gia hạn" type="date" value={form.renewalDate} onChange={set("renewalDate")} required />
          <TextArea label="Ghi chú" value={form.notes} onChange={set("notes")} />
        </div>

        {/* Invite link settings */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h3 className="font-semibold text-gray-700 text-sm">🔗 Mời tham gia (tùy chọn)</h3>
          <Input
            label="Link mời (invite link)"
            placeholder="https://canva.com/brand/join/..."
            value={form.joinLink}
            onChange={set("joinLink")}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requireEmail}
              onChange={e => setForm(f => ({ ...f, requireEmail: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Yêu cầu khách nhập email khi đặt</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">Lưu thay đổi</Button>
        </div>
      </form>
    </div>
  );
}
