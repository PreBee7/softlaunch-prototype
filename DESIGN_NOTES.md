# Design Notes

## Import — "Recent videos" rail (short-form output)

- Brought back the old below-the-fold rail, repurposed for **recent short-form videos** the creator has made in SoftLaunch (portrait, 9:16). Layout is the same shape as the old "Recent recordings" rail: section heading + "Browse all" link, separator, then a 4-column grid of cards (`grid-cols-2 sm:grid-cols-4`, `gap-3`).
- Each card carries the elements that matter for a *finished short* rather than a raw recording:
  - **Portrait 9:16 thumbnail** (`aspect-[9/16]`) — auto-playing muted/loop video preview.
  - **Status pill** (top-left, color-coded): `draft` (neutral), `scheduled` (amber), `published` (emerald). Lets the user scan their library by state at a glance.
  - **Duration** (bottom-right, tabular) — small black pill.
  - **Title** (truncated, 14 px / 500).
  - **Created at** (with a Clock icon, small muted text).
  - **Platforms** the short was exported to — small outlined pills (TikTok / Reels / Shorts).
  - Hover affordance: subtle ring + play glyph centered on the thumbnail.
- New mock data in `lib/mock.ts`:
  - `RecentVideoStatus = "draft" | "scheduled" | "published"`
  - `RecentVideoPlatform = "TikTok" | "Reels" | "Shorts"`
  - `recentVideos: RecentVideo[]` — 4 sample entries (covering all 3 statuses + various platform combinations) using the existing `/assets/Short*.mov` clips.

## Export — cards now respect the 24 px bottom safe area

- Cause: with `items-center` on the previews row, cards that were too tall for the column overflowed equally **above and below**, eating into the working area's `pb-6` (24 px) and giving the appearance of zero bottom spacing.
- Fix: bound each card width by viewport height too. `max-w-[340px]` → `max-w-[min(340px,calc((100vh-260px)*9/16))]`. The 260 px reserves room for the top bar (40) + working-area padding (pt-5 + pb-6 = 44) + the card's non-phone chrome (header + toggles + publish controls ≈ 130) + a small inactive-platforms-row buffer. With width thus capped, the phone preview (which is `aspect-[9/16]` of the card width) always fits inside the column, so the cards no longer eat into the 24 px bottom safe area.
- On wider viewports the `340px` cap dominates; on shorter viewports the height-derived value takes over and shrinks each card so the row fits cleanly.

## Export — preview cards fill the panel

- Each `PlatformPreview` card width changed from the viewport-based `w-[min(calc((100vw_-_460px)/3),calc((100vh_-_300px)*9/16))]` to **`flex-1 min-w-0 max-w-[340px]`**. The three cards now divide the working-area width evenly and fill it edge-to-edge on a 13"-class viewport (no left/right empty gutter); on much wider screens the `max-w-[340px]` cap keeps each card from getting absurdly large and the row stays centered.
- The preview row's vertical alignment changed `items-start → items-center`, so the cards vertically center in the available column height — visually balanced top/bottom instead of all the slack collecting at the bottom.

## Export — panel moved right, spacing matched to Scout, Download per video

