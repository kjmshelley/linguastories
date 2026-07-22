# Lesson attempts

## Lifecycle

Opening an accessible lesson prepares an attempt before the controller mounts. A new attempt receives independent stable `attemptId` and `sessionId` values, an incrementing attempt number, curriculum version, category/lesson IDs, and start/last-active timestamps. The same attempt moves through `in_progress`, `paused`, then `passed` or `failed`.

The lesson session schema is version 3. It stores the attempt/session IDs, deterministic sequence IDs and seed, cursor, answers, results, failure flag, and active time. Version 2 sessions can be upgraded when their sequence and curriculum version still match. A saved results screen is never attached to a new attempt; reopening a finished lesson starts a clean replay.

## Restore and pause

A session restores only when lesson ID, curriculum version, cursor, and every deterministic sequence ID match. Reloading in the same tab resumes the lease and saved state. Hiding the page or using Exit pauses both the UI session and attempt. If the required historical content version no longer exists, the user is sent back to current category content instead of silently mixing versions.

## Perfect-pass rule

Every scored response in a single full pass must be correct. One wrong scored answer makes the attempt fail even if later screens are completed. Failed attempts persist their accuracy, study time, response summaries, weak IDs, and activity event, but do not unlock the successor lesson.

On a later perfect attempt, the lesson becomes historically complete. Replays create new attempt records. A failed replay preserves earlier completion, category completion, and all unlocked successors; it contributes only new practice history, study time, and item performance.

## Retention

Phase 6 retains all attempts. It does not silently prune failed or sync-pending history. A future retention policy may keep all passed attempts and a bounded failed-attempt window only after sync semantics and explicit observability exist.

