import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use edge-safe authConfig (no fs/db imports)
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
