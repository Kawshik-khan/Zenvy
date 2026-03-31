import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
 
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

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

        // 3. SEC-005: Enforce Email Verification
        if (!user.emailVerified) {
          throw new Error("Please verify your email address to log in.");
        }

        // console.log("Auth: Login successful for:", credentials.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
