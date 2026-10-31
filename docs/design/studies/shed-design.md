# Shed — sectors as a typographic index

- Live: https://shed.design/ (brand design and interior architecture, London).
- Award evidence (weak): WebSearch returned an Abduzeedo article titled "Award-Winning Web Design: How
  Shed.design Earned Awwwards SOTD"; the summary says "Shed.design just won Awwwards Site of the Day" and
  mentions Vue.js and Lenis. The article could not be opened (DNS failure for abduzeedo.com here), so the
  date is unknown and the Awwwards slug was not confirmed. The live footer says "SITE BY IJP + TA" and the
  page uses Lenis, consistent with the summary. Recorded as `partial`, not approved.
- Method (2026-10-27): Playwright Chromium, 1440×900 (wheel), slower desktop pass, 390×844, reduced
  motion, computed styles, fonts, Tab ×5. No screenshots in the repo.

## Observation

- **Hero:** full-bleed photo of a tiled washroom with red and green cubicles; "THIS IS SHED" in white
  OwnersWeb 600 capitals, 231 px / 208 px (100 px on mobile); a serif marquee strapline ("Building brands
  through experience for more than 25 years • …"); "MENU" top right; a small round video thumbnail.
- **Order:** intro paragraph (SequelWeb 500, 54/54 px) → "Shed Spirit" with a play button → an electric
  blue block with RETAIL / HOSPITALITY / WORKPLACE / EXHIBITION as giant words on hairlines, a photo
  beside them → "Selected clients" as two columns of brand names → news cards → "SEE WORK →" with a
  thumbnail → a one-row footer.
- **Labels:** every section has the same 10.8 px uppercase pill tag (INTRODUCTION, SHED SPIRIT, CORE SERVICES
  AND SECTORS…) in the same position.
- **Grid (computed):** 9 columns of 148 px, 10.8 px gaps.
- **Motion:** Lenis; images fade in over 0.8 s (cubic-bezier(0.14, 1, 0.34, 1)); 11 text elements start
  hidden. No change with reduced motion.
- **Accessibility:** one H1; 29 of 30 images without `alt`; outline removed on Menu and carousel buttons; no
  `tel:` or `mailto:` on the home page.

## Interpretation

- The best idea for us is the **index of room types / sectors as large words on hairlines**: a visitor
  learns what the studio does before reading a sentence.
- The tiny identical section tags make a long page scannable at almost no visual cost.
- Everything else (heavy capitals, electric blue) is the opposite of a quiet residential studio.

## Borrow

1. Room/sector index as words on hairlines, each tied to one image.
2. One tiny section tag, always in the same place.

## Do not carry over

- Heavy display capitals and the blue block; missing alt text and focus outlines; no phone or e-mail on the
  home page; Lenis.

## Not verified

- Award date and page; the "Shed Spirit" video; the work pages.
