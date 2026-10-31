# Alkemist Avocats: a law firm whose only button is the first appointment

- Live: https://www.alkemist-avocats.com/ (employment law for employees, Paris; French UI)
- Award: search result title "Alkemist Avocats - Awwwards Honorable Mention"
  (awwwards.com/sites/alkemist-avocats); the summary gave "Honorable Mention - Apr 29, 2021", credited to
  Antoine Peltier, whose portfolio (in the same results, not loaded) lists the mention. The award page was
  not loaded: awwwards.com is unreachable from this environment (`access-log.md`).
- Method: Playwright, 2026-10-26, for the Mercer Law demo. Home at 1440×900 and 390×844 (iPhone UA, touch)
  with screenshots at 600 ms, 4.6 s and eight scroll depths; one desktop run with `reducedMotion: "reduce"`;
  5× Tab; computed styles, `document.fonts`, bytes from `requestfinished`. Second pass: the contact page
  (`/contact/`), full-page screenshots at both sizes, form fields and fixed/sticky elements listed.
  Screenshots stay in the session scratchpad, not in the repo.

## Observations

- **Home:** navy hero with a large electric-blue curve; centred h1 "Découvrez un accompagnement juridique
  plus accessible, plus adapté et plus humain", with the key words in yellow. Two white cards overlap the
  bottom of the hero ("Accompagnement des salariés", "Lutte contre les violences au travail"), each with a
  line icon, two sentences and "En savoir plus". Then a navy band "Ils parlent de nous" with four press
  items (book covers, magazine pages), "Nos ressources ¹⁰" as a carousel of illustrated guides, and a plain
  footer (address, phone as text, links).
- **One call to action:** the header has two links and a yellow pill "Premier rendez-vous →" (first
  appointment). On mobile the same words sit in a yellow bar fixed to the bottom of every screen.
- **Intake (`/contact/`):** the first screen asks only "Comment pouvons-nous vous aider ?" with four pill
  answers (first appointment / we've already spoken / another question / I'd like to work here). The
  first-appointment path then asks one thing per screen: name, situation (dismissed, negotiated exit,
  planning to leave, discrimination or harassment, working conditions, other), contract type, status,
  seniority, employer, a few words about the request, email, phone. A counter shows "01/12" and each field
  says "Ou appuyez sur Entrée". Under it: Contact Form 7 with a Turnstile token.
- **Type (computed):** one family, Fivo Sans Modern. h1 60/66 px (36 px on mobile), h2 34/45.9 px, card
  titles 18/25 px −0.5 px, body 18/27 px.
- **Motion:** none measured on the home page (no GSAP, no Lenis, 0 running animations after load); the
  reduced-motion run looked the same. The contact page has `site-loader` and `confettis` elements.
- **Accessibility and weight:** visible focus ring (outline auto) on "En savoir plus"; all 22 images have
  `alt`; one h1. No `tel:` link on the home page. About 1.0 MB (mobile) to 1.65 MB (reduced run).

## Interpretation

- The site is built around the moment a person decides to contact a lawyer. Everything else (services,
  press, guides) is there to make that first step feel safe, and the step has one name everywhere.
- Splitting the intake into single questions lowers the stakes of each answer. It also makes the request
  feel private, which matters more for family law than for most trades.
- The visual voice (navy, electric blue, yellow) is energetic and activist; it fits a firm that fights
  for employees. A family and estate office needs the same clarity with a calmer surface.

## Borrow (for Mercer Law and law-office sites)

1. One name for the action ("Book a consultation"), repeated in the rail, the hero and a bottom bar on mobile.
2. A request in a few short steps that starts with "What would you like to talk about?", with a step
   counter and plain choices; ask for no case details before the meeting.
3. Headline in plain words about who the office serves and where.

## Do not carry over

- Twelve questions (employer, seniority) before a first meeting; a phone number that is not a link.
- The saturated palette and confetti; their wordmark, illustrations and typeface.

## Not verified

- The award page and score; the designer's portfolio page.
- What happens after "Terminer et envoyer" (not submitted), and the service pages.
