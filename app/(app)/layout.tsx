import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/AppShell";
import { isEnabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";

// Shared layout for every signed-in screen. middleware.ts already redirects signed-out
// visitors; this check is a second line of defence for anything the matcher misses.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true, role: true },
  });
  if (!user) redirect("/login");

  return (
    <AppShell user={{ name: user.name, image: user.image, isAdmin: user.role === "ADMIN" }} flags={{ jobs: isEnabled("jobs") }}>
      {children}
    </AppShell>
  );
}
