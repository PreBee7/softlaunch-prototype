export type EvidenceKind =
  | "chat"
  | "audio"
  | "donation"
  | "reaction"
  | "quote"
  | "deadair"
  | "gameplay"
  | "retention";

export type Evidence = {
  kind: EvidenceKind;
  label: string;
  value?: string;
};

export type Moment = {
  id: string;
  title: string;
  game: string;
  start: string;
  end: string;
  duration: string;
  confidence: number;
  evidence: Evidence[];
  reasoning: string;
  /** Short creator-facing reason shown under each thumbnail. */
  whyChosen?: string;
  /** AI-suggested portrait crop position within the landscape stream. */
  crop?: "left" | "center" | "right";
  // small data series for the detail panel
  chatVelocity: number[];
  audioWaveform: number[];
  viewerDelta: number[];
  /** Optional playing video to use in carousel / editor / export previews. */
  videoUrl?: string;
};

export const streamer = {
  name: "Maya",
  handle: "BagginsTV",
  platform: "Twitch",
};

export const stream = {
  title: "Late night ranked grind \u{1F3AF}",
  duration: "2h 47m 12s",
  recordedAt: "2 hours ago",
  primaryGame: "Valorant",
  peakViewers: 1284,
  averageViewers: 942,
};

export type RecentRecording = {
  id: string;
  title: string;
  duration: string;
  recordedAt: string;
  game: string;
  /** Optional video thumbnail — autoplays muted in the import card. */
  videoUrl?: string;
  /** Optional image thumbnail — falls back to a tinted gradient if neither is set. */
  thumbnail?: string;
};

// Wireframe mode — hide real videos/screenshots until final assets are
// provided. Flip to false (or replace media() calls) to show real media.
const HIDE_MEDIA = true;
const media = (path: string): string | undefined =>
  HIDE_MEDIA ? undefined : path;

// Recent recordings use real thumbnails (GameStream, SS1, SS4, SS2) — shown
// regardless of HIDE_MEDIA so the import gallery isn't a wireframe placeholder.
export const recentRecordings: RecentRecording[] = [
  {
    id: "r1",
    title: "Late night ranked grind \u{1F3AF}",
    duration: "2h 47m",
    recordedAt: "Today, 2:14 AM",
    game: "Valorant",
    videoUrl: "/assets/GameStream.mov",
  },
  {
    id: "r2",
    title: "First time playing Helldivers 2",
    duration: "3h 12m",
    recordedAt: "Yesterday, 9:30 PM",
    game: "Helldivers 2",
    thumbnail: "/assets/SS1.png",
  },
  {
    id: "r3",
    title: "Just Chatting + new chair reveal",
    duration: "1h 48m",
    recordedAt: "Mar 12, 8:02 PM",
    game: "Just Chatting",
    thumbnail: "/assets/SS4.png",
  },
  {
    id: "r4",
    title: "Apex with the squad",
    duration: "2h 23m",
    recordedAt: "Mar 10, 10:45 PM",
    game: "Apex Legends",
    thumbnail: "/assets/SS2.png",
  },
];

// Recent short-form videos the creator has made in SoftLaunch (portrait
// reels/shorts/tiktoks). Shown on the Import screen so creators can reopen,
// duplicate, or just see what they've shipped recently.
export type RecentVideoStatus = "draft" | "scheduled" | "published";
export type RecentVideoPlatform = "TikTok" | "Reels" | "Shorts";
export type RecentVideo = {
  id: string;
  title: string;
  duration: string;            // "0:24"
  createdAt: string;           // human-readable: "Today", "2 days ago"
  platforms: RecentVideoPlatform[];
  status: RecentVideoStatus;   // affects the status pill on the card
  videoUrl?: string;           // when omitted, falls back to a gradient tile
};

