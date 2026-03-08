"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: "🏠", label: "Trang chủ" },
  { href: "/accounts", icon: "🔑", label: "Tài khoản" },
  { href: "/users", icon: "👥", label: "Người dùng" },
  { href: "/payments", icon: "💰", label: "Thanh toán" },
  { href: "/settings", icon: "⚙️", label: "Cài đặt" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="text-lg font-bold text-gray-900">📋 Quản lý tài khoản</Link>
          {/* Desktop nav - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/shop"
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              🛒 Shop
            </Link>
          </nav>
        </div>
      </header>

      {/* Bottom nav - mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom md:hidden">
        <div className="flex max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 px-1 text-center transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/shop"
            className="flex flex-1 flex-col items-center gap-0.5 py-2 px-1 text-center text-gray-400 hover:text-blue-600 transition-colors"
          >
            <span className="text-xl">🛒</span>
            <span className="text-[10px] font-medium leading-none">Shop</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
