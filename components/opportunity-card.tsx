"use client";

import { ArrowUpRight } from "lucide-react";
import { KIND_LABELS, daysLeft, type Opportunity } from "@/lib/opportunities";
import { REGIONS, eventRegion } from "@/lib/regions";
import type { SavedEntry } from "@/lib/use-saved";
import { cn } from "@/lib/utils";
import { SaveButton } from "./save-button";

function formatDate(value: string): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp)
    ? new Date(stamp).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    : "";
}

function formatTime(value?: string): string {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [hours, minutes] = value.split(":").map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, "0")}${hours >= 12 ? "pm" : "am"}`;
}

/** When it happens, or when it closes: the one line every card shows. */
function when(row: Opportunity, today: string): { text: string; urgent: boolean } {
  if (row.isDeadline) {
    if (row.alwaysOpen || !row.date) return { text: "Open now", urgent: false };
    const left = daysLeft(row, today) ?? 0;
    if (left <= 0) return { text: "Closes today", urgent: true };
    if (left <= 14) return { text: `${left}d left`, urgent: true };
    return { text: `Closes ${formatDate(row.date)}`, urgent: false };
  }
  if (row.date === today) return { text: `Today${row.time ? `, ${formatTime(row.time)}` : ""}`, urgent: true };
  const range = row.endDate && row.endDate !== row.date ? ` to ${formatDate(row.endDate)}` : "";
  const time = formatTime(row.time);
  return { text: `${formatDate(row.date)}${range}${time ? `, ${time}` : ""}`, urgent: false };
}

/** What the tracker stores for a card. */
export function trackEntry(row: Opportunity, today: string): Omit<SavedEntry, "savedAt"> {
  const area = row.event ? REGIONS[eventRegion(row.event)] ?? "" : row.place;
  return {
    id: row.id, kind: row.event ? "event" : "resource", title: row.title, href: row.link, section: "/",
    note: [row.event ? row.place : row.org, row.event ? when(row, today).text : row.value].filter(Boolean).join(" · "),
    label: KIND_LABELS[row.kind].one,
    date: row.date || undefined, endDate: row.endDate, time: row.time, isDeadline: row.isDeadline && !row.alwaysOpen,
    place: [row.place, area].filter(Boolean).filter((v, i, all) => all.indexOf(v) === i).join(", "),
  };
}

export function OpportunityCard({ row, today, saved, onToggleSave, index = 0 }: {
  row: Opportunity; today: string; saved: boolean; onToggleSave: (entry: Omit<SavedEntry, "savedAt">) => void; index?: number;
}) {
  const timing = when(row, today);
  const area = row.event ? REGIONS[eventRegion(row.event)] ?? "" : "";
  const context = row.event
    ? Array.from(new Set([row.place, area].filter((value) => value && value !== "Location unconfirmed"))).join(" · ")
    : [row.org, row.place === "Malaysia" ? "" : row.place].filter(Boolean).join(" · ");
  const entry = trackEntry(row, today);

  return (
    <article className={cn("card flex h-full flex-col p-4", index < 12 && "rise")} style={index < 12 ? { animationDelay: `${index * 30}ms` } : undefined}>
      <div className="flex items-start gap-3">
        <span className="thumb">
          {row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.image} alt="" loading="lazy" decoding="async" className="size-full bg-white object-cover" />
          ) : (
            <span className="text-base font-semibold text-muted-foreground" aria-hidden>{row.title.trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="shrink-0">{KIND_LABELS[row.kind].one}</span>
            <span aria-hidden>·</span>
            <span className={cn("pill truncate", timing.urgent && "pill-hot")}>{timing.text}</span>
          </p>
          <h3 className="mt-1 line-clamp-2 break-words text-[15px] font-semibold leading-snug tracking-tight">{row.title}</h3>
        </div>
      </div>

      {context || row.value ? (
        <p className="mt-2.5 line-clamp-1 break-words text-[13px] text-muted-foreground">
          {row.value ? <span className="font-medium text-foreground">{row.value}</span> : null}
          {row.value && context ? " · " : ""}{context}
        </p>
      ) : null}
      {row.status === "closed" ? <p className="mt-1 text-xs font-semibold text-destructive">Registration closed</p> : null}

      <div className="mt-auto flex items-center gap-1 pt-4">
        <a href={row.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          {row.kind === "tool" ? "Get it" : row.isDeadline ? "Apply" : "View"} <ArrowUpRight className="size-4" aria-hidden />
        </a>
        <SaveButton saved={saved} onToggle={onToggleSave} entry={entry} />
      </div>
    </article>
  );
}
