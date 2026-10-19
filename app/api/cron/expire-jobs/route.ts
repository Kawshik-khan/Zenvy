import { NextResponse } from "next/server";
import { expireJobs } from "@/lib/jobs/service";

export const dynamic = "force-dynamic";

/**
 * Daily: marks live job posts past their deadline as expired. Idempotent.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; without a configured secret the route stays closed.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expired = await expireJobs();
  return NextResponse.json({ expired });
}
