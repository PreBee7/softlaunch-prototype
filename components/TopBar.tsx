"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Minimal top bar — SoftLaunch wordmark on the left, user avatar on the right.
export function TopBar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 bg-background px-4">
      <Link
        href="/import"
        aria-label="SoftLaunch — back to start"
        className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors duration-150 hover:text-foreground/90"
      >
        <Rocket className="size-4 -rotate-45" />
        SoftLaunch
      </Link>

      {/* Maya's avatar — image with an indigo "M" fallback */}
      <Avatar className="size-7">
        <AvatarImage src="/assets/Avatar%20Image.jpg" alt="Maya" />
        <AvatarFallback className="bg-indigo-500 text-xs font-medium text-white">
          M
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
