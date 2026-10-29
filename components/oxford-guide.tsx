"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const LINKS = [
  { title: "Find a micro-internship", note: "Short placements for Oxford University students", href: "https://www.ox.ac.uk/careers/internships/the-micro-internship-programme" },
  { title: "Careers & CareerConnect", note: "Appointments, vacancies and events · student login", href: "https://www.ox.ac.uk/careers" },
  { title: "Funding & financial support", note: "Check University and college eligibility", href: "https://www.ox.ac.uk/students/fees-funding/assistance" },
];

export function OxfordGuide() {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (details.current) details.current.open = window.matchMedia("(min-width: 1024px)").matches;
  }, []);
  return (
    <aside className="oxford-guide min-w-0 rounded-3xl p-4 lg:p-6" aria-label="Oxford student essentials">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">The Oxford desk</p>
      <h2 className="mt-2 text-xl lg:text-2xl font-semibold tracking-tight">Your university shortcuts.</h2>
      <p className="mt-2 hidden text-sm leading-relaxed opacity-75 lg:block">Go straight to the University’s services.</p>
      <details ref={details} className="mt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold">Official student essentials</summary>
        <div className="divide-y divide-current/20">
          {LINKS.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-start justify-between gap-3 py-3 focus-visible:outline-current">
            <span><span className="block text-sm font-semibold">{link.title}</span><span className="mt-1 block text-xs leading-relaxed opacity-70">{link.note}</span></span>
            <ArrowUpRight className="mt-0.5 size-4 shrink-0" aria-hidden />
          </a>)}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed opacity-65">Independent student guide. Not affiliated with the University of Oxford.</p>
      </details>

    </aside>
  );
}
