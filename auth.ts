import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { makeUniqueId } from "@/lib/unique-id";
import { checkCredentials } from "@/lib/credentials";

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
        const result = await checkCredentials(credentials?.email, credentials?.password);
        if (result.ok) return { id: result.user.id, name: result.user.name, email: result.user.email };
        if (result.reason === "locked") throw new Error(result.message);
        return null;
      },
    }),
  ],
});
