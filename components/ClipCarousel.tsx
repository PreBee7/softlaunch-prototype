"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import type { Moment } from "@/lib/mock";

type Props = {
  moments: Moment[];
  activeIndex: number;
  onChange: (next: number) => void;
  /**
   * Optional per-clip rank label (e.g. "Best match", "Strong hook").
   * Same order as `moments`. Shown as a badge on each card.
   */
  labels?: string[];
};

function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(160deg, oklch(0.32 0.04 ${a}) 0%, oklch(0.18 0.02 ${b}) 100%)`;
}

// Wrapped relative position: shortest signed distance from i to active
// on a circular list of length n.
function wrappedDelta(i: number, active: number, n: number) {
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

// Selected ~380px tall → ~214px wide at 9:16. Neighbors at 70% → ~150px.
// Offset puts neighbor center ~250px from active center for a tight, scannable strip.
const HORIZONTAL_OFFSET = 250;

export function ClipCarousel({ moments, activeIndex, onChange, labels }: Props) {
  const n = moments.length;
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onChange((activeIndex + 1) % n);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onChange((activeIndex - 1 + n) % n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, n, onChange]);

  const next = () => onChange((activeIndex + 1) % n);
  const prev = () => onChange((activeIndex - 1 + n) % n);

  return (
    <div className="flex h-full w-full min-h-0 items-center justify-center overflow-hidden px-6">
      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center"
        role="region"
        aria-roledescription="carousel"
        aria-label="Ranked moments"
      >
        {/* Side chevrons */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous clip"
          className={cn(
            "absolute left-2 top-1/2 z-40 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors duration-150",
            "hover:bg-accent hover:text-foreground"
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next clip"
          className={cn(
            "absolute right-2 top-1/2 z-40 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors duration-150",
            "hover:bg-accent hover:text-foreground"
          )}
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Clip cards */}
        {moments.map((m, i) => {
          const delta = wrappedDelta(i, activeIndex, n);
          const isActive = delta === 0;
          const isNeighbor = Math.abs(delta) === 1;
          const visible = Math.abs(delta) <= 1;

          const scale = isActive ? 1 : isNeighbor ? 0.7 : 0.5;
          const opacity = isActive ? 1 : isNeighbor ? 0.5 : 0;
          const x = delta * HORIZONTAL_OFFSET;
          const z = isActive ? 30 : isNeighbor ? 20 : 0;

          const label = labels?.[i];

          return (
            <button
              type="button"
              key={m.id}
              onClick={() => {
                if (delta !== 0) onChange(i);
              }}
              aria-label={isActive ? `Selected: ${m.title}` : `Switch to ${m.title}`}
              tabIndex={isActive ? 0 : -1}
              aria-hidden={!visible}
              className={cn(
                "absolute left-1/2 top-1/2 cursor-pointer outline-none",
                isActive && "cursor-default"
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                opacity,
                zIndex: z,
                transition:
                  "transform 250ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease-out",
                pointerEvents: visible ? "auto" : "none",
              }}
            >
              <div
                className={cn(
                  "relative aspect-[9/16] h-[clamp(300px,calc(100vh-380px),380px)] overflow-hidden rounded-2xl border bg-black",
                  isActive ? "border-border shadow-2xl" : "border-border/60"
                )}
                style={m.videoUrl ? undefined : { background: thumbGradient(m.id) }}
              >
                {/* Real video plays inline when available */}
                {m.videoUrl && (
                  <video
                    src={m.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* Subtle grid — only when no video */}
                {!m.videoUrl && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                    aria-hidden
                  />
                )}

                {/* Rank label badge (top-left) */}
                {label && (
                  <div className="absolute left-3 top-3 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                    {label}
                  </div>
                )}

                {/* Timed transcript captions on the active clip only */}
                {isActive && <CaptionOverlay scale={0.78} />}

                {/* Center play indicator on active only */}
                {isActive && (
                  <div className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg">
                    <Play className="size-4 translate-x-[1px]" />
                  </div>
                )}

                {/* Footer chrome */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-[10px] text-white/95">
                  <div className="flex items-center justify-between">
                    <span className="font-medium tabular-nums">{m.duration}</span>
                    <span className="rounded bg-black/45 px-1.5 py-0.5">
                      {m.game}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
