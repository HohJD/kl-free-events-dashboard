# Development checks

## Current product scope (September 15)

- Events only. Do not reintroduce Collect, item uploads, auth, location capture or product-classification models into the active app. Existing modules/records are retained, not deleted. Legacy `#collect` URLs must show events.
- Default focus is Tech, Business, Careers and Hackathon, with All events preserving other community categories. Eligibility must be confirmed on the source, not inferred from the audience focus.
- Publish only quality-version-2 event records with explicit free-admission evidence. The scraper now searches all 13 states and 3 federal territories with bounded requests. State coverage is a search target, not a guarantee of complete listings.
- The Hermes retired giveaway cleanup is disabled unless explicitly opted in with `ENABLE_RETIRED_GIVEAWAY_CLEANUP=1`.
- Browser layout checks are now events-only, focused/all modes across both themes and five widths, and assert no Supabase/Hugging Face calls. They perform no database writes.
- Scraper regression command now includes `test_event_quality` as well as `test_kl_events_scraper`.

- `/resources` (September 19) lists student scholarships, internships and free tools from `resources.json`, written by the scraper and copied by the Hermes script. `lib/resources.ts` is client-safe (types, filtering); `lib/load-resources.ts` reads the file at build time. A missing file renders an empty page. The events page links to it and accepts `?category=Hackathon` deep links.
- `/flights` (September 20) is a KL ⇄ London fare calendar read from `flights.json` v2 (scraper `flight_prices.py`, copied by Hermes). Default: KL → London return, 2-week stay; trip and stay chips; tiles for cheapest trip, usual fare, book-now outlook; a two-month calendar (one on phones) where every day shows its fare, hovering or selecting shades the whole trip and marks the return day; a panel with the fare, signal, cheaper nearby dates, the same departure at other stay lengths, flight details when checked, and a Google Flights link; 10 cheapest trips; an "are fares rising?" chart from the daily index. `?route=&stay=&date=` deep links. Classes built from variables (`fx-seq-*`, `fx-badge-*`) live outside `@layer` so Tailwind keeps them. Do not commit `flights.json` or other scraper data files from a worktree.
- Events carry `quality_score` and `topics` from the scraper. "Top picks" (default) ranks by score in 10-point bands, soonest first within a band; "Soonest" is plain date order.

- Run `npm run lint`, `npx tsc --noEmit`, `npx tsx scripts/test-filter-events.ts`, and `npm run build` for changes to the dashboard. `tsx` is pinned as a dev dependency.
- Static export uses `dist/`. Do not run a development server and production build concurrently against that directory.
- UI browser checks: build, serve `dist/` on localhost:3100, then run `node scripts/test-layout.mjs` (uses installed Google Chrome through pinned Playwright). It tests 320/375/390/768/1440px in light/dark, mocks Supabase/image responses with synthetic fixtures, checks overflow/alignment/action rows and navigation, and writes screenshots to the OS temp directory. Override `TEST_URL` or `SCREENSHOT_DIR` as needed. It performs no real uploads or database writes.
- Layout conventions: `.page-shell` is the shared horizontal gutter/container; `.section-heading`, `.listing-card`, `.listing-body`, `.listing-title`, and `.listing-actions` live in `app/globals.css`. Keep the soft poster visual style, and 44px primary touch controls.
- The scraper is maintained separately at `/Users/hohjiada/kl-free-events-scraper`. Its offline regression suite is `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_kl_events_scraper`.
- Event state slugs are serialized in `events.json`. Missing state is `unknown`, never assume Kuala Lumpur. The navbar state selector affects events only, not user-uploaded items.
- Date filtering uses Asia/Kuala_Lumpur irrespective of visitor/server timezone. Undated entries must not match Today or Upcoming. Stale carried-forward source results expire after 48 hours.
- Hermes uses `~/.hermes/scripts/kl_events_update.sh` at 10:00–14:00 MYT, once per hour until success. `--force` explicitly bypasses today's success marker. Preserve live data on failed scrapes. Latest operational logs and source health are in the scraper directory, not the public site.
- Do not equate a source's successful HTTP response or a free search-page label with independently verified free public admission.
