"use client";

import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 sm:py-10">
      <div className="page-shell flex flex-col items-center gap-3 text-center">
        <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          Made with <Heart className="size-3.5 fill-[#f65858] text-[#f65858]" />{" "}
          for Malaysia’s next generation
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Events sourced from Meetup, Eventbrite, Luma, AllEvents, Devpost &
          Devfolio — updates start daily at 10 AM MYT. Always confirm details on the
          event page, including student eligibility and registration requirements.
        </p>
      </div>
    </footer>
  );
}
