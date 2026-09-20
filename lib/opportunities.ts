import type { Event } from "./events";
import type { Resource } from "./resources";
import { malaysiaDay, type DateRange, type SortMode } from "./filter-events";
import { eventRegion } from "./regions";

export type OpportunityKind = "event" | "hackathon" | "scholarship" | "internship" | "graduate" | "tool";

export interface Opportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  /** Organiser, employer or source. */
  org: string;
  /** The date it happens (events) or the day applications close (resources). */
  date: string;
  endDate?: string;
  /** True when `date` is a deadline rather than the day it happens. */
  isDeadline: boolean;
  alwaysOpen?: boolean;
  time?: string;
  place: string;
  /** Malaysian state slug, "online", "malaysia" (nationwide) or "" (unknown). */
  state: string;
  link: string;
  image?: string;
  summary: string;
  /** Money: fare, allowance or scholarship value. */
  value?: string;
  eligibility?: string;
  topics: string[];
  score: number;
  note?: string;
  status?: string;
  source: string;
  /** Category used by the map and the source filter (events only). */
  category?: string;
  event?: Event;
}

export const KIND_ORDER: OpportunityKind[] = ["event", "hackathon", "scholarship", "internship", "graduate", "tool"];

export const KIND_LABELS: Record<OpportunityKind, { one: string; many: string }> = {
  event: { one: "Event", many: "Events" },
  hackathon: { one: "Hackathon", many: "Hackathons" },
  scholarship: { one: "Scholarship", many: "Scholarships" },
  internship: { one: "Internship", many: "Internships" },
  graduate: { one: "Graduate role", many: "Graduate roles" },
  tool: { one: "Free tool", many: "Free tools" },
};

export function fromEvent(event: Event): Opportunity {
  return {
    id: event.link,
    kind: event.category === "Hackathon" ? "hackathon" : "event",
    title: event.name,
    org: event.source,
    date: event.date,
    endDate: event.end_date,
    isDeadline: false,
    time: event.time,
    place: event.venue,
    state: event.state || "",
    link: event.link,
    image: event.image,
    summary: event.description || "",
    eligibility: event.eligibility,
    topics: event.topics || [],
    score: typeof event.quality_score === "number" ? event.quality_score : 50,
    note: event.admission_note,
    status: event.registration_status,
    source: event.source,
    category: event.category,
    event,
  };
}

export function fromResource(resource: Resource): Opportunity {
  const kind = resource.kind as OpportunityKind;
  return {
    id: `${resource.kind}:${resource.link}`,
    kind,
    title: resource.title,
    org: resource.organization,
    date: resource.deadline || "",
    isDeadline: true,
    alwaysOpen: resource.always_open,
    place: resource.location,
    state: resource.state || "",
    link: resource.link,
    summary: resource.summary,
    value: resource.amount,
    eligibility: resource.eligibility,
    topics: resource.topics || [],
    score: resource.quality_score ?? 50,
    source: resource.source,
  };
}

/** Days until a deadline; null when there is none. */
export function daysLeft(row: Opportunity, today = malaysiaDay()): number | null {
  if (!row.isDeadline || !row.date) return null;
  return Math.round((Date.parse(`${row.date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

function inDateRange(row: Opportunity, range: DateRange, today: string): boolean {
  if (range === "all") return true;
  const end = row.endDate && row.endDate >= row.date ? row.endDate : row.date;
  // Rolling things (tools, internships, jobs with no deadline) always count as open.
  if (!row.date) return range !== "past";
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const weekEnd = new Date(Date.parse(`${today}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
  switch (range) {
    case "today": return row.date <= today && end >= today;
    case "tomorrow": return row.date <= tomorrow && end >= tomorrow;
    case "week": return end >= today && row.date < weekEnd;
    case "month": return end >= today && row.date.slice(0, 7) <= today.slice(0, 7);
    case "past": return end < today;
    default: return end >= today;
  }
}

/** Nationwide and online things stay visible whatever state is chosen. */
function inRegion(row: Opportunity, region: string): boolean {
  if (region === "all") return true;
  if (!row.state || row.state === "malaysia" || row.state === "online" || row.state === "unknown") return true;
  return row.state === region;
}

export interface OpportunityFilters {
  kind: OpportunityKind | "all";
  query: string;
  region: string;
  dateRange: DateRange;
  sort: SortMode;
  source: string;
  savedIds?: Set<string>;
  onlySaved?: boolean;
}

export function filterOpportunities(rows: Opportunity[], filters: OpportunityFilters, today = malaysiaDay()): Opportunity[] {
  const query = filters.query.trim().normalize("NFKC").toLowerCase();
  return rows
    .filter((row) => filters.kind === "all" || row.kind === filters.kind)
    .filter((row) => inDateRange(row, filters.dateRange, today))
    .filter((row) => inRegion(row, filters.region))
    .filter((row) => filters.source === "all" || row.source === filters.source)
    .filter((row) => !filters.onlySaved || filters.savedIds?.has(row.link) || filters.savedIds?.has(row.id))
    .filter((row) => !query || `${row.title} ${row.org} ${row.place} ${row.summary} ${row.topics.join(" ")}`.normalize("NFKC").toLowerCase().includes(query))
    .sort((a, b) => {
      if (filters.sort === "recommended") {
        const band = Math.floor(b.score / 10) - Math.floor(a.score / 10);
        if (band) return band;
      }
      const left = a.date || "9999-99-99";
      const right = b.date || "9999-99-99";
      return left.localeCompare(right) || a.title.localeCompare(b.title);
    });
}

export function countByKind(rows: Opportunity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.kind] = (counts[row.kind] || 0) + 1;
  return counts;
}

/** Events only: what the map and the state counts use. */
export function eventsOf(rows: Opportunity[]): Event[] {
  return rows.flatMap((row) => (row.event ? [row.event] : []));
}

export function regionOf(row: Opportunity): string {
  return row.event ? eventRegion(row.event) : row.state || "unknown";
}
