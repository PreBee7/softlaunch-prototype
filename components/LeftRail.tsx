"use client";

import { Fragment } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Phase = "scout" | "editor" | "export";

const steps: { id: Phase; label: string }[] = [
  { id: "scout", label: "Scout" },
  { id: "editor", label: "Editor" },
  { id: "export", label: "Export" },
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
};

// Ordered vertical workflow stepper. Three steps distributed across the full
// sidebar height; indicator circles are connected by a thin vertical line.
// Upcoming steps are not navigable (keeps the flow guided); completed steps
// remain clickable so the user can step back. Routing is unchanged — only
// non-upcoming steps fire `onChange`.
export function LeftRail({ active, onChange, errors }: Props) {
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
          const error = errors?.[s.id];
          const isLast = i === steps.length - 1;
          return (
            <Fragment key={s.id}>
              <li className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isUpcoming) return;
                    onChange(s.id);
                  }}
                  disabled={isUpcoming}
                  aria-pressed={isActive}
                  aria-disabled={isUpcoming}
                  aria-label={s.label}
                  className={cn(
                    "group flex w-full flex-col items-center gap-2 px-2 transition-colors duration-150 focus:outline-none",
                    isUpcoming && "cursor-not-allowed",
                    isActive && "text-indigo-500",
                    isComplete && "text-foreground hover:text-indigo-500",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full transition-colors duration-150",
                      isComplete &&
                        "border border-indigo-500 bg-background text-indigo-500",
                      isActive &&
                        "bg-indigo-500 ring-2 ring-indigo-500/20",
                      isUpcoming && "border border-border bg-background"
                    )}
                  >
                    {isComplete && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-medium leading-tight">
                    {s.label}
                  </span>
                </button>

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
