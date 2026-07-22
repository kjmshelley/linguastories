# Review queue

Queue construction is deterministic for a language pair, UTC date, mode, category and session length. The available lengths are quick (5), standard (12, within the requested 10–15 range), and extended (25, within the requested 20–30 range).

## Eligibility and priority

Scheduled queues include active, non-deprecated, non-suspended items with `dueAt <= now`. Filters can restrict to a category or weak items. Optional practice can select healthy future items without pretending they were due.

Priority combines capped overdue hours, a large weak-item bonus, lapse history, provisional history, and relearning state. A stable hash breaks ties. Selection avoids three consecutive items from one category when another category is available and avoids repeating one content type consecutively when possible.

## Exercise progression

New targets begin with recognition. After a successful review—or whenever an item is relearning—the factory selects production. Vocabulary recognition uses published meanings and same-type distractors; other recognition and all production use the existing normalized typing evaluator. Generated definitions are embedded in the session, so refresh/resume does not reshuffle or change an answer.

An incorrect answer inserts exactly one production reinforcement for that target after one intervening queue item when possible. The session response history prevents another reinforcement for the same target. This reinforcement updates the schedule normally but cannot create an unbounded loop.

## Sessions

Starting a queue first resumes an existing active session. Otherwise it persists the generated definitions, cursor, mode and counters before interaction begins. Every submitted response has a deterministic caller-provided ID; a duplicate returns the prior response and does not advance or reschedule. Pausing releases the lease while retaining the active session for later resume.
