"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Pause,
  Maximize2,
  Check,
  X,
  Clock,
  Sparkles,
  UploadCloud,
  Type,
  Captions,
  Crop,
  Columns2,
  Gauge,
  Scissors,
  Film,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { LeftRail, type Phase } from "@/components/LeftRail";
import { PhaseContextPanel } from "@/components/PhaseContextPanel";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { moments, promptEnhancements, type Moment } from "@/lib/mock";
import { cn } from "@/lib/utils";

// Mock "Enhance prompt" for the Scout query — mirrors the Import behavior.
function enhanceQuery(q: string): string {
  const t = q.trim();
  if (promptEnhancements[t]) return promptEnhancements[t];
  return `Find ${
    t.toLowerCase() || "different moments"
  } with strong creator reaction, chat response, and a clear first 3-second hook.`;
}

// Key used to receive the chosen intent handed off from Import.
const INTENT_HANDOFF_KEY = "scout:intent";

export default function ScoutPage() {
  const [activePhase, setActivePhase] = useState<Phase>("scout");
  const [activeIndex, setActiveIndex] = useState(0);

  // Tools panel state (Scout) — intent only; scan options live on Import now.
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  // Pre-fill the intent handed off from Import. Reading a browser API on mount
  // is the right place for an effect; setState here is intentional (one-time).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INTENT_HANDOFF_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        selectedIntent?: string | null;
        prompt?: string;
      };
      /* eslint-disable react-hooks/set-state-in-effect -- one-time hydrate from Import handoff */
      if (data.selectedIntent !== undefined) setSelectedIntent(data.selectedIntent);
      if (typeof data.prompt === "string") setPrompt(data.prompt);
      /* eslint-enable react-hooks/set-state-in-effect */
      sessionStorage.removeItem(INTENT_HANDOFF_KEY);
    } catch {
      // Ignore malformed/unavailable storage.
    }
  }, []);

  // Moments the user has added to the draft video (selection order).
  // The timeline starts empty; the user adds moments from the filmstrip.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const addMoment = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  const removeMoment = (id: string) =>
    setSelectedIds((ids) => ids.filter((x) => x !== id));
  const timelineMoments = selectedIds
    .map((id) => moments.find((m) => m.id === id))
    .filter((m): m is Moment => Boolean(m));

  const selected = moments[activeIndex];

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 overflow-hidden">
      {/* Left rail */}
      <LeftRail active={activePhase} onChange={setActivePhase} />

      {/* Tools panel + working area — one per phase */}
      {activePhase === "scout" && (
        <ScoutWorkspace
          activeIndex={activeIndex}
          onChangeIndex={setActiveIndex}
          selectedIntent={selectedIntent}
          setSelectedIntent={setSelectedIntent}
          prompt={prompt}
          setPrompt={setPrompt}
          selected={selected}
          selectedIds={selectedIds}
          addMoment={addMoment}
          removeMoment={removeMoment}
          timelineMoments={timelineMoments}
          onCreateVideo={() => setActivePhase("editor")}
        />
      )}
      {activePhase === "editor" && (
        <EditorWorkspace
          selected={selected}
          timelineMoments={timelineMoments}
          removeMoment={removeMoment}
          onChangeIndex={setActiveIndex}
        />
      )}
      {activePhase === "export" && (
        <ExportWorkspace
          selected={selected}
          activeIndex={activeIndex}
          onBack={() => setActivePhase("editor")}
        />
      )}
    </div>
  );
}

type WorkspaceProps = {
  activeIndex: number;
  onChangeIndex: (i: number) => void;
  selectedIntent: string | null;
  setSelectedIntent: (s: string | null) => void;
  prompt: string;
  setPrompt: (s: string) => void;
  selected: Moment;
  selectedIds: string[];
  addMoment: (id: string) => void;
  removeMoment: (id: string) => void;
  timelineMoments: Moment[];
  onCreateVideo: () => void;
};

// Compact creator-facing stats shown below the carousel.
function statsFor(m: Moment) {
  const chatEv = m.evidence.find((e) => e.kind === "chat");
  const peak = Math.max(...m.audioWaveform);
  const energy = peak > 0.7 ? "High" : peak > 0.45 ? "Medium" : "Low";
  const hasQuote = m.evidence.some((e) => e.kind === "quote");
  const hookStrength =
    hasQuote || peak > 0.7 ? "Strong" : peak > 0.5 ? "Good" : "Light";
  const quality =
    m.confidence >= 80 ? "Good" : m.confidence >= 70 ? "OK" : "Low";
  return [
    { label: "Duration", value: m.duration },
    { label: "Chat spike", value: chatEv?.value ?? "—" },
    { label: "Energy", value: energy },
    { label: "Hook", value: hookStrength },
    { label: "Video quality", value: quality },
  ];
}

// Refinement chips in the Scout chat composer.
const SCOUT_REFINE_CHIPS = [
  "More creator reaction",
  "Less gameplay",
  "Under 30s",
  "More chat spikes",
];

// A "scan" is a ranking (order) of the moments plus its label.
type ScanState = {
  order: number[];
  scanNumber: number;
  scanLabel: string;
};

// Scout chat message — supports a loading state and a restore action.
type ScoutMsg = {
  id: string;
  role: "user" | "ai";
  text: string;
  loading?: boolean;
  restore?: ScanState;
};

// Chat bubble for the Scout command thread.
// A single chat turn: an aligned bubble (user right / assistant left). Shared by
// Scout and the Editor (Coach). No sender label — the bubble alone carries it.
function ChatBubble({
  role,
  text,
  loading = false,
  children,
}: {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <li className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed text-foreground",
          isUser ? "bg-primary/10" : "bg-indigo-50",
          loading && "animate-pulse text-muted-foreground"
        )}
      >
        {text}
      </div>
      {children}
    </li>
  );
}

