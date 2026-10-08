// Phone flow check: every step a student takes, at common phone widths, in both themes.
// Fails on any page error or console error (hydration warnings included) and on sideways overflow.
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.TEST_URL || 'http://127.0.0.1:3100';
const output = process.env.SCREENSHOT_DIR || tmpdir();
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#ddd"/></svg>';
const browser = await chromium.launch({ channel: 'chrome' });
let runs = 0;
try {
  for (const width of [320, 375, 390, 430]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await context.addInitScript(t => localStorage.setItem('theme', t), theme);
      await context.route('**/*', route => {
        const request = route.request();
        if (new URL(request.url()).origin === new URL(base).origin) return route.continue();
        return request.resourceType() === 'image' ? route.fulfill({ contentType: 'image/svg+xml', body: svg }) : route.abort();
      });
      const page = await context.newPage();
      const problems = [];
      page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) problems.push(`console: ${message.text()}`); });
      const noOverflow = async step => {
        const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(wide <= 1, `${width}/${theme} ${step}: ${wide}px sideways overflow`);
      };
      const tapTargets = async (locator, step) => {
        for (const box of await Promise.all((await locator.all()).map(item => item.boundingBox()))) {
          if (box) assert.ok(box.height >= 40, `${width}/${theme} ${step}: tap target ${box.height}px tall`);
        }
      };

      await page.goto(`${base}/`);
      await page.getByRole('textbox', { name: 'Search listings' }).waitFor();
      await noOverflow('home');
      await tapTargets(page.getByRole('navigation', { name: 'Type' }).getByRole('button'), 'type tabs');
      await tapTargets(page.locator('article.card').first().locator('a, button'), 'card actions');

      // The toolbar stays on one row on phones.
      const toolbar = await page.locator('.page-shell:has(> div > input[aria-label="Search listings"])').boundingBox();
      assert.ok(toolbar.height <= 60, `${width}/${theme}: toolbar wrapped (${toolbar.height}px)`);

      // Filters sheet: pick a date, a state, then come back.
      await page.getByRole('button', { name: /^Filters/ }).click();
      const sheet = page.getByRole('dialog');
      await sheet.getByRole('button', { name: 'This week' }).click();
      await sheet.getByRole('combobox', { name: 'Location' }).selectOption('selangor');
      await noOverflow('filter sheet');
      await sheet.getByRole('button', { name: /^Show/ }).click();
      await page.getByRole('button', { name: /^Filters, 2 active/ }).waitFor();
      await page.getByRole('button', { name: /^Filters/ }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Clear all' }).click();
      await page.getByRole('dialog').getByRole('button', { name: /^Show/ }).click();

      // Track two things, use the toast, then switch type and view.
      await page.getByRole('button', { name: /^Track / }).first().click();
      await page.getByRole('status').waitFor();
      await noOverflow('toast');
      if (runs === 0) await page.screenshot({ path: join(output, `phone-toast-${width}-${theme}.png`) });
      await page.getByRole('navigation', { name: 'Type' }).getByRole('button', { name: /^Scholarships/ }).click();
      await page.getByRole('button', { name: /^Track / }).first().click();
      await page.getByRole('button', { name: 'Map view', exact: true }).click().catch(() => {});
      await page.getByRole('navigation', { name: 'Type' }).getByRole('button', { name: /^All/ }).click();
      await page.getByRole('button', { name: 'Map view', exact: true }).click();
      await page.locator('.leaflet-container').waitFor();
      await noOverflow('map');
      await page.getByRole('button', { name: 'List view', exact: true }).click();

      // Scroll to the very bottom like a thumb would: nothing on screen may jump, and once there it must hold still.
      await page.evaluate(() => {
        window.__shift = 0;
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shift += entry.value; })
          .observe({ type: 'layout-shift' });
      });
      for (let i = 0; i < 400; i++) {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(25);
        const atEnd = await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 2);
        if (atEnd) { await page.waitForTimeout(400); if (await page.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 2)) break; }
      }
      const samples = [];
      for (let i = 0; i < 10; i++) { samples.push(await page.evaluate(() => [scrollY, document.documentElement.scrollHeight])); await page.waitForTimeout(100); }
      assert.ok(samples.every(([y, h]) => y === samples[0][0] && h === samples[0][1]), `${width}/${theme}: bottom of page still moving ${JSON.stringify(samples)}`);
      const shift = await page.evaluate(() => window.__shift);
      assert.ok(shift < 0.02, `${width}/${theme}: layout shift while scrolling ${shift.toFixed(3)}`);
      assert.equal(await page.getByRole('button', { name: /^Show more/ }).count(), 0, 'every page loaded by the bottom');
      await noOverflow('scrolled');
      await page.screenshot({ path: join(output, `phone-home-${width}-${theme}.png`) });

      // Tracker: tab bar navigation, status moves, tabs, then a cold reload with saved data.
      await page.getByRole('navigation', { name: 'Sections' }).last().getByRole('link', { name: /My tracker/ }).click();
      await page.getByRole('heading', { name: 'My tracker' }).waitFor();
      assert.equal(await page.locator('[role=tabpanel] > li').count(), 2, 'tracked items listed');
      await page.locator('[role=tabpanel] > li').first().getByRole('button', { name: /Applied|going/ }).click();
      await page.getByRole('tab', { name: /Applied/ }).click();
      await page.locator('[role=tabpanel] > li').first().getByRole('button', { name: 'Done' }).click();
      await page.getByRole('tab', { name: /Done/ }).click();
      assert.equal(await page.locator('[role=tabpanel] > li').count(), 1, 'done item listed');
      await noOverflow('tracker');
      await page.reload();
      await page.getByRole('heading', { name: 'My tracker' }).waitFor();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(output, `phone-tracker-${width}-${theme}.png`), fullPage: true });
      await page.goto(`${base}/`);
      await page.getByRole('textbox', { name: 'Search listings' }).waitFor();
      await page.waitForTimeout(500);

      assert.deepEqual(problems, [], `${width}/${theme}`);
      runs++;
      await context.close();
    }
  }
  console.log(`Phone flow passed at ${runs} width/theme combinations with no page or console errors. Screenshots: ${output}`);
} finally {
  await browser.close();
}
