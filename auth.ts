import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { makeUniqueId } from "@/lib/unique-id";
import { verifyCredentials } from "@/lib/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  events: {
    // Users created through Google need the same profile row and handle as email sign-ups.
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          uniqueId: makeUniqueId(user.name ?? user.email ?? "user"),
          profile: { connectOrCreate: { where: { userId: user.id }, create: {} } },
        },
      });
    },
  },
  providers: [
    // Reads AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET. Left out entirely when they are not set.
    ...(isGoogleEnabled() ? [Google] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Throws AccountLockedError for a locked account; its message reaches the login form.
        const user = await verifyCredentials(String(credentials.email), String(credentials.password));
        return user ? { id: user.id, name: user.name, email: user.email } : null;
      },
    }),
  ],
});
