import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mã khuyến mãi" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
