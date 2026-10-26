# Oryzo AI (Lusion) — cinematic product scrollytelling in real-time 3D

- Live: https://oryzo.ai/ — a satirical "AI cork coaster" built by Lusion as a studio showcase. The footer
  says so literally: "THIS ENTIRE SITE IS A FICTIONAL CREATIVE PROJECT BY LUSION. ORYZO DOESN'T EXIST.
  NO PRODUCTS ARE FOR SALE." Copy also says "DESIGNED BY LUSION, THE AWARD-WINNING DESIGN STUDIO."
- Award evidence (search only): WebSearch `Oryzo AI Lusion awwwards site of the month` → summary quoting
  Lusion's Awwwards profile: "Developer Award SOTM Site Of The Month Apr, 2026"; described as "a cinematic
  product story built around a cork coaster". Query `awwwards "Site of the Month" June 2026` independently
  listed "Oryzo AI … April" on the Sites of the Month page. Award page not loaded.
- Method (2026-10-26): Playwright Chromium 1194, WebGL on SwiftShader (software), CPU shared with other
  jobs. Desktop 1440×900: 24 wheel screenshots (500 px wheel steps) covering y 0 → 22 500, then 16
  programmatic jumps across the full 56 700 px; mobile 390×844: 10 jumps across 51 300 px after a 40 s
  wait; reduced-motion: 6 jumps; Tab ×6; network log; `window.__THREE__` and script inspection.
  Because rendering was software, timings are upper bounds and frame smoothness was not judged.

## Observations

- **Loader:** olive-green #4B5B3C screen with an orange CAD-style wireframe of the coaster (dashed rings,
  handles, grid) whose ring fills as a progress arc. `#preloader` + `#preloader-canvas` were still
  present at the 48 s probe in our software-GL run; content was usable after that. Real-GPU time not measured.
