# Bernice Bakery — playful warm hospitality, ordering built in

- Live: https://bernicebakery.com/ (cookies and cakes, 5135 Notre-Dame Ouest, Montréal; Shopify).
- Award: WebSearch result "Bernice Bakery - Awwwards Honorable Mention" (awwwards.com/sites/bernice-bakery),
  summary "(Casa Media) … Shopify template for a Montreal bakery, Feb 28, 2025". The live footer says
  "Made by Casa Media", which matches. The Awwwards page itself was not loaded (unreachable here).
- Method (2026-10-26): Playwright Chromium, desktop 1440×900 (wheel, 8 shots to the bottom), mobile
  390×844 (touch emulation, 8 shots), desktop with `reducedMotion: "reduce"` (4 shots), computed styles,
  `document.fonts`, `document.getAnimations()` count and a transform diff over 800 ms. Screenshots kept
  outside the repo.

## Observations

- **First screen:** full-bleed overhead photo of sliced cakes and crumbs; "A BAKING LOVE AFFAIR" in white
  caps bottom-left (h1, Apfel Grotezk 700, 172.8 px, line-height 0.6); a pink circle "INDULGE" badge
  overlapping the photo edge. Fixed white header: wordmark left, COOKIES / CAKES / ABOUT / WHOLESALE /
  CONTACT / FRANÇAIS, bag and search icons.
- **Sequence:** teal caps manifesto with a small cake sticker → "BESTSELLERS" outline marquee behind three
  cookies in arch frames → "THE BEST THINGS IN LIFE ARE SWEET" centred → photo row cropped in circles and
  arches → cookie / cake tabs and product cards (qty stepper, pink "ADD TO CART") → press cards (teal and
  black rounded panels with publication logos) → circular text "CELEBRATE WITH CAKE" + pink round
  "ORDER" → newsletter → teal footer with address, email, phone, socials and a full-width "BERNICE".
- **Type:** two families. Apfel Grotezk (400/600/800) for every heading, nav and price label; "balto"
  400 for text at 17.6/22 px (15.4 px on mobile).
- **Ordering rules in the cart drawer:** "Orders will be available for pick-up from 11am until 5:00pm on
  the day specified… We hold cakes for up to 48 hours", with pickup date and time fields.
- **Motion:** GSAP and smooth scroll present; marquee words drift, the badge rotates. Under reduced-motion
  emulation 9 animations still ran and transforms kept changing.
- **Accessibility:** 87 of 105 images lack usable alt; phone (`tel:`) only in the footer.

## Interpretation

- The site is loud but disciplined: one display family, one candy accent, one shape family (circles and
  arches). That is what keeps "playful" from becoming clutter.
- Putting pickup rules in plain sentences next to the order action is the most useful idea for a small
  bakery: it answers the real question ("when can I get it?") where the decision is made.
- The press cards are only honest because the press is real; for our customers they become owner quotes
  or nothing.

## Borrow

1. One round, edible motif repeated (badge, crop, button).
2. A chunky display face in caps for names and prices; a soft text face for sentences.
3. Ordering rules in plain sentences right at the order action.
4. Full-width wordmark footer with address, phone, email.

## Do not carry over

- Press logos / "best" quotes without owner evidence; ignoring reduced motion; missing alt text.
- Pink/teal palette, stickers, wordmark, photos.
