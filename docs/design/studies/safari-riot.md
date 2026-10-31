# Safari Riot: the width axis as the interface

- Live: https://safaririot.com/ (artist development company; site by Van Holtz Co)
- Award: a WebSearch result for https://www.awwwards.com/sites/safari-riot says "Site of the Day - Jul 3, 2020";
  Awwwards also lists an element "Variable font animation - Safari Riot" credited to Van Holtz Co. Neither page was
  loaded (awwwards.com unreachable). The live site shows "ARTISTS // Class of 2023", so it was updated after the
  award; the interaction matches the awarded element's name, but the exact awarded version is unconfirmed.
- Method: Playwright, 2026-10-26. Desktop 1440×900, mobile 390×844 and reduced motion. Wheel scroll (16 steps),
  three pointer positions over the words with the inline styles read after each, and five Tab presses.
  Screenshots stay in the session scratchpad.

## Observations

- **One screen:** the document is exactly the viewport height and nothing scrolls. Two words fill it, "ARTISTS"
  over "DEPTS", black on light grey.
- **Bottom bar:** a thin bordered bar with a round logo, "SAFARI RIOT", "⌄ ABOUT", "⌄ GENERAL INQUIRIES" and
  "⌄ CAREERS" in a mono face (CartographMonoCF, 16.8 px). Those open panels; the only h1 is "ABOUT" inside one.
- **Letters:** each letter is a span on "Compagnie-III", a variable font with a width axis. At rest every letter
  has `font-variation-settings: "wdth" 200`, a `scaleY(0.98)` and a `translateX` that positions it in the row.
- **Pointer:** the row under the pointer turns full black and grows, the other row turns dark grey. Each letter's
  width follows its distance from the pointer: one sample read 68, 130, 214, 321, 372, 256, 162 across the row
  (range seen 48–398). The translateX values change with it, so the row re-flows and never overlaps. The bar
  label changes to "ARTISTS // Class of 2023" or "DEPTS // Secret Sauce".
- **Mobile:** the two words stack as tall, very condensed letters that fill the screen under a top bar with a menu
  button.
- **Reduced motion:** the resting state was the same; the hover was not re-tested in that mode. Focus uses the
  browser default outline.

## Interpretation

- The width axis does the work a hover colour usually does, and it does it letter by letter. That is the clearest
  "type is the image" interaction we have seen, with no photo or canvas.
- It is calm because it only moves when the pointer moves; nothing loops.
- For a business, the same screen would be a dead end: two words and a hidden h1.

## Borrow

1. Pointer proximity mapped onto a variable axis, per letter, with the row re-flowing.
2. Fitting a word to the line with the width axis instead of a smaller font size (the mobile layout).
3. Effects that rest when the visitor rests.

## Do not carry over

- A home screen with nothing but two words; navigation that depends on hover; the h1 inside a closed panel.
- Their font, mono UI face and link blue.

## Not verified

- The awarded 2020 version; the About / inquiries / careers panels; hover under reduced motion.
