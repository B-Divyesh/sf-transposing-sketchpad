# Transposing Sketchpad

Transposing Sketchpad is a free, offline-first melody notebook for beginning
composers writing for transposing instruments. Enter the concert pitch you want
to hear and the paired staff immediately shows the note the player reads.

Live product: <https://transposing-sketchpad.sociobot.in>

## What it does

- Creates an eight-bar, 4/4 sketch for B♭ clarinet, B♭ trumpet, E♭ alto sax,
  B♭ tenor sax, horn in F, or piccolo.
- Shows linked written and sounding pitches with plain-language explanations
  and non-blocking typical-range warnings.
- Accepts pointer, touchscreen, computer-keyboard, and optional Web MIDI input.
- Plays the sounding melody with a local Web Audio synthesizer.
- Saves automatically in IndexedDB and works after installing or going offline.
- Exports/imports portable JSON and creates share links whose data stays in the
  URL fragment—there is no account or cloud score service.

This is intentionally a sketch surface, not a score engraver. It does not add
key signatures, articulations, polyphony, sample libraries, or collaboration.

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Computer keys `A W S E D F T G Y H U J K O
L P ; '` enter sounding pitches C4–F5; Delete or Backspace removes the selected
score entry.

## Test and build

```sh
npm test
npm run build
npm run preview
```

`npm test` runs unit tests plus Playwright tests for the main composition flow,
keyboard editing, 390 px behavior, automated accessibility checks, and a true
offline reload. The production command is exactly `npm run build`; static
output lands in `dist/` with `dist/index.html` at its root.

## Data and permissions

The current sketch is stored only in the browser’s IndexedDB. Web MIDI access
is requested only after “Connect MIDI” is selected. Audio is synthesized in the
browser and no analytics or third-party runtime resources are loaded. See
[`/privacy`](/privacy/) and [`/terms`](/terms/) in the built app.

## Visual system and assets

The luminous glass visual thesis and full asset provenance live in
`.factory/design.md`. Source artwork and its exact prompt are under
`assets/src/`; optimized AVIF, WebP, and JPEG derivatives ship from
`public/assets/`.

## License

MIT. See [LICENSE](LICENSE).
