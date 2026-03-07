import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { usersDB, subscriptionsDB, paymentsDB } from "@/lib/db";
import { currentMonth } from "@/lib/utils";

export default function UsersPage() {
  const users = usersDB.getAll();
  const subscriptions = subscriptionsDB.getAll().filter(s => s.status === "active");
  const payments = paymentsDB.getByMonth(currentMonth());

  const enriched = users.map(u => {
    const userSubs = subscriptions.filter(s => s.userId === u.id);
    const userPayments = payments.filter(p => p.userId === u.id);
    const hasPending = userPayments.some(p => p.status === "pending");
    return { ...u, slotCount: userSubs.length, hasPending };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Người dùng</h1>
        <Link href="/users/new">
          <Button size="sm">+ Thêm</Button>
        </Link>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500">Chưa có người dùng nào.</p>
          <Link href="/users/new">
            <Button className="mt-4">Thêm người đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {enriched.map(u => (
            <Link key={u.id} href={`/users/${u.id}`}>
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xs border border-gray-100">
                <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700 shrink-0">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                  <p className="text-sm text-gray-500 truncate">{u.phone}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-400">{u.slotCount} dịch vụ</span>
                  {u.hasPending && <Badge variant="yellow">Còn nợ</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
