# Transposing Sketchpad — visual thesis

## Direction: luminous glass data landscape

The sketchpad should feel like looking through a rehearsal-room window after
dark: inked music sits on a warm paper plane while the relationship between
written and sounding pitch glows through it. This is not generic glassmorphism.
The glass is instructional: cyan identifies what the player reads, coral
identifies what the room hears, and a thin vertical beam connects the same
musical moment across both staves.

## Palette

The product is deliberately single-mode, painted as a deep blue-black night
desk so the two pitch systems remain immediately distinguishable.

| Token | Value | Use |
| --- | --- | --- |
| `--night-950` | `#071218` | page background |
| `--night-900` | `#0b1d24` | raised background |
| `--glass` | `rgba(16, 42, 50, .78)` | work surfaces |
| `--glass-line` | `#37616b` | boundaries and focus-supporting lines |
| `--ink` | `#f4f0df` | primary text and staff marks |
| `--mist` | `#b9cbd0` | secondary text |
| `--written` | `#71e1d4` | written/read pitch |
| `--sounding` | `#ffb38a` | sounding/heard pitch |
| `--acid` | `#d9f77e` | primary action and playback cursor |
| `--success` | `#8ee6a8` | saved/in-range status |
| `--warning` | `#ffd275` | range and bar-capacity warnings |
| `--danger` | `#ff8f9c` | destructive/error states |

All body copy combinations meet WCAG AA against their painted surfaces. Color
is reinforced with explicit “Written” / “Sounds” labels, distinct note shapes,
and status text.

## Type and spacing

- Display and score labels: **Fraunces**, a locally bundled OFL variable serif
  when available, falling back to Georgia. Its musical, slightly eccentric
  shapes give the product the character of a hand-marked score.
- Controls and data: **Atkinson Hyperlegible**, locally bundled OFL font when
  available, falling back to system UI. It keeps pitch names, octaves, and
  compact instructions unambiguous.
- Type scale: 14, 16, 18, 24, 34, and clamp(42–72) px. Body text is never below
  16 px. Pitch counters use tabular figures.
- Spacing follows an 8 px base with 4 px only for tight label-to-value pairs.
  Workbench gutters are 24–32 px; touch targets are at least 44 px.

## Composition and interaction grammar

The opening is a compact editorial masthead, not a marketing page: title and
one-sentence job statement sit beside an original glass-instrument landscape.
The functional workbench begins immediately below. The control rail establishes
instrument, note length, and tempo; the paired staff is the visual center; the
input keyboard is the tactile base. On phones the rail becomes a horizontal,
two-column setup strip, staff views stack, and nonessential keyboard hints
collapse. Nothing needed for entry is dropped.

Every entered pitch creates one vertical “translation thread” across the paired
staff and updates a plain-language sentence: “You write D5. It sounds C5.” A
short glow travels from written to sounding only at entry/playback. Selection
uses a bracket and position, never color alone. Playback moves one light column
through the score. Destructive clear requires a specific confirmation; note
deletion remains instantly undoable.

## Motion

- Control feedback: 160 ms; note arrival/translation: 240 ms; overlays: 200 ms.
- Only opacity and transforms animate. Nothing loops indefinitely.
- `prefers-reduced-motion` removes travel and scale, retaining instantaneous
  opacity/state changes. Playback position still changes without interpolation.

## Asset plan and provenance

One original generated raster, `public/assets/pitch-landscape.webp`, appears in
the masthead as an atmospheric explanation of two linked pitch planes. It must
remain under 300 KB and have explicit dimensions. Product icons, staff marks,
and controls are authored SVG/CSS so they stay precise. The generated scene is
decorative; the adjacent prose carries its meaning.

### Prompt sheet

- Use case: `stylized-concept`
- Subject/world: an abstract musical landscape made from two parallel glass
  staves, connected by luminous vertical pitch threads and small note-like
  glass droplets; no literal interface screenshot.
- Materials: smoked translucent glass, etched staff lines, matte obsidian,
  tiny phosphorescent particles.
- Light/lens: low raking studio light, shallow atmospheric depth, wide editorial
  crop with useful quiet space at the left edge.
- Palette words: midnight teal, sea-glass cyan, warm coral, pale chartreuse,
  warm ivory.
- Negative list: people, hands, real instruments, text, notation glyph errors,
  logos, brands, watermark, neon rainbow, purple gradient, UI mockup.
- Final prompt: “Use case: stylized-concept. Asset type: wide website masthead
  illustration. An abstract musical data landscape with two parallel floating
  translucent glass staff planes, a handful of elegant glass note droplets,
  and fine vertical light threads showing each note translating from the upper
  plane to the lower plane. Smoked glass and matte obsidian materials, etched
  ivory staff lines, low raking studio light, calm precise educational mood,
  shallow atmospheric depth, wide editorial composition with restrained quiet
  space. Midnight teal, sea-glass cyan, warm coral, pale chartreuse and warm
  ivory palette. Original cinematic 3D illustration, no people, no hands, no
  real instruments, no readable text, no logos, no brands, no watermark, no
  rainbow neon, no purple gradient, no interface screenshot.”

Generated with the Param Factory `factory-image` deployment on 2026-08-28.
The generated output is original to this product. Source PNG and exact prompt
sidecar are retained under `assets/src/`; the shipped derivative is WebP.

