# Matching System Implementation Plan

Goal: replace the single-sided, free-text scoring in `lib/discovery.ts` (`recommendPeople`) with an explainable, two-sided ranking pipeline built on structured data, and log outcomes so weights can be learned later.

## Current state (verified in code)

- `Profile.availability` and `Profile.interests` are free-text strings (`prisma/schema.prisma:102`); `studyStyle` is stored but unused in scoring.
- `recommendPeople()` (`lib/discovery.ts`) scores one direction only. Availability gives +10 for any non-empty text. Candidates are the 80 most recently updated users (`app/(app)/matching/page.tsx`).
- `app/api/matching/route.ts` has a different formula and no callers. Dead code.
- "Trending skills" is the first 8 sorted skill options, not a trend.
- `Match` has `status`, `compatibility`, `requestNote`. `StudyAd` has `subjects`, `availability`, `mode` as strings.
- Tooling: Prisma 5 with SQL migrations (`prisma/migrations/0..3`), vitest, `npm run ci`.

## Target architecture

```
hard filters (SQL) -> retrieval (SQL, ~500) -> scoring (pure TS, two-sided) -> re-rank -> UI cards with reasons
                                                                   \-> MatchEvent log (impressions/outcomes)
```

New code lives in `lib/matching/`:

| File | Responsibility |
|---|---|
| `config.ts` | Feature weights, fit-band thresholds, caps (single source of truth) |
| `availability.ts` | 42-bit slot bitmask helpers: encode/decode, overlap, label |
| `features.ts` | Pure functions: each returns 0..1 plus an optional reason string |
| `score.ts` | `scorePair(a, b)` = harmonic mean of both directions, top reasons |
| `retrieve.ts` | Prisma queries for candidates (course, college/major, tag overlap) |
| `rerank.ts` | Diversity, exposure cap, new-user boost |
| `events.ts` | `logMatchEvent()` |
| `index.ts` | `getRecommendations(userId, opts)` used by the page |

`lib/discovery.ts` keeps `recommendGroups`/`recommendChannels` and `searchScore`; `recommendPeople` is replaced by a thin wrapper over the new module, then removed.

## Phases

Each phase is independently shippable, ends green on `npm run ci`, and is one PR-sized commit series on branch `claude/cool-shannon-9cem2k`.

### Phase 1: Foundations (structured data, cleanup)

Schema (migration `4_matching_foundations`, additive and nullable, so no downtime):
- `Profile.availabilityMask BigInt?`, `Profile.goal String?`, `Profile.studyMode String?` (ONLINE | IN_PERSON | HYBRID | ANY). Keep `availability` text for display and backfill.
- `Tag { id, slug @unique, label }` and `UserTag { userId, tagId, kind (HAVE | WANT), @@id([userId, tagId, kind]), @@index([tagId]) }`.
- Backfill script: split `Profile.interests` into lowercase tags (kind HAVE); best-effort parse of common availability text ("after 9 pm", "all time", "evening") into a mask, otherwise leave null.

Code:
- `lib/matching/availability.ts` with tests (overlap, empty mask, bit boundaries).
- Tag normalisation (`slugify`, case-insensitive dedupe) and a `/api/tags?q=` autocomplete route.
- Profile and onboarding forms: weekly slot grid, tag input with autocomplete, goal/mode selects. Write to both old and new fields during transition.
- Fix "Trending skills": count tags used by profiles updated in the last 30 days, top 8.
- Card shows all reasons sorted by weight (remove the `slice(0, 4)` truncation for the card; keep 3 in the compact list).
- Delete `app/api/matching/route.ts`.

Acceptance: existing matching page behaves the same for users without new data; `python`/`Python` are one tag; trending list is by usage; schedule grid saves and reloads.

### Phase 2: Two-sided scoring and retrieval

Schema (migration `5_courses`): `Course { id, code, title?, college, @@unique([college, code]) }`, `Enrollment { userId, courseId, term, @@id([userId, courseId, term]), @@index([courseId, term]) }`. UI to add current courses on profile and onboarding (autocomplete, create-on-miss).

