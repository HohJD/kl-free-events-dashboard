"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, GraduationCap, Briefcase, BriefcaseBusiness, Wrench, Trophy } from "lucide-react";
import { Resource, ResourceKind, RESOURCE_KINDS, filterResources } from "@/lib/resources";
import { malaysiaDay } from "@/lib/filter-events";
import { cn } from "@/lib/utils";
import { useSaved, type SavedEntry } from "@/lib/use-saved";
import { SaveButton } from "./save-button";

const KIND_ICON = { scholarship: GraduationCap, internship: Briefcase, graduate: BriefcaseBusiness, tool: Wrench };
const KIND_LABEL: Record<ResourceKind, string> = { scholarship: "Scholarship", internship: "Internship", graduate: "Graduate role", tool: "Free tool" };
const SECTION_TITLE: Record<ResourceKind, string> = { scholarship: "Scholarships closing soon", internship: "Internships", graduate: "Graduate programmes & fresh-grad roles", tool: "Free tools & learning" };
const PREVIEW = 6;

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "border-border bg-accent text-accent-foreground shadow-brutal-sm" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function deadlineLabel(row: Resource, today: string): { text: string; urgent: boolean } | null {
  if (row.kind === "tool") return null;
  if (row.always_open) return { text: "Always open", urgent: false };
  if (!row.deadline) return row.posted_at ? { text: `Posted ${formatDay(row.posted_at)}`, urgent: false } : null;
  const days = Math.round((Date.parse(`${row.deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (days <= 0) return { text: "Closes today", urgent: true };
  return { text: `Closes ${formatDay(row.deadline)}${days <= 14 ? ` · ${days} day${days === 1 ? "" : "s"} left` : ""}`, urgent: days <= 14 };
}

function formatDay(value: string): string {
  const stamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return value;
  return new Date(stamp).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function ResourceCard({ row, today, saved, onToggle }: { row: Resource; today: string; saved: boolean; onToggle: (entry: Omit<SavedEntry, "savedAt">) => void }) {
  const Icon = KIND_ICON[row.kind];
  const deadline = deadlineLabel(row, today);
  return (
    <article className="listing-card">
      <div className="listing-body">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted">
            {row.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image} alt="" className="size-full object-contain" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Icon className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {KIND_LABEL[row.kind]}{row.topics.includes("tech") ? " · Tech" : ""}
            </p>
            <h3 className="listing-title mt-0.5 break-words">{row.title}</h3>
            {row.organization ? <p className="mt-0.5 truncate text-sm text-muted-foreground">{row.organization}</p> : null}
          </div>
          <SaveButton saved={saved} onToggle={onToggle} className="-mr-2 -mt-1 shrink-0"
            entry={{ id: row.link, kind: "resource", title: row.title, href: row.link, section: `/resources?type=${row.kind}`,
              note: [KIND_LABEL[row.kind], row.organization, row.deadline ? `closes ${formatDay(row.deadline)}` : ""].filter(Boolean).join(" · ") }} />
        </div>

        {deadline ? (
          <p className={cn("mt-3 text-xs font-semibold", deadline.urgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
            {deadline.text}
          </p>
        ) : null}
        <dl className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
          {row.amount ? <div className="line-clamp-2 break-words"><dt className="inline font-semibold text-foreground">{row.kind === "internship" ? "Allowance: " : row.kind === "graduate" ? "Salary: " : "Value: "}</dt><dd className="inline">{row.amount}</dd></div> : null}
          {row.kind !== "tool" && row.location && !(row.kind === "scholarship" && row.location === "Malaysia") ? <div><dt className="inline font-semibold text-foreground">Where: </dt><dd className="inline">{row.location}</dd></div> : null}
          {row.eligibility && row.kind !== "internship" && row.kind !== "graduate" ? <div className="break-words"><dt className="inline font-semibold text-foreground">Who: </dt><dd className="inline">{row.eligibility}</dd></div> : null}
          {row.fields ? <div className="line-clamp-2 break-words"><dt className="inline font-semibold text-foreground">Fields: </dt><dd className="inline">{row.fields}</dd></div> : null}
        </dl>
        {row.summary ? <p className="mb-4 mt-2 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground sm:line-clamp-3">{row.summary}</p> : <div className="mb-4" />}

        <div className="listing-actions">
          <a href={row.link} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border/70 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-brutal-sm transition-opacity hover:opacity-90">
            {row.kind === "tool" ? "Get it" : "View details"} <ArrowUpRight className="size-3.5" />
          </a>
          {row.apply_link && row.apply_link !== row.link ? (
            <a href={row.apply_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Apply <ArrowUpRight className="size-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ResourcesView({ resources, generatedAt }: { resources: Resource[]; generatedAt: string | null }) {
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [techOnly, setTechOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [today, setToday] = useState(() => malaysiaDay(generatedAt ? new Date(generatedAt) : new Date()));
  const { ids: savedIds, toggle: toggleSaved } = useSaved();

  useEffect(() => {
    setToday(malaysiaDay());
    const value = new URL(window.location.href).searchParams.get("type");
    if (value && RESOURCE_KINDS.some((option) => option.value === value)) setKind(value as ResourceKind);
  }, []);

  const chooseKind = (value: ResourceKind | "all") => {
    setKind(value);
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("type");
    else url.searchParams.set("type", value);
    window.history.replaceState(null, "", url);
  };

  const open = useMemo(() => filterResources(resources, "all", false, "", today), [resources, today]);
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const row of open) result[row.kind] = (result[row.kind] || 0) + 1;
    return result;
  }, [open]);
  const shown = useMemo(() => filterResources(resources, kind, techOnly, query, today), [resources, kind, techOnly, query, today]);
  // "All" without a search reads as an overview: a few of each type.
  const overview = kind === "all" && !query.trim() && shown.length > 0;
  const updated = generatedAt
    ? new Date(generatedAt).toLocaleString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })
    : null;

  return (
    <div className="min-h-screen bg-background">

      <main>
        <section className="page-shell pb-4 pt-8 sm:pt-10">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Student resources</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Open scholarships, internships in Malaysia and free tools for students, with tech picks first.
            Check eligibility and deadlines with the provider before applying.
          </p>
          <p className="mt-2 text-xs text-muted-foreground" role="status">
            {open.length} open listings{updated ? ` · updated ${updated}` : ""}
          </p>
        </section>

        <div className="z-30 border-y border-border/40 bg-background/95 backdrop-blur-sm md:sticky md:top-16">
          <div className="page-shell space-y-1 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input aria-label="Search student resources" placeholder="Search scholarships, companies, fields…" value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full min-w-0 rounded-xl border border-input/70 bg-card pl-10 pr-3 text-base transition-colors placeholder:text-muted-foreground focus:border-ring md:text-sm" />
            </div>
            <div aria-label="Filter by type" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1.5">
              <Pill active={kind === "all"} onClick={() => chooseKind("all")}>All</Pill>
              {RESOURCE_KINDS.map((option) => (
                <Pill key={option.value} active={kind === option.value} onClick={() => chooseKind(kind === option.value ? "all" : option.value)}>
                  {option.label}<span className="ml-1 text-xs tabular-nums opacity-50">{counts[option.value] ?? 0}</span>
                </Pill>
              ))}
              <span className="mx-1.5 h-4 w-px shrink-0 bg-border" />
              <Pill active={techOnly} onClick={() => setTechOnly(!techOnly)}>Tech only</Pill>
              <Link href="/?category=Hackathon" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Trophy className="size-3.5" /> Hackathons & competitions
              </Link>
            </div>
          </div>
        </div>

        <div className="page-shell py-6">
          {overview ? (
            <div className="space-y-10">
              {RESOURCE_KINDS.map((option) => {
                const rows = shown.filter((row) => row.kind === option.value);
                if (!rows.length) return null;
                return (
                  <section key={option.value} aria-labelledby={`heading-${option.value}`}>
                    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                      <h2 id={`heading-${option.value}`} className="font-display text-xl font-bold tracking-tight">{SECTION_TITLE[option.value]}</h2>
                      {rows.length > 3 ? (
                        <button onClick={() => { chooseKind(option.value); window.scrollTo({ top: 0 }); }}
                          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                          See all {rows.length} <ArrowRight className="size-4" />
                        </button>
                      ) : null}
                    </div>
                    <div className="resource-preview grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.slice(0, PREVIEW).map((row) => <ResourceCard key={`${row.kind}:${row.link}`} row={row} today={today} saved={savedIds.has(row.link)} onToggle={toggleSaved} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : shown.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((row) => <ResourceCard key={`${row.kind}:${row.link}`} row={row} today={today} saved={savedIds.has(row.link)} onToggle={toggleSaved} />)}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">No open listings match. Try another type or clear the search.</p>
          )}
        </div>
      </main>
    </div>
  );
}
