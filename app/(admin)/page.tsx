import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tổng quan" };
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, currentMonth, daysUntil } from "@/lib/utils";
import { accountsDB, usersDB, subscriptionsDB, paymentsDB, servicesDB, settingsDB } from "@/lib/db";
import { PendingOrders } from "@/components/PendingOrders";

async function getDashboard() {
  const [accounts, users, allSubscriptions, payments, services, settings] = await Promise.all([
    accountsDB.getAll(),
    usersDB.getAll(),
    subscriptionsDB.getAll(),
    paymentsDB.getAll(),
    servicesDB.getAll(),
    settingsDB.get(),
  ]);
  const subscriptions = allSubscriptions.filter(s => s.status === "active");
  const month = currentMonth();
  const reminderDays = settings.reminderDays ?? 7;

  const monthPayments = payments.filter(p => p.month === month);
  const pendingPayments = monthPayments.filter(p => p.status === "pending");
  const paidPayments = monthPayments.filter(p => p.status === "paid");

  const expiringAccounts = accounts
    .map(a => ({ ...a, daysLeft: daysUntil(a.renewalDate) }))
    .filter(a => a.daysLeft <= 7 && a.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // User subscriptions expiring soon
  const expiringSlots = subscriptions
    .filter(s => s.endDate)
    .map(s => {
      const user = users.find(u => u.id === s.userId);
      const account = accounts.find(a => a.id === s.accountId);
      const service = account ? services.find(sv => sv.id === account.serviceId) : null;
      return { ...s, daysLeft: daysUntil(s.endDate), user, account, service };
    })
    .filter(s => s.daysLeft <= reminderDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    stats: {
      totalAccounts: accounts.length,
      totalUsers: users.length,
      activeSlots: subscriptions.length,
      totalRevenue: paidPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingRevenue: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
    },
    expiringAccounts: expiringAccounts.map(a => ({
      ...a,
      service: services.find(s => s.id === a.serviceId),
    })),
    expiringSlots,
    pendingPayments: pendingPayments.slice(0, 10).map(p => ({
      ...p,
      user: users.find(u => u.id === p.userId),
      account: (() => {
        const acc = accounts.find(a => a.id === p.accountId);
        return acc ? { ...acc, service: services.find(s => s.id === acc.serviceId) } : null;
      })(),
    })),
  };
}

export default async function DashboardPage() {
  const data = await getDashboard();

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-bold text-gray-900 mb-1">Chào mừng!</h2>
          <p className="text-gray-500 text-sm">Bắt đầu bằng cách thêm tài khoản và người dùng.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/accounts/new">
            <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
              <div className="text-2xl mb-1">➕</div>
              <p className="text-sm font-medium text-blue-700">Thêm tài khoản</p>
            </div>
          </Link>
          <Link href="/users/new">
            <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
              <div className="text-2xl mb-1">👤</div>
              <p className="text-sm font-medium text-green-700">Thêm người dùng</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const { stats, expiringAccounts, expiringSlots, pendingPayments } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Tổng quan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/accounts"><StatCard label="Tài khoản" value={stats.totalAccounts} icon="🔑" /></Link>
          <Link href="/users"><StatCard label="Người dùng" value={stats.totalUsers} icon="👥" /></Link>
          <Link href="/users"><StatCard label="Slots đang dùng" value={stats.activeSlots} icon="✅" /></Link>
          <Link href="/payments">
            <StatCard
              label="Chờ thanh toán"
              value={formatCurrency(stats.pendingRevenue)}
              icon="⏳"
              highlight={stats.pendingRevenue > 0}
            />
          </Link>
        </div>
      </section>

      {/* Expiring user slots */}
      {expiringSlots.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">🔔 Cần gia hạn ({expiringSlots.length})</h2>
          <div className="flex flex-col gap-2">
            {expiringSlots.map((slot) => (
              <div key={slot.id} className={`bg-white rounded-2xl shadow-xs border flex items-center ${slot.daysLeft < 0 ? "border-red-100 bg-red-50" : "border-orange-100"}`}>
                <Link href={`/accounts/${slot.accountId}`} className="flex-1 flex items-center gap-3 p-4 min-w-0">
                  <span className="text-xl shrink-0">{slot.service?.icon || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{slot.user?.name || slot.user?.phone || "?"}</p>
                    <p className="text-xs text-gray-400 truncate">{slot.service?.name} · {slot.slotLabel}</p>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0 pr-4">
                  <Badge variant={slot.daysLeft < 0 ? "red" : slot.daysLeft <= 3 ? "red" : "yellow"}>
                    {slot.daysLeft < 0 ? "Hết hạn" : slot.daysLeft === 0 ? "Hôm nay" : `${slot.daysLeft}d`}
                  </Badge>
                  <a href={`tel:${slot.user?.phone}`} className="text-xs text-blue-600 font-medium">
                    {slot.user?.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending shop orders */}
      <PendingOrders />

      {/* Expiring soon */}
      {expiringAccounts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-red-500 mb-3 uppercase tracking-wider">⚠️ Sắp hết hạn</h2>
          <div className="flex flex-col gap-2">
            {expiringAccounts.map((acc) => (
              <Link key={acc.id} href={`/accounts/${acc.id}`}>
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xs border border-red-100">
                  <span className="text-2xl">{acc.service?.icon || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{acc.label}</p>
                    <p className="text-sm text-gray-500">{formatDate(acc.renewalDate)}</p>
                  </div>
                  <Badge variant={acc.daysLeft <= 3 ? "red" : "yellow"}>
                    {acc.daysLeft === 0 ? "Hôm nay!" : `${acc.daysLeft} ngày`}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pending payments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">💰 Chờ thanh toán</h2>
          <Link href="/payments" className="text-sm text-blue-600 font-medium">Xem tất cả</Link>
        </div>
        {pendingPayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-xs border border-gray-100">
            🎉 Tất cả đã thanh toán rồi!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingPayments.map((p) => (
              <Link key={p.id} href={`/payments/${p.id}`}>
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xs border border-gray-100">
                  <span className="text-2xl">{p.account?.service?.icon || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.user?.name || "?"}</p>
                    <p className="text-sm text-gray-500 truncate">{p.account?.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                    <Badge variant="yellow">Chờ TT</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/accounts/new">
            <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100 active:scale-95 transition-transform">
              <div className="text-2xl mb-1">➕</div>
              <p className="text-sm font-medium text-blue-700">Thêm tài khoản</p>
            </div>
          </Link>
          <Link href="/users/new">
            <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100 active:scale-95 transition-transform">
              <div className="text-2xl mb-1">👤</div>
              <p className="text-sm font-medium text-green-700">Thêm người dùng</p>
            </div>
          </Link>
          <Link href="/orders">
            <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100 active:scale-95 transition-transform">
              <div className="text-2xl mb-1">🛍️</div>
              <p className="text-sm font-medium text-orange-700">Đơn hàng shop</p>
            </div>
          </Link>
          <Link href="/accounts">
            <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100 active:scale-95 transition-transform">
              <div className="text-2xl mb-1">🔑</div>
              <p className="text-sm font-medium text-purple-700">Danh sách tài khoản</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-xs active:scale-95 transition-transform ${highlight ? "bg-yellow-50 border border-yellow-100" : "bg-white border border-gray-100"}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
