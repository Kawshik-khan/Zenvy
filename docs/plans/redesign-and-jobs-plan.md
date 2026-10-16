# Implementation Plan — "Zenvy Brutal" UI Redesign + Jobs Portal

**Status:** Draft for review · **Owner:** Kawshik · **Date:** 2026-10-16
**Design reference:** [Zenvy Neubrutalism UI canvas](https://claude.ai/artifact/PB673C1RhKVFdDrzTFSfwD) (landing, design system, dashboard, matching, inbox, focus, call, jobs feed, post job, job detail)

---

## 1. Goals, non-goals, success criteria

### Goals
1. Replace the current dark glassmorphism UI with the **Zenvy Brutal** design system (soft Neubrutalism, "loud" for social screens, "quiet" for focus/call).
2. Build a reusable component library so styling lives in ~15 primitives instead of ~2,450 inline `className` strings across 60 files.
3. Simplify navigation to **Home · Find partners · Messages · Jobs · Focus · Profile**.
4. Ship a **Jobs portal** MVP: a structured job/internship/part-time/referral feed where any verified user can post (with images), and students can filter, save, apply and report.

### Non-goals (this plan)
- No backend behaviour changes to chat, calls, matching or Pomodoro during the redesign — restyle only.
- No in-app application forms/CV storage for Jobs (apply = external link, email, or DM the poster).
- No dark theme at launch (light-first; dark is a follow-up using the same semantic tokens).
- No native mobile app.

### Success criteria
| Area | Measure |
|---|---|
| Redesign | 100% of user-facing routes on new primitives; 0 `backdrop-blur` / old `surface-*` tokens left; Lighthouse a11y ≥ 95 on core pages; LCP not worse than today |
| Jobs | Post → live in < 2 min for trusted posters; ≥ 1 save or apply per 5 job-detail views in beta; reported-scam takedown < 24 h |
| Quality | CI green with unit + Playwright smoke tests on every PR |

---

## 2. Key decisions (write each as an ADR in `docs/adr/`)

| # | Decision | Why |
|---|---|---|
| ADR-001 | Tokens in Tailwind v4 `@theme` (`app/globals.css`), three layers: palette → semantic → component | One place to change look; enables dark mode later |
| ADR-002 | Primitives in `components/ui/*`, built on headless Radix primitives for Dialog/Popover/Tabs/Select | Accessible keyboard/focus behaviour for free |
| ADR-003 | Icons: `lucide-react` (stroke icons) replace the Material Symbols web font | Removes a render-blocking font (`display=block`), tree-shakeable |
| ADR-004 | Fonts via `next/font/google`: Space Grotesk (UI) + JetBrains Mono (numbers) replace Geist | Self-hosted, no layout shift |
| ADR-005 | Migrate screen-by-screen behind no flag (visual only) but Jobs ships behind `FEATURE_JOBS` | Restyle is low-risk; Jobs needs staged rollout |
| ADR-006 | Jobs is a **structured board**, not a free-text newsfeed; posts require a deadline and expire | Filterable, rankable, auto-cleaning, harder to scam |
| ADR-007 | Jobs writes go through server actions + a `lib/jobs/` service layer (zod-validated); no direct Prisma in pages | Single place for authz, moderation and rate limits |
| ADR-008 | Adopt `prisma migrate` before the Jobs schema lands | Production schema changes must be reviewable and reversible |

> ✅ **Framework check done (F-1).** Installed Next.js is **15.5.19**; there is no bundled `node_modules/next/dist/docs/`, so standard Next 15 docs apply. `proxy.ts` (a Next 16 name) is **not loaded** — route protection relies on per-page `auth()` checks until S-4 adds an edge-safe `middleware.ts`. Details: [`docs/adr/000-nextjs-notes.md`](../adr/000-nextjs-notes.md).

---

## 3. Phases and timeline

Assumes **1–2 developers**. Redesign and Jobs share Phase 0–2, then run in parallel.

| Week | Track A — Redesign | Track B — Jobs |
|---|---|---|
| 1 | **Phase 0** Foundations | — |
| 2–3 | **Phase 1** Tokens + primitives | J1 schema/migration, J2 service layer |
| 4 | **Phase 2** App shell + navigation | J3 image upload, J4 pages (feed/new/detail) |
| 5–7 | **Phase 3** Screen migration | J5 moderation, J6 expiry, J9 rate limits |
| 8 | **Phase 4** Cleanup + a11y/perf pass | J7 ranking, J8 social + notifications, beta rollout |

Critical path: Phase 0 → Phase 1 primitives → Phase 2 shell → (Phase 3 ∥ J4 pages).

---

## 4. Phase 0 — Foundations (week 1)

**Status:** F-1 to F-7 done. Screenshot baselines are produced by `npm run test:visual` and uploaded as a CI artifact rather than committed. Remaining manual step: baseline the production database (`docs/deployment.md` → "One-time baseline").

| ID | Task | Files | Acceptance criteria |
|---|---|---|---|
| F-1 | Read Next.js bundled docs; note any API differences in `docs/adr/000-nextjs-notes.md` | — | Notes cover layouts, server actions, fonts, images, proxy |
| F-2 | Add Vitest + React Testing Library; `npm test` script; wire into `npm run ci` | `package.json`, `vitest.config.ts` | Sample test passes in CI |
| F-3 | Add Playwright smoke suite (login → dashboard → matching → chat → focus) using pre-installed Chromium | `e2e/*.spec.ts`, `.github/workflows/ci.yml` | Runs headless in CI against `next build && next start` with a seeded test DB |
| F-4 | Capture "before" screenshots of every route (Playwright) for visual diffing | `e2e/visual/` | Baseline images committed or uploaded as CI artifact |
| F-5 | Baseline `prisma migrate` from current schema (`migrate diff --from-empty`), mark as applied in prod | `prisma/migrations/0001_baseline` | `prisma migrate status` clean on staging and prod |
| F-6 | Feature-flag helper | `lib/flags.ts` | `isEnabled('jobs')` reads `FEATURE_JOBS` env; unit tested |
| F-7 | Remove committed junk (`prisma/dev.db`, `*.log`, `*.bak`, `test-db.js`, `update_sidebars.js`) | repo root | `.gitignore` updated |

---

## 5. Phase 1 — Design tokens + primitives (weeks 2–3)

**Status:** P1-1 tokens, P1-2 fonts + `lucide-react`, P1-4 gallery (`/ui`), and the first primitives (Button, ButtonLink, IconButton, Card, CardHeader, Input, Textarea, Select, Checkbox, Badge, Chip, Avatar, AvatarStack, StatTile, ProgressBar, EmptyState) are done; see `docs/design-system.md`. Remaining: Radix-based Dialog/Sheet/Popover/Tabs/Toast, Skeleton move, ImageDropzone. The Material Symbols import stays until Phase 4. Implementation notes: custom classes use Tailwind v4 `@utility` (`border-nb`, `nb-press`, `nb-focus`), and new tokens avoid the legacy `rounded-lg/xl` overrides.

### P1-1 Tokens (`app/globals.css`)
Add new tokens **alongside** the old ones (old ones are deleted in Phase 4):

```css
@theme {
  /* palette */
  --color-paper: #FFF8EC;  --color-ink: #111111;   --color-white: #FFFFFF;
  --color-match: #FF6B9D;  --color-chat: #4D96FF;  --color-focus: #FFD23F;
  --color-live:  #3DDC97;  --color-alert: #FF5A36; --color-career: #B794F6;
  --color-quiet-paper: #F4EEE2; --color-quiet-ink: #2B2B2B;

  /* structure */
  --radius-nb: 10px;
  --shadow-nb-sm: 4px 4px 0 0 var(--color-ink);
  --shadow-nb-md: 6px 6px 0 0 var(--color-ink);
  --shadow-nb-lg: 8px 8px 0 0 var(--color-ink);

  --font-sans: var(--font-space-grotesk), sans-serif;
  --font-mono: var(--font-jetbrains-mono), monospace;
}
```
Plus utilities: `.nb-border` (3px ink), `.nb-press` (hover lift −2px / active sink +4px, shadow removed), `.quiet` scope that swaps paper/ink/border width for focus & call.

**AC:** tokens documented in `docs/design-system.md`; colour pairs verified ≥ 4.5:1 (ink on every accent passes).

### P1-2 Fonts & icons
- `app/layout.tsx`: replace Geist with `Space_Grotesk` + `JetBrains_Mono` via `next/font/google`.
- Remove the Material Symbols `@import` from `globals.css` once Phase 3 is done; add `lucide-react` now.

### P1-3 Primitives (`components/ui/`)
Each: typed props, `variant`/`size`, `volume: 'loud' | 'quiet'` where relevant, forwardRef, visible focus ring, unit test for a11y roles.

| Primitive | Variants / notes |
|---|---|
| `Button` | primary (ink), accent (`match`/`chat`/`focus`/`live`/`career`), secondary (white), danger, ghost; sizes sm/md/lg; `asChild` for links; loading state |
| `IconButton` | requires `aria-label` (TS-enforced) |
| `Card` | `tone` (white/accent), `shadow` sm/md/lg, optional header band |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Field` (label + hint + error) | error state uses `alert` shadow |
| `Badge` / `Chip` | static and toggle (`aria-pressed`) |
| `Avatar` | initials fallback, presence dot, square variant for orgs/groups, `AvatarStack` |
| `Tabs`, `Dialog`, `Sheet`, `Popover`, `Toast` | Radix-based |
| `Skeleton` | restyle existing `app/components/Skeleton.tsx` and move here |
| `EmptyState`, `StatTile`, `ProgressBar` | used by dashboard/stats |
| `ImageDropzone` | used by profile + jobs; drag/drop, previews, remove, limits |

### P1-4 Dev gallery
`app/(dev)/ui/page.tsx` rendering every primitive and state; returns 404 when `NODE_ENV === 'production'`.

**Phase AC:** gallery matches the canvas design-system board; keyboard-only walkthrough works; unit tests pass.

---

## 6. Phase 2 — App shell & navigation (week 4)

| ID | Task | Files | AC |
|---|---|---|---|
| S-1 | Route group `app/(app)/layout.tsx` with new `AppShell` (sidebar ≥ 1024px, bottom tab bar on mobile) and move authenticated routes into it | `app/(app)/**`, `components/shell/*` | URLs unchanged; one layout instead of per-page sidebars |
| S-2 | New nav model (6 items) replacing `SidebarNav.tsx` links; Groups/Channels move under Messages tabs, Events/Bookmarks/Stats under Home/Profile | `components/shell/nav.ts` | Old routes still reachable; unread badge on Messages |
| S-3 | Header: search (reuse `GlobalPeopleSearch`), notifications bell, profile menu | `components/shell/Header.tsx` | Restyled, same behaviour |
| S-4 | `proxy.ts` matcher: default-deny for `(app)` routes, public allowlist (`/`, `/login`, `/register`, `/verify`, `/api/auth/*`, `/api/health`) | `proxy.ts` | Unauthed visit to `/jobs` redirects to login |
| S-5 | Delete obsolete `Sidebar.tsx`, `update_sidebars.js` | — | No dead imports |

---

## 7. Phase 3 — Screen migration (weeks 5–7)

**Rule for every screen PR:** restyle using `components/ui` only; **no logic/data changes**; delete glass/gradient classes in touched files; attach before/after screenshots; Playwright smoke passes.

| Order | Screen(s) | Main files | Volume | Notes |
|---|---|---|---|---|
| 1 | Landing | `app/components/LandingPage.tsx` | loud | Split 732-line file into sections |
| 2 | Auth + onboarding | `app/login`, `app/register`, `app/verify`, `app/onboarding` | loud | Onboarding ends on "here are 3 matches" CTA |
| 3 | Dashboard | `app/dashboard/*` | loud | Bento `StatTile`s, suggested partners, upcoming sessions |
| 4 | Matching | `app/matching/*`, `app/users/[id]` | loud | Match card with score + "why you match" chips (data already in `lib/discovery.ts`) |
| 5 | Messages | `app/chat/*`, `app/groups/[id]/*`, `app/channels/[id]/*` | loud shell / quiet bubbles | Extract shared `MessageList`, `Composer`, `ConversationHeader` used by all three chat clients (restyle + dedupe UI only) |
| 6 | Focus | `PomodoroWidget.tsx`, `Focus*` components | **quiet** | Full-screen quiet mode + floating indicator |
| 7 | Calls | `CallProvider.tsx` UI parts, `CallOverlay.tsx`, `app/call/*`, `components/call/*` | dark stage | Restyle only; separating call state from UI is a separate refactor |
| 8 | Profile | `app/profile/*` | loud | Uses `ImageDropzone` |
| 9 | Secondary | groups list, channels list, events, scheduling, notifications, bookmarks, stats, admin | loud | Lowest priority; admin can stay utilitarian |

---

## 8. Phase 4 — Cleanup & hardening (week 8)

- Delete old `@theme` tokens, Material Symbols import, `designs/stitch_profile_management/*` alternative directions (archive the chosen one into `docs/design-system.md`).
- CI guard: script failing on `backdrop-blur`, raw hex colours in `className`, or imports of deleted components.
- Accessibility pass (axe in Playwright on core routes), Lighthouse budget check, visual-diff review against Phase 0 baselines.
- Update `README.md` screenshots and the design-system doc.

---

## 9. Track B — Jobs portal

### J1 Schema & migration (needs F-5)

```prisma
enum JobType     { JOB INTERNSHIP PART_TIME REFERRAL }
enum WorkMode    { REMOTE ONSITE HYBRID }
enum ApplyMethod { LINK EMAIL MESSAGE }
enum JobStatus   { PENDING_REVIEW LIVE REJECTED EXPIRED REMOVED }
enum PosterTrust { STUDENT ALUMNI VERIFIED_EMPLOYER }

model User {
  // ...existing fields
  posterTrust PosterTrust @default(STUDENT)
  jobPosts    JobPost[]
  jobSaves    JobSave[]
  jobReports  JobReport[]
}

model JobPost {
  id           String      @id @default(cuid())
  authorId     String
  author       User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  type         JobType
  title        String      @db.VarChar(120)
  company      String      @db.VarChar(120)
  location     String      @db.VarChar(120)
  workMode     WorkMode
  pay          String?     @db.VarChar(80)
  description  String      @db.VarChar(5000)
  applyMethod  ApplyMethod
  applyTarget  String?     // URL or email; null when MESSAGE
  tags         String[]
  deadline     DateTime
  status       JobStatus   @default(PENDING_REVIEW)
  reviewNote   String?
  reportCount  Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  media        JobMedia[]
  saves        JobSave[]
  reports      JobReport[]

  @@index([status, deadline])
  @@index([status, type, createdAt])
  @@index([authorId, createdAt])
}

model JobMedia {
  id     String  @id @default(cuid())
  jobId  String
  job    JobPost @relation(fields: [jobId], references: [id], onDelete: Cascade)
  path   String  // storage path, not a public URL
  width  Int
  height Int
  order  Int
  @@index([jobId, order])
}

model JobSave {
  userId    String
  jobId     String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  job       JobPost @relation(fields: [jobId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@id([userId, jobId])
  @@index([jobId])
}

model JobReport {
  id         String   @id @default(cuid())
  jobId      String
  reporterId String
  reason     String   // SCAM_FEE, FAKE_COMPANY, SPAM, OFFENSIVE, OTHER
  details    String?  @db.VarChar(500)
  job        JobPost  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  reporter   User     @relation(fields: [reporterId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  @@unique([jobId, reporterId])
}
```
Optional GIN index on `tags` and a `tsvector` on title/description for keyword search (add in a migration alongside `prisma/search-indexes.sql` patterns).

**AC:** migration applies cleanly on a copy of prod; seed script creates sample posts for dev/e2e.

### J2 Service layer — `lib/jobs/`
| Module | Responsibility |
|---|---|
| `schema.ts` | zod schemas: create/update input (lengths, `deadline` 1–90 days ahead, `applyTarget` must be `https:` URL or email per method, ≤ 8 tags) |
| `service.ts` | `createJob`, `updateJob` (author only, resets to review if content changes), `deleteJob`, `getJob` (hides non-LIVE from non-authors/non-admins), `listFeed({filters, cursor})`, `toggleSave`, `reportJob` |
| `moderation.ts` | `initialStatusFor(user)`, `scanForScamSignals(text)` (fee/deposit/registration-charge/WhatsApp-only/shortened-link patterns), `applyReportThreshold` (auto-hide at 3 distinct reports), `approve`/`reject`/`remove` (admin) |
| `ranking.ts` | Score = tag overlap with profile major/interests + recency decay + deadline proximity; pure function, unit-tested |

Initial status rule: `VERIFIED_EMPLOYER` → LIVE; `ALUMNI` or any poster with ≥ 1 previously approved post → LIVE unless scam scan flags; everyone else → PENDING_REVIEW.

### J3 Image upload
- Bucket `job-media` (private) in Supabase; serve via short-lived signed URLs or a cached image route.
- `validateJobImage` in `lib/upload-validation.ts`: JPEG/PNG/WebP only, ≤ 5 MB, ≤ 4 per post.
- Server-side processing with `sharp`: auto-rotate, **strip EXIF/GPS**, resize to max 1600px + 480px thumbnail, convert to WebP, record width/height.
- Upload happens on submit inside the server action (or a dedicated route handler if body-size limits require it — check the bundled Next docs for server action body limits).
- `next.config.ts`: add Supabase host to image `remotePatterns`.

### J4 Pages (behind `FEATURE_JOBS`)
| Route | Type | Contents (see canvas) |
|---|---|---|
| `app/(app)/jobs/page.tsx` | Server component, `searchParams` filters, cursor "Load more" | Composer prompt, filter chips (type / mode / paid), job cards, right rail (for you, refine, saved, safety tip) |
| `app/(app)/jobs/new/page.tsx` | Form + server action | Type picker, fields, `ImageDropzone`, tags, no-fee confirmation, live preview |
| `app/(app)/jobs/[id]/page.tsx` | Server component | Images, key facts, description, apply panel, poster card, "partners saved this" |
| `app/(app)/jobs/[id]/edit/page.tsx` | Author only | Same form, prefilled |
| `app/(app)/jobs/mine/page.tsx` | Author dashboard | Status per post (pending/live/expired/rejected + note) |
| `app/(app)/jobs/saved/page.tsx` | List of saved jobs | Sorted by deadline |

Apply: LINK opens external URL (`rel="noopener noreferrer nofollow"`, interstitial "You're leaving Zenvy"); EMAIL uses `mailto:`; MESSAGE opens/creates a DM via existing `app/api/conversations/dm`.

Components: `JobCard`, `JobFilters`, `JobForm`, `JobImages`, `ApplyPanel`, `ReportDialog` in `app/(app)/jobs/_components/`, all built on `components/ui`.

### J5 Moderation & admin
- `app/zenvy-admin/jobs/page.tsx`: queue of PENDING_REVIEW and auto-hidden posts, with scam-signal highlights, approve/reject (with note)/remove, ban-poster shortcut.
- Notifications (existing `Notification` model): poster gets "approved"/"needs changes"; reporter gets "thanks, we reviewed it".
- Audit: store `reviewedById`, `reviewedAt` (add to schema if needed).

### J6 Expiry
- Feed queries always filter `deadline > now()` and `status = LIVE`.
- Daily job sets `status = EXPIRED`: a cron-triggered route `app/api/cron/expire-jobs/route.ts` protected by `CRON_SECRET` (Vercel Cron), idempotent.
- Saved-job reminder push 48 h before deadline (same cron).

### J7 Ranking ("For you")
Phase 1: SQL pre-filter (status/type/mode) + in-memory `ranking.ts` score over the most recent 200 candidates; cache per user 5 min in Upstash (`cacheKeys.jobFeed(userId)`), invalidated on new LIVE post. Revisit when volume grows.

### J8 Social + notifications
- "N of your partners saved this": join `JobSave` with accepted `Match` partners.
- "Prep together" button → starts a focus session / DM with those partners.
- Push notification when a new post matches saved filters (later).

### J9 Abuse limits
Upstash ratelimit (replaces in-memory `lib/rateLimit.ts` for these paths): create 5 posts/day/user, 20 reports/day/user, 60 saves/hour/user. Require verified email to post.

### Jobs tests
- Unit: zod schemas, `scanForScamSignals`, `initialStatusFor`, `ranking`, report threshold.
- Integration (test DB): create → pending → approve → visible in feed; non-author cannot see pending; expired hidden.
- Playwright: post with image → admin approves → student filters, saves, opens detail, reports.

### Jobs rollout
1. Ship dark behind `FEATURE_JOBS=false`.
2. Enable for admins + seeded alumni; seed 20–30 real referral/internship posts.
3. Enable for all users; watch report rate, review-queue latency, saves/applies.

---

## 10. Definition of done (every PR)

- [ ] `npm run ci` green (prisma validate, lint, typecheck, unit tests, build) + Playwright smoke
- [ ] Uses `components/ui` primitives; no new raw hex colours or glass utilities
- [ ] Keyboard-navigable, labelled inputs, icon buttons have `aria-label`, contrast ≥ 4.5:1
- [ ] Works at 375px width (no horizontal scroll)
- [ ] Before/after screenshots in PR description (UI PRs)
- [ ] Migration reviewed with `prisma migrate diff` (schema PRs)

---

## 11. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Next.js version differs from assumptions | Rework | F-1 doc read before coding; small first PRs |
| Large client components (`CallProvider` 1,086 lines, chat clients 500–840) make restyle risky | Regressions in calls/chat | Restyle presentation only; extract UI subcomponents first; Playwright smoke on call/chat |
| Half-migrated look for weeks | Inconsistent UX | Migrate in user-journey order; shell first so every page gets new chrome immediately |
| Scam/fake job posts | Student harm, trust loss | Trust levels, first-post review, scam scan, report auto-hide, no-fee confirmation, safety copy |
| Image abuse (PII, explicit content, huge files) | Privacy/legal | EXIF strip, size/type limits, private bucket + signed URLs, report flow; optional moderation API later |
| Empty jobs feed at launch | Feature looks dead | Seed with alumni/referrals before public launch |
| Prod DB drift (currently `db push`) | Failed migration | F-5 baseline before J1 |

---

## 12. Backlog after this plan
- Dark theme via semantic tokens
- `JobApplication` tracker (applied → interview → offer)
- Employer org pages + domain verification flow
- Saved searches + alerts
- Unified `Conversation` messaging and single socket server (from the architecture review) — independent of this plan but recommended in parallel
