# Language management

The runtime and settings schema are keyed by a stable language-pair key. Progress, lesson attempts, saved sessions, review schedules, and pair preferences are isolated by that key. Global preferences intentionally cross pairs.

The current manifest publishes one functional pair: Traditional Chinese (Taiwan), `zh-TW`/Hant, from English. The language screen therefore shows only that pair; unsupported languages are not presented as working options.

An installed pair can be activated only after its manifest and category packages pass checksum, schema, version, and reference validation. Selecting an uninstalled pair enters the Phase 5 download flow and changes the startup pair only after atomic activation. Switching does not reset or merge the previous pair’s progress.

The architecture supports future pairs through `languagePairKey`, pair-scoped repositories, and pair-scoped settings. A complete future switch must rebuild the content, progress, and review runtimes for the selected pair while preserving any paused session. That multi-pair UI is deliberately not exposed until another valid pair exists in the manifest.

Direct routes include `/app/languages`, `/app/progress/category/:slug`, `/app/story/:id?category=:slug`, and `/app/settings/curriculum`.
