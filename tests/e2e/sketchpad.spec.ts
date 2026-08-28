import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('enters, explains, changes instrument, persists, and exports a sketch', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?new=1');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('main')).toBeVisible();
  await page.locator('[data-midi="60"]').click();
  await expect(page.locator('#translation-detail').getByText('You write D4. It sounds C4.')).toBeVisible();
  await page.locator('#instrument').selectOption('alto-sax-eb');
  await expect(page.locator('#translation-detail').getByText('You write A4. It sounds C4.')).toBeVisible();
  await expect(page.locator('#capacity')).toContainText('1 / 32 beats');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/untitled-eight-bar-sketch\.json/);

  await page.reload();
  await expect(page.locator('[data-note-id]')).toHaveCount(1);
  await expect(page.locator('#instrument')).toHaveValue('alto-sax-eb');
  expect(errors).toEqual([]);
});

test('supports keyboard entry, selection deletion, and undo', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('main').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('a');
  await page.keyboard.press('s');
  await expect(page.locator('[data-note-id]')).toHaveCount(2);
  await page.locator('[data-note-id]').first().focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('[data-note-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo delete' }).click();
  await expect(page.locator('[data-note-id]')).toHaveCount(2);
});

test('remains usable at 390px and enforces eight bars', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?new=1');
  const key = page.locator('[data-midi="60"]');
  for (let index = 0; index < 32; index += 1) await key.click();
  await expect(page.locator('#capacity')).toContainText('32 / 32 beats');
  await key.click();
  await expect(page.locator('#status')).toContainText('All eight bars are full');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/?new=1');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
  expect(serious).toEqual([]);
});

test('loads the installed sketchpad offline', async ({ page, context }) => {
  await page.goto('/?new=1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Write what they read/ })).toBeVisible();
  await expect(page.getByText('Offline · still working')).toBeVisible();
  await page.locator('[data-midi="60"]').click();
  await expect(page.locator('#translation-detail').getByText('You write D4. It sounds C4.')).toBeVisible();
});
