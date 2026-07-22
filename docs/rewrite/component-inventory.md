# Component and visual inventory

This inventory distinguishes current executable screens from future structural mockups. “Component” means an HTML-string helper or repeated source pattern; the frontend has no component framework.

## Current product screens

| Screen / source | Layout and navigation | Main patterns | Responsive behavior | Weak or inconsistent areas |
| --- | --- | --- | --- | --- |
| Search landing, `client/js/pages/public.js:128-150` | Sparse full-screen logo/search, login top-right | Pill search, two compact actions | Centered fluid logo/form; actions wrap | Search is presentational; visual language differs from the full marketing landing, and `landingView`, not `searchLandingView`, is currently mapped to `/` |
| Marketing landing, `client/js/pages/public.js:152-327` | Public nav, photographic hero, alternating full-width sections, footer | 1180 px content rail, feature cards, media cards, pricing cards, red/white CTAs | Single-column mobile; nav drawer; 2-5 columns at larger breakpoints | Repeats card/button markup; heavy raster assets; route copy still teacher-marketplace-first |
| Login/signup, `client/js/pages/public.js:328-380` | Public nav + centered form card | `ui.input`, pricing/tier cards, primary submit | Single-column; tier cards grid wider | Auth state/errors lack consistent live-region treatment; registration couples language and account tier |
| Public teacher search, `client/js/pages/learning.js:384-460` | Public nav + filter/results content | Filter controls, teacher cards | Filters/cards stack then split | Large duplicated version of authenticated search |
| Authenticated shell, `client/index.html:53-123`, `client/js/app.js:420-535` | Dark 286 px sidebar + topbar desktop; topbar/drawer mobile | Grouped links, mini profile, message/notification controls | Switch at `lg`; safe-area-aware drawer | Browser and Express route maps duplicated; no learner-focused bottom navigation |
| Home/dashboard, `client/js/pages/dashboard.js:13-42`, `client/js/pages/learning.js:865-893` | Shell + heading + learning tabs/content | `ui.card`, lesson/calendar tables/panels | Calendars and tables adapt/stack | “Dashboard” is effectively My Learning/teacher bookings, not course progression; unused metric helper indicates drift |
| Community connections/feed, `client/js/pages/community.js:315-353` | Full-bleed gradient community shell; community header/actions | Feed rows, learner avatars, post cards, load-more marker | Mobile-first feed, bounded reading column | Custom gradient/card family diverges slightly from app cream/panel shell; repeated empty/profile patterns |
| Learner/post detail, `client/js/pages/community.js:329-379` | Back/context header, profile stats or one detailed post | Profile panels, language panels, comments, icon actions | Stacked mobile, wider profile composition | Clickable behaviors rely heavily on delegated data attributes; focus after navigation is not managed |
| Voice/video room list, `client/js/pages/voice-video-rooms.js:299-352` | Shell header, filters, room cards; room itself suppresses topbar | Image cards, status/countdown, filters, create/rules modal | Cards stack/grid; live room becomes immersive | Polling and media state are coupled to global app coordinator |
| Live room/classroom, `client/js/pages/voice-video-rooms.js:209-270`, `client/js/app.js:388-418` | Full-screen black stage, overlay controls | Participant tiles, translucent dark controls, timers | Grid/overlay controls reflow; safe bottom | Deliberately separate dark visual mode; should not set learner lesson-screen defaults |
| Find teacher/profile/book, `client/js/pages/learning.js:319-713` | Filter/results, two-column details, booking date/time selection | Teacher cards, media card, badges, calendar slots, primary action | Stacks mobile; sticky/action rail on wide layouts | One 1,301-line module; repeated local helpers; dense form state |
| My lessons/teachers/notes, `client/js/pages/learning.js:714-911` | Tabs, tables/calendar/cards | Status badges, responsive table, secondary actions | Tables become cards below 768 px | Good factual/list patterns, but not an exercise interaction model |
| Teacher workspace pages, `client/js/pages/learning.js:912-1301` | Dashboard panels, profiles, availability/calendar, student details, resources/templates | Stats, data tables/cards, forms, status chips | Grid/table adaptations | Administrative information density; must not shape learner Learn/Progress as a generic dashboard |
| Profile/account/subscriptions, `client/js/pages/profile.js:57-297` | Stacked cards/forms and subpage links | Avatar upload, info rows, language cards/modals, billing panels, danger zone | Forms become full-width; modal bottom sheets | `profileView` aliases `profileInfoView`; state/status tone is ad hoc |
| Modal/chat/notification overlays, `client/index.html:125-131`, `client/js/app.js:498-526`, `client/js/app.js:1606-1877` | Global portal-like nodes inside shell | Focus-trapped modal, chat drawer, badges | Bottom-sheet modal mobile; drawer changes mobile screen | No reusable alert/toast/live-region primitive; modal body naming is implicit |
| 404, `client/404.html` | Standalone centered page | Brand logo/action | Simple fluid layout | Own embedded styles, outside product tokens/shell |
| Dev admin, `admin/views/*`, `admin/public/admin.css` | Fixed teal-black sidebar + CRUD content | Admin cards, tables, forms, flash states | Collapses at 860 px | Development-only and gitignored; visually and architecturally separate from product |

