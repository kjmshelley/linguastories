# Progress system

## Scope and ownership

Phase 6 stores learning progress locally in IndexedDB database `linguastories-learning`, schema version 3. Curriculum packages, settings, and account/community data remain separate from learning history. All records are scoped by `languagePairKey`; the initial key is `zh-Hant_zh-TW__en`.

The browser runtime is a thin coordinator. Domain decisions live in `client/js/progress/`: repositories own persistence, `UnlockService` derives access, `CompletionService` owns the atomic completion boundary, `ProgressCalculator` produces screen metrics, and `ProgressRuntime` connects those services to the UI and cross-tab notifications.

## Stored records

- `progress`: category and lesson aggregates keyed by language pair, entity type, and stable entity ID.
- `lessonAttempts`: immutable-in-purpose attempt history plus the current state of in-progress/paused attempts.
- `contentItemProgress`: encounters, correct/incorrect responses, learned state, and weakness for stable vocabulary/dialogue/story/exercise IDs.
- `progressEvents`: user-facing activity events. The completion event ID is also the idempotency key.
- `progressMigrations`: one report per language pair/from-version/to-version migration.
- `attemptLeases`: expiring per-lesson ownership used to prevent two tabs from running the same attempt.

Records include timestamps, revisions, deletion/sync placeholders, content version, and stable IDs so a later account-sync system can be added without replacing the local model.

## Completion transaction

Finishing the final activity calls one read/write transaction across attempts, progress, item progress, activity events, and leases. The transaction:

1. Checks `completion:{attemptId}` and returns the existing outcome when already processed.
2. Finalizes the attempt as `passed` or `failed`.
3. Updates the lesson aggregate without erasing historical completion on replay.
4. Updates every referenced content item and recalculates weakness.
5. Recalculates the category using all required lessons.
6. Writes one activity event and releases the attempt lease.

Any write failure aborts the whole transaction. Duplicate UI events, reload delivery, and repeated calls therefore cannot increment attempts, study time, or item counts twice.

## Calculations

Completion requires one full attempt in which every scored activity is correct. Instructional word/story presentations do not affect accuracy. Percentages use `floor(completed / required * 100)` and return 100 only when every required item is complete. Study time is active lesson time, capped at 60 seconds per unobserved interval to avoid counting abandoned tabs.

Weakness is deliberately small and explainable: repeated errors and a recent error add weight; correct answers and recovery after an error reduce it. Scores of 5+ are `weak`, 2+ are `at_risk`, repeated correct work can become `stable`, and unseen/low-signal items remain `new`. This is diagnostic prioritization, not spaced repetition.

## Cross-tab behavior

Each browser tab keeps a stable ID in `sessionStorage`, so reloads retain their lease while distinct tabs receive distinct owners. Leases expire after 90 seconds if abandoned. `BroadcastChannel` announces progress changes and resets; other tabs refresh their projections. A reset event exits an active lesson and removes its cached session so stale UI cannot recreate deleted history.

## Future sync boundary

`ProgressSyncAdapter`, revision fields, sync state, device metadata, conflict metadata, and tombstone fields are placeholders only. Phase 6 performs no network sync and never treats the server as authoritative for progress.

