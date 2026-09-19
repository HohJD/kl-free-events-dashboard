"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Gift, MapPin, MessageCircle, Package, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { ITEM_CATEGORIES } from "@/lib/classify";
import { LISTING_DAYS, daysLeft, fetchItems, isWhatsAppLink } from "@/lib/free-items";
import type { FreeItem } from "@/lib/items";
import { SITE_NAME } from "@/lib/site";
import { GiveItem } from "./give-item";
import { cn } from "@/lib/utils";

function ItemCard({ item, isOwner, onRemoved }: { item: FreeItem; isOwner: boolean; onRemoved: (id: string) => void }) {
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);
  const left = daysLeft(item.added);

  const update = async (action: "claimed" | "delete") => {
    if (action === "delete" && !confirm(`Delete “${item.name}”?`)) return;
    setBusy(true);
    const table = getSupabase().from("free_items");
    const { error } = action === "delete" ? await table.delete().eq("id", item.id) : await table.update({ status: "claimed" }).eq("id", item.id);
    setBusy(false);
    if (!error) onRemoved(item.id);
  };

  const message = `Hi! I'm interested in "${item.name}" you listed on ${SITE_NAME}. Is it still available? When and where could I collect it?`;
  return (
    <article className="listing-card">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
        {item.images.length ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.images[photo]} alt={item.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center"><Package className="size-10 text-muted-foreground" aria-hidden /></div>
        )}
        <span className={cn("absolute left-3 top-3 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold",
          item.status === "available" ? "bg-[#86efac] text-black" : "bg-muted text-muted-foreground")}>
          {item.status === "available" ? "Available" : "Pickup arranged"}
        </span>
        {item.images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-1 flex justify-center">
            {item.images.map((_, i) => (
              <button key={i} type="button" onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`} className="flex size-9 items-center justify-center">
                <span className={cn("size-2.5 rounded-full border border-border", i === photo ? "bg-accent" : "bg-white/80")} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="listing-body gap-2">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.category}</span>
          <span aria-hidden>·</span>
          <span className={cn("inline-flex items-center gap-1", left <= 1 && "font-semibold text-amber-700 dark:text-amber-400")}>
            <Clock className="size-3" aria-hidden /> {left <= 1 ? "Last day" : `${left} days left`}
          </span>
        </p>
        <h3 className="listing-title">{item.name}</h3>
        {item.pickup ? (
          item.pickupLat != null && item.pickupLon != null ? (
            <a href={`https://www.google.com/maps/search/?api=1&query=${item.pickupLat},${item.pickupLon}`} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground hover:text-foreground hover:underline">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> <span className="break-words">{item.pickup}</span>
            </a>
          ) : (
            <p className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> <span className="break-words">{item.pickup}</span></p>
          )
        ) : null}
        {item.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
        <div className="listing-actions mt-auto">
          {isWhatsAppLink(item.contact) ? (
            <a href={`${item.contact}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-[#25D366] px-3.5 text-sm font-semibold text-black shadow-brutal-sm hover:-translate-y-px">
              <MessageCircle className="size-4" aria-hidden /> Claim on WhatsApp
            </a>
          ) : <span className="text-xs text-muted-foreground">No contact given</span>}
          {isOwner ? (
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => update("claimed")} disabled={busy} title="Mark as claimed"
                className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                <CheckCircle2 className="size-4" aria-hidden /> Claimed
              </button>
              <button type="button" onClick={() => update("delete")} disabled={busy} aria-label="Delete listing"
                className="flex size-11 items-center justify-center rounded-xl text-destructive hover:bg-muted disabled:opacity-50">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const STEPS = [
  { title: "Post it", text: "Snap a photo, say what it is and where to collect it." },
  { title: "Someone messages you", text: "They tap “Claim on WhatsApp”. You agree a pickup time." },
  { title: "Mark it claimed", text: `It disappears from the list. Unclaimed items vanish after ${LISTING_DAYS} days.` },
];

export function FreeItemsView({ fallback }: { fallback: FreeItem[] }) {
  const { user } = useAuth();
  const [items, setItems] = useState<FreeItem[]>(fallback);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [giving, setGiving] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState(false);

  const load = useCallback(() => {
    setState("loading");
    fetchItems().then((rows) => { setItems(rows); setState("ready"); }).catch(() => setState("error"));
  }, []);
  useEffect(() => {
    load();
    if (new URL(window.location.href).searchParams.get("give") === "1") setGiving(true);
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of items) result[item.category] = (result[item.category] || 0) + 1;
    return result;
  }, [items]);
  const shown = items.filter((item) =>
    (category === "all" || item.category === category) && (!mine || item.owner === user?.id)
    && (!query.trim() || `${item.name} ${item.pickup} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <main className="page-shell py-8 sm:py-10">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Gift className="size-4" aria-hidden /> Free items · posted by people near you</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Free things to collect</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Good stuff looking for a new home. Everything is free: message the giver on WhatsApp and pick it up.
          </p>
        </div>
        <button type="button" onClick={() => setGiving(true)}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-accent px-5 text-sm font-bold text-accent-foreground shadow-brutal-sm hover:-translate-y-px">
          <Plus className="size-4" aria-hidden /> Give something away
        </button>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="How it works">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">{i + 1}</span>
            <span><span className="block text-sm font-semibold">{step.title}</span><span className="block text-xs leading-5 text-muted-foreground">{step.text}</span></span>
          </li>
        ))}
      </ol>

      <div className="mt-6"><GiveItem open={giving} onClose={() => setGiving(false)} onListed={(item) => { setItems((prev) => [item, ...prev]); setCategory("all"); setMine(false); }} /></div>

      <div className={cn("mt-6 space-y-3", !items.length && "hidden")}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input aria-label="Search free items" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items or areas…"
            className="h-11 w-full rounded-xl border border-input/70 bg-card pl-10 pr-3 text-base placeholder:text-muted-foreground focus:border-ring md:text-sm" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Category">
          {[{ label: "all" }, ...ITEM_CATEGORIES.filter(({ label }) => counts[label] || category === label)].map(({ label }) => (
            <button key={label} type="button" onClick={() => setCategory(label)} aria-pressed={category === label}
              className={cn("fx-chip", category === label && "fx-chip-on")}>
              {label === "all" ? "All" : label}
              <span className="ml-1 text-xs tabular-nums opacity-60">{label === "all" ? items.length : counts[label] ?? 0}</span>
            </button>
          ))}
          {user ? (
            <button type="button" onClick={() => setMine(!mine)} aria-pressed={mine} className={cn("fx-chip", mine && "fx-chip-on")}>My listings</button>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        {state === "loading" && !items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
            {[0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl border border-border/50 bg-muted/50" />)}
          </div>
        ) : state === "error" && !items.length ? (
          <div className="rounded-2xl border border-dashed border-input px-5 py-12 text-center">
            <p className="font-semibold">Couldn&apos;t load free items.</p>
            <button type="button" onClick={load} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted">
              <RefreshCw className="size-4" aria-hidden /> Try again
            </button>
          </div>
        ) : shown.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item) => (
              <ItemCard key={item.id} item={item} isOwner={!!user && item.owner === user.id} onRemoved={(id) => setItems((prev) => prev.filter((row) => row.id !== id))} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-input bg-muted/30 px-5 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent"><Package className="size-7 text-accent-foreground" aria-hidden /></span>
            <h2 className="mt-4 font-display text-lg font-bold">{items.length ? "Nothing matches that" : "Nothing up for grabs right now"}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {items.length ? "Try another category or clear the search." : "Be the first: give away something you no longer need."}
            </p>
            {!items.length ? (
              <button type="button" onClick={() => setGiving(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brutal-sm">
                <Plus className="size-4" aria-hidden /> Give something away
              </button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
