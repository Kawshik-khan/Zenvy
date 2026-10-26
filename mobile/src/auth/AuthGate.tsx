import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useSegments } from "expo-router";
import { palette } from "../theme/tokens";
import { useAuth } from "./AuthProvider";

/**
 * Keeps signed-out people on the (auth) screens and signed-in people out of them.
 * Onboarding lives in (auth) but is reached right after sign-up, so it stays open to both.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const segments = useSegments() as string[];
  const first = segments[0];
  const inAuth = first === "(auth)";
  const onboarding = segments[1] === "onboarding-about" || segments[1] === "onboarding-style";

  useEffect(() => {
    if (status === "signedOut" && !inAuth && first !== undefined) router.replace("/welcome");
    if (status === "signedIn" && inAuth && !onboarding) router.replace("/home");
  }, [status, inAuth, onboarding, first]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.paper }} accessibilityLabel="Loading Zenvy">
        <ActivityIndicator size="large" color={palette.ink} />
      </View>
    );
  }
  return <>{children}</>;
}
