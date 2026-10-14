# Access log — Awwwards reference research

Date of all attempts: 2026-10-14 (UTC). Environment: Claude Code cloud container; outbound HTTPS via the
agent proxy (`$HTTPS_PROXY`, CA `/root/.ccr/ca-bundle.crt`). Browser: Playwright (`playwright-core`) with
Chromium at `/opt/pw-browsers/chromium`, proxied. Screenshots live only in the session scratchpad
(`/tmp/claude-0/-home-user-NoSweat/850e89f8-9b7e-5ece-bfa2-c641fdd840b4/scratchpad/research/`), never in the repo.

## 1. Awwwards itself (blocked)

| Time (UTC)  | Tool                                              | URL                                                 | Result (literal)                                                                                                                         |
| ----------- | ------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 01:47:03    | curl                                              | https://www.awwwards.com/websites/                  | `curl: (35) Recv failure: Connection reset by peer`, http_code `000`                                                                     |
| 01:47:03    | curl                                              | https://www.awwwards.com/collections/               | `curl: (35) Recv failure: Connection reset by peer`, `000`                                                                               |
| 01:47:03    | curl                                              | https://www.awwwards.com/                           | `curl: (35) Recv failure: Connection reset by peer`, `000`                                                                               |
| 01:47:10–22 | proxy status (`$HTTPS_PROXY/__agentproxy/status`) | host `www.awwwards.com:443`                         | `recentRelayFailures`: `ws_closed_mid_exchange` — "tunnel closed (code 1006, Connection ended) after 6s; 517 B sent, 39 B received" (×3) |
| 01:47:49    | Playwright                                        | https://www.awwwards.com/websites/                  | `page.goto: net::ERR_CONNECTION_RESET`                                                                                                   |
| 01:48:02    | Playwright                                        | https://www.awwwards.com/collections/               | `page.goto: net::ERR_CONNECTION_RESET`                                                                                                   |
| ~01:47      | WebFetch                                          | https://www.awwwards.com/websites/restaurant-hotel/ | `getaddrinfo ENOTFOUND www.awwwards.com`                                                                                                 |
| ~02:10      | WebFetch                                          | https://www.awwwards.com/sites/lpas                 | `getaddrinfo ENOTFOUND www.awwwards.com`                                                                                                 |
| 02:11:00    | curl                                              | https://www.awwwards.com/sites/lpas                 | `curl: (35) Recv failure: Connection reset by peer`, `000`                                                                               |
| 02:11:00    | curl                                              | https://www.awwwards.com/sites/tandjung-sari        | `curl: (35) Recv failure: Connection reset by peer`, `000`                                                                               |
| 02:11:00    | curl                                              | https://awwwards.com/                               | `curl: (35) Recv failure: Connection reset by peer`, `000`                                                                               |
| 02:11:33    | Playwright                                        | https://www.awwwards.com/sites/lpas                 | `page.goto: net::ERR_CONNECTION_RESET`                                                                                                   |

Note: earlier in the project the same host returned **403 on CONNECT**; today the failure mode is a
**connection reset** (curl exit 35 / `ERR_CONNECTION_RESET`), and WebFetch fails at DNS (`ENOTFOUND`).
No Awwwards page was loaded directly at any point. Everything we know about award status comes from
WebSearch result titles/snippets (see §2) and from credits printed on the live sites.

## 2. WebSearch queries (worked; results are titles/snippets only)

Each line: query → what it established. A search snippet only proves the award page exists with that
text; it says nothing about layout, motion or mobile behavior.

