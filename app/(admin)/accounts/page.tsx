"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, daysUntil } from "@/lib/utils";

interface Account {
  id: string;
  slug?: string;
  label: string;
  price1m: number;
  price3m: number;
  price6m: number;
  price12m: number;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyLink(acc: Account) {
    const url = `${window.location.origin}/shop?service=${acc.slug || acc.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

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
        <div className="flex flex-col gap-2">
          {filtered.map((acc) => {
            const daysLeft = daysUntil(acc.renewalDate);
            const freeSlots = acc.totalSlots - acc.activeSlots;
            const lowestPrice = [acc.price1m, acc.price3m, acc.price6m, acc.price12m].find(p => p > 0);
            const isExpiring = daysLeft <= 7;
            return (
              <div key={acc.id} className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center gap-3">
                <Link href={`/accounts/${acc.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`text-3xl shrink-0 ${freeSlots === 0 ? "opacity-50 grayscale" : ""}`}>{acc.service?.icon || "📦"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{acc.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400">{acc.service?.name}</span>
                      <span className="text-gray-200 text-xs">·</span>
                      <span className="text-xs text-gray-400">{acc.activeSlots}/{acc.totalSlots} slots</span>
                      {lowestPrice && <>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-xs text-gray-400">từ {formatCurrency(lowestPrice)}</span>
                      </>}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status badge: expiry takes priority over slot count */}
                  {daysLeft < 0 ? (
                    <Badge variant="red">⚠️ Hết hạn</Badge>
                  ) : isExpiring ? (
                    <Badge variant={daysLeft <= 3 ? "red" : "yellow"}>
                      ⚠️ {daysLeft === 0 ? "Hôm nay" : `${daysLeft}d`}
                    </Badge>
                  ) : freeSlots === 0 ? (
                    <Badge variant="red">Đầy</Badge>
                  ) : (
                    <Badge variant="green">Còn {freeSlots}</Badge>
                  )}
                  <button
                    onClick={() => copyLink(acc)}
                    title="Copy link shop"
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors ${copiedId === acc.id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"}`}
                  >
                    {copiedId === acc.id ? "✓" : "🔗"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
