import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { FeaturePanel } from "./FeaturePanel";

/** Sign-in and sign-up frame: rotating feature panel on the left, the form on the right. */
export function AuthSplit({ action, jobsEnabled, children }: { action?: ReactNode; jobsEnabled?: boolean; children: ReactNode }) {
  return (
    <div className="nb-cursor grid min-h-dvh bg-canvas font-grotesk text-fg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <CustomCursor />
      <div className="order-2 flex lg:order-1">
        <FeaturePanel jobsEnabled={jobsEnabled} />
      </div>
      <div className="order-1 flex min-w-0 flex-col lg:order-2">
        <header className="flex items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Logo />
          {action}
        </header>
        <main id="main-content" className="flex flex-1 items-start justify-center px-5 pt-2 pb-12 md:px-10 lg:items-center">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
