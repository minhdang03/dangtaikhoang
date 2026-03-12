"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ShopHeader({ title, isAdmin }: { title: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const isLookup = pathname.startsWith("/shop/lookup");

  return (
    <header className="bg-blue-600 px-4 py-3.5 sticky top-0 z-40 shadow-sm">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        <Link href="/shop" className="text-base font-bold text-white truncate">
          {title}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href="/"
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/15 text-white/80 hover:bg-white/25 transition-colors"
            >
              ← Admin
            </Link>
          )}
          <Link
            href="/shop/lookup"
            className={`text-sm font-medium px-3.5 py-1.5 rounded-xl transition-colors ${
              isLookup
                ? "bg-white text-blue-600"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            🔍 Tra cứu
          </Link>
        </div>
      </div>
    </header>
  );
}
