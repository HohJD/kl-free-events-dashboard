"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CalendarPlus, Check, Download, RotateCcw, Trash2 } from "lucide-react";
import { buildIcs, reminderUrl } from "@/lib/calendar";
import { malaysiaDay } from "@/lib/filter-events";
import { countdown, daysUntil } from "@/lib/tracker";
import { STATUS_LABELS, statusOf, useSaved, type SavedEntry, type TrackStatus } from "@/lib/use-saved";
import { KIND_EMOJI, KIND_LABELS, KIND_ORDER } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

const ORDER: TrackStatus[] = ["interested", "applied", "done"];
const EMOJI_FOR_LABEL: Record<string, string> = Object.fromEntries(KIND_ORDER.map((kind) => [KIND_LABELS[kind].one, KIND_EMOJI[kind]]));
const emojiFor = (row: SavedEntry) => (row.label && EMOJI_FOR_LABEL[row.label]) || (row.kind === "event" ? "🎉" : "📌");
const CHEERS = ["Nice one! 🎉", "Another one done ✨", "Look at you go 🚀", "Crushing it 💪", "Big W 🏆"];
const spring = { type: "spring", bounce: 0, duration: 0.35 } as const;

/** What signing up is called on the organiser's side. */
function signUpLabel(row: SavedEntry): string {
  if (row.label === "Free tool") return "Get it";
  return row.kind === "event" ? "Register" : "Apply";
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
        <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        <motion.circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - share) }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{Math.round(share * 100)}%</span>
    </div>
  );
}

export function SavedView() {
  const { saved, remove, setStatus, loaded } = useSaved();
  const [tab, setTab] = useState<TrackStatus>("interested");
  const [cheer, setCheer] = useState<string | null>(null);
  const move = (row: SavedEntry, to: TrackStatus) => {
    setStatus(row.id, to);
    if (to !== "done") return;
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    window.setTimeout(() => setCheer(null), 2200);
  };
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
    const link = Object.assign(document.createElement("a"), { href: url, download: "student-repo-tracker.ics" });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="page-shell pb-16 pt-8 sm:pt-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">My tracker</h1>
          <p className="page-sub">Save it, sign up on the organiser&apos;s page, tick it off. Kept on this device, no account needed.</p>
        </div>
        {loaded && saved.length ? <Ring value={counts.done} total={saved.length} /> : null}
      </div>

      {!loaded ? null : !saved.length ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-3xl border border-dashed border-input bg-card px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden>📌</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Nothing tracked yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">Tap <span className="font-medium text-foreground">Track</span> on any event, scholarship or internship. It shows up here with a countdown and a one-tap calendar reminder.</p>
          <Link href="/" className="btn btn-primary btn-lg mt-6">Discover things <ArrowRight className="size-4" aria-hidden /></Link>
        </motion.div>
      ) : (
        <>
          {upNext.length ? (
            <section aria-labelledby="up-next" className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="up-next" className="eyebrow">Up next</h2>
                {dated.length ? (
                  <button type="button" onClick={exportIcs} className="btn btn-quiet">
                    <Download className="size-4" aria-hidden /> Export to calendar
                  </button>
                ) : null}
              </div>
              <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {upNext.map((row, index) => {
                  const days = daysUntil(row.date!, today);
                  return (
                    <motion.a key={row.id} href={row.href} target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                      className={cn("card flex w-[210px] shrink-0 snap-start flex-col p-4", index === 0 && "-rotate-1 border-primary bg-primary text-primary-foreground")}>
                      <p className="text-3xl font-semibold tabular-nums tracking-tight">
                        {days <= 0 ? "Now" : `${days}d`}
                      </p>
                      <p className={cn("mt-1 text-[11px] font-medium uppercase tracking-[0.08em]", index === 0 ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {emojiFor(row)} {row.isDeadline ? "Deadline" : new Date(`${row.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug">{row.title}</p>
                    </motion.a>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div role="tablist" aria-label="Status" className="mt-8 grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
            {ORDER.map((status) => (
              <button key={status} role="tab" type="button" aria-selected={tab === status} onClick={() => setTab(status)}
                className={cn("relative flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-medium transition-colors",
                  tab === status ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {tab === status ? <motion.span layoutId="status-pill" className="absolute inset-0 rounded-full bg-card shadow-sm dark:bg-input" transition={spring} /> : null}
                <span className="relative truncate">{STATUS_LABELS[status].title}</span>
                <span className="relative text-xs tabular-nums opacity-60">{counts[status]}</span>
              </button>
            ))}
          </div>

          <ul className="mt-4 grid gap-2.5 lg:grid-cols-2" role="tabpanel">
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map((row) => {
                const timer = today ? countdown(row, today) : null;
                const status = statusOf(row);
                const calendar = calendarFor(row);
                return (
                  <motion.li key={row.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: status === "done" ? -40 : 40, transition: { duration: 0.2 } }} transition={spring}
                    className="card flex flex-col p-4">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {row.label ? <span>{emojiFor(row)} {row.label}</span> : null}
                      {row.label && timer ? <span aria-hidden>·</span> : null}
                      {timer ? <span className={cn("pill", timer.hot && "pill-hot")}>{timer.text}</span> : null}
                    </p>
                    <a href={row.href} target="_blank" rel="noopener noreferrer"
                      className="mt-1 line-clamp-2 break-words text-[15px] font-semibold leading-snug tracking-tight underline-offset-4 hover:underline">{row.title}</a>
                    {row.note ? <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{row.note}</p> : null}
                    <div className="mt-auto flex items-center gap-1 pt-3">
                      {status === "interested" ? (
                        // Signing up happens on the organiser's page; opening it moves the card to "Signed up".
                        <a href={row.href} target="_blank" rel="noopener noreferrer" onClick={() => move(row, "applied")} className="btn btn-primary">
                          {signUpLabel(row)} <ArrowUpRight className="size-4" aria-hidden />
                        </a>
                      ) : status === "applied" ? (
                        <>
                          <button type="button" onClick={() => move(row, "done")} className="btn btn-primary">
                            <Check className="size-4" strokeWidth={2.5} aria-hidden /> Done
                          </button>
                          <a href={row.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${row.title}`} title="Open page" className="icon-btn">
                            <ArrowUpRight className="size-[18px]" aria-hidden />
                          </a>
                          <button type="button" onClick={() => move(row, "interested")} aria-label="Move back to Saved" title="Didn't sign up? Move back" className="icon-btn">
                            <RotateCcw className="size-[18px]" aria-hidden />
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => move(row, "applied")} className="btn btn-quiet">
                          <RotateCcw className="size-4" aria-hidden /> Undo
                        </button>
                      )}
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
            <p className="mt-6 rounded-3xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              {tab === "interested" ? <>Nothing waiting. <Link href="/" className="font-medium text-foreground underline underline-offset-4">Find something new</Link></>
                : tab === "applied" ? "Tap Register or Apply on a saved item and it moves here."
                : "Finished things land here. You got this 💪"}
            </p>
          ) : null}
          {!upNext.length && dated.length ? (
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={exportIcs} className="btn btn-quiet btn-lg"><Download className="size-4" aria-hidden /> Export to calendar</button>
            </div>
          ) : null}
        </>
      )}
      <AnimatePresence>
        {cheer ? (
          <motion.div role="status" initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.45 }}
            className="toast fixed inset-x-0 z-[55] mx-auto w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl">
            {cheer}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
