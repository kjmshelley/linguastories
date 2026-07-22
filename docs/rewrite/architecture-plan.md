# Architecture plan for the structured learning application

## Decision

Build the learning product as a new domain inside the existing Express application and vanilla-JavaScript SPA. Keep browser ES modules and HTML-string views initially; do not introduce React, Vue, Angular, or a second server. Before feature implementation, extract routing, API access, state, persistence, and UI primitives from `client/js/app.js` so the lesson runner is not added to the current global coordinator.

The target boundaries are portable: domain models and reducers contain no DOM calls; repositories hide HTTP/IndexedDB; views receive serializable state and emit actions; media/download services expose platform-neutral interfaces. A later React Native client can reuse schemas, curriculum packages, progression rules, and API contracts even though it will not reuse DOM rendering.

## What remains, changes, and waits

### Keep

- Express startup, middleware order, security, session auth, validation, and error handling (`server.js`, `src/app.js`, `src/middleware`).
- PostgreSQL and existing user/language/account records (`src/db/pool.js`, `db/schema.sql`).
- Public landing, auth, teacher discovery/booking, community, live rooms/classroom, profile, subscription, and account deletion during the rewrite.
- Cloudflare R2 storage service for optional curriculum media (`src/services/storage.service.js`).
- Existing product palette, shell mechanics, icons, core cards/controls, accessibility/safe-area rules (`client/index.html`, `client/styles.css`, `client/js/ui.js`).

### Replace in learner flow

- `/app/dashboard` body becomes the learner Learn experience after a compatibility redirect period. Do not immediately remove the old My Learning lesson-booking content; move it to the existing `/app/learning/my-lessons` route first.
- Home/sidebar learner navigation becomes Learn, Review, Progress, and Settings, while teacher/community functions move under secondary navigation. Teacher accounts still receive their workspace links.
- The profile language-card entry remains available in Settings, while a dedicated language-selection screen owns first-run/change-course flow.

### Extend

- `client/js/ui.js`: break into primitives for Button, Card, Field, Modal, Feedback, Progress, Status, DownloadState, and AudioControl while preserving class recipes.
- `client/js/languages.js`: add curriculum availability/version metadata via server config; do not hard-code package state into language labels.
- API routing: add `/api/curriculum` and `/api/learning-progress` routers under explicit prefixes.
- Database: add curriculum installation/version references and user progress/attempt tables through ordered migrations.
- Tests: domain unit tests, repository tests, Express integration tests, browser E2E, offline/download cases, and accessibility checks.

### Deprecate but do not delete yet

- Browser hash-route fallback in `activeRoute` (`client/js/app.js:199-201`) after all bookmarks are confirmed on pathname routes.
- Duplicated API wrapper functions after one typed-by-convention JSON client exists.
- `dashboardView` wrapper/unused `metric` helper after old dashboard migration.
- Historical story/sentence sections of `FEATURE_LIST.md` and `QA_TESTING_GUIDE.md`; label/archive only after a product-owner reconciliation.
- Generic dev-admin story/sentence forms until their production data relevance and tracked/untracked status are resolved.
- Legacy database columns/tables and R2 keys. No deletion before production-data audit, export, telemetry window, and rollback expiration.

## Proposed source layout

```text
client/
  index.html
  design-tokens.css
  styles.css
  js/
    bootstrap.js                 # config/auth/start only
    core/
      router.js                  # one client route registry
      store.js                   # dispatch/subscribe/getState
      api-client.js              # JSON, errors, timeout, abort
      events.js                  # delegated UI action bridge
    components/
      button.js card.js field.js modal.js
      feedback.js progress.js status.js audio-control.js
      download-state.js app-shell.js
    domains/
      curriculum/
        model.js selectors.js curriculum-repository.js
      lessons/
        exercise-types.js lesson-reducer.js lesson-runner.js
      progress/
        model.js progress-repository.js sync-queue.js
      downloads/
        download-service.js package-validator.js
    pages/
      learn.js category.js lesson.js dialogue.js story.js
      review.js progress.js settings.js language-selection.js
      ...existing pages during migration
    persistence/
      indexed-db.js schema.js migrations.js
    ui.js                       # compatibility exports during migration
src/
  routes/
    curriculum.routes.js
    learning-progress.routes.js
  controllers/
    curriculum.controller.js
    learning-progress.controller.js
  services/
    curriculum.service.js
    learning-progress.service.js
  repositories/
    curriculum.repository.js
    learning-progress.repository.js
  schemas/
    curriculum-package.schema.json
db/migrations/
  0001_curriculum.sql
  0002_learning_progress.sql
curriculum/
  manifest.json
  zh-Hant/
    <version>/package.json
```

