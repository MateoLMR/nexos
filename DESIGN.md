---
name: Nexos
description: El café internet de tu barrio a las 9 de la noche, abierto para cualquier jugador.
colors:
  pared: "#14121c"
  pared-2: "#1b1727"
  cubiculo: "#2a1f45"
  cubiculo-2: "#3a2c5e"
  cubiculo-borde-hover: "#4b3a78"
  nexos: "#6d3bd2"
  nexos-hover: "#7c4ce0"
  nexos-claro: "#9a76f0"
  ambar: "#ffb020"
  ambar-tinta: "#2e1d00"
  vivo: "#3ddc84"
  monitor: "#e8eeff"
  monitor-2: "#b3bad3"
  placeholder: "#8f97b3"
  alerta: "#ff6b6b"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Onest Variable, sans-serif"
    fontSize: "clamp(3rem, 7.2vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Onest Variable, sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque Variable, Onest Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-lead:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.6
  data:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  ficha: "3px"
  cubiculo: "4px"
spacing:
  ficha-y: "0.2em"
  ficha-x: "0.6em"
  panel: "1.25rem"
  heading-to-content: "3rem"
  section: "7rem"
  gutter: "clamp(1rem, 4vw, 2.5rem)"
  container: "80rem"
components:
  button-principal:
    backgroundColor: "{colors.nexos}"
    textColor: "#ffffff"
    rounded: "{rounded.cubiculo}"
    padding: "0.6rem 1.15rem"
    height: "2.75rem"
  button-principal-hover:
    backgroundColor: "{colors.nexos-hover}"
  button-linea:
    backgroundColor: "transparent"
    textColor: "{colors.monitor}"
    rounded: "{rounded.cubiculo}"
    padding: "0.6rem 1.15rem"
    height: "2.75rem"
  campo:
    backgroundColor: "{colors.pared-2}"
    textColor: "{colors.monitor}"
    rounded: "{rounded.cubiculo}"
    padding: "0.6rem 0.9rem"
    height: "2.75rem"
  cubiculo:
    backgroundColor: "{colors.cubiculo}"
    textColor: "{colors.monitor}"
    rounded: "{rounded.cubiculo}"
    padding: "{spacing.panel}"
  ficha-ambar:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.ambar-tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.ficha}"
    padding: "0.2em 0.6em"
  ficha-tenue:
    backgroundColor: "{colors.cubiculo-2}"
    textColor: "{colors.monitor-2}"
    typography: "{typography.label}"
    rounded: "{rounded.ficha}"
    padding: "0.2em 0.6em"
  segmento-activo:
    backgroundColor: "{colors.nexos}"
    textColor: "#ffffff"
    rounded: "{rounded.ficha}"
    padding: "0 0.9rem"
    height: "2.25rem"
  mostrador:
    backgroundColor: "{colors.pared}"
    textColor: "{colors.monitor-2}"
    height: "4rem"
---

# Design System: Nexos

## Overview

**Creative North Star: "Luces apagadas: el café internet a las 9 de la noche"**

Nexos is the neighbourhood internet café after dark, open to any player. The room is a dim wall (pared) lined with purple cubicles; the only light comes from monitors, an amber "abierto" sign over the counter, and the green of a session timer or a live match. Every surface is a piece of that room: the header is the ceiling cable the lamps hang from, cards are cubicles, featured content is a poster taped to the wall, and signing in is "sitting down" in a cubicle.

Density is that of a working café, not a showroom: real data (prices per store, live matches, forum posts) is put on the wall in readable rows, numbers in a monospaced readout, headings on painted-sign letterforms. Light is scarce and meaningful: colour is spent on what is lit (a price, a live match, the open sign, the current choice), never on decoration.

The world rejects the dark eSports portal with purple-fuchsia neon and the grid of identical cards under a centred headline. No neon glow, no glass, no decorative gradients.

