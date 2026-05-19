"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  UploadCloud,
  Clock,
  Folder,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { recentRecordings } from "@/lib/mock";
import { cn } from "@/lib/utils";

function thumbGradient(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 24) % 360;
  return `linear-gradient(135deg, oklch(0.40 0.03 ${a}) 0%, oklch(0.26 0.02 ${b}) 100%)`;
}

export default function ImportPage() {
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const canContinue = selectedRecording !== null || linkUrl.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-[800px] px-6 pt-12 pb-10">
      {/* Heading — centered */}
      <h1 className="text-center text-xl font-semibold tracking-tight">
        Convert your stream into TikTok, Reels, and Shorts.
      </h1>

      {/* Upload + link — two halves of one dashed container */}
      <div className="mt-5 grid grid-cols-2 divide-x divide-border/80 rounded-xl border-2 border-dashed border-border/80 bg-card/30">
        <button
          type="button"
          className="flex items-center gap-3 rounded-l-[10px] px-5 py-5 text-left transition-colors duration-150 hover:bg-accent/30"
          aria-label="Drop video here or click to browse"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
            <UploadCloud className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Drop video here or click to browse</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              MP4, MOV, or MKV up to 8 hours
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 rounded-r-[10px] px-5 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
            <Link2 className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Paste a link</p>
            <Input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="YouTube or Twitch URL"
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Recent recordings */}
      <section className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Recent recordings
          </h2>
          <Button variant="ghost" size="sm" className="h-6 gap-1.5 px-2 text-xs">
            <Folder className="size-3" />
            Browse library
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {recentRecordings.map((r) => {
            const isSelected = selectedRecording === r.id;
            return (
              <Card
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRecording(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedRecording(r.id);
                  }
                }}
                className={cn(
                  "group cursor-pointer gap-0 overflow-hidden rounded-lg border p-0 transition-colors duration-150",
                  isSelected
                    ? "border-foreground/40 bg-accent/40"
                    : "hover:border-foreground/20 hover:bg-accent/20"
                )}
              >
                <div
                  className="relative aspect-video w-full overflow-hidden"
                  style={!r.videoUrl && !r.thumbnail ? { background: thumbGradient(r.id) } : undefined}
                  aria-hidden
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
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-2 py-1 text-[9px] text-white/95">
                    <span className="font-medium tabular-nums">{r.duration}</span>
                    <span className="rounded bg-black/50 px-1 py-0.5">{r.game}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 p-2.5">
                  <h3 className="line-clamp-1 text-xs font-medium leading-snug tracking-tight">
                    {r.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    <span className="truncate">{r.recordedAt}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA — centered, narrower, slightly taller. No helper text. */}
      <div className="mt-6 flex justify-center">
        <Button
          asChild={canContinue}
          size="lg"
          disabled={!canContinue}
          className="h-11 px-8"
        >
          {canContinue ? (
            <Link href="/scout">
              Find best moments
              <ArrowRight className="ml-2 size-4" />
            </Link>
          ) : (
            <span className="flex items-center">
              Find best moments
              <ArrowRight className="ml-2 size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
