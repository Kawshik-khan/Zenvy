import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { AppStateProvider } from "../state/AppState";
import { palette } from "../theme/tokens";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  // Fall back to system fonts rather than hanging on a blank screen if a font fails.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper }, animation: "slide_from_right" }}>
          <Stack.Screen name="call/incoming" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="call/active" options={{ presentation: "fullScreenModal", animation: "fade", contentStyle: { backgroundColor: palette.quietPaper } }} />
          <Stack.Screen name="matched/[id]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="focus-done" options={{ presentation: "modal" }} />
          <Stack.Screen name="post-ad" options={{ presentation: "modal" }} />
          <Stack.Screen name="events/new" options={{ presentation: "modal" }} />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
