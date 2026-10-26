# Kōzōwood — organic, earthy, sound-and-video led (wood houses)

- Live: https://kozowood.com/ (Portuguese builder of CLT / timber-frame houses; product lines
  "Kōzōwood" custom houses, "MUDA Reserve", "OOTY" modular cabins; site in Portuguese; footer "Made by Büro").
- Award evidence — weaker than the others, read carefully:
  - Awwwards: only an **element listing** surfaced: WebSearch summary for
    `kozowood awwwards site of the day Bürocratik`: "An Awwwards page lists a Mobile element from
    "Kōzōwood — Made of Nature," credited to Bürocratik … doesn't confirm a win."
    (URL in results: awwwards.com/inspiration/mobile_thumbnail-submission-65aa92c0b8ee8386992006).
    Query `"Kōzōwood" awwwards honorable mention OR "site of the day"` found nothing.
  - Other jury award: European Design Awards listing "Project Kōzōwood.com Agency Bürocratik Year 2024
    Award Bronze", describing "custom audio, field recordings … WebGL".
  - So: **listed on Awwwards, award not confirmed.** Kept because it is the clearest organic/earthy
    case and is from the same studio as an SOTM (Floema).
- Method (2026-10-26): Playwright Chromium 1194; desktop 1440×900 wheel run (11 shots to bottom),
  mobile 390×844 touch run (6 shots), reduced-motion desktop run (8 shots), gate check in both motion
  modes, DOM-wide type sample, network log.
- **Environment workaround:** this Chromium cannot decode H.264 (`canPlayType('video/mp4; codecs="avc1…"') = ""`).
  Without help the loader never finished (`html.lenis-stopped`, blank beige #D9D0BB screen at 12 s).
  MP4s were intercepted, fetched with curl and served as WebM transcodes (first 25 s, 960 px). Blocky
  frames in some screenshots come from our fast transcode, not from the site.

## Observations

- **Entry gate (desktop, motion allowed):** full-bleed hero video, h1 "Onde a inovação na habitação é
  moldada." top-left, a dark pill button "✳ Entrar", and a small line "Este website utiliza cookies.
  Ao carregar 'entrar', está a aceitar os termos". Until it is clicked `html` has `lenis-stopped`
  (scroll locked). After "Entrar": a centred card slider "Sinta-se em casa com a Kōzōwood" with a
  "Ver" button over an aerial timber-roof video.
- **Reduced motion:** with `reducedMotion: 'reduce'` there was **no "Entrar" gate** and Lenis was not
  stopped (checked twice by DOM query at 16 s); a small cookie toast "Este website usa cookies. Saber
  mais. OK" appeared instead. Mobile also had no gate (cookie toast + card slider). Scroll-linked word
  fades still happened under reduce.
- **Story pacing (desktop, ≈9 000 px):** dark-brown band "Casas em madeira criam lares sustentáveis…"
  with a round video "porthole" → factory video (CNC / timber frames) → ochre section of large serif
  lines revealed word by word as you scroll ("Robustamente belo. / Quente, luminoso. / Naturalmente
  reconfortante. / Intemporalmente moderno.": later words sit at low opacity until scrolled) → loose
  collage of interior photos → "Sustentável. O espaço de habitação perfeito. Construído como o imagina."
  - pill "Sobre a Kōzō" → two product cards (Kōzōwood, OOTY) with "Saber Mais" → CLT contact card
    "Fale connosco" → "Deixe a inspiração tomar forma" (120 px serif over an architectural model photo,
    with line drawings of a house) → three journal cards ("ARTIGO … LER") → dark footer: full menu
    in large serif (Início, Sobre, Construir com Kōzōwood, Porquê Madeira, Sustentabilidade, Jornal),
    funding logos, and a full-width "KŌZŌWOOD" wordmark.
- **Navigation:** no visible nav bar; a small "≡" pill top-right and a chat bubble bottom-right on every
  screen. The full menu lives in the footer and behind the pill.
- **Type (computed + document.fonts):** `Ogg` (serif) 400/500 for display: 120 px h2, 84.4 px reveal lines,
  64/52 px menu, buttons 17–19 px Ogg 500; `PPMori` 400 for h1 (47.6 px, −1.9 px tracking) and body
  (15.3 px/19.8, 22.8 px intros). Mobile h1 30 px, section labels 22 px.
- **Colour (computed/pixel):** dark brown #3E362E (text and bands), tan #AB8867, ochre #BB945B,
  light stone #E1DDD4 / #EAE7DD. Text sits on flat colour bands; over video only the hero h1 and the
  small card text.
- **Links:** three `tel:` links, two of them malformed (`tel:Desegundaasexta-08:00h-17:30h`,
  `tel:Atendimentopormarca%C3%A7%C3%A3o`), one valid (`tel:+351253174491`); mailto links present.
- **Focus:** Tab reached "↓ SCROLL", "Ver" buttons, "Slide Button" ×2, "Sobre a Kōzō" with
  `outline: none` → focus not visible. Buttons labelled "Slide Button".
- **Libraries (evidence):** Nuxt (`window.$nuxt`, `/_nuxt/` chunks), `html.lenis lenis-smooth`,
  `window.__THREE__ = "160"` (three.js present, but no `<canvas>` found on the home page), HubSpot, GA, Meta pixel.
  No `window.gsap`.
- **Weight:** desktop ≈130–150 requests. Audio fetched on desktop: 10 MP3s ≈7.7 MB (music + field
  recordings per section: home, about, why-wood, building, sustainability). On mobile the XHR total was
  ≈10 kB — the audio was **not** fetched on mobile. Videos: six MP4 sources referenced (≈38.7 MB in total
  when fully downloaded, the largest "KOZOWOOD(HD)-mobile.mp4" 18.7 MB); how much a real browser streams
  depends on range requests and was not measured. No posters on the `<video>` elements (`poster` false).

## Interpretation

- The organic feel comes from material, not from blobs: wood and landscape video, tan/ochre bands,
  a soft high-contrast serif, and slow word-by-word reveals that read like breathing.
- Big serif statements alternate with dense, quiet sans paragraphs — a rhythm a hotel site can copy.
- Respecting reduced motion by **removing the entry gate** is a good pattern; the gate itself (scroll
  locked behind "Entrar" to start sound) is a cost for everyone else.
- The footer-as-menu with a giant wordmark gives a strong ending; hiding the nav during the story keeps
  the imagery clean but makes jumping around harder.

## Borrow

1. Earthy palette from materials: dark brown text, tan/ochre bands, stone light — derived from photos.
2. Serif display (high contrast) + neutral sans body; display lines revealed word by word (with a
   fully visible fallback).
3. Short manifesto lines as section openers, then one practical paragraph + one CTA.
4. Footer as a large-type menu + wordmark.
5. Reduced motion → skip any intro/gate entirely.

## Do not carry over

- Entry gate that locks scroll; sound by default; hidden main nav.
- Malformed `tel:` links; no posters on videos; ≈39 MB of video sources on the home page.
- `outline: none` on focus; "Slide Button" labels.
- Their Ogg/PP Mori pairing as-is, their footage and wordmark.

## Could not verify

- Awwwards award status (only an element listing found).
- Real H.264 playback and actual bytes streamed by a normal browser; audio playback.
- Hover states beyond one button hover (no visible change captured).