export const recentVideos: RecentVideo[] = [
  {
    id: "v1",
    title: "Clutch 1v3 to close Round 14",
    duration: "0:18",
    createdAt: "Today",
    platforms: ["TikTok", "Reels", "Shorts"],
    status: "published",
    videoUrl: "/assets/Short.mov",
  },
  {
    id: "v2",
    title: "Most unhinged superchat reaction",
    duration: "0:34",
    createdAt: "Yesterday",
    platforms: ["TikTok", "Reels"],
    status: "published",
    videoUrl: "/assets/Short2.mov",
  },
  {
    id: "v3",
    title: "100m snipe across Storm Point",
    duration: "0:22",
    createdAt: "3 days ago",
    platforms: ["TikTok", "Shorts"],
    status: "scheduled",
    videoUrl: "/assets/Short3.mov",
  },
  {
    id: "v4",
    title: "Game crashes mid-tournament",
    duration: "0:27",
    createdAt: "Last week",
    platforms: ["TikTok"],
    status: "draft",
  },
];

export const intentPresets = [
  "Funny moments",
  "High-energy reactions",
  "Chat spikes",
  "Clutch plays",
  "Strong hooks",
  "Under 30 seconds",
] as const;

// Clicking an intent chip auto-populates the prompt with a plain,
// creator-facing sentence. "Enhance prompt" (promptEnhancements below)
// then expands it into a richer AI instruction.
export const intentPrompts: Record<string, string> = {
  "Funny moments":
    "Find funny moments with strong creator reaction and chat response.",
  "High-energy reactions":
    "Find high-energy moments where the creator's reaction really lands.",
  "Chat spikes":
    "Find moments where chat suddenly spikes above its normal pace.",
  "Clutch plays":
    "Find clutch gameplay moments with a clear reaction in the same beat.",
  "Strong hooks":
    "Find moments with a strong first 3 seconds that work as a hook.",
  "Under 30 seconds":
    "Find short, self-contained moments that land in under 30 seconds.",
};

// Mock "Enhance prompt" — a creator-facing intent expands into a clearer
// AI instruction. Keyed by the chip label.
export const promptEnhancements: Record<string, string> = {
  "Funny moments":
    "Find funny moments with strong creator reaction, chat response, and a clear first 3-second hook.",
  "High-energy reactions":
    "Find high-energy moments where the creator's reaction lands in the first 2 seconds, with chat amplifying the beat.",
  "Chat spikes":
    "Find moments where chat velocity jumped 3x or more above baseline within a 10-second window.",
  "Clutch plays":
    "Find gameplay clutch moments with a kill feed event and a clear vocal reaction in the same 10-second window.",
  "Strong hooks":
    "Find moments where the first 3 seconds work as a standalone hook — a strong quote, reaction, or visual.",
  "Under 30 seconds":
    "Find self-contained moments under 30 seconds with no setup needed and a clear payoff in the first 5 seconds.",
};

