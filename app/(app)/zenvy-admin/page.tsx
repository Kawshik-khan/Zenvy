import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, Card, CardHeader, EmptyState, StatTile } from "@/components/ui";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/zenvy-admin/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [userCount, groupCount, channelCount, pendingReportCount, recentUsers, pendingReports] = await Promise.all([
    prisma.user.count(),
    prisma.studyGroup.count(),
    prisma.channel.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, createdAt: true, emailVerified: true, profile: { select: { major: true } } },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { reporter: { select: { name: true } }, reported: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <section aria-labelledby="admin-title" className="flex flex-col gap-2">
          <h1 id="admin-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
            Admin overview
          </h1>
          <p className="m-0 text-lg text-fg-muted">Current totals, newest accounts and open reports.</p>
        </section>

        <section aria-label="Totals" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Users" value={userCount.toLocaleString()} tone="focus" />
          <StatTile label="Study groups" value={groupCount.toLocaleString()} tone="career" />
          <StatTile label="Channels" value={channelCount.toLocaleString()} tone="chat" />
          <StatTile label="Open reports" value={pendingReportCount.toLocaleString()} tone={pendingReportCount > 0 ? "alert" : "live"} />
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card padding="none" className="lg:col-span-2">
            <CardHeader title="Recent registrations" tone="focus" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead>
                  <tr className="border-b-2 border-line">
                    <th scope="col" className="px-5 py-3 text-sm font-bold">
                      Student
                    </th>
                    <th scope="col" className="px-5 py-3 text-sm font-bold">
                      Major
                    </th>
                    <th scope="col" className="px-5 py-3 text-sm font-bold">
                      Joined
                    </th>
                    <th scope="col" className="px-5 py-3 text-sm font-bold">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((row) => (
                    <tr key={row.id} className="border-b-2 border-line last:border-b-0">
                      <td className="px-5 py-3">
                        <p className="m-0 font-bold">{row.name || "Unnamed"}</p>
                        <p className="m-0 text-sm text-fg-muted">{row.email}</p>
                      </td>
                      <td className="px-5 py-3 text-[15px]">{row.profile?.major || "Not set"}</td>
                      <td className="px-5 py-3 text-[15px]">{row.createdAt.toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <Badge tone={row.emailVerified ? "live" : "focus"} size="sm">
                          {row.emailVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="none">
            <CardHeader title="Open reports" tone="alert" />
            <div className="p-4">
              {pendingReports.length === 0 ? (
                <EmptyState title="No open reports" description="Reports from students show up here." className="border-0 px-2" />
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {pendingReports.map((report) => (
                    <li key={report.id} className="rounded-nb border-2 border-line bg-canvas p-3">
                      <p className="m-0 font-bold">{report.reported.name || "Unnamed user"}</p>
                      <p className="m-0 mt-1 text-[15px]">{report.reason}</p>
                      <p className="m-0 mt-1 text-sm text-fg-muted">
                        Reported by {report.reporter.name || "a student"} on {report.createdAt.toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
