# Kümmerlein — editorial professional services

- Live: https://www.kuemmerlein.de/ (law firm and notaries, Essen, Germany; German UI)
- Award: search result title "Kümmerlein Lawyers & Notaries - Awwwards Honorable Mention"
  (awwwards.com/sites/kummerlein-lawyers-notaries), snippet date Jun 18, 2025. Page not opened. No
  agency credit found on the live site, so the version match is assumed, not proven.
- Method: Playwright, desktop 1440×900 + mobile 390×844, 2026-10-14; cookie "Akzeptieren" clicked;
  sequential screenshots, computed styles, reduced-motion emulation. Mobile menu not captured.

## Observations

- **Hero:** a photo card with large rounded corners (inset ~24px from the viewport) showing a client
  meeting, shallow depth of field. Over it: small uppercase mono kicker "UNSER VERSPRECHEN AN SIE",
  headline "Make it simple, but significant" (h1 74px, serif, lime-yellow), one-line subhead.
  A lime circle sits in a notch cut out of the card's bottom-right corner.
- **Navigation:** floating light-grey pill bar (fixed) with 7 items + "EN" + wordmark; logo outside it.
  On scroll the floating bar overlapped headline text in one screenshot (legibility issue).
- **Pinned "why us" sequence:** "Warum mit uns arbeiten?" stays left while big lime circles on a sage
  card change label per scroll step ("Schnelle Manöver", "Präzise Zielerreichung", "Ideenvielfalt").
- **Service entry points:** two lime pill buttons "Rechtsgebiete" / "Tätigkeitsfelder" (practice
  areas / industries) over a dark photo; a single conversion pill "Unverbindlich kennenlernen"
  ("get to know us, no obligation").
- **Team:** partner chips — round photo + name + "PARTNER" — in pill shapes.
- **Insights:** article carousel cards with date, tag pill, title, round arrow button.
- **Footer:** full lime block, 3 link columns + wordmark; on mobile the columns become accordions with
  round arrow toggles.
- **Type (computed):** display "Rhymes Display Light" (serif, h1/h2, 400); text "ABC Monument Grotesk
  Regular" 18/21px; labels "ABC Monument Grotesk Semi-Mono" 12px uppercase. Mobile h1 30px, body 14px.
- **Mobile:** hero splits into a photo card and a separate lime text card below it (text not on photo).
- No `tel:` link and no form on the homepage; one mailto.
- **Reduced motion:** pinned circle sequence still advanced identically under emulation.

## Interpretation

- Feels human and approachable for a category that is usually navy and marble: real people in candid
  light, one cheerful accent, generous radius. The promise headline is plain language.
- The system is small and repeatable: rounded cards, pills, one accent, serif display + grotesk text.
  That is exactly the kind of system our templates can reproduce from data.
- Mobile hero choice (photo card, then text card) is better than overlaying text on a photo.

## Borrow

1. Professional services: candid photo of people at work + plain-language promise as h1.
2. One saturated accent used for CTA pills, highlights and the footer block; everything else neutral.
3. Mobile hero = image card then text card (never white text over a busy photo on a phone).
4. Team as compact chips (photo, name, role) — only with owner-supplied people.
5. A single soft CTA wording ("Book a free consultation") repeated, not five different CTAs.
6. Footer link groups collapse into accordions on mobile.

## Do not carry over

- Floating nav that overlaps content; missing phone/address on the homepage.
- Scroll-pinned "reasons" that hide text until you scroll.
- Their K• logo, lime/sage palette as-is, licensed fonts (Rhymes, Monument are commercial).
