import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// The session token lives in the iOS Keychain / Android Keystore via expo-secure-store.
// SecureStore has no web implementation, so the web build (used for previews) falls back to localStorage.

const KEY = "zenvy.session";

export type StoredSession = { token: string; expiresAt: string };

export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = Platform.OS === "web" ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.token || new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession | null) {
  try {
    if (Platform.OS === "web") {
      if (session) globalThis.localStorage?.setItem(KEY, JSON.stringify(session));
      else globalThis.localStorage?.removeItem(KEY);
      return;
    }
    if (session) await SecureStore.setItemAsync(KEY, JSON.stringify(session));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // A failed write only means the person signs in again next launch.
  }
}
