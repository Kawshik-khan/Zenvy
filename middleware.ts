import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Route guard. Runs on every page request except APIs and static files;
// public pages are listed in lib/routes.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|audio/|.*\\.[a-zA-Z0-9]+$).*)"],
};
