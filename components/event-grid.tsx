"use client";

import { Event } from "@/lib/events";
import type { SavedEntry } from "@/lib/use-saved";
import { EventCard } from "./event-card";
import { CalendarX } from "lucide-react";
import { motion } from "framer-motion";

interface EventGridProps {
  events: Event[];
  favorites: Set<string>;
  onToggleSave: (entry: Omit<SavedEntry, "savedAt">) => void;
  onClear: () => void;
}

export function EventGrid({ events, favorites, onToggleSave, onClear }: EventGridProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-shell pb-16 sm:pb-20">
      <p className="mb-5 font-mono text-xs text-muted-foreground" aria-live="polite">
        Showing <span className="text-foreground">{events.length}</span> event{events.length === 1 ? "" : "s"}
      </p>
      {events.length ? (
        <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <EventCard
              key={event.link || `${event.name}-${i}`}
              event={event}
              index={i}
              saved={favorites.has(event.link)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-input/60 bg-muted/20 px-6 py-16 text-center sm:py-20">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent">
            <CalendarX className="size-7 text-accent-foreground" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold">No events found</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Try All events, another state, or clearing your filters. Only listings that pass our admission, date and location checks appear here.
          </p>
          <button type="button" onClick={onClear}
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-border bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brutal-sm">
            Clear search and filters
          </button>
        </div>
      )}
    </motion.div>
  );
}
