"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Clock,
  Link2,
  Sparkles,
  Play,
  ChevronDown,
  Check,
  FileVideo,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScoutSkeleton } from "@/components/ScoutSkeleton";
import {
  recentRecordings,
  intentPresets,
  intentPrompts,
  promptEnhancements,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

// How long the AI-processing skeleton shows before routing to Scout (mocked).
const SCAN_DURATION_MS = 1600;
// Key used to hand the chosen intent off to Scout across the route.
const INTENT_HANDOFF_KEY = "scout:intent";

const ASPECT_RATIOS = [
  { value: "9:16", platforms: "TikTok • Reels • Shorts" },
  { value: "4:5", platforms: "Instagram" },
] as const;

// Google Drive glyph (the import source shown in the screenshot).
function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" className={className} aria-hidden="true">
      <path d="M6.6 66.85 10.45 73.5c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.79l5.85 11.5z" fill="#ea4335" />
      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="M73.4 26.5 60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(135deg, oklch(0.40 0.03 ${a}) 0%, oklch(0.26 0.02 ${b}) 100%)`;
}

// Mock "Enhance prompt" — mirrors the shared IntentField behavior.
function enhancePrompt(seed: string | undefined, prompt: string): string {
  if (seed && promptEnhancements[seed]) return promptEnhancements[seed];
  const trimmed = prompt.trim();
  if (promptEnhancements[trimmed]) return promptEnhancements[trimmed];
  return `Find ${
    trimmed.toLowerCase() || "your best moments"
  } with strong creator reaction, chat response, and a clear first 3-second hook.`;
}

