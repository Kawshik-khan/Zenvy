import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { cx } from "@/components/ui";
import { KeyInMailIllustration, KeyToLockIllustration, LostKeyIllustration, UnlockedIllustration } from "@/components/illustrations/AuthIllustrations";
import { CustomCursor } from "@/components/motion/CustomCursor";

export type ResetStep = 0 | 1 | 2 | 3;

const STEPS = ["Enter email", "Check email", "New password", "Back in"];

const STORY = [
  { Art: LostKeyIllustration, alt: "A messy desk and a magnifying glass searching for a lost key", title: "Happens to everyone. Even during finals.", body: "We'll get you a new key in a couple of minutes." },
  { Art: KeyInMailIllustration, alt: "An envelope with a key inside, flying to an inbox", title: "Your key is on its way.", body: "Open the email on any device. The link only works once." },
  { Art: KeyToLockIllustration, alt: "A new key moving toward a padlock", title: "Make it one you'll remember.", body: "A short sentence works well, like “Coffee before calculus 1”." },
  { Art: UnlockedIllustration, alt: "The padlock clicks open", title: "You're back in.", body: "Your study partners are right where you left them." },
];

/**
 * Password reset frame. Uses the quiet volume (softer edges, calmer colours) and blue accent,
 * so it reads as a calm task rather than the bright sign-up pages. One illustration per step.
 */
export function ResetLayout({ step, children }: { step: ResetStep; children: ReactNode }) {
  const story = STORY[step];
  return (
    <div className="nb-cursor quiet flex min-h-dvh flex-col bg-canvas font-grotesk text-fg">
      <CustomCursor />
      <header className="border-b-[length:var(--nb-border-width)] border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Logo />
          <Link href="/login" className="nb-focus nb-press inline-flex min-h-11 items-center gap-2 rounded-nb border-nb bg-card px-4 font-bold text-fg no-underline shadow-nb-sm">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-8 pb-12 md:px-8">
        <nav aria-label="Password reset progress" className="relative pt-11">
          <div aria-hidden="true" className="absolute top-[3.95rem] right-[12.5%] left-[12.5%] h-2 overflow-hidden rounded-full border-2 border-line bg-quiet-shade">
            <span className="block h-full bg-chat transition-[width] duration-700 ease-[var(--ease-nb-out)]" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <span
            aria-hidden="true"
            className="absolute top-0 inline-flex h-9 w-10 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-line bg-focus text-ink shadow-nb-sm transition-[left] duration-700 ease-[var(--ease-nb-spring)]"
            style={{ left: `${12.5 + step * 25}%` }}
          >
            <KeyRound size={20} />
          </span>
          <ol className="m-0 grid list-none grid-cols-4 p-0 text-center">
            {STEPS.map((label, index) => (
              <li key={label} aria-current={index === step ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-sm font-bold sm:text-[15px]">
                <span
                  className={cx(
                    "relative inline-flex size-9 items-center justify-center rounded-full border-2 border-line font-jetbrains transition-colors duration-500",
                    index < step ? "bg-live" : index === step ? "bg-chat" : "bg-card",
                  )}
                >
                  {index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-wrap items-stretch gap-8">
          <section aria-label="Illustration" className="flex min-w-0 flex-[1_1_420px] flex-col justify-center gap-5 rounded-nb-lg border-nb bg-card p-6 shadow-nb-md">
            <div key={step} className="flex animate-nb-pop-in flex-col gap-4">
              <story.Art title={story.alt} className="mx-auto block h-auto w-full max-w-md" />
              <div className="flex flex-col gap-1">
                <p className="m-0 text-2xl font-bold tracking-tight">{story.title}</p>
                <p className="m-0 text-fg-muted">{story.body}</p>
              </div>
            </div>
          </section>
          <section aria-label="Reset your password" className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-nb-lg border-nb bg-card p-6 shadow-nb-md md:max-w-lg md:p-8">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
