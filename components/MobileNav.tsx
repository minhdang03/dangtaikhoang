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
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/" className="text-lg font-bold text-gray-900">📋 Quản lý tài khoản</Link>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom">
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
        </div>
      </nav>
    </>
  );
}
