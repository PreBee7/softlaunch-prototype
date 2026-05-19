"use client";

import Link from "next/link";
import { ArrowRight, FileVideo, Quote, Layers } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { emptyStateFallbacks, stream, streamer } from "@/lib/mock";

const iconFor = (id: string) => {
  if (id === "f1") return Layers;     // montage
  if (id === "f2") return Quote;      // quote-based
  return FileVideo;                   // best-of
};

export function ScoutEmpty() {
  return (
    <AppShell>
      <header className="mb-6">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
          <span>Scout</span>
          <span aria-hidden>·</span>
          <span>{streamer.name}</span>
          <span aria-hidden>·</span>
          <span>{stream.recordedAt}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          No strong standalone moments found
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Scout scanned <span className="text-foreground">{stream.title}</span> ({stream.duration})
          and didn’t find a single beat strong enough to stand alone. That’s usually a sign the
          stream is better as a stitched format. A few options:
        </p>
      </header>

      <Separator className="mb-6" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {emptyStateFallbacks.map((f) => {
          const Icon = iconFor(f.id);
          return (
            <Card
              key={f.id}
              className="group cursor-pointer gap-3 rounded-xl border p-5 transition-colors duration-150 hover:border-foreground/20 hover:bg-accent/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-md border border-border bg-background">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {f.detail}
                </span>
              </div>
              <div>
                <h3 className="text-base font-medium leading-snug tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                <span className="text-muted-foreground">Build this</span>
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        You can also{" "}
        <Link href="/scout" className="text-foreground underline-offset-4 hover:underline">
          re-scan with a different intent
        </Link>{" "}
        or{" "}
        <Link href="/import" className="text-foreground underline-offset-4 hover:underline">
          pick a different stream
        </Link>
        .
      </p>
    </AppShell>
  );
}
