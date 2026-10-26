import { StyleSheet, View } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";

/** The notebook grid behind loud hero sections (`bg-grid` on the web). Decorative. */
export function GridBackground({ color = "#111111", opacity = 0.08, size = 42 }: { color?: string; opacity?: number; size?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="zenvy-grid" width={size} height={size} patternUnits="userSpaceOnUse">
            <Path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={2} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#zenvy-grid)" />
      </Svg>
    </View>
  );
}
