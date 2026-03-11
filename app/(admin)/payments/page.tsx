"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatMonth, currentMonth } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Payment {
  id: string;
  amount: number;
  month: string;
  status: string;
  user?: { id: string; name: string };
  account?: { label: string; service?: { icon: string } };
}

export default function PaymentsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function load(m: string) {
    setLoading(true);
    const res = await fetch(`/api/payments?month=${m}`);
    setPayments(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(month); }, [month]);

  async function generateMonthPayments() {
    if (!window.confirm(`Tạo phiếu thu cho tất cả người dùng tháng ${formatMonth(month)}?`)) return;
    setGenerating(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk: true, month }),
    });
    const data = await res.json();
    setGenerating(false);
    toast(`Đã tạo ${data.created} phiếu thu mới`);
    load(month);
  }

  async function markPaid(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "paid" } : p));
    const res = await fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    if (res.ok) {
      toast("Đã xác nhận thanh toán ✓");
    } else {
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "pending" } : p));
      toast("Có lỗi xảy ra", "error");
    }
  }

  const pending = payments.filter(p => p.status === "pending");
  const paid = payments.filter(p => p.status === "paid");
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);
  const totalPaid = paid.reduce((s, p) => s + p.amount, 0);

  const months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Thanh toán</h1>
        <Button size="sm" onClick={generateMonthPayments} loading={generating} variant="secondary">
          📋 Tạo phiếu thu
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map(m => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${month === m
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200"
              }`}
          >
            {formatMonth(m)}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs text-green-600 mb-1">Đã thu ({paid.length})</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
          <p className="text-xs text-yellow-600 mb-1">Chờ thu ({pending.length})</p>
          <p className="text-lg font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-gray-500">Chưa có phiếu thu nào tháng này.</p>
          <p className="text-sm text-gray-400 mt-1">Nhấn "Tạo phiếu thu" để tạo tự động.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pending.length > 0 && (
            <>
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Chờ thanh toán</p>
              {pending.map(p => (
                <PaymentRow key={p.id} payment={p} onMarkPaid={() => markPaid(p.id)} />
              ))}
            </>
          )}
          {paid.length > 0 && (
            <>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-2">Đã thanh toán</p>
              {paid.map(p => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ payment: p, onMarkPaid }: { payment: Payment; onMarkPaid?: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 flex items-center gap-3 px-4 py-3">
      <Link href={`/payments/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl shrink-0">{p.account?.service?.icon || "📦"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{p.user?.name || "?"}</p>
          <p className="text-xs text-gray-400 truncate">{p.account?.label}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
          {p.status === "paid"
            ? <Badge variant="green">✓ Đã TT</Badge>
            : <Badge variant="yellow">⏳ Chờ TT</Badge>
          }
        </div>
      </Link>
      {onMarkPaid && (
        <button
          onClick={onMarkPaid}
          className="shrink-0 w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 active:bg-green-100 transition-colors"
          title="Xác nhận đã thu"
        >
          ✓
        </button>
      )}
    </div>
  );
}