Code:
- `config.ts` weights: shared courses 0.30, schedule overlap 0.25, complementary skills 0.15, goal/style fit 0.10, shared tags (Jaccard) 0.10, activity 0.10. Same major/college/semester act as retrieval filters and small tie-breakers, not major score components.
- `features.ts`: each feature is 0..1 and testable. Missing data scores neutral-low, never penalises the other side.
- `scorePair`: `harmonic(fit(A->B), fit(B->A))`, returns `{ score, band, reasons[] }`. Bands: Great (>=0.7), Good (>=0.5), Possible. UI shows band and reasons, not a precise percent.
- `retrieve.ts`: hard filters (not blocked either way, `matchingAvailable`, not REJECTED/connected) plus union of: same course this term, same college and major, tag overlap. Cap 500, ordered by cheap SQL prefilter score.
- Page switches to `getRecommendations`; `Match.compatibility` stores the score at connect time.

Acceptance: unit tests cover symmetry (`score(a,b) == score(b,a)`), monotonicity (more shared slots never lowers the score), missing-data handling, and the existing blocked/rejected exclusions (port `lib/discovery.test.ts` cases). Page typechecks and renders with seed data.

### Phase 3: Outcomes, re-ranking, request-based matching

Schema (migration `6_match_events`): `MatchEvent { id, userId, targetUserId, type (IMPRESSION | VIEW | CONNECT | ACCEPT | FIRST_MESSAGE | ENGAGED), score Float?, features Json?, createdAt, @@index([userId, createdAt]), @@index([type, createdAt]) }`.

Code:
- Log impressions (batched, server-side on page render), profile views, connect, accept, first message, and "engaged" (5+ messages or a shared session within 14 days, computed by a scheduled job).
- `rerank.ts`: diversity (penalise near-duplicate feature profiles in the top 10), exposure cap (max N pending requests received per user per week; demote beyond it), new-user boost for the first 14 days.
- Activity feature: response rate and last-active decay.
- Study ads: structure `StudyAd.subjects` as course/tag links and mask availability; on create, compute the top 5 matches and send `Notification`s.

Acceptance: events written without blocking render (fire-and-forget, errors swallowed and logged); exposure cap covered by tests; a study ad notifies matching users only.

### Phase 4: Learning and scale (only once data exists)

- Candidate cache table `MatchCandidate(userId, candidateId, score, reasons, computedAt)`, refreshed by a job on profile change plus nightly. Add only when per-request scoring latency exceeds ~200 ms.
- Offline analysis: fit logistic regression on `MatchEvent` features to predict ENGAGED; compare learned weights to hand-set ones; A/B test behind a flag.
- Optional: pgvector embeddings of bio and goals as one extra feature.

## Testing and verification

- Unit (vitest): availability bitmask, each feature, `scorePair`, retrieval filters (mock Prisma like `lib/discovery.test.ts`), rerank.
- Update `e2e/smoke/matching.spec.ts` and `app/(app)/matching/partners.test.ts` for band and reasons display.
- Each phase: `npm run prisma:validate && npm run lint && npm run typecheck && npm run test`; run migrations against a scratch DB before commit.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Sparse data makes new features inert | Neutral scoring for missing fields; onboarding prompts; profile-completion nudges (`lib/profile-completion.ts`) |
| Migration/backfill errors on production data | Additive nullable columns, dual-write, idempotent backfill script, keep old columns until Phase 2 is stable |
| Hand-tuned weights are wrong | Weights isolated in `config.ts`; Phase 3 logging enables evidence-based tuning |
| Free-text course names fragment | Autocomplete, normalise code (`cse220` -> `CSE 220`), admin merge later |
| Popular users get swamped | Exposure cap and diversity in Phase 3 |

## Metric

North star: share of connections accepted that reach ENGAGED within 14 days. Secondary: connect rate per impression, accept rate, median time to first message.

## Open questions

1. Is there a course catalog or registrar data, or should students enter courses themselves?
2. How many users per college are expected near term? (Decides when the candidate cache is needed.)
3. Should the match percentage stay visible for continuity, or switch straight to bands?
