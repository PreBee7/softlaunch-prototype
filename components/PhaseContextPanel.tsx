import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Swappable bottom strip of the working area. Same container, varying
 * content per phase: evidence (Scout), platform readiness (Coach/Export),
 * etc.
 */
export function PhaseContextPanel({ children, className }: Props) {
  return (
    <section
      aria-label="Phase context"
      className={cn(
        "shrink-0 border-t border-border bg-card/30 px-8 py-5",
        className
      )}
    >
      {children}
    </section>
  );
}
