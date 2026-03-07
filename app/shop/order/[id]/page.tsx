"use client";
import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CopyButton } from "@/components/ui/CopyButton";

interface OrderDetail {
  id: string;
  status: string;
  amount: number;
  customerName: string;
  serviceName: string;
  serviceIcon: string;
  createdAt: string;
  expiresAt: string;
  qrUrl?: string;
  bankInfo?: { bankId: string; accountNo: string; accountName: string };
}

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Hết hạn"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown(order?.expiresAt || new Date(Date.now() + 99999999).toISOString());

  useEffect(() => {
    // Fetch order info (includes qrUrl from creation, stored in URL)
    const stored = sessionStorage.getItem(`order_${id}`);
    if (stored) {
      setOrder(JSON.parse(stored));
      setLoading(false);
      return;
    }
    fetch(`/api/shop/orders/${id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
  }, [id]);

  // Store order data from navigation (set by shop page after creation)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `order_${id}` && e.newValue) {
        setOrder(JSON.parse(e.newValue));
        setLoading(false);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [id]);

  if (loading) return (
    <div className="text-center py-12 text-gray-400">Đang tải...</div>
  );

  if (!order) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Không tìm thấy đơn hàng.</p>
      <Link href="/shop" className="text-blue-600 text-sm mt-2 block">← Quay lại shop</Link>
    </div>
  );

  const isExpired = order.status === "expired" || countdown === "Hết hạn";
  const isConfirmed = order.status === "confirmed";

  if (isConfirmed) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900">Đã xác nhận!</h2>
        <p className="text-gray-500">Đăng ký {order.serviceName} của bạn đã được kích hoạt.</p>
        <p className="text-sm text-gray-400">Admin sẽ liên hệ qua SĐT/Zalo để cung cấp thông tin đăng nhập.</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div className="text-5xl">⏰</div>
        <h2 className="text-xl font-bold text-gray-900">Đơn hàng hết hạn</h2>
        <p className="text-gray-500">Đơn hàng đã quá 2 giờ mà không có thanh toán.</p>
        <Link
          href="/shop"
          className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
        >
          Đặt lại
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Order summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{order.serviceIcon}</span>
          <div>
            <p className="font-bold text-gray-900">{order.serviceName}</p>
            <p className="text-sm text-gray-500">Xin chào, {order.customerName}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-blue-600">{formatCurrency(order.amount)}</p>
            <p className="text-xs text-gray-400">1 tháng</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
          <span>Mã đơn: <span className="font-mono text-gray-600">{order.id.slice(0, 8).toUpperCase()}</span></span>
          <span className={`font-semibold ${countdown === "Hết hạn" ? "text-red-500" : "text-orange-500"}`}>
            ⏱ Còn {countdown}
          </span>
        </div>
      </div>

      {/* Payment instructions */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-3">Chuyển khoản để hoàn tất</h3>

        {order.bankInfo?.accountNo ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-600">Ngân hàng</span>
              <span className="font-medium text-gray-900">{order.bankInfo.bankId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">Số tài khoản</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900">{order.bankInfo.accountNo}</span>
                <CopyButton text={order.bankInfo.accountNo} label="Copy" />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Chủ tài khoản</span>
              <span className="font-medium text-gray-900">{order.bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">Số tiền</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700">{formatCurrency(order.amount)}</span>
                <CopyButton text={String(order.amount)} label="Copy" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">Nội dung CK</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-700">DK {order.id.slice(0, 8).toUpperCase()}</span>
                <CopyButton text={`DK ${order.id.slice(0, 8).toUpperCase()}`} label="Copy" />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-blue-600">Liên hệ admin để nhận thông tin thanh toán.</p>
        )}
      </div>

      {/* QR Code */}
      {order.qrUrl && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">Quét QR để chuyển khoản nhanh</p>
          <a href={order.qrUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src={order.qrUrl}
              alt="QR chuyển khoản"
              width={200}
              height={200}
              className="rounded-xl"
              unoptimized
            />
          </a>
          <p className="text-xs text-gray-400">Nhấn vào QR để mở to</p>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-2 text-sm">Sau khi chuyển khoản</h3>
        <ol className="text-sm text-gray-500 flex flex-col gap-1.5 list-decimal list-inside">
          <li>Admin xác nhận trong vòng vài phút</li>
          <li>Bạn sẽ nhận được thông tin đăng nhập qua SĐT/Zalo</li>
        </ol>
      </div>

      <Link href="/shop" className="text-center text-sm text-gray-400 py-2">
        ← Quay lại xem dịch vụ khác
      </Link>
    </div>
  );
}
