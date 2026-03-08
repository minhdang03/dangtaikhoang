"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { CopyButton } from "@/components/ui/CopyButton";

interface UserDetail {
  id: string;
  name: string;
  phone: string;
  fbLink: string;
  lookupPin: string;
  subscriptions: Array<{
    id: string;
    slotLabel: string;
    status: string;
    account?: { id: string; label: string; monthlyFee: number; service?: { icon: string; name: string } };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    month: string;
    status: string;
    paidAt: string | null;
  }>;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", fbLink: "" });
  const [loading, setLoading] = useState(false);

  // PIN management
  const [pinInput, setPinInput] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);

  async function load() {
    const res = await fetch(`/api/users/${id}`);
    const data = await res.json();
    setUser(data);
    setForm({ name: data.name, phone: data.phone, fbLink: data.fbLink || "" });
    setPinInput("");
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(false);
    setLoading(false);
    load();
  }

  async function handlePinSave() {
    const p = pinInput.trim();
    if (p && (p.length !== 4 || !/^\d{4}$/.test(p))) return;
    setPinLoading(true);
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lookupPin: p }),
    });
    setPinLoading(false);
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2000);
    load();
  }

  async function deleteUser() {
    if (!window.confirm(`Xoá người dùng "${user?.name}"?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.push("/users");
  }

  if (!user) return <div className="text-center py-10 text-gray-400">Đang tải...</div>;

  const activeSubscriptions = user.subscriptions.filter(s => s.status === "active");
  const pendingPayments = user.payments.filter(p => p.status === "pending");
  const totalDebt = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-2xl">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
          {totalDebt > 0 && <p className="text-sm text-red-500">Nợ {formatCurrency(totalDebt)}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
          {editing ? "Hủy" : "✏️"}
        </Button>
      </div>

      {/* Info / Edit */}
      {editing ? (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <Input label="Họ tên" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="SĐT" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Facebook" value={form.fbLink} onChange={e => setForm(f => ({ ...f, fbLink: e.target.value }))} />
          <Button onClick={handleSave} loading={loading}>Lưu thay đổi</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
          <Row label="SĐT" value={
            <div className="flex items-center gap-2">
              <a href={`tel:${user.phone}`} className="text-blue-600">{user.phone}</a>
              <CopyButton text={user.phone} label="Copy" />
            </div>
          } />
          {user.fbLink && (
            <Row label="Facebook" value={
              <a href={user.fbLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm truncate max-w-40">
                Xem profile →
              </a>
            } />
          )}
        </div>
      )}

      {/* PIN management */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">🔐 Mã PIN tra cứu</h2>
          {user.lookupPin ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-700">
                {showCurrentPin ? user.lookupPin : "••••"}
              </span>
              <button
                onClick={() => setShowCurrentPin(s => !s)}
                className="text-xs text-blue-600 underline"
              >
                {showCurrentPin ? "Ẩn" : "Xem"}
              </button>
            </div>
          ) : (
            <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded-full font-medium">
              Chưa đặt PIN
            </span>
          )}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              {user.lookupPin ? "Đặt PIN mới (để xóa PIN, để trống)" : "Đặt PIN mới (4 số)"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="VD: 1234"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <Button
            onClick={handlePinSave}
            loading={pinLoading}
            disabled={pinInput.length > 0 && pinInput.length < 4}
            size="sm"
          >
            {pinSaved ? "✅ Đã lưu" : user.lookupPin ? "Cập nhật" : "Đặt PIN"}
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          Khách dùng PIN này để xem email & mật khẩu tại trang Tra cứu đơn hàng.
        </p>
      </div>

      {/* Active subscriptions */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Dịch vụ đang dùng ({activeSubscriptions.length})</h2>
        </div>
        {activeSubscriptions.length === 0 ? (
          <div className="p-4 text-sm text-gray-400 text-center">Chưa dùng dịch vụ nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeSubscriptions.map(s => (
              <Link key={s.id} href={`/accounts/${s.account?.id}`}>
                <div className="flex items-center gap-3 p-4">
                  <span className="text-xl">{s.account?.service?.icon || "📦"}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{s.account?.label}</p>
                    <p className="text-xs text-gray-400">{s.slotLabel}</p>
                  </div>
                  <span className="text-sm text-gray-500">{formatCurrency(s.account?.monthlyFee || 0)}/tháng</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Lịch sử thanh toán</h2>
        </div>
        {user.payments.length === 0 ? (
          <div className="p-4 text-sm text-gray-400 text-center">Chưa có thanh toán nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {user.payments.slice().reverse().slice(0, 12).map(p => (
              <Link key={p.id} href={`/payments/${p.id}`}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatMonth(p.month)}</p>
                    <p className="text-xs text-gray-400">{p.paidAt ? `Đã TT: ${new Date(p.paidAt).toLocaleDateString("vi-VN")}` : "Chưa thanh toán"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                    <Badge variant={p.status === "paid" ? "green" : p.status === "overdue" ? "red" : "yellow"}>
                      {p.status === "paid" ? "Đã TT" : p.status === "overdue" ? "Trễ" : "Chờ TT"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Button variant="danger" onClick={deleteUser} className="w-full">
        🗑️ Xoá người dùng
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
