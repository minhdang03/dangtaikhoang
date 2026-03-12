"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface User {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  slotCount: number;
  hasPending: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users + subscriptions + payments in parallel
    Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/subscriptions").then(r => r.json()),
      fetch(`/api/payments?month=${new Date().toISOString().slice(0, 7)}`).then(r => r.json()),
    ]).then(([usersData, subsData, paymentsData]) => {
      const activeSubs = subsData.filter((s: { status: string }) => s.status === "active");
      const enriched = usersData.map((u: { id: string; name: string; phone: string; createdAt: string }) => ({
        ...u,
        slotCount: activeSubs.filter((s: { userId: string }) => s.userId === u.id).length,
        hasPending: paymentsData.some((p: { userId: string; status: string }) => p.userId === u.id && p.status === "pending"),
      }));
      setUsers(enriched);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter(u => {
    const q = query.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Người dùng</h1>
        <Link href="/users/new">
          <Button size="sm">+ Thêm</Button>
        </Link>
      </div>

      {/* Search */}
      {users.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm tên, số điện thoại..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500">Chưa có người dùng nào.</p>
          <Link href="/users/new">
            <Button className="mt-4">Thêm người đầu tiên</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-6 text-gray-400 text-sm">Không tìm thấy kết quả nào.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(u => (
            <Link key={u.id} href={`/users/${u.id}`}>
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xs border border-gray-100 active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-base font-bold text-blue-700 shrink-0">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                  <p className="text-sm text-gray-500 truncate">{u.phone}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {u.hasPending && <Badge variant="yellow">⏳ Còn nợ</Badge>}
                  <span className={`text-xs font-medium ${u.slotCount > 0 ? "text-blue-600" : "text-gray-400"}`}>
                    {u.slotCount > 0 ? `${u.slotCount} dịch vụ` : "Chưa có"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