export const moments: Moment[] = [
  {
    id: "m1",
    title: "Clutch 1v3 to close Round 14",
    whyChosen: "Facecam and voice reaction are visible at the same time.",
    crop: "center",
    game: "Valorant",
    start: "1:47:22",
    end: "1:47:40",
    duration: "0:18",
    confidence: 94,
    evidence: [
      { kind: "chat", label: "Chat spike", value: "4.2x" },
      { kind: "audio", label: "Audio peak" },
      { kind: "donation", label: "Donation", value: "$47" },
    ],
    reasoning:
      "Chat velocity jumped from 38 to 161 msgs/min in the 6 seconds around the third kill. Audio peaks above -3 dB twice in 4s — Maya's reaction is louder than gameplay. A $47 donation lands inside the window with the note “that was insane.” Viewer count gained +84 in the 30s after.",
    chatVelocity: [12, 14, 18, 22, 30, 38, 62, 110, 161, 134, 88, 54, 40, 32, 28],
    audioWaveform: [0.18, 0.22, 0.3, 0.42, 0.55, 0.78, 0.92, 0.88, 0.71, 0.6, 0.48, 0.36, 0.28, 0.22, 0.18],
    viewerDelta: [942, 944, 948, 955, 970, 988, 1004, 1018, 1026, 1030, 1028, 1024, 1022, 1020, 1018],
    videoUrl: "/assets/LandscapeStream11.mov",
  },
  {
    id: "m2",
    title: "Reading the most unhinged superchat",
    whyChosen: "A strong quoted line with chat reacting instantly.",
    crop: "left",
    game: "Just Chatting",
    start: "0:34:15",
    end: "0:34:48",
    duration: "0:33",
    confidence: 87,
    evidence: [
      { kind: "chat", label: "Chat spike", value: "3.1x" },
      { kind: "quote", label: "Strong quote", value: "“I cannot read this on stream”" },
      { kind: "reaction", label: "Reaction" },
    ],
    reasoning:
      "Strong quoted line lands in the first 4s. Chat reacts immediately — 161 emote-heavy messages in 15s. Reaction is sustained, not a one-beat moment, which reads well at 30s on TikTok.",
    chatVelocity: [20, 24, 32, 58, 92, 124, 161, 158, 142, 118, 88, 64, 48, 36, 28],
    audioWaveform: [0.3, 0.38, 0.46, 0.52, 0.58, 0.62, 0.55, 0.5, 0.48, 0.46, 0.42, 0.38, 0.32, 0.28, 0.24],
    viewerDelta: [820, 824, 830, 838, 848, 860, 872, 880, 884, 886, 884, 880, 876, 872, 868],
    videoUrl: "/assets/LandscapeStream22.mov",
  },
  {
    id: "m3",
    title: "100m snipe across Storm Point",
    whyChosen: "Tight clip — the call and the kill hit in the first 3 seconds.",
    crop: "right",
    game: "Apex Legends",
    start: "2:12:08",
    end: "2:12:22",
    duration: "0:14",
    confidence: 82,
    evidence: [
      { kind: "gameplay", label: "Gameplay event" },
      { kind: "audio", label: "Audio peak" },
      { kind: "deadair", label: "Low dead air" },
    ],
    reasoning:
      "Tight 14s window with no dead air. Kill feed event registered + Maya's call (“no way no way no way”) lands in the first 3s. Clean visual — no menus, no scoreboard. Naturally short-form length.",
    chatVelocity: [28, 30, 34, 42, 58, 84, 118, 124, 102, 78, 56, 42, 34, 30, 28],
    audioWaveform: [0.22, 0.28, 0.34, 0.52, 0.78, 0.86, 0.72, 0.58, 0.46, 0.38, 0.32, 0.28, 0.24, 0.22, 0.2],
    viewerDelta: [1102, 1108, 1116, 1126, 1142, 1158, 1170, 1178, 1184, 1186, 1184, 1180, 1178, 1176, 1174],
    videoUrl: "/assets/LandscapeStream33.mov",
  },
  {
    id: "m4",
    title: "Game crashes mid-tournament — reaction",
    whyChosen: "A big, relatable reaction the moment it goes wrong.",
    crop: "center",
    game: "Valorant",
    start: "0:58:47",
    end: "0:59:09",
    duration: "0:22",
    confidence: 76,
    evidence: [
      { kind: "audio", label: "Audio peak" },
      { kind: "reaction", label: "Reaction" },
      { kind: "chat", label: "Chat spike", value: "2.8x" },
    ],
    reasoning:
      "Strong emotional beat — useful as relatable content. Note: contains 2 short clips of profanity. Coach will flag this for review before export.",
    chatVelocity: [42, 48, 56, 72, 98, 124, 138, 128, 108, 88, 70, 56, 48, 44, 42],
    audioWaveform: [0.28, 0.34, 0.42, 0.58, 0.72, 0.84, 0.76, 0.62, 0.5, 0.42, 0.36, 0.32, 0.28, 0.26, 0.24],
    viewerDelta: [882, 884, 886, 888, 890, 892, 894, 894, 892, 890, 888, 886, 884, 882, 880],
    videoUrl: media("/assets/Short3.mov"),
  },
  {
    id: "m5",
    title: "Explaining the new agent meta in 90s",
    whyChosen: "The opening line works on its own as a hook.",
    crop: "left",
    game: "Valorant",
    start: "1:23:51",
    end: "1:25:22",
    duration: "1:31",
    confidence: 71,
    evidence: [
      { kind: "quote", label: "Strong quote", value: "“you’re sleeping on Iso”" },
      { kind: "deadair", label: "Low dead air" },
      { kind: "retention", label: "Retention hold" },
    ],
    reasoning:
      "Longer than ideal at 1:31. Coach can tighten to 0:45 by removing two filler gaps (4.2s combined) and a tangent at 1:24:38. Strong opening line works as the hook.",
    chatVelocity: [38, 40, 42, 46, 52, 58, 64, 68, 70, 72, 70, 66, 62, 58, 54],
    audioWaveform: [0.32, 0.36, 0.38, 0.4, 0.42, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28, 0.26],
    viewerDelta: [1018, 1020, 1022, 1024, 1024, 1024, 1022, 1020, 1018, 1014, 1010, 1006, 1002, 998, 994],
    videoUrl: media("/assets/Short2.mov"),
  },
  {
    id: "m6",
    title: "Surprise raid lands mid-rant",
    whyChosen: "Chat spikes hard the moment the raid lands.",
    crop: "right",
    game: "Just Chatting",
    start: "2:35:09",
    end: "2:35:31",
    duration: "0:22",
    confidence: 68,
    evidence: [
      { kind: "chat", label: "Chat spike", value: "5.6x" },
      { kind: "donation", label: "Donation", value: "$28" },
      { kind: "quote", label: "Quote", value: "“wait what”" },
    ],
    reasoning:
      "Context-dependent — the raid only reads if viewers know who Pokimane is. Stronger as the closing beat of a recap montage than a standalone short.",
    chatVelocity: [22, 28, 38, 62, 98, 148, 192, 184, 152, 118, 88, 64, 48, 38, 32],
    audioWaveform: [0.24, 0.3, 0.38, 0.46, 0.52, 0.58, 0.54, 0.5, 0.46, 0.42, 0.38, 0.34, 0.3, 0.28, 0.26],
    viewerDelta: [758, 770, 788, 812, 842, 878, 912, 938, 952, 958, 956, 952, 948, 944, 940],
    videoUrl: media("/assets/Short3.mov"),
  },
];

