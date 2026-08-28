# Handoff — Transposing Sketchpad repair 1

## Release status

**PASS.** All findings in independent verifier report commit `2be71c6` for
candidate `2f75878` are repaired. The repair implementation is commit
`01a1e069f1c35902ad2fa1d3d62d7d5b898028be` on `main`.

Deployed production URL:
<https://transposing-sketchpad.sociobot.in>

Factory static deployment `3ef8397a-2360-47fa-9086-e9b63a7b8816` completed on
28 August 2026. The existing Azure Static Web App in `centralus` and its ready
custom domain were reused.

## Verifier findings repaired

1. Added `.factory/claims.json` with 12 observable claims. Each claim has one
   matching `@claim:<id>` browser test that runs from a clean state.
2. Added the one-click `/demo` sandbox and `.factory/demo.md`. Its seven-entry
   clarinet sample runs in memory, never opens real IndexedDB, resets on reload,
   and provides **Reset demo** and **Start for real** actions. Regression
   coverage proves a saved real note survives demo entry, edits, reset, reload,
   and exit unchanged.
3. Removed interactive descendants from the score image. A separate row of
   44 px semantic entry buttons now provides selection, Delete, and focus
   behavior; direct note clicks remain available. Axe reports zero violations
   after notes are entered.
4. Replaced the metaphor-first opening with “Turn heard notes into written
   parts” and explicitly names beginning composers. The first screen includes
   the demo action, blank-sketch action, and three tested facts.
5. Added CSP, framing/referrer/content-type/permissions headers, immutable
   one-year asset caching, and no-cache document/service-worker rules through
   `staticwebapp.config.json`.
6. Added working `robots.txt` and `sitemap.xml`; both return 200 in production.
7. Malformed imports now say what failed and tell the user to choose a valid
   Sketchpad JSON export.
8. Changed service-worker updates to wait for **Update now**, then send
   `SKIP_WAITING` and reload after `controllerchange`. A browser regression
   covers the waiting-worker → toast → activation message flow.

The repair also added route metadata and canonical/social tags, a designed 404
state, consistent legal-page landmarks, a copy audit, and a 1200×630 derivative
of the existing original artwork for social previews. The brief and luminous
glass visual system are unchanged.

## Exact verification evidence

Commands run from a clean install:

```sh
npm ci
npm run check
npm test
npm run build
```

Results on 28 August 2026:

- `npm ci`: 108 packages installed; 0 vulnerabilities.
- TypeScript: `tsc --noEmit` passed.
- Vitest: 6/6 passed.
- Playwright 1.58.2 Chromium: 17/17 passed, including all 12 claim tests.
- Production build: `dist/index.html` present; JavaScript 27,233 bytes
  (10,069 gzip), CSS 18,340 bytes (5,243 gzip), hero AVIF 16,072 bytes.
- Axe browser integration: zero violations on populated `/`, `/demo`,
  `/privacy/`, and `/terms/`.
- Factory `verify-url.sh` against production: HTTP 200; zero console errors;
  title and `lang` present; one h1; main landmark; no missing image alt text;
  no unlabeled buttons.
- Browser review at 1366×900 and 390×844: no horizontal page overflow; mobile
  body `scrollWidth === clientWidth === 390`; skip link and note editing work
  by keyboard; visible interactive targets are at least 44 px.
- Fresh production PWA context: service worker installed and controlled the
  page; `/demo` reloaded offline; the offline state appeared; another note was
  accepted. The demo reset to seven sample entries on a new load.
- Privacy flow: zero cross-origin requests and zero page/console errors across
  note entry, instrument change, export, demo, offline reload, and mobile load.
- Production discovery: `/`, `/demo`, `/privacy/`, `/terms/`, `/robots.txt`,
  `/sitemap.xml`, manifest, and service worker all return 200.
- Production headers: CSP present; `X-Content-Type-Options: nosniff`;
  `Referrer-Policy: strict-origin-when-cross-origin`; `X-Frame-Options: DENY`;
  hashed assets return `Cache-Control: public, max-age=31536000, immutable`.
- Lighthouse 13.4.1 production mobile: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0.

Live/build SHA-256 identity matched exactly for `index.html`, the JavaScript
and CSS bundles, `sw.js`, `manifest.webmanifest`, `robots.txt`, and
`sitemap.xml`. The deployed `index.html` hash is
`ae8d7ad5abfafa366e93734ebd9fb3b4afde3af9193c3bd7512b1d022f26f375`.

## Run and verify

```sh
npm ci
npm run check
npm test
npm run test:claims
npm run build
npm run preview
```

The deployment input is `./dist`; `dist/index.html` is at its root.

## Known product boundaries

- The paired staff is a pitch sketch, not publication engraving. It omits
  clefs, key signatures, beaming, ties, and polyphony by design.
- Web MIDI depends on browser support and is generally absent on iOS. Screen
  and computer keyboards remain available.
- Typical written ranges are guidance, not hard constraints.

There are no known release-blocking gaps.