1. `awwwards site of the day restaurant website` → only Awwwards "inspiration" pages; nothing usable.
2. `awwwards.com/sites restaurant Site of the Day` (domain awwwards.com) → titles "Quay Restaurant - Awwwards SOTD"; summary: Crav Burgers SOTD Jun 13, 2026; Meatopia HM Aug 18, 2026.
3. `awwwards sites hotel honorable mention website` → Hotel listing summary: Tandjung Sari (Fleava) HM Aug 5, 2026; Vander Hotel, Tabela, Faith Ibiza, Lingers (HM 2026).
4. `awwwards sites architecture studio site of the day` → "LPAS - Awwwards SOTD" title; summary: SOTD Oct 10, 2026; "Stewart & Partners - Awwwards SOTD".
5. `awwwards sites salon beauty spa honorable mention` → Ever Beauty (HM Jul 26, 2025), Shen Beauty (HM Apr 27, 2022), etc.
6. `awwwards sites construction builder renovation company website SOTD` → Jova Construction SOTD (~2014); summary mentions Haven Constructions HM Jun 10, 2026.
7. `awwwards sites SaaS product landing page site of the day 2026` → Heron AI SOTD Oct 12, 2026 (name only).
8. `awwwards sites law firm accounting firm website site of the day` → title "Kümmerlein Lawyers & Notaries - Awwwards Honorable Mention"; summary: HM Jun 18, 2025.
9. `awwwards Crav Burgers site of the day` → listing text "Crav Burgers Anyflow … SOTD Site Of The Day Jun 13, 2026"; HM May 20, 2026.
10. `awwwards Haven Constructions honorable mention` → listing text: HM Jun 10, 2026, credited to Dobre Agency (no /sites/ page found).
11. `awwwards LPAS architecture interior design studio California site of the day` → **conflicting**: this summary reports the LPAS page as "Nominee, Aug 30, 2026", while query 4 / a portfolio listing said "SOTD Oct 10, 2026".
12. `awwwards Kümmerlein Lawyers Notaries honorable mention` (no domain filter) → nothing; evidence stays at query 8.
13. `awwwards.com/sites software product website SOTD app features UI` → Anime.js SOTD (7.62), Hyperframe, Fitonist, Dime MTL.
14. `awwwards sites Raycast OR Linear OR Mercury OR Attio site of the day` → "Attio - Awwwards Honorable Mention", Apr 6, 2021.
15. `awwwards sites bakery cafe coffee shop honorable mention` → Campos Coffee HM Oct 11, 2016; summary: Café Binocle HM Apr 21, 2026 (no /sites/ page in results).
16. `awwwards sites photographer portfolio photography site of the day` → listings only; no candidate pursued.
17. `awwwards Tandjung Sari Fleava honorable mention` → nothing direct.
18. `awwwards tandjung sari hotel sanur website` (domain awwwards.com) → listing text: Tandjung Sari by Fleava, HM Aug 05, 2026.
19. `awwwards.com/sites/haven-constructions` → no dedicated page; repeats listing text (HM Jun 10, 2026, Dobre Agency).
20. `Crav Burgers Anyflow website`, `Crav Burgers concept website Anyflow framer crav` → Awwwards title "Crav Burgers" (concept, 7.25/10); a separate Framer template "Crav" exists; live URL of the awarded site not established.
21. `"Café Binocle" awwwards`, `"Ever Beauty" salon website The Carrot Cake awwwards` → nothing.
22. `awwwards.com/sites restaurant honorable mention 2026` → Burrito Madre (HM Jul 9, 2026), Da Maria, Palazzo Sogni, KUBE, Palmo, foodnia.
23. `awwwards.com/sites hair salon barber honorable mention` → Rendezvous Barbers (HM Jul 31, 2024), CRISP Barbershop (HM Aug 11, 2026), others.
24. `Burrito Madre restaurant website General Condition Studio`, `Rendezvous Barbers Toronto barbershop official website` → no official site URL found.

## 3. Live sites loaded (Playwright, proxied)

