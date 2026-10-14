# Tandjung Sari — immersive photography, warm hospitality

- Live: https://www.tandjungsarihotel.com/ (boutique beachfront hotel + restaurant, Sanur, Bali)
- Award: Awwwards listing text via search: "Tandjung Sari — Fleava — Honorable Mention, Aug 05, 2026".
  The live footer says "Website by Fleava.", which matches the credited studio.
- Method: Playwright, desktop 1440×900 + mobile 390×844, 2026-10-14 (second run after the cookie
  "ACCEPT ALL COOKIES" span had to be clicked); sequential screenshots, computed styles, mobile menu
  opened, reduced-motion emulation. No video.

## Observations

- **Cookie modal** blocks the page until accepted (first run captured only the modal).
- **Desktop layout is horizontal.** Document height = viewport (900px); mouse-wheel moves a horizontal
  track. The home page is "Our Story": full-bleed photo with "Our Story" title → cream panel with
  "Initiated in the 1960's," (h2 176px serif) → archival sepia photos and short captions strung along a
  thin timeline with diamond markers → colour photos → long-form serif paragraphs.
- **Persistent actions:** "BOOK ROOM" and "BOOK TABLE" buttons fixed top-right on desktop; a narrow left
  rail holds the logo seal, menu and a vertical "WHATSAPP" link.
- **Mobile switches to vertical scroll** and turns the two actions into a fixed bottom bar
  ("BOOK ROOM | BOOK TABLE", 60px). Scrolling past the end of a chapter continued into the next page
  (title changed to "Bungalows ― TandjungSari", hero "Our Bungalows").
- **Mobile menu:** full-screen terracotta panel, large serif items (Our Story, Bungalows with six
  sub-items, Dining, Cultures, Gallery), then utility links (Getting Here, Terms) and "Get in Touch".
- **Type (computed):** headings "Adobe Caslon Pro" (serif, 400, slight negative tracking); body/UI
  Helvetica 15px/24px; Optima also loaded. Uppercase letter-spaced small labels ("DINING OFFERS").
- **Colour:** cream background rgb(241,236,222), warm grey-brown text rgb(84,79,69), header taupe,
  terracotta menu.
- No `tel:` link anywhere we checked; contact via WhatsApp and mailto.
- **Reduced motion:** horizontal track still scrolls the same way under emulation.

## Interpretation

- Archival photos + dates turn history into proof without any invented claim — the business's own
  story is the content. Small businesses often have this ("family-run since 1998") and rarely use it.
- The two primary goals are always one tap away, on both breakpoints, while the content is slow and
  atmospheric. That split — calm content, constant action — is the transferable idea.
- Horizontal scroll is beautiful on a trackpad but hijacks the wheel and is a novelty cost.

## Borrow

1. Persistent primary actions: desktop top-right pair; mobile fixed bottom bar with 1–2 actions
   ("Call" / "Book", "Order" / "Directions").
2. Warm palette from the photography: cream ground, brown-grey text, one earthy accent.
3. Serif display + neutral sans body for hospitality; large year/number as a typographic hero.
4. "Story" section as a short timeline of owner-supplied dates and photos.
5. Menu offers grouped by occasion (Afternoon tea, Private gathering…) with "View menu" links.

## Do not carry over

- Horizontal scroll-jacking; full-screen cookie wall; no click-to-call.
- Very low-contrast small captions over cream.
- Their seal/logo, photos, Balinese motifs.
