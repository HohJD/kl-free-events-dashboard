# Development checks

## Current product scope (September 20)

- Free Things Malaysia: three sections sharing one header (desktop links) and a phone tab bar (`components/site-header.tsx`, `lib/site.ts`), plus one footer in `app/layout.tsx`, and a Saved page:
  - `/` **Opportunities**: events, hackathons, scholarships, internships, graduate roles and free tools in one list (`lib/opportunities.ts` maps events and resources into one `Opportunity` shape; `components/opportunity-card.tsx` renders both). Type chips filter by kind, and the toolbar keeps search, dates, sort, location, source, saved and the map (events only). `?type=`, `?state=`, `?browse=all` and `?category=Hackathon` deep links work; `/resources` redirects to `?type=scholarship`.
  - `/free-items` giveaway board, `/flights` KL ⇄ London fare calendar, `/saved` everything saved.
  - Rolling listings (tools, internships with no deadline) always count as open; nationwide and online listings survive a state filter.
- Saving works across the site: `lib/use-saved.ts` is one shared store (useSyncExternalStore, localStorage key `free-things-saved-v1`, migrates the old `kl-events-favorites` links) used by events, resources, free items and flight dates; `/saved` groups them by kind, and the header heart shows the count. No account needed.
- The free-items form takes up to 3 photos (first is the cover), an optional description and condition behind "Add details", and suggests a category from the name keywords or, failing that, from the first photo (Transformers.js CLIP from cdn.jsdelivr.net, ~25 MB, cached, skipped on 2G/data saver). Owners can reserve/un-reserve (status `pending`), mark claimed or delete.
- Listings disappear after 7 days; the Hermes script deletes expired/claimed rows and their photos daily (`scripts/cleanup-items.mjs`, service key in `~/.secrets/supabase-kl-service-key`; `FREE_ITEMS_CLEANUP=0` skips it).
- `vercel.json` CSP allows connections to the site, the Supabase project (https and wss), nominatim.openstreetmap.org and the category model's hosts (cdn.jsdelivr.net, huggingface.co, *.hf.co) with 'wasm-unsafe-eval' and blob: workers; `geolocation=(self)` is allowed for the pickup-area button.
- Publish only quality-version-2 event records with explicit free-admission evidence. Eligibility must be confirmed on the source, not inferred from the audience focus.
- Checks: `scripts/test-layout.mjs` covers the events page and asserts it makes no Supabase/Hugging Face calls; `scripts/test-site.mjs` covers every section at 320/390/768/1440 px in both themes (no overflow, correct active tab, no browser errors) and the free-items, flights and navigation flows, serving Supabase reads from a fixture (no writes).

- Run `npm run lint`, `npx tsc --noEmit`, `npx tsx scripts/test-filter-events.ts`, and `npm run build` for changes to the dashboard. `tsx` is pinned as a dev dependency.
- Static export uses `dist/`. Do not run a development server and production build concurrently against that directory.
- UI browser checks: build, serve `dist/` on localhost:3100, then run `node scripts/test-layout.mjs` and `node scripts/test-site.mjs` (uses installed Google Chrome through pinned Playwright). It tests 320/375/390/768/1440px in light/dark, mocks Supabase/image responses with synthetic fixtures, checks overflow/alignment/action rows and navigation, and writes screenshots to the OS temp directory. Override `TEST_URL` or `SCREENSHOT_DIR` as needed. It performs no real uploads or database writes.
- Layout conventions: `.page-shell` is the shared horizontal gutter/container; `.section-heading`, `.listing-card`, `.listing-body`, `.listing-title`, and `.listing-actions` live in `app/globals.css`. Keep the soft poster visual style, and 44px primary touch controls.
- The scraper is maintained separately at `/Users/hohjiada/kl-free-events-scraper`. Its offline regression suite is `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_kl_events_scraper`.
- Event state slugs are serialized in `events.json`. Missing state is `unknown`, never assume Kuala Lumpur. The navbar state selector affects events only, not user-uploaded items.
- Date filtering uses Asia/Kuala_Lumpur irrespective of visitor/server timezone. Undated entries must not match Today or Upcoming. Stale carried-forward source results expire after 48 hours.
- Hermes uses `~/.hermes/scripts/kl_events_update.sh` at 10:00–14:00 MYT, once per hour until success. `--force` explicitly bypasses today's success marker. Preserve live data on failed scrapes. Latest operational logs and source health are in the scraper directory, not the public site.
- Do not equate a source's successful HTTP response or a free search-page label with independently verified free public admission.
