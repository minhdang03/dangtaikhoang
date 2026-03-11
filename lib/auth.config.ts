import type { NextAuthConfig } from "next-auth";

// Minimal auth config for Edge Runtime (middleware/proxy)
// Does NOT import fs/db - safe for Edge
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isPublicPay = nextUrl.pathname.startsWith("/pay/");
      const isShop = nextUrl.pathname.startsWith("/shop");
      const isApiShop = nextUrl.pathname.startsWith("/api/shop");

      const isTelegramWebhook = nextUrl.pathname.startsWith("/api/telegram");

      if (isApiAuth || isPublicPay || isShop || isApiShop || isTelegramWebhook) return true;
      if (!isLoggedIn && !isLoginPage) return Response.redirect(new URL("/shop", nextUrl)); // khách vào / → shop
      if (!isLoggedIn && isLoginPage) return true; // cho vào trang login
      if (isLoggedIn && isLoginPage) return Response.redirect(new URL("/", nextUrl));
      return true;
    },
  },
  providers: [], // providers added in auth.ts
};
