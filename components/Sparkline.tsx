import { cn } from "@/lib/utils";

type BaseProps = {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
};

type HighlightProps = {
  /**
   * Index to visually emphasize in blue. Defaults to the peak bar / point.
   * For LineSparkline, this is the data point to mark early-rise.
   */
  highlightIndex?: number;
};

function scaleY(v: number, min: number, max: number, h: number, pad = 2) {
  if (max === min) return h / 2;
  return h - pad - ((v - min) / (max - min)) * (h - pad * 2);
}

export function BarSparkline({
  data,
  width = 220,
  height = 48,
  className,
  gap = 2,
  highlightIndex,
}: BaseProps & { gap?: number } & HighlightProps) {
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 1);
  const peakIdx = highlightIndex ?? data.indexOf(max);
  const n = data.length;
  const barW = Math.max(2, (width - gap * (n - 1)) / n);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", className)}
      role="img"
      aria-label="Chat velocity"
    >
      {data.map((v, i) => {
        const x = i * (barW + gap);
        const y = scaleY(v, min, max, height, 1);
        const h = height - y - 1;
        const isHighlight = i === peakIdx;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(1, h)}
            rx={1}
            className={cn(isHighlight ? "fill-blue-500" : "fill-foreground/85")}
          />
        );
      })}
    </svg>
  );
}

export function WaveformSparkline({
  data,
  width = 220,
  height = 48,
  className,
  highlightIndex,
}: BaseProps & HighlightProps) {
  const n = data.length;
  const barW = Math.max(2, width / (n * 1.6));
  const gap = (width - barW * n) / (n - 1);
  const peakIdx = highlightIndex ?? data.indexOf(Math.max(...data));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", className)}
      role="img"
      aria-label="Audio waveform"
    >
      {data.map((v, i) => {
        const h = Math.max(2, v * (height - 4));
        const x = i * (barW + gap);
        const y = (height - h) / 2;
        // Highlight the peak bar plus the one on either side — feels like
        // "a reaction beat" rather than a single instant.
        const isHighlight = Math.abs(i - peakIdx) <= 1;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={barW / 2}
            className={cn(isHighlight ? "fill-blue-500" : "fill-foreground/80")}
          />
        );
      })}
    </svg>
  );
}

export function LineSparkline({
  data,
  width = 220,
  height = 48,
  className,
  highlightIndex = 2,
}: BaseProps & HighlightProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const n = data.length;
  const stepX = width / (n - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = scaleY(v, min, max, height, 4);
    return [x, y] as const;
  });

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = d + ` L ${width},${height} L 0,${height} Z`;

  // Early-rise overlay: first N points get a thicker blue stroke.
  // Tells the "strong first seconds" story visually.
  const earlyN = Math.min(highlightIndex + 1, n);
  const earlyPoints = points.slice(0, earlyN);
  const earlyD = earlyPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
    .join(" ");

  const highlightPoint =
    highlightIndex >= 0 && highlightIndex < n ? points[highlightIndex] : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", className)}
      role="img"
      aria-label="Viewer count"
    >
      <path d={area} className="fill-foreground/8" />
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="stroke-foreground"
      />
      {earlyPoints.length >= 2 && (
        <path
          d={earlyD}
          fill="none"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-blue-500"
        />
      )}
      {highlightPoint && (
        <circle
          cx={highlightPoint[0]}
          cy={highlightPoint[1]}
          r={3}
          className="fill-blue-500"
        />
      )}
    </svg>
  );
}