export const aiDecisions = [
  {
    id: "d1",
    kind: "hook",
    label: "Hook text",
    value: "“watch this clutch play”",
    rationale:
      "Pulled from Maya’s actual line at 1:47:24. Stronger than a generated hook — her voice over her own words.",
  },
  {
    id: "d2",
    kind: "caption",
    label: "Caption style",
    value: "Bold yellow, centered, 2 lines max",
    rationale:
      "Matches the top 3 Valorant short-form accounts. Yellow tested 28% higher engagement vs white on TikTok in last 7 days.",
  },
  {
    id: "d3",
    kind: "crop",
    label: "Crop focus",
    value: "Face focus, falls back to gameplay on kill feed",
    rationale:
      "Maya’s face is the primary subject in 11 of 18 seconds. Auto-switches to gameplay HUD at 1:47:31 to keep the third kill visible.",
  },
  {
    id: "d7",
    kind: "layout",
    label: "Layout",
    value: "Webcam top · gameplay below",
    rationale:
      "Standard short-form split. Face holds the top 40% so reactions read; the kill feed sits in the lower 60% where the clutch action lives.",
  },
  {
    id: "d4",
    kind: "pacing",
    label: "Pacing",
    value: "1.0x — no time stretch",
    rationale:
      "Moment is already 18s. Time stretching would degrade audio reactions — they’re the key signal.",
  },
  {
    id: "d5",
    kind: "deadair",
    label: "Dead air removed",
    value: "-4.2s across 3 cuts",
    rationale:
      "Two breath gaps and one menu transition removed. All cuts are on word boundaries — no clipped syllables.",
  },
  {
    id: "d6",
    kind: "broll",
    label: "B-roll",
    value: "Kill feed cutaway at 0:08",
    rationale:
      "Short cutaway of the kill feed plays during Maya’s reaction so viewers see both at once. Cuts back to face on the third kill.",
  },
];

