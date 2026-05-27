"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PhaseContextPanel } from "@/components/PhaseContextPanel";

// Mocked AI processing steps — purely for communicating progress.
const STATUS_MESSAGES = [
  "Detecting reactions",
  "Checking chat spikes",
  "Ranking short-form moments",
];

// Widths for the intent-chip skeletons (mimics the real chip row).
const CHIP_WIDTHS = ["w-20", "w-28", "w-20", "w-24", "w-24", "w-28"];

/**
 * AI processing skeleton shown between Import ("Find best moments") and Scout.
 * Mirrors the Scout layout so the next screen feels "prepared", not swapped in.
 * Everything here is mocked — no real video/AI work happens.
 */
export function ScoutSkeleton({ durationMs = 1600 }: { durationMs?: number }) {
  const [progress, setProgress] = useState(8);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(98, Math.round((elapsed / durationMs) * 100)));
    }, 80);
    const stepMs = Math.max(400, Math.floor(durationMs / STATUS_MESSAGES.length));
    const step = setInterval(() => {
      setStatusIndex((i) => Math.min(STATUS_MESSAGES.length - 1, i + 1));
    }, stepMs);
    return () => {
      clearInterval(tick);
      clearInterval(step);
    };
  }, [durationMs]);

  return (
    <div
      className="flex h-[calc(100vh-2.5rem)] min-h-0 overflow-hidden"
      aria-busy="true"
      aria-label="Preparing Scout"
    >
      {/* Left rail skeleton */}
      <div className="flex w-[72px] shrink-0 flex-col border-r border-border bg-card/30">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 border-b border-border/60 px-2 py-4"
          >
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-2 w-8 rounded" />
          </div>
        ))}
      </div>

      {/* Tools panel skeleton */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-background">
        <div className="px-4 pt-4">
          <h2 className="text-sm font-medium">Scout moments</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Preparing your short-form moments…
          </p>
        </div>

        <Separator className="mt-4" />

        <div className="flex flex-1 flex-col gap-3 px-4 py-4">
          {/* Intent */}
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-1.5">
            {CHIP_WIDTHS.map((w, i) => (
              <Skeleton key={i} className={`h-6 rounded-full ${w}`} />
            ))}
          </div>
          <Skeleton className="h-16 w-full rounded-md" />

          <Separator className="my-1" />

          {/* Number of clips */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>

          <Separator className="my-1" />

          {/* Clip duration */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-14 rounded-md" />
          </div>

          <Separator className="my-1" />

          {/* Video duration */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>

        <div className="border-t border-border p-3">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </aside>

      {/* Working area */}
      <div className="flex flex-1 min-w-0 flex-col">
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 px-6 py-6">
          <div className="text-center">
            <h2 className="text-base font-medium tracking-tight">
              Scanning your stream
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Finding short-form moments for TikTok, Reels, and Shorts.
            </p>
          </div>

          {/* Center skeleton card — where the main clip preview will appear */}
          <Skeleton className="aspect-video w-full max-w-[560px] rounded-2xl" />

          {/* Progress + cycling status messages */}
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Progress value={progress} />
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{STATUS_MESSAGES[statusIndex]}…</span>
            </div>
          </div>
        </div>

        {/* Bottom — "Why this moment?" skeletons */}
        <PhaseContextPanel>
          <Skeleton className="mb-3 h-3 w-28" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background/60 p-3"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-12 w-full rounded" />
              </div>
            ))}
          </div>
        </PhaseContextPanel>
      </div>
    </div>
  );
}
