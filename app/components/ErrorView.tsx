import { AlertTriangle } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";

interface ErrorViewProps {
  error: unknown;
  title?: string;
  /** Developer-facing explanation. Only shown outside production. */
  message?: string;
  resetPath?: string;
}

const PUBLIC_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

export default function ErrorView({
  error,
  title = "Connection interrupted",
  message = "The application could not reach the database. Check DATABASE_URL and that the database accepts connections.",
  resetPath = "/login",
}: ErrorViewProps) {
  // Raw errors and setup hints can expose internals, so end users only ever see a generic message.
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas p-6 text-center font-grotesk text-fg">
      <span aria-hidden="true" className="inline-flex size-20 items-center justify-center rounded-full border-nb bg-alert text-ink shadow-nb">
        <AlertTriangle size={36} />
      </span>
      <h1 className="m-0 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="m-0 max-w-md text-fg-muted">{isProduction ? PUBLIC_MESSAGE : message}</p>
      {!isProduction && (
        <Card padding="sm" shadow="sm" className="w-full max-w-lg overflow-auto text-left">
          <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] uppercase">Technical trace (development only)</p>
          <pre className="m-0 font-jetbrains text-xs leading-relaxed whitespace-pre-wrap">{String(error)}</pre>
        </Card>
      )}
      <ButtonLink href={resetPath} size="lg">
        Back to log in
      </ButtonLink>
    </main>
  );
}
