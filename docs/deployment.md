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

- Use `DATABASE_URL` with the Supabase pooler URL for app runtime.
- Use `DIRECT_URL` for direct database access.
- After changing `prisma/schema.prisma`, run:

```bash
npx prisma validate
npx prisma generate
npx prisma db push
```

Only push schema changes after reviewing the Prisma diff for destructive changes.

## Realtime And Calls

Vercel Functions are not a reliable host for long-lived Socket.IO/WebSocket servers. The Next.js app can deploy to Vercel, but realtime signaling should run separately.

Recommended production setup:

- Deploy the Next.js app on Vercel.
- Deploy `standalone-socket.js` or `server.js` on a persistent Node host such as Render, Fly.io, Railway, or a VPS.
- Set `NEXT_PUBLIC_SOCKET_URL` in Vercel to that socket host URL.
- Set the socket host CORS origin to the Vercel production URL.

Without a persistent socket host, chat realtime updates and WebRTC call signaling can fail in production.

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
