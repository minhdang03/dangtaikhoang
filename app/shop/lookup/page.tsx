"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface PendingOrder {
  id: string;
  serviceName: string;
  serviceIcon: string;
  amount: number;
  customerConfirmed: boolean;
  expiresAt: string;
}

interface Account {
  accountId: string;
  serviceName: string;
  serviceIcon: string;
  shareType: "account" | "invite" | "solo";
  email: string;
  password: string;
  slotLabel: string;
  endDate: string;
  joinLink: string;
  locked: boolean;
}

interface LookupResult {
  pendingOrders: PendingOrder[];
  accounts: Account[];
  accountCount: number;
  customerName: string | null;
  verified: boolean;
  hasPin: boolean | null; // null=user not found, false=no pin set, true=pin set
}

function OtpFetcher({ phone, pin, accountId }: { phone: string; pin: string; accountId: string }) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<{ value: string; date: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setCode(null);
    setError(null);
    try {
      const res = await window.fetch(`/api/shop/codes?phone=${encodeURIComponent(phone)}&pin=${encodeURIComponent(pin)}&accountId=${encodeURIComponent(accountId)}&type=otp`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Không lấy được mã");
      else if (data.result) setCode(data.result);
      else setError("Không tìm thấy mã OTP trong email");
    } catch {
      setError("Lỗi kết nối, thử lại sau");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔢</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Lấy mã OTP Netflix</p>
          <p className="text-xs text-gray-400">Netflix yêu cầu mã xác nhận khi đăng nhập</p>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang lấy..." : "Lấy mã"}
        </button>
      </div>

      {code && (
        <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold font-mono tracking-widest text-green-800">{code.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{code.date}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(code.value)}
            className="text-sm text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium shrink-0"
          >
            Copy
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
      )}
    </div>
  );
}

function AccountCard({ acc }: { acc: Account }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const endDateStr = acc.endDate ? new Date(acc.endDate).toLocaleDateString("vi-VN") : "";
  const isInvite = acc.shareType === "invite";
  const isSolo = acc.shareType === "solo";

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{acc.serviceIcon}</span>
        <div>
          <p className="font-semibold text-gray-900">{acc.serviceName}</p>
          {!isSolo && <p className="text-xs text-gray-400">{acc.slotLabel}</p>}
        </div>
        {endDateStr && (
          <span className="ml-auto text-xs text-gray-400">HSD: {endDateStr}</span>
        )}
      </div>

      {isInvite ? (
        acc.joinLink ? (
          <a
            href={acc.joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            🔗 Tham gia {acc.serviceName} →
          </a>
        ) : (
          <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 text-center">
            ⏳ Admin đang xử lý lời mời. Vui lòng chờ hoặc liên hệ admin.
          </div>
        )
      ) : (
        <>
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-500 shrink-0">Email</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-gray-900 text-xs select-all truncate">{acc.email}</span>
                <button
                  onClick={() => copy(acc.email, "email")}
                  className={`text-xs shrink-0 font-medium transition-colors ${copied === "email" ? "text-green-600" : "text-gray-400 hover:text-blue-500"}`}
                >
                  {copied === "email" ? "✓" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-500 shrink-0">Mật khẩu</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-gray-900 text-xs select-all">
                  {show ? acc.password : "•".repeat(Math.min(acc.password.length, 10))}
                </span>
                <button
                  onClick={() => setShow(s => !s)}
                  className="text-xs text-blue-600 font-medium shrink-0 underline"
                >
                  {show ? "Ẩn" : "Hiện"}
                </button>
                {show && (
                  <button
                    onClick={() => copy(acc.password, "password")}
                    className={`text-xs shrink-0 font-medium transition-colors ${copied === "password" ? "text-green-600" : "text-gray-400 hover:text-blue-500"}`}
                  >
                    {copied === "password" ? "✓" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>
          {acc.joinLink && (
            <a
              href={acc.joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full block text-center py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Tham gia nhóm →
            </a>
          )}
        </>
      )}
    </div>
  );
}

export default function LookupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [searched, setSearched] = useState(false);

  // PIN verification
  const [pin, setPin] = useState("");
  const [verifiedPin, setVerifiedPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = phone.trim();
    if (!p || p.length < 4) return;
    setLoading(true);
    setSearched(true);
    setResult(null);
    setShowUnlockForm(false);
    setPin("");
    setVerifiedPin("");
    setUnlockError("");
    try {
      const res = await fetch(`/api/shop/lookup?phone=${encodeURIComponent(p)}`);
      if (res.ok) setResult(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function unlockWithPin(pinValue: string) {
    if (pinValue.length !== 4) {
      setUnlockError("Mã PIN gồm 4 chữ số");
      return;
    }
    setUnlocking(true);
    setUnlockError("");
    try {
      const res = await fetch(
        `/api/shop/lookup?phone=${encodeURIComponent(phone.trim())}&pin=${encodeURIComponent(pinValue)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setShowUnlockForm(false);
        setVerifiedPin(pinValue);
      } else {
        const err = await res.json();
        setUnlockError(err.error || "Mã PIN không đúng, vui lòng thử lại");
      }
    } catch {
      setUnlockError("Có lỗi xảy ra, thử lại sau");
    }
    setUnlocking(false);
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    await unlockWithPin(pin.trim());
  }

  function openUnlock() {
    setShowUnlockForm(true);
    setPin("");
    setUnlockError("");
    setTimeout(() => pinRef.current?.focus(), 100);
  }

  const hasResults = result && (result.pendingOrders.length > 0 || result.accountCount > 0);

  function getExpiryText(expiresAt: string): string | null {
    const mins = Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000);
    if (mins <= 0) return null;
    if (mins < 60) return `⏰ còn ${mins} phút`;
    return `⏰ còn ${Math.ceil(mins / 60)} giờ`;
  }

  return (
    <div className="flex flex-col gap-5 pb-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900">Tra cứu đơn hàng</h2>
        <p className="text-sm text-gray-500 mt-1">Xem đơn hàng hoặc thông tin tài khoản</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="tel"
          placeholder="Số điện thoại đã đăng ký..."
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || phone.trim().length < 4}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0 min-w-[72px]"
        >
          {loading ? "..." : "Tìm"}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-gray-400 text-sm">Đang tìm kiếm...</div>
      )}

      {/* Not found */}
      {searched && !loading && !hasResults && (
        <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
          <div className="text-3xl mb-3">🔍</div>
          <p className="font-medium text-gray-700">Không tìm thấy kết quả</p>
          <p className="text-sm text-gray-400 mt-1">Kiểm tra lại số điện thoại đã đăng ký</p>
          <Link href="/shop" className="text-blue-600 text-sm mt-3 inline-block font-medium">
            ← Quay lại shop
          </Link>
        </div>
      )}

      {/* Results */}
      {result && hasResults && !loading && (
        <>
          {/* Greeting — fallback về SĐT nếu không có tên */}
          <div className="flex items-center gap-2">
            <span className="text-lg">👋</span>
            <p className="font-semibold text-gray-900">Xin chào, {result.customerName || phone}</p>
          </div>

          {/* Pending orders */}
          {result.pendingOrders.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Đơn hàng ({result.pendingOrders.length})
              </p>
              {result.pendingOrders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{o.serviceIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{o.serviceName}</p>
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(o.amount)}</p>
                    </div>
                    {/* State badge */}
                    {o.customerConfirmed ? (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium shrink-0">
                        ⏳ Chờ duyệt
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Link
                          href={`/shop/order/${o.id}`}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-medium hover:bg-blue-700 transition-colors"
                        >
                          Thanh toán →
                        </Link>
                        {getExpiryText(o.expiresAt) && (
                          <span className="text-xs text-orange-500">{getExpiryText(o.expiresAt)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Waiting message for confirmed orders */}
                  {o.customerConfirmed && (
                    <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500 flex items-start gap-1.5">
                      <span>ℹ️</span>
                      <span>Bạn đã báo chuyển khoản. Đang chờ admin kiểm tra và xác nhận.</span>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Active accounts section */}
          {result.accountCount > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tài khoản đang dùng ({result.accountCount} dịch vụ)
              </p>

              {/* Not verified yet */}
              {!result.verified && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  {/* No PIN set — show contact admin message */}
                  {result.hasPin === false ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl shrink-0">
                        ⚠️
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Chưa có mã PIN</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          Đơn hàng này chưa được đặt mã PIN tra cứu. Vui lòng liên hệ admin để được hỗ trợ đặt lại PIN.
                        </p>
                      </div>
                    </div>
                  ) : !showUnlockForm ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl shrink-0">
                        🔒
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Thông tin bị khóa</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Nhập mã PIN để xem email & mật khẩu
                        </p>
                      </div>
                      <button
                        onClick={openUnlock}
                        className="text-sm text-blue-600 font-medium shrink-0 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Mở khóa
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUnlock} className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1.5">
                          Nhập mã PIN <span className="text-gray-400 font-normal">(4 số bạn đã đặt khi đăng ký)</span>
                        </p>
                        <input
                          ref={pinRef}
                          type="text"
                          inputMode="numeric"
                          pattern="\d{4}"
                          maxLength={4}
                          value={pin}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setPin(val);
                            setUnlockError("");
                            if (val.length === 4) unlockWithPin(val);
                          }}
                          placeholder="● ● ● ●"
                          className="w-full px-4 py-4 rounded-xl border border-gray-200 text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-center"
                        />
                        {unlockError && (
                          <p className="text-xs text-red-500 mt-1.5">{unlockError}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={unlocking || pin.length !== 4}
                          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
                        >
                          {unlocking ? "Đang kiểm tra..." : "Xác nhận"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowUnlockForm(false); setPin(""); setUnlockError(""); }}
                          className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Verified — show accounts */}
              {result.verified && result.accounts.map((acc, i) => (
                <AccountCard key={i} acc={acc} />
              ))}

              {/* OTP fetcher — show if has Netflix and PIN verified */}
              {result.verified && verifiedPin && result.accounts.some(a => a.serviceName.toLowerCase().includes("netflix")) && (
                <OtpFetcher phone={phone.trim()} pin={verifiedPin} accountId={result.accounts.find(a => a.serviceName.toLowerCase().includes("netflix"))?.accountId || ""} />
              )}
            </section>
          )}
        </>
      )}

      <Link href="/shop" className="text-center text-sm text-gray-400 py-1">
        ← Quay lại shop
      </Link>
    </div>
  );
}
