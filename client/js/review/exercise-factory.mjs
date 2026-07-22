import { shuffledCopy } from "../lesson-engine/randomizer.mjs";

function targetText(item) { return item.content?.traditional || item.content?.title?.traditional || item.content?.turns?.[0]?.traditional || item.content?.lines?.[1]?.traditional || item.content?.lines?.[0]?.traditional || item.targetId; }
function sourceText(item) { return item.content?.englishMeaning || item.content?.meanings?.[0] || item.content?.english || item.content?.title?.english || item.content?.turns?.[0]?.english || item.content?.lines?.[1]?.english || item.content?.lines?.[0]?.english || "the published meaning"; }

export function buildReviewExercise(item, { pool = [], seed = "review", mode = null } = {}) {
  const target = targetText(item); const source = sourceText(item);
  const production = mode === "production" || (mode !== "recognition" && (Number(item.successfulReviews || 0) > 0 || item.state === "relearning"));
  const id = `review-exercise:${item.id}:${production ? "production" : "recognition"}:${Number(item.reviewCount || 0)}`;
  if (production) return {
    id, type: "target_language_typing", stage: item.targetType === "vocabulary" ? "word" : item.targetType,
    scored: true, prompt: `Type this in Traditional Chinese: ${source}`, correctAnswer: target, acceptedAnswers: [target],
    feedback: `Use the published Traditional Chinese form: ${target}`, targetContentReferences: [item.targetId], reviewItemId: item.id, reviewMode: "production"
  };
  const distractors = [...new Set(pool.filter((other) => other.id !== item.id && other.targetType === item.targetType).map(sourceText).filter((value) => value && value !== source))].slice(0, 3);
  if (item.targetType === "vocabulary" && distractors.length >= 2) return {
    id, type: "word_to_meaning", stage: "word", scored: true, prompt: `What does ${target} mean?`, correctAnswer: source,
    acceptedAnswers: [source], distractors, options: shuffledCopy([source, ...distractors], `${seed}:${item.id}`),
    feedback: `The published meaning is ${source}.`, targetContentReferences: [item.targetId], reviewItemId: item.id, reviewMode: "recognition"
  };
  return {
    id, type: "source_language_typing", stage: item.targetType === "vocabulary" ? "word" : item.targetType,
    scored: true, prompt: `Translate into English: ${target}`, correctAnswer: source, acceptedAnswers: [source],
    feedback: `The published translation is ${source}.`, targetContentReferences: [item.targetId], reviewItemId: item.id, reviewMode: "recognition"
  };
}
