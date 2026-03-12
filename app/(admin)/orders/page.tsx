"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Order {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerFb: string;
  amount: number;
  duration: number;
  customerConfirmed: boolean;
  paymentProof?: string | null;
  serviceName: string;
  serviceIcon: string;
  accountLabel: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
}

const TABS = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "confirmed", label: "Đã duyệt" },
  { key: "expired", label: "Hết hạn" },
];

const DURATION_LABEL: Record<number, string> = { 1: "1 tháng", 3: "3 tháng", 6: "6 tháng", 12: "1 năm" };

export default function OrdersPage() {
  const [tab, setTab] = useState("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);

  async function load(status: string) {
    setLoading(true);
    const res = await fetch(`/api/orders?status=${status}`);
    setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(tab); }, [tab]);

  async function confirm(id: string) {
    setProcessing(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      const data = await res.json().catch(() => ({ error: "Có lỗi xảy ra" }));
      if (res.ok) {
        toast("Đã xác nhận đơn hàng ✓");
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        window.alert(data.error || "Có lỗi xảy ra");
      }
    } catch {
      toast("Lỗi kết nối", "error");
    }
    setProcessing(null);
  }

  async function expire(id: string) {
    setProcessing(id);
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "expired" }),
    });
    setOrders(prev => prev.filter(o => o.id !== id));
    setProcessing(null);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Đơn hàng shop</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">🛍️</div>
          <p className="text-gray-500">Không có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map(o => (
            <div key={o.id} className={`bg-white rounded-2xl p-4 shadow-xs border ${o.customerConfirmed && o.status === "pending" ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
              {/* Header row */}
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{o.serviceIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{o.customerName?.trim() || o.customerPhone}</p>
                    {o.customerConfirmed && o.status === "pending" && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Đã CK</span>
                    )}
                    {o.status === "confirmed" && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">✓ Đã duyệt</span>
                    )}
                    {o.status === "expired" && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Hết hạn</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{o.customerPhone}</p>
                  {o.customerFb && (
                    <a href={o.customerFb} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 truncate block">{o.customerFb}</a>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {o.serviceName} · {o.accountLabel} · {DURATION_LABEL[o.duration] || `${o.duration}th`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-blue-600">{formatCurrency(o.amount)}</p>
                  <p className="text-xs text-gray-400">{formatTime(o.createdAt)}</p>
                </div>
              </div>

              {/* Payment proof */}
              {o.paymentProof && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">📷 Ảnh chuyển khoản:</p>
                  <button onClick={() => setViewProof(o.paymentProof!)}>
                    <Image
                      src={o.paymentProof}
                      alt="Ảnh chuyển khoản"
                      width={120} height={120}
                      className="rounded-lg border border-gray-200 object-cover hover:opacity-80"
                      unoptimized
                    />
                  </button>
                </div>
              )}

              {/* Actions */}
              {o.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => confirm(o.id)}
                    disabled={processing === o.id}
                    className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-green-600 transition-colors"
                  >
                    {processing === o.id ? "..." : "✓ Xác nhận"}
                  </button>
                  <button
                    onClick={() => expire(o.id)}
                    disabled={processing === o.id}
                    className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-size image viewer */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="relative max-w-lg max-h-[80vh]">
            <Image src={viewProof} alt="Ảnh chuyển khoản" width={500} height={500}
              className="rounded-xl object-contain max-h-[80vh]" unoptimized />
            <button onClick={() => setViewProof(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 text-gray-800 rounded-full flex items-center justify-center text-lg">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
