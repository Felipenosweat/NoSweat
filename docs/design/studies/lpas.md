# LPAS — modular editorial studio (services as colour panels)

- Live: https://lpas.com/ (architecture + interiors, Sacramento and Oakland, CA)
- Award: **conflicting snippets.** One search summary (architecture listing / portfolio listing) says
  "LPAS — Site of the Day, Oct 10, 2026"; another summary of the /sites/lpas page says "Nominee,
  Aug 30, 2026". Both may be true at different dates; not verified. Live footer: "Website by Naam".
- Method: Playwright, desktop 1440×900 + mobile 390×844, 2026-10-14; sequential screenshots, mobile
  menu opened, computed styles, reduced-motion emulation. No video.

## Observations

- **Preloader** then a full-bleed photo (office interior) with header "LPAS" left and a small dark
  "Menu ≡" pill right (fixed). Scrolling darkens the photo and brings in the h1 "We're a process driven
  architecture and interior design studio" (75px, 400, line-height 1.0) with small meta
  ("Architecture + Interiors", "A Market-Focused Approach", "Scroll to explore").
- **Focus areas as horizontal panels (desktop):** wheel scroll moves sideways through five panels —
  Housing, Interiors, Higher Education, Civic, Commercial. Each = large photo on top, a flat muted
  colour block below (taupe, rust, pale blue, sage, peach), big title, short tagline ("Design for
  everyday life"), counter "2 / 5", a round "+" button, and sub-links (Affordable / Student / Market
  Rate / Senior Housing).
- **Mobile:** the same panels become stacked colour cards with a small thumbnail, title, tagline and
  counter — vertical, no horizontal scroll.
- **Then:** "Clear Process. Creative Results. Human Centered. Always Curious." manifesto; "A selection of
  our work" with filter tabs that show counts (Housing 30, Interiors 17…); project cards = photo + name +
  city; Instagram-fed "Latest updates".
- **Footer:** dark; nav row; one block per office with street address, phone (as `tel:` link) and
  "E-mail"; "Back to top"; credit.
- **Mobile menu:** full-screen dark panel; groups "Our Focus", "Explore our Portfolio", "Company";
  items appeared with a staggered blur/fade (one still frame caught items mid-transition).
- **Type (computed):** one family, Aeonik, weights 400 and 600 loaded; h1 75px → 46px mobile; body 14px.
- **Reduced motion:** horizontal panel scroll still happened under emulation.

## Interpretation

- The best transferable idea in this set for a **services section**: each service is a panel with a
  photo, a colour field, a name, one line and its sub-services. Colour does the separating, so no icons
  or borders are needed, and it degrades cleanly to stacked cards on mobile.
- Counts on filters ("Housing 30") are honest, data-derived proof.
- The office block (city, address, phone, email) is the exact shape of our contact data.

## Borrow

1. Services as colour-field panels/cards: photo + name + one-liner + 2–4 sub-items; palette of muted
   tints derived from the theme.
2. Desktop can be a row of tall cards; mobile is a vertical stack — no horizontal scroll needed.
3. Footer "location block" per address: city heading, street, `tel:` phone, email.
4. Portfolio/gallery filter tabs with counts when the data has categories.
5. Single family, two weights, large light h1 with tight leading.

## Do not carry over

- Horizontal scroll-jacking and preloaders.
- Text over a darkened full-bleed photo as the only hero message on small screens.
- Their colours, photography, logo or Aeonik (commercial font).
