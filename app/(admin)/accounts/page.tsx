"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, daysUntil } from "@/lib/utils";

interface Account {
  id: string;
  label: string;
  monthlyFee: number;
  yearlyFee: number;
  totalSlots: number;
  renewalDate: string;
  serviceId: string;
  service?: { name: string; icon: string };
  activeSlots: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then(r => r.json())
      .then(data => { setAccounts(data); setLoading(false); });
  }, []);

  const filtered = accounts.filter(a => {
    const q = query.toLowerCase();
    return (
      a.label.toLowerCase().includes(q) ||
      (a.service?.name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tài khoản chia sẻ</h1>
        <Link href="/accounts/new">
          <Button size="sm">+ Thêm</Button>
        </Link>
      </div>

      {/* Search */}
      {accounts.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm tài khoản, dịch vụ..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">🔑</div>
          <p className="text-gray-500">Chưa có tài khoản nào.</p>
          <Link href="/accounts/new">
            <Button className="mt-4">Thêm tài khoản đầu tiên</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-6 text-gray-400 text-sm">Không tìm thấy kết quả nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((acc) => {
            const daysLeft = daysUntil(acc.renewalDate);
            const freeSlots = acc.totalSlots - acc.activeSlots;
            return (
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
                      {acc.yearlyFee > 0 && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-green-600">{formatCurrency(acc.yearlyFee)}/năm</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <Badge variant={freeSlots === 0 ? "red" : "green"}>
                      {freeSlots === 0 ? "Đầy" : `Còn ${freeSlots}`}
                    </Badge>
                    {daysLeft <= 7 && daysLeft >= 0 && (
                      <Badge variant={daysLeft <= 3 ? "red" : "yellow"}>
                        {daysLeft === 0 ? "Hôm nay!" : `${daysLeft}d`}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
