"use client";

import { useCallback, useSyncExternalStore } from "react";

export type SavedKind = "event" | "resource" | "item" | "flight";

export interface SavedEntry {
  id: string;
  kind: SavedKind;
  title: string;
  /** One line of context, e.g. a date, a deadline or a fare. */
  note?: string;
  /** Where the thing lives: an external page or a link into this site. */
  href: string;
  /** Section page to reopen it in context, when different from href. */
  section?: string;
  savedAt: string;
}

const KEY = "free-things-saved-v1";
const LEGACY_EVENTS_KEY = "kl-events-favorites";

// One shared list so the header count, the section pages and the Saved page
// always agree, in this tab and in other tabs.
let entries: SavedEntry[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: SavedEntry[] = [];

function load(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const rows: SavedEntry[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(rows) && rows.length) return rows.filter((row) => row && row.id && row.kind);
    // One-time migration of events saved before the Saved page existed.
    const legacy = localStorage.getItem(LEGACY_EVENTS_KEY);
    const links: string[] = legacy ? JSON.parse(legacy) : [];
    return links.map((link) => ({ id: link, kind: "event" as const, title: link, href: link, section: "/", savedAt: "" }));
  } catch {
    return [];
  }
}

function read(): SavedEntry[] {
  if (entries === null) entries = typeof window === "undefined" ? [] : load();
  return entries;
}

function publish(rows: SavedEntry[]) {
  entries = rows;
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
    localStorage.removeItem(LEGACY_EVENTS_KEY);
  } catch {
    // storage full or blocked; the list lasts for this visit only
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const fromOtherTab = (event: StorageEvent) => {
    if (event.key === KEY) { entries = load(); listener(); }
  };
  window.addEventListener("storage", fromOtherTab);
  return () => { listeners.delete(listener); window.removeEventListener("storage", fromOtherTab); };
}

/** Saved things across the site, kept in this browser only. */
export function useSaved() {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((entry: Omit<SavedEntry, "savedAt">) => {
    const current = read();
    publish(current.some((row) => row.id === entry.id)
      ? current.filter((row) => row.id !== entry.id)
      : [{ ...entry, savedAt: new Date().toISOString() }, ...current]);
  }, []);
  const remove = useCallback((id: string) => publish(read().filter((row) => row.id !== id)), []);
  return { saved, ids: new Set(saved.map((row) => row.id)), toggle, remove, loaded: entries !== null };
}

export const SAVED_LABELS: Record<SavedKind, string> = {
  event: "Events",
  resource: "Scholarships, internships & tools",
  item: "Free items",
  flight: "Flights",
};
