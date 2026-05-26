"use client";

import { useState } from "react";
import { Check, ChevronDown, Info, Minus, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Field label with an optional inline info-icon tooltip (helper on hover).
export function FieldLabel({ label, info }: { label: string; info?: string }) {
  return (
    <span className="flex items-center gap-1 text-sm font-medium">
      {label}
      {info && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`About ${label}`}
              className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            {info}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

// Stepper for a small integer (e.g. "Number of moments").
export function NumberStepper({
  label,
  info,
  value,
  min,
  max,
  onChange,
  disabled = false,
}: {
  label: string;
  info?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center gap-2">
      <FieldLabel label={label} info={info} />
      <div className="flex items-center rounded-md border border-border">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= min}
          aria-label="Decrease"
          className="flex size-7 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-[28px] text-center text-xs font-medium tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= max}
          aria-label="Increase"
          className="flex size-7 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// Final short-form video length. Single-choice, so it uses a dropdown.
const VIDEO_DURATION_OPTIONS = ["Auto", "15s", "30s", "45s", "60s", "90s"];

export function VideoDurationSelect({
  value,
  onChange,
  info,
  disabled = false,
  label = "Video duration",
}: {
  value: string;
  onChange: (v: string) => void;
  info?: string;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <FieldLabel label={label} info={info} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Change video duration"
            className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium tabular-nums transition-colors duration-150 hover:border-foreground/30 hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            {value}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-32 gap-0 p-1">
          <ul className="flex flex-col">
            {VIDEO_DURATION_OPTIONS.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-accent",
                    value === opt ? "text-foreground" : "text-foreground/80"
                  )}
                >
                  {opt}
                  {value === opt && <Check className="size-3.5" strokeWidth={3} />}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Target platforms — multi-select toggle chips (pick any combination).
const PLATFORMS = ["TikTok", "Reels", "Shorts"];

export function PlatformSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (p: string) =>
    onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Platform</span>
      <div className="flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => {
          const active = value.includes(p);
          return (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => toggle(p)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground/80 hover:border-foreground/30 hover:bg-accent hover:text-foreground"
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
