# Transposing Sketchpad

Turn heard notes into written parts for transposing instruments. This free,
offline PWA is for beginning composers who want to work in concert pitch.

Try the isolated sample at
<https://transposing-sketchpad.sociobot.in/demo>. Demo changes use memory only
and never read or change your real sketch.

## What it does

- Turns concert pitch into written pitch for B♭ clarinet, B♭ trumpet, E♭ alto
  sax, B♭ tenor sax, horn in F, and piccolo.
- Holds up to eight 4/4 bars and shows non-blocking typical-range guidance.
- Accepts screen, computer-keyboard, and optional Web MIDI entry.
- Synthesizes audio in the browser with Web Audio.
- Saves real sketches automatically in this browser’s IndexedDB.
- Works offline after the first visit.
- Exports and imports JSON. Share links hold the sketch in the URL fragment.
- Uses no account, analytics, cloud score service, or payment gate.

The app is a sketch surface, not a score engraver. It does not add key
signatures, articulations, polyphony, sample libraries, or collaboration.

## Run locally

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The demo entry point is `/demo`. Computer keys
`A W S E D F T G Y H U J K O L P ; '` enter sounding pitches C4–F5.

## Test and build

```sh
npm test
npm run build
npm run preview
```

`npm test` runs unit tests and the Chromium browser suite. The suite covers
the claims listed in `.factory/claims.json`, demo isolation, populated-state
axe checks, 390 px layout, keyboard editing, offline reload, and PWA updates.
The production output is `dist/`, with `dist/index.html` at its root.

## Data and privacy

Real sketches stay in this browser. Normal sketching sends no data to another
origin. Web MIDI permission is requested only after **Connect MIDI** is
selected. See [`/privacy/`](https://transposing-sketchpad.sociobot.in/privacy/)
and [`/terms/`](https://transposing-sketchpad.sociobot.in/terms/).

## Deploy

Build with `npm run build` and deploy the static `dist/` directory. The checked
in `staticwebapp.config.json` adds SPA fallback, security headers, and immutable
caching for assets. Infrastructure, DNS, and billing stay outside this repo.

## Visual system and license

The luminous glass direction and asset provenance are in
`.factory/design.md`. Source artwork and prompt metadata are under
`assets/src/`. Code is MIT licensed; see [LICENSE](LICENSE).
