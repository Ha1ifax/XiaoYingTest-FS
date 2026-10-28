---
version: alpha
name: Kindsight-design-analysis
description: "A warm, mission-driven fundraising brand built on a deep olive canvas and an editorial, high-contrast serif. Chartreuse carries the emotional voltage — hero headlines, primary calls to action, the wordmark — while soft coral and blush add human warmth without becoming playful. Product UI is shown as a physical collage: cream application cards, masks of real people and softly rounded photography, and small alert slips that overlap the interface. The overall rhythm is generous and calm, with oversized serif statements followed by practical sans-serif explanations."

colors:
  ink: "#1e2415"
  ink-soft: "#454a38"
  forest: "#3d4128"
  forest-deep: "#2d331d"
  forest-muted: "#596047"
  lime: "#e1f079"
  lime-hover: "#d2e566"
  lime-ink: "#2d331d"
  coral: "#e07553"
  coral-hover: "#c96343"
  coral-soft: "#febeb4"
  canvas: "#faf5f1"
  surface: "#fefffa"
  surface-strong: "#f3ede6"
  stone: "#e5e1d6"
  hairline: "#ded7cc"
  hairline-dark: "#5b6049"
  muted: "#74776a"
  on-dark: "#faf5f1"
  on-dark-soft: "#d8d6c7"
  success: "#6c8e4d"
  warning: "#b77a32"
  danger: "#b84e3d"
  scrim: "#1e2415"

typography:
  display-hero:
    fontFamily: "'Kindsight Serif', 'Canela', 'GT Alpina', 'Iowan Old Style', 'Palatino Linotype', Georgia, 'Songti SC', 'Noto Serif CJK SC', serif"
    fontSize: 92px
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: -2.8px
    fontFeature: kern, liga
  display-xl:
    fontFamily: "'Kindsight Serif', 'Canela', 'GT Alpina', 'Iowan Old Style', Georgia, 'Songti SC', serif"
    fontSize: 72px
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: -2px
  display-lg:
    fontFamily: "'Kindsight Serif', 'Canela', 'GT Alpina', 'Iowan Old Style', Georgia, 'Songti SC', serif"
    fontSize: 56px
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: -1.2px
  display-md:
    fontFamily: "'Kindsight Serif', 'Iowan Old Style', Georgia, 'Songti SC', serif"
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: -0.8px
  card-title:
    fontFamily: "'Kindsight Serif', 'Iowan Old Style', Georgia, 'Songti SC', serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.3px
  body-lg:
    fontFamily: "'Kindsight Sans', 'Söhne', 'Inter', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.1px
  body:
    fontFamily: "'Kindsight Sans', 'Söhne', 'Inter', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "'Kindsight Sans', 'Söhne', 'Inter', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Kindsight Sans', 'Söhne', 'Inter', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.1px
  eyebrow:
    fontFamily: "'Kindsight Mono', 'SFMono-Regular', Consolas, monospace"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 1.2px
  button:
    fontFamily: "'Kindsight Sans', 'Söhne', 'Inter', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  quote:
    fontFamily: "'Kindsight Serif', 'Iowan Old Style', Georgia, 'Songti SC', serif"
    fontSize: 38px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.5px

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 20px
  xl: 28px
  panel: 32px
  pill: 999px

spacing:
  hair: 1px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 112px
  section-tight: 80px
  page-gutter: 48px

components:
  site-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderBottom: "1px solid {colors.hairline}"
    height: 76px
    padding: 0 {spacing.page-gutter}
    typography: "{typography.label}"
  button-coral:
    backgroundColor: "{colors.coral}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 13px 24px
  button-coral-hover:
    backgroundColor: "{colors.coral-hover}"
    textColor: "#ffffff"
  button-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.lime-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 15px 28px
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 11px 22px
  button-dark:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 15px 30px
  hero-panel:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.on-dark}"
    minHeight: 620px
    padding: 88px {spacing.page-gutter}
  hero-headline:
    color: "{colors.lime}"
    typography: "{typography.display-hero}"
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
    padding: 32px
  feature-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "40px 28px"
    textAlign: center
  testimonial-panel:
    backgroundColor: "{colors.coral-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "48px 56px"
  image-tile:
    rounded: "{rounded.lg}"
    objectFit: cover
  status-pill-success:
    backgroundColor: "#dfe8cf"
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
    padding: "5px 10px"
  status-pill-failure:
    backgroundColor: "{colors.coral-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.pill}"
    padding: "12px 18px"

