"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CalendarPlus, Check, Download, RotateCcw, Trash2 } from "lucide-react";
import { buildIcs, reminderUrl } from "@/lib/calendar";
import { malaysiaDay } from "@/lib/filter-events";
import { countdown, daysUntil } from "@/lib/tracker";
import { STATUS_LABELS, statusOf, useSaved, type SavedEntry, type TrackStatus } from "@/lib/use-saved";
import { cn } from "@/lib/utils";

const ORDER: TrackStatus[] = ["interested", "applied", "done"];
const spring = { type: "spring", bounce: 0.18, duration: 0.45 } as const;

/** The next step for a tracked item, worded for what it is. */
function nextStep(row: SavedEntry): { to: TrackStatus; label: string } {
  const status = statusOf(row);
  if (status === "interested") return { to: "applied", label: row.kind === "event" ? "I'm going" : "Applied" };
  if (status === "applied") return { to: "done", label: "Done" };
  return { to: "interested", label: "Undo" };
}

const calendarFor = (row: SavedEntry) =>
  row.date ? reminderUrl({ title: row.title, date: row.date, endDate: row.endDate, time: row.time, place: row.place, link: row.href, isDeadline: row.isDeadline }) : null;

function Ring({ value, total }: { value: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const share = total ? value / total : 0;
  return (
    <div className="relative size-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor="hsl(var(--brand))" />
            <stop offset="1" stopColor="hsl(var(--brand-2))" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
        <motion.circle cx="32" cy="32" r={r} fill="none" stroke="url(#ring)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - share) }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-extrabold tabular-nums">{Math.round(share * 100)}%</span>
    </div>
  );
}

export function SavedView() {
  const { saved, remove, setStatus, loaded } = useSaved();
  const [tab, setTab] = useState<TrackStatus>("interested");
  const [today, setToday] = useState("");
  useEffect(() => setToday(malaysiaDay()), []);

  const counts = Object.fromEntries(ORDER.map((status) => [status, saved.filter((row) => statusOf(row) === status).length])) as Record<TrackStatus, number>;
  // Soonest first; undated things sink to the bottom.
  const rows = saved
    .filter((row) => statusOf(row) === tab)
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const upNext = today
    ? saved.filter((row) => row.date && statusOf(row) !== "done" && daysUntil(row.endDate && row.endDate > row.date ? row.endDate : row.date, today) >= 0)
      .sort((a, b) => a.date!.localeCompare(b.date!)).slice(0, 6)
    : [];
  const dated = saved.filter((row) => row.date && statusOf(row) !== "done");

  const exportIcs = () => {
    const ics = buildIcs(dated.map((row) => ({ id: row.id, title: row.title, date: row.date!, endDate: row.endDate, time: row.time, place: row.place, link: row.href, isDeadline: row.isDeadline })));
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "students-repo-tracker.ics" });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="page-shell pb-16 pt-8 sm:pt-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">My <span className="text-gradient">tracker</span></h1>
          <p className="page-sub">What you&apos;re into, what you applied for, and what&apos;s done. Saved on this device, no account needed.</p>
        </div>
        {loaded && saved.length ? <Ring value={counts.done} total={saved.length} /> : null}
      </div>

      {!loaded ? null : !saved.length ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-3xl border border-dashed border-brand/40 bg-brand/5 px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden>📌</p>
          <h2 className="mt-3 font-display text-xl font-bold">Nothing tracked yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">Tap <b className="text-foreground">Track</b> on any event, scholarship or internship. It shows up here with a countdown and a one-tap calendar reminder.</p>
          <Link href="/" className="btn btn-primary btn-lg mt-6">Discover things <ArrowRight className="size-4" aria-hidden /></Link>
        </motion.div>
      ) : (
        <>
          {upNext.length ? (
            <section aria-labelledby="up-next" className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="up-next" className="font-display text-lg font-bold">Up next</h2>
                {dated.length ? (
                  <button type="button" onClick={exportIcs} className="btn btn-quiet">
                    <Download className="size-4" aria-hidden /> Export to calendar
                  </button>
                ) : null}
              </div>
              <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {upNext.map((row, index) => {
                  const days = daysUntil(row.date!, today);
                  return (
                    <motion.a key={row.id} href={row.href} target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                      className={cn("card flex w-[220px] shrink-0 snap-start flex-col p-4", index === 0 && "border-transparent bg-gradient-to-br from-brand to-brand-2 text-white")}>
                      <p className={cn("font-display text-3xl font-extrabold tabular-nums", index !== 0 && "text-gradient")}>
                        {days <= 0 ? "Now" : `${days}d`}
                      </p>
                      <p className={cn("mt-0.5 text-[11px] font-semibold uppercase tracking-wide", index === 0 ? "text-white/80" : "text-muted-foreground")}>
                        {row.isDeadline ? "Deadline" : new Date(`${row.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}{row.label ? ` · ${row.label}` : ""}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{row.title}</p>
                    </motion.a>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div role="tablist" aria-label="Status" className="mt-8 grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-card/60 p-1 backdrop-blur">
            {ORDER.map((status) => (
              <button key={status} role="tab" type="button" aria-selected={tab === status} onClick={() => setTab(status)}
                className={cn("relative flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-colors",
                  tab === status ? "text-background" : "text-muted-foreground hover:text-foreground")}>
                {tab === status ? <motion.span layoutId="status-pill" className="absolute inset-0 rounded-xl bg-foreground" transition={spring} /> : null}
                <span className="relative truncate">{status === "applied" ? "Applied" : STATUS_LABELS[status].title}</span>
                <span className="relative text-xs tabular-nums opacity-60">{counts[status]}</span>
              </button>
            ))}
          </div>

          <ul className="mt-4 grid gap-2.5 lg:grid-cols-2" role="tabpanel">
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map((row) => {
                const timer = today ? countdown(row, today) : null;
                const step = nextStep(row);
                const calendar = calendarFor(row);
                return (
                  <motion.li key={row.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: step.to === "interested" ? -40 : 40, transition: { duration: 0.2 } }} transition={spring}
                    className="card flex flex-col p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.label ? <span className="pill">{row.label}</span> : null}
                      {timer ? <span className={cn("pill", timer.hot && "pill-hot")}>{timer.text}</span> : null}
                    </div>
                    <a href={row.href} target="_blank" rel="noopener noreferrer"
                      className="mt-1.5 line-clamp-2 break-words font-display text-[17px] font-bold leading-snug hover:underline">{row.title}</a>
                    {row.note ? <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{row.note}</p> : null}
                    <div className="mt-auto flex items-center gap-1 pt-3">
                      <button type="button" onClick={() => setStatus(row.id, step.to)}
                        className={cn("btn", step.to === "interested" ? "btn-quiet" : "btn-primary")}>
                        {step.to === "interested" ? <RotateCcw className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />} {step.label}
                      </button>
                      <a href={row.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${row.title}`} className="icon-btn">
                        <ArrowUpRight className="size-[18px]" aria-hidden />
                      </a>
                      <span className="ml-auto flex items-center">
                        {calendar && statusOf(row) !== "done" ? (
                          <a href={calendar} target="_blank" rel="noopener noreferrer" aria-label="Add to Google Calendar" title="Add to Google Calendar" className="icon-btn">
                            <CalendarPlus className="size-[18px]" aria-hidden />
                          </a>
                        ) : null}
                        <button type="button" onClick={() => remove(row.id)} aria-label={`Remove ${row.title}`} className="icon-btn hover:text-destructive">
                          <Trash2 className="size-[18px]" aria-hidden />
                        </button>
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {!rows.length ? (
            <p className="mt-6 rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {tab === "interested" ? <>Nothing waiting. <Link href="/" className="font-semibold text-brand hover:underline">Find something new</Link></>
                : tab === "applied" ? "Mark things you applied for or registered to and they'll move here."
                : "Finished things land here. Nice work so far."}
            </p>
          ) : null}
          {!upNext.length && dated.length ? (
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={exportIcs} className="btn btn-quiet btn-lg"><Download className="size-4" aria-hidden /> Export to calendar</button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
