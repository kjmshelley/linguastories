import { escapeHtml, icon, ui } from "../ui.js";

const CHOICE_TYPES = new Set([
  "word_to_meaning", "meaning_to_word", "listen_and_select", "fill_in_the_blank", "natural_collocation_selection",
  "classifier_selection", "dialogue_completion", "dialogue_comprehension", "story_comprehension", "true_or_false",
  "best_response", "correct_pinyin", "unnatural_phrase_identification"
]);
const ORDER_TYPES = new Set(["phrase_ordering", "sentence_ordering", "dialogue_ordering", "story_sentence_reconstruction"]);
const TYPE_TYPES = new Set(["listen_and_type", "translation", "target_language_typing", "source_language_typing"]);
const STAGE_LABELS = { word: "Words", collocation: "Collocations", phrase: "Phrases", sentence: "Sentences", dialogue: "Dialogue", story: "Story" };

function valueKey(value) { return encodeURIComponent(JSON.stringify(value)); }
function choiceLabel(value) { return Array.isArray(value) ? value.join(" → ") : String(value); }

function choiceRenderer(item, answer) {
  const options = item.options || [item.correctAnswer, ...(item.distractors || [])];
  return `<div class="ls-engine-choices" role="radiogroup" aria-label="Answer choices">${options.map((option, index) => {
    const selected = JSON.stringify(answer) === JSON.stringify(option);
    return `<button type="button" role="radio" aria-checked="${selected}" class="${selected ? "is-selected" : ""}" data-lesson-action="choose" data-answer="${valueKey(option)}"><kbd>${index + 1}</kbd><span>${escapeHtml(choiceLabel(option))}</span></button>`;
  }).join("")}</div>`;
}

function tokensFor(item) {
  if (Array.isArray(item.correctAnswer)) return item.options?.flat?.().filter((value) => typeof value === "string") || item.correctAnswer;
  const text = String(item.correctAnswer || "");
  if (/\s/.test(text.trim())) return text.trim().split(/\s+/);
  return Array.from(text.replace(/[。！？!?]/g, ""));
}

function orderRenderer(item, answer = []) {
  const chosen = Array.isArray(answer) ? answer : [];
  const source = item.orderTokens || tokensFor(item);
  const remaining = [...source];
  chosen.forEach((token) => { const index = remaining.indexOf(token); if (index >= 0) remaining.splice(index, 1); });
  return `<div class="ls-engine-order">
    <div class="ls-engine-order__answer" aria-label="Your answer">${chosen.length ? chosen.map((token, index) => `<button type="button" data-lesson-action="removeToken" data-index="${index}">${escapeHtml(token)}</button>`).join("") : `<span>Choose tokens below</span>`}</div>
    <div class="ls-engine-wordbank" aria-label="Available tokens">${remaining.map((token) => `<button type="button" data-lesson-action="addToken" data-answer="${valueKey(token)}">${escapeHtml(token)}</button>`).join("")}</div>
  </div>`;
}

function matchRenderer(item, answer = []) {
  const pairs = Array.isArray(item.correctAnswer) ? item.correctAnswer : [];
  const left = pairs.map((pair) => pair[0]);
  const right = item.matchRight || pairs.map((pair) => pair[1]).reverse();
  const matchedLeft = new Set(answer.map((pair) => pair[0]));
  const matchedRight = new Set(answer.map((pair) => pair[1]));
  return `<div class="ls-engine-match">
    <div>${left.map((value) => `<button type="button" ${matchedLeft.has(value) ? "disabled" : ""} data-lesson-action="matchLeft" data-answer="${valueKey(value)}">${escapeHtml(value)}</button>`).join("")}</div>
    <div>${right.map((value) => `<button type="button" ${matchedRight.has(value) ? "disabled" : ""} data-lesson-action="matchRight" data-answer="${valueKey(value)}">${escapeHtml(value)}</button>`).join("")}</div>
  </div><p class="ls-engine-match__status">${answer.length} of ${pairs.length} pairs connected</p>`;
}

