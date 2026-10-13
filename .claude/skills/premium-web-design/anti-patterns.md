<!-- Nota (pt-BR): lista de "cara de IA" e problemas visuais, com gravidade. O Revisor de QA usa esta lista. -->

# Anti-patterns checklist

Severity decides what blocks a merge:

- **Blocking** — must be fixed before merge.
- **Major** — fix in this pass unless the user explicitly accepts it.
- **Minor** — fix when touching the area; report, don't loop on it.

## Blocking

| ID  | Pattern                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------ |
| B1  | Invented social proof: fake stats, reviews, ratings, client logos, "trusted by", awards, review counts |
| B2  | Text or meaningful UI below WCAG AA contrast (4.5:1 body, 3:1 large text and UI parts)                 |
| B3  | Horizontal scroll, clipped content or overlapping elements at 390 px                                   |
| B4  | Behavior changed: a link, form, button, route or API call no longer works as before                    |
| B5  | Fixed Tailwind colors or hex values inside `packages/templates` (must be `ns-*`)                       |
| B6  | New brand colors or fonts in the SaaS outside the approved tokens                                      |
| B7  | Interactive element without an accessible name or without a visible focus state                        |
| B8  | Console errors or failed requests on the reviewed pages                                                |

## Major — generic AI aesthetics

| ID  | Pattern                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Gradient text used as the main emphasis device                                                                                                                               |
| M2  | Blurred color blobs / glow orbs as background filler                                                                                                                         |
| M3  | Pulsing or glowing "status" dots and badges without a real status                                                                                                            |
| M4  | The same "eyebrow label + centered heading + 3 equal cards" block repeated                                                                                                   |
| M5  | Every section centered; no alignment grid or asymmetry                                                                                                                       |
| M6  | Icon tiles with gradient backgrounds on every feature                                                                                                                        |
| M7  | Emoji used as icons, or mixed icon styles and stroke widths                                                                                                                  |
| M8  | Generic copy: elevate, unlock, seamless, supercharge, empower, revolutionize, game-changer, cutting-edge, "in today's digital world", "take your business to the next level" |
| M9  | Purple/blue gradient everything; more than one decorative gradient per page                                                                                                  |
| M10 | Glassmorphism or heavy drop shadows on every card                                                                                                                            |
| M11 | Headlines that could fit any business (no specific noun, place or outcome)                                                                                                   |
| M12 | Weak hierarchy: two or more elements competing as the focal point of a viewport                                                                                              |
| M13 | Primary action not obvious within the first viewport on mobile                                                                                                               |
| M14 | Touch targets under 44 px on mobile                                                                                                                                          |

## Minor — craft

| ID  | Pattern                                                                           |
| --- | --------------------------------------------------------------------------------- |
| m1  | More than two corner radii in one view                                            |
| m2  | Spacing off the 8 px rhythm, or identical section padding everywhere              |
| m3  | Inconsistent shadow styles or border colors                                       |
| m4  | Line length over ~80ch, or orphans in headings (use `text-balance`)               |
| m5  | Missing hover or active states on interactive elements                            |
| m6  | Mixed alignment within one block (centered heading over left-aligned text)        |
| m7  | Typographic errors: straight quotes, hyphen instead of en/em dash, double spaces  |
| m8  | Animations that ignore `prefers-reduced-motion` or exceed ~300 ms for UI feedback |
