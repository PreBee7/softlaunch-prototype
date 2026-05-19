import { cn } from "@/lib/utils";

type Props = {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
};

export function ConfidenceRing({
  value,
  size = 40,
  strokeWidth = 3,
  className,
  showLabel = true,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-label={`Confidence ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          className="stroke-foreground"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-medium tabular-nums">
          {clamped}
        </span>
      )}
    </div>
  );
}
