import type { Metadata } from "next";
import { findValidResetToken } from "@/lib/password-reset";
import { ResetLinkExpired, ResetPasswordFlow } from "./ResetPasswordFlow";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Set a new password · Zenvy" };

export default async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;
  const record = await findValidResetToken(token);
  if (!token || !record) return <ResetLinkExpired />;
  return <ResetPasswordFlow token={token} email={record.email} />;
}
