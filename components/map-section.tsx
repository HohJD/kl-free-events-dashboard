"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Event } from "@/lib/events";

const EventMap = dynamic(() => import("./event-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/40">
      <p className="text-sm text-muted-foreground">Loading map…</p>
    </div>
  ),
});

export function MapSection({ events }: { events: Event[] }) {
  const located = events.filter((e) => e.lat !== null && e.lon !== null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-6xl px-4 pb-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-indigo-500 text-white">
            <MapPin className="size-4" />
          </span>
          Event map
        </h2>
        <p className="text-xs text-muted-foreground">
          {located.length} of {events.length} events mapped
        </p>
      </div>
      <div className="h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-border/60 shadow-sm md:h-[62vh]">
        <EventMap events={events} />
      </div>
    </motion.section>
  );
}