| Time (UTC)         | URL                                              | Result                                                                                                                | Used                                |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 01:48:42, 01:49:54 | https://www.quay.com.au/                         | HTTP **403**, empty title (twice)                                                                                     | unavailable                         |
| 01:48:44           | https://www.kuemmerlein.de/                      | 200 "Kümmerlein – Make it simple, but significant"                                                                    | in-depth                            |
| 01:48:44           | https://cravburgers.com/                         | `ERR_TUNNEL_CONNECTION_FAILED` (domain was a guess)                                                                   | no                                  |
| 01:48:47           | https://www.tandjungsarihotel.com/               | 200 "Tandjung Sari Hotel"; footer "Website by Fleava."                                                                | in-depth                            |
| 01:48:48           | https://www.shenbeauty.com/                      | `ERR_CONNECTION_CLOSED`                                                                                               | no                                  |
| 01:48:50           | https://lpas.com/                                | 200 "LPAS - Architecture and Interiors"; footer "Website by Naam"                                                     | in-depth                            |
| 01:48:53           | https://www.havenconstructions.com.au/           | 200; footer credit "Web design Melbourne jtb" (Awwwards listing credits Dobre Agency — mismatch, see references.json) | in-depth                            |
| 01:48:54           | https://heron.ai/                                | 200 but "heron.ai for sale                                                                                            | Spaceship.com" — wrong domain guess | no     |
| 01:49:23           | https://attio.com/                               | 200 "Attio: The CRM for agentic revenue" (2026 site, not the 2021 awarded version)                                    | in-depth                            |
| 01:49:26           | https://camposcoffee.com/                        | 200 → www.camposcoffee.com                                                                                            | light                               |
| 01:49:27           | https://www.stewartpartners.com/                 | navigation error ("Execution context was destroyed") — not retried                                                    | no                                  |
| 01:49:50           | https://jovaconstruction.com/                    | `ERR_CONNECTION_RESET`                                                                                                | no                                  |
| 01:49:52           | https://animejs.com/                             | 200 "Anime.js                                                                                                         | JavaScript Animation Engine"        | medium |
| 01:49:55           | https://wildwoodbakery.com/                      | navigation error — not retried                                                                                        | no                                  |
| 01:49:57           | https://cafebinocle.com/                         | 200 → www.cafebinocle.com "Binocle - Café Climatopositif"                                                             | light                               |
| 01:49:58           | https://www.tandjungsari.com/                    | `ERR_TUNNEL_CONNECTION_FAILED` (wrong guess)                                                                          | no                                  |
| 02:01:35           | https://burritomadre.com/                        | 200 "Burrito Madre – Coming Soon" (cannot confirm it is the awarded site)                                             | no                                  |
| 02:01:35           | rendezvousbarbers.com / .ca, crispbarbershop.com | `ERR_TUNNEL_CONNECTION_FAILED` (guesses)                                                                              | no                                  |
| 02:01:37           | https://www.meatopia.co/                         | `ERR_SSL_PROTOCOL_ERROR`                                                                                              | no                                  |
| 02:01:38           | https://www.da-maria.it/                         | 403, redirected to justeat.it Cloudflare page                                                                         | no                                  |
| 02:01:39           | https://palmo.com/                               | 200 "Palmo Exclusive" (unrelated to the awarded Palmo)                                                                | no                                  |

## 4. Inspection protocol for the sites marked in-depth / medium / light

Script `inspect.js` (scratchpad): for each site, desktop 1440×900 and mobile 390×844 (isMobile, touch,
DPR 2, iOS Safari UA). Load → wait for network idle (≤15 s) + 4 s → click a visible cookie "accept" control
if one matched → screenshot → 6–7 wheel scrolls of 0.9 viewport with 1.5 s pauses, screenshot each →
continue scrolling to the end (screenshots every 6 steps + final) → read computed styles
(`getComputedStyle(...).fontFamily`, sizes, line-height, letter-spacing), `document.fonts` (status
`loaded`), fixed/sticky elements, `tel:`/`mailto:` links, headings, button/link labels, forms, credits text →
on mobile, try to open the menu and screenshot. A second pass (`rm.js`) emulated
`prefers-reduced-motion: reduce` (confirmed `matchMedia` = true) and scrolled 2–3 viewports to compare.
Hover states were **not** systematically tested. No video was recorded; motion claims come from
comparing sequential screenshots.

Inspection timestamps (facts.json `at`): Haven 01:52, Kümmerlein 01:55, LPAS 01:56, Tandjung Sari 01:59
(rerun after fixing the cookie click), Attio / Anime.js / Campos / Binocle ~02:03–02:08.
