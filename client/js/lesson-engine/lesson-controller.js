import { LessonAnalytics } from "./analytics.js";
import { evaluateAnswer } from "./answer-evaluator.mjs";
import { LessonAudioService } from "./audio-service.js";
import { displayAnswer, exerciseShell } from "./exercise-renderers.mjs";
import { buildLessonSequence } from "./sequence-builder.mjs";
import { createLessonSession, isRestorableSession, reduceLessonSession, sessionSummary } from "./session.mjs";
import { LocalStorageLessonSessionRepository } from "./session-repository.mjs";
import { escapeHtml, icon, ui } from "../ui.js";

function languageCode(value) { return typeof value === "string" ? value : value?.code; }
function sessionKey(bundle, lesson) { return `${languageCode(bundle.targetLanguage)}:${languageCode(bundle.sourceLanguage)}:${lesson.id}`; }
function parseAnswer(element) { try { return JSON.parse(decodeURIComponent(element.dataset.answer)); } catch (_error) { return element.dataset.answer || ""; } }

function introView(category, lesson, words, resumable) {
  return `<div class="ls-lesson-intro"><a href="/app/learn/${encodeURIComponent(category.slug)}" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>Back to ${escapeHtml(category.name)}</span></a><main><span class="ls-eyebrow">${escapeHtml(category.name)} · Lesson ${lesson.order}</span><h1 data-lesson-focus tabindex="-1">${escapeHtml(lesson.title)}</h1><p>Meet each word, then practise it through phrases, dialogue, and a short story.</p><div class="ls-lesson-intro__facts"><span>${icon("whole-word", "h-4 w-4")} ${words.length} target words</span><span>${icon("clock-3", "h-4 w-4")} About ${Math.max(5, words.length + 3)} minutes</span></div><div class="ls-lesson-intro__words">${words.map((word) => `<span lang="zh-Hant">${escapeHtml(word.traditional)}<small>${escapeHtml(word.englishMeaning)}</small></span>`).join("")}</div><button class="${ui.primary}" type="button" data-lesson-action="start">${icon(resumable ? "play" : "sparkles", "h-4 w-4")}<span>${resumable ? "Resume lesson" : "Start lesson"}</span></button></main></div>`;
}

function resultsView(category, lesson, session, outcome) {
  const summary = sessionSummary(session);
  const replay = Boolean(outcome?.replay);
  return `<div class="ls-lesson-results"><main><span class="ls-lesson-results__icon">${icon(summary.perfect ? "circle-check-big" : "refresh-cw", "h-9 w-9")}</span><span class="ls-eyebrow">${summary.perfect ? replay ? "Practice complete" : "Lesson complete" : replay ? "Practice finished" : "Attempt complete"}</span><h1 data-lesson-focus tabindex="-1">${summary.perfect ? "A perfect pass" : "Try the full lesson again"}</h1><p>${summary.perfect ? replay ? "Your best completion is preserved and this practice has been added to your history." : "Every scored answer was correct. The next lesson is now available." : replay ? "Your earlier completion is preserved. This practice attempt has been recorded without relocking anything." : "A perfect pass is required to unlock the next lesson. Your work and study time have been saved."}</p><dl><div><dt>Correct</dt><dd>${summary.correct} / ${summary.scored}</dd></div><div><dt>Study time</dt><dd>${Math.max(1, Math.round(summary.activeMs / 60000))} min</dd></div><div><dt>Attempt</dt><dd>${summary.attempt}</dd></div></dl>${summary.perfect ? `<a class="${ui.primary}" href="/app/learn/${encodeURIComponent(category.slug)}" data-app-link>Continue category</a>` : `<button class="${ui.primary}" type="button" data-lesson-action="retry">Retry full lesson</button>`}<p class="ls-engine-note">Completion requires every scored answer to be correct in one full pass.</p></main></div>`;
}

