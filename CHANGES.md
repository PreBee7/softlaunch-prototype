# Import → Scout UX changes

Scope: only the **Import → Scout transition** and the **Scout screen left panel**.
Editor and Export are untouched. No new libraries; no visual restyle. Uses existing
shadcn/Tailwind components (`Skeleton`, `Progress`, `Separator`, `Popover`, `Textarea`, `Button`).

## Part 1 — Import → Scout loading state (AI processing skeleton)
- Clicking **"Find best moments"** no longer jumps straight to Scout; it shows a
  mocked loading state for ~1.6s, then `router.push("/scout")`.
- New component `components/ScoutSkeleton.tsx` renders skeleton placeholders shaped
  like Scout: left-panel rows (intent, number of clips, clip duration, video duration),
  a center clip-preview card, and bottom "Why this moment?" cards.
- Title **"Scanning your stream"** + helper **"Finding short-form moments for TikTok, Reels, and Shorts."**
- Progress bar plus cycling status messages: "Detecting reactions", "Checking chat spikes", "Ranking short-form moments".
- Files: `app/import/page.tsx` (button + `useRouter` instead of `<Link>`), `components/ScoutSkeleton.tsx` (new).

## Part 2 — Scout left panel reordering
- New order: **1. Intent → 2. Number of clips → 3. Clip duration → 4. Video duration**.
- Intent section moved to the top; "What are you looking for?" heading renamed to **"Intent"**.
- Clip duration clarified as each generated moment's length; new **Video duration** added below it.
- Files: `app/scout/page.tsx` (`ScoutWorkspace` form area).

## Part 3 — Intent default state
- No intent chip is selected on load (tracked by a new `selectedIntent` state, default `null`).
- The prompt field starts empty with placeholder **"e.g., funny moment with a big chat spike"**.
- Clicking a chip selects it and auto-fills the prompt from `intentPrompts` (e.g. "Funny moments" → "Find funny moments with strong creator reaction and chat response.").
- **"Enhance prompt"** is disabled (low-emphasis) until a chip is selected or text is typed; it then expands the current prompt.
- Files: `app/scout/page.tsx`, `lib/mock.ts` (new `intentPrompts` map).

## Part 4 — Number of clips
- Kept as-is using the existing stepper control (`NumberRow`), default **5**.
- Files: `app/scout/page.tsx`.

## Part 5 — Clip duration
- Kept the existing duration control (`DurationRow`), default **30s** — now means each generated clip/moment.
- Added helper line: "Length of each moment Scout pulls from your stream."
- Files: `app/scout/page.tsx`.

## Part 6 — Video duration dropdown
- New single-choice dropdown (`VideoDurationRow`, built on existing `Popover`), default **Auto**.
- Options: Auto, 15s, 30s, 45s, 60s, 90s.
- Helper copy: "Auto picks the best length based on the moment."
- Files: `app/scout/page.tsx`.

## Part 7 — Copy clarity
- Scout helper updated to "AI scans your stream and ranks **short-form** moments that could work for TikTok, Reels, and Shorts."
- Kept plain creator language: title "Scout moments", primary CTA "Find new moments", selected-clip CTA "Use this clip", "Why this moment?".
- No jargon introduced ("semantic intent", "evidence", "confidence pipeline", "output package" are not used in the UI).
- Files: `app/scout/page.tsx`.

## Verification
- `npx tsc --noEmit` passes; `eslint` clean on changed files.
- Dev server compiles `/import` and `/scout` with 200s and no errors.
- Confirmed at runtime: panel order Intent→clips→clip→video, empty prompt + placeholder, no chip selected, Enhance disabled by default, Video duration defaults to Auto.
