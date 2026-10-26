# Floema — experimental 3D image-field hero, chaptered nature photography

- Live: https://floema.com/ (Portuguese maker of signage, street furniture and equipment for urban,
  nature, golf and recycled-plastic projects; site in pt-PT, footer "Made by Büro").
- Award evidence (search only, Awwwards not reachable): WebSearch summary for
  `Floema Bürocratik awwwards site of the month` quoted the listing text
  "Floema, DEV, Developer Award, SOTM, Site Of The Month, May, 2026"; a Bürocratik-linked LinkedIn post
  says the project was "recently recognised as Site of the Month at awwwards". Footer credit "Made by Büro"
  is consistent with Bürocratik. Award page itself not loaded.
- Method (2026-10-26): Playwright Chromium 1194 headless, WebGL on SwiftShader (software).
  Desktop 1440×900 wheel run (400 px steps, 15 screenshots to the bottom), mobile 390×844 touch-drag
  run (13 screenshots), desktop run with `reducedMotion: 'reduce'` (8 screenshots), a hero sequence
  (2 frames 1.2 s apart, mouse to two corners, 5 small wheel steps), Tab ×6 focus check, computed-type
  sample across the DOM, network log. Cookiebot modal closed with "Deny".

## Observations

- **Hero (desktop):** centred two-line h1 "Espaços pensados para viver e durar uma vida." on warm
  off-white #F2EFEA. Around it, dozens of small product/project photos float at different depths in a
  three.js canvas (`div.three-container > canvas`, 1440×900; `window.__THREE__ = "181"`). Two frames
  1.2 s apart show a different arrangement, so the field moves on its own (time-based drift toward the
  camera); moving the mouse also changed it, but drift and parallax could not be separated.
  Headline text was readable ≈2 s after DOMContentLoaded; the image field filled in by ≈8 s (software GL).
- **Transition to chapters:** the first wheel steps lift a full-bleed photo up from the bottom over the
  hero (panel slides over, hero stays under it). Chapters are numbered 01–05 with a coloured category pill
  (Urban, Nature, RePlastic, Golf, Details), a one-sentence claim in large white type over a darkened
  photo, a pill CTA "VER PRODUTOS …", "Scroll para Explorar ↓", and a floating white card
  "Catálogo Urban / Descarregar ↓" (PDF catalogue) bottom-right. Each chapter photo wipes into the next.
- **Rest of page:** "Floema® Est. 2007" + manifesto paragraph with two recent project cards
  (place + date); recent products with "EXPLORE" pill, colour dots, sizes; a collections index set in
  large type with counts and a thumbnail per line ("RePlastic (73)", "Golf (62)", "Details (00)",
  "Urban (51)"); a dark green #042D2B testimonial block with a named partner photo; three process
  columns (Desenhamos / Construímos / Implementamos) with workshop photos; newsletter; a full
  yellow #E9E778 footer with a huge black logo arrow, line drawings of their products, addresses,
  phone and e-mail as text (no `tel:` link found), "Made by Büro".
- **Navigation:** desktop top-right white pill tabs (PRODUTOS, SOBRE, SUSTENTABILIDADE, JORNAL) +
  search icon + language. Mobile: logo, language, a combined menu/search pill. No skip link.
- **Type (computed):** one family, `Zimula`, weight 400 only. Desktop h1/h3 57.2/60 px with −2.288 px
  tracking (−0.04 em), h2 51/56 px, chapter claims 43.75 px, cards 18–19 px, labels 12 px uppercase,
  captions 14 px. Mobile h1 32 px, h2 30 px.
- **Colour:** text #241F21 on #F2EFEA; white type over darkened photos; deep green #042D2B block;
  acid-yellow #E9E778 footer/quote; category pills orange, sand, blue, green.
- **Mobile:** same chapters and order, stacked; the image-field hero shows only the headline in the first
  1.5 s screenshot; catalogue cards stay as floating cards. Touch drags scrolled normally (Lenis
  `html.lenis` present).
- **Reduced motion:** layout and chapter wipes looked the same under `reduce` emulation; the image field
  still rendered. No evidence that the site changes anything for reduced motion.
- **Accessibility:** Tab moved through logo, search input, nav tabs with `outline: none` and no box-shadow,
  so focus was not visible in our screenshots. Several icon-only buttons have `aria-label="Button"`.
  65 images, none missing `alt`. The yellow circle bottom-left is the Cookiebot settings widget.
- **Weight:** ≈183 requests, ≈22 MB transferred on desktop (≈21.8 MB mobile). Of that, four MP3 files
  of ≈3.5 MB each ("about-foreground", "sustainability-foreground-0/1/synth") ≈14 MB were fetched on the
  home page although no sound control was found on it. 3D textures (`/3d/shadows/packed_texture_3.png`
  464 kB) and Sanity images make up most of the rest. Nuxt build.

## Interpretation

- The hero is "experimental" without being hard to use: the message is a plain centred sentence; the
  3D field is decoration made of the company's own work, so it doubles as a portfolio glance.
- Chapters = product lines. Each chapter repeats the same anatomy (number, pill, one claim, one CTA, one
  download), which makes a long, cinematic page scannable and gives every chapter its own conversion.
- One typeface at one weight, with hierarchy only by size and tight tracking, keeps a busy visual page calm.
- Earthy photography (granite, boardwalks, timber clubhouse) plus an off-white ground carry the
  "nature" feel; the acid yellow footer is the single loud brand moment.

## Borrow

1. A chaptered home: numbered sections, each with category label, one sentence, one CTA, one download.
2. A centred one-sentence hero over a light, slowly drifting field of the business's own photos — can be
   done with CSS transforms on 15–25 small images (no WebGL).
3. "Panel slides over the hero" transition (sticky hero + next section with higher z-index).
4. Collections index in large type with counts and a thumbnail.
5. One full-colour footer block as the closing brand moment.

## Do not carry over

- Preloading ≈14 MB of audio on the home page.
- Invisible focus (`outline: none`) and `aria-label="Button"`.
- Phone as plain text instead of a `tel:` link.
- Ignoring reduced motion for a continuously moving hero.
- Their Zimula type, yellow, logo arrow and product photos.

## Could not verify

- Award page, jury notes and the exact studio credit beyond "Made by Büro".
- Whether the floating field reacts to the cursor (drift and mouse response were mixed).
- Sound behaviour (no audible output in headless runs; no control found).
- Real-GPU frame rate; our timings are software-GL upper bounds on a shared CPU.
