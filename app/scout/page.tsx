"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  ChevronRight,
  Clock,
  Minus,
  Plus,
  Play,
  Pause,
  Maximize2,
  Check,
  Download,
  Type,
  Captions,
  Crop,
  Columns2,
  Gauge,
  Scissors,
  Film,
  Undo2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { LeftRail, type Phase } from "@/components/LeftRail";
import { ClipCarousel } from "@/components/ClipCarousel";
import { PhaseContextPanel } from "@/components/PhaseContextPanel";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import {
  BarSparkline,
  WaveformSparkline,
  LineSparkline,
} from "@/components/Sparkline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  moments,
  intentPresets,
  promptEnhancements,
  aiDecisions,
  coachThread,
  coachSuggestions,
  type Moment,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

export default function ScoutPage() {
  const [activePhase, setActivePhase] = useState<Phase>("scout");
  const [activeIndex, setActiveIndex] = useState(0);

  // Tools panel state (Scout)
  const [clipCount, setClipCount] = useState(5);
  const [clipDuration, setClipDuration] = useState(30); // seconds
  const [intent, setIntent] = useState("Funny moments");

  const selected = moments[activeIndex];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden">
      {/* Left rail */}
      <LeftRail active={activePhase} onChange={setActivePhase} />

      {/* Tools panel + working area — one per phase */}
      {activePhase === "scout" && (
        <ScoutWorkspace
          activeIndex={activeIndex}
          onChangeIndex={setActiveIndex}
          clipCount={clipCount}
          setClipCount={setClipCount}
          clipDuration={clipDuration}
          setClipDuration={setClipDuration}
          intent={intent}
          setIntent={setIntent}
          selected={selected}
        />
      )}
      {activePhase === "editor" && (
        <EditorWorkspace
          selected={selected}
          activeIndex={activeIndex}
          onBack={() => setActivePhase("scout")}
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
  clipCount: number;
  setClipCount: (n: number) => void;
  clipDuration: number;
  setClipDuration: (n: number) => void;
  intent: string;
  setIntent: (s: string) => void;
  selected: Moment;
};

// Rank label per clip — derived from evidence so it feels earned, not assigned.
function rankLabelFor(m: Moment, idx: number): string {
  if (idx === 0) return "Best match";
  const hasQuote = m.evidence.some((e) => e.kind === "quote");
  const hasAudio = m.evidence.some((e) => e.kind === "audio");
  const hasChat = m.evidence.some((e) => e.kind === "chat");
  if (hasQuote) return "Strong hook";
  if (hasAudio) return "High energy";
  if (hasChat) return "Chat spike";
  return "Strong hook";
}

// Compact creator-facing stats shown below the carousel.
function statsFor(m: Moment) {
  const chatEv = m.evidence.find((e) => e.kind === "chat");
  const peak = Math.max(...m.audioWaveform);
  const energy = peak > 0.7 ? "High" : peak > 0.45 ? "Medium" : "Low";
  const hasQuote = m.evidence.some((e) => e.kind === "quote");
  const hookStrength =
    hasQuote || peak > 0.7 ? "Strong" : peak > 0.5 ? "Good" : "Light";
  return [
    { label: "Duration", value: m.duration },
    { label: "Chat spike", value: chatEv?.value ?? "—" },
    { label: "Energy", value: energy },
    { label: "Hook strength", value: hookStrength },
  ];
}

// Mock "Enhance prompt" — chip text → clearer AI instruction.
function enhancePromptText(current: string): string {
  const trimmed = current.trim();
  if (promptEnhancements[trimmed]) return promptEnhancements[trimmed];
  if (!trimmed) return promptEnhancements["Funny moments"];
  // Generic enhancement for free-form text
  return `Find ${trimmed.toLowerCase()} with strong creator reaction, chat response, and a clear first 3-second hook.`;
}

function ScoutWorkspace(p: WorkspaceProps) {
  const carouselLabels = useMemo(
    () => moments.map((m, i) => rankLabelFor(m, i)),
    []
  );
  const stats = useMemo(() => statsFor(p.selected), [p.selected]);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const isCurrentPicked = pickedIndex === p.activeIndex;
  const selectedLabel = carouselLabels[p.activeIndex];

  return (
    <>
      {/* Tools panel */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-background">
        {/* Header — no back arrow; wordmark in top bar goes home */}
        <div className="px-4 pt-4">
          <h2 className="text-sm font-medium">Scout moments</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            AI scans your stream and ranks moments that could work for TikTok, Reels, and Shorts.
          </p>
        </div>

        <Separator className="mt-4" />

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <NumberRow
            label="Number of clips"
            value={p.clipCount}
            min={1}
            max={12}
            onChange={p.setClipCount}
          />

          <Separator className="my-3" />

          <DurationRow
            label="Clip duration"
            value={p.clipDuration}
            onChange={p.setClipDuration}
          />

          <Separator className="my-3" />

          {/* What are you looking for? — chips fill the textarea on click */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">What are you looking for?</h3>

            <div className="flex flex-wrap gap-1.5">
              {intentPresets.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => p.setIntent(label)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                    p.intent === label
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground/80 hover:border-foreground/30 hover:bg-accent hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <Textarea
              id="intent"
              value={p.intent}
              onChange={(e) => p.setIntent(e.target.value)}
              rows={3}
              className="resize-none text-xs"
              placeholder="Pick a chip or type what kind of moment you're after…"
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => p.setIntent(enhancePromptText(p.intent))}
                className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground/80 transition-colors duration-150 hover:border-foreground/30 hover:bg-accent hover:text-foreground"
              >
                Enhance prompt
              </button>
            </div>
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div className="border-t border-border p-3">
          <Button size="lg" className="w-full gap-1.5">
            Find new moments
          </Button>
        </div>
      </aside>

      {/* Working area */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Top: carousel takes flex-1, meta + actions sit tight under it */}
        <div className="flex flex-1 min-h-0 flex-col">
          {/* Carousel */}
          <div className="flex flex-1 min-h-0">
            <ClipCarousel
              moments={moments}
              activeIndex={p.activeIndex}
              onChange={p.onChangeIndex}
              labels={carouselLabels}
            />
          </div>

          {/* Below carousel: rank label · title · stats */}
          <div className="shrink-0 px-6 pb-3 pt-2">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
              {/* Rank position + label + picked indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                  {p.activeIndex + 1} of {moments.length}
                </span>
                <span className="text-muted-foreground/50" aria-hidden>·</span>
                <span className="rounded-full border border-foreground/20 bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {selectedLabel}
                </span>
                {isCurrentPicked && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                      <Check className="size-2.5" strokeWidth={4} />
                      Picked
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-base font-medium leading-snug tracking-tight">
                {p.selected.title}
              </h2>

              {/* Stats row — creator-facing signals only */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {stats.map((s) => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px]"
                  >
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium tabular-nums">{s.value}</span>
                  </span>
                ))}
              </div>

              {/* Pick confirmation — small, not hero-sized */}
              <Button
                size="sm"
                variant={isCurrentPicked ? "default" : "outline"}
                onClick={() =>
                  setPickedIndex(isCurrentPicked ? null : p.activeIndex)
                }
                className="mt-1 gap-1.5"
              >
                {isCurrentPicked ? (
                  <>
                    <Check className="size-3.5" strokeWidth={3} />
                    Selected — ready for Editor
                  </>
                ) : (
                  "Use this clip"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom panel — Why this moment? (reason + its visual evidence in one card) */}
        <PhaseContextPanel>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Why this moment?
            </h3>
            <span className="text-[10px] text-muted-foreground">
              ±30s around the moment
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ReasonTile
              text="Chat activity spiked here"
              chart={
                <BarSparkline
                  data={p.selected.chatVelocity}
                  width={260}
                  height={48}
                />
              }
            />
            <ReasonTile
              text="Creator reaction is clear"
              chart={
                <WaveformSparkline
                  data={p.selected.audioWaveform}
                  width={260}
                  height={48}
                />
              }
            />
            <ReasonTile
              text="Strong first 3 seconds"
              chart={
                <LineSparkline
                  data={p.selected.viewerDelta}
                  width={260}
                  height={48}
                />
              }
            />
          </div>
        </PhaseContextPanel>
      </div>
    </>
  );
}

function ReasonTile({
  text,
  chart,
}: {
  text: string;
  chart: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-center gap-2">
        <Check className="size-3.5 text-foreground" strokeWidth={3} />
        <span className="text-sm font-medium leading-snug">{text}</span>
      </div>
      <div className="mt-2 w-full overflow-hidden">{chart}</div>
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center rounded-md border border-border">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
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
          disabled={value >= max}
          aria-label="Increase"
          className="flex size-7 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

function DurationRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  // Cycle to next preset duration on click
  const cycle = () => {
    const i = DURATION_OPTIONS.indexOf(value);
    const next = DURATION_OPTIONS[(i + 1) % DURATION_OPTIONS.length];
    onChange(next);
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={cycle}
        aria-label="Change clip duration"
        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium tabular-nums transition-colors duration-150 hover:border-foreground/30 hover:bg-accent"
      >
        <Clock className="size-3.5 text-muted-foreground" />
        {value}s
      </button>
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

// Icon per decision category — used in the compact tools-panel list.
const decisionIcons: Record<string, LucideIcon> = {
  hook: Type,
  caption: Captions,
  crop: Crop,
  layout: Columns2,
  pacing: Gauge,
  deadair: Scissors,
  broll: Film,
};

// Coach version history — each entry is a restorable checkpoint.
type HistoryEntry = {
  id: string;
  prompt: string | null; // null = AI's initial draft, no user prompt
  summary: string;
  elapsed: string;
};

const initialHistory: HistoryEntry[] = coachThread.map((t) => ({
  id: t.id,
  prompt: t.user,
  summary: t.aiSummary,
  elapsed: t.elapsed,
}));

// Pretend AI replies for the suggested chips. Anything else falls through
// to a generic summary so the demo always shows something useful.
const COACH_FAKE_SUMMARIES: Record<string, string> = {
  "Shorten intro": "Trimmed 1.2s from the lead-in.",
  "Punchier hook": "Sharpened the opening line.",
  "Less zoom": "Reduced the highlight zoom to 1.05×.",
  "Keep gameplay visible": "Crop priority is now gameplay HUD.",
  "Move captions up": "Captions moved to the top third.",
};

function EditorWorkspace({
  selected,
  activeIndex,
}: {
  selected: Moment;
  activeIndex: number;
  // onBack is intentionally not used — back icon was removed per spec
  onBack: () => void;
}) {
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    aiDecisions[0].id
  );
  const [coachPrompt, setCoachPrompt] = useState("");

  // Traceable Coach history — each entry is a restorable checkpoint.
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [currentVersionId, setCurrentVersionId] = useState<string>(
    initialHistory[initialHistory.length - 1].id
  );

  const submitCoachPrompt = () => {
    const text = coachPrompt.trim();
    if (!text) return;
    const newId = `v${Date.now()}`;
    setHistory((h) => [
      ...h,
      {
        id: newId,
        prompt: text,
        summary: COACH_FAKE_SUMMARIES[text] ?? "Applied your refinement.",
        elapsed: "just now",
      },
    ]);
    setCurrentVersionId(newId);
    setCoachPrompt("");
  };

  const inspector =
    aiDecisions.find((d) => d.id === selectedDecisionId) ?? aiDecisions[0];

  return (
    <>
      {/* TOOLS PANEL — compact card list (top) + persistent inspector (bottom) */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-background">
        <header className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Editor</h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Clip {activeIndex + 1}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Refine the draft. Click a card to inspect or adjust.
          </p>
        </header>

        <Separator className="mt-4" />

        {/* Compact list of edit options */}
        <div className="shrink-0">
          <ul className="flex flex-col p-2">
            {aiDecisions.map((d) => {
              const Icon = decisionIcons[d.kind] ?? Type;
              const active = d.id === selectedDecisionId;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDecisionId(d.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-150",
                      active
                        ? "bg-accent text-foreground"
                        : "text-foreground/85 hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium leading-tight">
                        {d.label}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {d.value}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "mt-1 size-3 shrink-0 transition-opacity duration-150",
                        active ? "opacity-100 text-foreground" : "opacity-40"
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <Separator />

        {/* Inspector — persistent panel for the selected card */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Inspecting
          </div>
          <h3 className="mt-1 text-sm font-medium leading-snug tracking-tight">
            {inspector.label}
          </h3>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Current
            </div>
            <div className="mt-1 text-sm font-medium leading-snug">
              {inspector.value}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Why
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {inspector.rationale}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-accent hover:text-foreground"
            >
              <Undo2 className="size-3" />
              Undo
            </button>
          </div>
        </div>
      </aside>

      {/* WORKING AREA — the video preview, centered */}
      <div className="flex flex-1 min-w-0 flex-col">
        <div className="flex flex-1 min-h-0 items-center justify-center px-6 py-6">
          <EditorClipPreview selected={selected} />
        </div>
      </div>

      {/* COACH PANEL — chatbot, right side */}
      <aside className="flex w-[320px] shrink-0 flex-col border-l border-border bg-background">
        <header className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex size-2 items-center justify-center">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-foreground/50" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </span>
            <h2 className="text-sm font-medium">Coach</h2>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
              {history.length} versions
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Each edit is a checkpoint you can come back to.
          </p>
        </header>

        <Separator />

        {/* Traceable history */}
        <ScrollArea className="flex-1 min-h-0">
          <ul className="flex flex-col gap-1.5 px-3 py-3">
            {history.map((h) => (
              <li key={h.id}>
                <HistoryItem
                  entry={h}
                  active={h.id === currentVersionId}
                  onRestore={() => setCurrentVersionId(h.id)}
                />
              </li>
            ))}
          </ul>
        </ScrollArea>

        {/* Suggested prompts + input — one flush section, no divider between */}
        <div className="border-t border-border px-4 pt-3 pb-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            Try
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coachSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCoachPrompt(s)}
                className={cn(
                  "rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors duration-150",
                  "hover:border-foreground/30 hover:bg-accent hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative mt-3">
            <Textarea
              value={coachPrompt}
              onChange={(e) => setCoachPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitCoachPrompt();
                }
              }}
              placeholder="Tell Coach what to change…"
              rows={3}
              className="resize-none pr-11 text-xs"
            />
            <button
              type="button"
              onClick={submitCoachPrompt}
              disabled={!coachPrompt.trim()}
              aria-label="Send"
              className={cn(
                "absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-md transition-colors duration-150",
                coachPrompt.trim()
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function EditorClipPreview({ selected }: { selected: Moment }) {
  const [playing, setPlaying] = useState(false);
  const [scrub, setScrub] = useState(28);

  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* Width auto-derives from clip's aspect ratio so transport + caption
          stay flush under the clip without hard-coding a width. */}
      <div className="flex w-fit flex-col items-stretch gap-3">
        {/* 9:16 vertical preview — height adapts to viewport with caps.
            Bottom strip is gone, so we can claim more vertical space. */}
        <div
          className="relative aspect-[9/16] h-[clamp(360px,calc(100vh-220px),560px)] overflow-hidden rounded-2xl border border-border bg-black shadow-lg"
          style={selected.videoUrl ? undefined : { background: thumbGradient(selected.id) }}
        >
          {/* Video plays inline; landscape source gets cropped to 9:16 */}
          {selected.videoUrl && (
            <video
              src={selected.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Subtle grid — only when no video */}
          {!selected.videoUrl && (
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

          {/* Top markers */}
          <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[10px] text-white/90">
            <div className="rounded bg-black/45 px-1.5 py-0.5 tabular-nums backdrop-blur-sm">
              1080 × 1920
            </div>
            <div className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">
              SAFE
            </div>
          </div>

          {/* Transcript-driven word-art captions */}
          <CaptionOverlay />

          {/* Center play button */}
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

          {/* Footer chrome */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-8 text-[10px] text-white/90">
            <div className="flex items-center justify-between">
              <span className="font-medium">@bagginstv</span>
              <span className="tabular-nums">{selected.start}</span>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-8 items-center justify-center rounded-md border border-border transition-colors duration-150 hover:bg-accent"
          >
            {playing ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5 translate-x-[1px]" />
            )}
          </button>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            0:0{Math.floor(scrub / 14)}
          </span>
          <Slider
            value={[scrub]}
            onValueChange={(v) => setScrub(v[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {selected.duration}
          </span>
          <button
            type="button"
            aria-label="Fullscreen"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>

        {/* Caption preview */}
        <Card className="gap-1 rounded-lg border p-2.5 text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Hook · live</span>
            <span className="tabular-nums">0:00.4 → 0:02.1</span>
          </div>
          <p className="text-sm font-medium tracking-tight">
            “1v3 with 4 seconds left”
          </p>
        </Card>
      </div>
    </div>
  );
}

function HistoryItem({
  entry,
  active,
  onRestore,
}: {
  entry: HistoryEntry;
  active: boolean;
  onRestore: () => void;
}) {
  const isInitial = entry.prompt === null;
  return (
    <button
      type="button"
      onClick={onRestore}
      aria-pressed={active}
      className={cn(
        "group flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors duration-150",
        active
          ? "border-foreground/40 bg-accent/40"
          : "border-border hover:border-foreground/20 hover:bg-accent/30"
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className={cn(
            "min-w-0 truncate text-xs font-medium leading-tight",
            isInitial && "italic text-muted-foreground"
          )}
        >
          {isInitial ? "Initial draft" : `“${entry.prompt}”`}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {entry.elapsed}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {entry.summary}
      </p>
      <div className="mt-0.5 flex items-center text-[10px]">
        {active ? (
          <span className="inline-flex items-center gap-1 uppercase tracking-wide text-foreground">
            <span className="size-1.5 rounded-full bg-foreground" />
            Current
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
            <RotateCcw className="size-3" />
            Restore
          </span>
        )}
      </div>
    </button>
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

const PLATFORMS = ["TikTok", "Reels", "Shorts"] as const;
type PlatformName = (typeof PLATFORMS)[number];

const PLATFORM_RECOMMENDATIONS: Record<PlatformName, string> = {
  TikTok: "Recommended: 9:16 vertical so your facecam stays centered.",
  Reels: "Recommended: 9:16 vertical for full-screen mobile view.",
  Shorts: "Recommended: 9:16 vertical for the Shorts feed.",
};

function ExportWorkspace({
  selected,
  activeIndex,
  onBack,
}: {
  selected: Moment;
  activeIndex: number;
  onBack: () => void;
}) {
  const [format, setFormat] = useState(FORMATS[0]);
  const [platform, setPlatform] = useState<PlatformName>("TikTok");
  const [captionsOn, setCaptionsOn] = useState(true);
  const [exporting, setExporting] = useState(false);

  return (
    <>
      {/* TOOLS PANEL — grouped settings: Platform / Format / Captions / Quality */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-border bg-background">
        <header className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Export clip</h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Clip {activeIndex + 1}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Review final settings and export your clip for TikTok, Reels, or Shorts.
          </p>
        </header>

        <Separator className="mt-4" />

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-5 px-4 py-4">
            {/* PLATFORM */}
            <SettingsSection
              title="Platform"
              recommendation={PLATFORM_RECOMMENDATIONS[platform]}
            >
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map((p) => {
                  const active = platform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors duration-150",
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
            </SettingsSection>

            <Separator />

            {/* FORMAT */}
            <SettingsSection
              title="Format"
              recommendation="Recommended: MP4 — H.264 plays everywhere."
            >
              <ul className="flex flex-col gap-1">
                {FORMATS.map((f) => {
                  const active = format.id === f.id;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setFormat(f)}
                        aria-pressed={active}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors duration-150",
                          active
                            ? "border-foreground/40 bg-accent/40"
                            : "border-border hover:bg-accent/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                            active
                              ? "border-foreground bg-foreground"
                              : "border-border"
                          )}
                        >
                          {active && (
                            <Check
                              className="size-2.5 text-background"
                              strokeWidth={4}
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium">{f.label}</span>
                          <span className="block text-[10px] text-muted-foreground">
                            {f.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </SettingsSection>

            <Separator />

            {/* CAPTIONS */}
            <SettingsSection
              title="Captions"
              ready={captionsOn}
              recommendation="Recommended for sound-off viewing — most viewers watch on mute."
            >
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setCaptionsOn((v) => !v)}
                  aria-pressed={captionsOn}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2 transition-colors duration-150",
                    captionsOn
                      ? "border-foreground/40 bg-accent/40"
                      : "border-border hover:bg-accent/40"
                  )}
                >
                  <span className="text-xs font-medium">
                    Captions {captionsOn ? "on" : "off"}
                  </span>
                  <span
                    className={cn(
                      "flex h-4 w-7 items-center rounded-full p-0.5 transition-colors duration-150",
                      captionsOn ? "bg-foreground" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full bg-background transition-transform duration-150",
                        captionsOn ? "translate-x-3" : "translate-x-0"
                      )}
                    />
                  </span>
                </button>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Style
                  </span>
                  <span className="text-xs font-medium">Bold yellow, 2 lines</span>
                </div>
              </div>
            </SettingsSection>

            <Separator />

            {/* SAFE CROP */}
            <SettingsSection
              title="Safe crop"
              recommendation="Recommended: 9:16 keeps key content inside the safe zone for all three platforms."
            >
              <div className="rounded-md border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Aspect
                  </span>
                  <span className="text-xs font-medium">9:16 vertical</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Coverage
                  </span>
                  <span className="text-xs font-medium">Face centered, no overlap</span>
                </div>
              </div>
            </SettingsSection>

            <Separator />

            {/* QUALITY */}
            <SettingsSection
              title="Quality"
              recommendation="Recommended: 1080 × 1920 · 30 fps lands within the platform sweet spot."
            >
              <div className="rounded-md border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Resolution
                  </span>
                  <span className="text-xs font-medium tabular-nums">1080 × 1920</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Frame rate
                  </span>
                  <span className="text-xs font-medium tabular-nums">30 fps</span>
                </div>
              </div>
            </SettingsSection>
          </div>
        </ScrollArea>
      </aside>

      {/* WORKING AREA — preview only; readiness lives in the tools panel */}
      <div className="flex flex-1 min-w-0 flex-col">
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 px-6 pt-4 pb-2">
          {/* Status pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <StatusPill primary>Final preview</StatusPill>
            <StatusPill>9:16 crop</StatusPill>
            <StatusPill>{captionsOn ? "Captions on" : "Captions off"}</StatusPill>
          </div>

          <ExportClipPreview selected={selected} captionsOn={captionsOn} />
        </div>

        {/* Bottom action bar */}
        <PhaseContextPanel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-[11px]">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Output
                </div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">
                  1080 × 1920 · 30 fps
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Destination
                </div>
                <div className="mt-0.5 text-sm font-medium">Save to ~/Downloads</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Estimated size
                </div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">4.8 MB</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="lg" onClick={onBack}>
                Back to Editor
              </Button>
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
        </PhaseContextPanel>
      </div>
    </>
  );
}

function SettingsSection({
  title,
  recommendation,
  ready = true,
  children,
}: {
  title: string;
  recommendation: string;
  /** Whether this setting has been configured. Surfaces a check next to the header. */
  ready?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {ready && (
          <span
            aria-label="Ready"
            className="flex size-4 items-center justify-center rounded-full bg-foreground/10 text-foreground"
          >
            <Check className="size-2.5" strokeWidth={4} />
          </span>
        )}
      </div>
      {children}
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        {recommendation}
      </p>
    </section>
  );
}

function StatusPill({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        primary
          ? "border-foreground/30 bg-background text-foreground"
          : "border-border bg-background text-foreground/80"
      )}
    >
      {primary && <span className="size-1.5 rounded-full bg-foreground" />}
      {children}
    </span>
  );
}

function ExportClipPreview({
  selected,
  captionsOn,
}: {
  selected: Moment;
  captionsOn: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [scrub, setScrub] = useState(28);

  return (
    <div className="flex w-fit flex-col items-stretch gap-3">
      {/* 9:16 final preview — match Editor's size now that the checklist is gone */}
      <div
        className="relative aspect-[9/16] h-[clamp(360px,calc(100vh-260px),560px)] overflow-hidden rounded-2xl border border-border bg-black shadow-lg"
        style={selected.videoUrl ? undefined : { background: thumbGradient(selected.id) }}
      >
        {selected.videoUrl && (
          <video
            src={selected.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {!selected.videoUrl && (
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

        <div className="absolute inset-x-3 top-3 flex items-center justify-between text-[10px] text-white/90">
          <div className="rounded bg-black/45 px-1.5 py-0.5 tabular-nums backdrop-blur-sm">
            1080 × 1920
          </div>
          <div className="rounded bg-black/45 px-1.5 py-0.5 backdrop-blur-sm">
            FINAL
          </div>
        </div>

        {captionsOn && <CaptionOverlay />}

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
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-8 items-center justify-center rounded-md border border-border transition-colors duration-150 hover:bg-accent"
        >
          {playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5 translate-x-[1px]" />
          )}
        </button>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          0:0{Math.floor(scrub / 14)}
        </span>
        <Slider
          value={[scrub]}
          onValueChange={(v) => setScrub(v[0])}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          {selected.duration}
        </span>
        <button
          type="button"
          aria-label="Fullscreen"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

