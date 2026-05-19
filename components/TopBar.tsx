"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Rocket } from "lucide-react";

export function TopBar() {
  const pathname = usePathname();
  // Hide back button on Import (the entry / home screen) itself.
  const showBack = pathname !== "/import" && pathname !== "/";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href="/import"
            aria-label="Back to Import"
            className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
        )}
        <Link
          href="/import"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors duration-150 hover:text-foreground/90"
        >
          <Rocket className="size-4 -rotate-45" />
          SoftLaunch
        </Link>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="hidden font-medium md:inline">Maya</span>
        <span
          aria-hidden
          className="inline-flex size-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ background: "oklch(0.55 0.16 30)" }}
        >
          M
        </span>
      </div>
    </header>
  );
}
