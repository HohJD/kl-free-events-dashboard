"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  Navigation,
  Heart,
  Share2,
  Check,
  CalendarPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { Event } from "@/lib/events";
import { googleCalendarUrl } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const SOURCE_STYLES: Record<string, string> = {
  meetup: "bg-rose-500/90 text-white",
  eventbrite: "bg-orange-500/90 text-white",
  luma: "bg-violet-500/90 text-white",
  allevents: "bg-sky-500/90 text-white",
  devpost: "bg-emerald-500/90 text-white",
};

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#f43f5e"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/></svg>'
)}`;

function dayLabel(iso: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return null;
}

function formatDate(iso: string) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(time: string) {
  if (!time) return "Time TBC";
  const [h, m] = time.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function truncate(text: string, len: number) {
  if (text.length <= len) return text;
  return text.slice(0, len).trimEnd() + "…";
}

function mapsUrl(event: Event) {
  if (event.lat !== null && event.lon !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lon}`;
  }
  if (event.venue) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${event.venue} Kuala Lumpur`
    )}`;
  }
  return null;
}

interface EventCardProps {
  event: Event;
  index: number;
  saved: boolean;
  onToggleSave: (link: string) => void;
}

export function EventCard({ event, index, saved, onToggleSave }: EventCardProps) {
  const [shared, setShared] = useState(false);
  const dateLabel = formatDate(event.date);
  const timeLabel = formatTime(event.time);
  const description = truncate(event.description, 130);
  const directions = mapsUrl(event);
  const calendarUrl = googleCalendarUrl(event);
  const urgency = dayLabel(event.date);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: event.name, url: event.link });
      } else {
        await navigator.clipboard.writeText(event.link);
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      }
    } catch {
      // user cancelled share; ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min((index % 6) * 0.06, 0.3) }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-rose-500/30 hover:shadow-[0_8px_40px_-12px_rgba(244,63,94,0.25)] dark:hover:shadow-[0_8px_40px_-12px_rgba(244,63,94,0.35)]">
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Save button */}
          <button
            onClick={() => onToggleSave(event.link)}
            aria-label={saved ? "Remove from saved" : "Save event"}
            className={cn(
              "absolute left-3 top-3 flex size-8 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90",
              saved
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40"
                : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            <Heart className={cn("size-4", saved && "fill-current")} />
          </button>

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            <Badge className="border-0 bg-white/90 text-black shadow-sm backdrop-blur-sm">
              {event.category}
            </Badge>
            <Badge
              className={`border-0 shadow-sm backdrop-blur-sm ${
                SOURCE_STYLES[event.source] || "bg-zinc-700/90 text-white"
              }`}
            >
              {event.source}
            </Badge>
          </div>

          <div className="absolute right-3 top-3">
            {urgency ? (
              <span className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                {urgency}
              </span>
            ) : (
              <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                {dateLabel}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {dateLabel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {timeLabel}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-rose-500 dark:group-hover:text-rose-400 md:text-lg">
            {event.name}
          </h3>

          {event.venue ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </p>
          ) : null}

          {description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:gap-1.5 hover:opacity-90"
            >
              View event <ArrowUpRight className="size-3.5" />
            </a>
            <div className="flex items-center gap-1">
              {calendarUrl ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add to Google Calendar"
                  title="Add to calendar"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <CalendarPlus className="size-4" />
                </a>
              ) : null}
              {directions ? (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get directions"
                  title="Directions"
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Navigation className="size-4" />
                </a>
              ) : null}
              <button
                onClick={handleShare}
                aria-label="Share event"
                title="Share"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {shared ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Share2 className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-rose-500 via-orange-400 to-indigo-500 transition-transform duration-500 group-hover:scale-x-100" />
      </div>
    </motion.div>
  );
}
