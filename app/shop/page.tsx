"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface ServiceSlot {
  id: string;
  slug?: string;
  serviceType: string;
  serviceName: string;
  serviceIcon: string;
  price1m: number;
  price3m: number;
  price6m: number;
  price12m: number;
  totalSlots: number;
  freeSlots: number;
  isFull: boolean;
  isSolo: boolean;
  requireEmail: boolean;
}

const DURATION_OPTIONS = [
  { months: 1, label: "1 tháng", shortLabel: "/tháng" },
  { months: 3, label: "3 tháng", shortLabel: "/3 tháng" },
  { months: 6, label: "6 tháng", shortLabel: "/6 tháng" },
  { months: 12, label: "12 tháng", shortLabel: "/năm" },
] as const;

function getAvailableDurations(slot: ServiceSlot) {
  const priceMap: Record<number, number> = { 1: slot.price1m, 3: slot.price3m, 6: slot.price6m, 12: slot.price12m };
  return DURATION_OPTIONS.filter(d => priceMap[d.months] > 0).map(d => ({ ...d, price: priceMap[d.months] }));
}

function getDisplayPrice(slot: ServiceSlot): { price: number; label: string } {
  const available = getAvailableDurations(slot);
  return available.length > 0 ? { price: available[0].price, label: available[0].shortLabel } : { price: 0, label: "" };
}

interface OrderForm {
  customerPhone: string;
  lookupPin: string;
  customerName: string;
  duration: number;
  customerFb: string;
  customerEmail: string;
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [grouped, setGrouped] = useState<Record<string, ServiceSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceSlot | null>(null);
  const [form, setForm] = useState<OrderForm>({ customerPhone: "", lookupPin: "", customerName: "", duration: 1, customerFb: "", customerEmail: "" });
  const [submitting, setSubmitting] = useState(false);
  const [existingOrder, setExistingOrder] = useState<{ id: string; serviceName: string } | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [shopDescription, setShopDescription] = useState("Đăng ký dịch vụ với giá tốt nhất");
  const [contactFacebook, setContactFacebook] = useState("");
  const [contactTelegram, setContactTelegram] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ id: string; code: string; discountType: string; discountValue: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [sharedId, setSharedId] = useState<string | null>(null);

  function shareService(slot: ServiceSlot) {
    const param = slot.slug || slot.id;
    const url = `${window.location.origin}/shop?service=${param}`;
    if (navigator.share) {
      navigator.share({ title: slot.serviceName, text: `Đăng ký ${slot.serviceName}`, url });
    } else {
      navigator.clipboard.writeText(url);
      setSharedId(slot.id);
      setTimeout(() => setSharedId(null), 1500);
    }
  }

  useEffect(() => {
    fetch("/api/shop/services")
      .then(r => r.json())
      .then(data => {
        const services: Record<string, ServiceSlot[]> = data.services || data;
        setGrouped(services);
        if (data.shopDescription) setShopDescription(data.shopDescription);
        if (data.contactFacebook) setContactFacebook(data.contactFacebook);
        if (data.contactTelegram) setContactTelegram(data.contactTelegram);
        setLoading(false);

        // Auto-open service from ?service= param (accepts slug or id)
        const serviceId = searchParams.get("service");
        if (serviceId) {
          const allSlots = Object.values(services).flat();
          const slot = allSlots.find(s => s.slug === serviceId || s.id === serviceId);
          if (slot && !slot.isFull) {
            const firstDuration = getAvailableDurations(slot)[0]?.months || 1;
            setSelected(slot);
            setForm({ customerPhone: "", lookupPin: "", customerName: "", duration: firstDuration, customerFb: "", customerEmail: "" });
          }
        }
      });
  }, [searchParams]);

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

