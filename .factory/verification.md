# Independent verification — FAIL

**Candidate:** `2f75878187ca90956f23d4d56a9f76ce928621b4` (`2f75878`)

**Live URL:** <https://transposing-sketchpad.sociobot.in>

**Verification date:** 2026-08-28 (UTC)

## Decision

**FAIL — do not release this candidate.** The required claims contract is
absent, there is no usable sample-data sandbox, and an axe serious violation is
introduced as soon as a user enters a note. These findings were reproduced
against the exact deployed candidate: SHA-256 matched for `index.html`, the
hashed JS and CSS bundles, `sw.js`, and `manifest.webmanifest`.

## Required first checks

### Claims: FAIL (release blocking)

`.factory/claims.json` does not exist in this clean checkout. Consequently
there were no declared claim tests to run through a demo entry point. This is a
release-blocking failure by the claims contract.

The landing page and README nevertheless make testable claims including
offline operation, automatic local storage, no upload/tracking, local audio,
keyboard entry, Web MIDI, JSON import/export, and share links. None is listed
or tested through the required sandbox. `.factory/demo.md` is also absent.

### Cold first read: FAIL

Fresh live load, with no prior product context, displayed:

> “Write what they read. Hear what sounds.”
>
> “Sketch up to eight bars in concert pitch. The paired staff handles the
> transposition while you learn it by ear.”
>
> “Open the sketchpad”

It conveys a transposition sketchpad, but does **not** plainly name the target
user (beginning composers writing for transposing instruments). The first
screen has no **“Try it with sample data”** action; “Open the sketchpad” opens
a blank real sketch.

`https://transposing-sketchpad.sociobot.in/?demo=1` was tested after entering
and saving one note in a fresh context. It restored that real note, with no
sample data, no “Demo — sample data, nothing is saved” banner, no Reset demo,
and no Start for real action. `/demo` likewise serves the normal app shell.
The candidate therefore has no isolated demo namespace and would expose real
local data inside the claimed demo URL.

## Test and product evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`: 108 packages installed; audit reported 0 vulnerabilities. |
| Unit tests | PASS | `vitest run --exclude 'tests/e2e/**'`: 6/6 passed. |
| Browser E2E | PASS, incomplete coverage | `npm run test:e2e`: 5/5 passed in Chromium. |
| Exact production build | PASS | `npm run build` completed; `dist/` produced. |
| Candidate/live identity | PASS | Exact SHA-256 equality for HTML, JS, CSS, service worker, and manifest. |
| Core composition flow | PASS | Tested six instruments with sounding C4: clarinet/trumpet → D4, alto sax → A4, tenor sax → D5, horn → G4, piccolo → C3; paired staff explanation and range warning displayed. |
| Boundary and recovery | PARTIAL | Four-beat rest reached 4/32; 32 notes at 390 px is covered by E2E; JSON export worked; invalid JSON reports raw `Expected property name...` parser text rather than a plain recovery instruction. |
| Keyboard/mobile | PASS | Computer-key entry, Delete, Undo, score-note focus, and 390 px `scrollWidth === clientWidth === 390` were exercised. |
| Live offline reload | PASS | After service-worker readiness and reload, setting the context offline allowed a live reload, showed “Offline · still working,” and accepted C4 entry. |
| Service-worker update | PARTIAL | `sw.js` registers/controls and source contains an update-toast path, but no deployed update was available to independently exercise the update transition. No update-flow test exists. |
| Privacy/outbound traffic | PASS for normal flow | Fresh live load and offline-entry flow made only same-origin requests (HTML, JS, CSS, local artwork). Source uses IndexedDB and Web Audio; no sign-in or server API endpoint was found. Rate limiting and Entra checks are therefore N/A. |
| Console/page errors | PASS | None in cold live, normal core flow, or offline reload. |
| Reduced motion/focus | PASS | Reduced-motion media rule reduces animation/transition duration; CSS has a 3 px acid focus outline and skip link. |
| Accessibility scan, empty state | PASS | Candidate E2E axe test passed before notes are entered. |
| Accessibility scan, populated state | **FAIL** | Fresh live axe scan after creating one note reports `nested-interactive` (**serious**): the `role="img"` SVG contains focusable `g[role=button]` score notes. |

## Deployment, policy, and budget evidence

- Live deployment is the requested candidate, not a deployment-only failure:
  `dist/index.html` `36beeaac…c58c`, JS `72d9c502…0fec3`, CSS
  `13129460…c6fa`, SW `40dda24f…b21`, and manifest
  `f9b40263…5b7` exactly match HTTPS responses.
- Production build output: JavaScript 23.55 KB (9.07 KB gzip), CSS 15.86 KB
  (4.78 KB gzip), hero AVIF 16 KB. These are below the stated bundle budgets.
- `/`, `/privacy/`, `/terms/`, manifest, and SW return 200. `/robots.txt` and
  `/sitemap.xml` return 404. `/demo` and `?demo=1` return the ordinary app.
- Live headers include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`
  and `X-Content-Type-Options: nosniff`, but no Content-Security-Policy. All
  assets receive only `Cache-Control: public, must-revalidate, max-age=30`, not
  long-lived immutable caching for hashed assets.
- Lighthouse 12.8.2 could not be run in this container: its Chrome launcher
  could not attach to the supplied Playwright Chromium despite an explicit
  `CHROME_PATH`. This does not affect the axe result above; no Lighthouse score
  is claimed by this verification.

## Defects

### Critical / release-blocking

1. **Missing claims contract and claim tests.** `.factory/claims.json` and
   `.factory/demo.md` are absent while the product/README make numerous
   observable claims. Add one test per claim, tagged `@claim:<id>`, running
   from the demo entry point.
2. **No sample-data sandbox.** The first screen lacks the mandatory one-click
   sample action. `?demo=1` uses normal IndexedDB and restores real data;
   there is no demo banner, reset, or exit-to-real flow.
3. **Serious dynamic accessibility violation.** Creating a score note makes
   axe report `nested-interactive` on the SVG `role=img` containing focusable
   `g[role=button]` descendants. The existing axe test misses this because it
   scans only the empty score.
4. **First screen does not name the intended beginner-composer audience in
   plain words.** It therefore fails the cold first-read acceptance test even
   apart from the missing demo action.

### Medium

1. **Security and caching policy incomplete.** Live responses have no CSP,
   and hashed assets are cached for only 30 seconds rather than immutable
   long-lived caching.
2. **Required discovery files missing.** `robots.txt` and `sitemap.xml` are
   404.
3. **Invalid import recovery is technical and unhelpful.** A malformed file
   exposes a raw JSON parser error and does not say how to recover (for example,
   choose a valid Sketchpad JSON export).
4. **PWA update transition lacks independent coverage.** The offline reload is
   covered, but neither the shipped suite nor this candidate could demonstrate
   the update-available → Update now flow.

## Reproduction commands

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

For the dynamic axe issue: load `/?new=1`, add a piano key, then run axe. For
the demo isolation issue: add and wait for a note to save, then open `?demo=1`
in the same browser context; the note remains visible.
