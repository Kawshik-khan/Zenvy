import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { ChannelStrip, Communities, Features, FinalCta, Focus, HowItWorks, Jobs, Matching } from "./Sections";

/** Public home page. `jobsEnabled` follows the FEATURE_JOBS flag, so the jobs board is only advertised when it's live. */
export default function LandingPage({ jobsEnabled = false }: { jobsEnabled?: boolean }) {
  return (
    <div className="nb-cursor min-h-dvh overflow-x-clip bg-canvas font-grotesk text-fg">
      <LandingNav jobsEnabled={jobsEnabled} />
      <main>
        <Hero jobsEnabled={jobsEnabled} />
        <ChannelStrip />
        <HowItWorks />
        <Features jobsEnabled={jobsEnabled} />
        <Matching />
        <Focus />
        {jobsEnabled && <Jobs />}
        <Communities />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
