import React from "react";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div aria-hidden="true" className={`loading-shimmer rounded-2xl ${className}`} />;
}

export function SkeletonText({ className = "" }: SkeletonBlockProps) {
  return <SkeletonBlock className={`h-3 ${className}`} />;
}

export function SkeletonAvatar({ className = "" }: SkeletonBlockProps) {
  return <SkeletonBlock className={`rounded-full ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonBlockProps) {
  return (
    <div className={`glass-panel-subtle rounded-[24px] p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonText className="w-24" />
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonText className="w-40" />
        </div>
        <SkeletonBlock className="h-11 w-11 rounded-2xl" />
      </div>
    </div>
  );
}
