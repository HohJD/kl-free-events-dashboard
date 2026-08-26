"use client";

import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8">
      <div className="container mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
        <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          Made with <Heart className="size-3.5 fill-[#f65858] text-[#f65858]" />{" "}
          in Kuala Lumpur
        </p>
        <p className="text-xs text-muted-foreground/70">
          Events sourced from Meetup, Eventbrite, Luma, AllEvents, Devpost &
          Devfolio — refreshed daily at 7 AM MYT. Always confirm details on the
          event page.
        </p>
      </div>
    </footer>
  );
}
