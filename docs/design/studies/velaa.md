# Velaa Private Island — quiet modern luxury

- Live: https://www.velaaprivateisland.com/ (family-owned private-island resort, Maldives)
- Award: Awwwards listing text via extended search: "Velaa Private Island WEBSITE Velaa Private Island STRV STRV
  HM Honorable Mention Sep 25, 2026" (Hotel / Restaurant and Luxury listings). Award page not loaded; the live
  site carries no agency credit and is built on Framer (meta generator "Framer 13ebf9e").
- Method: desktop/mobile/reduced runs, Tab test, styles, network, BOOK NOW clicked (desktop navigated to
  /booking; nothing submitted), mobile menu opened by tapping the burger, 300px scroll sequence.

## Observation

- **Hero:** full-screen video (aerial clouds over ocean), no headline. Thin top bar: ≡ MENU | VILLAS DINING
  ACTIVITIES, centred logo, translucent BOOK NOW; "SOUND ON" toggle bottom right.
- **Order:** handwritten founders' note on sand, signed ("Velaa began as our family's private home, born from a
  love for the Maldives…") → pinned midnight section: photos slide while the sentence "Velaa is a world of its
  own. A place you don't just visit. _You belong._" appears word by word → "The art of coming home, where _every
  corner feels familiar_" + "Find your home" → father and daughter on the jetty, "More than paradise…" →
  "An invisible _thread of care_, always one step ahead" (butler) + video card "Discover Story of Velaa" →
  guest quote over a sunset boat → activities → H1 "A symphony of flavours & shared moments" (4 restaurants)
  → H1 "The magic of the unexpected" (chefs) → "A secret held for you." → "Your island is waiting." → footer:
  numbered sitemap 01–11, contact, socials, Forbes/Virtuoso/Serandipians logos.
- **Type:** Canela Text LC Web Thin (weight 100) H2 60/60 −1.2px, H1 80px; mobile 40/48px; italic cut for
  single words; Instrument Sans 16/24 body/UI.
- **Colour:** sand #E8E6DF, olive-brown text #4B4335 (7.8:1), midnight #040326, white on photos; secondary text
  at 60% opacity (~3:1).
- **Booking:** /booking is a split page — sunset photo left, "Reserve your home" form right (Villa type,
  Check-in, Check-out, Adults, Children, Villas, CHECK AVAILABILITY).
- **Mobile:** header has only burger + logo. The menu is a full-screen sand panel (10 large links, email, phone,
  Contact & Location, socials) with a black full-width BOOK NOW at the bottom — the only header-level booking
  entry on mobile.
- **Smooth scroll:** html class `lenis lenis-autoToggle` and a `window.lenis` instance.
- **Reduced motion:** no change (0 rules); video still autoplays.
- **Accessibility:** no H1 in the hero (two H1s mid-page), all 27 images `alt=""`, focus outline default and
  visible, `tel: +9606565000` (leading space).
- **Weight:** desktop 85 req / ~9.7 MB images (one 8037×6026 JPG = 4.5 MB); mobile 76 / ~2.7 MB; FCP 0.8 s,
  LCP 3.3 s desktop / 1.2 s mobile; 2160p Vimeo videos not counted.

## Interpretation

- Luxury by subtraction: no claim in the hero, a thin serif, sand space, and a signed personal note. The
  owners' voice replaces superlatives — exactly compatible with our "no invented claims" rule if the note
  comes from the owner.
- One italic word per heading gives warmth and rhythm cheaply.
- Hiding Book on mobile and skipping the H1 trade conversion and SEO for mood — not acceptable for our customers.

## Borrow

1. Owner's note (owner-written) with signature right after the hero.
2. Thin display serif + italic accent word; sans body.
3. Sand + midnight two-world palette.
4. One pinned word-by-word statement (full text shown under reduced motion).
5. Split booking page (photo + few fields).

## Do not carry over

- No hero H1; empty alt everywhere; Book hidden on mobile; 4.5 MB images and 2160p video; weight-100 text at
  small sizes or 60% opacity.

## Could not verify

- Award page/date and agency; video content; hover states; booking results.
