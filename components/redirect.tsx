"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Client-side redirect for pages that moved; works in a static export. */
export function Redirect({ to, label }: { to: string; label: string }) {
  useEffect(() => { window.location.replace(to); }, [to]);
  return (
    <main className="page-shell py-16 text-center">
      <p className="text-sm text-muted-foreground">Taking you to {label}…</p>
      <Link href={to} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-border bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brutal-sm">
        Continue
      </Link>
    </main>
  );
}
