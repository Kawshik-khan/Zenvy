# ADR-000: Next.js version notes

**Status:** Accepted · **Date:** 2026-10-16

## Context

`AGENTS.md` says this project uses a Next.js version with breaking changes and to read
`node_modules/next/dist/docs/` before coding. Checked during week-1 setup:

- `package.json` pins `next@^15.1.8`; the installed version is **15.5.19** (React 19).
- `node_modules/next/dist/docs/` **does not exist** in this version. The `AGENTS.md`
  note appears to come from a Next 16 scaffold that was later downgraded.
- So the standard Next.js 15 App Router documentation applies.

## Findings that affect the plan

1. **`proxy.ts` is not running.** Next 15 only loads a root `middleware.ts`; `proxy.ts`
   is the Next 16 name. `.next/server/middleware-manifest.json` is empty after
   `next build`. The `/dashboard` and `/profile` matcher in `proxy.ts` therefore does
   nothing; those pages are protected only by their own `auth()` + `redirect()` calls
   (verified by the e2e test "signed-out users are sent to login from the dashboard").
   - Fixing this is plan task **S-4**. `auth.ts` imports Prisma and bcrypt, which cannot
     run in the Edge runtime that middleware uses by default. Use the Auth.js split-config
     pattern (an edge-safe `auth.config.ts` without the Credentials/Prisma pieces used by
     `middleware.ts`) rather than renaming the file as-is.
2. **Server Actions body size** defaults to 1 MB. Job image uploads (plan J3, up to
   4 × 5 MB) need either `experimental.serverActions.bodySizeLimit` in `next.config.ts`
   or a dedicated route handler.
3. **Images:** `next/image` needs the Supabase storage host in `images.remotePatterns`
   before switching `<img>` tags (currently allowed by the ESLint config).
4. **Fonts:** `next/font/google` is already used for Geist in `app/layout.tsx`; swapping to
   Space Grotesk / JetBrains Mono (plan P1-2) follows the same pattern.
5. **Auth.js v5** behind `next start` outside Vercel needs `AUTH_TRUST_HOST=true`
   (set in the CI e2e job).

## Decision

Treat the app as standard Next.js 15.5. `AGENTS.md` should be corrected by the
maintainer so future contributors are not sent to a docs folder that does not exist.
