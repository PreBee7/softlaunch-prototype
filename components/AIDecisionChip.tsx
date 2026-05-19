"use client";

import { useState } from "react";
import {
  Lock,
  LockOpen,
  Undo2,
  Info,
  Type,
  Captions,
  Crop,
  Gauge,
  Scissors,
  Film,
  Columns2,
  LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DecisionKind =
  | "hook"
  | "caption"
  | "crop"
  | "layout"
  | "pacing"
  | "deadair"
  | "broll";

const iconMap: Record<DecisionKind, LucideIcon> = {
  hook: Type,
  caption: Captions,
  crop: Crop,
  layout: Columns2,
  pacing: Gauge,
  deadair: Scissors,
  broll: Film,
};

type Props = {
  kind: DecisionKind | string;
  label: string;
  value: string;
  rationale: string;
};

export function AIDecisionChip({ kind, label, value, rationale }: Props) {
  const [locked, setLocked] = useState(false);
  const [undone, setUndone] = useState(false);
  const Icon = iconMap[kind as DecisionKind] ?? Type;

  return (
    <Card
      className={cn(
        "gap-2 rounded-lg border p-3 transition-colors duration-150",
        "hover:border-foreground/20",
        undone && "opacity-50",
        locked && "border-foreground/40 bg-accent/30"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 truncate text-sm font-medium leading-snug">
            {value}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-0.5 border-t border-border/60 pt-2 -mt-px">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setLocked((v) => !v)}
              aria-pressed={locked}
              aria-label={locked ? "Unlock decision" : "Lock decision"}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150",
                "hover:bg-accent hover:text-foreground",
                locked && "bg-accent text-foreground"
              )}
            >
              {locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {locked ? "Locked — Coach won’t change this" : "Lock this decision"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setUndone((v) => !v)}
              aria-pressed={undone}
              aria-label="Undo decision"
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150",
                "hover:bg-accent hover:text-foreground",
                undone && "bg-accent text-foreground"
              )}
            >
              <Undo2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {undone ? "Reverted — click to reapply" : "Undo this decision"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Explain decision"
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150",
                "hover:bg-accent hover:text-foreground"
              )}
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
            {rationale}
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}
