import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        // Lazy import to avoid Edge Runtime bundling
        const { settingsDB } = await import("./db");
        const settings = settingsDB.get();
        if (credentials?.password === settings.adminPassword) {
          return { id: "admin", name: "Admin", email: "admin@local" };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "local-dev-secret-change-in-prod",
  trustHost: true,
});
