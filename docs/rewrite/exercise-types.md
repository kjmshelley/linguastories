# Exercise type registry

The sequence builder groups all interactions by the curriculum stage order. It inserts one unscored `word_presentation` for every target word before scored word work and one unscored `story_reading` before story questions. It derives `story_sentence_reconstruction` from a published story line. All other definitions retain their stable Phase 3 exercise IDs.

| Renderer family | Exercise types | Response shape |
| --- | --- | --- |
| Instructional | `word_presentation`, `story_reading` | none; Continue only |
| Choice | `word_to_meaning`, `meaning_to_word`, `listen_and_select`, `fill_in_the_blank`, `natural_collocation_selection`, `classifier_selection`, `dialogue_completion`, `dialogue_comprehension`, `story_comprehension`, `true_or_false`, `best_response`, `correct_pinyin`, `unnatural_phrase_identification` | scalar string |
| Match | `match_pairs` | array of `[target, meaning]` pairs; pair order is irrelevant |
| Order | `phrase_ordering`, `sentence_ordering`, `dialogue_ordering`, `story_sentence_reconstruction` | ordered token or turn array |
| Type | `listen_and_type`, `translation`, `target_language_typing`, `source_language_typing` | scalar string |

Dialogue-stage questions show the referenced dialogue above the interaction. The story reader shows published lines and optional translations. Every renderer escapes curriculum text before insertion; curriculum content is never executed as HTML.

## Deterministic variants

Choice order, match right-column order, and ordering token banks use a seed composed from stable lesson ID, attempt, and exercise ID. Restoring the same session produces the same order. A retry changes the attempt and therefore the display order. Randomization always operates on copies.

## Classifier and audio validity

`classifier_selection` appears only when the referenced word has a non-null published classifier equal to the exercise answer. The generator's generic fallback classifier is not treated as validated teaching content.

Audio preference is recorded URL → browser `zh-TW` speech synthesis → unavailable. If neither recorded media nor speech synthesis exists, `listen_and_select` becomes an equivalent `meaning_to_word` choice and `listen_and_type` becomes `target_language_typing`. The replacement retains `sourceExerciseId`, carries an audio-unavailable note, and never blocks the lesson.

## Adding a type

Add the schema definition in the curriculum pipeline, map its rendering family in `exercise-renderers.mjs`, define its response shape and normalization in `answer-evaluator.mjs`, and add transition plus keyboard/browser tests. Do not special-case individual lesson IDs or content strings in a component.
