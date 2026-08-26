"use client";

import { Event } from "@/lib/events";
import { EventCard } from "./event-card";
import { CalendarX } from "lucide-react";
import { motion } from "framer-motion";

interface EventGridProps {
  events: Event[];
  favorites: Set<string>;
  onToggleSave: (link: string) => void;
}

export function EventGrid({ events, favorites, onToggleSave }: EventGridProps) {
  if (!events.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="container mx-auto flex max-w-6xl flex-col items-center justify-center border-2 border-dashed border-border bg-muted/30 px-6 py-20 text-center"
      >
        <div className="flex size-14 items-center justify-center border-2 border-border bg-accent shadow-brutal-sm">
          <CalendarX className="size-7 text-accent-foreground" />
        </div>
        <h3 className="mt-4 font-display text-lg uppercase">No events found</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try clearing your filters or searching for a different venue,
          category, or date.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-6xl px-4 pb-16"
    >
      <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Showing{" "}
        <span className="text-foreground">{events.length}</span>{" "}
        event{events.length === 1 ? "" : "s"}
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </motion.div>
  );
}
