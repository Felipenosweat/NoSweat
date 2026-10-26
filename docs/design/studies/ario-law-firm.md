# Ario Law Firm: a law firm with a loud typographic voice

- Live: https://ario.law/en/ (corporate law, Kyiv and Lviv; English and Ukrainian)
- Award: search result title "Ario Law Firm - Awwwards Honorable Mention" (awwwards.com/sites/ario-law-firm);
  the summary gave "Honorable Mention, dated May 25, 2026", credited Ira Gritsay, Igor Veremsky and Anna
  Tashkinova, and an Awwwards winners listing in the same results repeated the date. The firm's own About
  page says the new site "has already received international recognition". Award page not loaded.
- Method: Playwright, 2026-10-26, for the Mercer Law demo. Same protocol as `alkemist-avocats.md`.
  Cookie bar left untouched. Screenshots stay in the scratchpad.

## Observations

- **Opening screen:** black page; wordmark "ARIO / 10 YEARS" and a small nav (About Us, Practices, Team,
  Press Center, Contacts, En / Укр). A giant "ARIO" sits at bottom-left; at right a bold manifesto: "We
  enjoy the law, adore the drive, crisis situations motivate and changes inspire us. Our team is more than
  freaking awesome lawyers".
- **Then:** "About us / Rock the Future with the Rule of Law"; white number cards "10+" and "25+" drawn
  with crosshair rules like a drafting sheet; **practice areas as 3D cubes** that turn as you scroll (a white
  face "01 LITIGATION" with a small table "Head of Practice | Anna Sydorovych / Team | 10+ lawyers", the
  other faces photos); a "MORE+" card with a blue gradient; one statement per screen on white ("love the
  law", "and never stop", "take action") with tilted press photos; partners in black and white;
  "Recognition" rows (year, ranking, "+"); Press Center cards; a blue gradient footer with a giant "ARIO LAW".
- **Type (computed):** one family, "ario-sans" (700 and 400). Section h3 32/35.2 px −1.6 px uppercase,
  "Have any questions?" 62/68.2 px −3.1 px, body 18/21.6 px −0.72 px. The h1 computes to 32 px (desktop) and
  18 px (mobile): the giant "ARIO" is not the h1.
- **Motion:** no GSAP or Lenis detected; CSS 3D cubes and word-by-word statements. In the reduced-motion run
  a cube still appeared in a turned 3D state (whether its scroll rotation stops was not checked).
- **Accessibility and weight:** a visible focus outline (auto) on the 5th Tab ("Team"); `tel:` link present;
  27 of 27 images without an `alt` attribute; about 28 MB (mobile) to 35 MB (reduced run) transferred.

## Interpretation

- The voice is the partners' own and it is unmistakable. For a corporate firm selling nerve in a crisis,
  the loud type and the cubes match the message.
- The small fact table inside each practice card is the quiet, transferable idea: a ledger line (who leads
  it, how many people) grounds an otherwise theatrical layout.
- Everything else is the wrong register for people dealing with a divorce or a death in the family.

## Borrow (for Mercer Law)

1. Drafting marks as ornament: hairline tables, double rules and fact lines instead of scales and columns.
2. Facts set as a small ledger inside the service detail (fee / good to know), never as adjectives.

## Do not carry over

- Rankings and recognition rows (our fictional office has none; rule 8).
- 3D cubes, word-by-word statements and the page weight; images without `alt`; 1.2 line-height body text.
- The "freaking awesome lawyers" register.

## Not verified

- The award page; the Ukrainian version; practice detail pages; motion under reduced motion beyond one capture.
