import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/MobileNav";
import { Toast } from "@/components/ui/Toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <MobileNav />
      <Toast />
      <div className="pt-16 pb-20 md:pb-6 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          {children}
        </div>
      </div>
    </>
  );
}
