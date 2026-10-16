import type { NextAuthConfig } from "next-auth";
import { isPublicPath } from "@/lib/routes";

// Edge-safe part of the Auth.js config, shared by middleware.ts and auth.ts.
// Must not import Prisma, bcrypt or anything else that needs Node.js APIs.
export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (isPublicPath(request.nextUrl.pathname)) return true;
      // Returning false redirects to pages.signIn with ?callbackUrl=<original URL>.
      return Boolean(auth?.user);
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
