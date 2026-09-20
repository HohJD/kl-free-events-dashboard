"use client";

import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { SAVED_LABELS, useSaved, type SavedKind } from "@/lib/use-saved";
import { SECTIONS } from "@/lib/site";

const ORDER: SavedKind[] = ["event", "resource", "item", "flight"];
const SECTION_FOR: Record<SavedKind, string> = { event: "/", resource: "/resources", item: "/free-items", flight: "/flights" };

export function SavedView() {
  const { saved, remove, loaded } = useSaved();

  return (
    <main className="page-shell py-8 sm:py-10">
      <h1 className="page-title">Saved</h1>
      <p className="page-sub">
        Everything you tapped the heart on, in one place. It stays in this browser, so it is private to you and needs no account.
      </p>
      <p className="page-meta">{saved.length} {saved.length === 1 ? "item" : "items"} saved</p>

      {!loaded ? null : !saved.length ? (
        <div className="mt-8 rounded-xl border border-dashed border-input bg-muted/30 px-5 py-12 text-center">
          <h2 className="font-display text-lg font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Tap the heart on an event, scholarship, free item or flight date and it will wait for you here.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SECTIONS.map((section) => (
              <Link key={section.href} href={section.href} className="chip"><section.icon className="mr-1.5 size-4" aria-hidden /> {section.label}</Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {ORDER.filter((kind) => saved.some((row) => row.kind === kind)).map((kind) => (
            <section key={kind} aria-labelledby={`saved-${kind}`}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`saved-${kind}`} className="font-display text-lg font-bold sm:text-xl">{SAVED_LABELS[kind]}</h2>
                <Link href={SECTION_FOR[kind]} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Browse more</Link>
              </div>
              <ul className="card divide-y divide-border/40 overflow-hidden">
                {saved.filter((row) => row.kind === kind).map((row) => (
                  <li key={row.id} className="flex items-center gap-3 p-3 sm:p-4">
                    <div className="min-w-0 flex-1">
                      <a href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                        className="block truncate font-semibold hover:underline">{row.title}</a>
                      {row.note ? <p className="truncate text-xs text-muted-foreground">{row.note}</p> : null}
                    </div>
                    {row.section && row.href.startsWith("http") ? (
                      <Link href={row.section} className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground sm:block">Open section</Link>
                    ) : null}
                    <a href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                      aria-label={`Open ${row.title}`} className="icon-btn size-11">
                      <ArrowUpRight className="size-4" aria-hidden />
                    </a>
                    <button type="button" onClick={() => remove(row.id)} aria-label={`Remove ${row.title}`}
                      className="icon-btn size-11 hover:text-destructive">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
