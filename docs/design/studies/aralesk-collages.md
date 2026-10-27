# Aralesk — Collages & Motion: the studio wall as the layout

- Live: https://aralesk.es/ (collage artist, León, Spain); work board at https://aralesk.es/work.html
- Award: the live HTML embeds an Awwwards ribbon ("Awwwards HM ribbon") linking to
  https://www.awwwards.com/sites/aralesk-collages-motion, and a "W. Honors" tab shows on the page. A WebSearch summary
  of the Awwwards profile lists the site with an honorable mention badge. Award page and date not loaded (Awwwards
  unreachable).
- Method (2026-10-26): Playwright Chromium headless. Desktop 1440×900, mobile 390×844 and reduced-motion runs of the
  home page (all stayed on the shutter); then a probe that rejects cookies, drags the shutter up, wheels, and opens
  /work.html with six `scrollTo` shots at both sizes. After the shutter opened, screenshots needed a 120 s timeout
  (three.js on software rendering). Computed styles, alt counts, rotated-element count, overflow.

## Observations

- **Home:** a rusty metal shop shutter fills the screen with the stencilled "ARALESK" logo and small coloured dots;
  dragging it up shows a grid of coloured tiles with phrases ("Un latido", "Un fragmento"). Cookie bar at the bottom.
  No h1 on the home page; a skip link is present.
- **Work board:** dark intro, "WORK" in Bebas Neue 360 px under a hanging lamp, red threads falling from it. Then a
  kraft-paper board: collages printed with white borders like instant photos and black video frames, each slightly
  rotated (102 elements carry a rotation), held by coloured pins and washi tape, a handwritten-style title under
  each, sticky notes in between ("¿otra versión de esta?", "seguir por aquí", "¿un café?"), and one red thread running
  through the board. A small vertical scroll gauge sits on the right edge. The page ends on black: "NO TIRES DEL HILO.
  O SÍ." with a red ball of yarn.
- **Navigation:** "MENU" opens a numbered, labelled list: "01 HOME Inicio / 02 WORK Collages / 03 WEAR Arte para
  llevar / 04 ABOUT Sobre mí".
- **Type:** Bebas Neue for display (h1 360/288 px, h2 84/105 px), Anton for a marquee, Montserrat 300 for body
  (15.8/26 px at 55% white on black, low contrast).
- **Mobile:** the board becomes two columns of pinned prints with the same rotations and pins; readable, no
  horizontal overflow.
- **Reduced motion:** the shutter gate looked the same.
- **Weight:** about 3.5 MB on the home page before opening the shutter; 3 canvases, 10 videos.

## Interpretation

- The layout is the metaphor and still works as navigation: every piece is a pinned card with a title, and the red
  thread is both the reading path and the progress line. That is "experimental grid, kept usable".
- On mobile the same objects (prints, pins, rotation) survive in a simple two-column grid, so the idea is not lost
  when the collage cannot be free-form.

## Taken for Iron Lotus

- Pieces pinned at different scales with numbers, and a two/three-column grid of the same pieces on mobile.
- One red line that marks progress (the ink line down the index rail) and red pen marks on what is chosen.
- Photos as taped prints with white borders and a caption.

## Not taken

- The shutter gate and the heavy WebGL before content; the dark board; low-contrast body text; their fonts.
