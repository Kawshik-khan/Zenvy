import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Lock } from "lucide-react-native";
import { Button, Field, IconButton, Screen, Surface, Text, goBack } from "../../components";
import { GoogleButton, RevealButton } from "../../components/auth";
import { font, palette } from "../../theme/tokens";
import { isEmail } from "../../lib/validation";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  function submit() {
    if (!isEmail(email) || password.length < 8) {
      setError("Check your email and password and try again.");
      return;
    }
    setError(null);
    router.replace("/home");
  }

  return (
    <Screen edges={["bottom"]} contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ backgroundColor: palette.chat, borderBottomWidth: 3, borderColor: palette.ink, height: 210 + insets.top, paddingHorizontal: 24, paddingTop: insets.top + 8 }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => goBack("/welcome")} containerStyle={{ alignSelf: "flex-start" }} />
        <Surface tone="focus" radius={999} containerStyle={{ position: "absolute", right: 28, top: insets.top + 40 }} style={{ width: 112, height: 112, alignItems: "center", justifyContent: "center" }}>
          <Lock size={52} color={palette.ink} strokeWidth={2} />
        </Surface>
        <Text variant="display" accessibilityRole="header" style={{ position: "absolute", left: 24, bottom: 22 }}>
          Welcome{"\n"}back.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 18 }}>
        {error ? (
          <Surface tone="alert" shadow="sm" style={{ padding: 12 }} accessibilityRole="alert">
            <Text variant="strong">{error}</Text>
          </Surface>
        ) : null}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@g.bracu.ac.bd" />
        <View style={{ gap: 4 }}>
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!show} autoComplete="current-password" textContentType="password" right={<RevealButton shown={show} onToggle={() => setShow(!show)} />} />
          <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-end" }}>
            <Text variant="strong" style={{ textDecorationLine: "underline", fontSize: 14 }}>
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setRemember(!remember)} accessibilityRole="checkbox" accessibilityState={{ checked: remember }} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
          <View style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 3, borderColor: palette.ink, backgroundColor: remember ? palette.ink : palette.white, alignItems: "center", justifyContent: "center" }}>
            {remember ? <Text style={{ color: palette.paper, fontFamily: font.bold, fontSize: 14, lineHeight: 16 }}>✓</Text> : null}
          </View>
          <Text variant="strong">Keep me signed in</Text>
        </Pressable>

        <Button label="Log in" size="lg" onPress={submit} />
        <GoogleButton onPress={() => router.replace("/home")} />
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Text variant="body" muted>
            New to Zenvy?
          </Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace("/sign-up")} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text variant="strong" style={{ fontFamily: font.bold, textDecorationLine: "underline" }}>
              Create an account
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