  async function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setCheckingPromo(true);
    setPromoError("");
    try {
      const res = await fetch(`/api/shop/promo-codes?code=${encodeURIComponent(code)}&accountId=${selected?.id || ""}`);
      const data = await res.json();
      if (res.ok) {
        setPromoApplied(data);
        setPromoError("");
      } else {
        setPromoApplied(null);
        setPromoError(data.error || "Mã không hợp lệ");
      }
    } catch {
      setPromoError("Có lỗi xảy ra");
    }
    setCheckingPromo(false);
  }

  function calcTotal(): number {
    if (!selected) return 0;
    const priceMap: Record<number, number> = { 1: selected.price1m, 3: selected.price3m, 6: selected.price6m, 12: selected.price12m };
    let total = priceMap[form.duration] || 0;
    if (promoApplied) {
      if (promoApplied.discountType === "percent") {
        total = total * (1 - promoApplied.discountValue / 100);
      } else {
        total = Math.max(0, total - promoApplied.discountValue);
      }
    }
    return Math.round(total);
  }

  function calcOriginalTotal(): number {
    if (!selected) return 0;
    const priceMap: Record<number, number> = { 1: selected.price1m, 3: selected.price3m, 6: selected.price6m, 12: selected.price12m };
    return priceMap[form.duration] || 0;
  }

  async function submitOrder() {
    if (!selected) return;
    if (!form.customerPhone.trim()) {
      toast("Vui lòng nhập số điện thoại", "error");
      return;
    }
    if (form.lookupPin.length !== 4) {
      toast("Vui lòng đặt mã PIN 4 số để tra cứu tài khoản sau", "error");
      return;
    }
    if (selected.requireEmail && !form.customerEmail.trim()) {
      toast("Vui lòng nhập email để được mời vào nhóm", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selected.id,
          ...form,
          lookupPin: form.lookupPin.trim(),
          promoCodeId: promoApplied?.id || null,
        }),
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
        <p className="text-gray-600 text-sm">{shopDescription}</p>
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
          <section key={type} className={entries.length === 1 && slots.length === 1 ? "flex flex-col items-center" : ""}>
            <h2 className={`text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 ${entries.length === 1 && slots.length === 1 ? "self-start w-full sm:w-120" : ""}`}>
              {slots[0].serviceIcon} {slots[0].serviceName}
            </h2>
            <div className={slots.length === 1 ? "flex justify-center w-full" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"}>
              {slots.map(slot => (
                <div
                  key={slot.id}
                  className={`${slots.length === 1 ? 'w-full sm:w-[480px]' : ''} bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-3`}
                >
                  <div className={`text-3xl shrink-0 ${slot.isFull ? "opacity-50 grayscale" : ""}`}>{slot.serviceIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${slot.isFull ? "text-gray-400" : "text-gray-900"}`}>{slot.serviceName}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`text-sm font-bold ${slot.isFull ? "text-gray-400" : "text-blue-600"}`}>{formatCurrency(getDisplayPrice(slot).price)}{getDisplayPrice(slot).label}</span>
                      <span className="text-gray-300 text-xs">·</span>
                      {slot.isFull
                        ? <span className="text-xs text-red-400 font-medium">{slot.isSolo ? "Hết tài khoản" : "Hết slot"}</span>
                        : slot.isSolo
                          ? <span className="text-xs text-purple-600 font-medium">Còn {slot.freeSlots} tài khoản</span>
                          : <span className="text-xs text-green-600 font-medium">Còn {slot.freeSlots} slot</span>
                      }
                    </div>
                  </div>
                  {slot.isFull ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      {contactFacebook && (
                        <a href={contactFacebook} target="_blank" rel="noopener noreferrer"
                          className="flex-1 sm:flex-none px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold text-center hover:bg-blue-200 transition-colors">
                          Inbox Facebook của Đăng
                        </a>
                      )}
                      {contactTelegram && (
                        <a href={contactTelegram} target="_blank" rel="noopener noreferrer"
                          className="flex-1 sm:flex-none px-3 py-2 bg-sky-100 text-sky-700 rounded-xl text-sm font-semibold text-center hover:bg-sky-200 transition-colors">
                          Telegram
                        </a>
                      )}
                      {!contactFacebook && !contactTelegram && (
                        <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold">Hết slot</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => { const firstDuration = getAvailableDurations(slot)[0]?.months || 1; setSelected(slot); setForm({ customerPhone: "", lookupPin: "", customerName: "", duration: firstDuration, customerFb: "", customerEmail: "" }); setExistingOrder(null); setPromoCode(""); setPromoApplied(null); setPromoError(""); }}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${slot.isSolo ? "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800" : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"}`}
                      >
                        {slot.isSolo ? "Mua ngay" : "Đặt slot"}
                      </button>
                      <button
                        onClick={() => shareService(slot)}
                        title="Chia sẻ dịch vụ này"
                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${sharedId === slot.id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {sharedId === slot.id ? "✓" : "🔗"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Quick lookup link */}
      {!loading && entries.length > 0 && (
        <div className="text-center mt-2">
          <Link href="/shop/lookup" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            Đã đặt hàng? <span className="underline font-medium">Tra cứu đơn hàng</span>
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
                <p className="text-sm text-blue-600 font-semibold">{formatCurrency(getDisplayPrice(selected).price)}{getDisplayPrice(selected).label}</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-gray-400 text-xl hover:text-gray-600">✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Phone field — first */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SĐT / Zalo *</label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={form.customerPhone}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  autoFocus
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên của bạn <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              {/* Duration selector — button group */}
              {(() => {
                const durations = getAvailableDurations(selected);
                return durations.length > 1 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời hạn đăng ký</label>
                    <div className="grid grid-cols-2 gap-2">
                      {durations.map(d => (
                        <button
                          key={d.months}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, duration: d.months }))}
                          className={`py-2.5 px-3 rounded-xl text-sm border-2 transition-colors text-left ${
                            form.duration === d.months
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <span className="font-semibold">{d.label}</span>
                          <span className="block text-xs mt-0.5 font-bold">{formatCurrency(d.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Email field — shown when account requires email */}
              {selected.requireEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email của bạn <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={form.customerEmail}
                    onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Dịch vụ này cần email để mời bạn vào nhóm.</p>
                </div>
              )}

              {/* Facebook field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Facebook <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                <input
                  type="url"
                  placeholder="https://fb.com/..."
                  value={form.customerFb}
                  onChange={e => setForm(f => ({ ...f, customerFb: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              {/* Promo code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: GIAM20"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                    disabled={!!promoApplied}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-base font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:bg-gray-50"
                  />
                  {promoApplied ? (
                    <button
                      type="button"
                      onClick={() => { setPromoApplied(null); setPromoCode(""); setPromoError(""); }}
                      className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors shrink-0"
                    >
                      Hủy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyPromo}
                      disabled={!promoCode.trim() || checkingPromo}
                      className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-200 disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      {checkingPromo ? "..." : promoCode.trim() ? "Áp dụng" : "Nhập mã"}
                    </button>
                  )}
                </div>
                {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                {promoApplied && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Áp dụng mã <strong>{promoApplied.code}</strong> — giảm {promoApplied.discountType === "percent" ? `${promoApplied.discountValue}%` : formatCurrency(promoApplied.discountValue)}
                  </p>
                )}
              </div>

              {/* PIN field — cuối cùng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã PIN tra cứu <span className="text-red-400 font-normal">*</span> <span className="text-gray-500 font-normal">(4 số để xem tài khoản)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="VD: 1234"
                  value={form.lookupPin}
                  onChange={e => setForm(f => ({ ...f, lookupPin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
                {form.lookupPin.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-1.5">💡 Tự đặt 4 số dễ nhớ. Bắt buộc để xem tài khoản sau khi admin duyệt.</p>
                ) : form.lookupPin.length === 4 ? (
                  <p className="text-xs text-green-600 mt-1.5">✅ Ghi nhớ PIN này để tra cứu tài khoản.</p>
                ) : (
                  <p className="text-xs text-red-500 mt-1.5">Nhập đủ 4 số.</p>
                )}
              </div>
            </div>

            {/* Total with discount */}
            {promoApplied && (
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-gray-600">Tổng gốc: <span className="line-through">{formatCurrency(calcOriginalTotal())}</span></span>
                <span className="font-bold text-green-700">→ {formatCurrency(calcTotal())}</span>
              </div>
            )}

            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Đang xử lý..." : calcTotal() === 0 ? "✅ Xác nhận đăng ký miễn phí" : `Tiếp tục → Thanh toán ${formatCurrency(calcTotal())}`}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Đơn hàng có hiệu lực 2 giờ. Thanh toán để xác nhận đăng ký.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
