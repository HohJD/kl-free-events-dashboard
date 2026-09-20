"use client";

import { useState } from "react";
import { ArrowUpRight, Briefcase, CalendarDays, CalendarPlus, Check, GraduationCap, Share2, Trophy, Wrench } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";
import { KIND_LABELS, daysLeft, type Opportunity, type OpportunityKind } from "@/lib/opportunities";
import { REGIONS, eventRegion } from "@/lib/regions";
import type { SavedEntry } from "@/lib/use-saved";
import { cn } from "@/lib/utils";
import { SaveButton } from "./save-button";

const KIND_ICON: Record<OpportunityKind, typeof Trophy> = {
  event: CalendarDays, hackathon: Trophy, scholarship: GraduationCap, internship: Briefcase, graduate: Briefcase, tool: Wrench,
};

function formatDate(value: string): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp)
    ? new Date(stamp).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    : "";
}

function formatTime(value?: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "pm" : "am"}`;
}

/** When it happens, or when it closes: the one line every card shows. */
function when(row: Opportunity, today: string): { text: string; urgent: boolean } {
  if (row.isDeadline) {
    if (row.alwaysOpen || !row.date) return { text: "Open now", urgent: false };
    const left = daysLeft(row, today) ?? 0;
    if (left <= 0) return { text: "Closes today", urgent: true };
    if (left <= 14) return { text: `${left} days left`, urgent: true };
    return { text: `Closes ${formatDate(row.date)}`, urgent: false };
  }
  const range = row.endDate && row.endDate !== row.date ? ` to ${formatDate(row.endDate)}` : "";
  const time = formatTime(row.time);
  return { text: `${formatDate(row.date)}${range}${time ? `, ${time}` : ""}`, urgent: row.date === today };
}

export function OpportunityCard({ row, today, saved, onToggleSave }: {
  row: Opportunity; today: string; saved: boolean; onToggleSave: (entry: Omit<SavedEntry, "savedAt">) => void;
}) {
  const [shared, setShared] = useState(false);
  const timing = when(row, today);
  const Icon = KIND_ICON[row.kind];
  // Events: where it is. Resources: who is offering it. Never the scraper's source name.
  const area = row.event ? REGIONS[eventRegion(row.event)] ?? "" : "";
  const context = row.event
    ? Array.from(new Set([row.place, area].filter(Boolean))).join(" · ")
    // "Malaysia" on every nationwide scholarship is noise; the state matters, the country does not.
    : [row.org, row.place === "Malaysia" ? "" : row.place].filter(Boolean).join(" · ");
  const calendar = row.event ? googleCalendarUrl(row.event) : null;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: row.title, url: row.link });
      else { await navigator.clipboard.writeText(row.link); setShared(true); setTimeout(() => setShared(false), 1500); }
    } catch {
      // cancelled
    }
  };

  return (
    <article className="card flex h-full gap-3 p-4">
      <span className="thumb">
        {row.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {row.kind === "event" ? null : (
            <><span className="font-semibold text-foreground">{KIND_LABELS[row.kind].one}</span><span aria-hidden>·</span></>
          )}
          <span className={cn(timing.urgent && "font-semibold text-amber-700 dark:text-amber-400")}>{timing.text}</span>
        </p>
        <h3 className="mt-1 line-clamp-2 break-words font-display text-base font-bold leading-snug">{row.title}</h3>
        {context ? <p className="mt-1 line-clamp-1 break-words text-xs text-muted-foreground">{context}</p> : null}
        {row.value || row.status === "closed" ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {row.status === "closed" ? "Registration closed" : row.value}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-1 pt-1">
          <a href={row.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border/70 bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90">
            {row.kind === "tool" ? "Get it" : row.isDeadline ? "Details" : "View"} <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
          <SaveButton className="ml-auto size-9" saved={saved} onToggle={onToggleSave}
            entry={{ id: row.id, kind: row.event ? "event" : "resource", title: row.title, href: row.link, section: "/",
              note: [KIND_LABELS[row.kind].one, timing.text, row.org].filter(Boolean).join(" · ") }} />
          {calendar ? (
            <a href={calendar} target="_blank" rel="noopener noreferrer" aria-label="Add to calendar" title="Add to calendar"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <CalendarPlus className="size-4" aria-hidden />
            </a>
          ) : null}
          <button type="button" onClick={share} aria-label="Share" title="Share"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            {shared ? <Check className="size-4 text-green-600" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </article>
  );
}
