# Scout — Visual & Text Hierarchy

Quick reference for the Scout screen at `app/scout/page.tsx`. Sizes are the
resolved CSS values; Tailwind classes are shown in parentheses where useful.

## Page layout

```
┌─────────┬──────────────────────────────────────────┬──────────────────┐
│ LeftRail│ Preview column (flex-1)                  │ Chat panel       │
│ 96 px   │ (canvas bg)                              │ 320 px           │
└─────────┴──────────────────────────────────────────┴──────────────────┘
```

| Region        | Width  | Height            | Background                          |
|---------------|--------|-------------------|-------------------------------------|
| LeftRail      | 96 px  | viewport - 48 px  | transparent (border-r `--border-subtle`) |
| Preview column| flex-1 | viewport - 48 px  | `--surface-canvas`                  |
| Chat panel    | 320 px | viewport - 48 px  | `--surface-panel` (border-l `--border-subtle`) |

Top bar above the workspace is 48 px (`h-[calc(100vh-3rem)]` on the workspace
wrapper).

---

## 1 · LeftRail — workflow stepper

Container: `<nav>` 96 × full-height, `py-6` (24 px top/bottom).

| Element            | Size / Spec                                          |
|--------------------|------------------------------------------------------|
| Step circle        | 28 × 28 (`size-7`), `rounded-full`                   |
| Phase icon         | 14 × 14 (`size-3.5`) — Compass / SquarePen / Share2  |
| Label              | text 12 px / 600 (`text-xs font-medium`)             |
| Spacing label→circle | 8 px gap (`gap-2`)                                 |
| Connector line     | 1 px wide, vertical, fills `flex-1` gap, `bg-border` |
| Distribution       | three rows + two flex-1 connectors = even spacing    |
| Optional error     | 10 px text (`text-[10px]`), amber (`text-amber-600`) |

Indicator state colors

| State    | Border / Background        | Icon color         |
|----------|----------------------------|--------------------|
| Completed| 1 px indigo / transparent  | indigo-500         |
| Current  | indigo-500 fill + ring     | white              |
| Upcoming | 1 px border / transparent  | muted-foreground   |

---

## 2 · Preview column

Outer container: `flex flex-col`, `pt-5 pb-4` (20 px top, 16 px bottom).
Tighter than before so everything fits on a 13" MacBook viewport.

All content rows use `px-[30px]` left/right, so they align with the
filmstrip's thumbnail edge (filmstrip wraps thumbs in `px-6` + inner `p-1.5` =
30 px total inset).

Vertical order (top → bottom):

1. Moment name (shrink-0)
2. Preview — fills remaining height (flex-1)
3. Annotated moment track (shrink-0)
4. Scan results + Create video button (shrink-0)
5. Filmstrip (shrink-0)

Inter-section spacing

