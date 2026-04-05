# Security review — runnable results & findings

**Generated for review:** add comments inline or in PR; check off items as you fix them.

---

## Commands run (agent side)

```bash
npm audit
npm audit fix --dry-run
```

### `npm audit` summary (latest run)

| Severity | Package        | Advisory |
|----------|----------------|----------|
| High     | `picomatch`    | GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj (transitive via `tinyglobby`) |
| Moderate | `next-auth`  | GHSA-5jpx-9hw9-2fx4 (email misdelivery) |
| Moderate | `brace-expansion` | GHSA-f886-m6hf-6m8v |

**Result:** 3 vulnerabilities (2 moderate, 1 high). Suggested: `npm audit fix` (review lockfile diff before merging).

### `npm audit fix --dry-run` (proposed lockfile changes — verify locally)

- Example bumps shown: `next-auth` 5.0.0-beta.25 → 5.0.0-beta.30, `picomatch` 4.0.3 → 4.0.4, `brace-expansion` 1.1.12 → 1.1.13, `@auth/core`, `jose`, `preact`, etc.
- After a real `npm audit fix`, run `npm audit` again; some advisories may clear only when all transitive deps resolve.

---

## White-box code findings (priority order)

Use the checkboxes and **Notes** column for your comments.

| Done | Severity | Issue | Where | Notes (your comments) |
|------|----------|-------|-------|-------------------------|
| [ ] | **Critical** | Socket auth trusts client `userId` on `authenticate` — no JWT | `server.js`, `standalone-socket.js` | |
| [ ] | **Critical** | CORS `origin: "*"` on those socket servers | `server.js`, `standalone-socket.js` | |
| [ ] | **High** | IDOR: `GET /api/messages?roomId=` — no check that user belongs to room; DM ids are predictable (`dm_*`) | `app/api/messages/route.ts`, `app/chat/personal/PersonalChatClient.tsx` | |
| [ ] | **High** | Socket `join_room` / realtime: no room membership check | `pages/api/socket.ts` (+ same gap if using custom server) | |
| [ ] | **Medium** | WebRTC: `call_user` / signaling — any user can target any `to` user id | `pages/api/socket.ts`, `server.js`, `standalone-socket.js` | |
| [ ] | **Medium** | Email verification disabled in credentials login | `auth.ts` | |
| [ ] | **Medium** | Profile upload: no strict file type/size validation | `app/profile/upload-action.ts` | |
| [ ] | **Medium** | Rate limit: in-memory only; weak under multi-instance | `lib/rateLimit.ts` | |
| [ ] | **Low** | Build ignores ESLint / TypeScript errors | `next.config.ts` | |
| [ ] | **Low** | Dev logging of verification links / PII on signup | `app/register/actions.ts` | |

**Contrast (working as intended):** Channel messages API checks membership — `app/api/channels/messages/route.ts`. Admin page checks `role === 'ADMIN'` — `app/zenvy-admin/page.tsx`. Login `callbackUrl` open-redirect guard — `app/login/actions.ts`.

---

## Suggested fix order (for discussion)

1. Socket: verify JWT (match `pages/api/socket.ts`) or do not expose `server.js` / `standalone-socket.js` without auth.
2. REST + socket: authorize `roomId` for DMs (e.g. parse `dm_*` and ensure `session.user.id` is a participant).
3. Dependencies: `npm audit fix` + test auth and sessions.
4. Uploads + optional CSP + re-enable strict build when ready.

---

## Your decisions (fill in)

- **Production entrypoint:** `next start` / `server.js` / `standalone-socket.js` / other: _______________
- **Must-fix before prod:** _______________
- **Won’t fix / accept risk:** _______________
