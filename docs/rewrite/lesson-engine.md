# Lesson engine

The plain-JavaScript lesson runner consumes immutable curriculum objects. The active route is `/app/learn/:categorySlug/:lessonId`; both values are stable curriculum identifiers. The browser loads only the installed category fragment, validates its version and references, caches it in memory, and verifies both category and lesson prerequisites. Direct URLs cannot open a locked lesson.

## Module boundaries

- `curriculum-repository.js` fetches, validates, and caches active category fragments.
- `sequence-builder.mjs` creates the ordered word → collocation → phrase → sentence → dialogue → story sequence and never mutates curriculum arrays.
- `session.mjs` is the pure state transition and active-time model.
- `lesson-controller.js` translates DOM events into session actions and owns focus, visibility pause, analytics events, and exit behavior.
- `exercise-renderers.mjs` is the renderer registry for instructional, select, match, order, type, listen, dialogue, and story presentations.
- `answer-evaluator.mjs` is the only scoring boundary.
- `session-repository.mjs` defines the adapter boundary; production sessions use the IndexedDB repository initialized by the content runtime.
- `progress-runtime.js` prepares durable attempts, enforces access, and atomically records the final outcome.
- `audio-service.js` selects recorded audio, then `zh-TW` speech synthesis, then reports no audio.
- `analytics.js` provides a no-op event boundary for later privacy-reviewed analytics.

## State machine

Sessions use schema version 3 and store curriculum version, stable lesson/attempt/session IDs, attempt number, deterministic seed, cursor, ordered sequence IDs, answers, results, failure state, pause origin, and active milliseconds. Compatible version 2 sessions are upgraded during restore.

`intro → active → feedback → active … → results`

`active/feedback → paused → active`

Only one submit is accepted for an exercise. Feedback never blocks continuation after a wrong answer. Instructional cards are marked unscored. A result is perfect only when at least one scored item exists and no scored response was wrong. Every pass is persisted; only a perfect pass completes the lesson and unlocks its explicit successor. Failed replays preserve earlier completion.

Stored sessions are restored only when schema version, curriculum version, lesson ID, sequence length, and every ordered sequence ID match. Corrupt, stale, or reordered data starts fresh. The storage key is partitioned by target language, source language, and lesson ID.

## Timing and lifecycle

Active time begins on start/resume and accrues on submit, activity checkpoints, or pause. A single interval is capped at 60 seconds so an inactive open tab cannot inflate study time. `visibilitychange` pauses a hidden lesson. Exit opens a confirmation layer after pausing timing; confirming saves and returns to the category, while cancelling resumes.

The controller stops active audio before unmounting or starting another clip. Page and exercise headings receive programmatic focus after state changes. Feedback uses a polite live region. Number keys choose visible options, Escape opens exit confirmation, and Enter advances when focus is not already in an input or button.

## Deferred boundaries

Review scheduling, spaced repetition, cloud sync, and server-authoritative progress remain deferred. The repository, evaluator, and session transition boundaries allow those systems to be added without rewriting exercise interactions.
