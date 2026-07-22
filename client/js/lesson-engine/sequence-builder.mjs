import { shuffledCopy } from "./randomizer.mjs";

export const STAGE_ORDER = ["word", "collocation", "phrase", "sentence", "dialogue", "story"];

function indexed(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function wordPresentation(word, lesson) {
  const example = word.sentences?.[0] || word.phrases?.[0] || {};
  return {
    id: `presentation-${lesson.id}-${word.id}`,
    type: "word_presentation",
    stage: "word",
    scored: false,
    prompt: "New word",
    word,
    correctAnswer: null,
    acceptedAnswers: [] ,
    targetContentReferences: [word.id],
    example
  };
}

function storyReading(story, lesson) {
  return {
    id: `story-reading-${lesson.id}`,
    type: "story_reading",
    stage: "story",
    scored: false,
    prompt: story?.title?.english || story?.title?.traditional || story?.title || "Read the story",
    story,
    correctAnswer: null,
    acceptedAnswers: [],
    targetContentReferences: [story.id, ...(story?.vocabularyReferences || [])]
  };
}

function storyReconstruction(story, lesson) {
  const line = story?.lines?.find((item) => String(item?.traditional || item?.text || item || "").length > 2);
  const text = String(line?.traditional || line?.text || line || "");
  if (!text) return null;
  return {
    id: `story-reconstruction-${lesson.id}`,
    type: "story_sentence_reconstruction",
    stage: "story",
    scored: true,
    prompt: "Rebuild this sentence from the story.",
    correctAnswer: text,
    acceptedAnswers: [text],
    distractors: [],
    targetContentReferences: [story.id, ...(line?.vocabularyReferences || [])],
    feedback: "Keep the story sentence in its original order."
  };
}

function referencedWord(exercise, wordsById) {
  return (exercise.targetContentReferences || []).map((id) => wordsById.get(id)).find(Boolean);
}

function audioFallback(exercise) {
  const choice = exercise.type === "listen_and_select";
  return {
    ...exercise,
    id: `${exercise.id}-audio-fallback`,
    sourceExerciseId: exercise.id,
    type: choice ? "meaning_to_word" : "target_language_typing",
    prompt: choice ? "Choose the Traditional Chinese word." : "Type the Traditional Chinese word shown in this lesson.",
    audioUnavailable: true
  };
}

export function buildLessonSequence(bundle, lessonId, options = {}) {
  const lesson = (bundle.lessons || []).find((item) => item.id === lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${lessonId}`);
  const wordsById = indexed(bundle.words);
  const exercisesById = indexed(bundle.exercises);
  const story = (bundle.stories || []).find((item) => item.id === lesson.storyId);
  const items = lesson.wordIds.map((id) => wordsById.get(id)).filter(Boolean).map((word) => wordPresentation(word, lesson));
  const exercises = lesson.exerciseIds.map((id) => exercisesById.get(id)).filter(Boolean).filter((exercise) => {
    if (exercise.type !== "classifier_selection") return true;
    const word = referencedWord(exercise, wordsById);
    return Boolean(word?.classifier && word.classifier === exercise.correctAnswer);
  }).map((exercise) => {
    const item = { ...exercise, scored: true, options: shuffledCopy([exercise.correctAnswer, ...(exercise.distractors || [])], `${options.seed}:${exercise.id}`) };
    if (["phrase_ordering", "sentence_ordering"].includes(exercise.type)) {
      const tokens = /\s/.test(String(exercise.correctAnswer).trim()) ? String(exercise.correctAnswer).trim().split(/\s+/) : Array.from(String(exercise.correctAnswer).replace(/[。！？!?]/g, ""));
      item.orderTokens = shuffledCopy(tokens, `${options.seed}:${exercise.id}:tokens`);
    }
    if (exercise.type === "dialogue_ordering") item.orderTokens = shuffledCopy(exercise.correctAnswer, `${options.seed}:${exercise.id}:turns`);
    if (exercise.type === "match_pairs") item.matchRight = shuffledCopy(exercise.correctAnswer.map((pair) => pair[1]), `${options.seed}:${exercise.id}:pairs`);
    return exercise.type.startsWith("listen_") && options.audioAvailable === false ? audioFallback(item) : item;
  });
  for (const stage of STAGE_ORDER) {
    if (stage === "story") items.push(storyReading(story, lesson));
    items.push(...exercises.filter((exercise) => exercise.stage === stage));
    if (stage === "story") {
      const reconstruction = storyReconstruction(story, lesson);
      if (reconstruction) {
        reconstruction.orderTokens = shuffledCopy(Array.from(String(reconstruction.correctAnswer).replace(/[。！？!?]/g, "")), `${options.seed}:${reconstruction.id}:tokens`);
        items.push(reconstruction);
      }
    }
  }
  return items.map((item, index) => ({ ...item, sequenceIndex: index }));
}
