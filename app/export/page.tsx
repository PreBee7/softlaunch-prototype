"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Download,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { moments, platformChecks } from "@/lib/mock";
import { cn } from "@/lib/utils";

function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(160deg, oklch(0.30 0.04 ${a}) 0%, oklch(0.18 0.02 ${b}) 100%)`;
}

const formats = [
  { id: "mp4-h264", label: "MP4 — H.264", detail: "Universal, smallest file" },
  { id: "mp4-h265", label: "MP4 — H.265", detail: "Smaller, slower to encode" },
  { id: "mov-prores", label: "MOV — ProRes", detail: "Edit-quality, large file" },
];

export default function ExportPage() {
  const selected = moments[0];
  const [scrub, setScrub] = useState(28);
  const [playing, setPlaying] = useState(false);
  const [format, setFormat] = useState(formats[0]);
  const [exporting, setExporting] = useState(false);

  return (
    <AppShell>
      <header className="mb-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Export</span>
              <span aria-hidden>·</span>
              <span>Draft 1</span>
              <span aria-hidden>·</span>
              <span>0:18</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Platform readiness
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Your clip is ready for TikTok and Shorts. Reels has one warning worth a look before you post.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/editor">← Back to Editor</Link>
          </Button>
        </div>
      </header>

      <Separator className="mb-6" />

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT: Final preview (60%) */}
        <section className="col-span-12 lg:col-span-7">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[420px]">
              <div
                className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-border"
                style={{ background: thumbGradient(selected.id) }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                  aria-hidden
                />

                <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[10px] text-white/90">
                  <div className="rounded bg-black/45 px-1.5 py-0.5 tabular-nums backdrop-blur-sm">
                    1080 × 1920
                  </div>
                  <div className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">
                    Final
                  </div>
                </div>

                <div className="absolute inset-x-6 top-[28%] text-center">
                  <p
                    className="inline-block whitespace-pre text-balance px-3 py-1 text-[26px] font-bold uppercase leading-tight tracking-tight"
                    style={{
                      color: "#FFD93D",
                      WebkitTextStroke: "1.5px black",
                      textShadow: "0 2px 0 rgba(0,0,0,0.45)",
                    }}
                  >
                    1v3 with 4{"\n"}seconds left
                  </p>
                </div>

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

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-8 text-[10px] text-white/90">
                  <div className="flex items-center justify-between">
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
                  className="flex size-9 items-center justify-center rounded-md border border-border transition-colors duration-150 hover:bg-accent"
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

              {/* File summary */}
              <Card className="mt-5 gap-1 rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Output</span>
                  <span>est. 4.8 MB</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>1080 × 1920 · 30 fps · H.264</span>
                  <span className="tabular-nums">0:18</span>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* RIGHT: Platform readiness (40%) */}
        <section className="col-span-12 lg:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Platform readiness</h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              3 destinations
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {platformChecks.map((p) => (
              <li key={p.platform}>
                <PlatformCard
                  platform={p.platform}
                  summary={p.summary}
                  severity={p.severity}
                  items={p.items}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Export action bar */}
      <div className="mt-10 rounded-xl border border-border bg-card/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Format
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "mt-1 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors duration-150",
                      "hover:border-foreground/30 hover:bg-accent"
                    )}
                  >
                    <span>{format.label}</span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-1" align="start">
                  <ul className="flex flex-col">
                    {formats.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setFormat(f)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-accent",
                            format.id === f.id && "bg-accent"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border",
                              format.id === f.id
                                ? "border-foreground bg-foreground"
                                : "border-border"
                            )}
                          >
                            {format.id === f.id && (
                              <Check
                                className="size-2.5 text-background"
                                strokeWidth={4}
                              />
                            )}
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{f.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {f.detail}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Destination
              </div>
              <div className="mt-1 text-sm font-medium">Save to ~/Downloads</div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setExporting(true)}
            disabled={exporting}
            className="gap-1.5"
          >
            <Download className="size-4" />
            {exporting ? "Exporting…" : "Export clip"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

type CheckItem = {
  label: string;
  status: "ok" | "warn";
  detail: string;
};

function PlatformCard({
  platform,
  summary,
  severity,
  items,
}: {
  platform: string;
  summary: string;
  severity: "ok" | "warn";
  items: CheckItem[];
}) {
  const ok = severity === "ok";
  return (
    <Card className="gap-0 rounded-xl border p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-[11px] font-bold tracking-tight"
            aria-hidden
          >
            {platform.charAt(0)}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{platform}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              9:16 · short-form
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            ok
              ? "border-foreground/20 bg-background text-foreground"
              : "border-border bg-background text-foreground"
          )}
        >
          {ok ? (
            <Check className="size-3" strokeWidth={3} />
          ) : (
            <AlertTriangle className="size-3" />
          )}
          {summary}
        </span>
      </header>
      <ul className="flex flex-col">
        {items.map((it, i) => (
          <li
            key={it.label}
            className={cn(
              "flex items-start gap-3 px-4 py-2.5 text-xs",
              i !== items.length - 1 && "border-b border-border/40"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                it.status === "ok"
                  ? "bg-foreground/10 text-foreground"
                  : "bg-foreground/5 text-foreground"
              )}
            >
              {it.status === "ok" ? (
                <Check className="size-2.5" strokeWidth={4} />
              ) : (
                <AlertTriangle className="size-2.5" />
              )}
            </span>
            <div className="flex-1">
              <div className="font-medium">{it.label}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {it.detail}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
