# CRISP Barbershop: a barbershop that talks in one wide, heavy voice

- Live: https://www.crispmtl.com/ (barbershop with two locations in Montreal, Webflow site)
- Award: a WebSearch result for https://www.awwwards.com/sites/crisp-barbershop says "Honorable Mention dated
  Aug 11, 2026". The live HTML says "Last Published: Wed Aug 12 2026". The Awwwards page was not loaded
  (awwwards.com is unreachable from here), and the live URL was found by probing crispmtl.com, not from the award
  page. Treat the match as likely.
- Method: Playwright, 2026-10-26. Desktop 1440×900, mobile 390×844 and reduced motion. First pass with
  `window.scrollTo` showed only the hero, because the page scrolls inside `div.global-wrapper`. The second pass
  used the mouse wheel (16 steps of 720 px), read computed styles of the visible text every 4 steps, and pressed
  Tab five times. Screenshots stay in the session scratchpad, not in the repo.

## Observations

- **Top bar:** hamburger on the left, "CRISP" wordmark in the centre and "BOOK NOW" on the right.
- **Hero:** a full-bleed photo of a barber and a client, muted and veiled, with the h1 "MORE THAN A BARBER SHOP"
  centred low (92 px, Helvetica Neue LT Std Bold Extended) and a white "BOOK NOW" button.
- **Headings:** every section title uses the same extended bold caps and most end with a full stop: "7 YEARS OF
  CRISP.", "SEE OUR PRICE LIST.", "WHAT WE DO BEST.". They are 72 px on desktop and 32 px on mobile, with
  line-height equal to the size.
- **Second voice:** small serif labels in "Perfectly Nineties", 14 px: "Our Story", "Est. 2018", "Our Services".
- **Index list:** LOCATIONS / SERVICES / PORTFOLIO / COLLABS / ACADEMY at 72 px, regular weight, next to a photo
  of the shop counter.
- **Price list:** three bordered columns, one per barber level (Stylist, Junior Stylist, Junior Barber). Each has
  the same five rows (Haircut, Kid's Haircut, Full Scissor Cut, Beard, Haircut + Beard) with prices on the right,
  and a "Base price + Taxes" note. On mobile the columns stack.
- **Closing block:** black, "GIVE US" / a grid of six b/w portraits / "A SHOUT", BOOK NOW, both addresses with
  their hours, and a giant "CRISP" wordmark across the bottom.
- **Grid:** thin vertical lines are drawn over the light sections.
- **Accessibility:** one h1; all 34 images have an alt attribute; focus uses the browser default outline; there is
  **no tel: link** on the page.
- **Motion:** GSAP is loaded (no Lenis); 9 animations were running at load. Reduced motion changed nothing in the
  captured frames.

## Interpretation

- The site feels like the shop's signage because one face does every heading. The full stops make each heading
  read like a sentence painted on a wall.
- The price list works because it looks like the board behind the chairs: columns, rules, prices aligned right.
- The inner scroll container is the weak point: it costs native scrolling, anchors and keyboard paging for a
  smooth-scroll feel.

## Borrow

1. One wide, heavy caps face for every heading; the small second voice only for labels.
2. A price list drawn as a board with rules, item left and price right, readable at a glance on a phone.
3. "Book" in the top bar and again after the big blocks.
4. Addresses and hours in a dark closing block before the giant wordmark.

## Do not carry over

- The inner scroll wrapper; missing tel: link; reduced motion ignored; default focus ring.
- Their typeface, wordmark, photos and portrait grid.

## Not verified

- The Awwwards page itself and its link to crispmtl.com.
- The menu panel (not opened) and the booking flow (external).
