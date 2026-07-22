# Review scheduler

The scheduler is a lightweight LinguaStories stability/interval model. It intentionally does not claim to implement a named algorithm. Constants live in `client/js/review/model.mjs` and are configurable through `DEFAULT_REVIEW_CONFIG`.

## Clock and initial timing

All due timestamps are epoch milliseconds representing UTC instants. Presentation uses the browser locale.

- Failed provisional target: 2 hours, inactive until a perfect pass.
- First perfect pass: 18 hours.
- Previously missed target on first perfect pass: 6 hours.
- Scheduled lapse: 20 minutes and `relearning`.
- Minimum successful interval: 4 hours; maximum: 365 days.

## Successful response

Quality is 1–3: correct-but-effortful, correct, or fast correct. The new interval is the prior interval multiplied by a quality multiplier (1.2, 1.8, 2.35) and a small difficulty factor, then clamped. Stability grows with quality and the logarithm of interval growth. An interval of at least 30 days enters `stable`.

## Incorrect response

A scheduled lapse reduces stability to 55%, increments lapses, resets consecutive success, marks the item weak and schedules relearning in 20 minutes. Optional practice is deliberately gentler: it retains at least 70% of the interval and 82% of stability, while still exposing the weakness.

## Mastery

An item is mastered only after at least four successful scheduled reviews, at least one successful production response, an interval of 30 days or more, and two consecutive successes. Lesson and category mastery require every active, non-deprecated child review item to meet that definition. A perfect lesson pass is “learned,” not automatically “mastered.”

The model stores counters, lapses, production successes, stability, interval, due time and the latest result. This makes every transition inspectable and permits a future scheduler to be introduced through an explicit migration.
