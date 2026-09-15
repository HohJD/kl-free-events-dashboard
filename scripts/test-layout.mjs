import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.TEST_URL || 'http://127.0.0.1:3100';
const output = process.env.SCREENSHOT_DIR || tmpdir();
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#f4e7c2"/></svg>';
const browser = await chromium.launch({ channel: 'chrome' });
let checked = 0;
try {
  for (const width of [320, 375, 390, 768, 1440]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await context.addInitScript(theme => localStorage.setItem('theme', theme), theme);
      const forbiddenRequests = [];
      await context.route('**/*', route => {
        const request = route.request();
        const url = new URL(request.url());
        if (/supabase|huggingface|cdn.jsdelivr.net/.test(url.hostname)) forbiddenRequests.push(url.hostname);
        if (url.origin !== new URL(base).origin) {
          if (request.resourceType() === 'image') return route.fulfill({ contentType: 'image/svg+xml', body: svg });
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/#collect`);
      await page.getByRole('combobox', { name: 'Filter events by state' }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.getByRole('button', { name: /give something away|sign in|upload|collect/i }).count(), 0);
      assert.equal(await page.locator('input[type=file]').count(), 0);
      for (const mode of ['Tech, startups & careers', 'All events']) {
        await page.getByRole('button', { name: mode, exact: true }).click();
        await page.waitForTimeout(600);
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
        assert.ok(dimensions.document <= width + 1, `${mode}/${theme}/${width}: overflow ${JSON.stringify(dimensions)}`);
        for (const tab of await page.getByRole('navigation', { name: 'Event focus' }).getByRole('button').all()) {
          const box = await tab.boundingBox();
          assert.ok(box.x >= 0 && box.x + box.width <= width + 1 && box.height >= 44, 'Focus tab clipped or too small');
        }
        const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
        const cards = page.locator('.listing-card');
        const total = await cards.count();
        assert.ok(total > 0, 'Expected current qualifying event fixtures');
        const first = await cards.first().boundingBox();
        assert.ok(Math.abs(first.x - heading.x) < 2, 'Heading/grid alignment');
        if (width >= 768) {
          const count = Math.min(total, width >= 1024 ? 3 : 2);
          const boxes = await Promise.all(Array.from({ length: count }, (_, i) => cards.nth(i).boundingBox()));
          for (const box of boxes) {
            assert.ok(Math.abs(box.y - boxes[0].y) < 2, 'Card tops uneven');
            assert.ok(Math.abs(box.height - boxes[0].height) < 2, 'Card heights uneven');
          }
        }
        if ([320, 1440].includes(width)) await page.screenshot({ path: join(output, `events-only-${mode.startsWith('Tech') ? 'focus' : 'all'}-${theme}-${width}.png`) });
        checked++;
      }
      const search = page.getByRole('textbox', { name: 'Search events' });
      await search.fill('no-result-layout-test-12345');
      await page.getByRole('heading', { name: 'No events found' }).waitFor();
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      const state = page.getByRole('combobox', { name: 'Filter events by state' });
      assert.equal(await state.locator('option').count(), 18);
      await state.selectOption('perlis');
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: 'Map view', exact: true }).click();
      await page.locator('.leaflet-container').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Map overflow');
      assert.deepEqual(errors, [], `Browser errors at ${theme}/${width}`);
      assert.deepEqual(forbiddenRequests, [], 'Retired upload/auth/model services still loaded');
      await context.close();
    }
  }
  console.log(`Passed ${checked} events-only layouts, focus/all modes, all state options, empty states and map. No upload/auth service calls. Screenshots: ${output}`);
} finally {
  await browser.close();
}
