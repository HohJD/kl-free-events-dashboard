"use client";

import { useState } from "react";
import {
  MapPin,
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
import { eventRegion, REGIONS } from "@/lib/regions";
import { malaysiaDay } from "@/lib/filter-events";

const SOURCE_COLORS: Record<string, string> = {
  meetup: "bg-[#ff9d9d]",
  eventbrite: "bg-[#ffb47d]",
  luma: "bg-[#cdb0ff]",
  allevents: "bg-[#93d8ff]",
  devpost: "bg-[#8ceedd]",
  devfolio: "bg-[#a5e8a2]",
  manual: "bg-[#ffd02f]",
  'french-tech-my': "bg-[#cdb0ff]",
  'gdg-malaysia': "bg-[#93d8ff]",
  mlh: "bg-[#a5e8a2]",
};

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#ffd02f"/><circle cx="500" cy="80" r="120" fill="#161412" opacity="0.06"/><circle cx="140" cy="300" r="90" fill="#161412" opacity="0.06"/></svg>'
)}`;

function dayLabel(iso: string): string | null {
  if (!iso) return null;
  const diff = Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${malaysiaDay()}T00:00:00Z`)) / 86400000);
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
    timeZone: "Asia/Kuala_Lumpur",
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
  if (eventRegion(event) === 'online' || eventRegion(event) === 'unknown') return null;
  if (event.lat !== null && event.lon !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lon}`;
  }
  if (event.venue) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${event.venue}, ${REGIONS[eventRegion(event)]}, Malaysia`
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
  const urgency = event.end_date && event.date < malaysiaDay() && event.end_date >= malaysiaDay() ? 'In progress' : dayLabel(event.date);
  const registrationLabel =
    event.registration_status === 'open' ? 'Registration open' :
    event.registration_status === 'closed' ? 'Registration closed / full' :
    event.registration_status === 'not_open' ? 'Registration not open yet' : null;

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
      className="h-full min-w-0"
    >
      <article className="listing-card group">
        {/* Image */}
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />

          {/* Save button */}
          <button
            onClick={() => onToggleSave(event.link)}
            aria-label={saved ? "Remove from saved" : "Save event"}
            aria-pressed={saved}
            className={cn(
              "absolute left-3 top-3 flex size-11 items-center justify-center rounded-full shadow-sm transition-transform active:scale-95",
              saved
                ? "bg-foreground text-background"
                : "bg-white/90 text-black hover:bg-white"
            )}
          >
            <Heart className={cn("size-4", saved && "fill-current")} />
          </button>

          {/* Date chip */}
          <span
            className={cn(
              "absolute right-3 top-3 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] font-semibold",
              urgency
                ? "bg-accent text-accent-foreground"
                : "bg-white/95 text-black"
            )}
          >
            {urgency || dateLabel}
          </span>

          {/* Source chip */}
          <span
            className={cn(
              "absolute bottom-3 left-3 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] font-semibold text-black",
              SOURCE_COLORS[event.source] || "bg-white/95"
            )}
          >
            {event.source}
          </span>
        </div>

        {/* Body */}
        <div className="listing-body">
          <p className="min-h-10 break-words text-xs leading-5 text-muted-foreground sm:min-h-10">
            {dateLabel}{event.end_date && event.end_date !== event.date ? ` – ${formatDate(event.end_date)}` : ''}
            {timeLabel ? ` · ${timeLabel}` : ""}
            <span className="mx-1.5 opacity-40">/</span>
            {event.category}
          </p>
          {registrationLabel ? (
            <p className="-mt-1 mb-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {registrationLabel}
            </p>
          ) : null}

          {event.stale && (
            <p className="mt-2 text-xs font-medium text-muted-foreground">Source unavailable during the latest check — confirm details before going.</p>
          )}
          <h3 className="listing-title mt-1">
            {event.name}
          </h3>

          {event.venue ? (
            <p className="mt-2 flex min-h-10 items-start gap-1.5 text-xs leading-5 text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2 break-words">{event.venue} · {REGIONS[eventRegion(event)]}</span>
            </p>
          ) : null}

          {description ? (
            <p className="mb-4 mt-2 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}

          <div className="listing-actions">
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border/70 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-brutal-sm transition-opacity hover:opacity-90"
            >
              View event <ArrowUpRight className="size-3.5" />
            </a>
            <div className="flex items-center gap-0.5">
              {calendarUrl ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add to Google Calendar"
                  title="Add to calendar"
                  className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                  className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Navigation className="size-4" />
                </a>
              ) : null}
              <button
                onClick={handleShare}
                aria-label="Share event"
                title="Share"
                className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
      </article>
    </motion.div>
  );
}
