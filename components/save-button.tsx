"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import type { SavedEntry } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

/** "Track" toggle: adds the thing to the visitor's tracker. */
export function SaveButton({ entry, saved, onToggle, className }: {
  entry: Omit<SavedEntry, "savedAt">;
  saved: boolean;
  onToggle: (entry: Omit<SavedEntry, "savedAt">) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggle(entry); }}
      aria-pressed={saved}
      aria-label={saved ? `Stop tracking ${entry.title}` : `Track ${entry.title}`}
      className={cn("btn relative overflow-hidden", saved ? "bg-accent text-accent-foreground" : "btn-quiet", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={saved ? "on" : "off"} className="flex items-center gap-1.5"
          initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.18 }}>
          {saved ? <BookmarkCheck className="size-4" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />}
          <span className="max-[359px]:sr-only">{saved ? "Tracking" : "Track"}</span>
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
