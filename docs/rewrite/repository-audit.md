# LinguaStories repository audit

Audit date: 2026-07-21. Scope: Phase 1 inspection and preparation only. Executable source is treated as authoritative; no future learning UI is implemented here.

## Executive summary

LinguaStories is a Node 20+/Express 4 application with a PostgreSQL database and a browser-native, plain-JavaScript single-page application. The browser receives one static `client/index.html` shell; page modules return HTML strings into `#view`, while `client/js/app.js` owns URL parsing, global mutable state, API calls, event delegation, modal/drawer behavior, and LiveKit lifecycle. There is no compilation or bundling step: browser ES modules, Tailwind's CDN runtime, one checked-in GSAP module, and static assets are served directly by Express.

The current executable product is principally a teacher marketplace, live-classroom, profile/subscription, and community app. The story, sentence-mining, shadowing, goal, wallet, and progress features described in `FEATURE_LIST.md` and much of `QA_TESTING_GUIDE.md` do not have routes or view modules in the current source. Those documents are useful historical/product evidence but must not be used as proof of current behavior.

The rewrite can remain within the existing stack. The main technical risks are the 3,294-line frontend coordinator, 1,301-line teacher view file, 2,269-line teacher service, runtime dependence on `cdn.tailwindcss.com`, scattered markup-level styling, no IndexedDB/service worker/offline layer, and very narrow automated-test coverage.

## Repository map

| Area | Current role | Evidence |
| --- | --- | --- |
| Entry/server | Starts Express after environment validation and optional seed | `server.js:1-27` |
| Express composition | Security, webhooks, JSON parsing, static files, auth attachment, API, dev admin, SPA fallback, errors | `src/app.js:1-83` |
| API routes | Auth, account, config, health, learning/community, LiveKit, public teachers, teacher/student | `src/routes/index.js:1-22` |
| Controllers | HTTP translation only; delegate to services | `src/controllers/*.controller.js` |
| Services | SQL and business logic; teacher/student is the largest domain | `src/services/*.service.js` |
| Database | Direct `pg` pool and idempotent SQL schema/seed files; no ORM or migration runner | `src/db/pool.js:1-23`, `db/schema.sql`, `scripts/run-sql.js` |
| Frontend shell | One HTML entry point, inline Tailwind config, shell/topbars/modal template | `client/index.html:1-135` |
| Frontend coordinator | Route table, state, APIs, delegated actions, rendering, media/chat/modal lifecycle | `client/js/app.js:1-3294` |
| Page views | HTML-string factories grouped by public, dashboard, community, learning/teacher, profile, rooms | `client/js/pages/*.js` |
| UI helpers | Shared class recipes, escaping, icons, dates, buttons, stats | `client/js/ui.js:1-103` |
| Assets | Brand/marketing raster images, Lucide SVG sprite, vendored GSAP | `client/assets`, `client/vendor/gsap` |
| Admin | Development-only server-rendered generic table CRUD, gitignored | `src/app.js:55-58`, `admin/index.js`, `admin/config/tables.js` |
| Tests | Node built-in test runner; five subscription-policy cases only | `package.json:12`, `test/account-subscription-policy.test.js:1-92` |

## Runtime and request flow

1. `server.js:7-14` validates database/session/password settings and production origins. `seedIfNeeded` runs before listen (`server.js:16-24`).
2. `src/app.js:29-52` applies security headers/CORS, preserves raw Stripe webhook bodies, accepts JSON up to 12 MB, rejects prototype pollution/content-type mismatches, serves LiveKit and the whole `client` directory, then attaches the session user.
3. `/api` receives rate limiting and the mounted router (`src/app.js:54-57`). Development mounts `/admin`; production never does (`src/app.js:59-62`).
4. Public URLs and allow-listed `/app/...` paths receive `client/index.html` (`src/app.js:64-74`). Unknown frontend paths reach `client/404.html` through `frontendNotFound`.
5. `client/js/app.js:3265-3294` fetches `/api/config` and `/api/auth/me`, redirects unauthenticated app visits to `/login`, fetches `/api/state`, and renders either a public view or authenticated shell.
6. App navigation uses History API links and `popstate`; `activeRoute` parses the pathname (`client/js/app.js:198-219`), while `appPath` is the inverse mapper (`client/js/app.js:266-275`). Express maintains a second, manually synchronized allow-list in `src/app.js:16-45`.