function typeRenderer(item, answer = "") {
  const target = item.type === "source_language_typing" ? "English" : "Traditional Chinese";
  return `<label class="ls-engine-type"><span>Your answer · ${target}</span><input type="text" value="${escapeHtml(answer)}" autocomplete="off" autocapitalize="off" spellcheck="false" data-lesson-input autofocus /></label>`;
}

function wordPresentation(item, display = {}) {
  const word = item.word || {};
  const example = item.example || {};
  const exampleTarget = example.traditional || example.target || example.text || "";
  const exampleSource = example.english || example.translation || "";
  return `<div class="ls-engine-word">
    <button class="ls-audio-button" type="button" data-lesson-action="playAudio" data-audio-text="${escapeHtml(word.traditional)}" aria-label="Play ${escapeHtml(word.traditional)}">${icon("volume-2", "h-5 w-5")}</button>
    <h2 lang="zh-Hant">${escapeHtml(word.traditional)}</h2>${display.pinyinMode === "hidden" || display.pinyinMode === "on_request" ? "" : `<p class="ls-pronunciation">${escapeHtml(word.pinyin || "")}</p>`}
    ${display.translationMode === "on_request" ? "" : `<p class="ls-engine-word__meaning">${escapeHtml(word.englishMeaning || word.meanings?.[0] || "")}</p>`}
    ${word.usageNote ? `<p class="ls-engine-note">${escapeHtml(word.usageNote)}</p>` : ""}
    ${exampleTarget ? `<div class="ls-engine-example"><small>In context</small><p lang="zh-Hant">${escapeHtml(exampleTarget)}</p>${exampleSource ? `<span>${escapeHtml(exampleSource)}</span>` : ""}</div>` : ""}
  </div>`;
}

function storyReading(item, display = {}) {
  const story = item.story || {};
  const title = story.title?.traditional || story.title?.english || story.title || "Story";
  const titleTranslation = story.title?.traditional && story.title?.english ? story.title.english : "";
  const mode = display.storyDisplay || "all"; const showPinyin = ["chinese_pinyin", "all"].includes(mode); const showEnglish = ["chinese_english", "all"].includes(mode) && display.translationMode !== "hidden_story";
  return `<article class="ls-engine-story"><div class="ls-engine-story__heading"><div><span>Short story</span><h2 lang="zh-Hant">${escapeHtml(title)}</h2>${titleTranslation && showEnglish ? `<small>${escapeHtml(titleTranslation)}</small>` : ""}</div><button class="ls-audio-button" type="button" data-lesson-action="playAudio" data-audio-text="${escapeHtml((story.lines || []).map((line) => line.traditional || line.text || line).join(" "))}">${icon("volume-2", "h-5 w-5")}<span>Listen</span></button></div>
    ${(story.lines || []).map((line) => `<p lang="zh-Hant">${escapeHtml(line.traditional || line.text || line)}</p>${showPinyin && line.pinyin ? `<span class="ls-pronunciation">${escapeHtml(line.pinyin)}</span>` : ""}${showEnglish && line.english ? `<small>${escapeHtml(line.english)}</small>` : ""}`).join("")}</article>`;
}

function dialogueContext(item, bundle) {
  if (!item.stage || item.stage !== "dialogue") return "";
  const dialogueId = (item.targetContentReferences || []).find((id) => String(id).startsWith("dialogue-"));
  const dialogue = bundle.dialogues?.find((entry) => entry.id === dialogueId);
  if (!dialogue) return "";
  return `<div class="ls-engine-dialogue" aria-label="Dialogue context">${dialogue.turns.map((turn) => `<div><strong>${escapeHtml(turn.speaker || "")}</strong><p lang="zh-Hant">${escapeHtml(turn.traditional || turn.text || "")}</p>${turn.english ? `<small>${escapeHtml(turn.english)}</small>` : ""}</div>`).join("")}</div>`;
}

