# LinguaStories UI design system

This document extracts the design language that exists in source on 2026-07-21. It does not propose a visual redesign. The product system is distinct from the development admin system.

## Source of truth and token change

Before this audit, product colors lived in the inline Tailwind extension at `client/index.html:17-44`; shared component class recipes lived in `client/js/ui.js:1-21`; browser defaults and a few landing/responsive rules lived in `client/styles.css`; and many values were repeated in page markup. There was no complete centralized token layer.

`client/design-tokens.css` now exposes the extracted product palette, typography, spacing, radii, shadows, breakpoints, motion, and semantic state aliases. `client/index.html` loads it before `client/styles.css`. It is intentionally additive: current Tailwind configuration and class strings still render exactly as before. Future work should consume these tokens incrementally with screenshot/regression checks.

## Product color palette

All named values below come from `client/index.html:20-42` unless stated otherwise.

| Token / Tailwind name | Value | Current use |
| --- | --- | --- |
| `ink` | `#1d293f` | Primary text, primary actions, hero overlay, focus-shadow RGB source |
| `charcoal` | `#2f353e` | Secondary/body text, secondary buttons |
| `graphite` | `#6c757d` | Descriptions, labels, metadata |
| `muted` | `#8a9099` | Placeholder/de-emphasized text |
| `orange` | `#e07258` | Border/focus/hover accent; identical to `red` |
| `amber` | `#f1b7a6` | Warm gradient/navigation hover accent |
| `red` | `#e07258` | Brand highlight, active controls, badges, danger tint |
| `redDark` | `#bf5b45` | Brand hover, destructive text, icon accents |
| `brown` | `#7c5548` | Warm tag text / warning-like emphasis |
| `cream` | `#f3f0eb` | Authenticated page background |
| `pink` | `#e8a6b6` | Secondary palette; little/no direct current view use |
| `snow` | `#f8f6f2` | Public page sections, quiet button hover |
| `mist` | `#eee8df` | Alternating sections, pills, selected/hover surfaces |
| `line` | `#ded6cc` | Standard borders/rings/dividers |
| `panel` | `#fffaf4` | Cards, headers, modal/dialog surfaces |
| `sidebar` | `#211c1a` | Authenticated navigation and dark tags |
| `slate` | `#485469` | Supporting gradient color |
| `teal` | `#2c7a7b` | Supporting feature accent; closest existing success hue |
| `blue` | `#3d7fa8` | Supporting feature accent |
| white | `#ffffff` | Inputs and elevated/overlaid controls |
| black | `#000000` | Classroom/video stage only |

Context-only gradient colors in `client/js/pages/community.js:49` are `#fff7ef → #f0f7f5 → #f8ebe7`. Landing overlays use `rgba(29,41,63,.96/.82/.34)` at `client/js/pages/public.js:174`. These are current hard-coded compositions, not new core palette entries.

The dev admin has a separate palette in `admin/public/admin.css:1-12`: background `#f7f5f0`, panel `#fff`, ink `#24231f`, muted `#6f6a60`, border `#ddd7cb`, accent `#2e6f6a`, accent-dark `#1f5652`, danger `#b43a35`, success background `#e8f4ed`, error background `#f8e7e5`. Do not import this teal-led admin identity into the learner product.

## Semantic assignments

| Role | Existing treatment | Evidence |
| --- | --- | --- |
| Page background | cream in app; snow/panel/mist alternating publicly | `ui.page`, `client/js/pages/public.js:167-219` |
| Card background | panel, frequently with 80% line border | `ui.card`, `ui.cardHover` |
| Primary text | ink | `ui.js` and all page modules |
| Secondary text | charcoal | Public body and secondary controls |
| Muted text | graphite; muted for placeholders | `ui.muted`, `ui.input` |
| Primary action | ink/white; redDark on hover | `ui.primary` |
| Brand action | red/white; redDark on hover | `publicNav` at `client/js/pages/public.js:9-12` |
| Secondary action | translucent white, line border, charcoal | `ui.secondary` |
| Destructive/error | red tint, red border/text | `ui.danger`; delete dialog `client/js/pages/profile.js:231-244` |
| Success | No formal product component. Teal is the existing positive supporting hue | `featureCard` at `client/js/pages/public.js:66-73` |
| Warning | No formal alert component. Mist/brown `tagGold` signals attention/status | `ui.tagGold` |
| Loading | Inline spinner, disabled pending button, skeleton-like image cover | `client/js/app.js:537-618`; classroom at `client/js/app.js:393-400` |

Important inconsistency: orange and red are aliases of the same hex value, so border-focus and brand-danger semantics are named separately but visually identical. Retain this in Phase 1; revisit only in an explicit design phase.

## Typography

The product uses Tailwind's default `font-sans`: `ui-sans-serif, system-ui, sans-serif` (resolved in the new token file to a cross-platform system stack). No webfont is loaded. The admin explicitly uses `Inter` first but does not ship it, so it also normally falls back to system UI (`admin/public/admin.css:23`).

