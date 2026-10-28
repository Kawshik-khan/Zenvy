import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Helpers shared by the /api/mobile route handlers.

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export class HttpError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** The signed-in user id, or an HttpError(401). */
export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new HttpError("Sign in to continue", 401);
  return id;
}

/**
 * Runs a handler and turns thrown errors into JSON. Server actions signal problems by throwing
 * Error with a user-facing message, so those messages are passed through with a 400.
 */
export async function handle(run: () => Promise<Response>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof HttpError) return fail(error.message, error.status);
    if (error instanceof Error && error.message === "Unauthorized") return fail("Sign in to continue", 401);
    // Database and framework errors can carry internals; only plain Errors from actions pass through.
    const internal = error instanceof Error && (error.name.startsWith("Prisma") || error.constructor !== Error);
    if (error instanceof Error && error.message && !internal) {
      console.error("Mobile API error:", error);
      return fail(error.message, 400);
    }
    console.error("Mobile API error:", error);
    return fail("Something went wrong", 500);
  }
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}

export function iso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

export function splitInterests(value?: string | null) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
