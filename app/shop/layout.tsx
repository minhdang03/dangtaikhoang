import { Toast } from "@/components/ui/Toast";
import { settingsDB } from "@/lib/db";
import { ShopHeader } from "@/components/ShopHeader";
import { auth } from "@/lib/auth";

export async function generateMetadata() {
  const settings = await settingsDB.get();
  return {
    title: settings.shopTitle || "Dịch vụ chia sẻ",
    description: "Đăng ký dịch vụ với giá tốt nhất",
  };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, session] = await Promise.all([settingsDB.get(), auth()]);
  const isAdmin = !!session;

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader title={settings.shopTitle || "Dịch vụ chia sẻ"} isAdmin={isAdmin} />
      <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        {children}
      </main>
      <Toast />
    </div>
  );
}
