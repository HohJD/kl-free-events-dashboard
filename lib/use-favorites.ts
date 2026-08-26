"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kl-events-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    } catch {
      // corrupted storage; start fresh
    }
    setLoaded(true);
  }, []);

  const toggle = useCallback((link: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(link)) next.delete(link);
      else next.add(link);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // storage full/unavailable; favorites stay in-memory
      }
      return next;
    });
  }, []);

  return { favorites, toggle, loaded };
}
