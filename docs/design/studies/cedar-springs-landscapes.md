# Cedar Springs Landscapes — backyard as a resort, one action everywhere (Oakville, ON)

- Live: https://cedarsprings.net/ (design-build landscaping, pools and outdoor living, plus property care).
- Award evidence (search only): WebSearch `awwwards.com/sites landscaping honorable mention` → summary:
  "Cedar Springs Landscapes … honorable mention dated November 20, 2025, credited to Ripple_CA." The live
  site runs a WordPress child theme called `ripple-child-theme` and loads its wordmark font from
  ripple.ca, which matches the credited agency. Awwwards page not loaded (unreachable from here).
- Method (2026-10-26): Playwright Chromium, desktop 1440×900 wheel run (10 shots), mobile 390×844 (10
  shots), reduced-motion desktop run, computed styles, `document.fonts`, script list, Tab ×6. A cookie
  banner (CookieYes) stayed over the bottom of every screenshot; we did not accept it. No screenshots kept
  in the repo.

## Observations

- **Top bar (fixed, white):** serif wordmark "Cedar Springs" left; "Start Your Backyard Resort →" as the
  only action; hamburger. A dark vertical rail runs down the right edge of the viewport through the
  page, with social icons at its foot.
- **Sequence:** full-bleed pool-and-patio photo with the slogan "get away" in white → "get away every
  day / live more of what you love" + a paragraph naming the towns served (Oakville, Burlington,
  Mississauga, Hamilton…) + "Find Out More About Us →" → featured project slider ("fire, water &
  alfresco", "View Project") → "design is just the beginning" + "Our Process →" → grey band "start the
  process today / Get In Touch →" → "inspired by nature / guided by experience / defined by character" +
  a contact line → footer (phone, e-mail, address, menu columns).
- **Type (computed):** Epilogue 300, lowercase, 88/90 px, −1.76 px tracking (40/44 px mobile); one
  h2 at 64/75 px weight 400; body akzidenz-grotesk-next-pro 16/28.8 px, #212123; wordmark ITC Blair. One
  h1 ("Award-Winning Landscaping in Oakville, Burlington & Ancaster").
- **Motion/libraries:** Lenis (`html.lenis`), Elementor + page transitions, Swiper, Vegas slideshow,
  particles.js, jQuery. Slogans rise into place; images fade in, and during a quick scroll many stayed as
  grey gradient placeholders. Reduced-motion emulation: no visible difference.
- **Contact:** phone "905.333.6789" as plain text (no `tel:` link anywhere on the home page), e-mail as
  text. No form on the home page.
- **Mobile:** same order, stacked; logo images rendered as broken images with their alt text in our run.
- **Focus:** the cookie buttons and the CTA had `outline-width: 0`; two icon links had a 2 px outline.

## Interpretation

- The site sells the outcome (a backyard you live in) and keeps one action, worded as that outcome,
  in the bar on every screen. That is the lesson for a lawn-and-landscape company too: "Get a quote"
  always visible, plus the phone (which they forgot).
- Light lowercase headlines beside large finished-yard photos make it calm; each screen has one idea.
- Weaknesses are practical: no tap-to-call, a cookie banner that never leaves, lazy images that lag.

## Borrow (for Greenline)

1. A persistent, outcome-worded action in the top bar ("Get a yard quote") + the phone as a real link.
2. One statement + one paragraph + one link per screen; towns served inside the first paragraph.

## Do not carry over

- Plain-text phone, fixed cookie banner, unlabelled "Award-Winning" claim (rule 8), lazy grey boxes.
- Their Epilogue/Akzidenz pair, dark side rail and photos.
