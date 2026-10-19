import { auth } from "@/auth";
import { getCachedStudyMetrics } from "@/lib/study-metrics-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, image: true },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const metrics = await getCachedStudyMetrics(user.id);

  return Response.json({
    user,
    metrics,
  });
}
