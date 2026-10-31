# Lass Tattoo: paper, ink and one muted red

- Live: https://www.lasstattoo.com/ (fine-line tattoo artist, Hamburg; Webflow; footer "Website made with love by
  Tanya Dyo")
- Award (one search snippet, Awwwards unreachable): a WebSearch result pointed to
  https://www.awwwards.com/sites/lass-tattoo and the summary said "Honorable Mention, May 17, 2023". A second search
  found nothing about the award. Treat as weak evidence; not approved for the generator.
- Method (2026-10-26): Playwright Chromium headless. Desktop 1440×900, mobile 390×844 and desktop with reduced
  motion (the wheel runs stayed on the entry gate); then a desktop run that clicks "Explore" and jumps through the
  page with `scrollTo` (15 shots). Computed styles, `document.fonts`, alt counts, Tab ×6, response sizes.

## Observations

- **Gate:** an off-white card over a black-and-white sea photo: "I feel your energy and transfer it to the most
  expensive canvas in the world —" with "your body" in script and an "Explore" link. The page stays on the gate until
  it is clicked, also with reduced motion.
- **Surface:** off-white #F9F8F6, text #323232, one muted red (#B64B4B) for "send request" and the script words.
  Hand-drawn floral line art in some corners.
- **Type:** DM Sans 300–700 and the script Qwitchergrypen. h1 "lass tattoo" 208.8/167 px, 700, uppercase, −0.04em.
  Section h2s are 11.5 px uppercase labels; giant grey words ("SENSITIVELY", "YOUR PRECIOUS", "LET'S VIBE TOGETHER")
  separate blocks.
- **Portfolio:** black-and-white photos of healed fine-line work placed at different sizes and heights, each with a
  short title and an arrow.
- **Practical blocks:** "Before the session — Prepare your skin" as a row of cards ("DO NOT wax your tattoo
  placement", "Eat super well before the session", "Wear correct clothes", "DO NOT drink alcohol"…); reviews as dark
  chat-message cards; contact with studio, guest spots, email and Instagram; "LASS TATTOO" again as the footer.
- **Accessibility:** default focus ring visible; 17 of 89 images with empty alt; no `tel:` link.
- **Weight:** about 13.6 MB on desktop (5 videos). Document 13,265 px desktop, 17,170 px mobile. No horizontal
  overflow at 390 px.

## Interpretation

- A light page with black ink and a single red makes tattoos look like drawings on a sheet: craft, not nightlife.
  It is the clearest proof that a tattoo site does not have to be dark.
- Scattering work at different sizes keeps a long portfolio from feeling like a thumbnail grid.
- Pre-care as numbered cards is the most useful part of the page for a client.

## Taken for Iron Lotus

- Bone paper, near-black ink and one red as the whole palette; the red is the "pen" (circles, stamp, one price
  plate), never decoration.
- Practical rules as a short numbered list in the client's words (age, moving a date, the drawing, Flash Fridays).

## Not taken

- The entry gate, the script font, the 11 px section titles, reviews as private chat screenshots.
