# Design Notes

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
