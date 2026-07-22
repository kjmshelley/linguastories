# Review system

Phase 7 adds a device-local spaced-review system for downloaded Traditional Chinese curriculum. It uses stable curriculum IDs and IndexedDB; it does not require an account, a server, connectivity, push notifications, or microphone access.

## Schedulable content

Each lesson can schedule vocabulary, each word's collocations, phrases and sentences, one dialogue unit, and one story unit. Generated exercise IDs are not scheduled because they describe a presentation of content rather than durable learning content. Review records retain a compact content snapshot so an existing session remains renderable offline.

## Lesson activation

- A failed lesson creates inactive, provisional, weak records only for content targeted by incorrect scored responses. They are placed near term but do not claim the learner has learned the content.
- The first perfect pass activates every required target in the lesson. A target missed in an earlier attempt starts at a shorter interval.
- A replay updates the same stable-ID records. Lesson completion and review activation share one transaction, and the existing completion event guard makes duplicate delivery idempotent.

## Persistent data

IndexedDB version 4 adds or extends:

- `reviewItems`: current schedule and mastery evidence per stable content ID.
- `reviewSessions`: immutable generated queue plus cursor, mode, counters and completion state.
- `reviewResponses`: unique response/event IDs, exercise mode, timing and schedule-before/after history.
- `reviewLeases`: expiring one-session-per-language-pair ownership.
- `reviewMigrations`: idempotent content-version migration reports.

All writes for an answer—response, item schedule, session cursor, mastery projection and lease renewal—are atomic. Reset deletes review data for only the selected language pair and preserves downloaded curriculum and settings.

## States and UI

Items use `new`, `learning`, `reviewing`, `stable`, `weak`, `relearning`, and `suspended`. The Review page shows due, overdue and weak counts, time estimate, streak, last/next review, mastery, category counts, quick/standard/extended options, weak-only practice, optional practice and a no-due state. Learn shows a due callout and navigation badge; Progress distinguishes learned lesson content from mastered review content.

## Concurrency and privacy

A 90-second renewable lease permits one active review session per language pair. A tab-specific owner ID and `BroadcastChannel` propagate changes across tabs. An expired lease can be safely acquired to resume the persisted session. No review data is sent off-device.
