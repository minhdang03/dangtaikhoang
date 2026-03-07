import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, currentMonth, daysUntil } from "@/lib/utils";
import { accountsDB, usersDB, subscriptionsDB, paymentsDB, servicesDB } from "@/lib/db";

function getDashboard() {
  const accounts = accountsDB.getAll();
  const users = usersDB.getAll();
  const subscriptions = subscriptionsDB.getAll().filter(s => s.status === "active");
  const payments = paymentsDB.getAll();
  const services = servicesDB.getAll();
  const month = currentMonth();

  const monthPayments = payments.filter(p => p.month === month);
  const pendingPayments = monthPayments.filter(p => p.status === "pending");
  const paidPayments = monthPayments.filter(p => p.status === "paid");

  const expiringAccounts = accounts
    .map(a => ({ ...a, daysLeft: daysUntil(a.renewalDate) }))
    .filter(a => a.daysLeft <= 7 && a.daysLeft >= 0)
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
  const data = getDashboard();

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

  const { stats, expiringAccounts, pendingPayments } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Tổng quan</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Tài khoản" value={stats.totalAccounts} icon="🔑" />
          <StatCard label="Người dùng" value={stats.totalUsers} icon="👥" />
          <StatCard label="Slots đang dùng" value={stats.activeSlots} icon="✅" />
          <StatCard
            label="Chờ thanh toán"
            value={formatCurrency(stats.pendingRevenue)}
            icon="⏳"
            highlight={stats.pendingRevenue > 0}
          />
        </div>
      </section>

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
      </section>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-xs ${highlight ? "bg-yellow-50 border border-yellow-100" : "bg-white border border-gray-100"}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
