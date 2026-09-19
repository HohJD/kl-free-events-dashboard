import Link from "next/link";
import { SECTIONS, SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 sm:py-10">
      <div className="page-shell grid gap-6 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-display text-base font-bold">{SITE_NAME}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            A self-updating board of free things for students and young people in Malaysia. Events, resources and fares
            are collected every day from Eventbrite, Luma, AllEvents, Devpost, Google Developer Groups, MLH, Afterschool.my,
            Hiredly and Google Flights; free items are posted by people giving things away. Always confirm details with the
            organiser or provider.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} className="text-muted-foreground hover:text-foreground">{section.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
