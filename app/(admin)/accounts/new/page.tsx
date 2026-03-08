"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ServiceOption {
  id: string;
  name: string;
  icon: string;
}

function generateLabel(serviceName: string): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${serviceName} #${num}`;
}

export default function NewAccountPage() {
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
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    joinLink: "",
    requireEmail: false,
  });

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then((data: ServiceOption[]) => {
        setServices(data);
        if (data.length > 0) {
          setForm(f => ({
            ...f,
            serviceId: data[0].id,
            label: f.label || generateLabel(data[0].name),
          }));
        }
      });
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    // Auto-generate label when service changes
    if (key === "serviceId") {
      const svc = services.find(s => s.id === e.target.value);
      if (svc) {
        setForm(f => ({ ...f, serviceId: e.target.value, label: generateLabel(svc.name) }));
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const submitLabel = form.label.trim() || generateLabel(selectedService?.name || "Dịch vụ");
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, label: submitLabel }),
    });
    router.push("/accounts");
    router.refresh();
  }

  const selectedService = services.find(s => s.id === form.serviceId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">Thêm tài khoản</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <Select label="Dịch vụ" value={form.serviceId} onChange={set("serviceId")}>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </Select>

          <Input
            label="Tên gợi nhớ"
            placeholder={`VD: ${selectedService?.name || "Dịch vụ"} Gia đình`}
            value={form.label}
            onChange={set("label")}
          />

          <Input
            label="Email / Tên đăng nhập"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={set("email")}
            required
          />

          <Input
            label="Mật khẩu"
            type="text"
            placeholder="Mật khẩu tài khoản"
            value={form.password}
            onChange={set("password")}
            required
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số slots"
              type="number"
              min="1"
              max="20"
              value={form.totalSlots}
              onChange={set("totalSlots")}
              required
            />
            <Input
              label="Giá/slot/tháng (₫)"
              type="number"
              min="0"
              step="1000"
              value={form.monthlyFee}
              onChange={set("monthlyFee")}
              required
            />
          </div>

          <Input
            label="Ngày gia hạn"
            type="date"
            value={form.renewalDate}
            onChange={set("renewalDate")}
            required
          />

          <TextArea
            label="Ghi chú (tùy chọn)"
            placeholder="VD: Tài khoản gia đình, profile A cho Minh..."
            value={form.notes}
            onChange={set("notes")}
          />
        </div>

        {/* Invite link settings (Canva, etc.) */}
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
          <p className="text-xs text-gray-400">Dùng cho Canva, Figma... cần email để mời vào nhóm.</p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
            Hủy
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Lưu tài khoản
          </Button>
        </div>
      </form>
    </div>
  );
}