function ScoutWorkspace(p: WorkspaceProps) {
  const stats = useMemo(() => statsFor(p.selected), [p.selected]);

  // Each "scan" is a ranking (order) of the moments. Scan 1 is the initial set.
  const [order, setOrder] = useState<number[]>(() => moments.map((_, i) => i));
  const [reranking, setReranking] = useState(false);
  const [scanNumber, setScanNumber] = useState(1);
  const [scanLabel, setScanLabel] = useState("Scan 1");

  // Chat thread continuing from the Import intent. The opening user/AI bubbles
  // are derived live; follow-up turns (incl. loading + restore) live here.
  const [query, setQuery] = useState("");
  const [thread, setThread] = useState<ScoutMsg[]>([]);

  // Re-scan: add a chat turn + loading bubble, skeleton the moment areas, then
  // swap in a fresh set of 6 mocked moments. Keeps the previous scan to restore.
  const submitQuery = () => {
    if (reranking) return;
    const text = query.trim() || "Find different moments.";
    const stamp = Date.now();
    const loadingId = `a${stamp}`;
    const prevScan: ScanState = { order, scanNumber, scanLabel };

    setThread((t) => [
      ...t,
      { id: `u${stamp}`, role: "user", text },
      { id: loadingId, role: "ai", text: "Scanning for new moments…", loading: true },
    ]);
    setQuery("");
    setReranking(true);

    setTimeout(() => {
      const next = [...moments.map((_, i) => i)].sort(() => Math.random() - 0.5);
      const num = prevScan.scanNumber + 1;
      setOrder(next);
      setScanNumber(num);
      setScanLabel(`Scan ${num}`);
      p.onChangeIndex(next[0]);
      setThread((t) =>
        t.map((m) =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: "ai",
                text: "I found 6 new moments based on that.",
                restore: prevScan,
              }
            : m
        )
      );
      setReranking(false);
    }, 1500);
  };

  // Restore a previous scan's moments + label.
  const restoreScan = (scan: ScanState) => {
    if (reranking) return;
    setOrder(scan.order);
    setScanNumber(scan.scanNumber);
    setScanLabel(scan.scanLabel);
    p.onChangeIndex(scan.order[0]);
  };

  return (
    <>
      {/* Working area — two columns: 65% preview (hero) · 35% why this moment */}
      <div className="flex flex-1 min-w-0 flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Left main column — scan label · filmstrip · name · preview */}
          <div className="flex w-[65%] min-w-0 flex-col bg-[hsl(var(--surface-canvas))]">
            {/* Scan label (left) + Create video CTA (right). Sits at the top
                of the main preview section — the assembly timeline that used
                to host this CTA belongs in Editor, not Scout. */}
            <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {reranking
                  ? "Scanning…"
                  : `${scanLabel} · ${order.length} moments found`}
              </span>
              <Button
                size="sm"
                onClick={p.onCreateVideo}
                disabled={p.timelineMoments.length === 0}
                className={cn(
                  "transition-all duration-150 ease-out",
                  p.timelineMoments.length > 0
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "cursor-not-allowed bg-muted text-muted-foreground disabled:opacity-100"
                )}
              >
                Create video
              </Button>
            </div>

            {/* Moment filmstrip selector (top) */}
            <ThumbnailStrip
              order={order}
              activeIndex={p.activeIndex}
              onChangeIndex={p.onChangeIndex}
              selectedIds={p.selectedIds}
              addMoment={p.addMoment}
              removeMoment={p.removeMoment}
              loading={reranking}
            />

            {/* 2. Moment name — sits right under the filmstrip */}
            <div className="shrink-0 px-6 pt-2 text-center">
              {reranking ? (
                <Skeleton className="mx-auto h-5 w-64" />
              ) : (
                <>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Preview · Moment {order.indexOf(p.activeIndex) + 1}
                  </p>
                  <h2 className="text-base font-semibold leading-snug text-foreground">
                    {p.selected.title}
                  </h2>
                </>
              )}
            </div>

            {/* 3. Large selected moment preview — top-aligned, close to the name */}
            <div className="flex min-h-0 flex-1 items-start justify-center px-6 pb-3 pt-2">
              {reranking ? (
                <Skeleton className="aspect-video w-full max-w-[560px] rounded-2xl" />
              ) : (
                <MomentPreview moment={p.selected} />
              )}
            </div>
          </div>

          {/* Right main column — Why this moment? (signal chips + full-height cards) */}
          <aside className="flex w-[35%] shrink-0 flex-col border-l border-[hsl(var(--border-subtle))] bg-transparent">
            <div className="px-4 pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Why this moment?
              </h3>
            </div>

            <div className="flex flex-1 min-h-0 flex-col px-4 pb-4 pt-3">
              {/* Signal chips */}
              {reranking ? (
                <div className="flex flex-wrap gap-1.5">
                  {[64, 80, 56, 52, 88].map((w, i) => (
                    <Skeleton
                      key={i}
                      className="h-5 rounded-full"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {stats.map((s) => (
                    <span
                      key={s.label}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {s.label}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {s.value}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Compact cards — fit within the panel (scroll if very short) */}
              {reranking ? (
                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                  <Skeleton className="min-h-0 flex-1 rounded-lg" />
                  <Skeleton className="min-h-0 flex-1 rounded-lg" />
                  <Skeleton className="min-h-0 flex-1 rounded-lg" />
                </div>
              ) : (
                <div
                  key={p.selected.id}
                  className="mt-3 flex min-h-0 flex-1 flex-col gap-3"
                >
                  <WhyCard text="Chat activity spiked here">
                    <SpikeBars data={p.selected.chatVelocity} />
                  </WhyCard>
                  <WhyCard text="Creator reaction is clear">
                    <ReactionMeter moment={p.selected} />
                  </WhyCard>
                  <WhyCard text="Strong first 3 seconds">
                    <RiseCurve data={p.selected.viewerDelta} />
                  </WhyCard>
                </div>
              )}
            </div>
          </aside>
        </div>

      </div>

      {/* Tools panel — chat-style thread continuing from Import (now on the right) */}
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-panel))]">
        {/* Header */}
        <div className="px-4 pt-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Scout moments
          </h2>
        </div>

        {/* Chat thread */}
        <ScrollArea className="flex-1 min-h-0">
          <ul className="flex flex-col space-y-4 px-4 pb-3 pt-6">
            {/* Original Import intent + AI's first response */}
            <ChatBubble
              role="user"
              text={
                p.prompt.trim() ||
                "Find the most interesting moments in my stream."
              }
            />
            <ChatBubble
              role="ai"
              text={`I found ${moments.length} recommended moments.`}
            />
            {/* Follow-up turns (incl. loading + restore) */}
            {thread.map((m) => (
              <ChatBubble
                key={m.id}
                role={m.role}
                text={m.text}
                loading={m.loading}
              >
                {m.restore && (
                  <button
                    type="button"
                    onClick={() => restoreScan(m.restore!)}
                    className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                  >
                    <ChevronLeft className="size-3" />
                    View previous scan
                  </button>
                )}
              </ChatBubble>
            ))}
          </ul>
        </ScrollArea>

        {/* Sticky bottom composer */}
        <div className="px-4 pt-3 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {SCOUT_REFINE_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setQuery(c)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-sm text-foreground transition-colors duration-150 hover:border-foreground/30 hover:bg-accent hover:text-foreground"
              >
                {c}
              </button>
            ))}
          </div>

          <Card className="relative mt-4 border-none bg-[hsl(var(--surface-sunken))] p-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitQuery();
                }
              }}
              placeholder="Ask Scout to find different moments…"
              rows={2}
              className="min-h-[60px] resize-none border-0 bg-transparent pr-10 text-sm shadow-none focus-visible:ring-0"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!query.trim()}
                  onClick={() => setQuery(enhanceQuery(query))}
                  aria-label="Enhance prompt"
                  className="absolute bottom-2 right-2 text-violet-500 transition-all duration-150 ease-out hover:bg-violet-50 hover:text-violet-500"
                >
                  <Sparkles className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Enhance prompt</TooltipContent>
            </Tooltip>
          </Card>

          <Button
            variant="outline"
            size="lg"
            className="mt-3 w-full gap-1.5 border-border text-foreground hover:bg-muted"
            onClick={submitQuery}
            disabled={reranking}
          >
            {reranking ? "Finding moments…" : "Find new moments"}
          </Button>
        </div>
      </aside>
    </>
  );
}

// Flips true one frame after mount so CSS transitions animate in. Using rAF
// (not a synchronous setState) keeps the load-in animation lint-clean.
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

// Compact "Why this moment?" card — heading on top, a fixed-height visual
// below so all three cards fit in the panel.
function WhyCard({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-raised))] p-2.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold leading-snug text-foreground">
          {text}
        </span>
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </div>
  );
}

// Chat-velocity bars that grow in with a staggered, smooth animation.
function SpikeBars({ data }: { data: number[] }) {
  const mounted = useMounted();
  const max = Math.max(...data, 1);
  const peak = data.indexOf(Math.max(...data));
  return (
    <div className="flex h-full w-full items-end gap-[3px]">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn(
            "min-h-[2px] flex-1 rounded-t-sm",
            i === peak ? "bg-indigo-500" : "bg-indigo-500/30"
          )}
          style={{
            height: mounted ? `${Math.max(4, (v / max) * 100)}%` : "0%",
            transition: "height 600ms cubic-bezier(0.22,1,0.36,1)",
            transitionDelay: `${i * 35}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Reaction signal meter — three rows (Facecam / Voice / Chat) that fill in.
function ReactionMeter({ moment }: { moment: Moment }) {
  const mounted = useMounted();
  const rows = [
    {
      label: "Facecam",
      value: "Face visible",
      level: Math.min(1, moment.confidence / 100),
    },
    {
      label: "Voice",
      value: "Voice rises",
      level: Math.min(1, Math.max(...moment.audioWaveform)),
    },
    {
      label: "Chat",
      value: "Chat reacts",
      level: Math.min(1, Math.max(...moment.chatVelocity) / 200),
    },
  ];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-2">
          {/* Descriptive label (replaces Facecam / Voice / Chat) */}
          <span className="w-20 shrink-0 text-xs font-medium leading-tight text-muted-foreground">
            {r.value}
          </span>
          {/* Signal bar — shortened to make room for the label */}
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{
                width: mounted ? `${Math.round(r.level * 100)}%` : "0%",
                transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
                transitionDelay: `${i * 120}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Retention/first-3s curve that draws itself in. Fills the card area.
function RiseCurve({ data }: { data: number[] }) {
  const mounted = useMounted();
  const min = Math.min(...data);
  const max = Math.max(...data);
  const n = data.length;
  const pts = data.map((v, i) => {
    const x = (i / (n - 1)) * 100;
    const y = max === min ? 50 : 100 - (((v - min) / (max - min)) * 88 + 6);
    return [x, y] as const;
  });
  const toPath = (ps: ReadonlyArray<readonly [number, number]>) =>
    ps
      .map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(2)},${pt[1].toFixed(2)}`)
      .join(" ");
  const line = toPath(pts);
  const area = `${line} L100,100 L0,100 Z`;

  // The strong "first 3 seconds" — first ~22% of the window, shaded blue.
  const earlyN = Math.max(2, Math.ceil(n * 0.22));
  const earlyPts = pts.slice(0, earlyN);
  const lastEarlyX = earlyPts[earlyPts.length - 1][0];
  const earlyLine = toPath(earlyPts);
  const earlyArea = `${earlyLine} L${lastEarlyX.toFixed(2)},100 L0,100 Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden
    >
      {/* full curve (neutral) */}
      <path d={area} className="fill-foreground/8" />
      {/* strong first-3s region, shaded blue */}
      <path d={earlyArea} className="fill-indigo-500/25" />
      <line
        x1={lastEarlyX}
        y1={0}
        x2={lastEarlyX}
        y2={100}
        vectorEffect="non-scaling-stroke"
        strokeWidth={1}
        strokeDasharray="3 3"
        className="stroke-indigo-500/50"
      />
      {/* full line draws in */}
      <path
        d={line}
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="stroke-foreground/70"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: mounted ? 0 : 1,
          transition: "stroke-dashoffset 800ms ease",
        }}
      />
      {/* strong first-3s line in blue */}
      <path
        d={earlyLine}
        fill="none"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-indigo-500"
      />
    </svg>
  );
}