Observed product scale:

| Role | Size / line height / weight |
| --- | --- |
| Micro label/badge | 11-12 px, often uppercase, 700-900 |
| Supporting label/body | 14 px (`text-sm`), line-height 20 or explicit 24 px, 600-700 for labels |
| Base body | 16 px, 24-28 px line-height, 400-600 |
| Card title | 18-20 px, 700-900 |
| Page/dialog title | 24-30 px, 700 |
| Section title | 30/36 px mobile, 36/40 px from `sm`, 900 publicly |
| Hero | 36/40 px mobile, 48 px at `sm`, 60 px at `lg`, 900 |

Authenticated pages generally use `font-bold` (700), while marketing pages use `font-black` (900). Tracking is normally tight on headings; eyebrow/nav microcopy uses `tracking-[.12em-.16em]`. The default body line height is 1.5 from `client/styles.css:16-22`.

## Spacing and density

Markup uses Tailwind's default 4 px base rhythm: 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, and 64 px recur. Core patterns are:

- App viewport padding: 16 px mobile, 24 px at `sm`, 28 px at `lg` (`ui.appView`).
- Card padding: 20 px (`ui.card`); modal body: 16 px mobile / 24 px `sm` (`client/index.html:125-129`).
- Grid gaps: typically 16 or 20 px; compact rows use 8-12 px.
- Section vertical padding: 48-64 px on public pages.
- Controls: minimum 44 px in product primitives and global touch enforcement (`client/styles.css:45-54`). Landing search/actions are explicit exceptions at 38/40/48 px (`client/styles.css:134-249`).
- Content width: public pages repeat `min(1180px, calc(100% - 32px))`; forms/search cap around 584 px; dialogs use `max-w-lg`.

There is no formally enforced spacing token API in existing markup. The new `--ls-space-*` variables document the recurring scale; Tailwind utilities remain active.

## Radii and shadows

- Dominant radius: `rounded-lg` = 8 px for cards, buttons, inputs, topbar controls, and dialogs.
- Smaller: 4 px (`rounded`) and 6 px (`rounded-md`/landing login) for compact elements.
- Pills/avatars: `rounded-full` / 9999 px.
- Mobile dialog removes its lower two radii to become a bottom sheet (`client/styles.css:365-371`).
- Card shadow: `0 1px 2px rgba(29,41,63,.05)` (`ui.card`).
- Hover card shadow: `0 14px 28px rgba(29,41,63,.08)` (`ui.cardHover`).
- Primary action shadow: `0 8px 18px rgba(29,41,63,.16)` (`ui.primary`).
- Landing media shadow: `0 18px 42px rgba(29,41,63,.09)` (`client/js/pages/public.js:213`, `233`).
- Dialog uses Tailwind `shadow-2xl`; header/icon controls often use `shadow-sm`.

## Component specifications

### Buttons

`ui.primary`, `ui.secondary`, and `ui.danger` at `client/js/ui.js:7-9` are the canonical authenticated patterns. All are inline-flex, 44 px minimum height, 8 px radius, 14 px semibold text, and icon/text gap. Primary is dark and elevated; secondary is bordered/translucent; danger is red-tinted. Public navigation and hero buttons use 900 weight and a red or white treatment (`client/js/pages/public.js:9-12`, `181-184`). Disabled behavior globally changes the cursor, while form pending behavior adds disabled state and a spinner (`client/styles.css:31-38`, `client/js/app.js:541-588`). Opacity-based disabled controls also appear locally, which is inconsistent.

### Inputs

`ui.input` is the canonical recipe (`client/js/ui.js:16`): 44 px minimum, full width, 8 px radius, 90% line border, 75% white background, 12 px horizontal/8 px vertical padding, 14 px text, muted placeholder, orange focus border, white focus background, and a 2 px orange/15% ring. Global CSS forces 16 px native input text to prevent iOS zoom, but `ui.input` then applies `text-sm`; specificity/runtime ordering should be verified on iOS (`client/styles.css:60-66`). Labels use a 6 px gap, 14 px semibold graphite (`ui.label`). The landing search is its own 999 px pill pattern with a 48 px height (`client/styles.css:170-211`).

### Cards

Canonical cards use panel fill, 80% line border, 8 px radius, 20 px padding, and subtle shadow (`ui.card`). Interactive cards add orange border and deeper shadow on hover (`ui.cardHover`). Secondary panels often use white at 60-70% with a line border. Public feature cards locally duplicate the canonical pattern (`client/js/pages/public.js:66-74`). Category and subgroup cards should extend `ui.cardHover`, not introduce a dashboard tile aesthetic.

### Navigation

