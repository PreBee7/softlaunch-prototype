"use client";

import { Compass, SquarePen, Share2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Phase = "scout" | "editor" | "export";

const items: { id: Phase; label: string; icon: LucideIcon }[] = [
  { id: "scout", label: "Scout", icon: Compass },
  { id: "editor", label: "Editor", icon: SquarePen },
  { id: "export", label: "Export", icon: Share2 },
];

type Props = {
  active: Phase;
  onChange: (phase: Phase) => void;
};

export function LeftRail({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Phase"
      className="flex w-[72px] shrink-0 flex-col border-r border-[hsl(var(--border-subtle))] bg-transparent"
    >
      <ul className="flex flex-col">
        {items.map((it) => {
          const isActive = it.id === active;
          const Icon = it.icon;
          return (
            <li key={it.id} className="border-b border-border/60">
              <button
                type="button"
                onClick={() => onChange(it.id)}
                aria-pressed={isActive}
                aria-label={it.label}
                className={cn(
                  "group flex w-full flex-col items-center gap-1.5 px-2 py-4 transition-colors duration-150",
                  isActive
                    ? "text-indigo-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-md p-1.5 transition-colors duration-150",
                    isActive && "bg-indigo-500/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors duration-150",
                      isActive ? "text-indigo-500" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-xs leading-tight transition-colors duration-150",
                    isActive ? "text-indigo-500" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {it.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
