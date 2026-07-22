# LinguaStories learning rewrite migration plan

This sequence preserves the current teacher/community product while introducing a Traditional Chinese structured-learning domain. Each phase is independently releasable and reversible. No rewrite UI begins in Phase 1.

## Guiding constraints

- Preserve the existing LinguaStories visual identity; do not import Duolingo branding, green, mascots, currency, hearts, leagues, chests, or exact path layouts.
- Use Duolingo only as an interaction reference: sequential unlocks, one exercise at a time, immediate feedback, and completion.
- Remain plain JavaScript plus the existing Express server.
- Mobile first; desktop increases context and breathing room, not dashboard density.
- Never delete legacy code/data in the same release that replaces it.
- Curriculum packages are versioned/immutable; progress writes are idempotent and work offline after download.

## Phase 1 — Audit and design-system extraction (this change)

Deliverables:

- `docs/rewrite/repository-audit.md`
- `docs/rewrite/ui-design-system.md`
- `docs/rewrite/component-inventory.md`
- `docs/rewrite/architecture-plan.md`
- `docs/rewrite/migration-plan.md`
- additive `client/design-tokens.css`, loaded without changing current rendered values

Exit checks:

- Source paths/line references verified.
- No product page/view behavior changed.
- Existing automated suite passes.
- Stakeholders reconcile executable scope against `FEATURE_LIST.md` and `QA_TESTING_GUIDE.md` before treating either as a current specification.

## Phase 2 — Foundations without user-visible route replacement

Work:

1. Add an ordered `db/migrations` runner and baseline current schema ownership; do not rewrite production history.
2. Define JSON Schema for manifest/category/subgroup/lesson/exercise/dialogue/story records and publish a tiny non-production `zh-Hant` fixture package.
3. Add a single frontend route registry used by browser matching/path building and exported/generated Express SPA fallback patterns.
4. Extract one JSON API client with timeout, abort, normalized errors, and auth redirect behavior.
5. Add a minimal dispatch/reducer store and compatibility adapters so current pages continue to receive the same context.
6. Extract modal, pending, status, and route-focus utilities with unit tests.
7. Replace Tailwind CDN with a checked-in/compiled or self-hosted CSS artifact while preserving screenshots and CSP behavior. This is required before dependable offline support.

Validation:

- Golden screenshots at 320, 390, 768, 1024, and 1440 px match baseline.
- Direct refresh succeeds for every existing app route.
- Current API and subscription tests pass; new router/client/store tests pass.
- CSP no longer needs the Tailwind CDN. Remove `'unsafe-inline'` only when inline config/style use is actually gone.

Rollback: compatibility exports retain `client/js/app.js` behavior and the prior CSS artifact can be restored independently.

## Phase 3 — Curriculum delivery and local persistence

Work:

1. Add immutable static curriculum serving and short-cache manifests.
2. Implement package validator/checksum verification and schema/version compatibility rules.
3. Add IndexedDB migrations, curriculum/progress repositories, package staging/activation, quota checks, and user partitioning.
4. Add Cache Storage for media and, only after CSS is self-hosted, a service worker for the app shell/immutable content.
5. Build non-route developer diagnostics for install/remove/corrupt/retry/offline/sync states.
6. Add server curriculum release and progress/attempt/review tables plus idempotent batch endpoints.

Validation:

- Interrupted download never replaces the active package.
- Checksum/schema failure produces recoverable error and preserves the old version.
- Two signed-in users on one browser cannot read each other's progress.
- Offline package opens after a cold reload; online-only features clearly remain unavailable.
- Progress sync retries without duplicate attempts.

Rollback: manifest keeps previous version active; client retains old package until new version verifies; server tables are additive.

## Phase 4 — Vertical slice behind a feature flag

Scope one complete, representative slice: Traditional Chinese language selection → one category → one subgroup → one short lesson → completion → progress update. Include select, order, type, and listen exercises; at least one correct and incorrect feedback path; downloadable audio; quit/resume.

Work:

- Add `/app/languages`, `/app/learn`, category, and lesson routes behind a server-delivered capability/feature flag.
- Build LanguageCard, CategoryCard, SubgroupCard, ProgressBar, ExerciseShell, four exercise adapters, FeedbackPanel, AudioControl, DownloadState, and completion screen from existing Lingua tokens/primitives.
- Make lesson reducer pure and exhaustively tested.
- Add route heading focus, feedback live region, full keyboard operation, reduced-motion behavior, and Traditional Chinese typography checks.
- Keep `/app/dashboard` unchanged for users outside the flag.

Validation:

