# Attio — product UI as the feature demo (SaaS marketing)

- Live: https://attio.com/ (CRM). **Version caveat:** the Awwwards evidence is a search title
  "Attio - Awwwards Honorable Mention" dated Apr 6, 2021. The site we inspected is the 2026 version
  ("The CRM for agentic revenue"); it is not the awarded design. It is kept as a reference for the
  No Sweat marketing site's product-demo section only.
- Method: Playwright, desktop 1440×900 + mobile 390×844, 2026-10-14; sequential screenshots, computed
  styles, mobile menu click, reduced-motion screenshot of first frame only. Cookie card ("Continue")
  was not dismissed and covers the bottom-left of most frames.

## Observations

- **Hero:** announcement bar on top; nav (Platform, Resources, Developers, Customers, Pricing) with
  "Sign in" + dark "Start for free". Centered h1 "Welcome to agentic revenue." (interDisplay 64px/600,
  −1.28px tracking), 2-line subhead, two buttons ("Talk to sales", "Start for free"), then a large
  framed app window (traffic-light dots, sidebar, breadcrumb "Workflows › Smartflow", toolbar) —
  a rendered UI, not a photo.
- **Logo wall** in a bordered grid right under the hero.
- **Chapters with a sticky side index:** a left column lists "Build pipeline / Convert leads / Run
  sales motions / Forecast revenue / Retain and expand"; the active one is dark, others grey, and it
  updates as you scroll (seen across frames). Each chapter: a two-tone sentence heading (first clause
  dark, rest grey) + a demo made of real-looking UI pieces: table with company rows, email draft with
  "Send email", workflow graph (Trigger → Record created → Web agent → If → Enroll in sequence),
  kanban deal cards with amounts and dates.
- **On mobile** the side index becomes a horizontal tab strip under the header that advances with the
  scroll (Build pipeline → Convert leads → Run sales motions → Forecast revenue). The hero CTA changes
  to an email field + "Send me a demo".
- **Later:** big serif testimonial quote (tiemposText) with name and role; changelog cards; dark footer
  with dense link columns.
- **Type (computed):** interDisplay (headings), inter (UI/body), tiemposText (quotes), JetBrains Mono
  (code bits). Sticky header 116px desktop.

## Interpretation

- The demo is credible because it shows the _actual objects_ of the product, at readable size, each
  one tied to a single sentence of benefit. No abstract 3D, no stock photos.
- The sticky chapter index tells the visitor where they are in a long page and doubles as navigation.
- Two-tone headings let one sentence carry both the headline and the explanation.

## Borrow (for No Sweat's landing, not customer sites)

1. Show our real UI as components: the one-sentence prompt box, the generated site preview, the
   "ask AI to change" chat with a before/after, the publish/domain card, the leads inbox.
2. One chapter per step of our flow (Describe → Get site → Change by asking → Publish → Get calls),
   each = one sentence + one live-looking component.
3. Sticky step index on desktop → horizontal step tabs on mobile.
4. Two-tone heading pattern for chapter titles.
5. Customer quote in a contrasting serif — only with real, permissioned quotes.

## Do not carry over

- Enterprise density (logo wall of startups, dense mega-footer) — our audience is busy owners.
- Cookie card that covers the demo on mobile.
- Their UI, illustrations, fonts or copy.