**Key Characteristics:**
- Dark, warm-purple ground; light only where something is on, priced or live.
- Cubicles (4px corners, 1px border) as the base container; taped, slightly rotated posters for featured content.
- Painted-sign display type (Bricolage Grotesque 800), plain interface type (Onest), monospaced readouts for data only.
- Motion as physical café behaviour: a sign tube flickering on, posters peeling off the wall, rolling price counters.
- Everything collapses to short fades under prefers-reduced-motion.

## Colors

A low-light palette: two near-black purple grounds, two cubicle purples, one action purple, and three lights (amber, green, monitor white) each with a single job.

### Primary
- **Morado Nexos** (nexos): primary actions ("Sentarse", "Hacer una pregunta"), the active segment of segmented controls, the selected forum category tint, the avatar tile, and the "Dudas" poster. It means "do this / this is chosen". Hover lifts to nexos-hover.
- **Lila Monitor** (nexos-claro): the lighter purple for data marks on dark (rating meters, comparison side A) and hover borders on outline buttons.

### Secondary
- **Ámbar Letrero** (ambar): the sign light. Prices and the price board, deals and "el más barato", the taped "abierto" sign and the focus ring/caret. Dark text on amber always uses ambar-tinta.

### Tertiary
- **Verde Temporizador** (vivo): only what is live right now: the "en vivo" chip and pulsing dot, live-match borders, the session timer in the counter and profile, live counts.

### Neutral
- **Pared** (pared): page ground, html background, scrollbar track.
- **Pared Interior** (pared-2): inset grounds inside cubicles: inputs, search bar, segmented-control trays, the price board, comment wells, footer.
- **Cubículo** (cubiculo): cards, panels, the counter bar, dropdowns, mobile menu.
- **Cubículo Borde** (cubiculo-2): 1px borders and dividers, neutral chips, skeleton highlight, scrollbar thumb; cubiculo-borde-hover is the shared hover border for cards and fields.
- **Luz de Monitor** (monitor): primary text and headings.
- **Luz de Monitor Tenue** (monitor-2): secondary text, metadata, inactive nav; placeholder text uses placeholder.
- **Alerta** (alerta): error messages and error-state icons only.

### Named Rules
**The Lit-Things-Only Rule.** Colour other than the purples means something is lit. Amber = price, deal, the open sign, focus. The nav lamp is monitor white, never amber. Green = live now. If it is not priced and not live, it is monitor white or purple.

**The Brand-Band Rule.** A game's own brand colour may appear only as the 4px top band of its poster (`--juego`), the way a printed poster has a colour strip. Never as a fill, text colour, or page theme.

**The No-Neon Rule.** No glows, no glass, no decorative gradients. Gradients are allowed only as dark scrims (pared at 0.3–0.97 alpha) under text laid over game art, and as the skeleton shimmer.

## Typography

**Display Font:** Bricolage Grotesque Variable (with Onest Variable, sans-serif)
**Body Font:** Onest Variable (with system-ui)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace), data only

**Character:** a painted shop sign over a plain counter: heavy, tight, slightly quirky letters for names and headings; calm, round sans for everything you read or press; a terminal readout for numbers.

### Hierarchy
- **Display** (800, clamp(3rem, 7.2vw, 6rem), 0.95): the home question and per-game/eSports page titles; interior page h1s run slightly smaller (clamp(2.75rem, 6vw, 4.75rem)).
- **Headline** (800, clamp(2.25rem, 4.5vw, 3.5rem), 0.95): section titles on the wall ("Recién llegados al local", "Cartelera de torneos").
- **Title** (800, 1.25–1.9rem, 0.95): poster and card names, the counter sign (1.4–1.65rem).
- **Body** (400, 1rem, 1.6): interface text; lead paragraphs at 1.125–1.25rem in monitor-2, capped near 42rem (max-w-xl/2xl).
- **Label** (600, 0.75rem): chips (fichas) and small metadata; sentence case, never tracked uppercase.
- **Data** (JetBrains Mono, tabular-nums, 0.875–1.875rem): prices, scores, ratings, dates, counts, the session timer.

### Named Rules
**The Readout Rule.** Mono is a readout, not a style: it sets prices, scores, times and counters, with tabular numerals. Words stay in Onest.

