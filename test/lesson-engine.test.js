const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const fixturePath = path.join(__dirname, "..", "content", "generated", "zh-TW", "en", "v1.0.0", "categories", "travel.json");
const bundle = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const lesson = bundle.lessons[0];

test("seeded randomization is repeatable and never mutates source arrays", async () => {
  const { shuffledCopy } = await import("../client/js/lesson-engine/randomizer.mjs");
  const source = [1, 2, 3, 4, 5];
  assert.deepEqual(shuffledCopy(source, "same"), shuffledCopy(source, "same"));
  assert.notDeepEqual(shuffledCopy(source, "same"), shuffledCopy(source, "different"));
  assert.deepEqual(source, [1, 2, 3, 4, 5]);
});

test("answer evaluation normalizes safe presentation differences but preserves pinyin tones", async () => {
  const { evaluateAnswer } = await import("../client/js/lesson-engine/answer-evaluator.mjs");
  const base = { scored: true, type: "translation", correctAnswer: "今天我想旅行。", acceptedAnswers: [], feedback: "Review it." };
  assert.equal(evaluateAnswer(base, "  今天我想旅行！ ").correct, true);
  assert.equal(evaluateAnswer({ ...base, type: "source_language_typing", correctAnswer: "Round-trip ticket" }, "round trip ticket").correct, true);
  assert.equal(evaluateAnswer({ ...base, type: "correct_pinyin", correctAnswer: "lǚ xíng" }, "lu xing").correct, false);
  assert.match(evaluateAnswer({ ...base, correctAnswer: "這個" }, "这个").feedback, /Traditional Chinese/);
});

test("sequence builder covers all curriculum exercises and adds instructional stages", async () => {
  const { buildLessonSequence, STAGE_ORDER } = await import("../client/js/lesson-engine/sequence-builder.mjs");
  const sequence = buildLessonSequence(bundle, lesson.id, { seed: "lesson:1", audioAvailable: true });
  const types = new Set(sequence.map((item) => item.type));
  assert.equal(sequence.filter((item) => item.type === "word_presentation").length, lesson.wordIds.length);
  assert.ok(types.has("story_reading"));
  assert.ok(types.has("story_sentence_reconstruction"));
  assert.ok(lesson.exerciseIds.every((id) => sequence.some((item) => item.id === id) || bundle.exercises.find((item) => item.id === id)?.type === "classifier_selection"));
  const stageIndexes = sequence.map((item) => STAGE_ORDER.indexOf(item.stage));
  assert.ok(stageIndexes.every((value, index) => index === 0 || value >= stageIndexes[index - 1]));
});

test("audio exercises receive deterministic non-blocking fallbacks when audio is unavailable", async () => {
  const { buildLessonSequence } = await import("../client/js/lesson-engine/sequence-builder.mjs");
  const sequence = buildLessonSequence(bundle, lesson.id, { seed: "offline", audioAvailable: false });
  assert.equal(sequence.some((item) => item.type.startsWith("listen_")), false);
  assert.equal(sequence.filter((item) => item.audioUnavailable).length, 2);
  assert.equal(sequence.filter((item) => item.sourceExerciseId).length, 2);
});

test("lesson reducer blocks double-submit, accounts active time, resumes, and requires a perfect pass", async () => {
  const { createLessonSession, reduceLessonSession, sessionSummary } = await import("../client/js/lesson-engine/session.mjs");
  const sequence = [{ id: "teach" }, { id: "score" }];
  let state = createLessonSession({ lessonId: "lesson", categorySlug: "travel", curriculumVersion: "1", sequence, now: 1000 });
  state = reduceLessonSession(state, { type: "START", now: 2000 });
  state = reduceLessonSession(state, { type: "SUBMIT", result: { correct: true, instructional: true }, now: 5000 });
  const duplicate = reduceLessonSession(state, { type: "SUBMIT", result: { correct: false }, now: 6000 });
  assert.deepEqual(duplicate.results, state.results);
  state = reduceLessonSession(state, { type: "CONTINUE", now: 7000 });
  state = reduceLessonSession(state, { type: "SUBMIT", result: { correct: false }, now: 9000 });
  state = reduceLessonSession(state, { type: "CONTINUE", now: 10000 });
  assert.equal(state.status, "results");
  assert.equal(sessionSummary(state).perfect, false);
  assert.equal(state.activeMs, 5000);
});

