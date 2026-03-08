"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ShopHeader({ title, isAdmin }: { title: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const isLookup = pathname.startsWith("/shop/lookup");

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        <Link href="/shop" className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors truncate">
          {title}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link
              href="/"
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              ← Quản lý
            </Link>
          )}
          <Link
            href="/shop/lookup"
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
              isLookup
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            🔍 Tra cứu
          </Link>
        </div>
      </div>
    </header>
  );
}
