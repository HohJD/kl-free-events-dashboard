import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = process.env.TEST_URL || 'http://127.0.0.1:3100';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const width of [320, 390, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
    await context.addInitScript(t => localStorage.setItem('theme', t), theme);
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === new URL(base).origin) return route.continue();
      return route.fulfill({ status: 204 });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/?edition=uk&state=oxford&focus=local`);
    const collections = page.getByRole('group', { name: 'Oxford collections' });
    await collections.waitFor();
    await page.waitForFunction(() => location.search.includes('state=oxford'));
    await page.getByRole('button', { name: 'Remove Oxford filter', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.equal(await page.getByRole('complementary', { name: 'Oxford student essentials' }).locator('a').count(), 3);
    for (const button of await collections.getByRole('button').all()) assert.ok((await button.boundingBox()).height >= 44);
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(tmpdir(), `oxford-${theme}-${width}.png`), fullPage: false });
    await page.getByRole('button', { name: 'Reset all', exact: true }).click();
    await collections.getByRole('button', { name: /^Closing in 14 days/ }).click();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('focus') === 'closing');
    await page.reload();
    await collections.getByRole('button', { name: /^Closing in 14 days/, pressed: true }).waitFor();
    await page.getByRole('button', { name: 'Remove Closing in 14 days filter', exact: true }).click();
    await page.getByRole('button', { name: /Between lectures/ }).click();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('focus') === 'local' && new URL(location.href).searchParams.get('when') === 'week');
    await page.getByRole('group', { name: 'Country', exact: true }).getByRole('button', { name: 'Malaysia', exact: true }).click();
    await collections.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('focus'));
    assert.deepEqual(errors, []);
    await context.close();
  }
  // At 20:00 GMT it is already tomorrow in Malaysia: UK saves must survive.
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-10-29T20:00:00Z') });
  await context.addInitScript(() => localStorage.setItem('free-things-saved-v1', JSON.stringify([
    { id: 'uk-evening', kind: 'event', title: 'Oxford evening lecture', href: 'https://example.com/uk', savedAt: '', date: '2026-10-29', time: '21:00', timeZone: 'Europe/London' },
    { id: 'my-expired', kind: 'event', title: 'Expired Malaysia lecture', href: 'https://example.com/my', savedAt: '', date: '2026-10-29', timeZone: 'Asia/Kuala_Lumpur' },
  ])));
  await page.goto(`${base}/saved`);
  await page.locator('[role=tabpanel] > li').first().waitFor();
  assert.equal(await page.locator('[role=tabpanel] > li').count(), 1);
  assert.match(await page.locator('[role=tabpanel]').innerText(), /Oxford evening lecture/);
  const calendar = page.locator('[role=tabpanel] a[href*="calendar.google.com"]');
  assert.equal(new URL(await calendar.getAttribute('href')).searchParams.get('ctz'), 'Europe/London');
  await context.close();
  console.log('Oxford browser checks passed at 3 sizes in both themes: URL restoration, collections, country switch, official links and touch targets.');
} finally { await browser.close(); }