export default function ImportPage() {
  const router = useRouter();
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [aspectRatios, setAspectRatios] = useState<string[]>(["9:16"]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSource =
    selectedRecording !== null ||
    uploadedFileName !== null ||
    linkUrl.trim().length > 0;
  const canContinue = hasSource;
  const canEnhance =
    canContinue && (selectedChips.length > 0 || prompt.trim().length > 0);

  const toggleAspect = (v: string) =>
    setAspectRatios((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
    );

  // Toggling a chip also writes its prompt sentence into the textarea below,
  // so the chips read as part of the prompt context (not a separate control).
  const toggleChip = (label: string) => {
    const sentence = intentPrompts[label] ?? `Find ${label.toLowerCase()}.`;
    if (selectedChips.includes(label)) {
      setSelectedChips(selectedChips.filter((c) => c !== label));
      setPrompt(
        prompt
          .split("\n")
          .filter((line) => line.trim() !== sentence)
          .join("\n")
          .trim()
      );
    } else {
      setSelectedChips([...selectedChips, label]);
      setPrompt(prompt.trim() ? `${prompt.trim()}\n${sentence}` : sentence);
    }
  };

  const handleFile = (file: File) => {
    setUploadedFileName(file.name);
    setSelectedRecording(null);
    setUploadOpen(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onPickRecording = (id: string) => {
    setSelectedRecording(id);
    setUploadedFileName(null);
    setUploadOpen(false);
  };

  const clearSource = () => {
    setSelectedRecording(null);
    setUploadedFileName(null);
  };

  // Show the AI-processing skeleton, then route to Scout. Mocked, not real work.
  const handleFindMoments = () => {
    if (!canContinue) return;
    try {
      sessionStorage.setItem(
        INTENT_HANDOFF_KEY,
        JSON.stringify({ selectedIntent: selectedChips[0] ?? null, prompt })
      );
    } catch {
      // sessionStorage may be unavailable; intent handoff is best-effort.
    }
    setScanning(true);
    setTimeout(() => router.push("/scout"), SCAN_DURATION_MS);
  };

  if (scanning) return <ScoutSkeleton durationMs={SCAN_DURATION_MS} />;

  const selectedRecordingObj =
    selectedRecording !== null
      ? recentRecordings.find((r) => r.id === selectedRecording)
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-6 pt-12 pb-16">
      <h1 className="mb-10 text-center text-4xl font-bold tracking-tight text-foreground">
        Your stream, ready to post.
      </h1>

      {/* Unified widget — source (link/upload) + intent (chips/prompt) in one card */}
      <div className="rounded-xl border border-border/60 bg-background">
        {/* URL input group */}
        <div className="p-2">
          <div className="flex h-12 items-center gap-2 rounded-lg border border-transparent px-3 transition-all duration-150 ease-out focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Drop a YouTube or Twitch link"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Upload / Google Drive (left) + Aspect-ratio dropdown (right) */}
        <div className="flex flex-wrap items-center gap-1 p-2">
          {selectedRecordingObj || uploadedFileName ? (
            <div className="flex items-center gap-2 rounded-md bg-accent/40 px-2.5 py-1.5 text-sm">
              <FileVideo className="size-4 text-indigo-500" />
              <span className="max-w-[280px] truncate font-medium">
                {selectedRecordingObj
                  ? selectedRecordingObj.title
                  : uploadedFileName}
              </span>
              <button
                type="button"
                onClick={clearSource}
                aria-label="Remove selection"
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="gap-2 text-sm font-medium text-foreground transition-all duration-150 ease-out hover:bg-accent/40"
              >
                <UploadCloud className="size-4" />
                Upload
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-sm font-medium text-foreground transition-all duration-150 ease-out hover:bg-accent/40"
              >
                <GoogleDriveIcon className="size-4" />
                Google Drive
              </Button>
            </>
          )}

          <div className="ml-auto flex items-center gap-1">
            {/* Aspect ratio — multi-select with platform tags */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Aspect ratio"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm transition-all duration-150 ease-out hover:border-indigo-500/40 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:outline-none"
                >
                  <span className="text-muted-foreground">Aspect ratio</span>
                  <span className="flex flex-wrap items-center gap-1">
                    {aspectRatios.length === 0 ? (
                      <span className="text-muted-foreground">Select</span>
                    ) : (
                      aspectRatios.map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-indigo-500"
                        >
                          {r}
                        </span>
                      ))
                    )}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-1">
                {ASPECT_RATIOS.map((r) => {
                  const on = aspectRatios.includes(r.value);
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => toggleAspect(r.value)}
                      aria-pressed={on}
                      className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-sm transition-colors duration-150 ease-out hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {r.value}
                        </span>
                        <span className="rounded-full border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {r.platforms}
                        </span>
                      </span>
                      {on && (
                        <Check
                          className="size-4 text-indigo-500"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Intent — suggestion chips + prompt textarea (same widget) */}
        <div
          className={cn(
            "space-y-3 p-3 transition-opacity duration-150",
            !canContinue && "opacity-60"
          )}
          aria-disabled={!canContinue}
        >
          <div className="flex flex-wrap gap-2">
            {intentPresets.slice(0, 5).map((label) => {
              const on = selectedChips.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!canContinue}
                  onClick={() => toggleChip(label)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50",
                    on
                      ? "border-indigo-500 bg-indigo-500/10 font-medium text-indigo-500"
                      : "border-border text-muted-foreground hover:border-indigo-500/40 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!canContinue}
              placeholder={
                canContinue
                  ? "Describe your moments"
                  : "Add a link or upload above to describe your moments."
              }
              rows={3}
              className="min-h-[80px] max-h-[200px] resize-none border-0 bg-transparent pr-11 text-sm shadow-none focus-visible:ring-0"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!canEnhance}
                  onClick={() => setPrompt(enhancePrompt(selectedChips[0], prompt))}
                  aria-label="Enhance prompt"
                  className="absolute bottom-2 right-2 text-muted-foreground transition-all duration-150 ease-out hover:bg-accent/40 hover:text-foreground disabled:opacity-50"
                >
                  <Sparkles className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Enhance prompt</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={handleFindMoments}
          className={cn(
            "h-11 px-8 text-base transition-all duration-150 ease-out",
            canContinue
              ? "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 hover:shadow-md active:bg-indigo-600"
              : "cursor-not-allowed bg-muted text-muted-foreground disabled:opacity-100"
          )}
        >
          Find moments
        </Button>
      </div>

      {/* Upload popup — Upload tab + Recent tab */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogTitle className="sr-only">Add a video</DialogTitle>
          <Tabs defaultValue="upload" className="gap-4 pt-6">
            <TabsList className="w-full">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="recent">Recent recordings</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-matroska,.mp4,.mov,.mkv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-all duration-150 ease-out",
                  isDragging
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-border hover:border-indigo-500/40 hover:bg-accent/30"
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                  <UploadCloud className="size-6" />
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    Drag and drop your video here
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    or click to browse
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Supports MP4, MOV, or MKV — up to 8 hours
                </span>
              </button>
            </TabsContent>

            <TabsContent value="recent">
              <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                {recentRecordings.map((r) => (
                  <Card
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onPickRecording(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPickRecording(r.id);
                      }
                    }}
                    className="group cursor-pointer gap-0 overflow-hidden p-0 transition-all duration-200 ease-out hover:shadow-md hover:ring-2 hover:ring-indigo-500/30"
                  >
                    <div
                      className="relative aspect-video w-full overflow-hidden"
                      style={
                        !r.videoUrl && !r.thumbnail
                          ? { background: thumbGradient(r.id) }
                          : undefined
                      }
                    >
                      {r.videoUrl && (
                        <video
                          src={r.videoUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      {!r.videoUrl && r.thumbnail && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.thumbnail}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}

                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-black/0"
                        aria-hidden
                      />

                      <Badge
                        variant="secondary"
                        className="absolute left-1.5 top-1.5 border-transparent bg-black/60 tabular-nums text-white backdrop-blur-sm"
                      >
                        {r.duration}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="absolute right-1.5 top-1.5 max-w-[60%] truncate border-transparent bg-black/60 text-white backdrop-blur-sm"
                      >
                        {r.game}
                      </Badge>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
                        <span className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
                          <Play className="size-4 translate-x-px" fill="currentColor" />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 p-2.5">
                      <h3 className="truncate text-sm font-medium leading-snug">
                        {r.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span className="truncate">{r.recordedAt}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
