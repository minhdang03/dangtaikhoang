import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { accountsDB, servicesDB, subscriptionsDB } from "@/lib/db";

export default async function AccountsPage() {
  const [accounts, services, subscriptions] = await Promise.all([
    accountsDB.getAll(),
    servicesDB.getAll(),
    subscriptionsDB.getAll(),
  ]);
  const activeSubscriptions = subscriptions.filter(s => s.status === "active");

  const enriched = accounts.map(a => ({
    ...a,
    service: services.find(s => s.id === a.serviceId),
    activeSlots: activeSubscriptions.filter(s => s.accountId === a.id).length,
    daysLeft: daysUntil(a.renewalDate),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tài khoản chia sẻ</h1>
        <Link href="/accounts/new">
          <Button size="sm">+ Thêm</Button>
        </Link>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">🔑</div>
          <p className="text-gray-500">Chưa có tài khoản nào.</p>
          <Link href="/accounts/new">
            <Button className="mt-4">Thêm tài khoản đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {enriched.map((acc) => (
            <Link key={acc.id} href={`/accounts/${acc.id}`}>
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center gap-3">
                <div className="text-3xl">{acc.service?.icon || "📦"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{acc.label}</p>
                  <p className="text-sm text-gray-500 truncate">{acc.service?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {acc.activeSlots}/{acc.totalSlots} slots
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatCurrency(acc.monthlyFee)}/tháng</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <Badge variant={acc.totalSlots - acc.activeSlots === 0 ? "red" : "green"}>
                    {acc.totalSlots - acc.activeSlots === 0 ? "Đầy" : `Còn ${acc.totalSlots - acc.activeSlots}`}
                  </Badge>
                  {acc.daysLeft <= 7 && acc.daysLeft >= 0 && (
                    <Badge variant={acc.daysLeft <= 3 ? "red" : "yellow"}>
                      {acc.daysLeft === 0 ? "Hôm nay!" : `${acc.daysLeft}d`}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