export class LessonController {
  constructor({ root, bundle, lessonId, navigate, repository = new LocalStorageLessonSessionRepository(), audio = new LessonAudioService(), analytics = new LessonAnalytics(), progress = null, attemptContext = null, displayPreferences = () => ({}) }) {
    this.root = root; this.bundle = bundle; this.lesson = bundle.lessons.find((item) => item.id === lessonId); this.category = bundle.categories[0]; this.navigate = navigate;
    if (!this.lesson || this.lesson.categoryId !== this.category.id) throw new Error("This lesson does not belong to the requested category.");
    this.repository = repository; this.audio = audio; this.analytics = analytics; this.progress = progress; this.displayPreferences = displayPreferences; this.key = sessionKey(bundle, this.lesson); this.exitConfirm = false; this.matchDraft = {}; this.outcome = null; this.completing = false;
    const stored = attemptContext ? attemptContext.session : repository.load(this.key);
    const attempt = Number(attemptContext?.attempt?.attemptNumber || stored?.attempt || 1);
    this.sequence = buildLessonSequence(bundle, lessonId, { seed: `${lessonId}:attempt:${attempt}`, audioAvailable: audio.canSpeak || bundle.words.some((word) => word.audioUrl) });
    this.session = isRestorableSession(stored, { lessonId, curriculumVersion: bundle.curriculumVersion, sequence: this.sequence }) ? stored : createLessonSession({ lessonId, categorySlug: this.category.slug, curriculumVersion: bundle.curriculumVersion, sequence: this.sequence, attemptId: attemptContext?.attempt?.id, sessionId: attemptContext?.attempt?.sessionId, attempt });
    this.boundClick = (event) => this.onClick(event); this.boundInput = (event) => this.onInput(event); this.boundKey = (event) => this.onKey(event); this.boundVisibility = () => this.onVisibility(); this.boundProgressReset = () => this.onProgressReset();
  }
  mount() { this.root.addEventListener("click", this.boundClick); this.root.addEventListener("input", this.boundInput); document.addEventListener("keydown", this.boundKey); document.addEventListener("visibilitychange", this.boundVisibility); globalThis.addEventListener?.("linguastories-progress-reset", this.boundProgressReset); this.render(); }
  destroy() { this.audio.stop(); this.root.removeEventListener("click", this.boundClick); this.root.removeEventListener("input", this.boundInput); document.removeEventListener("keydown", this.boundKey); document.removeEventListener("visibilitychange", this.boundVisibility); globalThis.removeEventListener?.("linguastories-progress-reset", this.boundProgressReset); }
  persist() { this.repository.save(this.key, this.session); }
  dispatch(action) { this.session = reduceLessonSession(this.session, action); this.persist(); }
  current() { return this.sequence[this.session.cursor]; }
  render() {
    if (["intro", "paused"].includes(this.session.status) && !this.exitConfirm) this.root.innerHTML = introView(this.category, this.lesson, this.lesson.wordIds.map((id) => this.bundle.words.find((word) => word.id === id)).filter(Boolean), this.session.status === "paused" || this.session.cursor > 0);
    else if (this.session.status === "results") this.root.innerHTML = resultsView(this.category, this.lesson, this.session, this.outcome);
    else this.root.innerHTML = exerciseShell({ item: this.current(), session: this.session, bundle: this.bundle, exitConfirm: this.exitConfirm, display: this.displayPreferences() });
    requestAnimationFrame(() => this.root.querySelector("[data-lesson-focus]")?.focus({ preventScroll: true }));
  }
  setAnswer(answer) { this.dispatch({ type: "SET_ANSWER", answer }); this.render(); }
  onInput(event) {
    if (!event.target.matches("[data-lesson-input]")) return;
    this.dispatch({ type: "SET_ANSWER", answer: event.target.value });
    const submit = this.root.querySelector("[data-lesson-action=submit]");
    if (submit) submit.disabled = !String(event.target.value).trim();
  }
  async onClick(event) {
    const control = event.target.closest("[data-lesson-action]"); if (!control) return;
    event.preventDefault(); const action = control.dataset.lessonAction; const item = this.current();
    if (action === "start") { const resuming = this.session.status === "paused"; this.dispatch({ type: resuming ? "RESUME" : "START" }); if (resuming) await this.progress?.resumeAttempt(this.session.attemptId); this.analytics.emit("lesson_started", { lessonId: this.lesson.id, attempt: this.session.attempt }); const current = this.current(); if (!resuming && this.audio.preferences?.().autoplayIntroductions && current?.type === "word_presentation") this.audio.play({ audioUrl: current.audioUrl, text: current.word?.traditional || current.correctAnswer }); }
    if (action === "choose") this.setAnswer(parseAnswer(control));
    if (action === "addToken") this.setAnswer([...(this.session.answers[item.id] || []), parseAnswer(control)]);
    if (action === "removeToken") { const answer = [...(this.session.answers[item.id] || [])]; answer.splice(Number(control.dataset.index), 1); this.setAnswer(answer); }
    if (action === "matchLeft" || action === "matchRight") { this.matchDraft[action === "matchLeft" ? "left" : "right"] = parseAnswer(control); if (this.matchDraft.left && this.matchDraft.right) { this.setAnswer([...(this.session.answers[item.id] || []), [this.matchDraft.left, this.matchDraft.right]]); this.matchDraft = {}; } }
    if (action === "playAudio") this.audio.play({ audioUrl: item.audioUrl, text: control.dataset.audioText || item.correctAnswer });
    if (action === "submit") { const result = evaluateAnswer(item, displayAnswer(item, this.session.answers[item.id])); this.dispatch({ type: "SUBMIT", result }); this.analytics.emit("exercise_submitted", { lessonId: this.lesson.id, exerciseId: item.id, correct: result.correct }); }
    if (action === "continue") {
      this.dispatch({ type: "CONTINUE" });
      if (this.session.status === "results" && !this.completing) { this.completing = true; control.disabled = true; try { this.outcome = await this.progress?.completeLesson(this.bundle, this.lesson, this.session, this.sequence); this.analytics.emit("lesson_completed", { lessonId: this.lesson.id, ...sessionSummary(this.session) }); } finally { this.completing = false; } }
    }
    if (action === "exit") { this.dispatch({ type: "PAUSE" }); this.exitConfirm = true; }
    if (action === "cancelExit") { this.dispatch({ type: "RESUME" }); this.exitConfirm = false; }
    if (action === "confirmExit") { await this.progress?.pauseAttempt(this.session.attemptId); this.analytics.emit("lesson_paused", { lessonId: this.lesson.id, cursor: this.session.cursor }); this.navigate(`/app/learn/${encodeURIComponent(this.category.slug)}`); return; }
    if (action === "retry") { const prepared = await this.progress?.prepareLesson(this.bundle, this.lesson, null, { replay: Boolean(this.outcome?.replay) }); const attempt = prepared?.attempt?.attemptNumber || this.session.attempt + 1; this.sequence = buildLessonSequence(this.bundle, this.lesson.id, { seed: `${this.lesson.id}:attempt:${attempt}`, audioAvailable: this.audio.canSpeak }); this.session = createLessonSession({ lessonId: this.lesson.id, categorySlug: this.category.slug, curriculumVersion: this.bundle.curriculumVersion, sequence: this.sequence, attemptId: prepared?.attempt?.id, sessionId: prepared?.attempt?.sessionId, attempt }); this.outcome = null; this.persist(); }
    this.render();
  }
  onKey(event) {
    if (!this.root.isConnected || event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^[1-9]$/.test(event.key) && this.session.status === "active") { const options = this.root.querySelectorAll("[data-lesson-action=choose]"); options[Number(event.key) - 1]?.click(); }
    if (event.key === "Enter" && !event.shiftKey && !event.target.matches("button, [data-lesson-input]") ) this.root.querySelector(this.session.status === "feedback" ? "[data-lesson-action=continue]" : "[data-lesson-action=submit]:not(:disabled)")?.click();
    if (event.key === "Escape" && ["active", "feedback"].includes(this.session.status)) this.root.querySelector("[data-lesson-action=exit]")?.click();
  }
  onVisibility() { if (document.hidden && ["active", "feedback"].includes(this.session.status)) { this.dispatch({ type: "PAUSE" }); void this.progress?.pauseAttempt(this.session.attemptId); this.render(); } }
  onProgressReset() { void this.repository.remove(this.key); this.navigate(`/app/learn/${encodeURIComponent(this.category.slug)}`); }
}
