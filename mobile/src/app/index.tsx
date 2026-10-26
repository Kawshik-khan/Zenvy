import { Redirect } from "expo-router";

// Signed-out entry point. Once auth is wired, redirect signed-in users to /home instead.
export default function Index() {
  return <Redirect href="/welcome" />;
}
