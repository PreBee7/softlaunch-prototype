"use client";

import { Fragment } from "react";
import {
  Compass,
  SquarePen,
  Share2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Phase = "scout" | "editor" | "export";

const steps: { id: Phase; label: string; icon: LucideIcon }[] = [
  { id: "scout", label: "Scout", icon: Compass },
  { id: "editor", label: "Editor", icon: SquarePen },
  { id: "export", label: "Export", icon: Share2 },
];

type Props = {
  active: Phase;
  onChange: (phase: Phase) => void;
  /**
   * Optional per-step inline blocker. Rendered as a small icon + short
   * message below the step label only when set. Example:
   *   errors={{ editor: "Add at least 1 moment to unlock" }}
   */
  errors?: Partial<Record<Phase, string>>;
  /**
   * Force a step to be clickable/accessible even though it's positionally
   * "upcoming" relative to `active`. Use for: keeping Editor accessible
   * once the user has already created a video, so navigating Scout → Editor
   * → Scout doesn't re-lock Editor.
   */
  unlocked?: Partial<Record<Phase, boolean>>;
  /**
   * Optional per-step hover tooltip shown only when the step is *locked*.
   * Use to explain what the user needs to do to unlock it.
   */
  lockedTooltips?: Partial<Record<Phase, string>>;
};

// Ordered vertical workflow stepper. Three steps distributed across the full
// sidebar height; indicator circles are connected by a thin vertical line.
// Upcoming steps are locked + non-navigable unless the consumer marks them
// unlocked via `unlocked`. Completed steps are always clickable. Routing is
// unchanged — only non-locked steps fire `onChange`.
export function LeftRail({
  active,
  onChange,
  errors,
  unlocked,
  lockedTooltips,
}: Props) {
  const activeIdx = steps.findIndex((s) => s.id === active);

  return (
    <nav
      aria-label="Workflow"
      className="flex w-[96px] shrink-0 flex-col border-r border-[hsl(var(--border-subtle))] bg-transparent py-6"
    >
      <ol className="flex flex-1 flex-col items-stretch">
        {steps.map((s, i) => {
          const isActive = s.id === active;
          const isComplete = i < activeIdx;
          const isUpcoming = i > activeIdx;
          // "Locked" = upcoming and NOT explicitly unlocked by the consumer.
          // Unlocked-upcoming steps are clickable but still visually muted
          // (they're still later in the flow, just navigable).
          const isLocked = isUpcoming && !unlocked?.[s.id];
          const error = errors?.[s.id];
          const tooltip = isLocked ? lockedTooltips?.[s.id] : undefined;
          const isLast = i === steps.length - 1;
          const Icon = s.icon;
          // NB: we intentionally don't use the HTML `disabled` attribute —
          // disabled buttons swallow pointer events, which would suppress
          // hover and break the locked-state tooltip. We block the action in
          // the onClick handler instead and expose state via `aria-disabled`.
          const stepButton = (
            <button
              type="button"
              onClick={() => {
                if (isLocked) return;
                onChange(s.id);
              }}
              aria-pressed={isActive}
              aria-disabled={isLocked}
              aria-label={s.label}
              className={cn(
                "group flex w-full flex-col items-center gap-2 px-2 transition-colors duration-150 focus:outline-none",
                isLocked && "cursor-not-allowed",
                isActive && "text-indigo-500",
                isComplete && "text-foreground hover:text-indigo-500",
                isUpcoming && !isLocked && "text-muted-foreground hover:text-foreground",
                isLocked && "text-muted-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-colors duration-150",
                  isComplete &&
                    "border border-indigo-500 bg-background text-indigo-500",
                  isActive &&
                    "bg-indigo-500 text-white ring-2 ring-indigo-500/20",
                  isUpcoming &&
                    "border border-border bg-background text-muted-foreground"
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="text-xs font-medium leading-tight">
                {s.label}
              </span>
            </button>
          );
          return (
            <Fragment key={s.id}>
              <li className="flex flex-col items-center">
                {tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{stepButton}</TooltipTrigger>
                    <TooltipContent side="right">{tooltip}</TooltipContent>
                  </Tooltip>
                ) : (
                  stepButton
                )}

                {/* Optional inline blocker — only renders when an error is set
                    for this step. No reserved height when empty, so the layout
                    adapts naturally to viewport changes. */}
                {error && (
                  <div
                    role="alert"
                    className="mt-1.5 flex items-start justify-center gap-1 px-1 text-center text-[10px] leading-tight text-amber-600"
                  >
                    <AlertTriangle className="mt-px size-3 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </li>

              {/* Connector — fills the gap between this circle and the next,
                  giving the stepper its even, viewport-adaptive distribution. */}
              {!isLast && (
                <li
                  aria-hidden
                  className="flex flex-1 items-stretch justify-center py-1.5"
                >
                  <span className="w-px bg-border" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
