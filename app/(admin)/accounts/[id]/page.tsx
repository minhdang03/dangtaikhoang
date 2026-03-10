"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { CopyButton } from "@/components/ui/CopyButton";

interface Slot {
  id: string;
  userId: string;
  slotLabel: string;
  startDate: string;
  status: string;
  user?: { id: string; name: string; phone: string };
}

interface AccountDetail {
  id: string;
  label: string;
  email: string;
  password: string;
  totalSlots: number;
  monthlyFee: number;
  yearlyFee: number;
  renewalDate: string;
  notes: string;
  service?: { icon: string; name: string };
  slots: Slot[];
  activeSlots: number;
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [slotForm, setSlotForm] = useState({ userId: "", slotLabel: "Slot 1", startDate: todayStr });
  const [loading, setLoading] = useState(false);

  async function load() {
    const [accRes, usersRes] = await Promise.all([
      fetch(`/api/accounts/${id}`),
      fetch("/api/users"),
    ]);
    setAccount(await accRes.json());
    setUsers(await usersRes.json());
  }

  useEffect(() => { load(); }, [id]);

  async function addSlot() {
    if (!slotForm.userId) return;
    setLoading(true);
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slotForm, accountId: id, startDate: new Date(slotForm.startDate).toISOString() }),
    });
    setShowAddSlot(false);
    setLoading(false);
    load();
  }

  async function removeSlot(subId: string) {
    if (!window.confirm("Xoá người dùng khỏi slot này?")) return;
    await fetch(`/api/subscriptions/${subId}`, { method: "DELETE" });
    load();
  }

  async function deleteAccount() {
    if (!window.confirm(`Xoá tài khoản "${account?.label}"? Không thể hoàn tác.`)) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    router.push("/accounts");
  }

  if (!account) return <div className="text-center py-10 text-gray-400">Đang tải...</div>;

  const daysLeft = daysUntil(account.renewalDate);
  const freeSlots = account.totalSlots - account.activeSlots;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{account.label}</h1>
          <p className="text-sm text-gray-500">{account.service?.icon} {account.service?.name}</p>
        </div>
        <Link href={`/accounts/${id}/edit`}>
          <Button variant="ghost" size="sm">✏️</Button>
        </Link>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Email</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{account.email}</span>
            <CopyButton text={account.email} label="Copy" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Mật khẩu</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-900">
              {showPassword ? account.password : "••••••••"}
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-blue-500"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
            <CopyButton text={account.password} label="Copy" />
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Giá/slot</span>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900">{formatCurrency(account.monthlyFee)}/tháng</span>
            {account.yearlyFee > 0 && (
              <span className="text-xs text-green-600 ml-2">{formatCurrency(account.yearlyFee)}/năm</span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Gia hạn</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">{formatDate(account.renewalDate)}</span>
            {daysLeft <= 7 && daysLeft >= 0 && (
              <Badge variant={daysLeft <= 3 ? "red" : "yellow"}>
                {daysLeft === 0 ? "Hôm nay!" : `${daysLeft} ngày`}
              </Badge>
            )}
          </div>
        </div>
        {account.notes && (
          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-400">{account.notes}</p>
          </div>
        )}
      </div>

      {/* Slots */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-50">
          <div>
            <h2 className="font-semibold text-gray-900">Slots đang dùng</h2>
            <p className="text-xs text-gray-400 mt-0.5">{account.activeSlots}/{account.totalSlots} · còn {freeSlots} trống</p>
          </div>
          {freeSlots > 0 && (
            <Button size="sm" onClick={() => setShowAddSlot(!showAddSlot)}>
              {showAddSlot ? "Hủy" : "+ Gán người dùng"}
            </Button>
          )}
        </div>

        {showAddSlot && (
          <div className="p-4 bg-blue-50 flex flex-col gap-3 border-b border-blue-100">
            <Select
              label="Chọn người dùng"
              value={slotForm.userId}
              onChange={e => setSlotForm(f => ({ ...f, userId: e.target.value }))}
            >
              <option value="">-- Chọn người dùng --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
            <Input
              label="Tên slot (tùy chọn)"
              placeholder="VD: Profile 1, Slot A..."
              value={slotForm.slotLabel}
              onChange={e => setSlotForm(f => ({ ...f, slotLabel: e.target.value }))}
            />
            <Input
              label="Ngày bắt đầu"
              type="date"
              value={slotForm.startDate}
              onChange={e => setSlotForm(f => ({ ...f, startDate: e.target.value }))}
            />
            <Button onClick={addSlot} loading={loading}>Xác nhận</Button>
          </div>
        )}

        {account.slots.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Chưa có ai dùng tài khoản này
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {account.slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                  {slot.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{slot.user?.name || "?"}</p>
                  <p className="text-xs text-gray-400">{slot.slotLabel} · {slot.user?.phone} · từ {formatDate(slot.startDate)}</p>
                </div>
                <button
                  onClick={() => removeSlot(slot.id)}
                  className="text-red-400 hover:text-red-600 text-sm p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="danger" onClick={deleteAccount} className="w-full">
        🗑️ Xoá tài khoản
      </Button>
    </div>
  );
}
