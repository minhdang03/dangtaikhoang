"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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
  customerPhone: string;
  lookupPin: string;
  customerName: string;
  duration: number;
  customerFb: string;
}

export default function ShopPage() {
  const [grouped, setGrouped] = useState<Record<string, ServiceSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceSlot | null>(null);
  const [form, setForm] = useState<OrderForm>({ customerPhone: "", lookupPin: "", customerName: "", duration: 1, customerFb: "" });
  const [submitting, setSubmitting] = useState(false);
  const [existingOrder, setExistingOrder] = useState<{ id: string; serviceName: string } | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    fetch("/api/shop/services")
      .then(r => r.json())
      .then(data => { setGrouped(data); setLoading(false); });
  }, []);

  // Check for existing pending orders when phone changes
  useEffect(() => {
    const phone = form.customerPhone.trim();
    if (phone.length < 9) {
      setExistingOrder(null);
      return;
    }
    setCheckingPhone(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shop/lookup?phone=${encodeURIComponent(phone)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.pendingOrders?.length > 0) {
            setExistingOrder({
              id: data.pendingOrders[0].id,
              serviceName: data.pendingOrders[0].serviceName,
            });
          } else {
            setExistingOrder(null);
          }
        }
      } catch { /* ignore */ }
      setCheckingPhone(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.customerPhone]);

  async function submitOrder() {
    if (!selected) return;
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast("Vui lòng điền đầy đủ tên và SĐT", "error");
      return;
    }
    if (form.lookupPin.length !== 4) {
      toast("Vui lòng đặt mã PIN 4 số để tra cứu tài khoản sau", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selected.id, ...form, lookupPin: form.lookupPin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Có lỗi xảy ra", "error");
        setSubmitting(false);
        return;
      }
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
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {slots.map(slot => (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="text-3xl shrink-0">{slot.serviceIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{slot.serviceName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{formatCurrency(slot.monthlyFee)}/tháng</span>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-xs text-green-600 font-medium whitespace-nowrap">Còn {slot.freeSlots} slot</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelected(slot); setForm({ customerPhone: "", lookupPin: "", customerName: "", duration: 1, customerFb: "" }); setExistingOrder(null); }}
                    className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    Đặt slot
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Quick lookup link */}
      {!loading && entries.length > 0 && (
        <div className="text-center">
          <Link href="/shop/lookup" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
            Đã đặt hàng? <span className="underline">Tra cứu đơn hàng</span>
          </Link>
        </div>
      )}

      {/* Order modal — bottom sheet mobile, center modal desktop */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white w-full sm:w-[440px] sm:rounded-2xl rounded-t-3xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{selected.serviceIcon}</span>
              <div>
                <p className="font-bold text-gray-900">{selected.serviceName}</p>
                <p className="text-sm text-blue-600 font-semibold">{formatCurrency(selected.monthlyFee)}/tháng</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-gray-400 text-xl hover:text-gray-600">✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* PIN field — MOVED TO TOP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã PIN tra cứu <span className="text-red-400 font-normal">*</span> <span className="text-gray-400 font-normal">(4 số, để xem tài khoản sau)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="VD: 1234"
                  value={form.lookupPin}
                  onChange={e => setForm(f => ({ ...f, lookupPin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  autoFocus
                />
                {form.lookupPin.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-1.5">💡 Tự đặt 4 số dễ nhớ. Bắt buộc để xem tài khoản sau khi admin duyệt.</p>
                ) : form.lookupPin.length === 4 ? (
                  <p className="text-xs text-green-600 mt-1.5">✅ Ghi nhớ PIN này để tra cứu tài khoản.</p>
                ) : (
                  <p className="text-xs text-red-500 mt-1.5">Nhập đủ 4 số.</p>
                )}
              </div>

              {/* Phone field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SĐT / Zalo *</label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
                {/* Existing order notice */}
                {existingOrder && !checkingPhone && (
                  <div className="mt-2 bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
                    <p className="text-orange-700">
                      Bạn có đơn hàng <strong>{existingOrder.serviceName}</strong> đang chờ thanh toán.
                    </p>
                    <Link
                      href={`/shop/order/${existingOrder.id}`}
                      className="text-blue-600 font-medium text-xs mt-1 inline-block underline"
                    >
                      Tiếp tục thanh toán →
                    </Link>
                  </div>
                )}
              </div>

              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên của bạn *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              {/* Duration selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn đăng ký *</label>
                <select
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                >
                  <option value={1}>1 tháng — {formatCurrency(selected.monthlyFee * 1)}</option>
                  <option value={3}>3 tháng — {formatCurrency(selected.monthlyFee * 3)}</option>
                  <option value={6}>6 tháng — {formatCurrency(selected.monthlyFee * 6)}</option>
                  <option value={12}>12 tháng — {formatCurrency(selected.monthlyFee * 12)}</option>
                </select>
              </div>

              {/* Facebook field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Facebook (tùy chọn)</label>
                <input
                  type="url"
                  placeholder="https://fb.com/..."
                  value={form.customerFb}
                  onChange={e => setForm(f => ({ ...f, customerFb: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Đang xử lý..." : `Tiếp tục → Thanh toán ${formatCurrency(selected.monthlyFee * form.duration)}`}
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
