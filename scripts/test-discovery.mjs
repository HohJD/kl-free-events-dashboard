import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.TEST_URL || 'http://127.0.0.1:3100';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
    ? route.continue() : route.fulfill({ status: 204 }));
  await page.goto(`${base}/?type=scholarship&q=student&when=month&sort=soonest&state=selangor`);
  const search = page.getByRole('textbox', { name: 'Search listings' });
  await search.waitFor();
  await page.waitForFunction(() => document.querySelector('input[aria-label="Search listings"]').value === 'student');
  assert.equal(await page.getByRole('navigation', { name: 'Type' }).getByRole('button', { name: /^Scholarships/ }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Reset all', exact: true }).click();
  await page.waitForFunction(() => location.search === '');
  await page.reload();
  await search.waitFor();
  assert.equal(await search.inputValue(), '');
  await page.getByRole('button', { name: /Fund your studies/ }).click();
  await page.waitForFunction(() => new URL(location.href).searchParams.get('type') === 'scholarship');
  await search.fill('merit');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('q') === 'merit');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('input[aria-label="Search listings"]').value === 'merit');
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  assert.equal(await search.inputValue(), '');
  assert.equal(await search.evaluate(node => node === document.activeElement), true);

  const trigger = page.getByRole('button', { name: /^Filters/ });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByRole('button', { name: /^Show/ }).focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), true, 'focus stays in modal');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'focus returns to trigger');

  await page.getByRole('button', { name: 'Reset all', exact: true }).click();
  const disclosure = page.locator('article details').first();
  await disclosure.locator('summary').click();
  assert.equal(await disclosure.getAttribute('open'), '');
  assert.match(await disclosure.innerText(), /Who can join:/);
  console.log('Discovery checks passed: deep links, reload, reset, goal shortcuts, search clear, modal focus and eligibility disclosure.');
} finally {
  await browser.close();
}
