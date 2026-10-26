import { useEffect, useRef, useState } from "react";
import { TextInput, View, type TextInputInstance } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Clock, Mail } from "lucide-react-native";
import { Button, Screen, Surface, Text, TopBar } from "../../components";
import { font, palette } from "../../theme/tokens";

const LENGTH = 6;

export default function Verify() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [focused, setFocused] = useState(0);
  const [seconds, setSeconds] = useState(42);
  const inputs = useRef<(TextInputInstance | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      // Pasted or autofilled code.
      const next = clean.slice(0, LENGTH).split("");
      setDigits([...next, ...Array(LENGTH - next.length).fill("")]);
      inputs.current[Math.min(next.length, LENGTH - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  const complete = digits.every(Boolean);

  return (
    <Screen
      header={
        <TopBar
          fallback="/sign-up"
          right={
            <Text variant="label" style={{ letterSpacing: 1 }}>
              Step 2 of 3
            </Text>
          }
        />
      }
      contentStyle={{ gap: 24 }}
    >
      <Surface tone="match" containerStyle={{ alignSelf: "center", marginTop: 12, transform: [{ rotate: "-4deg" }] }} radius={18} style={{ width: 108, height: 108, alignItems: "center", justifyContent: "center" }}>
        <Mail size={54} color={palette.ink} strokeWidth={2} />
      </Surface>

      <View style={{ alignItems: "center", gap: 8 }}>
        <Text variant="title" accessibilityRole="header">
          Check your inbox
        </Text>
        <Text variant="body" muted style={{ textAlign: "center" }}>
          We sent a 6-digit code to{"\n"}
          <Text variant="strong">{email || "your email"}</Text>
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Verification code
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChangeText={(t) => setDigit(i, t)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
              }}
              onFocus={() => setFocused(i)}
              keyboardType="number-pad"
              textContentType={i === 0 ? "oneTimeCode" : undefined}
              autoComplete={i === 0 ? "one-time-code" : undefined}
              maxLength={i === 0 ? LENGTH : 1}
              accessibilityLabel={`Digit ${i + 1} of ${LENGTH}`}
              autoFocus={i === 0}
              style={{
                width: 50,
                height: 64,
                padding: 0,
                borderWidth: 3,
                borderRadius: 10,
                borderColor: focused === i ? palette.chat : palette.ink,
                backgroundColor: d ? palette.focus : palette.white,
                textAlign: "center",
                fontFamily: font.monoBold,
                fontSize: 26,
                color: palette.ink,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Clock size={18} color={palette.muted} />
        {seconds > 0 ? (
          <Text variant="small" muted>
            Resend code in <Text variant="mono">0:{String(seconds).padStart(2, "0")}</Text>
          </Text>
        ) : (
          <Button label="Resend code" variant="ghost" size="sm" onPress={() => setSeconds(42)} />
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Button label="Verify and continue" size="lg" disabled={!complete} onPress={() => router.replace("/onboarding-about")} />
        <Button label="Use a different email" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