## Current reusable primitives

### Reuse directly

- Brand logos and warm palette: `client/assets/img/linguastories*.png`, `client/index.html:20-42`.
- Product shell mechanics: mobile drawer, topbar, focus/escape/backdrop handling (`client/index.html`, `client/js/app.js:527-535`, `client/js/app.js:1606-1680`).
- Core class recipes: `ui.card`, `cardHover`, buttons, tags, input, label, grids (`client/js/ui.js:1-21`).
- Escaped templating and sprite icons: `escapeHtml`, `icon` (`client/js/ui.js:23-54`).
- Responsive table-to-card CSS when factual tabular data is truly appropriate (`client/styles.css:293-363`).
- Safe-area, touch-target, focus-visible, reduced-motion rules (`client/styles.css:5-99`, `381-390`).
- Pending button and image-loading mechanics after extracting them from `client/js/app.js:537-618`.
- Modal mechanics after adding accessible naming and a structured API.

### Extend before reuse

- Card: add semantic variants for selectable, selected, locked, completed, and downloadable.
- Button: add pressed, loading, success-feedback, and fixed lesson-footer layouts without changing its Lingua styling.
- Status/tag: create accessible success/warning/error/info variants instead of relying on `tagGold`/`tagRed` names.
- Progress: no canonical primitive exists; build bar/ring/step semantics from brand red/orange, mist, and line.
- Audio: LiveKit media controls are session-oriented; make a small curriculum-audio controller with play/replay/rate/transcript states.
- Navigation: retain public/account/community entry points, but add a learner-first route set and compact mobile primary navigation.
- State UI: consolidate loading, empty, error, offline, downloading, downloaded, and retry states.

### Do not use as learner-product templates

- Dev-admin tables/sidebar.
- Teacher workspace calendar/dashboard density.
- Full-screen black LiveKit classroom treatment for ordinary lessons.
- Historical Duolingo-like terms in `FEATURE_LIST.md` if not backed by current product voice.

## Future-screen reuse matrix

