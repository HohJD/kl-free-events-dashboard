"use client";

import Link from "next/link";
import { ArrowUpRight, Heart, Trash2 } from "lucide-react";
import { SAVED_LABELS, useSaved, type SavedKind } from "@/lib/use-saved";
import { SECTIONS } from "@/lib/site";

const ORDER: SavedKind[] = ["event", "resource", "item", "flight"];
const SECTION_FOR: Record<SavedKind, string> = { event: "/", resource: "/resources", item: "/free-items", flight: "/flights" };

export function SavedView() {
  const { saved, remove, loaded } = useSaved();

  return (
    <main className="page-shell py-8 sm:py-10">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Heart className="size-4" aria-hidden /> Saved on this device</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-5xl">Your saved list</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Everything you tapped the heart on, in one place. It stays in this browser, so it is private to you and does not need an account.
      </p>

      {!loaded ? null : !saved.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-input bg-muted/30 px-5 py-12 text-center">
          <h2 className="font-display text-lg font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Tap the heart on an event, scholarship, free item or flight date and it will wait for you here.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SECTIONS.map((section) => (
              <Link key={section.href} href={section.href} className="fx-chip"><section.icon className="mr-1.5 size-4" aria-hidden /> {section.label}</Link>
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
              <ul className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-card">
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
                      aria-label={`Open ${row.title}`} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
                      <ArrowUpRight className="size-4" aria-hidden />
                    </a>
                    <button type="button" onClick={() => remove(row.id)} aria-label={`Remove ${row.title}`}
                      className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-destructive">
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
