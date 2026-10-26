# Regras de texto dos sites (sem "cara de IA")

Fonte: Wikipedia, "Signs of AI writing" (WP:AIWTW, lida em 2026-10-25) e o checklist
`.claude/skills/premium-web-design/anti-patterns.md` (M8, M11). Valem para os sites-modelo
(`packages/fixtures`), para o que a IA gera (`apps/web/server/ai/prompt.ts`) e para a landing.

O texto é em inglês americano, então as regras abaixo estão em inglês.

## Write like the owner, not like a copywriter

- The owner talks. Plain sentences with "is", "are", "has", "we", "I". Names, streets, prices,
  hours, years, brands of equipment. A specific fact beats any adjective.
- Headlines say what the place is and where, in the owner's words. Grand and simple, like the
  award sites ("Antarctica", "Unmatched abundance", "Family and estate law in German Village"),
  never a clever slogan or a pun.
- Vary sentence length on purpose. Some long sentences with commas, some short. Never a run of
  8–20 word sentences that all sound the same.
- One idea per paragraph. No conclusions that sum up ("In short...", "That's why...").

## Banned patterns (Wikipedia: Signs of AI writing)

| Sign                                         | Examples to remove                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Negative parallelism                         | "X, not Y", "It's not X, it's Y", "not just X but Y", "Y rather than X", "no X, no Y, just Z"                                                                                                                                                                                                |
| Rule of three                                | "fast, friendly and fair", three short phrases in a row, three-item taglines                                                                                                                                                                                                                 |
| Punchy fragment pairs                        | "Gone when it's gone.", "Priced before we start.", "Two days of dough. Out by seven." as slogans                                                                                                                                                                                             |
| Undue significance                           | "a testament to", "serves as", "stands as", "plays a key role", "marks a shift", "deeply rooted", "legacy"                                                                                                                                                                                   |
| Promotional puffery                          | "nestled", "in the heart of", "boasts", "vibrant", "rich", "renowned", "showcasing", "featuring", "diverse array", "commitment to", "breathtaking"                                                                                                                                           |
| AI vocabulary                                | additionally, align with, bolster, crucial, delve, emphasize, enduring, enhance, foster, garner, highlight, interplay, intricate, landscape, meticulous, pivotal, robust, showcase, tapestry, testament, underscore, valuable, vibrant, seamless, elevate, unlock, curated, crafted, journey |
| 2026 AI vocabulary                           | quietly, steady, practical, matters, clearer, dependable, echoed, leverage, multifaceted, prioritize, universally, thoughtful, intentional                                                                                                                                                   |
| Copula avoidance                             | "serves as", "functions as", "offers", "features" where "is" or "has" works                                                                                                                                                                                                                  |
| Vague attribution                            | "customers say", "many people", "experts agree" without a name                                                                                                                                                                                                                               |
| Title Case headings                          | "Our Services And Pricing" → "Services and prices"                                                                                                                                                                                                                                           |
| Cute section titles                          | "Good questions, straight answers", "Who you'll deal with", "Fresh off the table" → "Questions", "About us", "Reviews"                                                                                                                                                                       |
| Em dashes in prose                           | Use commas, periods or parentheses. En dash only in ranges (9 AM – 5 PM, Mon–Fri)                                                                                                                                                                                                            |
| Emoji, checkmark bullets, bold run-in labels | none                                                                                                                                                                                                                                                                                         |

## Headline checklist

1. Could another business use it unchanged? Rewrite with the name, trade or place.
2. Is it a pun, a contrast ("X, not Y") or a fragment pair? Rewrite as a plain statement.
3. Under 8 words is best. A noun phrase is fine ("Sourdough and custom cakes in Midtown").