| Future need | Best current source | Reuse decision |
| --- | --- | --- |
| Language selection | Language cards/modals in `client/js/pages/profile.js:57-140`, `247-295`; auth selects | Reuse language helpers, card/input/button styling; create a dedicated first-run page |
| Learn | App shell + `ui.cardHover`; lesson/calendar tabs only as structural reference | Replace dashboard body with a learning-path composition, not a data dashboard |
| Category cards | Public feature cards `client/js/pages/public.js:66-74`; teacher/room interactive cards | Extend card-hover with progress/lock metadata |
| Subgroup cards | Secondary white/60 panels and language panels | Use a quieter nested card with progress count |
| Lesson | Modal focus mechanics, primary/secondary buttons, safe-area rules | New immersive page and exercise runner; no modal containment |
| Exercise controls | Buttons, inputs, pending state, LiveKit/audio permission handling | Add answer semantics, keyboard flow, audio controller, state machine |
| Correct feedback | Teal feature accent + panel card | New success feedback component with icon/text and live region |
| Incorrect feedback | Danger button/red-tint warning panel | New recoverable error feedback, not destructive copy |
| Dialogue | Community conversation rows + classroom speaker/participant identity | New turn-by-turn transcript/audio component |
| Story | Public content rail/media cards; historical story docs/assets | New reading surface with typography and audio controls |
| Review | Responsive cards, input/button controls | New queue and one-exercise runner; avoid admin table |
| Progress | Existing stats/card recipe; profile language metrics | New narrative progress page using a few cards/charts, not generic KPI tiles |
| Settings | Profile/account cards and language modals | Keep and reorganize under Settings |
| Confirmation | Global modal + delete confirmation structure | Reuse mechanics and tone-specific body |
| Download/offline | Spinner/pending/image-loading patterns | New unified download status and offline banner/card |

## Low-fidelity structural mockups

These are hierarchy diagrams, not visual designs. Mobile is the baseline. Desktop widens content and exposes secondary context; it does not become an admin dashboard.

### 1. Language selection

```text
Mobile
┌ LinguaStories mark ─────────────────┐
│ Choose what you want to learn       │
│ Short supporting sentence           │
│ [ Search languages...             ] │
│ ┌ Traditional Chinese ────────────┐ │
│ │ 中文 · available offline         │ │
│ │ brief description        [→]    │ │
│ └─────────────────────────────────┘ │
│ Other languages / coming later      │
└─────────────────────────────────────┘
```

Hierarchy: mark → page title/support → search (only if multiple languages) → one-column language cards → account/settings link. Selecting Traditional Chinese enters Learn; first-time selection can show download size before confirmation. Desktop centers a max-width two-column region, with explanatory artwork/context beside the card list. Keep density low and the existing warm panel/cream surfaces.

### 2. Learn

```text
Mobile
┌ topbar: 中文 ▾            progress ┐
│ Continue learning                  │
│ ┌ Current lesson ────────────────┐ │
│ │ title · 3 min · progress  [→]  │ │
│ └────────────────────────────────┘ │
│ Category heading                   │
│ ┌ category card: Basics ─────────┐ │
│ │ progress / next subgroup       │ │
│ └────────────────────────────────┘ │
│ ┌ category card: Daily life 🔒 ──┐ │
│ └────────────────────────────────┘ │
├ Learn | Review | Progress | Settings┤
```

Hierarchy: compact language context → a single continuation CTA → sequential category list → mobile primary navigation. Categories are vertically sequential with clear completed/current/locked states; do not use a winding path. Desktop retains the sequence in a 640-760 px central rail and adds a narrow right rail for download/review status, never a grid of KPIs.

### 3. Category detail

