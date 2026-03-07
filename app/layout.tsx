import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileNav } from "@/components/MobileNav";
import { Toast } from "@/components/ui/Toast";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Quản lý tài khoản chia sẻ",
  description: "Quản lý tài khoản ChatGPT, Netflix, Google Drive cho gia đình và bạn bè",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="vi">
      <body>
        {session && <MobileNav />}
        {session && <Toast />}
        <main className={session ? "pt-16 pb-20 min-h-screen" : "min-h-screen"}>
          <div className="max-w-lg mx-auto px-4 py-4">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
