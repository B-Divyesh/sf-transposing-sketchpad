import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('maps concert pitch across every shipped instrument @claim:transposition-six', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('[data-midi="60"]').click();
  const expected: Record<string, string> = {
    'clarinet-bb': 'You write D4. It sounds C4.',
    'trumpet-bb': 'You write D4. It sounds C4.',
    'alto-sax-eb': 'You write A4. It sounds C4.',
    'tenor-sax-bb': 'You write D5. It sounds C4.',
    'horn-f': 'You write G4. It sounds C4.',
    'piccolo-c': 'You write C3. It sounds C4.',
  };
  for (const [instrument, sentence] of Object.entries(expected)) {
    await page.locator('#instrument').selectOption(instrument);
    await expect(page.locator('#translation-detail')).toContainText(sentence);
  }
});

test('keeps demo changes isolated from real data @claim:demo-isolation', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('[data-midi="60"]').click();
  await expect(page.locator('#status')).toContainText('Saved on this device');
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#sketch-title')).toHaveValue('Clarinet warm-up: morning phrase');
  await expect(page.locator('[data-note-id]')).toHaveCount(7);
  await page.locator('[data-midi="62"]').click();
  await expect(page.locator('[data-note-id]')).toHaveCount(8);
  await page.reload();
  await expect(page.locator('[data-note-id]')).toHaveCount(7);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#status')).toContainText('Demo reset');
  await page.goto('/');
  await expect(page.locator('#sketch-title')).toHaveValue('Untitled eight-bar sketch');
  await expect(page.locator('[data-note-id]')).toHaveCount(1);
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('[data-note-id]')).toHaveCount(0);
});

test('persists real sketches in browser storage @claim:autosave-local', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('#instrument').selectOption('alto-sax-eb');
  await page.locator('[data-midi="60"]').click();
  await expect(page.locator('#status')).toContainText('Saved on this device');
  await page.reload();
  await expect(page.locator('[data-note-id]')).toHaveCount(1);
  await expect(page.locator('#instrument')).toHaveValue('alto-sax-eb');
});

test('accepts computer-key and mocked Web MIDI entry @claim:keyboard-midi-input', async ({ page }) => {
  await page.addInitScript(() => {
    const input: { name: string; onmidimessage: ((event: { data: Uint8Array }) => void) | null } = { name: 'Test MIDI keyboard', onmidimessage: null };
    Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, value: async () => ({ inputs: new Map([['test', input]]) }) });
    Object.defineProperty(window, '__testMidiInput', { configurable: true, value: input });
  });
  await page.goto('/?new=1');
  await page.locator('main').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('a');
  await page.getByRole('button', { name: 'Connect MIDI' }).click();
  await expect(page.locator('#status')).toContainText('MIDI connected: Test MIDI keyboard');
  await page.evaluate(() => {
    const midi = (window as unknown as { __testMidiInput: { onmidimessage: (event: { data: Uint8Array }) => void } }).__testMidiInput;
    midi.onmidimessage({ data: new Uint8Array([0x90, 62, 100]) });
  });
  await expect(page.locator('[data-note-id]')).toHaveCount(2);
});

test('synthesizes entered notes with browser audio @claim:local-audio', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__audioStarts', { configurable: true, writable: true, value: 0 });
    class FakeAudioContext {
      state = 'running'; currentTime = 0; destination = {};
      resume() { return Promise.resolve(); }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      createOscillator() { return { type: '', frequency: { value: 0 }, connect() {}, start() { (window as unknown as { __audioStarts: number }).__audioStarts += 1; }, stop() {} }; }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext });
  });
  await page.goto('/demo');
  await page.locator('[data-midi="60"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __audioStarts: number }).__audioStarts)).toBe(2);
});

