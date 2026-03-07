import type { Metadata } from "next";
import { Toast } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Dịch vụ chia sẻ",
  description: "Đăng ký dịch vụ ChatGPT, Netflix, Spotify với giá tốt nhất",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-gray-900">🛒 Dịch vụ chia sẻ</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <Toast />
    </div>
  );
}
