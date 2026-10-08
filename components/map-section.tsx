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
      className="pb-12 sm:pb-16"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-white">
            <MapPin className="size-4" />
          </span>
          Event map
        </h2>
        <p className="text-xs text-muted-foreground">
          {located.length}/{events.length} mapped
        </p>
      </div>
      <div className="h-[55vh] min-h-[360px] overflow-hidden rounded-3xl border border-border md:h-[62vh]">
        <EventMap events={events} />
      </div>
    </motion.section>
  );
}
