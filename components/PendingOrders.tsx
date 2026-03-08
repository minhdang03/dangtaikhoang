"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface PendingOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerFb: string;
  amount: number;
  serviceName: string;
  serviceIcon: string;
  accountLabel: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
}

export function PendingOrders() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/orders");
    setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function confirm(id: string) {
    setProcessing(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    if (res.ok) {
      toast("Đã xác nhận đơn hàng ✓");
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      toast("Có lỗi xảy ra", "error");
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

  if (loading || orders.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold text-blue-500 mb-3 uppercase tracking-wider">🛒 Đơn đặt slot mới ({orders.length})</h2>
      <div className="flex flex-col gap-2">
        {orders.map(o => (
          <div key={o.id} className="bg-white rounded-2xl p-4 shadow-xs border border-blue-100">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{o.serviceIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{o.customerName}</p>
                <p className="text-sm text-gray-500">{o.customerPhone}</p>
                {o.customerFb && (
                  <a href={o.customerFb} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 truncate block">{o.customerFb}</a>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{o.serviceName} · {o.accountLabel}</p>
              </div>
              <span className="font-bold text-blue-600 text-sm shrink-0">{formatCurrency(o.amount)}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => confirm(o.id)}
                disabled={processing === o.id}
                className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {processing === o.id ? "..." : "✓ Xác nhận"}
              </button>
              <button
                onClick={() => expire(o.id)}
                disabled={processing === o.id}
                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