test('exports and imports portable JSON @claim:json-portability', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('clarinet-warm-up-morning-phrase.json');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(exported.notes).toHaveLength(7);
  const imported = { ...exported, title: 'Imported evening phrase', notes: exported.notes.slice(0, 2) };
  await page.locator('#import').setInputFiles({ name: 'phrase.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
  await expect(page.locator('#sketch-title')).toHaveValue('Imported evening phrase');
  await expect(page.locator('[data-note-id]')).toHaveCount(2);
});

test('puts shared sketch data in the URL fragment @claim:share-fragment', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/demo');
  await page.locator('[data-midi="60"]').click();
  await page.getByRole('button', { name: 'Copy share link' }).click();
  const value = await page.evaluate(() => navigator.clipboard.readText());
  const shared = new URL(value);
  expect(shared.hash).toMatch(/^#sketch=/);
  expect(shared.search).toBe('');
  expect(shared.pathname).toBe('/');
  await page.goto(value);
  await expect(page.locator('[data-note-id]')).toHaveCount(8);
});

test('makes no cross-origin requests during the demo flow @claim:privacy-no-outbound', async ({ page }) => {
  const outbound: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') outbound.push(request.url());
  });
  await page.goto('/demo');
  await page.locator('[data-midi="60"]').click();
  await page.locator('#instrument').selectOption('horn-f');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  await downloadPromise;
  expect(outbound).toEqual([]);
});

test('reloads the installed demo offline @claim:offline-reload', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Try a clarinet phrase' })).toBeVisible();
  await expect(page.getByText('Offline · still working')).toBeVisible();
  await expect(page.locator('[data-note-id]')).toHaveCount(7);
  await page.locator('[data-midi="60"]').click();
  await expect(page.locator('[data-note-id]')).toHaveCount(8);
});

test('enforces the eight-bar limit @claim:eight-bar-capacity', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?new=1');
  const key = page.locator('[data-midi="60"]');
  for (let index = 0; index < 32; index += 1) await key.click();
  await expect(page.locator('#capacity')).toContainText('32 / 32 beats');
  await key.click();
  await expect(page.locator('#status')).toContainText('All eight bars are full');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});

test('shows non-blocking typical-range guidance @claim:range-guidance', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('#instrument').selectOption('piccolo-c');
  await page.locator('[data-midi="60"]').click();
  await expect(page.locator('.range-status')).toContainText('outside this instrument’s typical written range');
  await expect(page.locator('[data-note-id]')).toHaveCount(1);
});

test('has no account or payment gate @claim:free-no-account', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to use.')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="password"], [data-payment]')).toHaveCount(0);
  await page.goto('/terms/');
  await expect(page.getByText('free software for musical learning')).toBeVisible();
});

test('supports score selection, deletion, and undo by keyboard', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('main').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('a');
  await page.keyboard.press('s');
  await page.locator('[data-note-id]').first().focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('[data-note-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo delete' }).click();
  await expect(page.locator('[data-note-id]')).toHaveCount(2);
});

test('has no serious accessibility violations with a populated score', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('[data-midi="60"]').click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
});

test('reports malformed imports with a recovery instruction', async ({ page }) => {
  await page.goto('/?new=1');
  await page.locator('#import').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('#status')).toHaveText('That file could not be imported. Choose a valid Sketchpad JSON export and try again.');
});

test('offers and activates a waiting service-worker update', async ({ page }) => {
  await page.goto('/?new=1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(navigator.serviceWorker, 'getRegistration', {
      configurable: true,
      value: async () => ({ waiting: { postMessage: (data: unknown) => Object.assign(window, { __updateMessage: data }) } }),
    });
    navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'UPDATE_AVAILABLE' } }));
  });
  await expect(page.locator('#update-toast')).toBeVisible();
  await page.getByRole('button', { name: 'Update now' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __updateMessage?: unknown }).__updateMessage)).toEqual({ type: 'SKIP_WAITING' });
});

test('keeps desktop and 390px pages keyboard-accessible and error-free', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('main')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  expect(errors).toEqual([]);
});
