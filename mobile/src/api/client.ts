import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Called by AuthProvider whenever the session changes. */
export function setApiToken(next: string | null) {
  token = next;
}

/** AuthProvider signs out when any request comes back 401 (expired or revoked token). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; auth?: boolean; signal?: AbortSignal };

export async function api<T>(path: string, { method = "GET", body, auth = true, signal }: Options = {}): Promise<T> {
  if (!API_URL) throw new ApiError("The app is not connected to a server.", 0);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError("Can't reach Zenvy. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && auth && token) onUnauthorized?.();
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status, data?.fieldErrors);
  }
  return data as T;
}
