"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface ServiceSlot {
  id: string;
  serviceType: string;
  serviceName: string;
  serviceIcon: string;
  monthlyFee: number;
  totalSlots: number;
  freeSlots: number;
}

interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerFb: string;
}

export default function ShopPage() {
  const [grouped, setGrouped] = useState<Record<string, ServiceSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceSlot | null>(null);
  const [form, setForm] = useState<OrderForm>({ customerName: "", customerPhone: "", customerFb: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/shop/services")
      .then(r => r.json())
      .then(data => { setGrouped(data); setLoading(false); });
  }, []);

  async function submitOrder() {
    if (!selected) return;
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast("Vui lòng điền đầy đủ tên và SĐT", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selected.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Có lỗi xảy ra", "error");
        setSubmitting(false);
        return;
      }
      // Store full order data (including QR URL) for the order page
      sessionStorage.setItem(`order_${data.id}`, JSON.stringify(data));
      window.location.href = `/shop/order/${data.id}`;
    } catch {
      toast("Có lỗi xảy ra", "error");
      setSubmitting(false);
    }
  }

  const entries = Object.entries(grouped);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero */}
      <div className="text-center pt-2">
        <p className="text-gray-500 text-sm">Đăng ký dịch vụ với giá tốt nhất</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <div className="text-4xl mb-3">😔</div>
          <p className="text-gray-500">Hiện chưa có slot trống.</p>
          <p className="text-sm text-gray-400 mt-1">Vui lòng quay lại sau.</p>
        </div>
      ) : (
        entries.map(([type, slots]) => (
          <section key={type}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {slots[0].serviceIcon} {slots[0].serviceName}
            </h2>
            <div className="flex flex-col gap-3">
              {slots.map(slot => (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3"
                >
                  <div className="text-3xl">{slot.serviceIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{slot.serviceName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(slot.monthlyFee)}/tháng</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-green-600 font-medium">Còn {slot.freeSlots} slot</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelected(slot); setForm({ customerName: "", customerPhone: "", customerFb: "" }); }}
                    className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium active:bg-blue-700 transition-colors"
                  >
                    Đặt slot
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Order modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{selected.serviceIcon}</span>
              <div>
                <p className="font-bold text-gray-900">{selected.serviceName}</p>
                <p className="text-sm text-blue-600 font-semibold">{formatCurrency(selected.monthlyFee)}/tháng</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-gray-400 text-xl">✕</button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên của bạn *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SĐT / Zalo *</label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Facebook (tùy chọn)</label>
                <input
                  type="url"
                  placeholder="https://fb.com/..."
                  value={form.customerFb}
                  onChange={e => setForm(f => ({ ...f, customerFb: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base active:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Đang xử lý..." : `Tiếp tục → Thanh toán ${formatCurrency(selected.monthlyFee)}`}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Đơn hàng có hiệu lực 2 giờ. Thanh toán để xác nhận đăng ký.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