This is a target layout, not a Phase 1 file move. Existing modules can be adapted incrementally behind compatibility exports.

## Route plan

Use one data registry to generate browser matching/navigation and the Express SPA fallback allow-list. Keep semantic, refreshable paths:

| Screen | Proposed path |
| --- | --- |
| Language selection | `/app/languages` |
| Learn | `/app/learn` |
| Category | `/app/learn/:language/:categoryId` |
| Lesson | `/app/lesson/:language/:lessonId` |
| Dialogue/story | Same lesson route with exercise/content type; optional shareable `/app/dialogue/:id`, `/app/story/:id` only if direct entry is a requirement |
| Review | `/app/review` |
| Progress | `/app/progress` |
| Settings | `/app/settings` with subpaths `/learning`, `/downloads`, `/account` if needed |

Do not encode transient exercise index or selected answer in the URL. Persist resumable session state locally and server-side at deliberate checkpoints. Route changes should update document title, scroll, and focus the page heading/lesson instruction.

## Frontend state model

Replace unstructured globals with a small plain-JS store:

```js
{
  session: { user, subscription, connectivity },
  navigation: { route, params, returnTo },
  curriculum: {
    activeLanguage: "zh-Hant",
    manifestsByLanguage,
    packagesByVersion,
    downloadStateByPackage
  },
  learning: {
    activeLessonSession,
    answerDraft,
    feedback,
    reviewQueue
  },
  progress: {
    lessonProgressById,
    exerciseMasteryById,
    categoryProgressById,
    pendingSyncCount
  },
  ui: { modal, announcement, pendingActions }
}
```

Use event/action objects and pure reducers for lesson transitions: `LESSON_STARTED`, `ANSWER_CHANGED`, `ANSWER_SUBMITTED`, `FEEDBACK_ACKNOWLEDGED`, `EXERCISE_ADVANCED`, `LESSON_COMPLETED`, `SESSION_ABANDONED`. The reducer enforces one exercise at a time and prevents views from mutating progression. Selectors calculate locked/current/completed states from prerequisites and progress. Side effects—audio, API, IndexedDB, navigation—run outside reducers.

Keep server entities and curriculum definitions separate from transient UI state. Do not copy the entire `/api/state` response into every learning render. Abort obsolete route fetches via `AbortController`.

## IndexedDB plan

Introduce a versioned database such as `linguastories-learning`, accessed only through `client/js/persistence/indexed-db.js`. Stores:

| Store | Key | Contents |
| --- | --- | --- |
| `curriculumManifests` | `[language, version]` | Validated manifest, checksum, installed timestamp |
| `curriculumUnits` | `[language, version, entityType, id]` | Category/subgroup/lesson/exercise/story/dialogue JSON records |
| `mediaIndex` | `[language, version, assetId]` | URL, checksum, bytes, cache status; binary media should normally use Cache Storage |
| `lessonProgress` | `[userId, language, lessonId]` | status, score/mastery, cursor, timestamps, contentVersion |
| `attempts` | client-generated UUID | append-only answer attempt, correctness, response, timestamp, sync status |
| `reviewQueue` | `[userId, language, itemId]` | due time, interval/mastery fields, source content version |
| `syncQueue` | client-generated UUID | ordered idempotent progress mutations and retry metadata |
| `preferences` | `[userId, key]` | active language, audio speed, script/gloss options |

Rules:

- Prefix all user-specific keys with authenticated user ID and clear/partition on logout; never leak progress across accounts.
- Validate package schema and checksums before the active-version pointer changes. Installation is transactional: staging → verified → active.
- Keep immutable package versions side-by-side until no progress/session references the old one; then garbage-collect.
- Use Cache Storage for large audio/images so browser streaming/range behavior remains practical; IndexedDB stores metadata and JSON.
- Write attempts/progress locally first. Enqueue idempotent server sync with client event IDs. Reconcile by event ID, not last-write-wins blobs.
- Provide quota estimates, package byte size, cancel, retry, remove, and corrupted-package recovery.
- If IndexedDB is unavailable, allow online-only learning with an explicit state; do not silently claim offline readiness.

## Downloadable curriculum JSON

Serve immutable packages separately from authenticated progress APIs:

```text
GET /api/curriculum/manifest
GET /api/curriculum/:language/manifest
GET /curriculum/:language/:version/package.json
GET /curriculum/:language/:version/chunks/:chunk.json
GET /curriculum/:language/:version/assets/:asset
```

