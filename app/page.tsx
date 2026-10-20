import { connection } from "next/server";
import LandingPage from "@/components/landing/LandingPage";
import { isEnabled } from "@/lib/flags";

export default async function Home() {
  // Feature switches come from env vars at request time, so they can change without a rebuild.
  await connection();
  return <LandingPage jobsEnabled={isEnabled("jobs")} />;
}