## Overview

Kindsight is fundraising software for nonprofits, universities, and healthcare institutions. The visual language has to carry two ideas at once: **ambition** (large-scale philanthropy, serious data, confident product) and **care** (real people, human relationships, mission). It does this by pairing an austere deep-olive field and an almost-black ink with a high-contrast editorial serif, then softening the system with chartreuse light, coral/blush warmth, and photographs of actual people.

The signature move is not a decorative effect. It is **collage as evidence**: a product UI card, a human portrait, and a tiny notification slip overlap at different depths, as if an operator has pinned the most important pieces of their day onto a board. This same composition should be used to explain any workflow: show the state, show the person, show the result.

## Source and scope

This is an **unofficial reconstruction** of the Kindsight visual system from the public [getdesign.md Kindsight catalog page](https://getdesign.md/design-md/kindsight) and its landing-page reference image (`https://cdn.getdesign.md/catalog/kindsight/home.jpg`), plus the public Kindsight site. getdesign.md currently presents Kindsight as a catalog/screenshot entry with a “Request a DESIGN.md analysis” action; it does not publish a downloadable Kindsight `DESIGN.md`. This file was assembled so a coding agent can apply the observed design language consistently. It is not an official Kindsight asset and is not affiliated with Kindsight.

The target is a **landing-page and product-surface language**, not a brand-guideline PDF. It covers the visual decisions a frontend implementation needs: palette, type, composition, surfaces, controls, motion, responsive behavior, and accessibility.

## Brand idea

- **Editorial, not corporate.** Serifs do the speaking; sans-serif does the explaining.
- **Human, not cute.** Warm cream, blush, and coral are grounded by olive and near-black. No gradients-for-decoration, no glossy 3D.
- **Proof through composition.** Show the interface working inside a human context; overlap, crop, and layer rather than placing a clean screenshot in a gray box.
- **Quiet confidence.** Generous whitespace and large type; small labels are precise and restrained. Nothing shouts except the chartreuse headline.
- **Philanthropy is the subject.** Photography should feel candid, natural-light, and dignified. Avoid pity imagery, stock handshakes, and exaggerated smiles.

## Color

| Token | Hex | Role |
| --- | --- | --- |
| `ink` | `#1e2415` | Primary text on cream/white; logo and footer. |
| `forest` | `#3d4128` | Hero canvas, footer, dark panels. |
| `forest-deep` | `#2d331d` | Dark-panel shading, footer wells, hover on dark. |
| `lime` | `#e1f079` | Hero display type, primary CTA on dark, brand wordmark. |
| `coral` | `#e07553` | Header CTA, links with energy, active accents. |
| `coral-soft` | `#febeb4` | Testimonial panel, failure/attention wash. |
| `canvas` | `#faf5f1` | Page background; warm paper, never pure white. |
| `surface` | `#fefffa` | Cards, product UI, dialog surfaces. |
| `stone` | `#e5e1d6` | Quiet section bands and image backplates. |
| `hairline` | `#ded7cc` | Borders and dividers. |
| `muted` | `#74776a` | Secondary copy, metadata. |

Rules:
1. Keep the page canvas cream. Pure white is reserved for interactive surfaces and UI cards.
2. Chartreuse is a **headline/action** color, not a large flat background for ordinary sections.
3. Coral is for conversion and human warmth. Do not use coral for destructive actions; use `danger` for those.
4. On forest, body copy is `on-dark`; secondary copy is `on-dark-soft`. Never place gray text on forest.
5. Accent pairings that are proven: lime on forest; forest ink on lime; coral/white on cream; ink on blush. Avoid lime on coral.

## Typography

The system is built from **two voices**:

- **Display serif** — high stroke contrast, slightly calligraphic, appears at 40–92px, line-height 0.96–1.12, negative tracking. Use for headlines, quotes, template titles, and large numbers. Italic is a first-class emphasis style, often underlined with a single chartreuse stroke.
- **Humanist sans** — quiet, neutral, 14–19px, normal tracking. Use for paragraphs, labels, navigation, buttons, status, and dense table-like information.
- **Mono** is limited to eyebrow labels and numeric metadata (timestamps, task IDs, counts).

Implementation note: if the licensed faces are unavailable, use the fallback stacks above. `Iowan Old Style`/`Palatino`/`Georgia` keep the editorial skeleton; `Söhne`/`Inter`/`Segoe UI` keep the sans neutral. For Chinese, pair a Song/Ming fallback (`Songti SC`, `Noto Serif CJK SC`, `SimSun`) with `Microsoft YaHei` for body. Do not fake high contrast with a geometric sans headline.

Type examples:
- Hero: `font-size: clamp(3.4rem, 6.4vw, 5.75rem); line-height: .96; letter-spacing: -.03em;`
- Section heading: `font-size: clamp(2.25rem, 4vw, 3.5rem); line-height: 1.06;`
- Body: `font-size: 1rem–1.125rem; line-height: 1.55–1.65; max-width: 62ch;`
- Eyebrow: 11px mono, uppercase, `letter-spacing: .12em`.
- Buttons: 15px sans, 600, no letter spacing.

## Layout

- Page gutter: 48px desktop, 32px tablet, 20px mobile.
- Content max width: 1280px; wide editorial sections may use the full viewport with the same gutters.
- Header height: 76px. Sticky, cream with a hairline; do not blur into a glass panel. The brand and nav should remain crisp at every scroll position.
- Hero: two columns (about 1.05fr / 0.95fr), 64–96px vertical padding, 48–64px column gap. The right collage may break the grid slightly but must not create horizontal scroll.
- Section rhythm: 112px top/bottom desktop, 80px tablet, 56px mobile. Never stack sections with equal heavy containers; alternate full-bleed color bands with open cream space.
- Grid: 12 columns; cards commonly 3-up (gap 20–24px), feature rows 2-up. Text columns max 62ch.
- Use asymmetry: an image at 4:5 next to a text column aligned low; not every section should be centered.
- Dense product surfaces (task lists, order summaries) should use a narrower measure and clear vertical rhythm, not shrink the type below 13px.

## Surfaces and depth

- Cards: 20px radius, 1px `hairline`, `surface` background, **no heavy shadow**. On cream, a barely visible warm shadow is acceptable: `0 1px 2px rgba(30,36,21,.04), 0 18px 40px rgba(30,36,21,.04)`.
- Images: 20px radius; no perfect squares. A 4:5 portrait, 3:2 landscape, or mask with a soft organic cut is preferred over a uniform card grid.
- Dark panels: 28–32px radius and generous padding. Do not put a dark card on a dark page without a hairline border.
- Floating UI slips: 10–12px radius, white, 1px hairline, 10px shadow. These are the one place small type (12–14px) is allowed.
- Borders: 1px, low contrast. No thick outlines except focus rings.
- Dividers: 1px `hairline`; on dark use `hairline-dark` at 40–60% opacity.

## Components

### Header
Cream background, 76px height, hairline bottom. Left: wordmark in a wide serif or the brand's custom face, 28–32px, tight tracking. Center/left nav: 14–15px sans, 24–32px gaps, `ink` at 80% and full ink on hover/current. Right: one quiet outline pill and one coral primary pill. In the app version, the user/identity control replaces the outline pill but keeps its shape and height. Mobile: logo + menu trigger; no cramped nav.

### Buttons
- **Coral primary**: coral fill, white label, pill, 46–50px height; hover darkens to `coral-hover`. Used for “Get a demo”, “Book a demo”, and app-level primary creates.
- **Lime on dark**: lime fill, forest label, pill, 48–54px; hover shifts to `lime-hover`. Used only inside forest panels.
- **Outline**: transparent, 1px hairline, ink label, pill; hover fills `surface`.
- **Dark**: forest fill, cream label, pill; used on stone/blush panels.
- Buttons always include a 14–16px arrow on conversion actions; arrow translates 3px on hover. Icon-only buttons need a text alternative.
- Focus: 2px coral ring with 2px cream offset (or lime ring on dark). Never remove focus.

### Pills and chips
Small, 999px, 11–12px sans/mono, 6px 10px padding. Category chips: cream surface, hairline; active: forest background/cream text or lime background/forest text. Status: success uses pale sage + forest; failure uses blush + danger; processing uses lime + forest.

### Feature cards
Three-up, white, 20px radius, centered. A simple line icon at top (24–28px), serif title at 26–28px, sans body at 15–16px, and a text link with arrow at the bottom. Height should align, but do not force all copy to the same length. On mobile, stack; reduce padding to 24px.

### Testimonial panel
Full-width blush panel, 20px radius, 48–56px padding. Top-left: mono name/title; top-right: customer logo (monochrome, max-height 32px). Quote: display serif at 32–38px, line-height 1.2, quotation marks included. Add one hand-drawn looping line in the bottom-right using SVG, stroke `ink` at 1.5px, `vector-effect: non-scaling-stroke`. The loop must be decorative and `aria-hidden`.

### Product collage
This is the signature illustration pattern:
1. Base layer: a cream `surface` application card (12–20px radius), rotated 0–2deg, containing a simplified but believable UI (header, stat, table, task rows). Build it in HTML/CSS, not as a flat screenshot.
2. Human layer: a portrait or candid image with a 20px radius, mask or soft crop, overlapping the bottom-left or right of the UI.
3. Floating slips: 1–3 white notification cards, 10px radius, hairline border, small shadow. Use one with a colored icon (coral ring for alerts, lime for success).
4. A lime or coral accent: small badge, underline, or circular stamp. One accent per collage.
Keep all text in the collage legible enough to suggest the product. On mobile, simplify to the base card plus one image and one slip.

### Forms and inputs
White surface, 1px hairline, 12–16px radius (pill for single-line email capture; 12px for text areas). Label above at 13px sans, 600. Placeholder muted. Focus ring coral. Error text below in `danger` at 13px, plus an alert icon. Do not use floating labels; the system is direct and editorial.

### Dialogs
Cream or white surface, 24–28px radius, 24–32px padding, dark forest scrim at 55–65% opacity. Use a visible close button (circle, 36–40px, hairline). Headline serif 32–40px; body sans 15–16px. On mobile, fill the viewport width minus 20px and align to the top with 16px margin. Native `<dialog>` is preferred for focus management and Escape support.

### Motion
- 160–220ms ease-out for hover/focus; 240–320ms for dialogs and panels.
- Cards lift 2px and gain 1–2% shadow only; images scale 1.015 on hover.
- Arrows translate 3px.
- Stage indicators fill/rotate rather than bounce.
- Respect `prefers-reduced-motion`; remove transforms and smooth scrolling.
- No autoplay carousels or looping decorative videos near form controls.

## Page compositions

### Marketing / template browsing
1. Cream header.
2. Full-bleed forest hero: lime serif headline on the left; body copy in cream; lime CTA; product collage on the right. One italic word/phrase with a chartreuse underline.
3. Cream trust strip: a serif line (“Made for the moments that matter”) and 4–5 quiet logo/category marks. This is not a card row.
4. Alternating editorial feature rows on cream: image collage on one side, serif heading + 2–3 paragraphs on the other. At least one row should place a small coral eyebrow above the heading.
5. Template/catalog section: title with one italic word; category chips; 3-up cards with 4:5 imagery, 20px radius, coral category tag, serif title, sans description, and a restrained arrow. Hover raises the card; no dark overlays that obscure the cover.
6. Blush testimonial / quote band if social proof is available.
7. Final stone CTA band: serif question, dark pill CTA, line drawing in the negative space.
8. Forest footer: lime wordmark, cream link columns, email capture in a white pill, legal microcopy.

### Template detail / creation
1. Cream header and breadcrumb.
2. Editorial intro on cream: eyebrow, large serif title, short description, a vertical coral rule, and a 4-column spec row (images, formats, size, output). Photograph/cover sits to the right in a 4:5 frame with a cream caption slip.
3. Upload section: serif heading (“YOUR MATERIALS” in mono eyebrow), a 2-up or 3-up grid of dashed upload wells on cream. Wells become white when filled; image previews use 16px radius. Keep controls and status text on the surface, never over the image only.
4. Sticky order card: white surface, hairline, 20px radius. Product summary, stages, clear primary button. Use coral for submit and lime/forest for completed stage dots. Do not use a dark panel here — the content needs maximum legibility.
5. Error/failure: blush wash with an alert icon, forest text, one clear recovery action.
6. Keep the footer forest. A dark footer immediately after a cream form is part of the rhythm.

### History / personal archive
1. Cream hero with a two-column layout: serif “My archive” title, short body, coral/lime actions; a white “studio ledger” card with 4 large serif numbers and hairline dividers.
2. Records heading with a small sync status on the right (green dot when idle; coral/lime pulsing dot when polling).
3. Filter chips + a quiet refresh action.
4. Task cards: white surface, 20px radius, 1px hairline. Thumbnail 4:5 at 160px with 14px radius; title serif 30–34px; metadata sans 12–14px; stage track with 3 steps; current stage shown in a pale lime strip; failure reason in blush. Actions right-aligned; one primary dark/coral pill.
5. Sidebar: identity card, sync explanation, simulation/telemetry card. Use mono labels and hairline dividers, not nested cards inside cards.
6. Empty state: editorial, not a generic gray box — a dark forest panel with a large outlined “00”, serif heading, and one CTA.

## Voice

Confident, warm, specific. Talk about the work, not the software category. Prefer verbs and concrete outcomes (“find the right donors”, “keep every promise”) over abstractions (“leverage synergies”). Short sentences. Sentence case. No exclamation marks. Chinese copy should mirror this: concrete, calm, lightly literary; avoid exclamation and excessive four-character slogans.

Microcopy examples:
- “Fundraising software that unlocks opportunities.”
- “Ready to create lasting impact?”
- “Your materials, in order.”
- “The studio is checking your files.”
- “This piece needs one more image.”

## Responsive behavior

- Breakpoints: 1200, 960, 780, 560px.
- 1200: keep 3-up cards but reduce gutters; hero headline max 72px.
- 960: two-column hero stacks; hero collage moves below copy and becomes a 1.2:1 composition; 3-up cards become 2-up; sidebar stacks below main history.
- 780: header nav collapses to a menu; page gutters 24px; feature rows stack image-first; sticky order panel becomes static below upload slots.
- 560: single column; hero headline 48–54px; cards 100% width; buttons can stretch but maintain 44px minimum height; dialogs top-aligned; type never below 13px.
- Test at 390px. Ensure `scrollWidth === clientWidth`; decorative glows and collage edges must be clipped by their section, not the body.

## Accessibility

- Body text on cream must use `ink` or `ink-soft`, never `muted` for long copy. `muted` is for metadata.
- Lime is a display/CTA color, not body text on cream (insufficient contrast). On forest, lime is valid for large headings and button labels at 600 weight.
- Coral buttons use white text only at 600 weight and 15px+; verify contrast; if needed use forest text on a lighter coral.
- Visible focus on every control: 2px coral ring, 2px offset. On dark: 2px lime ring.
- All images have meaningful alt text; decorative line art is `aria-hidden`.
- Native buttons/links, semantic headings, `<dialog>` with focus return, `aria-live` for status changes, and disabled/busy states for submissions.
- Do not encode status with color alone: pair with icon + label.
- Motion honors reduced motion; no flashing or fast looping.

## Implementation tokens

```css
:root {
  --ink: #1e2415;
  --ink-soft: #454a38;
  --forest: #3d4128;
  --forest-deep: #2d331d;
  --lime: #e1f079;
  --lime-hover: #d2e566;
  --coral: #e07553;
  --coral-hover: #c96343;
  --coral-soft: #febeb4;
  --canvas: #faf5f1;
  --surface: #fefffa;
  --stone: #e5e1d6;
  --hairline: #ded7cc;
  --muted: #74776a;
  --on-dark: #faf5f1;
  --on-dark-soft: #d8d6c7;
  --radius-card: 20px;
  --radius-panel: 28px;
  --shadow-soft: 0 1px 2px rgba(30,36,21,.04), 0 18px 40px rgba(30,36,21,.04);
  --font-display: "Iowan Old Style", "Palatino Linotype", Georgia, "Songti SC", "Noto Serif CJK SC", serif;
  --font-sans: "Segoe UI", "Microsoft YaHei", "Inter", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, monospace;
}
```

## Do / Don't

**Do**
- Let one large serif sentence carry each section.
- Use the dark olive hero as the one full-bleed dark moment; repeat dark only in footer and select panels.
- Build the product collage from real interface pieces, not abstract blobs.
- Use generous white space and align secondary actions quietly.
- Pair every color-coded status with a label and icon.

**Don't**
- Don't use pure black (`#000`) for text on cream; use `ink`.
- Don't fill large sections with lime or coral; they are accents.
- Don't put white text on coral-soft; use forest.
- Don't use glossy gradients, glassmorphism, or 3D icon sets.
- Don't reuse the same card radius, shadow, and padding for every surface; the system distinguishes product surfaces, editorial bands, and floating slips.
- Don't copy Kindsight's logo, copy, or photography; borrow the visual grammar, not the brand assets.

## Attribution

Visual analysis reconstructed from public references for design-study purposes. Kindsight and its marks belong to Kindsight; getdesign.md and its catalog belong to their respective owners. This file is not an official Kindsight or getdesign.md template.