```text
Mobile
┌ ← Learn             Basics  35% ┐
│ Category description             │
│ ┌ subgroup: Introductions ─────┐ │
│ │ 2/4 lessons · Continue [→]   │ │
│ └──────────────────────────────┘ │
│ ┌ subgroup: Numbers ───────────┐ │
│ │ locked · finish above        │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Hierarchy: back/title/progress → compact description → ordered subgroup cards → lessons revealed within/after selection. Mobile uses one column. Desktop uses a stable content rail with optional category summary to the left and subgroups to the right; reading order stays linear.

### 4. Lesson

```text
Mobile
┌ × Lesson title        4 / 10 ┐
│ [ progress bar ]               │
│                                │
│ Instruction                    │
│ Prompt / audio / image         │
│                                │
│ Answer controls                │
│ (one exercise only)            │
│                                │
├ feedback area when submitted ──┤
│ [ Check / Continue ]           │
└ safe-area footer ───────────────┘
```

One exercise occupies the content region at a time. Header is minimal; closing requires confirmation if progress would be lost. The bottom action/feedback region remains reachable and safe-area-aware. Desktop caps the exercise at a readable width; optional instruction/audio context can sit beside it only when it does not change keyboard/screen-reader order.

### 5. Dialogue

```text
Mobile
┌ ← Lesson        Dialogue  2/6 ┐
│ Scene/title + replay all       │
│ A  dialogue line  [play]       │
│             dialogue line  B  │
│ A  current line highlighted   │
│ Translation / hint (optional)  │
│ [ response choices or record ] │
├ feedback + Continue ────────────┤
```

Speaker identity uses avatar/initial patterns from community, but the surface remains a lesson. Mobile shows one short turn cluster and one response. Desktop may place scene context on the left and dialogue on the right. Audio controls require labels, replay, loading/error state, and no autoplay dependency.

### 6. Story

```text
Mobile
┌ ← Lesson          Story  1/4 ┐
│ Story title / level / time    │
│ [cover or scene image]        │
│ [play] paragraph text         │
│ selected word → small gloss   │
│ next paragraph...             │
│ [ comprehension action ]      │
└───────────────────────────────┘
```

Hierarchy: lesson context → title/meta → optional media → readable Traditional Chinese content → opt-in gloss/translation → comprehension step. Body text gets the widest typographic attention. Desktop caps line length and may add a non-sticky vocabulary rail; never show dense analytics alongside reading.

### 7. Review

```text
Mobile
┌ Review                    due 8 ┐
│ ┌ Today ─────────────────────┐ │
│ │ 8 items · ~4 min           │ │
│ │ [ Start review ]           │ │
│ └────────────────────────────┘ │
│ By skill: Listening 3 ...      │
│ Download/offline status         │
├ Learn | Review | Progress | ... ┤
```

The queue summary precedes one clear action. Starting review reuses the Lesson runner with review-specific completion. Mobile avoids a table. Desktop can show due groups as two or three quiet cards while preserving one primary action.

### 8. Progress

```text
Mobile
┌ Progress · Traditional Chinese ┐
│ This week: short narrative      │
│ [ weekly activity bars ]        │
│ Course progress  [bar]  35%     │
│ Skills                          │
│ Listening ... Reading ...       │
│ Recent milestones               │
├ Learn | Review | Progress | ... ┤
```

Progress tells a learning story: summary → course completion → skills → milestones. Existing stat cards may be used sparingly. Desktop can place the weekly visual beside course progress, with milestones below. Avoid generic dashboard KPI grids, leaderboards, currency, hearts, or leagues.

### 9. Settings

```text
Mobile
┌ Settings                         ┐
│ Learning                         │
│ Language · level · daily goal →  │
│ Audio and Traditional Chinese →  │
│ Downloads                        │
│ Offline package · 42 MB       →  │
│ Account                          │
│ Profile · subscription        →  │
│ [ Log out ]                      │
└──────────────────────────────────┘
```

Settings reorganizes existing profile/subscription/language controls into grouped rows. Destructive actions stay in an explicit danger zone and confirmation modal. Desktop uses a narrow left subsection list and a right detail panel, based on account layouts—not an admin sidebar.

## Information-density guardrails

- One primary task per screen; one primary CTA per viewport region.
- Lesson/dialogue/story views do not show global message/notification controls.
- Locked states explain the prerequisite; downloads disclose size and connection state.
- Traditional Chinese text gets comfortable line height and room for pronunciation/gloss additions without reducing target-script prominence.
- Desktop adaptation increases breathing room and contextual support, not the number of simultaneous actions.
- Every exercise state uses text/icon/semantics in addition to color and animation.
