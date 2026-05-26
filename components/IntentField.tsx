"use client";

import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { intentPresets, intentPrompts, promptEnhancements } from "@/lib/mock";
import { cn } from "@/lib/utils";

// Mock "Enhance prompt" — turns the current intent into a clearer AI
// instruction. Prefers the rich enhancement for a selected chip, otherwise
// enhances whatever free-form text the user typed.
function enhancePrompt(selectedIntent: string | null, prompt: string): string {
  if (selectedIntent && promptEnhancements[selectedIntent]) {
    return promptEnhancements[selectedIntent];
  }
  const trimmed = prompt.trim();
  if (promptEnhancements[trimmed]) return promptEnhancements[trimmed];
  return `Find ${trimmed.toLowerCase()} with strong creator reaction, chat response, and a clear first 3-second hook.`;
}

type Props = {
  selectedIntent: string | null;
  /** Marks a chip as selected. The component also fills the prompt on click. */
  onSelectIntent: (label: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  disabled?: boolean;
  /** Show the "Intent" heading (Scout). Hidden inside the compact Import widget. */
  showHeading?: boolean;
};

/**
 * Intent widget shared by Import and Scout: preset chips that fill the prompt,
 * a free-form textarea, and an "Enhance prompt" icon button (Sparkles) inside
 * the field. No chip is selected by default.
 */
export function IntentField({
  selectedIntent,
  onSelectIntent,
  prompt,
  onPromptChange,
  disabled = false,
  showHeading = true,
}: Props) {
  const canEnhance =
    !disabled && (selectedIntent !== null || prompt.trim().length > 0);

  return (
    <div className="flex flex-col gap-3">
      {showHeading && <h3 className="text-sm font-medium">Intent</h3>}

      <div className="flex flex-wrap gap-1.5">
        {intentPresets.map((label) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => {
              onSelectIntent(label);
              onPromptChange(
                intentPrompts[label] ?? `Find ${label.toLowerCase()}.`
              );
            }}
            aria-pressed={selectedIntent === label}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
              selectedIntent === label
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground/80 hover:border-foreground/30 hover:bg-accent hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Prompt with Enhance as an icon button inside, bottom-right */}
      <div className="relative">
        <Textarea
          id="intent"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className="resize-none pr-9 text-xs"
          placeholder="e.g., funny moment with a big chat spike"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={!canEnhance}
              onClick={() => onPromptChange(enhancePrompt(selectedIntent, prompt))}
              aria-label="Enhance prompt"
              className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <Sparkles className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Enhance prompt</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
