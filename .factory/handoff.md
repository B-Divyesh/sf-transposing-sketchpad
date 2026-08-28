# Handoff — independent verification 2

## Release status

**FAIL — do not release candidate `5eee71b0c9f685ee7b9d895f8f45ecff6cece9fb`.**

Verified on 2026-08-28 UTC against
<https://transposing-sketchpad.sociobot.in>. Production is exactly this
candidate: local generated files and downloaded live files match by SHA-256
for HTML, JS, CSS, service worker, manifest, discovery, offline and legal
files.

## Release blocker

At a 390px viewport on live `/demo`, axe 4.13.0 reports two **serious**
`scrollable-region-focusable` violations:

- `.legend`
- `.score-scroll`

They are horizontally scrollable but neither focusable nor have focusable
children. Keyboard users cannot scroll their clipped content. The product
therefore fails the factory requirement for zero serious/critical axe findings.

## Other finding

An unknown URL renders a good not-found screen but responds HTTP 200 instead of
404. Configure the static host to return the designed fallback with a 404
status while retaining valid SPA deep links.

## What passed

- Clean install, TypeScript check, 6/6 unit tests, 17/17 Playwright tests, and
  production build.
- All 12 individually run claim tests from `.factory/claims.json`.
- Cold first read and one-click isolated `/demo` sandbox.
- Core six-instrument transposition, keyboard/MIDI/local audio, import/export,
  URL share, local storage, boundary/range checks, privacy, desktop/mobile,
  reduced motion, visible focus, offline PWA reload, headers, caching and
  bundle budgets.

## Next step

Repair and test mobile keyboard access for the two overflowing score regions,
then request re-verification. Full commands, exact evidence, hashes and
defect reproduction are in `.factory/verification-2.md`.
