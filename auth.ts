import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { makeUniqueId } from "@/lib/unique-id";

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
 
        const email = String(credentials.email).trim();
        // Exact match first (unique index), then case-insensitive for "Name@Uni.edu" style input.
        const user =
          (await prisma.user.findUnique({ where: { email } })) ??
          (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }));

        if (!user || !user.password) {
          // Keep console logs minimal for security (SEC-018 partial fix)
          // console.log("Auth: User not found or no password set for:", credentials.email);
          return null;
        }

        // 1. Check if account is locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          throw new Error(`Account locked. Try again in 15 minutes.`);
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordCorrect) {
          // Increment failed attempts
          const newAttempts = (user.failedLoginAttempts || 0) + 1;
          const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          
          await prisma.user.update({
            where: { email: user.email! },
            data: { failedLoginAttempts: newAttempts, lockedUntil }
          });

          if (lockedUntil) {
              throw new Error("Account locked due to too many failed attempts (15m).");
          }
          return null;
        }

        // 2. Reset lockout on success
        if ((user.failedLoginAttempts || 0) > 0 || user.lockedUntil) {
           await prisma.user.update({
             where: { email: user.email! },
             data: { failedLoginAttempts: 0, lockedUntil: null }
           });
        }

        // 3. SEC-005: Enforce Email Verification (Temporarily disabled by user request)
        // if (!user.emailVerified) {
        //   throw new Error("Please verify your email address to log in.");
        // }

        // console.log("Auth: Login successful for:", credentials.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});
