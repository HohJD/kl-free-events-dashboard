"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarPlus, Check, GraduationCap, MapPin, Navigation, Share2, Trophy, Wrench } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";
import { KIND_LABELS, daysLeft, type Opportunity } from "@/lib/opportunities";
import { REGIONS, eventRegion } from "@/lib/regions";
import type { SavedEntry } from "@/lib/use-saved";
import { cn } from "@/lib/utils";
import { SaveButton } from "./save-button";

const KIND_ICON = { scholarship: GraduationCap, internship: Wrench, graduate: Wrench, tool: Wrench, hackathon: Trophy, event: Trophy };

function formatDate(value: string): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return "";
  return new Date(stamp).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function formatTime(value?: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** The one line under the type badge: when it happens, or when it closes. */
function whenLabel(row: Opportunity, today: string): { text: string; urgent: boolean } {
  if (row.isDeadline) {
    if (row.alwaysOpen || !row.date) return { text: "Always open", urgent: false };
    const left = daysLeft(row, today) ?? 0;
    if (left <= 0) return { text: "Closes today", urgent: true };
    return { text: `Closes ${formatDate(row.date)}${left <= 14 ? ` · ${left} days left` : ""}`, urgent: left <= 14 };
  }
  const range = row.endDate && row.endDate !== row.date ? ` – ${formatDate(row.endDate)}` : "";
  const time = formatTime(row.time);
  const soon = row.date === today;
  return { text: `${formatDate(row.date)}${range}${time ? ` · ${time}` : ""}`, urgent: soon };
}

export function OpportunityCard({ row, today, saved, onToggleSave }: {
  row: Opportunity; today: string; saved: boolean; onToggleSave: (entry: Omit<SavedEntry, "savedAt">) => void;
}) {
  const [shared, setShared] = useState(false);
  const when = whenLabel(row, today);
  const Icon = KIND_ICON[row.kind] ?? Trophy;
  const place = row.event ? `${row.place}${row.place ? " · " : ""}${REGIONS[eventRegion(row.event)] ?? ""}` : row.place;
  const calendar = row.event ? googleCalendarUrl(row.event) : null;
  const directions = row.event && row.event.lat != null && row.event.lon != null
    ? `https://www.google.com/maps/search/?api=1&query=${row.event.lat},${row.event.lon}` : null;
  const action = row.kind === "tool" ? "Get it" : row.isDeadline ? "View details" : "View event";

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: row.title, url: row.link });
      else { await navigator.clipboard.writeText(row.link); setShared(true); setTimeout(() => setShared(false), 1500); }
    } catch {
      // cancelled
    }
  };

  return (
    <article className="listing-card event-card group">
      <div className="event-thumb relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted">
        {row.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent/30">
            <Icon className="size-8 text-muted-foreground" aria-hidden />
          </div>
        )}
        <SaveButton className="absolute left-3 top-3" floating saved={saved} onToggle={onToggleSave}
          entry={{ id: row.id, kind: row.event ? "event" : "resource", title: row.title, href: row.link, section: "/",
            note: [KIND_LABELS[row.kind].one, when.text, row.org].filter(Boolean).join(" · ") }} />
        <span className="event-date-chip absolute right-3 top-3 rounded-full border border-border bg-white/95 px-2.5 py-1 font-mono text-[11px] font-semibold text-black">
          {KIND_LABELS[row.kind].one}
        </span>
      </div>

      <div className="listing-body gap-1.5">
        <p className={cn("text-xs font-medium", when.urgent ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
          <span className="md:hidden">{KIND_LABELS[row.kind].one} · </span>{when.text}
        </p>
        <h3 className="listing-title">{row.title}</h3>
        {row.org || place ? (
          <p className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-2 break-words">{[row.org, place].filter(Boolean).join(" · ")}</span>
          </p>
        ) : null}
        {row.value || row.eligibility ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{[row.value, row.eligibility].filter(Boolean).join(" · ")}</p>
        ) : null}
        {row.status === "closed" ? <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Registration closed</p> : null}
        {row.note ? <p className="text-xs text-muted-foreground">{row.note}</p> : null}
        {row.summary ? <p className="event-desc line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">{row.summary}</p> : null}

        <div className="listing-actions">
          <a href={row.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border/70 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-brutal-sm hover:opacity-90">
            {action} <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
          <div className="flex items-center gap-0.5">
            {calendar ? (
              <a href={calendar} target="_blank" rel="noopener noreferrer" data-extra aria-label="Add to Google Calendar" title="Add to calendar"
                className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"><CalendarPlus className="size-4" /></a>
            ) : null}
            {directions ? (
              <a href={directions} target="_blank" rel="noopener noreferrer" data-extra aria-label="Get directions" title="Directions"
                className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"><Navigation className="size-4" /></a>
            ) : null}
            <button type="button" onClick={share} aria-label="Share" title="Share"
              className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
              {shared ? <Check className="size-4 text-green-600" /> : <Share2 className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