Recommended manifest fields: `schemaVersion`, `curriculumVersion`, `language` (`zh-Hant`), `fallbackLanguage`, `publishedAt`, `minimumAppVersion`, ordered chunk list, byte sizes, SHA-256 checksums, asset base URL, and package signature/version policy. Category/subgroup/lesson/exercise IDs are stable opaque strings; order is explicit; prerequisites reference IDs. Exercise records use a discriminated `type` (`select`, `match`, `order`, `type`, `listen`, etc.) and type-specific payloads. Dialogue and story records are content types linked from lesson exercises, not arbitrary HTML.

Express can serve checked-in/published JSON through `express.static` with:

- versioned package/chunk URLs: `Cache-Control: public, max-age=31536000, immutable` plus ETag;
- language manifest: short cache with ETag/stale-while-revalidate;
- no secrets/user data in curriculum JSON;
- correct JSON/audio/image content types and CORS/CSP origins;
- optional R2/CDN origin later, while the manifest contract remains unchanged.

Do not return an entire growing curriculum from `/api/state`. Do not generate curriculum dynamically per user. Entitlements, if introduced, should select allowed package IDs without changing package content.

## Server progress model

Add ordered SQL migrations rather than extending the monolithic schema as the only history. Minimum tables:

- `curriculum_releases`: language/version/schema/checksum/publish/active metadata.
- `user_curriculum_installations`: selected/installed release metadata if server visibility is needed.
- `lesson_progress`: one row per user/language/lesson/release with state, score/mastery, cursor, timestamps.
- `exercise_attempts`: append-only, client event UUID unique, lesson/exercise/content version, normalized response/result/timing.
- `review_items`: due scheduling/mastery state.
- optional `learning_events`: append-only sync/audit event if analytics or recovery requires it.

Progress endpoints accept batches with idempotency IDs, validate that exercise IDs exist in the referenced release, and return acknowledged IDs plus authoritative derived progress. Store Traditional Chinese content in packages, not duplicated in attempt rows. Apply retention/privacy behavior to account deletion.

## Exercise runner contract

Each exercise adapter implements a small stable interface:

```js
{
  type,
  validateDefinition(definition),
  initialAnswer(definition),
  render({ definition, answer, feedback, preferences }),
  normalizeAnswer(raw),
  evaluate(definition, normalizedAnswer),
  getAccessibilityPrompt(definition)
}
```

Start with select, order, match, type, and listen; dialogue/story use composed content plus one of those response modes. Evaluation can be client-side for offline operation but the normalized attempt is synced. Never execute HTML/script from curriculum JSON. Render text with `escapeHtml`; validate URLs and media MIME types.

## Offline and connectivity behavior

Phase the offline layer after packages and IndexedDB are stable. A service worker can precache the app shell and cache immutable curriculum/media. The current Tailwind CDN must be removed/self-hosted first, or the shell cannot be reliably offline. Connectivity is not a binary truth: distinguish browser offline, API unavailable, download missing, package corrupt, and progress awaiting sync.

An installed lesson starts without network. Completion writes locally and shows “saved on this device / sync pending” if necessary. Teacher bookings, community, messaging, and LiveKit remain online-only with clear boundaries.

## React Native portability

Portable assets:

- JSON Schema and curriculum package structure.
- Stable IDs/prerequisites/progression algorithms.
- Pure reducers/selectors/evaluators and review scheduling, authored as environment-neutral ES modules where feasible.
- HTTP endpoint and sync/idempotency contracts.
- Semantic design-token data (later export CSS variables and JSON from one source).

Web-specific assets:

- HTML-string renderers, DOM event delegation, History API router, IndexedDB/Cache Storage implementations, CSS/Tailwind classes, service worker, and browser audio APIs.

Define repository interfaces (`CurriculumRepository`, `ProgressRepository`, `MediaRepository`) so React Native supplies SQLite/filesystem/AsyncStorage implementations without changing domain code.

## Quality and observability gates

- Unit: package validation, prerequisite selectors, every exercise evaluator/reducer transition, review scheduling, migration transforms.
- API integration: manifests/cache headers, auth/progress idempotency, invalid release/exercise, account isolation.
- Browser E2E: language selection, download/resume/corruption, lesson correct/incorrect/quit/resume/complete, offline completion/sync, review, route refresh.
- Accessibility: keyboard-only lesson, focus on route/feedback change, screen-reader names/live regions, reduced motion, contrast, 200% text zoom.
- Visual regression: public shell, authenticated mobile/desktop, every exercise type/state, modal/bottom sheet, offline/download/error states.
- Metrics: package download failures/bytes/time, lesson start/complete/abandon, sync lag/failures, client schema versions—without recording sensitive free-text answers unless explicitly required and disclosed.
