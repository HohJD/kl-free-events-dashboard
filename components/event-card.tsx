"use client";

import { useState } from "react";
import {
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

const SOURCE_COLORS: Record<string, string> = {
  meetup: "bg-[#f65858]",
  eventbrite: "bg-[#ff8a3d]",
  luma: "bg-[#b78aff]",
  allevents: "bg-[#6ecbff]",
  devpost: "bg-[#5eead4]",
};

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#ffd02f"/><circle cx="500" cy="80" r="120" fill="#161412" opacity="0.08"/><circle cx="140" cy="300" r="90" fill="#161412" opacity="0.08"/></svg>'
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
  if (!time) return "";
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
  const description = truncate(event.description, 120);
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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min((index % 6) * 0.04, 0.2) }}
      className="h-full"
    >
      <div className="group flex h-full flex-col border-2 border-border bg-card shadow-brutal transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg">
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden border-b-2 border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />

          {/* Save button */}
          <button
            onClick={() => onToggleSave(event.link)}
            aria-label={saved ? "Remove from saved" : "Save event"}
            className={cn(
              "absolute left-3 top-3 flex size-8 items-center justify-center border-2 border-border transition-all active:translate-y-px",
              saved ? "bg-[#f65858] text-white" : "bg-background text-foreground"
            )}
          >
            <Heart className={cn("size-4", saved && "fill-current")} />
          </button>

          {/* Date chip */}
          <div className="absolute right-0 top-0">
            <span
              className={cn(
                "block border-b-2 border-l-2 border-border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide",
                urgency ? "bg-accent text-accent-foreground" : "bg-background"
              )}
            >
              {urgency || dateLabel}
            </span>
          </div>

          {/* Source ribbon */}
          <div className="absolute bottom-0 left-0 flex">
            <span
              className={cn(
                "border-r-2 border-t-2 border-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-black",
                SOURCE_COLORS[event.source] || "bg-muted"
              )}
            >
              {event.source}
            </span>
            <span className="border-r-2 border-t-2 border-border bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
              {event.category}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {dateLabel}
            {timeLabel ? (
              <>
                {" · "}
                <Clock className="mb-0.5 inline size-3" /> {timeLabel}
              </>
            ) : null}
          </p>

          <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug md:text-lg">
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
              className="inline-flex items-center gap-1 border-2 border-border bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm transition-all hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              View <ArrowUpRight className="size-3.5" />
            </a>
            <div className="flex items-center gap-1.5">
              {calendarUrl ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add to Google Calendar"
                  title="Add to calendar"
                  className="flex size-8 items-center justify-center border-2 border-border bg-background transition-all hover:-translate-y-px hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
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
                  className="flex size-8 items-center justify-center border-2 border-border bg-background transition-all hover:-translate-y-px hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
                >
                  <Navigation className="size-4" />
                </a>
              ) : null}
              <button
                onClick={handleShare}
                aria-label="Share event"
                title="Share"
                className="flex size-8 items-center justify-center border-2 border-border bg-background transition-all hover:-translate-y-px hover:shadow-brutal-sm active:translate-y-0 active:shadow-none"
              >
                {shared ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Share2 className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
