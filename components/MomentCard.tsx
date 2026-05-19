"use client";

import { Card } from "@/components/ui/card";
import { EvidenceChip } from "@/components/EvidenceChip";
import { ConfidenceRing } from "@/components/ConfidenceRing";
import { cn } from "@/lib/utils";
import type { Moment } from "@/lib/mock";

type Props = {
  moment: Moment;
  index: number;
  selected: boolean;
  onSelect: () => void;
};

// Generates a stable, varied muted gradient per moment id so thumbnails
// read as distinct without ever looking like a real screenshot.
function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(135deg, oklch(0.42 0.03 ${a}) 0%, oklch(0.28 0.02 ${b}) 100%)`;
}

export function MomentCard({ moment, index, selected, onSelect }: Props) {
  return (
    <Card
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group cursor-pointer gap-3 rounded-xl border p-3 transition-colors duration-150",
        selected
          ? "border-foreground/40 bg-accent/40 shadow-[0_0_0_1px_var(--color-foreground)/0.06]"
          : "hover:border-foreground/20 hover:bg-accent/30"
      )}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div
          className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md border border-border/60"
          style={{ background: thumbGradient(moment.id) }}
          aria-hidden
        >
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
            <span className="text-[10px] font-medium tabular-nums text-white/95">
              {moment.start}
            </span>
          </div>
          <div className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white/95">
            {moment.duration}
          </div>
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span className="tabular-nums">#{index + 1}</span>
                <span>·</span>
                <span>{moment.game}</span>
              </div>
              <h3 className="text-sm font-medium leading-snug tracking-tight">
                {moment.title}
              </h3>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <ConfidenceRing value={moment.confidence} size={36} strokeWidth={3} />
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {moment.confidence}% match
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {moment.evidence.slice(0, 3).map((ev, i) => (
              <EvidenceChip
                key={i}
                kind={ev.kind}
                label={ev.label}
                value={ev.value}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