**The Sign Rule.** All h1–h4 use the letrero face at -0.02em to -0.03em tracking with balanced wrapping. Headings sit directly on the wall; nothing small and uppercase is stacked above them.

## Layout

A single centred container (max 80rem) with fluid side gutters (clamp(1rem, 4vw, 2.5rem)). The counter bar is sticky at 4rem; page-level filter bars stick directly beneath it (top: 4rem) on the pared ground with a bottom divider.

Pages are asymmetric 12-column compositions, not centred stacks: the home first viewport splits 7/5 (question + search left, poster wall right); game detail splits 8/4 (content / price board); featured grids use unequal tracks (1.35fr / 1fr with the lead item spanning two rows) so no grid is a row of identical cards. Sections are spaced at 7rem, heading to content at 3rem, panel padding 1.25rem, card gaps 1.5–2rem. The poster wall uses a 2-column grid with a 1200px perspective so posters can tilt.

At 390px everything collapses to one column; the poster wall stays two-up beneath the search; wide content (the credential canvas, galleries, live rows) scrolls horizontally rather than shrinking.

## Elevation & Depth

Flat cubicles, lifted posters. Cubicles, fields and the counter sit flat and separate by tone (pared → pared-2 → cubiculo) and a 1px cubiculo-2 border. Real shadow exists only on things that are physically off the wall: posters and floating lists. Hover lifts are translations (−2 to −6px), not new shadows, except on posters.

### Shadow Vocabulary
- **Afiche en reposo** (`box-shadow: 0 14px 28px -12px rgb(0 0 0 / 0.7), 0 2px 4px rgb(0 0 0 / 0.4)`): every taped poster at rest.
- **Afiche despegado** (`box-shadow: 0 26px 40px -14px rgb(0 0 0 / 0.8), 0 4px 8px rgb(0 0 0 / 0.4)`): poster on hover/focus-within while it tilts toward the pointer.
- **Lista flotante** (`box-shadow: 0 24px 40px -16px rgb(0 0 0 / 0.75)`): search results dropdown.

### Named Rules
**The Off-The-Wall Rule.** Only posters and floating lists cast shadows. A cubicle never does; give it depth with tone and border.

## Shapes

One corner: 4px (cubiculo) on cards, panels, buttons, fields and posters; 3px on chips, segments and list rows; 2px on meters and highlights; circles only for the live dot. Borders are 1px solid cubiculo-2; empty states use a 1px dashed cubiculo-2 frame; price rows are separated by dashed amber hairlines (≈0.25 alpha). Posters rotate between −1.2° and +1.4° (0° for the straight variant) and carry a translucent strip of tape (72×20px, dashed edges, rotated 2°) centred on the top edge. Top bands (3–4px border-top) mark identity: game brand colour on eSports posters, side A/B colour in comparison cards.

## Components

### Buttons
Solid and quiet, sized for thumbs.
- **Shape:** 4px corners, min-height 2.75rem (compact 2.25rem in the counter), 600 weight at 0.95rem, icon + label with 0.5rem gap.
- **Principal:** nexos fill, white text; the one primary action per group.
- **Línea:** transparent with cubiculo-2 border and monitor text; hover shifts border to nexos-claro and fills with nexos at 12%.
- **Hover / Focus / Active:** colour transitions 0.2s; active presses down 1px and scales to 0.98; focus is the global 2px amber outline at 3px offset; disabled 55% opacity.

### Chips (fichas)
- **Style:** 0.75rem/600, 3px corners, tabular numerals, inline icon/dot gap 0.4em.
- **Variants:** ambar (solid amber, ambar-tinta text) for "abierto", upcoming and fresh items; vivo (green at 14% with a 35% border) for live, always paired with the pulsing dot; nexos (purple at 25%, lilac text) for genre/time on solid surfaces; sobre-foto (pared at 88%, monitor text, 50% nexos-claro border) for any tag laid over a photo, so it reads on light and dark art alike; tenue (cubiculo-2, monitor-2) for neutral/finished states and key hints.

