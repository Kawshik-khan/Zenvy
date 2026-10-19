import { AlertTriangle, Check, Hourglass, UserX } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ButtonLink, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type VerifyTone = "chat" | "alert" | "live";

const stateIcons = {
  error: AlertTriangle,
  expired: Hourglass,
  "no-user": UserX,
  success: Check,
} as const;

function VerifyState({
  icon,
  title,
  message,
  href,
  action,
  tone = "chat",
}: {
  icon: keyof typeof stateIcons;
  title: string;
  message: string;
  href?: string;
  action?: string;
  tone?: VerifyTone;
}) {
  const Icon = stateIcons[icon];
  const iconTone = { chat: "bg-chat", alert: "bg-alert", live: "bg-live" }[tone];

  return (
    <AuthShell>
      <Card shadow="lg" padding="lg" className="flex flex-col items-center gap-5 text-center">
        <span aria-hidden="true" className={`inline-flex size-20 items-center justify-center rounded-full border-nb text-ink ${iconTone}`}>
          <Icon size={36} />
        </span>
        <h1 className="m-0 font-grotesk text-3xl font-bold tracking-tight">{title}</h1>
        <p className="m-0 leading-relaxed text-fg-muted">{message}</p>
        {href && action && (
          <ButtonLink href={href} size="lg" fullWidth variant={tone === "live" ? "live" : "primary"}>
            {action}
          </ButtonLink>
        )}
      </Card>
    </AuthShell>
  );
}

export default async function VerifyPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <VerifyState
        icon="error"
        title="Missing token"
        message="The verification link is invalid. Please check your email again."
        href="/login"
        action="Back to log in"
        tone="alert"
      />
    );
  }

  const existingToken = await prisma.verificationToken.findUnique({ where: { token } });

  if (!existingToken || existingToken.expires < new Date()) {
    return (
      <VerifyState
        icon="expired"
        title="Link expired"
        message="This verification link has expired or has already been used."
        href="/register"
        action="Register again"
        tone="alert"
      />
    );
  }

  const user = await prisma.user.findUnique({ where: { email: existingToken.email } });

  if (!user) {
    return (
      <VerifyState
        icon="no-user"
        title="User not found"
        message="We could not find a user associated with this verification token."
        tone="alert"
      />
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { id: existingToken.id },
  });

  return (
    <VerifyState
      icon="success"
      title="Account verified"
      message="Your Zenvy account is active. You can now sign in and join your peers."
      href="/login"
      action="Sign in now"
      tone="live"
    />
  );
}
