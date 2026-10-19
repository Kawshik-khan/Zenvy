import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isEnabled } from "@/lib/flags";

// The whole portal is dark until FEATURE_JOBS is on.
export default function JobsLayout({ children }: { children: ReactNode }) {
  if (!isEnabled("jobs")) notFound();
  return children;
}
