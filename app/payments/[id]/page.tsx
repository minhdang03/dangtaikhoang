"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatMonth, formatDate } from "@/lib/utils";

interface PaymentDetail {
  id: string;
  amount: number;
  month: string;
  status: string;
  note: string;
  paidAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; phone: string };
  account?: { id: string; label: string; service?: { icon: string; name: string } };
  qrUrl: string | null;
  bankInfo: { bankId: string; accountNo: string; accountName: string };
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/payments/${id}`);
    setPayment(await res.json());
  }

  useEffect(() => { load(); }, [id]);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setLoading(false);
    load();
  }

  async function unconfirm() {
    await fetch(`/api/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending", paidAt: null }),
    });
    load();
  }

  async function deletePayment() {
    if (!window.confirm("Xoá phiếu thu này?")) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    router.push("/payments");
  }

  if (!payment) return <div className="text-center py-10 text-gray-400">Đang tải...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 text-2xl">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Phiếu thu</h1>
          <p className="text-sm text-gray-500">{formatMonth(payment.month)}</p>
        </div>
        <Badge variant={payment.status === "paid" ? "green" : payment.status === "overdue" ? "red" : "yellow"}>
          {payment.status === "paid" ? "Đã TT" : payment.status === "overdue" ? "Trễ" : "Chờ TT"}
        </Badge>
      </div>

      {/* Payment info */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-3">
        <Row label="Người dùng" value={
          <Link href={`/users/${payment.user?.id}`} className="text-blue-600 font-medium">
            {payment.user?.name}
          </Link>
        } />
        <Row label="SĐT" value={
          <a href={`tel:${payment.user?.phone}`} className="text-blue-600">{payment.user?.phone}</a>
        } />
        <Row label="Dịch vụ" value={
          <Link href={`/accounts/${payment.account?.id}`} className="text-gray-900">
            {payment.account?.service?.icon} {payment.account?.label}
          </Link>
        } />
        <Row label="Số tiền" value={
          <span className="text-xl font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
        } />
        {payment.paidAt && (
          <Row label="Đã TT lúc" value={<span className="text-green-600">{formatDate(payment.paidAt)}</span>} />
        )}
        {payment.note && (
          <div className="pt-2 border-t border-gray-50 text-sm text-gray-500">{payment.note}</div>
        )}
      </div>

      {/* Bank info + QR */}
      {payment.status === "pending" && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Thông tin chuyển khoản</h2>

          {payment.bankInfo.accountNo ? (
            <>
              <div className="flex flex-col gap-2 text-sm">
                <Row label="Ngân hàng" value={payment.bankInfo.bankId} />
                <Row label="Số tài khoản" value={
                  <span className="font-mono font-bold text-gray-900">{payment.bankInfo.accountNo}</span>
                } />
                <Row label="Chủ tài khoản" value={payment.bankInfo.accountName} />
                <Row label="Số tiền" value={<span className="font-bold text-blue-600">{formatCurrency(payment.amount)}</span>} />
              </div>

              {payment.qrUrl && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500">Quét QR để chuyển khoản</p>
                  <div className="relative w-56 h-56 rounded-2xl overflow-hidden border border-gray-100">
                    <Image
                      src={payment.qrUrl}
                      alt="VietQR"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <a
                    href={payment.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 underline"
                  >
                    Mở QR to hơn
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">Chưa cấu hình tài khoản ngân hàng.</p>
              <Link href="/settings" className="text-blue-600 text-sm font-medium">
                Cài đặt ngay →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {payment.status === "pending" ? (
          <Button onClick={confirm} loading={loading} size="lg" className="w-full">
            ✅ Xác nhận đã nhận tiền
          </Button>
        ) : (
          <Button variant="secondary" onClick={unconfirm} className="w-full">
            ↩️ Hoàn tác xác nhận
          </Button>
        )}
        <Button variant="danger" onClick={deletePayment} className="w-full">
          🗑️ Xoá phiếu thu
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
