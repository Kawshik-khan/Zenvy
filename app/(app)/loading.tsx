import { SkeletonBlock, SkeletonCard, SkeletonText } from "@/components/ui";

// Shown inside the app shell while a signed-in screen loads; the sidebar and
// bottom bar stay in place.
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="min-h-dvh bg-canvas px-4 pt-6 pb-28 md:px-8 md:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <SkeletonText className="w-32" />
          <SkeletonBlock className="h-10 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <SkeletonBlock className="h-72 rounded-nb-lg" />
          <SkeletonBlock className="h-72 rounded-nb-lg" />
        </div>
      </div>
    </div>
  );
}
