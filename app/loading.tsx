import React from "react";
import { SkeletonAvatar, SkeletonBlock, SkeletonCard, SkeletonText } from "@/app/components/Skeleton";

function SidebarSkeleton() {
  return (
    <aside className="fixed bottom-4 left-4 top-4 z-[100] hidden w-[250px] flex-col rounded-[28px] glass-panel md:flex">
      <div className="flex items-center gap-4 p-6">
        <SkeletonBlock className="h-8 w-8 rounded-full" />
        <SkeletonBlock className="h-6 w-24" />
      </div>

      <div className="flex-1 space-y-2 px-3 py-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-2xl px-3 py-3">
            <SkeletonBlock className="h-6 w-6 rounded-lg" />
            <SkeletonText className="w-24" />
          </div>
        ))}
      </div>

      <div className="border-t glass-divider p-4">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container p-3">
          <div className="flex items-center gap-3">
            <SkeletonAvatar className="h-10 w-10" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonText className="w-24" />
              <SkeletonText className="w-20" />
            </div>
          </div>
          <SkeletonBlock className="mt-4 h-1.5 w-full rounded-full" />
          <div className="mt-4 flex items-end gap-2">
            <SkeletonBlock className="h-7 w-16" />
            <div className="ml-auto flex h-8 items-end gap-1">
              {Array.from({ length: 7 }).map((_, index) => (
                <SkeletonBlock key={index} className={`w-1.5 rounded-t-sm ${index % 3 === 0 ? "h-7" : index % 2 === 0 ? "h-5" : "h-3"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNavSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] border-t border-white/10 bg-[#090A12]/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-16px_40px_rgba(0,0,0,0.36)] backdrop-blur-2xl md:hidden">
      <div className="flex items-center gap-2 px-2 py-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2">
            <SkeletonBlock className="h-6 w-6 rounded-lg" />
            <SkeletonText className="w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl bg-surface-container/40 p-3">
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonText className="w-32" />
            <SkeletonText className="w-44" />
          </div>
          <SkeletonText className="w-12" />
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="app-aurora min-h-screen text-on-surface">
      <SidebarSkeleton />
      <MobileNavSkeleton />

      <main className="mobile-safe-bottom min-h-screen w-full max-w-full px-4 py-4 md:ml-[280px] md:px-4 md:py-6 md:pr-8">
        <header className="mb-6 flex items-center justify-between gap-3 md:mb-8 md:gap-6">
          <div className="min-w-0 flex-1 md:max-w-xl">
            <SkeletonBlock className="h-12 w-full rounded-2xl" />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <SkeletonBlock className="hidden h-10 w-28 rounded-xl md:block" />
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <SkeletonAvatar className="h-10 w-10" />
          </div>
        </header>

        <div className="space-y-6">
          <section className="glass-panel-subtle overflow-hidden rounded-[28px] p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-2xl space-y-4">
                <SkeletonText className="w-32" />
                <SkeletonBlock className="h-12 w-full max-w-xl md:h-14" />
                <SkeletonText className="w-full max-w-lg" />
                <SkeletonText className="w-3/4 max-w-md" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-surface-container/60 p-4">
                    <SkeletonText className="w-14" />
                    <SkeletonBlock className="mt-3 h-8 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="glass-panel-subtle rounded-[24px] p-5 lg:col-span-4">
              <div className="mb-5 flex items-center justify-between">
                <SkeletonText className="w-28" />
                <SkeletonBlock className="h-8 w-8 rounded-xl" />
              </div>
              <ActivitySkeleton />
            </div>

            <div className="glass-panel-subtle rounded-[24px] p-5 lg:col-span-8">
              <div className="mb-5 flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonText className="w-32" />
                  <SkeletonText className="w-48" />
                </div>
                <SkeletonBlock className="h-10 w-24 rounded-xl" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-surface-container/40 p-4">
                    <SkeletonBlock className="mb-4 h-28 w-full rounded-2xl" />
                    <SkeletonText className="w-32" />
                    <SkeletonText className="mt-2 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
