import {
  MessageSquare,
  Activity,
  DollarSign,
  Volume2,
  VolumeX,
  Quote,
  Crosshair,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EvidenceKind } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Props = {
  kind: EvidenceKind;
  label: string;
  value?: string;
  className?: string;
};

const iconMap: Record<EvidenceKind, React.ComponentType<{ className?: string }>> = {
  chat: MessageSquare,
  audio: Volume2,
  donation: DollarSign,
  reaction: Activity,
  quote: Quote,
  deadair: VolumeX,
  gameplay: Crosshair,
  retention: TrendingUp,
};

export function EvidenceChip({ kind, label, value, className }: Props) {
  const Icon = iconMap[kind];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-6 gap-1.5 rounded-full border border-border/60 bg-background px-2 text-[11px] font-medium text-foreground/80",
        "hover:bg-accent transition-colors duration-150",
        className
      )}
    >
      <Icon className="size-3 text-muted-foreground" />
      <span>{label}</span>
      {value && (
        <span className="text-muted-foreground tabular-nums">{value}</span>
      )}
    </Badge>
  );
}