export const coachThread = [
  {
    id: "t1",
    user: "make the hook punchier",
    aiSummary: "Rewrote hook from “watch this clutch play” to “1v3 with 4 seconds left.”",
    elapsed: "2 min ago",
  },
  {
    id: "t2",
    user: "shorten the intro",
    aiSummary: "Trimmed 1.8s from the lead-in — caption now lands at 0.4s.",
    elapsed: "1 min ago",
  },
];

export const coachSuggestions = [
  "Shorten intro",
  "Punchier hook",
  "Less zoom",
  "Keep gameplay visible",
  "Move captions up",
];

export const platformChecks = [
  {
    platform: "TikTok",
    summary: "Ready",
    severity: "ok" as const,
    items: [
      { label: "Aspect ratio 9:16", status: "ok" as const, detail: "1080 × 1920" },
      { label: "Caption length", status: "ok" as const, detail: "Avg 3.2 words / line" },
      { label: "Hook in first 3s", status: "ok" as const, detail: "Hook lands at 0:00.4" },
      { label: "Duration", status: "ok" as const, detail: "0:18 — within 15–60s sweet spot" },
      { label: "Safe crop zones", status: "ok" as const, detail: "No caption inside top 14% / bottom 22%" },
    ],
  },
  {
    platform: "Reels",
    summary: "1 warning",
    severity: "warn" as const,
    items: [
      { label: "Aspect ratio 9:16", status: "ok" as const, detail: "1080 × 1920" },
      { label: "Caption length", status: "ok" as const, detail: "Avg 3.2 words / line" },
      { label: "Hook in first 3s", status: "ok" as const, detail: "Hook lands at 0:00.4" },
      { label: "Duration", status: "warn" as const, detail: "0:18 — Reels favors 30–90s for reach" },
      { label: "Safe crop zones", status: "ok" as const, detail: "Clears Reels overlay area" },
    ],
  },
  {
    platform: "Shorts",
    summary: "Ready",
    severity: "ok" as const,
    items: [
      { label: "Aspect ratio 9:16", status: "ok" as const, detail: "1080 × 1920" },
      { label: "Caption length", status: "ok" as const, detail: "Avg 3.2 words / line" },
      { label: "Hook in first 3s", status: "ok" as const, detail: "Hook lands at 0:00.4" },
      { label: "Duration", status: "ok" as const, detail: "0:18 — under the 60s Shorts cap" },
      { label: "Safe crop zones", status: "ok" as const, detail: "No caption inside YouTube safe area" },
    ],
  },
];

export const emptyStateFallbacks = [
  {
    id: "f1",
    title: "Build a recap montage",
    description:
      "Stitch the 4 highest-energy beats into a 45s recap. Best when no single moment carries on its own.",
    detail: "4 beats • ~45s",
  },
  {
    id: "f2",
    title: "Quote-based short",
    description:
      "Pull the strongest line of the stream and pair it with the matching reaction shot.",
    detail: "1 quote • ~20s",
  },
  {
    id: "f3",
    title: "Best-of compilation",
    description:
      "Take the top 6 medium-confidence moments and chain them with quick cuts.",
    detail: "6 beats • ~60s",
  },
];