- **Story (desktop, ≈56 700 px document, fixed full-screen canvas):**
  1. "ISN'T JUST A COASTER." left / short paragraph right, a photoreal 3D cork coaster centre that
     rotates and scales as you scroll (sequential frames show it tilting from top view to edge view).
  2. "Powered by AI*" huge serif-less display, a hand rises holding the coaster; an iridescent
     rainbow glow appears around the viewport edge; caption "AI FILLS IN THE GAPS. WE SAID HIGH FIVE. IT HEARD SIX."
  3. "SO PORTABLE, it's wearable" — oversized type sweeps across, then a dotted-frame card stack of
     editorial photos (jacket pocket, cap, face) slides horizontally, with a fake UI chat bubble on one.
  4. "RISE" magazine cover; a CAD wireframe scene ("PERFECTLY ROUND, SERIOUSLY / NOW 37.9% MORE CIRCULAR").
  5. A thermal-camera scene ("THERMODYNAMIC … HANDLES EXTREMES WITH EASE").
  6. "SMART FLIP ENCRYPTION" — photoreal desk scene with a "DECODE MESSAGE" button. Programmatic jumps to
     five targets in this range all stopped at y ≈ 29 756, i.e. the scene held the scroll position; later
     targets worked. Not investigated further.
  7. Sustainability (cream panel with bark illustration, "After each harvest, the bark takes about 9 years
     to regrow…"), "Drop-Test" product cards, "CHOOSE YOU OWN ORYZO" configurator with two pills.
  8. Footer: "WE CAUGHT YOUR ATTENTION WITH A NON-EXISTENT PRODUCT. IF WE CAN SELL A COASTER, IMAGINE WHAT
     WE CAN DO FOR YOUR BRAND." over falling coffee beans, newsletter, e-mails, socials.
- **Navigation / skipping:** fixed top-right INTRO · FEATURES · PRODUCT · CONTACT (anchor-style chapter links,
  active one underlined), a thin vertical progress bar on the right edge, and "SCROLL TO CONTINUE" with a
  circular icon at the bottom of each pinned scene. Mobile uses a "● MENU" pill. No skip link.
- **Type (document.fonts + computed):** `halyard-display-variable` (100–900) for display and UI (h2 51 px
  500 uppercase, body 13.5 px, nav 12 px uppercase), `Literata` (serif, 200–900) for editorial bits
  (magazine), `DM Mono` for small technical labels. Each nav/link label is rendered twice letter by letter
  (DOM text "I I N N T T R R O O"), the usual markup for a rolling-letter hover.
- **Colour:** near-black brown #100904 page (`html` background), cream text #FFEDD7, orange accent
  #DC5000, links on brown #382416; olive #4B5B3C loader; warm cork/terracotta imagery; one rainbow glow scene.
- **Text over 3D:** text sits in empty dark areas beside or above the object; big headlines are cream on
  near-black; small captions (≈9–11 px) are low-contrast grey on brown.
- **Mobile:** same chapters in the same order, 3D kept (not a simplified version), typography resized
  (hero "ORYZO" + "MADE FOR MUGS. BUILT FOR TABLES."; a "DESIGNED BY LUSION" card with a small video tile).
  Document ≈51 300 px. Viewport meta has `maximum-scale=1.0, user-scalable=no` (pinch-zoom disabled).
- **Reduced motion:** with `reducedMotion: 'reduce'` the same loader, canvas and scenes appeared;
  screenshots caught scenes mid-transition (loader ring blended over a blurred desk, wireframe rings
  over the jacket photo), so scene animations still run. No static or simplified version was found.
  One jump in this run also held (target 33 475 → y 22 319, the thermal scene).
- **Accessibility:** no `<h1>`; one `<h2>` on the whole page; 38 of 39 `<img>` have no `alt`
  attribute; focus outline is the browser default (`auto 1px`) and was visible on links/buttons.
- **Libraries (evidence):** `window.__THREE__ = "178 - modified by Lusion"`; Astro build (`/_astro/hoisted…js`);
  Rive runtime (`unpkg.com/@rive-app/canvas@2.37.0/rive.wasm`); Gaussian-splat assets
  (`/splats/props.sog` 3.0 MB, `/splats/table_reflection.sog`); custom `.buf` geometry; no `window.gsap`,
  no Lenis class (custom scroll handling).
- **Weight (desktop, as far as we scrolled):** ≈211 requests, ≈16.6 MB; images 128 req / 7.6 MB (webp
  textures, e.g. DESK.webp 731 kB), XHR 53 req / 7.1 MB (models + splats), fonts 342 kB, JS ≈0.8 MB.

## Interpretation

- It works as a film: one object, one camera, many short "shots" each with one line of copy. The joke copy
  is paced so a reader gets a beat every viewport.
- Persistent chapter nav + progress bar + "scroll to continue" turn a 56 000 px page into something you can
  orient in; that is the part worth copying for a hotel (rooms, dining, spa, events as chapters).
- Real-time 3D, splats and a long loader are the expensive part and not needed to get the pacing.

## Borrow (for a luxury hotel)

1. Chapter structure: full-screen scene → one headline → one short line → next scene; chapter links
   always visible; thin progress indicator.
2. One hero subject per scene, text placed in the negative space next to it (not on top of detail).
3. Editorial set-pieces (a magazine-cover moment, a card stack of lifestyle shots) between product scenes.
4. Strong closing statement + contact block on a dark full-bleed scene.

## Do not carry over

- A loader that blocks content for long (here ≥48 s in software GL); real-time 3D for a hotel.
- No h1, no alt text, `user-scalable=no`, tiny low-contrast captions.
- Scroll that "holds" in an interactive scene.
- Their brand, Halyard/Literata choice as-is, satirical tone.

## Could not verify

- Real-GPU loader time and frame rate; sound (none found); hover effects beyond markup evidence;
  whether chapter links scroll smoothly or jump.