### Cards / Containers (cubículos)
- **Corner Style:** 4px.
- **Background:** cubiculo; inset areas in pared-2.
- **Shadow Strategy:** none (see Off-The-Wall Rule).
- **Border:** 1px cubiculo-2; hover moves to cubiculo-borde-hover, or to amber when the card leads to a price, and lifts −3 to −4px. Live items take a green border.
- **Internal Padding:** 1.25rem; image areas bleed to the edge with a scrim under any text.

### Inputs / Fields
- **Style:** pared-2 fill, 1px cubiculo-2 border, 4px corners, min-height 2.75rem; the counter search is a 4rem bar with a leading icon and a "Enter" chip.
- **Focus:** border turns amber and the fill lightens slightly (#1f1a2e on fields). Caret is amber. No glow.
- **Error:** alerta text with the alert icon below the field, role="alert".

### Navigation (mostrador)
- Integrated header: sticky 4rem, same pared as the page, no box and no border. A 1px cubiculo-2 cable runs across at 10px and each link hangs from it on a short thread. When the page scrolls, a 1.5rem pared-to-transparent fade appears under the header instead of a line.
- Left: logo, the "Nexos" sign (letrero, flickers on once per session) and the "abierto" sign: an amber board tilted −4°, taped at both corners, with two amber bands underneath. On hover (fine pointers only) it swings like a damped pendulum for ~1s.
- Right: links in monitor-2, 500 weight, hover monitor. The active link sits under a single lamp: a monitor-white shade with a light cone (monitor 20% → 0) that spills ~11rem into the page and flickers faintly every ~6s. The lamp slides between links on navigation (450ms, soft overshoot) and fades out on pages with no nav link (perfil).
- Session cubicle shows avatar and a green mono timer, hover border green. Below md, links move to a pared-2 drop-down with a 1.5rem monitor underline on the active item and full-width buttons.
- Reduced motion: the lamp fades instead of sliding, no flicker, no swing.

### Afiche (signature)
A featured item taped to the wall: rotated, shadowed, with tape on top. On mouse hover it tilts in 3D toward the pointer (max 8°, perspective 900px, lifts 6px) and springs back elastically. Fills vary by role: pared-2 with an amber border for the price board, cubiculo for matches and tournaments, nexos for forum questions. Disabled under reduced motion and for touch.

### Tablero de precios (signature)
Price board on pared-2 with a 45% amber border: rows of game/store on the left and an amber mono price on the right that rolls up from zero on entry; dashed amber row dividers; hover turns the title amber.

### Motion
One easing (ease-salida, cubic-bezier(0.16, 1, 0.3, 1)). Page changes cross-fade 0.35s with a short rise; the catalogue cover morphs into the detail hero (view-transition "portada-juego", 0.5s). Lists enter staggered (0.6s, 18px rise, 0.06s step); sections reveal on scroll once with varied movement; filtered grids reorder with Flip. Skeletons shimmer in cubicle tones. With reduced motion: no tilt, no flicker, no marquee, entrances become 0.2s fades.

## Do's and Don'ts

### Do:
- **Do** build every container as a cubicle: cubiculo fill, 1px cubiculo-2 border, 4px corners.
- **Do** reserve amber for prices, deals, the "abierto" sign and focus; reserve green for what is live and the session timer.
- **Do** set every price, score, date, count and timer in JetBrains Mono with tabular numerals.
- **Do** put game brand colour only in a poster's 4px top band.
- **Do** use a dark pared scrim (not a coloured gradient) whenever text sits over game art.
- **Do** give featured content the poster treatment (rotation −1.2° to +1.4°, tape, poster shadow) and keep ordinary lists as flat cubicles.
- **Do** provide a reduced-motion path for every animation.

### Don't:
- **Don't** use neon glows, glassmorphism or decorative gradients.
- **Don't** place kickers or eyebrows (small uppercase labels) above headings.
- **Don't** mark cards with coloured side stripes; identity bands go on the top edge only.
- **Don't** use mono for words, labels or headings.
- **Don't** spend amber or green on generic links, icons or decoration.
- **Don't** add shadows to cubicles, buttons or fields.
- **Don't** build a row of identical cards under a centred headline.