- The "Export" control panel (header + What's in this clip + Format selector) has been moved from the **left to the right** of the workspace, matching the Scout / Editor pattern. JSX physically reordered; aside border flipped `border-r → border-l`.
- The working area (the row of three platform-preview cards) now uses `pt-5 pb-6 px-[30px]`, the same column padding Scout uses — so the 3 videos have consistent left / right / bottom breathing room across phases.
- **Each platform preview now has a "Download MP4" button** in its per-platform control card. Secondary (outline) styling with `Download` icon — sits below the Publish / Schedule / Connect controls and is always available regardless of connection or publish state. Click handler is a mock no-op for now (real implementation would trigger a file save).

## Scout — Delete + Undo for moments

- New **Undo** and **Delete** buttons added before **Create video** in Scout's bottom action row. Both use `variant="outline" size="sm"` (secondary styling) with `Undo2` / `Trash2` icons. Order: **Undo → Delete → Create video**.
- **Delete** removes every occurrence of the currently-active moment from the filmstrip and (if present) from the user's timeline; selection slides to whatever moment is now at the same position. Disabled when there are no moments to delete.
- **Undo** restores the most recent delete: the previous `order` snapshot, the active moment jumps back to the deleted one, and timeline membership is restored if it was there. Disabled when nothing is on the delete stack.
- Implementation: a per-instance `DeletedSnapshot[]` stack inside `ScoutWorkspace` holds `{ prevOrder, deletedMomentIdx, wasInTimeline }`. Multiple deletes stack; multiple undos pop in order. Mock state only.

## Editor — Hook / Captions / B-roll stop marking themselves "done"

- These three tools are ones the user is expected to keep iterating on, so the green/check "applied" badge no longer appears on them.
- Implementation: added a `NEVER_MARK_APPLIED = {"hook", "caption", "broll"}` set in `EditorWorkspace`; `markApplied` short-circuits for those IDs while still being called from the original code paths (so the rest of the apply flow — version history card, drill-in close, etc. — is unchanged). Other tools (Crop focus, Layout, Pacing, Dead air removed) still mark themselves done.

## Top bar slimmed; 24 px bottom safe area; Export follows Editor unlock

- **Top bar reduced** from 48 px → **40 px** (`h-12` → `h-10`) in `components/TopBar.tsx`. 40 px is the lower end of the modern desktop-app standard (Linear, Slack 40–44, VS Code 30, Figma 48). Workspace height calc updated in `app/scout/page.tsx` and `components/ScoutSkeleton.tsx`: `calc(100vh - 3rem)` → `calc(100vh - 2.5rem)`.
- **24 px bottom safe area** applied consistently:
  - Scout preview column `pb-4 → pb-6` (filmstrip now 24 px from the workspace bottom).
  - Scout chat composer `pb-4 → pb-6` (chat field now 24 px from the workspace bottom).
  - Editor `PhaseContextPanel` `py-3 → pt-3 pb-6` (timeline now 24 px from the workspace bottom).
  - Editor chat composer `pb-4 → pb-6` (chat field now 24 px from the workspace bottom).
- **Export follows Editor**: `LeftRail`'s `unlocked` from Scout now passes `{ editor: selectedIds.length > 0, export: selectedIds.length > 0 }`. Once the user has selected any moments, both Editor *and* Export are clickable — Export is no longer gated separately. Added a `lockedTooltips.export` mirror of the Editor one ("Select moments to enter Export").

## Scout + Editor — Send button in chat, no full-width CTA, crop tag bg

- Screen changed: Scout + Editor (`app/scout/page.tsx`).
- **Scout chat: full-width "Find new moments" CTA removed.** Send happens via the new icon button inside the textarea.
- **Send-style arrow button** added inside both Scout and Editor chat textareas, sitting **to the right of Enhance** in a small flex group (`gap-1.5`) at `absolute bottom-2 right-2`. Primary-button styling: `bg-indigo-500 text-white shadow-sm hover:bg-indigo-600`, disabled when the field is empty or while loading. Icon: `ArrowUp`, stroke 2.5.
- Textarea right-padding bumped `pr-10` → `pr-20` to make room for the two stacked icon buttons.
- **Scout placeholder updated** to include "new": `"Ask Scout to find new moments..."`.
- **Composer bottom padding** changed `pb-3` → `pb-4` on both Scout and Editor chat panels so the chat field's bottom edge aligns horizontally with the preview column's filmstrip / timeline (both columns now end at the same `pb-4` from the workspace bottom).
- **AI Suggested Crop tag**: solid white background added (`bg-white` with `shadow-sm`) so the indigo-outlined pill reads against the video preview behind it.

## Scout + Editor — re-scan UX, chat chip parity, locked-editor tooltip, crop tag

- Screens changed: Scout + Editor (`app/scout/page.tsx`), LeftRail (`components/LeftRail.tsx`).

**Re-scan no longer reloads the preview**
- The preview / annotated track / moment title now stay visible during re-scans. The chat panel (Scout, the AI) carries the loading state on its own bubble — the canvas is no longer skeletoned.
- `ThumbnailStrip` got a new `appendingCount?: number` prop. While Scout is "finding more moments", we render that many **skeleton thumbs at the END** of the strip alongside the existing real thumbs (rather than blanking the whole strip).
- When the order array grows (real moments arrive), the strip **smooth-scrolls** to bring the first newly-added moment near the left edge — so the user sees what Scout just added without hunting.
- Scan-row text reflects the AI's state: `"Scout is finding 6 more moments…"` while loading, `"N moments found"` after.
- Removed the old `loading` prop / full-strip skeleton branch.

**Chat chip parity with Import's intent chips**
- Scout's "More creator reaction / Less gameplay / Under 30s / More chat spikes" and Editor's "Make hook faster / Add punchier captions / …" prompt chips now use the **same styling and selected-state interaction** as Import's intent chips:
  - `rounded-full border px-3 py-1 text-xs` (was `text-sm px-2.5`)
  - Selected = `border-indigo-500 bg-indigo-500/10 font-medium text-indigo-500`
  - Unselected = `border-border text-muted-foreground hover:border-indigo-500/40 hover:text-foreground`
- Toggle behavior: clicking a selected chip clears it; clicking another chip switches the query to it. `aria-pressed` reflects the active chip.

**Locked-Editor tooltip**
- New `lockedTooltips?: Partial<Record<Phase, string>>` prop on `LeftRail`. Locked steps now show a hover tooltip explaining how to unlock them.
- `ScoutPage` passes `lockedTooltips={{ editor: "Select moments to enter Editor" }}`. The Editor step's tooltip appears on hover whenever Editor is locked (no moments selected).
- Implementation: dropped the HTML `disabled` attribute (it was swallowing pointer events and suppressing hover); the locked-click is now gated only by the `onClick` handler + `aria-disabled`, so the tooltip fires on hover.

**AI Suggested Crop tag restyled**
- The crop-overlay pill on the preview now uses the same indigo-on-indigo/10 outline as Import's intent chips (was solid violet/90 with white uppercase text). Maintains visual consistency across the app.

## Scout + Editor — track layout fix, ranges, editor nav, chat polish

- Screens changed: Scout (`app/scout/page.tsx`) and Editor (same file, `EditorWorkspace`); LeftRail (`components/LeftRail.tsx`).

**Annotated track restructure**
- Playback controls now span **both** rows vertically on the left (single shrink-0 column with a right border). The time ruler and audio waveform live in a right-side flex-col, so both start at the same x — fixing the issue where the waveform extended past 0:00.
- **Asymmetric waveform**: each bar now has independent top and bottom amplitudes (deterministic sin/cos jitter), so it reads as a real audio signal rather than a symmetric bar chart. Still 80 interpolated bars, blue.
- **Range overlays added** in the waveform layer:
  - ⚡ Strong hook — 0 → `min(3s, 25% of duration)` (amber/45)
  - 💬 Chat spike — 1.5 s centered on the chat-velocity peak (blue/45)
  - 😊 Creator reaction — 2 s centered on the audio peak (emerald/40)
  - Pill tone matches its overlay (amber/blue/emerald).
- **Time ruler** now uses strict **multiples of 3** for major ticks (with labels) and adds **minor 1-second tick dashes** between. Removed the trailing duration tick that was producing the inconsistent 0:12 → 0:14 gap on shorter moments.
- Red playhead is now inside the right-side container (relative to ruler + waveform), so it stays aligned with timestamps and doesn't drift over the controls.

**LeftRail — Editor unlock logic**
- New `unlocked?: Partial<Record<Phase, boolean>>` prop. When a step is positionally upcoming but its key is `true` in `unlocked`, it's not disabled.
- `ScoutPage` now passes `unlocked={{ editor: selectedIds.length > 0 }}`, so once the user has selected any moments, Editor stays accessible from Scout — no more re-locking when navigating Scout → Editor → Scout.
- Visual: an unlocked-upcoming step keeps the muted-circle style (still positionally later in the flow) but is clickable, with `hover:text-foreground`. Locked-upcoming gets `cursor-not-allowed` and stays disabled.

**Editor — chat panel moved to the right**
- The Editor chat aside (header + thread + chips + composer) was moved from the left to the right of the workspace, matching Scout. JSX physically reordered; `border-r` → `border-l`. The wide bottom timeline still spans the working area as before.
- Editor header trimmed: removed the *"Refine your short-form video."* subheader.

**Chat composer placeholders updated**
- Scout: `"Ask Scout to find different moments…"` → `"Ask Scout to find moments..."`.
- Editor: `"Tell the editor what to change…"` → `"Refine your short-form video..."`.

## Scout — 13" MacBook fit pass, blue waveform, header simplified

- Screen changed: Scout only (`app/scout/page.tsx`); also `lib/mock.ts` for moment 1's title. Import/Editor/Export, routing, right chat panel, and visual style untouched.
- **Padding reduced** so the column fits in a 13" MacBook viewport without scroll:
  - Column outer `py-[60px]` → `pt-5 pb-4` (20 + 16 px).
  - Inter-section gaps tightened (name → preview 8 px, preview → track 12 px, track → scan 12 px, scan → filmstrip 8 px, filmstrip → bottom 16 px).
- **Preview made responsive**: `MomentPreview` capped at `max-w-[640px]` *and* `max-h-[50vh]` (was `max-w-[720px]`), so the video fits within the available vertical space on smaller screens while still scaling up on larger ones.
- **Annotated track waveform** rebuilt to look like a real wave:
  - Interpolated from the 15-ish source samples up to **80 dense bars** with deterministic jitter (sin/cos per index) — reads as wave packets, not a sparse bar chart.
  - Color **blue** at full opacity (`text-blue-500`) instead of the previous foreground/60 grey.
  - Layer-2 container height 80 → 64 px to give the preview a bit more room.
- **Moment heading** simplified: removed the "Now previewing" caption, single-line title now reads `Moment N · <title>` (e.g. "Moment 1 · Clutch 1v3 to close Round 14"). Moment 1's title updated in `lib/mock.ts` from "Clutch 1v3 to close out Round 14" to "Clutch 1v3 to close Round 14".
- **Preview pills cleaned up**: the bottom-right **game tag (VALORANT) removed**. The duration pill stays inside the preview at bottom-left.
- `SCOUT_VISUAL_SPEC.md` updated to reflect the new padding, preview sizing, waveform spec, and header format.

## Scout — track polish, additive scans, layout padding, visual spec

- Screen changed: Scout only (`app/scout/page.tsx`); Import/Editor/Export, routing, right chat panel, and visual style untouched.
- **Annotated track** — full rewrite to a calmer, lighter design:
  - Card spans **end-to-end** in the preview column (full content width, no `max-w` cap). Border only, **no shadow**.
  - **Layer 1 — video track header is now light** (`bg-muted/40`, bordered) with foreground-tinted icons + muted-foreground tick labels.
  - **Layer 2 — audio waveform** rebuilt Descript-style: vertical SVG `<line>` bars centered on the baseline (one per `audioWaveform` sample, 1.6 px round-capped stroke, non-scaling). Replaces the previous smooth polyline.
  - **Layer 3 — annotation pills** unchanged in style (⚡ Strong hook range, 💬 Chat spike, 😊 Creator reaction at exact timestamps).
  - **Playhead** now sits on the **outer card** with `inset-y-0` so it spans BOTH the timestamps header AND the waveform layer. It loops 0 → 1 over the moment's duration (matching the auto-looping `<video>` in MomentPreview); Play/Pause toggles the loop and Skip Back/Forward jump ±10%.
- **Preview column padding**: column gets `py-[60px]` (60 px top + 60 px bottom). All content rows use `px-[30px]`, which lines up with the filmstrip's content edge (`px-6` outer + inner `p-1.5` = 30 px). Fixes the Create-video / filmstrip right-edge misalignment.
- **Moment title is back** above the preview (small "Now previewing" caption + 16 px / 600 title, centered).
- **MomentPreview** max-width nudged 560 → 720 px so the video fills more of the now-larger preview area.
- **Scan header** shows just **`N moments found`** (no "Scan 1" prefix); the scan number is still tracked internally for restore.
- **Re-scans are additive**: a new scan **appends** 6 more moments to the filmstrip (mock: shuffled re-use of the same 6 base moments). AI reply becomes `Added 6 more moments. You now have N total.` Filmstrip key changed to `${m.id}-${pos}` so duplicate appends don't trip React's key check.
- **`SCOUT_VISUAL_SPEC.md`** added at the repo root — a visual + text hierarchy reference for every element on Scout (column widths, padding, text sizes, colors, indicator states).

## Scout — annotated moment track redesigned (Frame 3 layout)

- Screen changed: Scout only (`app/scout/page.tsx`). Import/Editor/Export, routing, right chat panel, and visual style untouched.
- Main-column order matched to Frame 3: **preview → annotated track → scan label + Create video → filmstrip**. The filmstrip now sits at the bottom of the column; the preview takes the remaining vertical space at the top.
- `MomentAnnotationTrack` redesigned into three stacked visual layers inside one bordered card:
  - **Layer 1 — Video track**: dark header strip with playback icons (Volume / Rewind / Play / Forward) on the left and an absolute-positioned time ruler (MM:SS ticks, ~5–7 visible) on the right.
  - **Layer 2 — Audio waveform**: a subtle SVG polyline drawn from `moment.audioWaveform`, occupying the bottom half of the waveform area.
  - **Layer 3 — AI annotations**: amber-pill labels with emoji + text pinned to exact timestamps — ⚡ Strong hook (range 0 → `min(3s, 25% of duration)`, with a faint amber range highlight behind it), 💬 Chat spike (peak of `chatVelocity`), 😊 Creator reaction (peak of `audioWaveform`). Minimum spacing keeps the pills from overlapping.
  - Across both lower layers: a red playhead line + diamond cap, parked near the chat-spike marker, so the relationship between scrub position and AI markers reads at a glance.
- Mock state only; no new libraries. Lucide icons added: `Volume2`, `SkipBack`, `SkipForward`. Removed unused `MessageSquare`, `Smile` imports.

## Scout — annotated moment track; Why-this-moment panel removed

- Screen changed: Scout only (`app/scout/page.tsx`). Import/Editor/Export, routing, and visual style untouched.
- Added a new `MomentAnnotationTrack` directly under the selected moment preview. It represents *only* the selected moment's own duration (not the full assembly timeline) and shows three AI-found markers:
  - **Strong hook** — range stripe from 0s to `min(3s, 25% of duration)`, indigo.
  - **Chat spike** — point dot at the peak of `moment.chatVelocity`, amber.
  - **Creator reaction** — point dot at the peak of `moment.audioWaveform`, emerald.
- Each marker carries a small icon + short label above the track (Sparkles / MessageSquare / Smile). A start/end time ruler sits below. Mock data only — point timings are derived from the existing per-moment signal arrays, so the markers shift naturally as the active moment changes; minimum visual gaps keep the labels from overlapping.
- Removed the right-hand "Why this moment?" panel (header + signal chips + Chat-spike/Reaction/RiseCurve cards). The preview column now spans the full working-area width. Routing and behavior elsewhere unchanged.
- Helpers no longer rendered (`statsFor`, `WhyCard`, `SpikeBars`, `ReactionMeter`, `RiseCurve`, `useMounted`) remain in the file as dormant code so the panel can be restored later without rebuilding it.

## Scout — removed assembly timeline; Create video moved to preview header

- Screen changed: Scout only (`app/scout/page.tsx`). Import/Editor/Export, routing, and visual style untouched.
- Removed the bottom assembly timeline area entirely from Scout: the "Your video · N moments" header, the empty dashed timeline box, the "No moments yet — add moments…" empty state, and the bottom-bar Create video CTA tied to that timeline (the `PhaseContextPanel` block in `ScoutWorkspace`). `PhaseContextPanel` and `MomentTimeline` are still defined/imported in this file because Editor uses them — only Scout's instance was removed.
- Relocated the "Create video" button to the top-right of the main preview section, on the same row as the scan label ("Scan N · 6 moments found"). Still gated on `timelineMoments.length > 0`, still routes to Editor via the existing `onCreateVideo` handler.
- Mock state unchanged — `selectedIds` / `addMoment` / `removeMoment` still drive the filmstrip "+" affordance, so users can add/remove moments from the strip; the green-check thumbnail state still shows what's added.
- Rationale: Scout focuses on reviewing AI-found moments; the full video assembly timeline belongs in Editor.

## LeftRail — phase icons restored inside step nodes

- Component changed: `components/LeftRail.tsx` only.
- Brought back the phase-specific icons (Compass / SquarePen / Share2) inside the indicator circles. All three indicator states keep their styling — only the inner glyph changed:
  - **Completed** — outlined indigo circle with the phase icon in indigo.
  - **Current** — filled indigo circle with the phase icon in white, soft indigo ring.
  - **Upcoming** — outlined muted circle with the phase icon muted; button still `disabled`.
- Circle size nudged 20 → 28 px to seat a 14 px icon comfortably. Connector line, even-distribution layout, and optional `errors` prop unchanged.
- The check icon used previously for "completed" is replaced by the phase icon — circle styling alone now communicates state, while the icon communicates which phase it is.

## Scout — chat panel moved to the right

- Screen changed: Scout only (`app/scout/page.tsx`).
- The "Scout moments" chat aside (header + chat thread + refinement chips + composer + "Find new moments" CTA) now sits on the right side of the Scout workspace; preview, "Why this moment?", and the bottom timeline have shifted left to fill the freed space.
- The aside's separator border flipped from `border-r` → `border-l` to match its new edge.
- JSX is physically reordered (not CSS `order`) so DOM/tab order matches the visual flow.
- Routing, LeftRail, preview/filmstrip, "Why this moment?", timeline, and all chat-thread behavior (chips, restore-previous-scan, loading state, re-rank) are unchanged.

## LeftRail — ordered vertical workflow stepper

- Component changed: `components/LeftRail.tsx` only (no page-level edits; routing logic unchanged — `onChange` still drives phase transitions for non-upcoming steps).
- Restructured into an ordered vertical stepper for Scout → Editor → Export with three indicator states:
  - **Completed** — outlined indigo circle with a check icon. Clickable, so the user can step back.
  - **Current** — solid indigo circle (accent), no inner glyph, soft indigo ring.
  - **Upcoming** — outlined muted circle, no inner glyph. Button is `disabled` so clicks don't fire `onChange` (keeps the guided flow).
- Connector: a thin vertical line lives in a flex-grow segment between adjacent step rows. With the `ol` set to `flex-1`, the steps distribute evenly across the full sidebar height and adapt to viewport changes.
- Removed (per spec): padlock icons, "Current"/"Locked" captions, numbered circles, and the phase-specific icons (Compass/SquarePen/Share2). The circle indicator alone communicates state.
- Layout per step kept: indicator above the label (Scout / Editor / Export). Width 72 → 96 px.
- New optional `errors?: Partial<Record<Phase, string>>` prop. When a step has an entry, a small warning (AlertTriangle + short message) renders below its label. Nothing is reserved or rendered when there's no error — layout adapts naturally.

## Checkpoint — Scout baseline before workflow stepper

- Saved current Scout baseline before adding guided workflow navigation.

## Import — "Post to" platform dropdown

- Screen changed: Import only (Scout/Editor/Export/routing untouched).
- Replaced the floating platform pill row with a multi-select dropdown (shadcn Popover): label "Post to", options TikTok / Reels / Shorts, selected ones shown as indigo chips inside the trigger with checkmarks in the list. Default selected: TikTok.
- Helper copy: "AI will optimize crop, captions, and export settings for selected platforms."
- Header: reverted to the original "SoftLaunch" wordmark (rocket + semibold). Maya's avatar now renders `/assets/maya.png` (object-cover), falling back to the indigo "M" if the image is missing — drop a `maya.png` into `public/assets` to show it.
- No new libraries; reuses the existing Popover/Button/Badge primitives.

## Editor — B-roll timeline + Captions tool

- Screen changed: Editor only (Scout reuses the shared `MomentTimeline` with its defaults, so Scout/Import/Export are untouched).
- Editor timeline now has only two rows: **Moments** and **Captions** (Crop/Pacing dropped via a new `editTracks` prop, default still Captions/Crop/Pacing for Scout).
- B-roll no longer has its own track — added B-roll (Library / Generate / Upload) now splices into the **Moments** row right after the active moment, styled like a video/GIF segment (blue gradient, film icon, "GIF" tag, removable). Insert plays a quick fade/slide-in, a brief blue highlight ring (~1.4s), and a small "B-roll added" toast (~1.8s).
- Tools grid changed from 3 to 2 columns (larger cards); "Caption style" tool renamed to **Captions**.
- Captions drill-in is now a visual preset grid (6 styles: Bold yellow, White box, Minimal white, Red impact, Blue highlight, Meme style) — each card previews the style with sample text; selecting marks it; **Apply captions** CTA updates the timeline Captions row color/label and adds a version card.
- Mock state only; no new libraries.

## Editor tool drill-ins

- Editor right panel only (Tools/History tabs kept). Each tool still opens an in-panel drill-in with a back button; applying any option adds a version card (Preview + Rollback).
- Hook text → AI generation flow: prompt ("Describe the hook you want…") + "Generate hook" → 3 mock hook options, each with "Apply"; applying adds "Hook updated".
- Layout → visual preset grid (mini portrait diagrams): Facecam top/gameplay bottom, Gameplay full screen, Split view, Facecam large, Reaction-first, Center crop, with an "Apply to all" checkbox; applying adds "Layout changed".
- B-roll → existing Library / Generate with AI / Upload flow (adds a timeline B-roll block + "B-roll added" card); other tools (Caption/Crop/Pacing/Dead air) keep the simple options list.
- Mock state only; shared addVersion helper; no new libraries.

## Scout re-scan behavior

- Screen changed: Scout only (re-scan flow); no full reload — all client/mock state.
- "Find new moments" now: adds the user prompt as a chat bubble, shows an AI loading bubble ("Scanning for new moments…"), and skeletons only the filmstrip + preview + "Why this moment?" (timeline stays visible).
- After ~1.5s it swaps in a fresh set of 6 mocked moments (replaces the strip, never appends) and resets the active moment.
- Adds a "Scan N: <intent>" label above the filmstrip (e.g. "Scan 2: More creator reaction").
- AI reply becomes "I found 6 new moments based on that." with a "View previous scan" action that restores the prior scan's 6 moments + label.
- Mock note: a "scan" is a re-ranked ordering of the existing 6 moments (no new mock data added); each re-scan stores the previous scan for restore.

## Editor — persistent chat + tools + version history

- Screen changed: Editor only (Import/Scout/Export, routing untouched).
- Left panel is now a chat-style command thread (mirrors Scout): opens with a context bubble continuing from Scout ("I stitched N moments…"), follow-up turns append; sticky composer with chips (Make hook faster / Add punchier captions / Tighten pacing / Reframe for Shorts), placeholder "Tell Coach what to change…", CTA "Edit video", no in-field send icon. Submit adds a user + AI bubble.
- Right panel brought back the Editor tool list (Hook text, Caption style, Crop focus, Layout, Pacing, Dead air removed, B-roll) as label-only rows with a drill-in inspector (click a row → options + back button, same panel).
- Applying a tool option pushes a Version history card; history sits below the tools in the right panel as compact cards (name, time, description, Preview, Rollback), newest on top.
- Center keeps the portrait preview; timeline stays wide/full-width below — unchanged. Mock state only; reuses the shared ChatBubble; no new libraries.

## Editor clarification

- Screen changed: Editor only (Import/Scout/Export, routing, visual style untouched).
- Editor now mirrors Scout's structure (left panel + working area with a two-column row + a wide timeline below) so the timeline spans the full workspace width like Scout's — no longer boxed into the center column.
- Center keeps the portrait short-form video created in Scout (controls inside the surface); no landscape, no filmstrip, no thumbnails added.
- Timeline is the same wide format and shows the stitched moments + edit tracks (Moments / Captions / Crop / Pacing); it represents the created video being edited.
- Left panel matches Scout's spacing: header "Tell Coach what to change", prompt chips, textarea ("Tell Coach what to change…"), and a primary "Edit video" CTA below — removed the in-field send icon and the chat thread.
- Right panel ("AI edit stack") sits in the same right-column area Scout used for "Why this moment?", listing applied edits/version history with Preview edit + Undo.
- Mock state only; no new libraries.

## Editor layout update

- Screen changed: Editor only (Import/Scout/Export, routing, visual style untouched).
- Three-panel layout: left = conversational command panel, center = reel preview + timeline, right = AI edit stack / version history.
- Left panel now a chat/prompt pattern ("Tell Coach what to change") with mocked thread + suggestion chips (Make the hook faster, Add punchier captions, Tighten pacing, Reframe for Shorts); removed the old decision list/inspector and the quote card.
- Center preview: removed the "Hook · live" quote widget and the external transport/play row; play, scrubber, and fullscreen now live inside the video surface. Preview stays the focus.
- Timeline kept in Editor, below the preview — it's the stitched reel from Scout (same MomentTimeline blocks/tracks), shared selection state.
- Right panel = "AI edit stack" listing applied edits (Captions added, Hook trimmed, Crop adjusted, Pacing tightened) with Undo + Preview edit; sending a command pushes a new edit on top.
- Mock state only; no new libraries. Removed now-unused mock imports (aiDecisions/coachThread/coachSuggestions) and icons.

## Scout structure update (Stitch merged in)

- Flow is now Import → Scout → Editor → Export; removed Stitch as a separate nav item/screen (deleted from LeftRail + the StitchWorkspace).
- Scout is the combined discovery + assembly screen: left = intent controls, main top = moment filmstrip, main center = selected moment preview, right = "Why this moment?", bottom = selected-moments timeline.
- Moved the moment filmstrip to the top of the main area (above the preview); each thumbnail now shows moment number, duration, and a plus/add affordance, with a clear active state. No carousel cards.
- The selected-moments timeline (from Stitch) now lives at the bottom of Scout. It starts empty; the thumbnail plus adds a moment, timeline blocks (and the thumbnail toggle) remove it. Lightweight mock state.
- Adding moved off a below-preview button onto the filmstrip plus affordance ("Add moment" / "Added to timeline").
- Main CTA is "Create video" (in the bottom timeline bar), disabled until ≥1 moment is added; it routes to Editor.
- Import keeps its full intent controls; Editor/Export untouched. No new libraries, no visual polish, no portrait crop overlay.

## Scout visual refinement

- Screen changed: Scout only (Import/Editor/Export, routing, visual style untouched; no new libraries).
- "Why this moment?" cards now fill the full panel height (equal flex), with larger visuals: a bigger animated chat-spike bar chart, a new **reaction signal meter** (Facecam / Voice / Chat rows), and a cleaner retention curve — all with a smooth load-in animation (staggered grow / line draw).
- Added a **Video quality** signal chip (Good / OK / Low) to the chip row.
- Preview hierarchy reordered: **moment name → large preview → "N of 6" count → thumbnail filmstrip → "Add this moment" CTA**.
- "Find new moments" moved directly below the intent prompt; clicking it runs a mocked ~1.5s re-rank that shows skeleton loaders in the preview + Why-this-moment area, then reveals a reshuffled set of moments.
- Removed remaining judgment chips from the preview area (rank/"Best match"); all judgment now lives in the right panel.
- Copy uses "moment" throughout Scout (not "clip").

## Import intent → compact "ask" widget

- Screen changed: Import only (Scout's intent widget unchanged).
- What changed: the intent + options now live in one compact card with three rows — row 1 settings (Moments stepper, Video duration dropdown, Platform chips, inline), row 2 prompt chips, row 3 the text field with the Enhance (Sparkles) action inside it. Removed the stacked full-width rows + the "Intent" heading.
- UX reason: matches the requested "ask widget" pattern — settings, prompt presets, and free-form prompt grouped tightly so the whole intent step reads as one control.
- Implementation note: made MomentOptions controls inline/compact (added optional `label` to VideoDurationSelect); added `showHeading` to the shared `IntentField` (Import hides it, Scout keeps it). Still disabled/dimmed until a recording or URL is added.

## Intent moved to Import; Scout left panel slimmed

- Screens changed: Import and Scout (Editor/Export, routing, and visual style untouched).
- What changed (Import): added the Intent widget (chips + text field + Enhance icon), plus Number of moments, Video duration, and Platform (TikTok/Reels/Shorts, multi-select). These sit between the upload box and the Find button; Recent recordings moved to the bottom. The whole intent/options group is disabled (dimmed) until a recording is selected or a URL is pasted.
- What changed (Scout): the left panel is now Intent-only — removed Number of moments, Moment duration, and Video duration.
- What changed (handoff): the intent chosen on Import (selected chip + prompt) flows into Scout's intent field via `sessionStorage` (key `scout:intent`), read once on mount.
- UX reason: lets creators set what they're looking for *before* the scan and carry it into Scout, while keeping Scout focused on reviewing/assembling moments.
- Implementation note: extracted shared `IntentField` (used by Import + Scout) and `MomentOptions` (FieldLabel, NumberStepper, VideoDurationSelect, PlatformSelect); removed the now-dead row components from Scout; lightweight local React state only; no new libraries. Labels kept ("Find best moments", "Recent recordings").
- Open item: the Import→Scout loading skeleton still mocks the old multi-row left panel; left as-is (out of scope) and can be trimmed to match the Intent-only panel later.

## Scout layout update

- Restructured Scout into: left controls panel · 65% moment-preview column (hero) · 35% "Why this moment?" column · bottom source timeline. Only the Scout screen changed; Import/Editor/Export, routing, and visual style are untouched.
- Moved the "Why this moment?" rationale cards from the bottom into the right column, stacked vertically and made compact; kept the existing mini visualizations (chat/audio/viewer sparklines).
- Replaced the bottom area with a visual-only "Source timeline" ("AI-marked moments from the original stream."): time ruler with start/end labels, clickable AI moment markers (selected emphasized, others smaller), and a playhead at the selected moment. Mock data only — marker positions derive from each moment's start time vs. the total stream duration.
- Intent widget: removed the visible "Enhance prompt" button; the action is now a Sparkles icon button inside the prompt textarea (bottom-right) with an "Enhance prompt" tooltip. Default state keeps no chip selected and placeholder "e.g., funny moment with a big chat spike"; the textarea only auto-fills after an intent chip is clicked. The panel's single primary CTA remains "Find new moments".
- Fit: kept the preview as the visual hero, used the existing carousel height clamp, and kept the timeline short (compact track + reduced panel padding) so the screen fits a 13" MacBook Pro.
- Reused existing shadcn/Tailwind + lucide-react components (Tooltip, Popover, Textarea, Button, Separator, Sparkline); no new libraries.

## Scout interaction model update

- Screen changed: Scout only (Import/Editor/Export, routing, and visual style untouched; no color polish).
- What changed: renamed clip→moment ("Number of moments", "Moment duration", "Add moment"); moved the Duration/Chat spike/Energy/Hook strength signal chips into the right "Why this moment?" panel above the rationale cards; removed the "PICKED" badge and stats from under the preview.
- What changed (timeline): the bottom bar is now the *draft short-form video* — selected moments render as proportional segments (default 3 of 6 pre-selected) with left/right trim handles, a remove (X), a time ruler, and a playhead; below them are mock edit-layer tracks (Captions / Crop / Pacing). Removed the "Source timeline" title and helper copy.
- What changed (left panel): "Moment duration" and "Video duration" helper text moved into inline info-icon tooltips ("Length of each moment Scout pulls from your stream." / "Final short-form video length after selected moments are assembled.").
- UX reason: clarifies the Scout model — AI generates many moments, the user assembles a few into a draft video and can add/remove/lightly trim before Editor — and declutters the preview so it stays the hero.
- Implementation note: lightweight React state in ScoutWorkspace (`selectedIds: string[]`, default first 3) drives both the center Add/Added+Remove CTA and the timeline; new `MomentTimeline` + `FieldLabel` helpers; trim handles and edit tracks are visual/mock only; reused existing components, no new libraries.
