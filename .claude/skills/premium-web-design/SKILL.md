---
name: premium-web-design
description: Design, build and review NoSweat interfaces and customer website templates so they look crafted by senior human designers, not generic AI output. Use for any visual or UX work on apps/web (the NoSweat SaaS) or packages/templates (customer sites) — redesigns, new pages, polish passes, design reviews. Invoke as /premium-web-design <target>, e.g. "landing", "create", "dashboard", "template home-services".
---

<!-- Nota (pt-BR): manual de design do time. Instruções em inglês porque são para a IA e as
     interfaces são em inglês. Fluxo: Diretor → Designer → (aprovação) → Engenheiro → QA. -->

# Premium web design for NoSweat

## North star

Every screen must look like a senior designer at a good US studio made it for this specific
product or business: distinctive, restrained, confident, specific. If a screenshot could
belong to any AI-generated startup, it fails.

## Non-negotiables

1. **Preserve behavior.** Routes, APIs, data flow, auth, forms and props stay as they are.
   Visual and UX changes only, unless the user approves more.
2. **Contract.** `packages/schema` changes are optional additions only, and need both devs'
   agreement. Never rename or remove fields.
3. **Brand.** The SaaS uses the approved Tech Blue tokens only (see `saas-brand.md`). Never
   introduce new brand colors or fonts.
4. **Customer sites** use only `ns-*` utilities (see `customer-sites.md`). Never fixed
   Tailwind colors inside `packages/templates`.
5. **Honesty.** No invented stats, logos, ratings, reviews, "trusted by" rows or awards
   (FTC 16 CFR 465). Example content must be labeled as fictional.
6. **Scope and ownership.** No new dependencies without approval. Respect
   `.github/CODEOWNERS`: `apps/web/server/**` (including `ai/prompt.ts`) is backend-owned —
   propose, don't edit.
7. **Done means:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` pass, and the
   Visual QA Reviewer reports no blocking or major findings at 390, 768 and 1440 px.

## Design principles

1. **Hierarchy first.** One focal point per viewport. Size, weight and space create
   hierarchy; color is the last tool, not the first.
2. **Typography.** A modular scale (ratio ≈1.25), at most 3 weights per page, headings
   tracked tight (−0.01 to −0.03em), body 16–18 px at ~1.6 line height, 60–75ch measure.
   Use real typographic details: tabular numbers for prices, proper quotes and dashes.
3. **Spacing.** An 8 px rhythm. Section spacing varies with content weight; don't stamp the
   same `py-24` on every section.
4. **Color restraint (60/30/10).** Neutrals carry the page, the primary color marks action
   and emphasis, the accent appears rarely. At most one purposeful gradient per page, never
   on body text and never as decoration filler.
5. **Layout with intent.** Use a real grid, alignment lines and asymmetry. Vary section
   rhythm (split, full-bleed, offset, list, table). Avoid repeating "centered heading +
   three equal cards" down the page.
6. **Real content beats decoration.** Show the actual product, actual work, actual details.
   Specific copy ("Same-day water heater repair in Austin") beats generic promises.
7. **Craft details.** Optical alignment, two radii at most, 1 px borders before heavy
   shadows, consistent icon stroke and size, informative hover and visible focus states.
8. **Mobile is the main device.** Design 390 px first. Touch targets ≥44 px, no horizontal
   scroll, thumb-reachable primary actions; trades get a sticky call button.
9. **Accessibility.** WCAG 2.2 AA contrast, semantic landmarks and headings, labeled
   controls, visible focus, `prefers-reduced-motion` respected.
10. **Copy voice.** American English, plain and specific. See the banned list in
    `anti-patterns.md`.
11. **Performance.** No layout shift, images sized, no heavy client JS for decoration.

## Workflow

The main session orchestrates; subagents cannot call each other. Pass each agent the
outputs of the previous step verbatim.

1. **Baseline.** Start the app (`pnpm dev` or `pnpm build && pnpm --filter @nosweat/web start`)
   and capture screenshots:
   `node .claude/skills/premium-web-design/scripts/screenshot.mjs --base http://localhost:3000 / /create`
2. **Design Director** (`design-director` agent) → **Design Brief**. Run once per surface
   family (SaaS or a template) and reuse it.
3. **UX/UI Designer** (`ux-ui-designer` agent) → **Screen Spec** per screen. Independent
   screens may run in parallel.
4. **Stop and present the Brief and Specs to the user.** Continue only after approval.
5. **Frontend Engineer** (`frontend-engineer` agent) → implementation on the working
   branch, all checks green.
6. **Visual QA Reviewer** (`visual-qa-reviewer` agent) → **QA Report** with screenshots.
7. If the report has blocking or major findings, send them back to step 5. At most two
   loops; then report what remains to the user.
8. Show the user before/after screenshots and open a PR (template in
   `.github/pull_request_template.md`).

## Reference files

- `anti-patterns.md` — the generic-AI checklist with severities (QA uses it verbatim).
- `saas-brand.md` — NoSweat brand rules for `apps/web`.
- `customer-sites.md` — art direction per template and rules for `packages/templates`.
- `scripts/screenshot.mjs` — multi-viewport screenshots plus overflow and console checks.
