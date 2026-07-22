# Answer evaluation

All scoring passes through `evaluateAnswer(definition, rawAnswer, options)`. Renderers collect responses but do not decide correctness. The evaluator returns correctness, a normalized answer, the expected answer, learner-facing feedback, and an optional explanation.

## Normalization policy

Scalar comparison applies Unicode NFC normalization, surrounding-whitespace removal, locale-safe English lowercase, repeated-whitespace collapse, and presentation punctuation removal. Traditional and Western sentence-ending punctuation are treated equivalently. Hyphenated and space-separated English phrases compare equivalently after punctuation normalization.

Accepted answers are the union of `correctAnswer` and explicitly published `acceptedAnswers`. Array order is significant for sentence/dialogue ordering. Match-pair order is not significant, but each target must still be paired with its correct meaning.

Pinyin comparison retains combining tone marks. `lǚ xíng` and `lu xing` are therefore different unless an untoned answer is explicitly published. Traditional Chinese is the target script. Simplified characters are not silently converted or accepted; common substitutions receive a helpful “Use Traditional Chinese” hint.

Typo tolerance is off by default. A caller may explicitly enable a bounded Levenshtein distance for strings of six or more characters; this is not used by the current curriculum. The evaluator never applies broad fuzzy meaning matching.

## Feedback rules

- Correct: concise confirmation.
- Incorrect: curriculum feedback when supplied, plus the expected answer in the feedback panel.
- Simplified input: script-specific guidance when a known substitution is detected.
- Instructional item: automatically correct, marked `instructional`, and excluded from the scored total.

A wrong answer permanently marks the attempt failed even though the learner continues through every remaining exercise. Only a fully correct scored pass can complete the lesson.
