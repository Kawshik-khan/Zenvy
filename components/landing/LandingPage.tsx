import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { Calls, Communities, Features, FinalCta, HowItWorks, Matching } from "./Sections";

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas font-grotesk text-fg">
      <LandingNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Matching />
        <Calls />
        <Communities />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