## Frontend audit

### Entry points and structure

- `client/index.html` is the only product HTML document. It loads Tailwind from a third-party CDN, declares the `brand` color extension inline (`client/index.html:16-45`), loads `client/design-tokens.css` and `client/styles.css`, and imports `client/js/app.js` as a browser module.
- `client/404.html` is a standalone static error page with its own embedded visual treatment.
- `admin/views/layout.js:24-45` is a separate development-admin HTML entry generated on the server.
- There is no Vite/Webpack/Rollup config, transpilation, minification, asset hashing, or CSS compilation. `npm start` and `npm run dev` execute Node directly (`package.json:7-17`).

### Routing and navigation

The product SPA has four visible navigation groups defined at `client/js/app.js:30-59`: Home/Find a Teacher, Community, teacher tools, and a conditional teacher-onboarding link. Detail/settings routes are hidden from the sidebar (`client/js/app.js:67-89`). The shell is desktop-sidebar-first at `lg` and becomes a topbar plus slide-in drawer below 1024 px (`client/index.html:53-123`, `client/js/app.js:420-535`).

Current public routes are `/`, `/login`, `/signup`, and `/find-teacher` (`src/app.js:64-65`, `client/js/app.js:3078-3093`). Authenticated routes cover dashboard; community list/learner/post; voice/video list/room; teacher search/profile/booking/classroom; learner lessons/teachers/notes; teacher profile/workspace/calendar/availability/students/notes/resources/templates; and profile/subscriptions (`src/app.js:16-45`, `client/js/app.js:92-116`).

The route definition is duplicated between Express regexes and browser maps. A future addition can render client-side yet fail on direct refresh if `frontendAppRoutes` is not also changed.

### Views and reusable UI

- Public marketing/auth/teacher search: `client/js/pages/public.js`.
- Dashboard delegates nearly everything to `myLearningView`; the small `metric` helper is currently unused (`client/js/pages/dashboard.js:1-42`).
- Community feed, learner profile, post detail, and post modal: `client/js/pages/community.js`.
- Teacher discovery, profiles, booking, schedules, classroom-adjacent pages, workspace: `client/js/pages/learning.js`.
- Voice/video room cards, room UI, create/rules modals: `client/js/pages/voice-video-rooms.js`.
- Account, subscriptions, language-profile modals, destructive confirmation: `client/js/pages/profile.js`.
- Shared primitives are class-string recipes, not DOM components: `ui.card`, `cardHover`, `stat`, three buttons, tags, input, label, and grids (`client/js/ui.js:1-21`). `button`, `stat`, `icon`, `escapeHtml`, and `formatDate` provide limited shared rendering (`client/js/ui.js:23-103`).

Views are pure-ish string factories, but many local helpers repeat card headers, profile images, empty states, options, status tones, and date formatting. Event behavior is centralized through `data-action` and `data-form` handling in `client/js/app.js:2286-3041`.

### State management and API clients

State is module-scoped mutable data in `client/js/app.js:121-173`: server state/config, filters, cached teacher data, booking selection, tab/calendar selection, room/session state, LiveKit tracks, chat state, and UI flags. `context()` copies these values into each view (`client/js/app.js:321-354`). Rendering replaces `#view.innerHTML`, then binds image/action behavior and starts route-specific fetches/polling (`client/js/app.js:3111-3217`). There is no store, reducer, observable layer, URL-query state model, or normalized entity cache.

