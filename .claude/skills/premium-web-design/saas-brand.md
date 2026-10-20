<!-- Nota (pt-BR): regras da marca No Sweat para o app (apps/web). A paleta Tech Blue é aprovada e fixa. -->

# NoSweat brand (SaaS: `apps/web`)

## Identity (approved — do not change)

| Token      | Hex       | Tailwind utility                       | Use                                          |
| ---------- | --------- | -------------------------------------- | -------------------------------------------- |
| brand      | `#0066FF` | `bg-brand`, `text-brand`, `ring-brand` | Primary actions, links, key emphasis         |
| brand-dark | `#0052CC` | `hover:bg-brand-dark`                  | Hover/pressed state of brand                 |
| ink        | `#071B33` | `text-ink`, `bg-ink`                   | Headings, strong text, dark sections         |
| surface    | `#F8FAFC` | `bg-surface`                           | Alternate sections, panels                   |
| accent     | `#00C2FF` | `text-accent`, `bg-accent`             | Rare highlights, details on dark backgrounds |

Neutrals: Tailwind `slate` (body text `slate-600`, secondary `slate-500`, borders
`slate-200`). Tokens live in `apps/web/app/globals.css` (`@theme`).

Fonts: Plus Jakarta Sans for display (`font-display`), Inter for body (`font-sans`), loaded
in `apps/web/app/fonts.ts`.

Logo (approved, do not redraw): `apps/web/components/Logo.tsx` — the "N" ribbon mark with a
sparkle (`apps/web/public/brand/nosweat-mark-*.png`) plus the wordmark "No" in ink and "Sweat" in
brand, bold display font; optional tagline "AI websites for businesses". Favicon:
`apps/web/public/brand/icon.png` and `apple-icon.png`, wired in the `app/layout.tsx` metadata,
plus the static `apps/web/public/manifest.webmanifest`. Source files: `docs/brand/`. The logo's
own gradient is the only gradient allowed in the SaaS UI.

## Voice

Friendly, direct, a little dry — a capable neighbor, not a hype machine. Short sentences.
Talk about the customer's business outcomes (calls, quote requests, being found), not about
AI. "No sweat" is the brand promise: show ease through clarity, not exclamation marks.

## Surfaces

| Route group        | Files                       | Notes                                                                      |
| ------------------ | --------------------------- | -------------------------------------------------------------------------- |
| Landing            | `apps/web/app/(marketing)/` | Sells to US small-business owners. Product preview uses `/examples/[slug]` |
| Auth               | `apps/web/app/(auth)/`      | Calm, minimal, trustworthy                                                 |
| Create + dashboard | `apps/web/app/(dashboard)/` | Tool UI: density, clarity, states (empty, loading, error)                  |
| Editor / preview   | `apps/web/app/sites/`       | Customer site renders inside; chrome must stay quiet                       |
| Admin              | `apps/web/app/(admin)/`     | Internal; function over polish                                             |

## Usage rules

- Brand blue is for action. If more than ~10% of a viewport is brand blue, reduce it.
- Accent cyan never carries text on white (contrast too low).
- One dark (`bg-ink`) section per page at most, used to create rhythm.
- Product screenshots and real example sites are the hero imagery; no stock photos of
  people at laptops, no abstract 3D shapes.
