# Privacy and local learning data

The Phase 3–8 learning system stores curriculum packages, settings, progress, attempts, item performance, lesson sessions, review items/responses/sessions, migrations, and short-lived ownership leases in the browser’s IndexedDB database `linguastories-learning`. The selected startup pair is a small local-storage key.

This phase adds no account, PostgreSQL learning tables, cloud synchronization, analytics upload, social ranking, notification permission, or background notification system. Existing LinguaStories account/community links remain separate product flows.

Local storage is private to the browser profile under normal browser isolation, but the UI does not claim encryption or immunity from device users, browser extensions, profile deletion, private-mode eviction, quota eviction, or cleared site data. Removing a download preserves history; clearing site data or using Reset Application Data does not.

Cross-tab settings and progress freshness use browser `BroadcastChannel`; no data leaves the device. Audio uses recorded curriculum URLs when present and otherwise the browser’s local speech-synthesis facilities. Voice availability and quality vary by device.

The curriculum information route explains metric definitions, local storage, reset boundaries, and the intentionally deferred export/import feature in user-facing language.
