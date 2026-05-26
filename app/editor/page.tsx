"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Pause,
  Play,
  Volume2,
  Maximize2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AIDecisionChip } from "@/components/AIDecisionChip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { moments, aiDecisions, coachThread, coachSuggestions } from "@/lib/mock";
import { cn } from "@/lib/utils";

function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(160deg, oklch(0.30 0.04 ${a}) 0%, oklch(0.18 0.02 ${b}) 100%)`;
}

export default function EditorPage() {
  const selected = moments[0];
  const [scrub, setScrub] = useState(28);
  const [playing, setPlaying] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [compareOriginal, setCompareOriginal] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <AppShell>
        {/* Page header */}
        <header className="mb-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <span>Editor</span>
                <span aria-hidden>·</span>
                <span>Draft 1</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{selected.start}</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {selected.title}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                AI built a 0:18 vertical draft. Refine with the editor or lock decisions you like.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/scout">← Back to Scout</Link>
            </Button>
          </div>
        </header>

        <Separator className="mb-6" />

        {/* Three-column layout: 280 / flex / 360 */}
        <div className="grid grid-cols-[280px_1fr_360px] gap-6">
          {/* LEFT — AI Edit Stack */}
          <aside className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                AI Edit Stack
              </h2>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {aiDecisions.length}
              </span>
            </div>
            <ScrollArea className="h-[calc(100vh-280px)] pr-2">
              <ul className="flex flex-col gap-2">
                {aiDecisions.map((d) => (
                  <li key={d.id}>
                    <AIDecisionChip
                      kind={d.kind}
                      label={d.label}
                      value={d.value}
                      rationale={d.rationale}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
                Lock the decisions you want to keep. The editor won&apos;t touch locked items.
              </p>
            </ScrollArea>
          </aside>

          {/* CENTER — 9:16 preview */}
          <section className="flex min-h-0 flex-col items-center">
            <div className="w-full max-w-[400px]">
              {/* Vertical 9:16 preview */}
              <div
                className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-border"
                style={{ background: thumbGradient(selected.id) }}
              >
                {/* Subtle grid */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                  aria-hidden
                />

                {/* Top-of-frame meta */}
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-[10px] text-white/90">
                  <div className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-sm tabular-nums">
                    1080 × 1920
                  </div>
                  <div className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">
                    SAFE
                  </div>
                </div>

                {/* Caption overlay — bold yellow per AI decision */}
                <div className="absolute inset-x-6 top-[28%] text-center">
                  <p
                    className="inline-block whitespace-pre text-balance px-3 py-1 text-[26px] font-bold uppercase leading-tight tracking-tight"
                    style={{
                      color: "#FFD93D",
                      WebkitTextStroke: "1.5px black",
                      textShadow: "0 2px 0 rgba(0,0,0,0.45)",
                    }}
                  >
                    watch this{"\n"}clutch play
                  </p>
                </div>

                {/* Center play */}
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  aria-label={playing ? "Pause" : "Play"}
                  className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg transition-transform duration-150 hover:scale-105"
                >
                  {playing ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4 translate-x-[1px]" />
                  )}
                </button>

                {/* Bottom-of-frame chrome — fake handle, kill feed indicator */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-8">
                  <div className="flex items-center justify-between text-[10px] text-white/90">
                    <span className="font-medium">@bagginstv</span>
                    <span className="tabular-nums">{selected.start}</span>
                  </div>
                </div>
              </div>

              {/* Transport */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  aria-label={playing ? "Pause" : "Play"}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md border border-border transition-colors duration-150",
                    "hover:bg-accent"
                  )}
                >
                  {playing ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4 translate-x-[1px]" />
                  )}
                </button>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  0:0{Math.floor(scrub / 14)}
                </span>
                <Slider
                  value={[scrub]}
                  onValueChange={(v) => setScrub(v[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  0:18
                </span>
                <button
                  type="button"
                  aria-label="Volume"
                  className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                >
                  <Volume2 className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Fullscreen"
                  className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                >
                  <Maximize2 className="size-4" />
                </button>
              </div>

              {/* Caption preview info */}
              <Card className="mt-5 gap-2 rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Caption preview</span>
                  <span className="tabular-nums">0:00.4 → 0:02.1</span>
                </div>
                <p className="text-sm font-medium tracking-tight">
                  &ldquo;watch this clutch play&rdquo;
                </p>
              </Card>
            </div>
          </section>

          {/* RIGHT — Coach panel */}
          <aside className="flex min-h-0 flex-col rounded-xl border border-border bg-card/40">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex size-2 items-center justify-center">
                  <span className="absolute inline-flex size-2 animate-ping rounded-full bg-foreground/50" />
                  <span className="relative inline-flex size-2 rounded-full bg-foreground" />
                </span>
                <h2 className="text-sm font-medium">Editor</h2>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {coachThread.length} turns
              </span>
            </div>

            {/* Thread */}
            <ScrollArea className="flex-1 px-4 py-4 h-[calc(100vh-460px)]">
              <ul className="flex flex-col gap-3">
                {coachThread.map((t) => (
                  <li key={t.id}>
                    <CoachTurn
                      user={t.user}
                      aiSummary={t.aiSummary}
                      elapsed={t.elapsed}
                    />
                  </li>
                ))}
              </ul>
            </ScrollArea>

            {/* Suggested prompts */}
            <div className="border-t border-border/60 px-4 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Try
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {coachSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className={cn(
                      "rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors duration-150",
                      "hover:border-foreground/30 hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border/60 p-3">
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell the editor what to change…"
                  rows={3}
                  className="resize-none pr-12"
                />
                <button
                  type="button"
                  disabled={!prompt.trim()}
                  aria-label="Send"
                  className={cn(
                    "absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-md transition-colors duration-150",
                    prompt.trim()
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
              <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground">
                Ambiguous prompts get one clarifying question — not a guess.
              </p>
            </div>
          </aside>
        </div>
      </AppShell>

      {/* Persistent footer */}
      <footer className="sticky bottom-0 mt-auto border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Toggle
              pressed={compareOriginal}
              onPressedChange={setCompareOriginal}
              size="sm"
              className="data-[state=on]:bg-accent"
            >
              Compare with original
            </Toggle>
            {compareOriginal && (
              <span className="text-[11px] text-muted-foreground">
                Hold space to A/B
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Draft saved · just now
            </span>
            <Button asChild size="lg" className="gap-1.5">
              <Link href="/export">
                Continue to Export
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CoachTurn({
  user,
  aiSummary,
  elapsed,
}: {
  user: string;
  aiSummary: string;
  elapsed: string;
}) {
  const [compare, setCompare] = useState(false);
  return (
    <Card className="gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>You</span>
        <span className="normal-case">{elapsed}</span>
      </div>
      <p className="text-sm leading-snug text-foreground/90">&ldquo;{user}&rdquo;</p>
      <div className="border-t border-border/60 pt-2 -mt-px">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          Editor
        </div>
        <p className="text-sm leading-snug">{aiSummary}</p>
        <div className="mt-2 flex items-center justify-between">
          <Toggle
            pressed={compare}
            onPressedChange={setCompare}
            size="sm"
            className="h-7 px-2 text-[11px] data-[state=on]:bg-accent"
          >
            Compare before / after
          </Toggle>
          {compare && (
            <span className="text-[10px] text-muted-foreground">
              Showing v1 → v2
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
