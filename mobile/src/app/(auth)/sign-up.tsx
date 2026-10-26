import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Button, Field, Screen, Text, TopBar } from "../../components";
import { GoogleButton, OrDivider, RevealButton } from "../../components/auth";
import { palette } from "../../theme/tokens";
import { isEmail, passwordStrength } from "../../lib/validation";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const strength = passwordStrength(password);
  const errors = {
    name: !name.trim() ? "Enter your name." : undefined,
    email: !isEmail(email) ? "Enter a valid email address." : undefined,
    password: strength.score < 2 ? "Use at least 8 characters with a number." : undefined,
  };
  const valid = !errors.name && !errors.email && !errors.password;

  function submit() {
    setSubmitted(true);
    if (valid) router.push({ pathname: "/verify", params: { email: email.trim() } });
  }

  return (
    <Screen
      header={
        <TopBar
          fallback="/welcome"
          right={
            <Text variant="label" style={{ letterSpacing: 1 }}>
              Step 1 of 3
            </Text>
          }
        />
      }
    >
      <View style={{ gap: 6 }}>
        <Text variant="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34 }}>
          Create your account
        </Text>
        <Text variant="body" muted>
          Takes a minute. Your university email helps classmates trust you.
        </Text>
      </View>

      <GoogleButton onPress={() => router.push("/onboarding-about")} />
      <OrDivider />

      <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="Nadia Rahman" error={submitted ? errors.name : undefined} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        placeholder="you@g.bracu.ac.bd"
        error={submitted ? errors.email : undefined}
      />
      <View style={{ gap: 8 }}>
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoComplete="new-password"
          textContentType="newPassword"
          error={submitted ? errors.password : undefined}
          right={<RevealButton shown={show} onToggle={() => setShow(!show)} />}
        />
        <View style={{ flexDirection: "row", gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, borderWidth: 2, borderColor: palette.ink, backgroundColor: i < strength.score ? strength.color : palette.white }} />
          ))}
        </View>
        <Text variant="small" muted style={{ fontSize: 12 }} accessibilityLiveRegion="polite">
          {password ? `${strength.label}. ` : ""}At least 8 characters with a number.
        </Text>
      </View>

      <Button label="Create account" size="lg" onPress={submit} />
      <Text variant="small" muted style={{ textAlign: "center", fontSize: 12 }}>
        By continuing you agree to the Terms and Privacy Policy.
      </Text>
    </Screen>
  );
}
