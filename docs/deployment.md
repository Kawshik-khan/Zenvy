# Production Deployment

## Vercel

Use Vercel's Git integration for the normal deployment path:

- Pull requests create Preview deployments.
- Merges to `main` create Production deployments.
- Keep `npm run ci` passing before merging.

Vercel project settings:

- Framework preset: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: leave default

Required environment variables are listed in `.env.example`. Set them in Vercel for Production and Preview.

## Database

This project uses Prisma with Supabase Postgres.

- Use `DATABASE_URL` with the Supabase transaction pooler URL for app runtime: port `6543` with `pgbouncer=true&connection_limit=5&pool_timeout=20`. Routes run their queries with `Promise.all`; a limit of 1 makes them queue one at a time.
- Functions run in `hnd1` (Tokyo, set in `vercel.json`) to sit next to the Supabase database in `ap-northeast-1`. Move both together if the database region changes.
- Use `DIRECT_URL` for direct database access.
- Schema changes go through **Prisma Migrate** (`prisma/migrations/`). Do not use `prisma db push` against shared databases.

Changing the schema (locally, against a dev database):

```bash
npm run prisma:migrate:dev -- --name describe_your_change   # creates prisma/migrations/<timestamp>_describe_your_change
```

Review the generated SQL for destructive statements, commit it with the schema change, then apply it in each environment:

```bash
npm run prisma:migrate   # prisma migrate deploy (uses DIRECT_URL)
```

CI checks that `prisma/migrations` and `schema.prisma` match.

### One-time baseline for existing databases

Databases created earlier with `db push` already have the tables from `0_init`. Mark that migration as applied instead of running it, then deploy the rest (`1_people_search_indexes` only uses `IF NOT EXISTS`, so it is safe whether or not those indexes were created by hand):

```bash
npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script   # should print an empty migration
npx prisma migrate resolve --applied 0_init
npm run prisma:migrate
```

If the first command prints anything other than an empty migration, the database has drifted from the schema; resolve that before marking the baseline as applied.

## Realtime And Calls

Vercel Functions are not a reliable host for long-lived Socket.IO/WebSocket servers. The Next.js app can deploy to Vercel, but realtime signaling should run separately.

Recommended production setup:

- Deploy the Next.js app on Vercel.
- Deploy `standalone-socket.js` or `server.js` on a persistent Node host such as Render, Fly.io, or a VPS.
- Set `NEXT_PUBLIC_SOCKET_URL` in Vercel to that socket host URL.
- Set the socket host CORS origin to the Vercel production URL.

Without a persistent socket host, chat realtime updates and WebRTC call signaling can fail in production.

### Render socket service

This repo includes `render.yaml` for deploying the lightweight Socket.IO signaling server on Render. It runs:

```bash
npm run start:socket
```

Set the same auth/database environment variables as Vercel, plus the deployed Vercel app URL:

```env
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

After Render deploys, set this in Vercel:

```env
NEXT_PUBLIC_SOCKET_URL=https://your-render-service.onrender.com
```

The Render socket service must use the same `AUTH_SECRET` / `NEXTAUTH_SECRET` as Vercel. The browser gets a short-lived socket token from the Vercel app and sends it to Render during the Socket.IO handshake, so mismatched auth secrets will keep chat stuck in the connecting state.

For production audio/video calls, configure a TURN server in Vercel. STUN-only calls can fail on mobile networks, strict NATs, and some Wi-Fi networks:

```env
NEXT_PUBLIC_TURN_URL=turns:your-turn-host:5349
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

If using LiveKit for calls, set these in Vercel:

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

Render remains responsible for chat and call notifications. LiveKit handles the actual audio/video media rooms.

## CI/CD

The included GitHub Actions workflow runs:

```bash
npm run prisma:validate
npm run lint
npm run typecheck
npm run build
```

This workflow is intended to gate pull requests. Vercel can still handle deployments through its Git integration.

For advanced custom deployments, use Vercel CLI from GitHub Actions:

```bash
vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
vercel build --token=$VERCEL_TOKEN
vercel deploy --prebuilt --token=$VERCEL_TOKEN
```

Use Vercel's built-in Git integration unless you need full CI ownership or GitHub Enterprise Server support.
