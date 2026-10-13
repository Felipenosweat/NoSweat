<!-- Nota (pt-BR): regras dos sites dos clientes (packages/templates). Cada template tem uma direção de arte própria. -->

# Customer sites (`packages/templates`)

## How they are built

- The AI fills a `SiteSpec` (contract in `packages/schema/src/site.ts` — read it for the
  current fields). `<SiteRenderer spec />` picks the template by `spec.template`.
- Theme: `primary`, `secondary`, `background`, `text` (hex) and `font`
  (`modern` | `classic` | `friendly`, pairs in `packages/templates/src/fonts.ts`).
- Colors become `--ns-*` variables (`theme.ts`); `--ns-surface`, `--ns-muted` and
  `--ns-border` are derived in `styles.css`. `--ns-on-primary` / `--ns-on-secondary` pick
  readable text automatically.
- Components use only `ns-*` utilities: `bg-ns-primary`, `text-ns-on-primary`,
  `text-ns-muted`, `border-ns-border`, `font-ns-heading`, etc.
- Sections: `hero`, `services`, `testimonials`, `faq`, `contact` (see `src/sections/`).
- Templates: `home-services` (folder), `beauty`, `restaurant`, `professional`, `portfolio`.
- The theme and copy guidance for the AI lives in `apps/web/server/ai/prompt.ts`
  (backend-owned). Propose changes there; don't edit without the backend owner.

## Art direction per template

| Template      | Feel                       | Must have                                                                                          | Avoid                                                 |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| home-services | Sturdy, trustworthy, fast  | Phone number above the fold, sticky call/estimate CTA on mobile, service area, clear services list | Dainty type, low-contrast buttons, decorative clutter |
| beauty        | Editorial, calm, sensory   | Generous whitespace, refined type (classic pair works), booking CTA                                | Loud gradients, cramped grids                         |
| restaurant    | Warm, appetizing, local    | Menu highlights first, hours/location easy to find, reservation/order CTA                          | Corporate layouts, tiny text on busy backgrounds      |
| professional  | Credible, composed, clear  | Strong typographic hierarchy, consultation CTA, FAQ prominence                                     | Startup aesthetics, playful fonts                     |
| portfolio     | Work-first, minimal chrome | Large work presentation, simple contact                                                            | Feature-grid SaaS patterns                            |

## Robustness rules (every template, every change)

Test against all fixtures in `packages/fixtures` (preview at `/examples/<slug>`) and against
stress cases:

- Very light and very dark `primary`; a `secondary` close to `primary`.
- Long business name (40+ chars), long service names, 8 services, 1 service.
- Missing optional fields (no phone, no email, no city/state, no testimonials, no FAQ).
- Each font pair (`modern`, `classic`, `friendly`).

A template passes only if all of these render without overflow, clipped text or contrast
failures at 390, 768 and 1440 px.

## Honesty in templates

Never render placeholder reviews, ratings, badges ("Licensed & Insured", "5-star") or years
in business unless they come from the spec. Empty data hides its block; it is never faked.