API wrappers are split by domain (`api`, `livekitApi`, `teacherStudentApi`, `accountApi`) at `client/js/app.js:620-737`. They consistently send JSON but duplicate response/error logic. `loadTeacherStudentData` dispatches route-specific requests and merges results into one object (`client/js/app.js:821-857`). Messages poll `/api/state` every four seconds (`client/js/app.js:173`, `1904-1948`); room list/detail uses separate polling (`client/js/app.js:1034-1063`).

The only browser persistence is localStorage for seen notification keys and classroom self-view position (`client/js/app.js:465-482`, `1138`, `1601`). There is no IndexedDB, Cache Storage, service worker, web manifest, or offline detection.

### Responsive behavior

Tailwind default breakpoints are used: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. Most layouts begin as single-column/flex-column and add columns at `sm`/`md`/`lg`; the authenticated shell changes at `lg`. `client/styles.css:272-379` converts table rows to cards below 768 px and turns centered dialogs into bottom sheets. Safe-area variables and 44 px minimum targets are declared at `client/styles.css:5-9`, `45-54`, `272-289`. Forms force full-width actions under 768 px, except landing actions.

Responsive strengths: mobile-first view grids, safe areas, touch targets, responsive tables, bottom-sheet modals. Risks: the shell breakpoint differs from the table breakpoint; many arbitrary grid templates need device testing; large HTML strings make layout regressions hard to isolate; only 320 px `body` minimum is asserted (`client/styles.css:16-22`).

### Accessibility

Present patterns include semantic `nav/main/section/form/label`, `aria-label` on icon-only controls, decorative `aria-hidden` icons, an `.sr-only` utility, focus-visible outline, 44 px target enforcement, `aria-modal`, focus restoration/trap logic in `showModal`, Escape-to-close, `aria-disabled`, reduced-motion handling, and alt text on meaningful marketing images (`client/styles.css:45-99`, `381-390`; `client/index.html:54-127`; `client/js/app.js:1606-1680`).

Gaps: rendered status/error messages do not consistently use live regions; most SPA navigation does not move focus to the new page heading; clickable table rows rely on JS and are not inherently links; modal accessible names are inferred from body headings rather than wired with `aria-labelledby`; some controls use literal `x`; color contrast has no automated validation; the app has no automated accessibility tests.

## Backend audit

### API surface

- Auth and profiles: `src/routes/auth.routes.js:39-46`.
- Account tiers, state, trials/jobs: `src/routes/account.routes.js:27-34`; raw Stripe webhooks are registered earlier in `src/app.js:34-36`.
- Public configuration and teachers: `src/routes/config.routes.js:7`, `src/routes/public.routes.js:7`.
- Community/languages/messages/assets: `src/routes/learning.routes.js:36-71`. Despite the filename, this router contains no lesson-exercise/curriculum endpoints.
- Teacher marketplace/classroom domain: `src/routes/teacher-student.routes.js:51-160`.
- LiveKit rooms: `src/routes/livekit.routes.js:29-49`.
- Health: `src/routes/health.routes.js:7`.

Routes use async wrappers, authentication, rate limits, UUID validation, schema-based body validation, and centralized error middleware. The `learning.routes.js:11-31` known-route gate is unusual: it allows the router to yield to later routers for unknown patterns because it is mounted at `/api` without a prefix.

### Authentication and security

Authentication is custom, database-backed session auth. Passwords use PBKDF2-SHA256 with configured iterations; token hashes use SHA-256 (`src/services/auth.service.js:12-30`, `50-52`). The `lingua_session` cookie is HttpOnly, SameSite=Lax, Path=/, and Secure in production (`src/services/auth.service.js:54-63`). `attachUser` reads the cookie and resolves the session; `requireAuth` returns 401 (`src/middleware/auth.middleware.js:1-21`).

Security middleware supplies CSP, CORS allow-lists, HSTS in production, clickjacking/MIME/referrer/permissions headers, JSON content-type enforcement, prototype-pollution rejection, validation, and rate limits (`src/middleware/security.middleware.js`, `validation.middleware.js`, `rate-limit.middleware.js`). The CSP currently requires `'unsafe-inline'` and permits the Tailwind CDN because configuration/style generation is inline (`src/middleware/security.middleware.js:50-75`).

