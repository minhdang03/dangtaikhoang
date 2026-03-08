"use client";
import { useState, useEffect } from "react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "10",
    expiresAt: "",
    maxUses: "0",
  });

  async function fetchCodes() {
    const res = await fetch("/api/promo-codes");
    setCodes(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCodes(); }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  function openNew() {
    setEditingId(null);
    setForm({ code: "", discountType: "percent", discountValue: "10", expiresAt: "", maxUses: "0" });
    setShowForm(true);
  }

  function openEdit(c: PromoCode) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
      maxUses: String(c.maxUses),
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      expiresAt: form.expiresAt || null,
      maxUses: Number(form.maxUses),
    };

    if (editingId) {
      await fetch(`/api/promo-codes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowForm(false);
    fetchCodes();
  }

  async function toggleActive(c: PromoCode) {
    await fetch(`/api/promo-codes/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    fetchCodes();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    await fetch(`/api/promo-codes/${id}`, { method: "DELETE" });
    fetchCodes();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Mã giảm giá</h1>
        <Button onClick={openNew} size="sm">+ Thêm mã</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="text-4xl mb-3">🎟️</div>
          <p className="text-gray-500">Chưa có mã giảm giá nào.</p>
          <p className="text-sm text-gray-400 mt-1">Tạo mã mới để khách hàng có thể sử dụng.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {codes.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{c.code}</span>
                    {!c.active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Tắt</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {c.discountType === "percent" ? `Giảm ${c.discountValue}%` : `Giảm ${c.discountValue.toLocaleString()}₫`}
                    {c.maxUses > 0 ? ` · ${c.usedCount}/${c.maxUses} lượt` : ` · ${c.usedCount} lượt dùng`}
                    {c.expiresAt ? ` · HSD: ${new Date(c.expiresAt).toLocaleDateString("vi-VN")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${c.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                  >
                    {c.active ? "Bật" : "Tắt"}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-full sm:w-[440px] sm:rounded-2xl rounded-t-3xl p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editingId ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Mã code"
                placeholder="VD: GIAM20"
                value={form.code}
                onChange={set("code")}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Select label="Loại giảm" value={form.discountType} onChange={set("discountType")}>
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền (₫)</option>
                </Select>
                <Input
                  label={form.discountType === "percent" ? "Giá trị (%)" : "Giá trị (₫)"}
                  type="number"
                  min="0"
                  value={form.discountValue}
                  onChange={set("discountValue")}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Hết hạn (tùy chọn)"
                  type="date"
                  value={form.expiresAt}
                  onChange={set("expiresAt")}
                />
                <Input
                  label="Giới hạn lượt (0=∞)"
                  type="number"
                  min="0"
                  value={form.maxUses}
                  onChange={set("maxUses")}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" loading={saving} className="flex-1">
                  {editingId ? "Lưu" : "Tạo mã"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
