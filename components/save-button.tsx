"use client";

import { Heart } from "lucide-react";
import type { SavedEntry } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

/** Heart toggle used by every section; `entry` is what the Saved page shows. */
export function SaveButton({ entry, saved, onToggle, className, floating = false }: {
  entry: Omit<SavedEntry, "savedAt">;
  saved: boolean;
  onToggle: (entry: Omit<SavedEntry, "savedAt">) => void;
  className?: string;
  floating?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggle(entry); }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${entry.title} from saved` : `Save ${entry.title}`}
      title={saved ? "Saved" : "Save for later"}
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-transform active:scale-95",
        floating ? "shadow-sm" : "hover:bg-muted",
        floating && (saved ? "bg-foreground text-background" : "bg-white/90 text-black hover:bg-white"),
        !floating && saved && "text-foreground",
        !floating && !saved && "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} aria-hidden />
    </button>
  );
}
