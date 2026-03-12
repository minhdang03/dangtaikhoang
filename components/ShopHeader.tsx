"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ShopHeader({ title, isAdmin }: { title: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const isLookup = pathname.startsWith("/shop/lookup");

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        <Link href="/shop" className="font-bold text-gray-900 truncate">
          {title}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Admin
            </Link>
          )}
          <Link
            href="/shop/lookup"
            className={`text-sm font-medium px-3.5 py-1.5 rounded-xl transition-colors ${
              isLookup ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🔍 Tra cứu
          </Link>
        </div>
      </div>
    </header>
  );
}