export function renderExercise(item, answer, bundle, display = {}) {
  if (item.type === "word_presentation") return wordPresentation(item, display);
  if (item.type === "story_reading") return storyReading(item, display);
  const audio = item.type.startsWith("listen_") ? `<button class="ls-engine-listen" type="button" data-lesson-action="playAudio" data-audio-text="${escapeHtml(item.correctAnswer)}">${icon("volume-2", "h-6 w-6")}<span>Play audio</span></button>` : "";
  if (item.type === "match_pairs") return `${dialogueContext(item, bundle)}${audio}${matchRenderer(item, answer)}`;
  if (ORDER_TYPES.has(item.type)) return `${dialogueContext(item, bundle)}${orderRenderer(item, answer)}`;
  if (TYPE_TYPES.has(item.type)) return `${dialogueContext(item, bundle)}${audio}${typeRenderer(item, answer)}`;
  if (CHOICE_TYPES.has(item.type)) return `${dialogueContext(item, bundle)}${audio}${choiceRenderer(item, answer)}`;
  return typeRenderer(item, answer);
}

export function isAnswerReady(item, answer) {
  if (!item.scored) return true;
  if (item.type === "match_pairs") return Array.isArray(answer) && answer.length === item.correctAnswer.length;
  if (ORDER_TYPES.has(item.type)) return Array.isArray(answer) && answer.length > 0;
  return String(answer ?? "").trim().length > 0;
}

export function displayAnswer(item, answer) {
  if (item.type === "match_pairs") return answer;
  if (ORDER_TYPES.has(item.type) && !Array.isArray(item.correctAnswer)) return (answer || []).join("");
  return answer;
}

export function exerciseShell({ item, session, bundle, exitConfirm = false, display = {} }) {
  const answer = session.answers[item.id];
  const result = session.results[item.id];
  const progress = Math.round(((session.cursor + (session.status === "feedback" ? 1 : 0)) / session.sequenceIds.length) * 100);
  return `<div class="ls-lesson-shell">
    <header class="ls-lesson-header"><button type="button" data-lesson-action="exit" aria-label="Exit lesson">${icon("x", "h-5 w-5")}</button><div class="ls-lesson-progress"><div role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="--ls-progress-value:${progress}%"></span></div><small>${session.cursor + 1} of ${session.sequenceIds.length}</small></div><span>${escapeHtml(STAGE_LABELS[item.stage] || "Lesson")}</span></header>
    <main class="ls-lesson-main"><section class="ls-lesson-card" aria-labelledby="lesson-exercise-title"><div class="ls-exercise-prompt"><span>${escapeHtml(STAGE_LABELS[item.stage] || item.stage)}</span><h1 id="lesson-exercise-title" data-lesson-focus tabindex="-1">${escapeHtml(item.prompt)}</h1>${item.audioUnavailable ? `<p class="ls-engine-note">Audio is unavailable, so this item uses an equivalent practice format.</p>` : ""}</div>${renderExercise(item, answer, bundle, display)}</section></main>
    <footer class="ls-lesson-footer ${result ? result.correct ? "is-correct" : "is-incorrect" : ""}">${result ? `<div class="ls-feedback" role="status" aria-live="polite"><span>${icon(result.correct ? "circle-check" : "circle-x", "h-6 w-6")}</span><div><strong>${result.correct ? "Correct" : "Keep going"}</strong><p>${escapeHtml(result.feedback)}</p>${!result.correct ? `<small>Answer: ${escapeHtml(choiceLabel(result.expectedAnswer))}</small>` : ""}</div></div><button class="${ui.primary}" type="button" data-lesson-action="continue">Continue</button>` : `<span>${item.scored ? "Choose or enter your answer" : "Take a moment with this example"}</span><button class="${ui.primary}" type="button" data-lesson-action="submit" ${isAnswerReady(item, answer) ? "" : "disabled"}>${item.scored ? "Check answer" : "Continue"}</button>`}</footer>
    ${exitConfirm ? `<div class="ls-exit-layer" role="dialog" aria-modal="true" aria-labelledby="exit-title"><div><span>${icon("pause", "h-6 w-6")}</span><h2 id="exit-title">Pause this lesson?</h2><p>Your place and answers will be saved on this device.</p><button class="${ui.primary}" type="button" data-lesson-action="confirmExit">Save and exit</button><button class="${ui.secondary}" type="button" data-lesson-action="cancelExit">Keep learning</button></div></div>` : ""}
  </div>`;
}
