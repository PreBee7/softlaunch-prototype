"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CaptionStyle = "default" | "shout" | "death";

type Caption = {
  /** Start time in seconds within the loop. */
  start: number;
  /** End time in seconds. */
  end: number;
  text: string;
  style?: CaptionStyle;
};

// Transcript-driven captions for the selected Paladin clip.
// Designed as ~18-second loop, mirroring the spoken dialogue.
const CAPTIONS: Caption[] = [
  { start: 0.0,  end: 1.7,  text: "That's the build, chat" },
  { start: 1.7,  end: 3.0,  text: "Lock it in" },
  { start: 3.0,  end: 5.2,  text: "Probably one of the best builds\nin the game" },
  { start: 5.2,  end: 6.8,  text: "EPS GIGA PALADIN", style: "shout" },
  { start: 6.8,  end: 8.2,  text: "Oh man — I'm getting wrecked" },
  { start: 8.2,  end: 10.0, text: "Clicking my abilities right now" },
  { start: 10.0, end: 11.8, text: "I haven't set keybinds…" },
  { start: 11.8, end: 13.0, text: "I'M DEAD", style: "death" },
  { start: 13.0, end: 14.3, text: "We're gonna die" },
  { start: 14.3, end: 15.6, text: "No mana — can't cast it" },
  { start: 15.6, end: 16.6, text: "ACTION INTERRUPTED", style: "shout" },
  { start: 16.6, end: 18.0, text: "YOU HAVE DIED", style: "death" },
];

const LOOP_SECONDS = 18;

const STYLE_CONFIG: Record<CaptionStyle, { color: string; stroke: string; fontSize: number }> = {
  default: { color: "#FFD93D", stroke: "1.5px black", fontSize: 26 },
  shout:   { color: "#FFD93D", stroke: "2px black",   fontSize: 32 },
  death:   { color: "#FF5959", stroke: "2px black",   fontSize: 30 },
};

type Props = {
  className?: string;
  /** Scale the typography up/down for smaller frames (e.g. carousel = 0.8). */
  scale?: number;
};

export function CaptionOverlay({ className, scale = 1 }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      setElapsed(((performance.now() - start) / 1000) % LOOP_SECONDS);
    }, 80);
    return () => clearInterval(id);
  }, []);

  const active = CAPTIONS.find((c) => elapsed >= c.start && elapsed < c.end);
  if (!active) return null;

  const cfg = STYLE_CONFIG[active.style ?? "default"];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-4 top-[26%] text-center",
        className
      )}
    >
      <p
        key={`${active.start}-${active.text}`}
        className="inline-block whitespace-pre-line text-balance px-3 py-1 font-extrabold uppercase leading-[1.05] tracking-tight animate-in fade-in zoom-in-95 duration-200"
        style={{
          color: cfg.color,
          WebkitTextStroke: cfg.stroke,
          textShadow:
            "0 2px 0 rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)",
          fontSize: cfg.fontSize * scale,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
          letterSpacing: "-0.01em",
        }}
      >
        {active.text}
      </p>
    </div>
  );
}