### Database and storage

PostgreSQL access uses one `pg.Pool`; SQL is written directly in services (`src/db/pool.js:1-23`). `db/schema.sql` is a long idempotent schema script, not an ordered migration history. Core tables include users/sessions/languages, community posts/comments/follows/messages, teacher profiles/availability/bookings/classrooms/notes/resources/reviews/payouts, LiveKit rooms/sessions/participants, and account/subscription/billing records (`db/schema.sql:30-1377`). No current tables model curriculum versions, categories, lessons, exercise attempts, story/dialogue progress, download manifests, or sync queues.

Cloudflare R2 is accessed through hand-built AWS Signature V4 requests for avatars, community images, room images, and generic image/audio/video assets (`src/services/storage.service.js:1-326`). `publicUrlForKey` falls back to an authenticated `/api/assets/...` proxy (`src/services/storage.service.js:174-177`). This is reusable for curriculum media, but downloadable JSON should be separately cacheable and immutable.

### Admin

The admin is server-rendered generic CRUD over tables declared in `admin/config/tables.js`. It can upload assets and includes legacy story/sentence tables even when user-facing story routes are absent. It is excluded by `.gitignore:4`, mounted only outside production (`src/app.js:59-62`), and has a separate teal/neutral token set in `admin/public/admin.css:1-12`. Because it is untracked and development-only, it must not become the sole curriculum-authoring or migration mechanism without an explicit repository/deployment decision.

## Build, tests, deployment, and environment

- Node requirement: `>=20.6` (`package.json:31-33`). Dependencies are Express, `pg`, and LiveKit client/server SDKs (`package.json:35-40`).
- Development and production choose env files through Node's `--env-file`; there is no dotenv dependency (`package.json:9-17`).
- Tests use `node --test`. Baseline on 2026-07-21: 5 passed, 0 failed. Coverage is limited to subscription-policy behavior.
- Database scripts apply whole SQL files. Destructive scripts are present and explicitly named (`package.json:18-29`).
- No Dockerfile, Procfile, CI workflow, hosting manifest, or infrastructure-as-code is present. Production behavior suggests a Render-style environment through `RENDER_EXTERNAL_URL`, but this is an inference from `src/services/*`, not a checked-in deployment definition.
- `.env.development` and `.env.production` exist locally but are gitignored. Referenced configuration keys include database, session/password, frontend origin, Cloudflare R2, LiveKit, Stripe, app URLs, seeding, and job-secret settings. Never place their values in documentation or client code.

## Asset organization

`client/assets/img` contains three logo variants and large marketing/community images (roughly 132 KB-2 MB each). `client/assets/icons/lucide-sprite.svg` is a 516 KB full Lucide symbol sprite. User uploads live in R2 under `linguastories-assets/...` paths (`src/services/storage.service.js:17`, `74-120`). Generated conversation audio and curriculum/story working files exist outside the shipped client (`generated`, `docs/stories`, `sent`) and several are gitignored; they are not a production curriculum delivery system.

## Highest-priority findings

1. Preserve the plain-JS/Express deployment model, but split the frontend coordinator before adding lesson complexity.
2. Establish one route registry so browser navigation and Express fallbacks cannot drift.
3. Treat `FEATURE_LIST.md`/`QA_TESTING_GUIDE.md` story-learning material as stale specifications until reconciled with source and database.
4. Version curriculum and progress schemas before building screens; neither exists today.
5. Introduce IndexedDB behind an adapter and store only user progress/download metadata there; keep curriculum packages immutable and versioned.
6. Self-host or compile the CSS utility layer before offline support; the Tailwind CDN is currently a hard online dependency.
7. Add unit/integration/E2E/accessibility coverage. Five policy tests do not protect the current or future UI.
8. Keep teacher/community/account features during migration. Do not delete legacy tables, services, or historical docs until production data and routes are inventoried and a rollback window has passed.