- Automated state-transition tests cover submit/feedback/continue, double-submit, refresh/resume, abandon, and completion.
- E2E covers mobile/desktop, online/offline, keyboard, slow audio, API failure, and IndexedDB unavailable.
- Design review confirms it reads as LinguaStories and not a generic dashboard or branded clone.

Rollback: disable flag; routes redirect to existing dashboard; package/progress data remains additive.

## Phase 5 — Dialogue, story, review, and complete course progression

Work:

- Add remaining exercise types (match and other approved interactions).
- Add dialogue and story content renderers linked to exercise responses.
- Add prerequisite/locked-level selectors and category/subgroup completion rules.
- Add review scheduling and one-exercise review runner.
- Add download management and explicit offline settings.
- Expand Traditional Chinese curriculum from fixture to reviewed production packages with editorial QA and stable IDs.

Validation:

- Every content/exercise schema has positive and negative fixtures.
- Traditional Chinese script, punctuation, pronunciation/gloss policy, audio alignment, and answer normalization receive native-speaker/editorial QA.
- Content version upgrades retain or intentionally migrate progress; migration behavior is tested.
- Review due calculations are deterministic across timezone/DST changes.

Rollback: feature flags can disable individual content types; older package remains supported for a declared window.

## Phase 6 — Progress, settings, and learner navigation cutover

Work:

- Add learner Progress page with course/skill/activity/milestone narrative.
- Reorganize existing profile/language/subscription controls under Settings; add downloads/audio/script preferences.
- Cut learner primary navigation to Learn, Review, Progress, Settings. Keep Community/Teachers accessible as secondary areas and preserve teacher workspace based on capabilities.
- Move old dashboard booking content permanently to My Lessons before redirecting `/app/dashboard` to `/app/learn`.
- Add server redirects/aliases and analytics for old-route use.

Validation:

- Existing teacher booking, classroom, community, messaging, profile, subscription, and account deletion regression suites pass.
- Back/forward/direct refresh work across new and preserved routes.
- No screen uses admin-dashboard visual patterns or disallowed gamification metaphors.

Rollback: restore old nav/dashboard mapping while leaving new routes directly accessible or flagged off.

## Phase 7 — Stabilization and measured deprecation

Observe at least one agreed release window before removal. Track route usage, sync error rate, package install success, lesson resume/completion, and support incidents.

Only then consider:

- Removing unused dashboard wrapper/hash routing and duplicate API wrappers.
- Archiving superseded QA/feature documents with links to the new specification.
- Removing legacy story/sentence code or database objects after a production data export and dependency search.
- Garbage-collecting unsupported curriculum package versions.
- Splitting `teacher-student.service.js` and other large modules as separate maintainability work.

Deletion gate for any table/column/R2 prefix:

1. Repository and production query/search audit.
2. Data owner and retention decision.
3. Verified export/backup and restore test.
4. Read path disabled for one full rollback window.
5. Explicit destructive migration review.

## Test strategy by layer

| Layer | Required coverage |
| --- | --- |
| Schema/content | JSON Schema, checksums, stable references, Traditional Chinese editorial lint |
| Domain | Prerequisites, locks, evaluation, reducer transitions, completion, review scheduling |
| Persistence | IndexedDB upgrades, transactions, quota, corruption, per-user isolation, sync queue |
| Server | Auth isolation, manifest caching, immutable assets, progress idempotency, invalid content versions |
| Components | Every button/input/card/feedback/download state, keyboard/focus/live region |
| E2E | First run, download, lesson, resume, completion, review, progress, settings, offline/reconnect |
| Regression | Public marketing/auth, teachers/bookings/classroom, community/chat/rooms, account/billing |
| Visual | Representative mobile/desktop pages plus correct/incorrect/locked/loading/offline/error states |

## Release and data safety

- Feature flags come from `/api/config` or account capabilities, not build-time branches.
- Deploy server additive changes before clients reference them; keep APIs backward-compatible for at least the rollback window.
- Curriculum publishing is separate from app deployment and uses immutable version IDs plus a manifest pointer.
- Never overwrite a published package URL. Publish new version, validate, then atomically advance manifest.
- Client progress mutations carry UUID idempotency keys and content version.
- Account deletion must remove new server progress/review/attempt data and ensure local user partitions are cleared on logout/deletion.
- Do not log credentials, free-text answers, or curriculum package contents unnecessarily.

## Definition of complete

The rewrite is complete only when a learner can select Traditional Chinese, download a validated course, move through categories/subgroups/lessons, complete all supported exercise/dialogue/story interactions, receive accessible immediate feedback, review due material, inspect progress, manage settings/downloads, work offline for installed material, and later sync without duplication—while the retained teacher/community/account product still passes regression testing and the UI remains recognizably LinguaStories.