Authenticated desktop navigation is a fixed-width 286 px dark sidebar when `lg` layout is active (`client/js/app.js:3043-3061`; `client/index.html:53-83`). Groups use uppercase micro labels and vertically stacked links; active links receive a light translucent treatment assembled in `renderNav` (`client/js/app.js:420-457`). Mobile uses a 64 px topbar and an off-canvas version of the same sidebar with dark backdrop (`client/index.html:84-96`, `client/js/app.js:527-535`). Public navigation is horizontal desktop and a right-side `<details>` drawer on mobile (`client/js/pages/public.js:8-52`).

### Modals and confirmation dialogs

The shell template is a centered max-`lg` scrollable panel over an ink/70 backdrop (`client/index.html:125-131`). `showModal` inserts the body, adds a close button, stores/restores focus, traps Tab, and supports Escape/backdrop close (`client/js/app.js:1606-1680`). Below 768 px it docks to the bottom and reserves extra safe-area/action space (`client/styles.css:365-379`). Destructive confirmation composes the same shell with `ui.tagRed`, red-tint warning panel, divider, and `ui.danger` (`client/js/pages/profile.js:231-244`).

### Status, feedback, and loading

There is no single status/alert primitive in product UI. Statuses are expressed through `tag`, `tagGold`, `tagRed`, and local tone functions in `client/js/pages/learning.js:303-317`, `1020-1024`. Error feedback generally arrives via a modal or rendered error string from API wrappers; no toast or ARIA live-region system exists. Correct/incorrect exercise feedback does not exist yet.

Loading patterns include initial centered logo/text (`client/index.html:113-120`), small border spinners (`client/js/app.js:537-588`), full-screen classroom spinner (`client/js/app.js:393-400`), temporary upload modal (`client/js/app.js:2077-2094`), and image loading overlays (`client/js/app.js:594-618`). Use these visual ingredients for future download/offline states, but create one accessible state component rather than copying implementations.

## Breakpoints and responsive rules

| Breakpoint | Value | Existing role |
| --- | --- | --- |
| `sm` | 640 px | Two-column compact grids, larger padding/type, horizontal actions |
| `md` | 768 px | Multi-column content; custom CSS switches tables/dialogs just below this point |
| `lg` | 1024 px | Desktop app sidebar/topbar, public desktop nav, two/three-column major layouts |
| `xl` | 1280 px | Four/five-column cards, sticky detail rails |
| `2xl` | 1536 px | Seven-column scheduling grids |

These are Tailwind default values because no screens extension is configured in `client/index.html:17-44`. The standalone admin uses one custom 860 px breakpoint (`admin/public/admin.css:341-362`).

## Motion, hover, and focus

Landing controls use explicit `160ms ease` transitions in `client/styles.css:134-249`. Tailwind `transition` elsewhere defaults to 150 ms, and the post-image fade explicitly uses 200 ms (`client/js/pages/community.js:127`). GSAP is imported in `client/js/app.js:28` but has no call sites in the current application source, so it is not evidence for a product motion value. Hover commonly raises controls by 2 px, deepens a shadow, changes line to orange, or changes background to redDark/mist/white. Touch devices receive an orange 16% tap highlight (`client/styles.css:251-258`).

Global keyboard focus is a 3 px orange/62% outline with 2 px offset (`client/styles.css:92-95`). Inputs additionally use border/ring focus. Reduced-motion sets animation/transition duration to 0.01 ms and disables smooth scrolling (`client/styles.css:381-390`). Future exercise motion must respect this media query and must never be the only carrier of correctness.

## Future exercise-state mapping (reuse, do not clone)

These mappings use existing LinguaStories values and shapes; they are not final screen designs.

| Future state | Existing visual ingredients to reuse | Required extension |
| --- | --- | --- |
| Selected answer | `ui.secondary` + mist/red-tint selected surface | Add `aria-pressed`/radio semantics and selected border token |
| Correct answer | panel card + teal icon/accent | Define accessible success surface/text pair; do not rely on teal alone |
| Incorrect answer | `ui.danger`, `tagRed`, delete-warning panel | Create non-destructive error feedback variant with retry action |
| Locked lesson | muted/graphite text, line border, disabled cursor/opacity | Keep readable contrast and expose lock reason |
| Lesson progress | red/orange brand accent over mist/line track | Add semantic progress component and `aria-valuenow` |
| Downloading | existing spinner + graphite status | Add percentage/bytes, cancel/retry, and live-region update |
| Downloaded/offline ready | teal accent + panel/mist | Add persistent icon/text label |
| Offline unavailable | brown/mist warning treatment | Explain whether content is missing or sync is deferred |
| Completion | brand panel, logo/illustration, subtle shadow | Use Lingua imagery/voice; no Duolingo rewards metaphors |

## Safe consolidation policy

Phase 1 added tokens but changed no class recipe or rendered value. Later consolidation should proceed one primitive at a time: screenshot representative public/app/mobile states, replace a repeated literal with a token, rerun tests and accessibility checks, compare screenshots, then commit. Do not globally replace `#e07258` without considering that source currently uses it under both `red` and `orange` semantic names. Do not merge the admin and product token sets.