test("pausing feedback restores feedback instead of creating an unadvanceable active state", async () => {
  const { createLessonSession, reduceLessonSession } = await import("../client/js/lesson-engine/session.mjs");
  let state = createLessonSession({ lessonId: "lesson", categorySlug: "travel", curriculumVersion: "1", sequence: [{ id: "score" }], now: 1 });
  state = reduceLessonSession(state, { type: "START", now: 2 });
  state = reduceLessonSession(state, { type: "SUBMIT", result: { correct: true }, now: 3 });
  state = reduceLessonSession(state, { type: "PAUSE", now: 4 });
  assert.equal(state.pausedFrom, "feedback");
  state = reduceLessonSession(state, { type: "RESUME", now: 5 });
  assert.equal(state.status, "feedback");
  state = reduceLessonSession(state, { type: "CONTINUE", now: 6 });
  assert.equal(state.status, "results");
});

test("session restoration rejects corrupt, wrong-version, and reordered payloads", async () => {
  const { createLessonSession, isRestorableSession } = await import("../client/js/lesson-engine/session.mjs");
  const sequence = [{ id: "one" }, { id: "two" }];
  const session = createLessonSession({ lessonId: "lesson", categorySlug: "travel", curriculumVersion: "1", sequence });
  assert.equal(isRestorableSession(session, { lessonId: "lesson", curriculumVersion: "1", sequence }), true);
  assert.equal(isRestorableSession({ ...session, curriculumVersion: "2" }, { lessonId: "lesson", curriculumVersion: "1", sequence }), false);
  assert.equal(isRestorableSession({ ...session, sequenceIds: ["two", "one"] }, { lessonId: "lesson", curriculumVersion: "1", sequence }), false);
  assert.equal(isRestorableSession({ nope: true }, { lessonId: "lesson", curriculumVersion: "1", sequence }), false);
});

test("every published and derived exercise type has a renderer", async () => {
  const { buildLessonSequence } = await import("../client/js/lesson-engine/sequence-builder.mjs");
  const { renderExercise } = await import("../client/js/lesson-engine/exercise-renderers.mjs");
  const sequence = buildLessonSequence(bundle, lesson.id, { seed: "render", audioAvailable: true });
  const items = [...sequence, ...bundle.exercises.filter((item) => lesson.exerciseIds.includes(item.id) && !sequence.some((entry) => entry.id === item.id)).map((item) => ({ ...item, scored: true }))];
  const renderedTypes = new Set();
  for (const item of items) {
    const html = renderExercise(item, item.type === "match_pairs" || item.type.includes("ordering") || item.type === "story_sentence_reconstruction" ? [] : "", bundle);
    assert.equal(typeof html, "string");
    assert.ok(html.length > 20, `Expected renderer output for ${item.type}`);
    assert.equal(html.includes("[object Object]"), false, `Renderer leaked object coercion for ${item.type}`);
    renderedTypes.add(item.type);
  }
  const required = ["word_presentation", "word_to_meaning", "meaning_to_word", "match_pairs", "listen_and_select", "listen_and_type", "phrase_ordering", "sentence_ordering", "fill_in_the_blank", "natural_collocation_selection", "classifier_selection", "translation", "target_language_typing", "source_language_typing", "correct_pinyin", "dialogue_completion", "dialogue_ordering", "best_response", "dialogue_comprehension", "story_reading", "story_comprehension", "story_sentence_reconstruction", "unnatural_phrase_identification", "true_or_false"];
  assert.ok(required.every((type) => renderedTypes.has(type)), `Missing renderers: ${required.filter((type) => !renderedTypes.has(type)).join(", ")}`);
});
