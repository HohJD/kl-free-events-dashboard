# KL Free Events Dashboard

A beautiful, static, single-page dashboard for free events in Kuala Lumpur. Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

## Features

- **Hero section** with live event counts (total, sources, today, this week)
- **Search & filter bar** by keyword, source, category, and date range
- **Interactive event map** (Leaflet) with theme-aware tiles and per-source colored markers — reflects active filters
- **Responsive event cards** with real event images (fallback gradient art), title, date, time, venue, source badge, event link, and Google Maps directions
- **Dark mode toggle** with system preference support
- **Smooth animations** powered by Framer Motion
- **Mobile-first responsive** design

## Data sources

Events are scraped by `../kl-free-events-scraper/kl_events_scraper.py` from:

- Meetup
- Eventbrite
- Luma (lu.ma)
- AllEvents.in
- Devpost (hackathons)
- Devfolio (hackathons)
- `manual_events.json` — hand-curated events found on Facebook, X, Instagram,
  government announcements, posters, etc. Edit
  `../kl-free-events-scraper/manual_events.json` (or ask your Hermes agent on
  Telegram to add an entry) and it's published on the next daily run. Manual
  entries win over scraped duplicates.

Facebook, X, and Instagram cannot be scraped directly (login walls, paid/closed
APIs) — the manual file is the supported channel for events found there.

## Project structure

```
app/
  globals.css          # Tailwind CSS variables and base styles
  layout.tsx           # Root layout with Geist local fonts + theme provider
  page.tsx             # Server page that loads events.json
  providers.tsx        # next-themes provider
components/
  dashboard.tsx        # Client dashboard wiring
  event-card.tsx       # Individual event card
  event-grid.tsx       # Filtered grid of event cards
  filters.tsx          # Search and filter controls
  hero.tsx             # Hero with stats
  navbar.tsx           # Sticky navbar + theme toggle
  theme-toggle.tsx     # Dark/light mode switch
  ui/                  # shadcn/ui-style components (Button, Card, Badge, Input)
lib/
  events.ts            # Events.json loader + categorisation/image helpers
  utils.ts             # cn() utility
events.json            # Source data from the scraper
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

3. **Build a static export**

   ```bash
   npm run build
   ```

   Static files are output to the `dist/` directory. Open `dist/index.html` in a browser or serve it:

   ```bash
   npx serve dist
   ```

## Data

The dashboard reads from `events.json` at build time. Past events are automatically removed by the scraper.

### Automated daily updates

A Hermes cron job (`kl_free_events_update`, daily at 07:00 MYT) runs
`~/.hermes/scripts/kl_events_update.sh`, which:

1. Runs the scraper (`~/kl-free-events-scraper/kl_events_scraper.py --run-once`)
2. Copies the fresh `events.json` into this project
3. Deploys to Vercel (`vercel --prod`)
4. Sends a summary to Telegram

Manage it with `hermes cron list` / `hermes cron run kl_free_events_update`.
