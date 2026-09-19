// Whole-site checks: every section at phone, tablet and desktop widths in both themes.
// Serve dist/ first (npx serve dist -l 3100). Free-items reads are served from a fixture;
// nothing is written to Supabase.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.TEST_URL || 'http://localhost:3100';
const PHOTO = 'https://rdqfibpnlizxgkqzcnee.supabase.co/storage/v1/object/public/item-pics/test.jpg';
const FIXTURE = [
  { id: '1', name: 'IKEA desk lamp', description: '', images: [PHOTO], condition: 'Good', pickup: 'SS15, Subang Jaya', contact: 'https://wa.me/60123456789', status: 'available', category: 'Furniture', owner: 'x', pickup_lat: 3.07, pickup_lon: 101.59, created_at: new Date().toISOString() },
  { id: '2', name: 'Python textbook', description: '', images: [PHOTO], condition: 'Good', pickup: 'Bangsar', contact: 'https://wa.me/60123456780', status: 'available', category: 'Books & Media', owner: 'y', pickup_lat: null, pickup_lon: null, created_at: new Date().toISOString() },
];
const ROUTES = [
  { path: '/', tab: 'Events', ready: 'h1' },
  { path: '/resources', tab: 'Resources', ready: 'h1' },
  { path: '/free-items', tab: 'Free items', ready: 'article' },
  { path: '/flights', tab: 'Flights', ready: '#calendar-heading' },
];

const browser = await chromium.launch({ channel: 'chrome' });
let checks = 0;
for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await context.route('**/rest/v1/free_items**', (route) => route.fulfill({ json: FIXTURE }));
    await context.route('**/storage/v1/object/public/item-pics/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"/>' }));
    for (const { path, tab, ready } of ROUTES) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.locator(ready).first().waitFor();
      const label = `${path} ${theme} ${width}`;
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: horizontal overflow`);
      const nav = width < 768 ? page.locator('nav.site-tabs') : page.locator('header nav[aria-label="Sections"]');
      assert.ok(await nav.isVisible(), `${label}: navigation hidden`);
      const current = nav.locator('a[aria-current="page"]');
      assert.equal(await current.count(), 1, `${label}: one active section`);
      assert.match(await current.innerText(), new RegExp(tab === 'Resources' && width >= 768 ? 'Student resources' : tab === 'Flights' && width >= 768 ? 'Flight deals' : tab), `${label}: active tab`);
      assert.deepEqual(errors, [], `${label}: browser errors`);
      checks++;
      await page.close();
    }
    await context.close();
  }
}

// Key flows.
const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
await context.route('**/rest/v1/free_items**', (route) => route.fulfill({ json: FIXTURE }));
const page = await context.newPage();
await page.goto(BASE + '/free-items', { waitUntil: 'networkidle' });
assert.equal(await page.locator('article').count(), 2);
await page.getByRole('button', { name: /^Books & Media/ }).click();
assert.equal(await page.locator('article').count(), 1);
assert.match(await page.locator('a', { hasText: 'Claim on WhatsApp' }).getAttribute('href'), /^https:\/\/wa\.me\/60123456780\?text=/);
await page.getByRole('button', { name: /Give something away/ }).first().click();
assert.ok(await page.getByText('Step 1 of 2').isVisible(), 'Signed-out givers see the sign-in step');
await page.goto(BASE + '/flights', { waitUntil: 'networkidle' });
await page.locator('button.fx-cell').nth(3).click();
assert.match(page.url(), /date=\d{4}-\d{2}-\d{2}/);
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.locator('nav.site-tabs a', { hasText: 'Free items' }).click();
await page.waitForURL(/free-items/);
await browser.close();
console.log(`Passed ${checks} page/theme/width checks and the free-items, flights and navigation flows.`);