| Between                       | Padding                          |
|-------------------------------|----------------------------------|
| Column top → moment name      | 20 px (`pt-5`)                   |
| Moment name → preview         | 8 px (`pt-2`)                    |
| Preview → annotated track     | 12 px (`pt-3`)                   |
| Annotated track → scan row    | 12 px (`pt-3`)                   |
| Scan row → filmstrip          | 8 px (filmstrip's `pt-2`)        |
| Filmstrip → column bottom     | 16 px (`pb-4`)                   |

### 2.1 Moment name

| Element                | Size / Spec                                              |
|------------------------|----------------------------------------------------------|
| Title                  | 16 px / 600 (`text-base font-semibold`), single line     |
| Format                 | `Moment N · <title>` (e.g. "Moment 1 · Clutch 1v3 to close Round 14") |
| Alignment              | center                                                   |

### 2.2 Moment preview (`MomentPreview`)

| Element        | Size / Spec                                          |
|----------------|------------------------------------------------------|
| Outer card     | `w-full`, capped at `max-w-[640px]` and `max-h-[50vh]`, `aspect-video` (16 : 9) |
| Border         | 1 px `--border-default`, `rounded-2xl` (16 px)       |
| Background     | black                                                |
| Shadow         | `shadow-lg`                                          |
| Centering      | flex `items-center justify-center` in wrapper        |
| Crop overlay   | indigo dashed rectangle, label pill "AI SUGGESTED CROP" (10 px, white on violet-500/90) |
| Duration pill (bottom-left)  | 12 px white, black/40 bg, `rounded` — inside the preview |
| Game pill                    | **removed**                                |

### 2.3 Annotated moment track (`MomentAnnotationTrack`)

Outer card: `w-full` (end-to-end inside the column's 30 px padding),
`rounded-md` (6 px), 1 px border `--border-default`, `bg-background`,
**no shadow**.

#### Layer 1 — Video track header (light)

Height ≈ 36 px. Background `bg-muted/40`, bottom border 1 px.

| Element              | Size / Spec                                             |
|----------------------|---------------------------------------------------------|
| Controls bar         | left side, 4 buttons in a row, gap 2 px (`gap-0.5`)     |
| Button               | 24 × 24 (`size-6`), `rounded`, hover `bg-foreground/10` |
| Button icon          | 14 × 14 (`size-3.5`)                                    |
| Icons used           | `Volume2`, `SkipBack`, `Play`/`Pause`, `SkipForward`    |
| Time ruler           | flex-1, vertically centered                             |
| Tick label           | 9 px tabular-nums (`text-[9px]`), muted-foreground      |
| Tick interval        | 3 s if duration ≤ 20 s · 5 s ≤ 45 s · 10 s ≤ 120 s · else 15 s |

#### Layer 2 — Audio waveform (Descript-style)

Container: 64 px tall (`h-[64px]`), `bg-background`.

| Element        | Size / Spec                                                |
|----------------|------------------------------------------------------------|
| Bars (SVG `<line>`) | 80 interpolated samples (from a 15-ish source array) with deterministic jitter for wave-packet character; centered on baseline (y = 20) |
| Bar stroke     | 1.4 px (`vector-effect: non-scaling-stroke`), round caps   |
| Bar color      | `text-zinc-500` — neutral grey so it doesn't compete with the blue Chat-spike overlay |
| Vertical band  | bottom 65 % of the 64 px area                              |

#### Layer 3 — AI annotation pills

Pinned at exact timestamps via `left: pct%` + `translateX(-50%)`.
Position: `top-2` (8 px from waveform top), z-10.

| Pill                  | Emoji | Timestamp source                                |
|-----------------------|-------|-------------------------------------------------|
| Strong hook           | ⚡    | 0 → `min(3 s, 25 % of duration)` — range + amber stripe behind |
| Chat spike            | 💬    | peak of `moment.chatVelocity`                   |
| Creator reaction      | 😊    | peak of `moment.audioWaveform`                  |

Pill style: `rounded-full`, 1 px border `amber-300/70`, bg `amber-100/95`,
text 10 px / 500, `text-amber-950`, padding 8 px × 2 px (`px-2 py-0.5`),
gap 4 px (`gap-1`).

#### Playhead

| Element       | Size / Spec                                                |
|---------------|------------------------------------------------------------|
| Vertical line | 2 px wide (`w-0.5`), spans the full card height (over both layers), z-30, `bg-red-500` |
| Diamond cap   | 8 × 8 (`size-2`), rotated 45°, `bg-red-500`, top of card    |
| Motion        | loops 0 → 1 over the moment's duration every 80 ms tick     |
| Controls      | Play/Pause toggles loop; Skip Back/Forward jump ±10%        |

### 2.4 Scan results + Create video

| Element              | Size / Spec                                              |
|----------------------|----------------------------------------------------------|
| Row layout           | `flex items-center justify-between gap-3 px-[30px]`      |
| "N moments found" text | 12 px, 500, uppercase, tracking-wider, muted-foreground |
| Create video button  | `size="sm"` (32 px tall), indigo-500 → 600 on hover when enabled; muted (cursor-not-allowed) when `timelineMoments.length === 0` |

### 2.5 Filmstrip (`ThumbnailStrip`)

Outer wrapper: `relative shrink-0 px-6 pt-2`. Inner scroller: `p-1.5` =
6 px inset → thumbnails align at 30 px from the column edge (matches the
other rows).

| Element                | Size / Spec                                                  |
|------------------------|--------------------------------------------------------------|
| Thumbnail              | 150 × ~84 (`aspect-video w-[150px]`), `rounded-lg`           |
| Active ring            | 2 px indigo-500 + 2 px offset                                |
| Moment number badge    | 9 px white on black/55, top-left                             |
| Duration badge         | 12 px tabular white on black/40, bottom-left                 |
| Add/Remove button      | 12 × 12 dot, top-right; emerald-500 with check when added, violet outlined "+" otherwise |
| Scroll buttons         | 28 × 28 round, on left/right of strip when overflowing       |
| Gap between thumbnails | 10 px (`gap-2.5`)                                            |

When the user re-scans, **6 more thumbnails are appended** to the strip
(mock: shuffled re-use of the same 6 base moments; React key includes
`pos` so duplicates are unique).

---

## 3 · Chat panel (`Scout moments`)

Container: 320 px wide, `bg-[hsl(var(--surface-panel))]`, left border 1 px.

| Element                       | Size / Spec                                       |
|-------------------------------|---------------------------------------------------|
| Heading ("Scout moments")     | 24 px / 700 (`text-2xl font-bold`)                |
| Chat thread spacing           | 16 px vertical gap (`space-y-4`)                  |
| Chat bubble                   | max-w 85 %, 14 px text (`text-sm`), `rounded-2xl` |
| User bubble bg                | `bg-primary/10`                                   |
| AI bubble bg                  | `bg-indigo-50`                                    |
| Loading bubble                | `animate-pulse text-muted-foreground`             |
| Refinement chips              | 14 px (`text-sm`), `rounded-full`, 1 px border, padding `px-2.5 py-1` |
| Composer card                 | `bg-[hsl(var(--surface-sunken))]`, `p-3`, `mt-4`  |
| Textarea                      | min-h 60 px, 14 px, no border, no ring focus      |
| Enhance prompt icon button    | 24 × 24, violet-500 sparkles, bottom-right of composer |
| "Find new moments" CTA        | size="lg", outline variant, full-width, `mt-3`    |

---

## 4 · Typography summary

| Class           | px size | Notable usages                              |
|-----------------|---------|---------------------------------------------|
| `text-2xl`      | 24      | Chat panel heading                          |
| `text-base`     | 16      | Moment title                                |
| `text-sm`       | 14      | Chat bubbles, refinement chips, textarea    |
| `text-xs`       | 12      | "N moments found", Now previewing, step labels, badges |
| `text-[10px]`   | 10      | Annotation pills, "Now previewing" caption, step state captions |
| `text-[9px]`    | 9       | Time-ruler ticks                            |

Tracking: `tracking-wider` (+0.05em) is used on uppercase metadata labels.

## 5 · Color tokens used in Scout

| Token / class              | Resolves to                                          |
|----------------------------|------------------------------------------------------|
| `--surface-canvas`         | preview column bg                                    |
| `--surface-panel`          | chat panel bg                                        |
| `--surface-sunken`         | composer card bg                                     |
| `--border-subtle`          | rail / panel separators                              |
| `--border-default`         | preview / track outer border                         |
| indigo-500                 | active stepper node, Create video CTA, AI accents    |
| amber-100 / amber-300      | annotation pill fill / border, hook range highlight  |
| amber-950                  | annotation pill text                                 |
| red-500                    | playhead line + cap                                  |
| violet-500                 | Enhance prompt sparkles                              |
| emerald-500                | filmstrip "added" check badge                        |
