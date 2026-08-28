# Independent verification 2 — FAIL

**Candidate:** `5eee71b0c9f685ee7b9d895f8f45ecff6cece9fb` (`5eee71b`)  
**Live URL:** <https://transposing-sketchpad.sociobot.in>  
**Date:** 2026-08-28 UTC

## Decision

**FAIL — do not release.** Fresh live evidence finds a release-blocking serious
mobile accessibility violation. This is not a deployment-only failure: the
live build matches the candidate byte-for-byte.

## Mandatory first checks

### Claims: PASS

`.factory/claims.json` is present. After clean `npm ci`, I ran every listed
command individually (`npm run test:e2e -- --grep @claim:<id>`). Every command
returned exit 0 with one matching Chromium test passed:

| Claim id | Result |
| --- | --- |
| `transposition-six` | PASS |
| `demo-isolation` | PASS |
| `autosave-local` | PASS |
| `keyboard-midi-input` | PASS |
| `local-audio` | PASS |
| `json-portability` | PASS |
| `share-fragment` | PASS |
| `privacy-no-outbound` | PASS |
| `offline-reload` | PASS |
| `eight-bar-capacity` | PASS |
| `range-guidance` | PASS |
| `free-no-account` | PASS |

The isolation test creates real data, then proves `/demo` mutations, reset,
reload, and exit do not read or change it. No claim test is missing or failed.

### Cold first read: PASS

A fresh live context at `/` says “Turn heard notes into written parts” and
“For beginning composers: enter the pitch you want to hear, then see what the
instrument player reads.” Its first primary action is **Try it with sample
data**, which opens `/demo`. The same screen gives plain free, offline, and
on-device facts. It clearly answers what, for whom, and what to click first.

## Clean-checkout gates

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 108 packages, 0 reported vulnerabilities. |
| Type check | PASS | `npm run check` / `tsc --noEmit`. |
| Unit tests | PASS | 6/6 Vitest tests. |
| Browser suite | PASS | `npm test`: 17/17 Playwright tests, including claims and SW update message flow. |
| Production build | PASS | `npm run build` created `dist/`. |
| Budget | PASS | JS 27,233 B / 10,061 B gzip; CSS 18,340 B / 5,222 B gzip; hero AVIF 16,072 B. |

`/opt/fleet/lib/verify-url.sh https://transposing-sketchpad.sociobot.in
/tmp/transposing-verify.KvCrCy` also passed: HTTP 200 in 954 ms, no browser
errors, `lang=en`, one h1, main, title, zero missing image alt attributes, and
zero unlabeled buttons.

## End-to-end evidence

- The transposition claim test verifies C4 across all six instruments:
  clarinet/trumpet D4, alto sax A4, tenor sax D5, horn F G4, piccolo C3.
- Live `/demo` starts with the seven-entry B-flat clarinet phrase. Passing
  tests cover note entry, reset, local automatic storage, JSON import/export,
  URL-fragment sharing, mocked MIDI, local Web Audio, 32-quarter-note capacity,
  and non-blocking range warnings.
- Fresh live malformed JSON recovery says: “That file could not be imported.
  Choose a valid Sketchpad JSON export and try again.”
- On desktop first Tab produces a 3px `#d9f77e` focus outline; mobile first Tab
  reaches the skip link. Computer keyboard, Delete, Undo and score selection
  are covered by the suite.
- At 390x844, `body.scrollWidth === documentElement.clientWidth === 390`, all
  visible interactive boxes are at least 44px, and there are no console errors.
  Reduced-motion live context has 0.00001s transitions and no running
  animations.
- Fresh live PWA: service worker controls after reload; after `setOffline(true)`,
  `/demo` reloads, says “Offline · still working”, retains seven sample notes,
  and accepts an eighth entry. The shipped mocked waiting-worker/update test
  passes; no new live version was available to stage a real update transition.
- A live outgoing-request log through cold load, app routes, legal routes,
  blank-note entry, instrument change, malformed import, demo and offline flow
  contains only `https://transposing-sketchpad.sociobot.in`. There are no page
  or console errors, no tracking, sign-in, server endpoint, payment feature, or
  external origin; Entra and 429 allowance checks are therefore N/A.
- All 11 discovered links and `/`, `/demo`, `/privacy/`, `/terms/`, manifest,
  SW, robots and sitemap return 200.

## Candidate/live identity and policy

Local `dist` and downloaded production files match for index, JS, CSS, service
worker, manifest, robots, sitemap, offline, privacy and terms files. Key
SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `index.html` | `ae8d7ad5abfafa366e93734ebd9fb3b4afde3af9193c3bd7512b1d022f26f375` |
| `assets/index-C3ZWlmN8.js` | `5b7e03bd9239d18fdab255df85b682c0f5c019c5849221766762ac9a2d937696` |
| `assets/index-BzRB_rEY.css` | `83278c14f2838c7de7f8c196914cf74a8acef04a032311705c4d601c18b837cb` |
| `sw.js` | `d9b20608607ec954a04c9644e1029878c6b5fce3861c1b0a982baac155bab2d7` |

Production sends HSTS, restrictive CSP, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
and Permissions-Policy. Hashed JS/CSS use one-year immutable caching; document
and service worker correctly avoid long-lived caching.

Lighthouse 13.4.0 yielded provisional desktop scores P100/A100/BP100/SEO92
and FCP/LCP 0.3s, but its Chrome tab crashed during full-page screenshot
collection (`TARGET_CRASHED`). These are not treated as a completed quality
gate; the independent browser, bundle, header and axe results above are used.

## Defects

### Critical / release-blocking

1. **Live mobile demo: two serious axe `scrollable-region-focusable`
   violations.**

   At 390x844 on `/demo`, axe 4.13.0 reports both `.legend` and `.score-scroll`
   as serious: they are horizontally scrollable but neither focusable nor have
   focusable descendants. Keyboard-only users cannot reach their hidden
   right-side content. This violates the zero serious/critical axe acceptance
   rule. Add intentional keyboard access (or remove the overflow), then add a
   390px axe regression test.

### Medium

1. **Unknown paths respond HTTP 200.** `GET /404-verification` returns 200 and
   then renders the well-designed “That page is not in this sketch” SPA view.
   Configure the static host to use the designed fallback with status 404 while
   retaining SPA deep links.

## Reproduce

```sh
npm ci
npm run check
npm test
npm run build
```

For the blocker, open live `/demo` in a 390px viewport and run axe; filter
violations for `serious`/`critical`. It returns `scrollable-region-focusable`
with the two selectors above.