// Landscape (16:9) preview of the source stream, with a 9:16 portrait crop
// frame overlay showing the AI-suggested vertical region. Falls back to a
// placeholder gradient when no media is set (wireframe mode).
const CROP_POSITION: Record<NonNullable<Moment["crop"]>, string> = {
  left: "left-2",
  center: "left-1/2 -translate-x-1/2",
  right: "right-2",
};

function MomentPreview({ moment }: { moment: Moment }) {
  const cropPos = CROP_POSITION[moment.crop ?? "center"];
  return (
    <div
      className="relative aspect-video w-full max-w-[560px] overflow-hidden rounded-2xl border border-border bg-black shadow-lg"
      style={moment.videoUrl ? undefined : { background: thumbGradient(moment.id) }}
    >
      {moment.videoUrl && (
        <video
          src={moment.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!moment.videoUrl && (
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

      {/* AI-suggested portrait crop — full height, dims the area outside it */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 aspect-[9/16] rounded-sm border-2 border-white/90",
          cropPos
        )}
        style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
      >
        <span className="absolute left-1/2 top-1.5 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-violet-500/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
          <Sparkles className="size-3" />
          AI suggested crop
        </span>
      </div>

      {/* Source metadata — duration + game as separate pills, above the dim */}
      <span className="absolute bottom-2 left-2 z-10 rounded bg-black/40 px-2 py-1 text-xs font-medium uppercase tracking-wider tabular-nums text-white/80 backdrop-blur-sm">
        {moment.duration}
      </span>
      <span className="absolute bottom-2 right-2 z-10 rounded bg-black/40 px-2 py-1 text-xs font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm">
        {moment.game}
      </span>
    </div>
  );
}

// Horizontal strip of all generated moments. Thumbnails are landscape (16:9)
// since they show the source stream; click one to preview its portrait clip.
// Shows left/right scroll buttons when the strip overflows.
function ThumbnailStrip({
  order,
  activeIndex,
  onChangeIndex,
  selectedIds,
  addMoment,
  removeMoment,
  loading = false,
}: {
  order: number[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
  selectedIds: string[];
  addMoment: (id: string) => void;
  removeMoment: (id: string) => void;
  loading?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateOverflow = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateOverflow();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateOverflow, { passive: true });
    window.addEventListener("resize", updateOverflow);
    return () => {
      el.removeEventListener("scroll", updateOverflow);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [order]);

  const scrollByDir = (dir: number) =>
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  if (loading) {
    return (
      <div className="shrink-0 px-6 pt-2">
        <div className="flex gap-2.5 overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="aspect-video w-[150px] shrink-0 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 px-6 pt-2">
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          aria-label="Scroll thumbnails left"
          className="absolute left-3 top-[calc(50%-0.5rem)] z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 backdrop-blur transition-colors duration-150 hover:bg-accent"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="flex gap-2.5 overflow-x-auto p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {order.map((idx, pos) => {
          const m = moments[idx];
          const active = idx === activeIndex;
          const inVideo = selectedIds.includes(m.id);
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => onChangeIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChangeIndex(idx);
                }
              }}
              aria-pressed={active}
              aria-label={`Preview moment ${pos + 1}: ${m.title}`}
              className={cn(
                "relative aspect-video w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border transition-all duration-150 hover:brightness-110",
                active
                  ? "ring-2 ring-indigo-500 ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              )}
              style={m.videoUrl ? undefined : { background: thumbGradient(m.id) }}
            >
              {m.videoUrl && (
                <video
                  src={m.videoUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {/* Moment number */}
              <span className="absolute left-1 top-1 rounded bg-black/55 px-1 text-[9px] font-medium tabular-nums text-white">
                {pos + 1}
              </span>
              {/* Duration */}
              <span className="absolute bottom-1 left-1 rounded bg-black/40 px-1.5 py-0.5 text-xs tabular-nums text-white">
                {m.duration}
              </span>
              {/* Plus / add affordance — adds or removes from the timeline */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (inVideo) removeMoment(m.id);
                  else addMoment(m.id);
                }}
                aria-label={inVideo ? "Added to timeline" : "Add moment"}
                aria-pressed={inVideo}
                className={cn(
                  "absolute right-1 top-1 flex items-center justify-center rounded-full p-1 transition-colors duration-150",
                  inVideo
                    ? "bg-emerald-500 text-white"
                    : "border border-violet-300 bg-background text-violet-500 hover:bg-violet-50"
                )}
              >
                {inVideo ? (
                  <Check className="size-2.5" strokeWidth={4} />
                ) : (
                  <Plus className="size-3" strokeWidth={3} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {canRight && (
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          aria-label="Scroll thumbnails right"
          className="absolute right-3 top-[calc(50%-0.5rem)] z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 backdrop-blur transition-colors duration-150 hover:bg-accent"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  MOMENT TIMELINE — the draft short-form video assembled from selected
//  moments. Visual / lightly-mocked: segments sized by duration, trim
//  handles, a remove action, and mock edit-layer tracks below.
// ---------------------------------------------------------------------------

// "1:47:22" / "0:34" → seconds.
function clockToSeconds(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

// seconds → "m:ss"
function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Mock edit layers each selected moment will receive later in Editor.
const EDIT_TRACKS = ["Captions", "Crop", "Pacing"];

type BrollSeg = { id: string; label: string; afterId: string };
type CaptionSeg = { id: string; label: string; seconds: number };

function MomentTimeline({
  moments: items,
  activeId,
  onRemove,
  onSelect,
  broll,
  onRemoveBroll,
  highlightBrollId,
  editTracks = EDIT_TRACKS,
  captionSegments,
  captionLead = 0,
  captionsApplied = false,
}: {
  moments: Moment[];
  activeId: string;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  broll?: BrollSeg[];
  onRemoveBroll?: (id: string) => void;
  highlightBrollId?: string | null;
  editTracks?: string[];
  /** Editor only — caption blocks shown in the Captions row (like moments). */
  captionSegments?: CaptionSeg[];
  /** Lead-in seconds before the first caption block (e.g. 5 = starts at 0:05). */
  captionLead?: number;
  /** Editor only — whether captions have been applied (empty vs added state). */
  captionsApplied?: boolean;
}) {
  const totalSeconds =
    items.reduce((sum, m) => sum + clockToSeconds(m.duration), 0) || 1;

  // Mock playback: the playhead (a diamond) sweeps left→right while playing.
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((pr) => (pr + 1.5 >= 100 ? 0 : pr + 1.5));
    }, 120);
    return () => clearInterval(id);
  }, [playing]);

  // Space toggles play (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      setPlaying((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrub = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProgress(
      Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    );
  };

  // Moments row = original moments with any added B-roll spliced in after its anchor.
  const rowSegments: (
    | { kind: "moment"; m: Moment; idx: number }
    | { kind: "broll"; b: BrollSeg }
  )[] = [];
  items.forEach((m, idx) => {
    rowSegments.push({ kind: "moment", m, idx });
    (broll ?? [])
      .filter((b) => b.afterId === m.id)
      .forEach((b) => rowSegments.push({ kind: "broll", b }));
  });
  // B-roll whose anchor moment was removed still shows at the end.
  (broll ?? [])
    .filter((b) => !items.some((m) => m.id === b.afterId))
    .forEach((b) => rowSegments.push({ kind: "broll", b }));

  if (items.length === 0) {
    return (
      <div className="flex h-[104px] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
        No moments yet — add moments to build your short-form video.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Playback bar — play/pause, scrubber with a diamond playhead, times */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-150 hover:scale-105"
        >
          {playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5 translate-x-px" />
          )}
        </button>
        <span className="w-8 shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {formatTime((progress / 100) * totalSeconds)}
        </span>
        <button
          type="button"
          aria-label="Seek"
          onClick={scrub}
          className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-[hsl(var(--surface-sunken))]"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-foreground/40"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute top-1/2 z-10 block size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-foreground"
            style={{ left: `${progress}%` }}
          />
        </button>
        <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
          {formatTime(totalSeconds)}
        </span>
      </div>

      {/* Selected moment segments */}
      <div className="flex items-stretch gap-4">
        <div className="flex w-20 shrink-0 items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Moments
        </div>
        <div className="flex flex-1 gap-2">
          {rowSegments.map((seg) => {
            // Added B-roll — a video/GIF segment living inline in the Moments row.
            if (seg.kind === "broll") {
              const b = seg.b;
              return (
                <div
                  key={b.id}
                  title={b.label}
                  className={cn(
                    "group relative flex h-10 min-w-[56px] items-center justify-center gap-1 overflow-hidden rounded-md border px-2 text-white",
                    "animate-in fade-in-0 slide-in-from-left-2 duration-300",
                    highlightBrollId === b.id
                      ? "border-blue-400 ring-2 ring-blue-400/70"
                      : "border-blue-400/40"
                  )}
                  style={{
                    flexGrow: 3,
                    flexBasis: 0,
                    background:
                      "linear-gradient(135deg, oklch(0.6 0.16 250) 0%, oklch(0.45 0.2 285) 100%)",
                  }}
                >
                  <span className="absolute left-1 top-1 rounded bg-black/40 px-1 text-[7px] font-semibold uppercase tracking-wide">
                    GIF
                  </span>
                  <Film className="size-3 shrink-0 opacity-90" aria-hidden />
                  <span className="truncate text-[10px] font-medium">
                    {b.label}
                  </span>
                  {onRemoveBroll && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBroll(b.id);
                      }}
                      aria-label={`Remove B-roll ${b.label}`}
                      className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-black/40 text-white/80 opacity-0 transition-opacity duration-150 hover:text-white group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              );
            }

            const { m, idx } = seg;
            const isActive = m.id === activeId;
            return (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(m.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(m.id);
                  }
                }}
                aria-label={`Moment ${idx + 1}`}
                className={cn(
                  "group relative flex h-10 min-w-[64px] cursor-pointer items-center justify-center overflow-hidden rounded-md px-3 transition-colors duration-150",
                  isActive
                    ? "border-2 border-[hsl(var(--track-moment-selected-border))] bg-[hsl(var(--track-moment-selected-bg))]"
                    : "border border-[hsl(var(--track-moment-border))] bg-[hsl(var(--track-moment-bg))] hover:border-[hsl(var(--track-moment-selected-border))]"
                )}
                style={{ flexGrow: clockToSeconds(m.duration), flexBasis: 0 }}
              >
                {/* Left trim handle */}
                <span
                  title="Trim start"
                  aria-hidden
                  className="absolute inset-y-1 left-0.5 w-1 cursor-ew-resize rounded-full bg-foreground/30 group-hover:bg-foreground/60"
                />

                {/* Label + duration */}
                <div className="min-w-0 text-center">
                  <div className="truncate text-sm font-medium leading-tight">
                    Moment {idx + 1}
                  </div>
                  <div className="mt-0.5 text-xs tabular-nums text-foreground">
                    {m.duration}
                  </div>
                </div>

                {/* Right trim handle */}
                <span
                  title="Trim end"
                  aria-hidden
                  className="absolute inset-y-1 right-0.5 w-1 cursor-ew-resize rounded-full bg-foreground/30 group-hover:bg-foreground/60"
                />

                {/* Remove from timeline */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(m.id);
                  }}
                  aria-label={`Remove Moment ${idx + 1}`}
                  className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-foreground group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit-layer tracks. Editor's "Captions" row holds caption blocks (like moments). */}
      {editTracks.map((track) => {
        const isCaptionRow = track === "Captions" && captionSegments;
        const captionUsed = captionSegments
          ? captionLead + captionSegments.reduce((s, c) => s + c.seconds, 0)
          : 0;
        const captionTrail = Math.max(0, totalSeconds - captionUsed);
        return (
          <div key={track} className="flex items-stretch gap-4">
            <div className="flex w-20 shrink-0 items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {track}
            </div>
            <div className="flex flex-1 items-stretch gap-2">
              {isCaptionRow ? (
                captionsApplied ? (
                  <>
                    {captionLead > 0 && (
                      <div
                        style={{ flexGrow: captionLead, flexBasis: 0 }}
                        aria-hidden
                      />
                    )}
                    {captionSegments!.map((c) => (
                      <div
                        key={c.id}
                        title={c.label}
                        className="flex h-8 min-w-[56px] items-center justify-center overflow-hidden rounded-md border border-[hsl(var(--track-caption-border))] bg-[hsl(var(--track-caption-bg))] px-2"
                        style={{ flexGrow: c.seconds, flexBasis: 0 }}
                      >
                        <span className="truncate text-[10px] font-medium leading-tight">
                          {c.label}
                        </span>
                      </div>
                    ))}
                    {captionTrail > 0 && (
                      <div
                        style={{ flexGrow: captionTrail, flexBasis: 0 }}
                        aria-hidden
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-8 flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                    No captions yet
                  </div>
                )
              ) : (
                <div className="flex h-8 flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                  No captions yet
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  EDITOR WORKSPACE
// ---------------------------------------------------------------------------

function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(160deg, oklch(0.30 0.04 ${a}) 0%, oklch(0.18 0.02 ${b}) 100%)`;
}

// Prompt suggestion chips for the Coach command thread.
const EDITOR_PROMPTS = [
  "Make hook faster",
  "Add punchier captions",
  "Tighten pacing",
  "Reframe for Shorts",
];

// A chat command maps to a short Coach reply.
const COACH_REPLY: Record<string, string> = {
  "Make hook faster": "Cut 0.6s from the lead-in so the hook lands sooner.",
  "Add punchier captions": "Switched to bolder, two-line word-art captions.",
  "Tighten pacing": "Removed 1.4s of dead air across the cut.",
  "Reframe for Shorts": "Reframed the crop to 9:16 for Shorts.",
};

// Editor tools — each drills into a set of mock options.
const EDITOR_TOOLS: {
  id: string;
  label: string;
  icon: LucideIcon;
  options: string[];
}[] = [
  { id: "hook", label: "Hook text", icon: Type, options: ["“watch this clutch play”", "“1v3 with 4 seconds left”", "“they had no chance”"] },
  { id: "caption", label: "Captions", icon: Captions, options: ["Bold yellow, 2 lines", "Minimal white", "Boxed caption"] },
  { id: "crop", label: "Crop focus", icon: Crop, options: ["Face focus", "Gameplay focus", "Auto switch"] },
  { id: "layout", label: "Layout", icon: Columns2, options: ["Webcam top · gameplay below", "Webcam corner", "Full gameplay"] },
  { id: "pacing", label: "Pacing", icon: Gauge, options: ["1.0x — no stretch", "1.1x — slight speed-up", "Tighten gaps"] },
  { id: "deadair", label: "Dead air removed", icon: Scissors, options: ["Aggressive", "Balanced", "Off"] },
  { id: "broll", label: "B-roll", icon: Film, options: ["Kill feed cutaway", "Score overlay", "None"] },
];

type VersionEntry = { id: string; name: string; time: string; description: string };

// Edits already applied to the stitched reel (newest on top).
const INITIAL_VERSIONS: VersionEntry[] = [
  { id: "v4", name: "Pacing", time: "1m ago", description: "Removed 1.8s of dead air." },
  { id: "v3", name: "Crop focus", time: "1m ago", description: "Face-centered 9:16 crop." },
  { id: "v2", name: "Hook text", time: "2m ago", description: "Lead-in cut to 0.4s." },
];

// Mock B-roll library + AI-generated results.
const BROLL_LIBRARY = [
  { id: "bl1", label: "Kill feed", duration: "0:03" },
  { id: "bl2", label: "Crowd hype", duration: "0:02" },
  { id: "bl3", label: "Confetti", duration: "0:02" },
  { id: "bl4", label: "Slow-mo zoom", duration: "0:04" },
];
const BROLL_GENERATED = ["bg1", "bg2", "bg3", "bg4"];

function EditorWorkspace({
  selected,
  timelineMoments,
  removeMoment,
  onChangeIndex,
}: {
  selected: Moment;
  timelineMoments: Moment[];
  removeMoment: (id: string) => void;
  onChangeIndex: (i: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [thread, setThread] = useState<
    { id: string; role: "user" | "ai"; text: string }[]
  >([]);
  const [rightTab, setRightTab] = useState<"tools" | "history">("tools");
  const [openToolId, setOpenToolId] = useState<string | null>(null);
  // Which tools have been applied (green/checked). Dead air starts done.
  const [applied, setApplied] = useState<Record<string, boolean>>({
    deadair: true,
  });
  const markApplied = (id: string | null) => {
    if (id) setApplied((a) => ({ ...a, [id]: true }));
  };
  const [versions, setVersions] = useState<VersionEntry[]>(INITIAL_VERSIONS);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [broll, setBroll] = useState<BrollSeg[]>([]);
  const [highlightBrollId, setHighlightBrollId] = useState<string | null>(null);
  const [brollToast, setBrollToast] = useState(false);
  // Captions are NOT applied until the user picks a style + clicks Apply.
  // `caption` holds the chosen style; only meaningful while captionsApplied.
  const [captionsApplied, setCaptionsApplied] = useState(false);
  const [caption, setCaption] = useState<{ id: string; label: string }>({
    id: "bold-yellow",
    label: "Bold yellow",
  });

  const openTool = EDITOR_TOOLS.find((t) => t.id === openToolId) ?? null;

  // The reel shows a moment from the timeline; nothing if none were added yet.
  const reelMoment =
    timelineMoments.find((m) => m.id === selected.id) ??
    timelineMoments[0] ??
    null;

  // Mock caption blocks for the timeline — "Caption N" tiles starting at 0:05.
  const CAPTION_LEAD = 5;
  const captionSegments = useMemo(() => {
    const total = timelineMoments.reduce(
      (s, m) => s + clockToSeconds(m.duration),
      0
    );
    const n = Math.max(1, timelineMoments.length);
    const each = Math.max(3, (total - CAPTION_LEAD) / n);
    return Array.from({ length: n }, (_, i) => ({
      id: `cap${i}`,
      label: `Caption ${i + 1}`,
      seconds: each,
    }));
  }, [timelineMoments]);

  // Composer submit → add a user + AI bubble (chat only).
  const submitChat = () => {
    const t = query.trim();
    if (!t) return;
    const reply = COACH_REPLY[t] ?? "Applied your refinement.";
    const stamp = Date.now();
    setThread((th) => [
      ...th,
      { id: `u${stamp}`, role: "user", text: t },
      { id: `a${stamp}`, role: "ai", text: reply },
    ]);
    setQuery("");
  };

  // Push a version history card (newest on top).
  const addVersion = (name: string, description: string) => {
    setVersions((vs) => [
      { id: `v${Date.now()}`, name, time: "just now", description },
      ...vs,
    ]);
  };

  // Applying a generic tool option → version card, then back to the grid.
  const applyOption = (toolLabel: string, option: string) => {
    addVersion(toolLabel, option);
    markApplied(openToolId);
    setOpenToolId(null);
  };

  // Adding B-roll → splice into the Moments row after the active moment,
  // briefly highlight it, show a status toast, and log a version card.
  const addBroll = (source: string) => {
    const id = `b${Date.now()}`;
    const afterId = (reelMoment ?? selected).id;
    setBroll((b) => [...b, { id, label: source, afterId }]);
    addVersion("B-roll added", source);
    markApplied("broll");
    setHighlightBrollId(id);
    setBrollToast(true);
    window.setTimeout(
      () => setHighlightBrollId((cur) => (cur === id ? null : cur)),
      1400
    );
    window.setTimeout(() => setBrollToast(false), 1800);
  };

  const removeBroll = (id: string) =>
    setBroll((b) => b.filter((x) => x.id !== id));

  // Applying a caption style → turn captions on (overlay + timeline + card)
  // and log a version entry. Captions don't exist until this runs.
  const applyCaption = (style: { id: string; label: string }) => {
    setCaption(style);
    setCaptionsApplied(true);
    addVersion("Captions", style.label);
    markApplied("caption");
    setOpenToolId(null);
  };

  // Rolling back a version entry. Rolling back captions also clears the
  // overlay, the timeline track, and the tool card's applied state.
  const rollbackVersion = (entry: VersionEntry) => {
    setVersions((vs) => vs.filter((x) => x.id !== entry.id));
    if (entry.name === "Captions") {
      setCaptionsApplied(false);
      setApplied((a) => ({ ...a, caption: false }));
    }
  };

  return (
    <>
      {/* LEFT — chat-style command thread (continues from Scout) */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-panel))]">
        <div className="px-4 pt-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Editor</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Refine your short-form video.
          </p>
        </div>

        {/* Chat thread */}
        <ScrollArea className="flex-1 min-h-0">
          <ul className="flex flex-col space-y-4 px-4 pb-3 pt-6">
            <ChatBubble
              role="ai"
              text={`I stitched ${timelineMoments.length} ${
                timelineMoments.length === 1 ? "moment" : "moments"
              } into your short-form video. Tell me what to change.`}
            />
            {thread.map((m) => (
              <ChatBubble key={m.id} role={m.role} text={m.text} />
            ))}
          </ul>
        </ScrollArea>

        {/* Sticky bottom composer */}
        <div className="px-4 pt-3 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {EDITOR_PROMPTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-sm text-foreground transition-colors duration-150 hover:border-foreground/30 hover:bg-accent hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <Card className="relative mt-4 border-none bg-[hsl(var(--surface-sunken))] p-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitChat();
                }
              }}
              placeholder="Tell the editor what to change…"
              rows={2}
              className="min-h-[60px] resize-none border-0 bg-transparent pr-10 text-sm shadow-none focus-visible:ring-0"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!query.trim()}
                  onClick={() => setQuery(enhanceQuery(query))}
                  aria-label="Enhance prompt"
                  className="absolute bottom-2 right-2 text-violet-500 transition-all duration-150 ease-out hover:bg-violet-50 hover:text-violet-500"
                >
                  <Sparkles className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Enhance prompt</TooltipContent>
            </Tooltip>
          </Card>
        </div>
      </aside>

      {/* WORKING AREA — preview + tools/history, then the wide timeline below */}
      <div className="flex flex-1 min-w-0 flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Center — the portrait short-form video created in Scout */}
          <div className="flex w-[65%] min-w-0 items-center justify-center px-6 py-4">
            {reelMoment ? (
              <EditorReelPreview
                selected={reelMoment}
                captionStyleId={captionsApplied ? caption.id : undefined}
              />
            ) : (
              <div className="flex aspect-[9/16] h-[clamp(280px,calc(100vh-300px),500px)] max-w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 text-center">
                <p className="text-sm font-medium">No video yet</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Add moments in Scout and click “Create video” to start your
                  reel.
                </p>
              </div>
            )}
          </div>

          {/* Right — Tools / Version history as tabs (each full height + scroll) */}
          <aside className="flex w-[35%] shrink-0 flex-col border-l border-border bg-card/30">
            {/* Tab bar — segmented control */}
            <div className="border-b border-border px-3 py-2">
              <div className="flex gap-1 rounded-md bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => setRightTab("tools")}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-base font-semibold transition-all duration-150",
                    rightTab === "tools"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Tools
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab("history")}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-base font-semibold transition-all duration-150",
                    rightTab === "history"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Version history ({versions.length})
                </button>
              </div>
            </div>

            {/* Tools tab */}
            {rightTab === "tools" ? (
              openTool ? (
                <ScrollArea className="flex-1 min-h-0">
                  {openTool.id === "broll" ? (
                    <BRollPanel
                      onBack={() => setOpenToolId(null)}
                      onAdd={addBroll}
                    />
                  ) : openTool.id === "hook" ? (
                    <HookPanel
                      onBack={() => setOpenToolId(null)}
                      onApply={(hook) => {
                        addVersion("Hook updated", hook);
                        markApplied("hook");
                        setOpenToolId(null);
                      }}
                    />
                  ) : openTool.id === "layout" ? (
                    <LayoutPanel
                      onBack={() => setOpenToolId(null)}
                      onApply={(preset) => {
                        addVersion("Layout changed", preset);
                        markApplied("layout");
                        setOpenToolId(null);
                      }}
                    />
                  ) : openTool.id === "caption" ? (
                    <CaptionPanel
                      current={caption.id}
                      onBack={() => setOpenToolId(null)}
                      onApply={applyCaption}
                    />
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 px-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setOpenToolId(null)}
                          aria-label="Back to tools"
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {openTool.label}
                        </h3>
                      </div>
                      <ul className="flex flex-col p-2">
                        {openTool.options.map((opt) => (
                          <li key={opt}>
                            <button
                              type="button"
                              onClick={() => applyOption(openTool.label, opt)}
                              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground/85 transition-colors duration-150 hover:bg-accent hover:text-foreground"
                            >
                              {opt}
                              <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex-1 min-h-0">
                  <div className="grid h-full auto-rows-fr grid-cols-2 gap-3 p-3">
                    {EDITOR_TOOLS.map((t) => {
                      const Icon = t.icon;
                      const isApplied = applied[t.id];
                      const isActive = openToolId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setOpenToolId(t.id)}
                          className={cn(
                            "relative flex flex-col items-center justify-center gap-2 rounded-lg border p-5 text-center transition-all duration-150",
                            t.id === "broll" && "col-span-2",
                            isActive
                              ? "border-border bg-indigo-500/5 ring-2 ring-indigo-500 ring-offset-2"
                              : isApplied
                                ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                : "border-border bg-background hover:border-indigo-500/40 hover:bg-indigo-500/5"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-6",
                              isApplied ? "text-emerald-700" : "text-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "line-clamp-2 text-sm font-medium leading-tight",
                              isApplied ? "text-emerald-700" : "text-foreground"
                            )}
                          >
                            {t.label}
                          </span>
                          {isApplied && (
                            <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <Check className="size-2.5" strokeWidth={4} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              /* Version history tab */
              <ScrollArea className="flex-1 min-h-0">
                <ul className="flex flex-col space-y-3 px-3 py-3">
                  {versions.length === 0 ? (
                    <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                      No edits yet — apply a tool option.
                    </li>
                  ) : (
                    versions.map((v) => (
                      <li key={v.id}>
                        <VersionCard
                          entry={v}
                          previewing={previewingId === v.id}
                          onPreview={() => setPreviewingId(v.id)}
                          onRollback={() => rollbackVersion(v)}
                        />
                      </li>
                    ))
                  )}
                </ul>
              </ScrollArea>
            )}
          </aside>
        </div>

        {/* Wide timeline — spans the workspace like Scout's timeline */}
        <PhaseContextPanel className="relative py-3">
          {brollToast && (
            <div className="pointer-events-none absolute right-6 top-2 z-10 flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <Film className="size-3 text-blue-500" />
              B-roll added
            </div>
          )}
          <MomentTimeline
            moments={timelineMoments}
            activeId={selected.id}
            onRemove={removeMoment}
            onSelect={(id) =>
              onChangeIndex(moments.findIndex((m) => m.id === id))
            }
            broll={broll}
            onRemoveBroll={removeBroll}
            highlightBrollId={highlightBrollId}
            editTracks={["Captions"]}
            captionSegments={captionSegments}
            captionsApplied={captionsApplied}
            captionLead={CAPTION_LEAD}
          />
        </PhaseContextPanel>
      </div>
    </>
  );
}

function VersionCard({
  entry,
  previewing,
  onPreview,
  onRollback,
}: {
  entry: VersionEntry;
  previewing: boolean;
  onPreview: () => void;
  onRollback: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 transition-colors duration-150",
        previewing ? "border-foreground/40 bg-accent/40" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold leading-tight">{entry.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {entry.time}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {entry.description}
      </p>
      <div className="mt-2 flex items-center justify-end gap-1 border-t border-border/60 pt-2">
        <button
          type="button"
          onClick={onPreview}
          className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={onRollback}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          <Undo2 className="size-3.5" />
          Rollback
        </button>
      </div>
    </div>
  );
}

// Shared header for a tool drill-in: back button + title.
function DrillHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to tools"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
      </button>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

// Hook text drill-in — AI generation flow.
const HOOK_OPTIONS = [
  "Wait for this clutch…",
  "I almost threw this round.",
  "This build should not work.",
];

function HookPanel({
  onBack,
  onApply,
}: {
  onBack: () => void;
  onApply: (hook: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);

  return (
    <div className="flex flex-col">
      <DrillHeader title="Hook text" onBack={onBack} />
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the hook you want…"
          rows={2}
          className="resize-none text-xs"
        />
        <Button size="sm" className="w-full bg-indigo-500 text-white hover:bg-indigo-600" onClick={() => setGenerated(true)}>
          Generate hook
        </Button>
        {generated && (
          <ul className="flex flex-col gap-1.5">
            {HOOK_OPTIONS.map((hook) => (
              <li
                key={hook}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-2"
              >
                <span className="min-w-0 flex-1 text-xs font-medium leading-tight">
                  {hook}
                </span>
                <button
                  type="button"
                  onClick={() => onApply(hook)}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1 text-sm font-medium transition-colors duration-150 hover:border-indigo-500/40 hover:text-indigo-500"
                >
                  Apply
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Layout drill-in — visual preset grid.
const LAYOUT_PRESETS: { id: string; label: string }[] = [
  { id: "facecam-top", label: "Facecam top / gameplay bottom" },
  { id: "full", label: "Gameplay full screen" },
  { id: "split", label: "Split view" },
  { id: "facecam-large", label: "Facecam large" },
  { id: "reaction", label: "Reaction-first" },
  { id: "center", label: "Center crop" },
];

// Tiny portrait diagram of a layout preset.
function LayoutThumb({ id }: { id: string }) {
  return (
    <div className="relative mx-auto aspect-[9/16] h-14 overflow-hidden rounded border border-border bg-foreground/5">
      {id === "facecam-top" && (
        <>
          <div className="absolute inset-x-0 top-0 h-[40%] bg-foreground/35" />
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-foreground/15" />
        </>
      )}
      {id === "full" && <div className="absolute inset-0 bg-foreground/25" />}
      {id === "split" && (
        <>
          <div className="absolute inset-y-0 left-0 w-1/2 bg-foreground/35" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-foreground/15" />
        </>
      )}
      {id === "facecam-large" && (
        <>
          <div className="absolute inset-x-0 top-0 h-[60%] bg-foreground/35" />
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-foreground/15" />
        </>
      )}
      {id === "reaction" && (
        <>
          <div className="absolute inset-0 bg-foreground/15" />
          <div className="absolute left-1/2 top-1.5 size-3 -translate-x-1/2 rounded-full bg-foreground/45" />
        </>
      )}
      {id === "center" && (
        <div className="absolute inset-x-1.5 inset-y-4 rounded bg-foreground/30" />
      )}
    </div>
  );
}

function LayoutPanel({
  onBack,
  onApply,
}: {
  onBack: () => void;
  onApply: (preset: string) => void;
}) {
  const [applyAll, setApplyAll] = useState(false);

  return (
    <div className="flex flex-col">
      <DrillHeader title="Layout" onBack={onBack} />
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={applyAll}
            onChange={(e) => setApplyAll(e.target.checked)}
            className="size-3.5 accent-foreground"
          />
          Apply to all
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onApply(applyAll ? `${preset.label} (all moments)` : preset.label)
              }
              className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-background p-1.5 transition-colors duration-150 hover:border-foreground/30 hover:bg-accent"
            >
              <LayoutThumb id={preset.id} />
              <span className="line-clamp-2 text-center text-[9px] font-medium leading-tight">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Captions drill-in — visual preset grid.
const CAPTION_STYLES: { id: string; label: string }[] = [
  { id: "bold-yellow", label: "Bold yellow" },
  { id: "white-box", label: "White box" },
  { id: "minimal-white", label: "Minimal white" },
  { id: "red-impact", label: "Red impact" },
  { id: "blue-highlight", label: "Blue highlight" },
  { id: "meme", label: "Meme style" },
];

// A small caption frame that previews each style with sample text.
function CaptionSwatch({ id }: { id: string }) {
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded bg-gradient-to-br from-zinc-700 to-zinc-900">
      {id === "bold-yellow" && (
        <span className="text-[13px] font-extrabold text-yellow-300 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.9)]">
          1v3 clutch
        </span>
      )}
      {id === "white-box" && (
        <span className="bg-white px-1 py-0.5 text-[11px] font-bold text-black">
          1v3 clutch
        </span>
      )}
      {id === "minimal-white" && (
        <span className="text-[11px] font-medium text-white/90">1v3 clutch</span>
      )}
      {id === "red-impact" && (
        <span className="text-[13px] font-extrabold uppercase text-red-500 [text-shadow:_0_1px_0_#fff]">
          clutch
        </span>
      )}
      {id === "blue-highlight" && (
        <span className="bg-blue-500 px-1 py-0.5 text-[11px] font-bold text-white">
          1v3 clutch
        </span>
      )}
      {id === "meme" && (
        <span className="text-[13px] font-extrabold uppercase text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
          clutch
        </span>
      )}
    </div>
  );
}

function CaptionPanel({
  current,
  onBack,
  onApply,
}: {
  current: string | null;
  onBack: () => void;
  onApply: (style: { id: string; label: string }) => void;
}) {
  const [sel, setSel] = useState<string | null>(current);
  const chosen = CAPTION_STYLES.find((s) => s.id === sel) ?? null;

  return (
    <div className="flex flex-col">
      <DrillHeader title="Captions" onBack={onBack} />
      <div className="flex flex-col gap-3 px-3 pb-3 pt-2">
        <div className="grid grid-cols-2 gap-2">
          {CAPTION_STYLES.map((s) => {
            const selected = sel === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSel(s.id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex flex-col gap-1 rounded-md border p-1.5 transition-colors duration-150",
                  selected
                    ? "border-2 border-indigo-500"
                    : "border-border hover:border-foreground/30 hover:bg-accent/40"
                )}
              >
                <CaptionSwatch id={s.id} />
                <span className="text-center text-[10px] font-medium leading-tight">
                  {s.label}
                </span>
                {selected && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Check className="size-2.5" strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
          disabled={!chosen}
          onClick={() => chosen && onApply(chosen)}
        >
          Apply captions
        </Button>
      </div>
    </div>
  );
}

// B-roll drill-in — Library / Generate with AI / Upload, all mocked.
function BRollPanel({
  onBack,
  onAdd,
}: {
  onBack: () => void;
  onAdd: (source: string) => void;
}) {
  const [tab, setTab] = useState<"library" | "generate" | "upload">("library");
  const [bquery, setBquery] = useState("dog laughing GIF");
  const [generated, setGenerated] = useState(false);

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "library", label: "Library" },
    { id: "generate", label: "Generate with AI" },
    { id: "upload", label: "Upload" },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to tools"
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          B-roll
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-all duration-150",
              tab === t.id
                ? "border-border bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.id === "generate" && (
              <Sparkles className="size-3 text-violet-500" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-3 pb-3 pt-2">
        {tab === "library" && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search B-roll"
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none transition-colors focus-visible:border-foreground/30"
            />
            <div className="grid grid-cols-2 gap-2">
              {BROLL_LIBRARY.map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <div
                    className="relative aspect-video overflow-hidden rounded-md border border-border"
                    style={{ background: thumbGradient(item.id) }}
                  >
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 text-[8px] tabular-nums text-white">
                      {item.duration}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(`${item.label} (Library)`)}
                    className="rounded-md border border-border px-2.5 py-1 text-sm font-medium transition-colors duration-150 hover:border-indigo-500/40 hover:text-indigo-500"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "generate" && (
          <div className="flex flex-col gap-2">
            <Textarea
              value={bquery}
              onChange={(e) => setBquery(e.target.value)}
              placeholder="Describe the B-roll you want…"
              rows={2}
              className="resize-none text-xs"
            />
            <Button size="sm" className="w-full bg-indigo-500 text-white hover:bg-indigo-600" onClick={() => setGenerated(true)}>
              Generate B-roll
            </Button>
            {generated && (
              <div className="grid grid-cols-2 gap-2">
                {BROLL_GENERATED.map((id) => (
                  <div key={id} className="flex flex-col gap-1">
                    <div
                      className="aspect-video overflow-hidden rounded-md border border-border"
                      style={{ background: thumbGradient(id) }}
                    />
                    <button
                      type="button"
                      onClick={() => onAdd(`AI: ${bquery.trim() || "B-roll"}`)}
                      className="rounded-md border border-border px-2.5 py-1 text-sm font-medium transition-colors duration-150 hover:border-indigo-500/40 hover:text-indigo-500"
                    >
                      Add to video
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "upload" && (
          <button
            type="button"
            onClick={() => onAdd("Uploaded clip")}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-center transition-colors duration-150 hover:border-foreground/30 hover:bg-accent/30"
          >
            <UploadCloud className="size-5 text-muted-foreground" />
            <span className="text-xs font-medium">Upload your own B-roll</span>
            <span className="text-[10px] text-muted-foreground">
              Drop a file or click to browse
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function EditorReelPreview({
  selected,
  captionStyleId,
}: {
  selected: Moment;
  captionStyleId?: string;
}) {
  // The Editor preview is the stitched short-form output (Short.mov),
  // not the landscape source moment.
  const reelVideo = "/assets/Short.mov";
  return (
    <div
      className="relative aspect-[9/16] h-[clamp(280px,calc(100vh-300px),500px)] overflow-hidden rounded-2xl border border-border bg-black shadow-lg"
      style={{ background: thumbGradient(selected.id) }}
    >
      <video
        src={reelVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Captions burned over the video — styled by the selected caption preset */}
      {captionStyleId && <CaptionOverlay styleId={captionStyleId} scale={0.8} />}

      {/* Top markers — small badges */}
      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
        <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs font-medium tracking-wide tabular-nums text-white/90 backdrop-blur-sm">
          1080 × 1920
        </span>
        <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-sm">
          SAFE
        </span>
      </div>

      {/* Fullscreen lives inside the surface; play controls live in the timeline */}
      <button
        type="button"
        aria-label="Fullscreen"
        className="absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-md bg-black/45 text-white/80 backdrop-blur-sm transition-colors duration-150 hover:bg-black/60"
      >
        <Maximize2 className="size-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  EXPORT WORKSPACE
// ---------------------------------------------------------------------------

const FORMATS = [
  { id: "mp4-h264", label: "MP4 — H.264", detail: "Plays everywhere" },
  { id: "mp4-h265", label: "MP4 — H.265", detail: "Smaller file, slower to make" },
  { id: "mov-prores", label: "MOV — ProRes", detail: "Edit-quality, large file" },
];

// Read-only mirror of the Editor edit stack.
const CLIP_SUMMARY = [
  { label: "Hook", value: "“1v3 with 4 seconds left” at 0:00.4" },
  { label: "Captions", value: "Bold yellow, 2 lines" },
  { label: "Dead air cut", value: "4.2s removed" },
  { label: "B-roll", value: "Kill feed cutaway at 0:08" },
  { label: "Length", value: "18s" },
];

// Platforms shown as side-by-side previews + publish destinations.
const EXPORT_PLATFORMS = [
  { id: "tiktok", name: "TikTok", preview: "TikTok", handle: "@bagginstv", connected: true },
  { id: "reels", name: "Instagram Reels", preview: "Reels", handle: "@bagginstv", connected: true },
  { id: "shorts", name: "YouTube Shorts", preview: "YouTube Shorts", handle: "@bagginstv", connected: false },
];

function ExportWorkspace({
  selected,
}: {
  selected: Moment;
  activeIndex: number;
  onBack: () => void;
}) {
  const [format, setFormat] = useState(FORMATS[0]);
  const [formatOpen, setFormatOpen] = useState(false);
  const [previews, setPreviews] = useState<
    Record<string, { safe: boolean; captions: boolean }>
  >({
    tiktok: { safe: false, captions: true },
    reels: { safe: false, captions: true },
    shorts: { safe: false, captions: true },
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  // Which platforms are in the set (previewed + offered as publish targets).
  const [active, setActive] = useState<Record<string, boolean>>({
    tiktok: true,
    reels: true,
    shorts: true,
  });
  const [connected, setConnected] = useState<Record<string, boolean>>({
    tiktok: true,
    reels: true,
    shorts: false,
  });
  // Per-platform publish state — each platform publishes/schedules on its own.
  const [status, setStatus] = useState<
    Record<string, "idle" | "scheduled" | "published">
  >({ tiktok: "idle", reels: "idle", shorts: "idle" });

  const activePlatforms = EXPORT_PLATFORMS.filter((p) => active[p.id]);
  const inactivePlatforms = EXPORT_PLATFORMS.filter((p) => !active[p.id]);
  const expandedPlatform =
    expanded !== null && active[expanded]
      ? EXPORT_PLATFORMS.find((p) => p.id === expanded)
      : undefined;

  const connectPlatform = (id: string) =>
    setConnected((c) => ({ ...c, [id]: true }));
  const publishPlatform = (id: string) =>
    setStatus((s) => ({ ...s, [id]: "published" }));
  const schedulePlatform = (id: string) =>
    setStatus((s) => ({ ...s, [id]: "scheduled" }));
  const removePlatform = (id: string) => {
    setActive((a) => ({ ...a, [id]: false }));
    if (expanded === id) setExpanded(null);
  };
  const addPlatform = (id: string) => {
    setActive((a) => ({ ...a, [id]: true }));
    setStatus((s) => ({ ...s, [id]: "idle" }));
  };

  return (
    <>
      {/* LEFT PANEL — calm, tinted so the previews read as the canvas */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-panel))]">
        <header className="px-4 pt-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Export</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Looks ready. Give it a last look, then ship it.
          </p>
        </header>

        <Separator className="mt-4" />

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-4 px-4 py-4">
            {/* What's in this clip — read-only mirror of the edit stack */}
            <section className="rounded-lg border border-border bg-background p-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                What&apos;s in this clip
              </h3>
              <ul className="mt-2.5 flex flex-col gap-2.5">
                {CLIP_SUMMARY.map((item, i) => (
                  <li key={item.label} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground animate-in fade-in-0 zoom-in-50 duration-300"
                      style={{ animationDelay: `${i * 90}ms`, animationFillMode: "both" }}
                    >
                      <Check className="size-2.5" strokeWidth={4} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </div>
                      <div className="text-xs font-medium leading-snug">
                        {item.value}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Format — one line by default; power users expand */}
            <section className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Format
              </h3>
              <button
                type="button"
                onClick={() => setFormatOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left transition-all duration-150 hover:border-indigo-500/40 hover:bg-accent/40"
              >
                <span className="text-xs font-medium">
                  {format.label}
                  {format.id === "mp4-h264" && (
                    <span className="text-muted-foreground"> (recommended)</span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
                    formatOpen && "rotate-180"
                  )}
                />
              </button>
              {formatOpen && (
                <ul className="flex flex-col gap-1">
                  {FORMATS.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormat(f);
                          setFormatOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-accent",
                          format.id === f.id && "bg-accent"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-xs font-medium">{f.label}</span>
                          <span className="block text-[10px] text-muted-foreground">
                            {f.detail}
                          </span>
                        </span>
                        {format.id === f.id && (
                          <Check className="size-3.5 shrink-0" strokeWidth={3} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </ScrollArea>
      </aside>

      {/* WORKING AREA — each platform preview carries its own publish controls */}
      <div className="flex flex-1 min-w-0 flex-col gap-3 px-4 py-3">
        {/* Add removed platforms back — only shown when some are removed */}
        {inactivePlatforms.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {inactivePlatforms.map((pf) => (
              <button
                key={pf.id}
                type="button"
                onClick={() => addPlatform(pf.id)}
                className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-3.5" />
                {pf.preview}
              </button>
            ))}
          </div>
        )}

        {/* Multi-platform previews — fill the panel */}
        {activePlatforms.length > 0 ? (
          <div className="flex flex-1 min-h-0 items-start justify-center gap-3">
            {activePlatforms.map((pf) => (
              <PlatformPreview
                key={pf.id}
                label={pf.preview}
                handle={pf.handle}
                moment={selected}
                state={previews[pf.id]}
                connected={connected[pf.id]}
                status={status[pf.id]}
                onToggleSafe={() =>
                  setPreviews((p) => ({
                    ...p,
                    [pf.id]: { ...p[pf.id], safe: !p[pf.id].safe },
                  }))
                }
                onToggleCaptions={() =>
                  setPreviews((p) => ({
                    ...p,
                    [pf.id]: { ...p[pf.id], captions: !p[pf.id].captions },
                  }))
                }
                onExpand={() => setExpanded(pf.id)}
                onConnect={() => connectPlatform(pf.id)}
                onPublish={() => publishPlatform(pf.id)}
                onSchedule={() => schedulePlatform(pf.id)}
                onRemove={() => removePlatform(pf.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No platforms selected.
            </p>
            <p className="text-xs text-muted-foreground">
              Add one above to preview and publish.
            </p>
          </div>
        )}
      </div>

      {/* Expanded preview */}
      {expandedPlatform && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setExpanded(null)}
        >
          <div
            className="flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <PlatformPhone
              label={expandedPlatform.preview}
              moment={selected}
              state={previews[expandedPlatform.id]}
              className="h-[clamp(380px,calc(100vh-160px),620px)]"
            />
            <button
              type="button"
              onClick={() => setExpanded(null)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// A platform phone mockup (9:16) with platform UI + optional safe-zones/captions.
function PlatformPhone({
  label,
  moment,
  state,
  className,
}: {
  label: string;
  moment: Moment;
  state: { safe: boolean; captions: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-black shadow-lg",
        className
      )}
      style={moment.videoUrl ? undefined : { background: thumbGradient(moment.id) }}
    >
      {moment.videoUrl && (
        <video
          src={moment.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!moment.videoUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
      )}

      {/* Platform badge */}
      <div className="absolute left-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm">
        {label}
      </div>

      {/* Right-side action rail (mock platform UI) */}
      <div className="absolute bottom-12 right-2 flex flex-col items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-5 rounded-full bg-white/25" />
        ))}
      </div>

      {/* Safe-crop guides */}
      {state.safe && (
        <>
          <div
            className="pointer-events-none absolute inset-2 rounded-lg border border-dashed border-white/60"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[12%] bg-white/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-white/10"
            aria-hidden
          />
        </>
      )}

      {/* Captions */}
      {state.captions && (
        <div className="absolute inset-x-0 bottom-[22%] flex justify-center px-3">
          <span className="rounded bg-black/55 px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight text-yellow-300">
            1v3 with 4<br />seconds left
          </span>
        </div>
      )}

      {/* Bottom handle */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-7 text-[9px] text-white/90">
        <span className="font-medium">@bagginstv</span>
      </div>
    </div>
  );
}

// One platform's preview card: phone + "Show me" toggles + publish controls.
function PlatformPreview({
  label,
  handle,
  moment,
  state,
  connected,
  status,
  onToggleSafe,
  onToggleCaptions,
  onExpand,
  onConnect,
  onPublish,
  onSchedule,
  onRemove,
}: {
  label: string;
  handle: string;
  moment: Moment;
  state: { safe: boolean; captions: boolean };
  connected: boolean;
  status: "idle" | "scheduled" | "published";
  onToggleSafe: () => void;
  onToggleCaptions: () => void;
  onExpand: () => void;
  onConnect: () => void;
  onPublish: () => void;
  onSchedule: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex w-[min(calc((100vw_-_460px)/3),calc((100vh_-_300px)*9/16))] flex-col">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onExpand}
            aria-label={`Expand ${label} preview`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <Maximize2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onExpand}
        aria-label={`Expand ${label} preview`}
        className="mt-2 block"
      >
        <PlatformPhone
          label={label}
          moment={moment}
          state={state}
          className="w-full"
        />
      </button>

      {/* Per-preview "Show me" toggles */}
      <div className="mt-3 flex flex-wrap gap-1">
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">
          Final cut
        </span>
        <button
          type="button"
          onClick={onToggleSafe}
          aria-pressed={state.safe}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150",
            state.safe
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          Safe-crop guides
        </button>
        <button
          type="button"
          onClick={onToggleCaptions}
          aria-pressed={state.captions}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150",
            state.captions
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {state.captions ? "Captions on" : "Captions off"}
        </button>
      </div>

      {/* Publish controls — per platform, right under the video */}
      <div className="mt-3 flex flex-col gap-1.5 rounded-md border border-border bg-card/40 p-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          {connected ? (
            <>
              <Check className="size-3 shrink-0 text-foreground" strokeWidth={3} />
              <span className="truncate font-medium">{handle}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Not connected</span>
          )}
        </div>

        {status === "published" ? (
          <div className="flex items-center justify-center gap-1.5 rounded-md bg-foreground/10 px-2 py-1.5 text-[11px] font-medium">
            <Check className="size-3.5" strokeWidth={3} />
            Published
          </div>
        ) : status === "scheduled" ? (
          <div className="flex items-center justify-center gap-1.5 rounded-md bg-foreground/10 px-2 py-1.5 text-[11px] font-medium">
            <Clock className="size-3.5" />
            Scheduled
          </div>
        ) : connected ? (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onPublish}
              className="flex-1 rounded-md bg-indigo-500 px-2 py-1.5 text-[11px] font-medium text-white transition-colors duration-150 hover:bg-indigo-600"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={onSchedule}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium transition-colors duration-150 hover:bg-accent"
            >
              <Clock className="size-3" />
              Schedule
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-md bg-indigo-500 px-2 py-1.5 text-[11px] font-medium text-white transition-colors duration-150 hover:bg-indigo-600"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

