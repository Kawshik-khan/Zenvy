import { View } from "react-native";
import { Phone } from "lucide-react-native";
import { Button, Surface, Text } from "../components";
import type { LiveCallViewProps } from "./LiveCallView.types";

// Web build of the app (previews only). Call media uses @livekit/react-native, which is native-only;
// LiveCallView.native.tsx is the real implementation on iOS and Android.
export function LiveCallView({ onLeave }: LiveCallViewProps) {
  return (
    <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
      <Surface shadow="sm" style={{ padding: 16, gap: 6 }}>
        <Text variant="h3">Call connected on the server</Text>
        <Text variant="small" muted>
          Audio and video run in the Android or iOS app. In a browser, join from the Zenvy website.
        </Text>
      </Surface>
      <Button label="Leave call" variant="danger" icon={Phone} onPress={onLeave} />
    </View>
  );
}
