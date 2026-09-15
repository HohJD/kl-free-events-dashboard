# Free Events Malaysia

An events-only directory for students, fresh graduates and the wider Malaysian community. Tech, startup, hackathon and career events are the default focus; other categories remain available through **All events**. Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.

Giveaway listing, product uploads and account screens are no longer part of the published app. Legacy modules/data are retained rather than deleting user content. The website does not load Supabase Auth, Storage, geolocation or the item-classification model. The Hermes giveaway housekeeping step is disabled by default.

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
A configured source is not guaranteed to produce publishable listings. Devpost/Devfolio or Meetup fallback entries without explicit free-admission evidence are withheld, not assumed free. Social-media discoveries and manual suggestions must pass the same admission/location/date checks; adding a name and URL alone does not publish an event.

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

Hermes runs `kl_free_events_update` hourly at 10:00–14:00 MYT (`0 10-14 * * *`). Each run makes one attempt; after a successful deployment, the remaining slots exit silently.

`~/.hermes/scripts/kl_events_update.sh` scrapes, checks output, copies `events.json`, and deploys via Vercel CLI. A failure leaves the live deployment unchanged and exits nonzero. The latest scrape/deploy logs live in the scraper directory (`last_scrape.log`, `last_deploy.log`); the script includes a source-health summary in its output for Telegram delivery.

Manage with `hermes cron list`. For an intentional additional update after today's success, run `bash ~/.hermes/scripts/kl_events_update.sh --force`.

### Coverage and source health

Eventbrite targets the capital/major city of every Malaysian state and all three federal territories, plus Petaling Jaya and Shah Alam. Searches are capped at 18 listing pages; detailed admission verification is capped at 48 event pages/5 minutes per run, distributed between locations. AllEvents details have a 20-page cap. Other platforms retain their existing coverage. A search returning no qualifying data is not a claim that the state has no events.

Only quality-version-2 records appear on the site: explicit free admission, a valid date within the next 180 days, a known Malaysian state (or online), a venue, and an allowlisted platform URL. Paid/mixed tickets, sold-out or cancelled structured listings, missing prices, undated entries, conditional-free offers, private/invitation-only events, and specified low-quality promotions are excluded. Eventbrite and AllEvents detail-page schema is used to confirm free admission; `source_health.json` and output `quality`/`coverage` summaries retain results.

State filtering includes all 13 states, 3 federal territories and Online. Malaysia-time dates and counts refresh every minute. Share state links as `?state=penang`; add `&browse=all` to include all categories. Old `#collect` links also land on events. Topic-based focus does not certify that every event admits all students or graduates: visitors must check organizer eligibility and registration terms.

The scraper keeps `source_health.json` with the last 30 runs. Repeated failures cause a single-run cooldown followed by a recheck. Zero-result failed/cooldown sources may retain dated upcoming listings for at most 48 hours; these show a stale-data warning. Healthy empty results do not retain old entries. No production code is rewritten automatically, and no new sources are auto-approved.

Run `python3 kl_events_scraper.py --health-report` in the scraper directory to inspect status without scraping. Source listing labels and keyword categories remain heuristics, not guarantees of free entry, eligibility or perfect classification. Visitors should confirm details with organizers.

### Verification

```bash
npm run lint
npx tsc --noEmit
npx tsx scripts/test-filter-events.ts
npm run build
```

In the scraper directory: `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_kl_events_scraper test_event_quality`.

Do not run the dev server and production build against the same `dist/` directory at the same time.
