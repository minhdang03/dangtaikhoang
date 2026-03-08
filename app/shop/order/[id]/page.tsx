"use client";
import { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CopyButton } from "@/components/ui/CopyButton";

interface OrderDetail {
  id: string;
  status: string;
  amount: number;
  customerName: string;
  customerConfirmed?: boolean;
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
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const countdown = useCountdown(order?.expiresAt || new Date(Date.now() + 99999999).toISOString());

  useEffect(() => {
    const stored = sessionStorage.getItem(`order_${id}`);
    if (stored) {
      const data = JSON.parse(stored);
      setOrder(data);
      setConfirmed(!!data.customerConfirmed);
      setLoading(false);
      return;
    }
    fetch(`/api/shop/orders/${id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setConfirmed(!!data.customerConfirmed);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `order_${id}` && e.newValue) {
        const data = JSON.parse(e.newValue);
        setOrder(data);
        setConfirmed(!!data.customerConfirmed);
        setLoading(false);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [id]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn, vui lòng chọn ảnh dưới 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitConfirmation() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/shop/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProof: proofPreview }),
      });
      if (res.ok) {
        setConfirmed(true);
        setShowConfirmDialog(false);
      }
    } catch {
      // ignore
    }
    setConfirming(false);
  }

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

  // --- Confirmed state ---
  if (isConfirmed) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 text-center max-w-md mx-auto">
        <div className="text-6xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900">Đã xác nhận!</h2>
        <p className="text-gray-500">Đăng ký {order.serviceName} của bạn đã được kích hoạt.</p>
        <Link
          href="/shop/lookup"
          className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
        >
          🔍 Xem thông tin tài khoản
        </Link>
        <p className="text-xs text-gray-400">Nhập SĐT để xem email/mật khẩu đăng nhập</p>
      </div>
    );
  }

  // --- Expired state ---
  if (isExpired) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 text-center max-w-md mx-auto">
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

  // --- Active order ---
  return (
    <div className="flex flex-col gap-4 pb-8 max-w-lg mx-auto">
      {/* Order summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
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

      {/* Payment info — only shown if customer hasn't confirmed yet */}
      {!confirmed && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-4 py-3">
            <h3 className="font-semibold text-white text-sm">Thông tin chuyển khoản</h3>
          </div>

          {order.bankInfo?.accountNo ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngân hàng</span>
                  <span className="font-medium text-gray-900">{order.bankInfo.bankId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{order.bankInfo.accountNo}</span>
                    <CopyButton text={order.bankInfo.accountNo} label="Copy" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chủ tài khoản</span>
                  <span className="font-medium text-gray-900">{order.bankInfo.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Số tiền</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{formatCurrency(order.amount)}</span>
                    <CopyButton text={String(order.amount)} label="Copy" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Nội dung CK</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-700">DK {order.id.slice(0, 8).toUpperCase()}</span>
                    <CopyButton text={`DK ${order.id.slice(0, 8).toUpperCase()}`} label="Copy" />
                  </div>
                </div>
              </div>

              {/* QR Code inline */}
              {order.qrUrl && (
                <div className="flex flex-col items-center gap-2 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Quét QR để chuyển khoản nhanh</p>
                  <a href={order.qrUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={order.qrUrl}
                      alt="QR chuyển khoản"
                      width={180}
                      height={180}
                      className="rounded-xl"
                      unoptimized
                    />
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Confirmation section */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        {confirmed ? (
          <div className="text-center py-3">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-gray-900">Đã báo chuyển khoản</p>
            <p className="text-sm text-gray-500 mt-1">Admin sẽ xác nhận trong vài phút.</p>
            <p className="text-xs text-gray-400 mt-2">Sau khi xác nhận, vào <Link href="/shop/lookup" className="text-blue-600 underline">Tra cứu</Link> để xem tài khoản.</p>
          </div>
        ) : (
          <>
            {/* Upload proof (optional) */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Ảnh chuyển khoản <span className="text-gray-400 font-normal">(không bắt buộc)</span></p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              {proofPreview ? (
                <div className="relative inline-block">
                  <Image
                    src={proofPreview}
                    alt="Ảnh chuyển khoản"
                    width={160}
                    height={160}
                    className="rounded-xl border border-gray-200 object-cover"
                    unoptimized
                  />
                  <button
                    onClick={() => { setProofPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  📷 Chọn ảnh từ thư viện
                </button>
              )}
            </div>

            <button
              onClick={() => setShowConfirmDialog(true)}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Đã chuyển khoản
            </button>

            <p className="text-xs text-gray-400 text-center mt-2">
              Nhấn sau khi đã chuyển khoản thành công
            </p>
          </>
        )}
      </div>

      {/* Steps */}
      {!confirmed && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-2 text-sm">Hướng dẫn</h3>
          <ol className="text-sm text-gray-500 flex flex-col gap-1.5 list-decimal list-inside">
            <li>Chuyển khoản theo thông tin ở trên</li>
            <li>Nhấn &quot;Đã chuyển khoản&quot; để thông báo admin</li>
            <li>Admin xác nhận trong vòng vài phút</li>
            <li>Vào <Link href="/shop/lookup" className="text-blue-600 underline">Tra cứu</Link> để xem thông tin đăng nhập</li>
          </ol>
        </div>
      )}

      <Link href="/shop" className="text-center text-sm text-gray-400 py-2">
        ← Quay lại shop
      </Link>

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setShowConfirmDialog(false)}
        >
          <div
            className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">💸</div>
              <h3 className="font-bold text-gray-900 text-lg">Xác nhận chuyển khoản</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bạn đã chuyển <span className="font-bold text-blue-600">{formatCurrency(order.amount)}</span> thành công?
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={submitConfirmation}
                disabled={confirming}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {confirming ? "Đang gửi..." : "Đúng, tôi đã chuyển"}
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Chưa, tôi nhầm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
