import { escapeHtml, icon, ui } from "../ui.js";
import { categoryById, lessonById, lessonPreviewSteps, mockCategories, mockLanguages, mockLessons } from "../learning/mock-data.mjs";
import { initialLearningUiState, reduceLearningUiState } from "../learning/state.mjs";
import { cachedCategory, clearCurriculumCache, loadCategory, primeCategoryCache } from "../lesson-engine/curriculum-repository.js";
import { LessonController } from "../lesson-engine/lesson-controller.js";
import { LessonAudioService } from "../lesson-engine/audio-service.js";
import { ReviewController } from "../review/review-controller.js";
import {
  appShell,
  categoryCard,
  confirmationModal,
  downloadStatus,
  emptyState,
  errorState,
  languageCard,
  lessonCard,
  placeholderIllustration,
  progressIndicator,
  statusBadge,
  typedConfirmationModal
} from "../learning/components.js";

export const learningRouteIds = new Set(["languageSelection", "learn", "categoryDetail", "lessonPreview", "lessonEngine", "review", "progress", "categoryProgress", "storyReader", "settings", "curriculumInfo"]);

export function learningRouteFromPath(pathname = window.location.pathname) {
  const path = String(pathname).replace(/\/$/, "") || "/";
  if (path === "/app/languages") return { id: "languageSelection" };
  if (path === "/app/learn") return { id: "learn" };
  const engineMatch = path.match(/^\/app\/learn\/([^/]+)\/([^/]+)$/);
  if (engineMatch) return { id: "lessonEngine", categorySlug: decodeURIComponent(engineMatch[1]), lessonId: decodeURIComponent(engineMatch[2]) };
  const categoryMatch = path.match(/^\/app\/learn\/([^/]+)$/);
  if (categoryMatch) return { id: "categoryDetail", categoryId: decodeURIComponent(categoryMatch[1]) };
  const lessonMatch = path.match(/^\/app\/lesson\/([^/]+)$/);
  if (lessonMatch) return { id: "lessonPreview", lessonId: decodeURIComponent(lessonMatch[1]) };
  if (path === "/app/review") return { id: "review" };
  if (path === "/app/progress") return { id: "progress" };
  const progressCategoryMatch = path.match(/^\/app\/progress\/category\/([^/]+)$/);
  if (progressCategoryMatch) return { id: "categoryProgress", categorySlug: decodeURIComponent(progressCategoryMatch[1]) };
  const storyMatch = path.match(/^\/app\/story\/([^/]+)$/);
  if (storyMatch) return { id: "storyReader", storyId: decodeURIComponent(storyMatch[1]) };
  if (path === "/app/settings") return { id: "settings" };
  if (path === "/app/settings/curriculum") return { id: "curriculumInfo" };
  return null;
}

export function learningPath(id, params = {}) {
  if (id === "languageSelection") return "/app/languages";
  if (id === "categoryDetail") return `/app/learn/${encodeURIComponent(params.categoryId || "introduction")}`;
  if (id === "lessonPreview") return `/app/lesson/${encodeURIComponent(params.lessonId || "introduction-1")}`;
  if (id === "lessonEngine") return `/app/learn/${encodeURIComponent(params.categorySlug || "travel")}/${encodeURIComponent(params.lessonId || "")}`;
  return `/app/${id}`;
}

function pageHeading({ eyebrow, title, body, action = "" }) {
  return `
    <header class="ls-page-heading">
      <div>
        <span>${escapeHtml(eyebrow)}</span>
        <h1 data-learning-page-title tabindex="-1">${escapeHtml(title)}</h1>
        <p>${escapeHtml(body)}</p>
      </div>
      ${action}
    </header>
  `;
}

function reviewBadge(learningState) { return learningState.settingsState?.pair?.reviewReminders === false ? 0 : Number(learningState.reviewState?.dashboard?.dueCount || 0); }

function selectionView({ learningState }) {
  const manifestBytes = Number(learningState.language?.categoryBytes || learningState.language?.bytes || 0);
  const language = { ...mockLanguages[0], downloadSize: manifestBytes ? `${(manifestBytes / 1024 / 1024).toFixed(1)} MB` : mockLanguages[0].downloadSize };
  return `
    <div class="ls-language-selection" id="learningMain">
      <div class="ls-selection-topbar">
        <a href="/" data-link aria-label="LinguaStories home"><img src="/assets/img/linguastories-logo.png" alt="LinguaStories" /></a>
        <span>Offline courses</span>
      </div>
      <section class="ls-selection-content" aria-labelledby="language-selection-title">
        <div class="ls-selection-intro">
          <span class="ls-eyebrow">Start learning</span>
          <h1 id="language-selection-title" data-learning-page-title tabindex="-1">Choose your language</h1>
          <p>Select a course to keep on this device. LinguaStories will support more languages through the same experience later.</p>
        </div>
        ${languageCard(language, learningState)}
        <p class="ls-selection-note">${icon("shield-check", "h-4 w-4")} Course files and lesson sessions stay privately in this browser and remain available offline.</p>
      </section>
    </div>
  `;
}

function learnView({ user, learningState, offline }) {
  const progressState = learningState.progressState;
  const reviewDashboard = learningState.reviewState?.dashboard || {};
  const records = progressState?.snapshot?.progressRecords || [];
  const categories = (learningState.language?.categories || []).map((category, index) => {
    const state = progressState?.snapshot?.categoryStates?.states?.get(category.id) || { accessStatus: index ? "locked" : "available", completionStatus: "not_started" };
    const record = records.find((item) => item.entityType === "category" && item.entityId === category.id);
    return { ...category, id: category.slug, contentId: category.id, icon: "map", accent: ["blue", "coral", "mint", "gold"][index % 4], progress: record?.completionPercentage || 0, status: ["review_due", "weak"].includes(record?.reviewStatus) ? "review_due" : state.completionStatus === "completed" ? "completed" : state.accessStatus === "locked" ? "locked" : record ? "in_progress" : "available" };
  });
  const target = progressState?.continueTarget;
  const current = categories.find((category) => category.id === target?.categorySlug) || categories.find((category) => category.status === "in_progress") || categories.find((category) => category.status === "available") || categories[0];
  const targetHref = target?.type === "lesson" ? `/app/learn/${encodeURIComponent(target.categorySlug)}/${encodeURIComponent(target.lessonId)}` : current ? `/app/learn/${encodeURIComponent(current.id)}` : "/app/progress";
  if (!categories.length) return appShell({ active: "learn", title: "Learn", user, offline, wide: true, body: emptyState({ title: "Course path unavailable", body: "Reconnect once to refresh the curriculum manifest. Your downloaded lessons remain on this device." }) });
  const body = `
    ${pageHeading({
      eyebrow: "Your learning journey",
      title: `Good to see you, ${user.displayName || "Learner"}`,
      body: "Move through practical Traditional Chinese in a clear sequence. Each category builds on the one before it."
    })}
    <section class="ls-continue-card" aria-labelledby="continue-title">
      <div class="ls-continue-card__copy">
        ${statusBadge("in_progress")}
        <p>Continue where you left off</p>
        <h2 id="continue-title">${escapeHtml(current.name)}</h2>
        <p>${escapeHtml(current.description)}</p>
        <div class="ls-continue-card__action-row">
          <a class="${ui.primary}" href="${targetHref}" data-app-link>${icon("play", "h-4 w-4")}<span>${target?.reason === "resumable" ? "Resume lesson" : target?.reason === "failed" ? "Retry lesson" : "Continue learning"}</span></a>
          <span>${target?.reason === "resumable" ? "Your saved place is ready" : "Next step · about 5 min"}</span>
        </div>
      </div>
      <div class="ls-continue-card__visual">
        ${placeholderIllustration({ iconName: current.icon, accent: current.accent, label: `${current.name} category illustration`, index: current.order })}
        ${progressIndicator(current.progress, "Current category")}
      </div>
    </section>
    ${reviewDashboard.dueCount ? `<aside class="ls-review-callout"><span>${icon("rotate-ccw", "h-5 w-5")}</span><div><strong>${reviewDashboard.dueCount} reviews due</strong><small>${reviewDashboard.weakCount || 0} weak · about ${reviewDashboard.estimatedMinutes || 1} min</small></div><a class="${ui.secondary}" href="/app/review" data-app-link>Review now</a></aside>` : ""}
    <section class="ls-journey" aria-labelledby="journey-title">
      <div class="ls-section-heading">
        <div><span>Course path</span><h2 id="journey-title">Everyday foundations</h2></div>
        <p>${categories.length} categories · ${categories.reduce((sum, item) => sum + Number(item.wordCount || 0), 0)} words</p>
      </div>
      <div class="ls-journey__list">${categories.map(categoryCard).join("")}</div>
    </section>
  `;
  return appShell({ active: "learn", title: "Learn", user, body, offline, wide: true, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

function categoryDetailView({ user, learningState, offline, categoryId }) {
  const generated = cachedCategory(categoryId);
  if (generated) return generatedCategoryDetailView({ user, offline, bundle: generated, learningState });
  const baseCategory = categoryById(categoryId);
  const category = { ...baseCategory, status: learningState.categoryStatusById?.[baseCategory.id] || baseCategory.status };
  const lessons = (mockLessons[category.id] || []).map((lesson) => ({ ...lesson, status: learningState.lessonStatusById?.[lesson.id] || lesson.status }));
  const body = `
    <a class="ls-back-link" href="/app/learn" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>Back to Learn</span></a>
    <section class="ls-category-hero" aria-labelledby="category-title">
      <div>
        ${statusBadge(category.status)}
        <p>Category ${category.order}</p>
        <h1 id="category-title" data-learning-page-title tabindex="-1">${escapeHtml(category.name)}</h1>
        <p>${escapeHtml(category.description)}</p>
        <div class="ls-category-hero__meta">
          <span>${icon("whole-word", "h-4 w-4")} ${category.wordCount} words</span>
          <span>${icon("layers-3", "h-4 w-4")} ${category.lessonCount} lessons</span>
        </div>
        ${progressIndicator(category.progress, `${category.name} progress`)}
      </div>
      ${placeholderIllustration({ iconName: category.icon, accent: category.accent, label: `${category.name} illustration`, index: category.order })}
    </section>
    <section class="ls-lessons" aria-labelledby="lessons-title">
      <div class="ls-section-heading">
        <div><span>Category lessons</span><h2 id="lessons-title">Learn in small, focused steps</h2></div>
        <p>Four or five new words at a time</p>
      </div>
      <div class="ls-lessons__list">
        ${lessons.length ? lessons.map((lesson) => lessonCard(lesson, category.id)).join("") : emptyState({ title: "Lessons are being prepared", body: "This preview category does not have lesson cards yet." })}
      </div>
    </section>
  `;
  return appShell({ active: "learn", title: category.name, user, body, offline, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

function generatedCategoryDetailView({ user, offline, bundle, learningState }) {
  const category = bundle.categories[0];
  const progressSnapshot = learningState?.progressState?.categorySnapshots?.get(category.slug);
  const categoryRecord = progressSnapshot?.categoryProgress;
  const categoryState = learningState?.progressState?.snapshot?.categoryStates?.states?.get(category.id);
  const words = new Map(bundle.words.map((word) => [word.id, word]));
  const lessons = bundle.lessons.map((lesson) => ({
    id: lesson.id,
    number: lesson.order,
    title: lesson.title,
    words: lesson.wordIds.map((id) => words.get(id)?.traditional).filter(Boolean),
    progress: progressSnapshot?.records?.find((item) => item.entityType === "lesson" && item.entityId === lesson.id)?.completionPercentage || 0,
    minutes: Math.max(5, lesson.wordIds.length + 3),
    status: categoryState?.accessStatus === "locked" ? "locked" : progressSnapshot?.lessonStates?.states?.get(lesson.id)?.completionStatus === "completed" ? "completed" : progressSnapshot?.lessonStates?.states?.get(lesson.id)?.accessStatus || "locked"
  }));
  const status = categoryRecord?.historicallyCompleted ? "completed" : categoryState?.accessStatus === "locked" ? "locked" : categoryRecord ? "in_progress" : "available";
  const body = `<a class="ls-back-link" href="/app/learn" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>Back to Learn</span></a>
    <section class="ls-category-hero" aria-labelledby="category-title"><div>${statusBadge(status)}<p>Category ${category.order}</p><h1 id="category-title" data-learning-page-title tabindex="-1">${escapeHtml(category.name)}</h1><p>${escapeHtml(category.description)}</p><div class="ls-category-hero__meta"><span>${icon("whole-word", "h-4 w-4")} ${category.wordCount} words</span><span>${icon("layers-3", "h-4 w-4")} ${lessons.length} lessons</span></div>${progressIndicator(categoryRecord?.completionPercentage || 0, `${category.name} progress`)}</div>${placeholderIllustration({ iconName: "map", accent: "blue", label: `${category.name} illustration`, index: category.order })}</section>
    <section class="ls-lessons" aria-labelledby="lessons-title"><div class="ls-section-heading"><div><span>Generated curriculum</span><h2 id="lessons-title">Learn in small, focused steps</h2></div><p>Four or five new words at a time</p></div><div class="ls-lessons__list">${lessons.map((lesson) => lessonCard(lesson, category.slug)).join("")}</div></section>`;
  return appShell({ active: "learn", title: category.name, user, body, offline, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

const routeLoadErrors = new Map();

function lessonEngineView({ route, learningState }) {
  const routeError = routeLoadErrors.get(`${route.categorySlug}:${route.lessonId}`);
  if (routeError) return errorState({ title: "Saved lesson needs a restart", body: routeError, action: `<a class="${ui.secondary}" href="/app/learn/${encodeURIComponent(route.categorySlug)}" data-app-link>Return to category</a>` });
  const bundle = cachedCategory(route.categorySlug);
  if (!bundle) return `<div class="ls-engine-loading" role="status"><span>${icon("loader-circle", "h-6 w-6")}</span><h1 data-learning-page-title tabindex="-1">Preparing your lesson</h1><p>Loading only this category’s curriculum…</p></div>`;
  const lesson = bundle.lessons.find((item) => item.id === route.lessonId);
  if (!lesson) return errorState({ title: "Lesson not found", body: "This stable lesson ID does not belong to the selected category.", action: `<a class="${ui.secondary}" href="/app/learn/${encodeURIComponent(route.categorySlug)}" data-app-link>Return to category</a>` });
  const lessonState = learningState.progressState?.categorySnapshots?.get(route.categorySlug)?.lessonStates?.states?.get(lesson.id);
  if (!lessonState) return `<div class="ls-engine-loading" role="status"><span>${icon("loader-circle", "h-6 w-6")}</span><h1 data-learning-page-title tabindex="-1">Checking your progress</h1><p>Confirming this lesson’s prerequisites…</p></div>`;
  if (lessonState.accessStatus === "locked") return `<div class="ls-engine-loading"><span>${icon("lock-keyhole", "h-6 w-6")}</span><h1 data-learning-page-title tabindex="-1">Lesson locked</h1><p>Complete the previous lesson with a perfect pass to unlock this one.</p><a class="${ui.secondary}" href="/app/learn/${encodeURIComponent(route.categorySlug)}" data-app-link>Return to category</a></div>`;
  return `<div id="lessonEngineRoot" class="ls-engine-root"></div>`;
}

function previewPanel(step) {
  if (step === "choice") {
    return `
      <div class="ls-exercise-prompt"><span>Choose the best meaning</span><h2 lang="zh-Hant">名字</h2><p>Tap the answer that matches the word.</p></div>
      <div class="ls-choice-grid" aria-label="Multiple choice preview">
        <button type="button">Country</button><button type="button" class="is-selected">Name</button><button type="button">City</button><button type="button">Friend</button>
      </div>
    `;
  }
  if (step === "match") {
    return `
      <div class="ls-exercise-prompt"><span>Match the pairs</span><h2>Connect each word</h2><p>This is a visual preview; matching is not active yet.</p></div>
      <div class="ls-match-grid"><span lang="zh-Hant">名字</span><span>Name</span><span lang="zh-Hant">城市</span><span>City</span><span lang="zh-Hant">朋友</span><span>Friend</span></div>
    `;
  }
  if (step === "order") {
    return `
      <div class="ls-exercise-prompt"><span>Build the sentence</span><h2>Arrange the words</h2><p>“My name is Lin.”</p></div>
      <div class="ls-order-answer" aria-label="Sentence ordering preview"><span lang="zh-Hant">我</span><span lang="zh-Hant">叫</span><span lang="zh-Hant">林</span></div>
      <div class="ls-word-bank"><button type="button" lang="zh-Hant">林</button><button type="button" lang="zh-Hant">叫</button><button type="button" lang="zh-Hant">我</button></div>
    `;
  }
  if (step === "dialogue") {
    return `
      <div class="ls-exercise-prompt"><span>Dialogue</span><h2>A first meeting</h2><p>Follow a short exchange, one turn at a time.</p></div>
      <div class="ls-dialogue-preview">
        <div><b>A</b><p lang="zh-Hant">你好！你叫什麼名字？</p><button aria-label="Play speaker A preview">${icon("volume-2", "h-4 w-4")}</button></div>
        <div class="is-current"><b>B</b><p lang="zh-Hant">我叫安娜。你呢？</p><button aria-label="Play speaker B preview">${icon("volume-2", "h-4 w-4")}</button></div>
      </div>
    `;
  }
  if (step === "story") {
    return `
      <div class="ls-exercise-prompt"><span>Story</span><h2>New neighbors</h2><p>Read a short scene with optional listening support.</p></div>
      <article class="ls-story-preview" lang="zh-Hant"><button aria-label="Play story preview">${icon("play", "h-4 w-4")}<span>Listen</span></button><p>你好，我叫小美。我來自台南，現在住在台北。今天我認識了新朋友。</p></article>
    `;
  }
  return `
    <div class="ls-exercise-prompt"><span>New word</span><h2 lang="zh-Hant">來自</h2><p class="ls-pronunciation">lái zì</p><p>to come from · to be from</p></div>
    <div class="ls-word-presentation">
      <button type="button" aria-label="Play pronunciation preview">${icon("volume-2", "h-5 w-5")}</button>
      <div><small>Example</small><p lang="zh-Hant">我來自英國。</p><span>I come from England.</span></div>
    </div>
  `;
}

function lessonPreviewView({ user, learningState, offline, lessonId }) {
  const lesson = lessonById(lessonId);
  const categoryId = new URLSearchParams(window.location.search).get("category") || lesson.id.split("-")[0];
  const step = lessonPreviewSteps.some((item) => item.id === learningState.lessonPreviewStep) ? learningState.lessonPreviewStep : "word";
  const body = `
    <div class="ls-lesson-preview-header">
      <a href="/app/learn/${encodeURIComponent(categoryId)}" data-app-link aria-label="Close lesson preview">${icon("x", "h-5 w-5")}</a>
      <div><span>Visual preview</span><strong>${escapeHtml(lesson.title)}</strong></div>
      <span>1 / 6</span>
    </div>
    ${progressIndicator(17, "Lesson preview")}
    <section class="ls-exercise-preview" aria-labelledby="exercise-preview-title">
      <h1 id="exercise-preview-title" class="sr-only" data-learning-page-title tabindex="-1">${escapeHtml(lesson.title)} lesson preview</h1>
      <nav class="ls-exercise-tabs" aria-label="Lesson flow previews">
        ${lessonPreviewSteps.map((item) => `<button type="button" data-learning-action="setLessonPreviewStep" data-value="${item.id}" aria-pressed="${item.id === step}">${icon(item.icon, "h-4 w-4")}<span>${item.label}</span></button>`).join("")}
      </nav>
      <div class="ls-exercise-preview__stage">${previewPanel(step)}</div>
      <footer class="ls-exercise-preview__footer">
        <p>${icon("info", "h-4 w-4")} Interaction is intentionally disabled in Phase 2.</p>
        <button class="${ui.primary}" type="button" disabled>${icon("check", "h-4 w-4")}<span>Check answer</span></button>
      </footer>
    </section>
  `;
  return appShell({ active: "learn", title: "Lesson preview", eyebrow: "Traditional Chinese", user, body, offline });
}

function formatReviewTime(timestamp) { return timestamp ? new Date(timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not scheduled"; }

function reviewView({ user, offline, learningState }) {
  const state = learningState.reviewState || {}; const dashboard = state.dashboard || {}; const session = state.session;
  if (session) return `<div id="reviewEngineRoot" class="ls-lesson-engine-root"><div class="ls-engine-loading" role="status"><span>${icon("loader-circle", "h-6 w-6")}</span><h1 data-learning-page-title tabindex="-1">Preparing review</h1></div></div>`;
  const due = Number(dashboard.dueCount || 0); const noDue = dashboard.total > 0 && due === 0;
  const categoryNames = new Map((learningState.language?.categories || []).map((item) => [item.id, item.name]));
  const body = `
    ${pageHeading({ eyebrow: "Keep it fresh", title: "Review", body: "Strengthen downloaded lesson content with private, device-local spaced practice." })}
    <section class="ls-review-hero" aria-labelledby="review-ready-title">
      <div class="ls-review-hero__count"><strong>${due}</strong><span>items due</span></div>
      <div><span class="ls-eyebrow">${dashboard.overdueCount || 0} overdue · ${dashboard.weakCount || 0} weak</span><h2 id="review-ready-title">${dashboard.activeSession ? "A review session is active" : dashboard.pausedSession ? "Your review is paused" : due ? "Your review queue is ready" : noDue ? "You are caught up" : "Complete a lesson to begin"}</h2><p>${dashboard.activeSession ? `${dashboard.activeSession.cursor + 1} of ${dashboard.activeSession.queue.length} · open it here if this tab owns the session.` : dashboard.pausedSession ? `${dashboard.pausedSession.cursor + 1} of ${dashboard.pausedSession.queue.length} · your feedback and queue are saved.` : due ? `About ${dashboard.estimatedMinutes || 1} minutes · next due ${formatReviewTime(dashboard.nextDueAt)}` : noDue ? `Next review ${formatReviewTime(dashboard.nextDueAt)}. Optional practice is always available.` : "A first perfect lesson pass activates its words, phrases, dialogue, and story for review."}</p>${dashboard.activeSession || dashboard.pausedSession ? `<button class="${ui.primary}" type="button" data-learning-action="startReview" data-value="standard">${icon("play", "h-4 w-4")}<span>${dashboard.activeSession ? "Open active review" : "Resume review"}</span></button>` : due ? `<button class="${ui.primary}" type="button" data-learning-action="startReview" data-value="quick">${icon("rotate-ccw", "h-4 w-4")}<span>Quick review · 5</span></button>` : ""}</div>
    </section>
    <section class="ls-review-groups" aria-labelledby="review-groups-title">
      <div class="ls-section-heading"><div><span>Choose a session</span><h2 id="review-groups-title">Focused practice</h2></div><p>Queues prioritize overdue and weak material, then balance categories and content types.</p></div>
      <div class="ls-review-options"><button data-learning-action="startReview" data-value="standard" ${due ? "" : "disabled"}>${icon("layers-3", "h-5 w-5")}<span><strong>Standard</strong><small>Up to 12 due items</small></span></button><button data-learning-action="startReview" data-value="extended" ${due ? "" : "disabled"}>${icon("route", "h-5 w-5")}<span><strong>Extended</strong><small>Up to 25 due items</small></span></button><button data-learning-action="startWeakReview" ${dashboard.weakCount ? "" : "disabled"}>${icon("milestone", "h-5 w-5")}<span><strong>Weak items</strong><small>${dashboard.weakCount || 0} need attention</small></span></button><button data-learning-action="startPractice" ${dashboard.total ? "" : "disabled"}>${icon("sparkles", "h-5 w-5")}<span><strong>Optional practice</strong><small>Gentle schedule impact</small></span></button></div>
    </section>
    ${dashboard.categories?.length ? `<section class="ls-review-categories" aria-labelledby="review-categories-title"><div class="ls-section-heading"><div><span>By category</span><h2 id="review-categories-title">Review one topic</h2></div></div><div>${dashboard.categories.map((category) => `<button type="button" data-learning-action="startCategoryReview" data-value="${escapeHtml(category.id)}"><span>${escapeHtml(categoryNames.get(category.id) || "Course category")}</span><strong>${category.count} due</strong></button>`).join("")}</div></section>` : ""}
    <section class="ls-review-stats" aria-label="Review statistics"><article><span>Streak</span><strong>${dashboard.currentStreak || 0} days</strong></article><article><span>Mastered</span><strong>${dashboard.masteredCount || 0} items</strong></article><article><span>Last review</span><strong>${formatReviewTime(dashboard.lastReviewAt)}</strong></article><article><span>Next due</span><strong>${formatReviewTime(dashboard.nextDueAt)}</strong></article></section>
    ${state.error ? `<p class="ls-review-error" role="alert">${escapeHtml(state.error.message)}</p>` : ""}
  `;
  return appShell({ active: "review", title: "Review", user, body, offline, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

function progressView({ user, offline, learningState }) {
  const snapshot = learningState.progressState?.snapshot;
  const stats = snapshot?.statistics || {};
  const minutes = Math.floor(Number(stats.totalStudyTimeMs || 0) / 60000);
  const insights = snapshot?.insights || {};
  const activity = insights.activity || snapshot?.recentActivity || [];
  const weak = insights.weakAreas || [];
  const review = learningState.reviewState?.dashboard || {};
  const body = `
    ${pageHeading({ eyebrow: "Your learning story", title: "Progress", body: "Your progress is stored privately in this browser and stays available offline." })}
    <section class="ls-progress-overview" aria-labelledby="progress-overview-title">
      <div><span class="ls-eyebrow">Learning overview</span><h2 id="progress-overview-title">${stats.lessonsCompleted || 0} lesson${stats.lessonsCompleted === 1 ? "" : "s"} completed</h2><p>${stats.totalAttempts || 0} finished attempt${stats.totalAttempts === 1 ? "" : "s"} · ${minutes} active study minute${minutes === 1 ? "" : "s"}</p>${progressIndicator(stats.overallCompletion || 0, "Overall course completion")}<div class="ls-progress-streak"><strong>${insights.streak?.current || 0} day learning streak</strong><small>Longest ${insights.streak?.longest || 0} day${insights.streak?.longest === 1 ? "" : "s"} · completed attempts and reviews only</small></div></div>
      <div><span class="ls-eyebrow">Continue learning</span><h2>${escapeHtml(learningState.progressState?.continueTarget?.lessonTitle || "Your next available lesson")}</h2><p>Resume an active lesson first; otherwise continue from the first unlocked incomplete lesson.</p><a class="${ui.primary}" href="/app/learn" data-app-link>${icon("play", "h-4 w-4")} Continue learning</a></div>
    </section>
    <section class="ls-progress-categories" aria-labelledby="category-progress-title"><div class="ls-section-heading"><div><span>Curriculum</span><h2 id="category-progress-title">Category progress</h2></div><p>Completion is based on required lessons</p></div><div class="ls-progress-category-grid">${(insights.categoryProgress || []).map((category) => `<a href="/app/progress/category/${encodeURIComponent(category.slug)}" data-app-link><span><strong>${escapeHtml(category.name)}</strong><small>${category.completedLessons} of ${category.lessonTotal} lessons · ${escapeHtml(category.status.replaceAll("_", " "))}</small></span><b>${category.percentage}%</b></a>`).join("") || `<p>No category activity yet.</p>`}</div></section>
    <section class="ls-progress-details" aria-labelledby="course-progress-title">
      <article><span>${icon("route", "h-5 w-5")}</span><p>Course progress</p><h2 id="course-progress-title">${stats.categoriesCompleted || 0} of ${stats.categoryTotal || 0} categories complete</h2>${progressIndicator(stats.overallCompletion || 0, "Course progress")}</article>
      <article><span>${icon("book-check", "h-5 w-5")}</span><p>Vocabulary</p><h2>${stats.vocabularyEncountered || 0} encountered · ${stats.vocabularyLearned || 0} learned</h2><small>Learned requires a perfect lesson pass; it is distinct from review mastery.</small></article>
      <article><span>${icon("messages-square", "h-5 w-5")}</span><p>Stories and dialogue</p><h2>${stats.storiesCompleted || 0} stories · ${stats.dialoguesCompleted || 0} dialogues</h2><small>Counted when their lesson is completed perfectly. Reopening does not change progress.</small></article>
      <article><span>${icon("milestone", "h-5 w-5")}</span><p>Weak areas</p><h2>${stats.weakItemsCount || 0} weak items</h2><small>${weak.length ? escapeHtml(weak.slice(0, 3).map((item) => `${item.type} ${item.id}`).join(" · ")) : "No weak items identified yet"}</small>${weak.length ? `<a href="/app/review" data-app-link>Practice weak items</a>` : ""}</article>
      <article><span>${icon("rotate-ccw", "h-5 w-5")}</span><p>Review and retention</p><h2>${review.masteredCount || 0} mastered · ${review.dueCount || 0} due</h2><small>${insights.reviewAccuracy == null ? "No review answers yet" : `${insights.reviewAccuracy}% accuracy across ${insights.reviewResponses} review answers`} · ${insights.reviewSessionsCompleted || 0} sessions</small></article>
    </section>
    <section class="ls-progress-activity" aria-labelledby="activity-title"><div class="ls-section-heading"><div><span>History</span><h2 id="activity-title">Recent study activity</h2></div><p>App opens and idle time are excluded</p></div>${activity.length ? activity.map((item) => `<article><span>${icon(item.type === "review_completed" ? "rotate-ccw" : "book-check", "h-4 w-4")}</span><div><strong>${escapeHtml(item.lessonTitle || item.categoryName || (item.type === "review_completed" ? "Review session" : "Learning activity"))}</strong><small>${escapeHtml(item.type.replaceAll("_", " "))} · ${new Date(item.timestamp).toLocaleString()}</small></div></article>`).join("") : emptyState({ title: "No study activity yet", body: "Completed lesson attempts and review sessions will appear here." })}</section>
  `;
  return appShell({ active: "progress", title: "Progress", user, body, offline, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

function categoryProgressView({ user, offline, learningState, categorySlug }) {
  const category = learningState.progressState?.snapshot?.insights?.categoryProgress?.find((item) => item.slug === categorySlug);
  if (!category) return appShell({ active: "progress", title: "Category progress", user, offline, body: errorState({ title: "Category unavailable", body: "This category is not part of the current curriculum." }) });
  const snapshot = learningState.progressState?.categorySnapshots?.get(categorySlug); const lessons = snapshot?.records?.filter((item) => item.entityType === "lesson") || []; const bundle = cachedCategory(categorySlug); const completedLessonIds = new Set(lessons.filter((item) => item.historicallyCompleted).map((item) => item.entityId));
  const stories = (bundle?.stories || []).filter((story) => completedLessonIds.has(story.lessonId));
  const body = `<a class="ls-back-link" href="/app/progress" data-app-link>${icon("arrow-left", "h-4 w-4")} Back to Progress</a>${pageHeading({ eyebrow: "Category progress", title: category.name, body: category.description || "Detailed completion, attempts, study time, and review state for this category." })}<section class="ls-category-progress-detail">${progressIndicator(category.percentage, `${category.name} completion`)}<dl><div><dt>Required lessons</dt><dd>${category.completedLessons} / ${category.lessonTotal}</dd></div><div><dt>Status</dt><dd>${escapeHtml(category.status.replaceAll("_", " "))}</dd></div><div><dt>Active study time</dt><dd>${Math.floor(lessons.reduce((sum, item) => sum + Number(item.totalStudyTimeMs || 0), 0) / 60000)} min</dd></div><div><dt>Attempts</dt><dd>${lessons.reduce((sum, item) => sum + Number(item.totalAttempts || 0), 0)}</dd></div></dl><div class="ls-confirmation__actions"><a class="${ui.primary}" href="/app/learn/${encodeURIComponent(categorySlug)}" data-app-link>Open category</a><button class="${ui.secondary}" data-learning-action="startCategoryReview" data-value="${escapeHtml(category.id)}" ${learningState.reviewState?.dashboard?.categories?.some((item) => item.id === category.id) ? "" : "disabled"}>Review category</button></div></section>${stories.length ? `<section class="ls-progress-categories"><div class="ls-section-heading"><div><span>Completed lesson stories</span><h2>Read again</h2></div><p>Reading again does not alter progress</p></div><div class="ls-progress-category-grid">${stories.map((story) => { const title = typeof story.title === "string" ? story.title : story.title?.english || story.title?.traditional || "Story"; return `<a href="/app/story/${encodeURIComponent(story.id)}?category=${encodeURIComponent(categorySlug)}" data-app-link><span><strong>${escapeHtml(title)}</strong><small>${story.lines?.length || 0} lines · reading practice</small></span>${icon("book-open", "h-4 w-4")}</a>`; }).join("")}</div></section>` : ""}`;
  return appShell({ active: "progress", title: category.name, user, offline, body, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

function settingsView({ user, learningState, offline }) {
  const settings = learningState.settingsState || { global: {}, pair: {} }; const global = settings.global || {}; const pair = settings.pair || {};
  const option = (value, label, selected) => `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
  const select = (scope, key, label, description, choices, value) => `<label class="ls-setting-control"><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span><select data-learning-setting data-setting-scope="${scope}" data-setting-key="${key}">${choices.map(([id, name]) => option(id, name, value)).join("")}</select></label>`;
  const toggle = (scope, key, label, description, value) => `<button type="button" class="ls-setting-toggle" data-learning-action="toggleSetting" data-setting-scope="${scope}" data-value="${key}" aria-pressed="${Boolean(value)}"><span class="ls-settings-list__icon">${icon(value ? "circle-check" : "circle", "h-5 w-5")}</span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)} · ${value ? "On" : "Off"}</small></span></button>`;
  const voices = (globalThis.speechSynthesis?.getVoices?.() || []).filter((voice) => String(voice.lang).toLowerCase().startsWith("zh"));
  const attention = learningState.updateAvailable || learningState.contentHealth?.healthy === false;
  const body = `
    ${pageHeading({ eyebrow: "Make it yours", title: "Settings", body: "Preferences are saved in this browser. Display, audio, and review choices are scoped to Traditional Chinese." })}
    ${settings.error ? `<p class="ls-settings-error" role="alert">${escapeHtml(settings.error)}</p>` : ""}
    <section class="ls-settings-section" aria-labelledby="learning-settings-title">
      <div class="ls-section-heading"><div><span>Languages</span><h2 id="learning-settings-title">Course and interface</h2></div></div>
      <div class="ls-settings-list">
        <a href="/app/languages" data-app-link><span class="ls-settings-list__icon">繁</span><span><strong>Traditional Chinese (Taiwan)</strong><small>Current installed pair · source language English · switch or manage download</small></span>${icon("chevron-right", "h-4 w-4")}</a>
        ${select("global", "interfaceLanguage", "Interface language", "Separate from the curriculum source language", [["system", "System default (English fallback)"], ["en", "English"]], global.interfaceLanguage)}
      </div>
    </section>
    <section class="ls-settings-section" aria-labelledby="display-settings-title"><div class="ls-section-heading"><div><span>Learning display</span><h2 id="display-settings-title">Reading support</h2></div></div><div class="ls-settings-controls">${select("pair", "pinyinMode", "Show pinyin", "Exercise rules always take priority", [["always", "Always when safe"], ["instructional", "Introductions and feedback"], ["on_request", "Only when requested"], ["hidden", "Hidden by default"]], pair.pinyinMode)}${select("pair", "translationMode", "English translation", "Testing exercises never reveal answers", [["instructional", "Instructional screens"], ["on_request", "Only when requested"], ["hidden_story", "Hidden in stories"]], pair.translationMode)}${select("pair", "storyDisplay", "Story reading display", "Can also be changed temporarily in the reader", [["chinese", "Chinese only"], ["chinese_pinyin", "Chinese with pinyin"], ["chinese_english", "Chinese with English"], ["all", "Chinese, pinyin, and English"]], pair.storyDisplay)}</div></section>
    <section class="ls-settings-section" aria-labelledby="audio-settings-title"><div class="ls-section-heading"><div><span>Audio</span><h2 id="audio-settings-title">Listening and speech</h2></div></div><div class="ls-settings-controls">${toggle("pair", "audioEnabled", "Enable audio", "Recorded audio first, browser speech fallback", pair.audioEnabled)}${select("pair", "audioSpeed", "Playback speed", "Applied to recorded audio and speech synthesis", [["slow", "Slow"], ["normal", "Normal"], ["fast", "Fast"]], pair.audioSpeed)}<label class="ls-setting-control"><span><strong>Preferred Chinese voice</strong><small>${voices.length ? "Voice availability depends on this browser and device" : "No compatible Chinese speech voice is currently available"}</small></span><select data-learning-setting data-setting-scope="pair" data-setting-key="voiceURI"><option value="">Automatic fallback</option>${voices.map((voice) => option(voice.voiceURI, `${voice.name} · ${voice.lang}${voice.default ? " · default" : ""}`, pair.voiceURI)).join("")}</select></label>${toggle("pair", "replayAudio", "Replay audio", "Allow repeated playback controls", pair.replayAudio)}${toggle("pair", "autoplayIntroductions", "Auto-play introductions", "Only on instructional word introductions", pair.autoplayIntroductions)}<button type="button" class="${ui.secondary}" data-learning-action="testAudio">${icon("volume-2", "h-4 w-4")} Test audio</button><p class="ls-audio-status" data-audio-status aria-live="polite"></p></div></section>
    <section class="ls-settings-section" aria-labelledby="review-settings-title"><div class="ls-section-heading"><div><span>Review</span><h2 id="review-settings-title">Practice preferences</h2></div></div><div class="ls-settings-controls">${select("pair", "reviewSessionSize", "Default session size", "Quick, standard, or extended queue", [["quick", "Quick · up to 5"], ["standard", "Standard · up to 12"], ["extended", "Extended · up to 25"]], pair.reviewSessionSize)}${toggle("pair", "reviewReminders", "In-app review reminders", "Shows due counts inside the app; no notifications", pair.reviewReminders)}${toggle("pair", "earlyReinforcement", "Early reinforcement", "Repeat missed material during the current session", pair.earlyReinforcement)}${toggle("pair", "preferTyping", "Prefer typing", "Used only where the exercise is stable and accessible", pair.preferTyping)}${toggle("pair", "reviewAudio", "Automatic review audio", "Play supported prompts automatically", pair.reviewAudio)}${toggle("pair", "weakPriority", "Prioritize weak items", "Move weak and overdue material earlier", pair.weakPriority)}</div></section>
    <section class="ls-settings-section" aria-labelledby="download-settings-title">
      <div class="ls-section-heading"><div><span>Downloads</span><h2 id="download-settings-title">Offline course</h2></div></div>
      ${downloadStatus(learningState)}
      <div class="ls-settings-list">
        <button type="button" data-learning-action="checkForUpdates"><span class="ls-settings-list__icon">${icon("refresh-cw", "h-5 w-5")}</span><span><strong>Check for content updates</strong><small>${learningState.lastCheckedAt ? `Last checked ${new Date(learningState.lastCheckedAt).toLocaleString()}` : "Not checked yet"}</small></span>${icon("chevron-right", "h-4 w-4")}</button>
        <button type="button" data-learning-action="toggleContentPreference" data-value="automaticChecks"><span class="ls-settings-list__icon">${icon(learningState.preferences?.automaticChecks ? "circle-check" : "circle", "h-5 w-5")}</span><span><strong>Automatic update checks</strong><small>${learningState.preferences?.automaticChecks ? "On" : "Off"}</small></span></button>
        <button type="button" data-learning-action="toggleContentPreference" data-value="automaticDownloads"><span class="ls-settings-list__icon">${icon(learningState.preferences?.automaticDownloads ? "circle-check" : "circle", "h-5 w-5")}</span><span><strong>Download updates automatically</strong><small>${learningState.preferences?.automaticDownloads ? "On" : "Off"}</small></span></button>
        <button type="button" data-learning-action="toggleContentPreference" data-value="manualOnly"><span class="ls-settings-list__icon">${icon(learningState.preferences?.manualOnly ? "circle-check" : "circle", "h-5 w-5")}</span><span><strong>Manual updates only</strong><small>${learningState.preferences?.manualOnly ? "On" : "Off"}</small></span></button>
        <button type="button" data-learning-action="checkContentHealth"><span class="ls-settings-list__icon">${icon(learningState.contentHealth?.healthy === false ? "triangle-alert" : "shield-check", "h-5 w-5")}</span><span><strong>Content health: ${learningState.contentHealth?.healthy === false ? "Repair needed" : "Healthy"}</strong><small>${escapeHtml(learningState.contentHealth?.code || "Not checked")}</small></span>${icon("chevron-right", "h-4 w-4")}</button>
        ${learningState.contentHealth?.healthy === false ? `<button type="button" data-learning-action="repairContent"><span class="ls-settings-list__icon">${icon("wrench", "h-5 w-5")}</span><span><strong>Repair downloaded content</strong><small>Redownloads validated curriculum while preserving progress and settings</small></span>${icon("chevron-right", "h-4 w-4")}</button>` : ""}
        ${learningState.installed ? `<button type="button" data-learning-action="removeDownloadedContent"><span class="ls-settings-list__icon">${icon("trash-2", "h-5 w-5")}</span><span><strong>Remove downloaded course</strong><small>Progress records and account data are not removed</small></span>${icon("chevron-right", "h-4 w-4")}</button>` : ""}
      </div>
    </section>
    <section class="ls-settings-section" aria-labelledby="accessibility-settings-title"><div class="ls-section-heading"><div><span>Accessibility</span><h2 id="accessibility-settings-title">Motion</h2></div></div><div class="ls-settings-controls">${select("global", "reducedMotion", "Reduced motion", "System default respects your browser or operating-system preference", [["system", "System default"], ["reduce", "Reduce motion"], ["no-preference", "Use standard motion"]], global.reducedMotion)}</div></section>
    <section class="ls-settings-section" aria-labelledby="progress-settings-title"><div class="ls-section-heading"><div><span>Progress and data</span><h2 id="progress-settings-title">Reset local learning data</h2></div></div><div class="ls-settings-list"><button type="button" data-learning-action="resetProgress"><span class="ls-settings-list__icon">${icon("rotate-ccw", "h-5 w-5")}</span><span><strong>Reset Traditional Chinese progress</strong><small>Deletes this pair’s attempts, completion, review, and sessions; keeps content and settings</small></span>${icon("chevron-right", "h-4 w-4")}</button><button type="button" data-learning-action="resetAllProgress"><span class="ls-settings-list__icon">${icon("eraser", "h-5 w-5")}</span><span><strong>Reset all language progress</strong><small>Available for future additional language pairs; all downloads and settings remain</small></span>${icon("chevron-right", "h-4 w-4")}</button><button type="button" data-learning-action="resetApplicationData"><span class="ls-settings-list__icon">${icon("triangle-alert", "h-5 w-5")}</span><span><strong>Reset application learning data</strong><small>Advanced: removes downloads, progress, review history, sessions, and learning settings</small></span>${icon("chevron-right", "h-4 w-4")}</button></div></section>
    <section class="ls-settings-section" aria-labelledby="account-settings-title">
      <div class="ls-section-heading"><div><span>LinguaStories</span><h2 id="account-settings-title">Account and community</h2></div></div>
      <div class="ls-settings-list">
        <a href="/app/profile/my-info" data-app-link><span class="ls-settings-list__icon">${icon("user", "h-5 w-5")}</span><span><strong>${escapeHtml(user.displayName || "My account")}</strong><small>Profile, language details, and billing</small></span>${icon("chevron-right", "h-4 w-4")}</a>
        <a href="/app/dashboard" data-app-link><span class="ls-settings-list__icon">${icon("layout-grid", "h-5 w-5")}</span><span><strong>Community and live lessons</strong><small>Return to the existing LinguaStories experience</small></span>${icon("chevron-right", "h-4 w-4")}</a>
        <a href="/app/settings/curriculum" data-app-link><span class="ls-settings-list__icon">${icon("info", "h-5 w-5")}</span><span><strong>Curriculum information</strong><small>Version, schema, offline state, metric definitions, and local-data privacy</small></span>${icon("chevron-right", "h-4 w-4")}</a>
      </div>
    </section>
  `;
  return appShell({ active: "settings", title: "Settings", user, body, offline, reviewDue: reviewBadge(learningState), settingsAttention: attention });
}

function curriculumInfoView({ user, learningState, offline }) {
  const health = learningState.contentHealth; const language = learningState.language || {}; const bytes = Number(language.bytes || language.categoryBytes || 0);
  const body = `<a class="ls-back-link" href="/app/settings" data-app-link>${icon("arrow-left", "h-4 w-4")} Back to Settings</a>${pageHeading({ eyebrow: "About", title: "Curriculum information", body: "Technical details and plain-language definitions for this browser’s installed learning course." })}<section class="ls-category-progress-detail"><dl><div><dt>Language pair</dt><dd>Traditional Chinese (Taiwan) from English</dd></div><div><dt>Installed version</dt><dd>${escapeHtml(learningState.installedVersion || "Not installed")}</dd></div><div><dt>Available version</dt><dd>${escapeHtml(learningState.availableVersion || "Not checked")}</dd></div><div><dt>Schema</dt><dd>${escapeHtml(language.schemaVersion || "1.0.0")}</dd></div><div><dt>Download size</dt><dd>${bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "Not reported"}</dd></div><div><dt>Offline availability</dt><dd>${learningState.offlineAvailable ? "Available" : "Unavailable"}</dd></div><div><dt>Content health</dt><dd>${health?.healthy === false ? "Repair needed" : health?.healthy ? "Healthy" : "Not checked"}</dd></div></dl></section><section class="ls-settings-section"><div class="ls-section-heading"><div><span>Metric definitions</span><h2>What Progress means</h2></div></div><div class="ls-privacy-copy"><p><strong>Completed</strong> means every required scored exercise in a lesson was correct in one attempt. A replay cannot erase historical completion.</p><p><strong>Learned vocabulary</strong> comes from a perfect lesson pass. <strong>Mastered</strong> is stricter and requires durable scheduled recall, including production.</p><p><strong>Study time</strong> is active lesson time only. App opens and idle time are excluded. Learning streak days require a finished lesson attempt or completed review session.</p></div></section><section class="ls-settings-section"><div class="ls-section-heading"><div><span>Privacy and local data</span><h2>Stored in this browser</h2></div></div><div class="ls-privacy-copy"><p>Downloaded curriculum, settings, attempts, progress, review schedules, and lesson sessions are stored locally in IndexedDB. This learning system does not add cloud synchronization or a learning account.</p><p>Removing a course download preserves progress. Resetting current-language progress preserves downloads and settings. Reset application data removes all learning data on this browser.</p><p>Export and import are intentionally not exposed in this phase because a safe, fully validated interchange workflow is not implemented.</p></div></section>`;
  return appShell({ active: "settings", title: "Curriculum information", user, offline, body, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || health?.healthy === false });
}

function storyReaderView({ user, learningState, offline, storyId }) {
  const slug = new URLSearchParams(window.location.search).get("category") || ""; const bundle = cachedCategory(slug); const story = bundle?.stories?.find((item) => item.id === storyId); const mode = learningState.settingsState?.pair?.storyDisplay || "all";
  if (!story) return appShell({ active: "progress", title: "Story", user, offline, body: `<div class="ls-engine-loading" role="status"><span>${icon("loader-circle", "h-6 w-6")}</span><h1 data-learning-page-title tabindex="-1">Preparing story</h1><p>Loading its downloaded category content…</p></div>` });
  const showPinyin = ["chinese_pinyin", "all"].includes(mode); const showEnglish = ["chinese_english", "all"].includes(mode);
  const title = typeof story.title === "string" ? story.title : story.title?.english || story.title?.traditional || "Story";
  const body = `<a class="ls-back-link" href="/app/progress/category/${encodeURIComponent(slug)}" data-app-link>${icon("arrow-left", "h-4 w-4")} Back to category progress</a>${pageHeading({ eyebrow: "Story reader", title, body: "Reopening a story is reading practice only and does not change completion or review schedules." })}<nav class="ls-story-display-options" aria-label="Temporary story display"><button data-learning-action="temporaryStoryMode" data-value="chinese">Chinese</button><button data-learning-action="temporaryStoryMode" data-value="chinese_pinyin">+ Pinyin</button><button data-learning-action="temporaryStoryMode" data-value="chinese_english">+ English</button><button data-learning-action="temporaryStoryMode" data-value="all">All</button></nav><article class="ls-story-reader" data-story-reader data-story-id="${escapeHtml(story.id)}">${story.lines.map((line) => `<p><strong lang="zh-Hant">${escapeHtml(line.traditional)}</strong><span data-story-pinyin ${showPinyin ? "" : "hidden"}>${escapeHtml(line.pinyin)}</span><small data-story-english ${showEnglish ? "" : "hidden"}>${escapeHtml(line.english)}</small></p>`).join("")}</article>`;
  return appShell({ active: "progress", title: "Story", user, offline, body, reviewDue: reviewBadge(learningState), settingsAttention: learningState.updateAvailable || learningState.contentHealth?.healthy === false });
}

export function learningExperienceView({ route, user = {}, learningState }) {
  const safeState = learningState || { ...initialLearningUiState };
  const offline = safeState.forcedOffline || globalThis.navigator?.onLine === false;
  if (route.id === "languageSelection") return selectionView({ learningState: safeState });
  if (!safeState.installed) return selectionView({ learningState: safeState });
  if (route.id === "categoryDetail") return categoryDetailView({ user, learningState: safeState, offline, categoryId: route.categoryId });
  if (route.id === "lessonPreview") return lessonPreviewView({ user, learningState: safeState, offline, lessonId: route.lessonId });
  if (route.id === "lessonEngine") return lessonEngineView({ route, learningState: safeState });
  if (route.id === "review") return reviewView({ user, offline, learningState: safeState });
  if (route.id === "progress") return progressView({ user, offline, learningState: safeState });
  if (route.id === "categoryProgress") return categoryProgressView({ user, offline, learningState: safeState, categorySlug: route.categorySlug });
  if (route.id === "storyReader") return storyReaderView({ user, offline, learningState: safeState, storyId: route.storyId });
  if (route.id === "settings") return settingsView({ user, learningState: safeState, offline });
  if (route.id === "curriculumInfo") return curriculumInfoView({ user, learningState: safeState, offline });
  return learnView({ user, learningState: safeState, offline });
}

let lastFocusedPath = "";
let activeLessonController = null;
let activeReviewController = null;
let lessonMountToken = 0;

export function bindLearningExperience(root, callbacks) {
  const route = learningRouteFromPath();
  if (route?.id !== "lessonEngine") routeLoadErrors.clear();
  const requestedSlug = route?.id === "categoryDetail" ? (route.categoryId === "traveling" ? "travel" : route.categoryId) : ["lessonEngine", "categoryProgress"].includes(route?.id) ? route.categorySlug : route?.id === "storyReader" ? new URLSearchParams(window.location.search).get("category") || "" : "";
  if (requestedSlug && !cachedCategory(requestedSlug) && !routeLoadErrors.has(`${route.categorySlug}:${route.lessonId}`)) {
    const loadRequestedCategory = async () => {
      if (route.id === "lessonEngine" && callbacks.contentRuntime?.sessions) {
        const sessionKey = `zh-TW:en:${route.lessonId}`;
        const saved = await callbacks.contentRuntime.sessions.hydrate(sessionKey);
        if (saved?.curriculumVersion && saved.curriculumVersion !== callbacks.contentRuntime.snapshot().installedVersion) {
          if (!await callbacks.contentRuntime.content.hasVersion(callbacks.contentRuntime.contentPairKey(), saved.curriculumVersion)) {
            routeLoadErrors.set(`${route.categorySlug}:${route.lessonId}`, "The curriculum version used by this saved lesson is no longer on this device. Start the lesson again from the current category content.");
            return;
          }
          const original = await callbacks.contentRuntime.content.getCategory(requestedSlug, { pairKey: callbacks.contentRuntime.contentPairKey(), version: saved.curriculumVersion });
          if (original) { primeCategoryCache(requestedSlug, original); return; }
        }
      }
      const bundle = await loadCategory(requestedSlug);
      await callbacks.contentRuntime?.progressRuntime?.loadCategory(bundle);
    };
    loadRequestedCategory().then(() => {
      const current = learningRouteFromPath();
      if (route.id === "categoryDetail" && route.categoryId !== requestedSlug) callbacks.navigate(`/app/learn/${encodeURIComponent(requestedSlug)}`);
      else if (current?.id === route.id) callbacks.render();
    }).catch(() => { /* The loading state remains recoverable through navigation/reload. */ });
  }
  if (requestedSlug && cachedCategory(requestedSlug) && !callbacks.contentRuntime?.progressRuntime?.categorySnapshot(requestedSlug)) {
    callbacks.contentRuntime?.progressRuntime?.loadCategory(cachedCategory(requestedSlug)).then(() => callbacks.render()).catch(() => {});
  }
  if (route?.id === "lessonEngine" && cachedCategory(route.categorySlug)) {
    if (activeLessonController?.lesson?.id === route.lessonId && activeLessonController.root?.isConnected) return;
    activeLessonController?.destroy();
    const lessonRoot = root.querySelector("#lessonEngineRoot");
    if (lessonRoot) {
      const token = ++lessonMountToken;
      const bundle = cachedCategory(route.categorySlug);
      const key = `${bundle.targetLanguage}:${bundle.sourceLanguage}:${route.lessonId}`;
      Promise.resolve(callbacks.contentRuntime?.sessions?.hydrate(key)).then(async (saved) => {
        if (token !== lessonMountToken || !lessonRoot.isConnected) return;
        const lesson = bundle.lessons.find((item) => item.id === route.lessonId);
        const attemptContext = await callbacks.contentRuntime?.progressRuntime?.prepareLesson(bundle, lesson, saved);
        if (token !== lessonMountToken || !lessonRoot.isConnected) return;
        const audio = new LessonAudioService({ preferences: () => callbacks.contentRuntime.snapshot().settingsState?.pair || {} });
        activeLessonController = new LessonController({ root: lessonRoot, bundle, lessonId: route.lessonId, navigate: callbacks.navigate, repository: callbacks.contentRuntime?.sessions, progress: callbacks.contentRuntime?.progressRuntime, attemptContext, audio, displayPreferences: () => callbacks.contentRuntime.snapshot().settingsState?.pair || {} });
        activeLessonController.mount();
      }).catch((error) => { routeLoadErrors.set(`${route.categorySlug}:${route.lessonId}`, error.message); callbacks.render(); });
    }
  } else if (activeLessonController) {
    lessonMountToken += 1;
    const previousSlug = activeLessonController.category.slug;
    activeLessonController.destroy();
    activeLessonController = null;
    clearCurriculumCache(previousSlug);
    void callbacks.contentRuntime?.activatePendingIfSafe();
  }
  if (route?.id === "review" && callbacks.contentRuntime?.reviewRuntime?.snapshot().session) {
    if (!activeReviewController?.root?.isConnected) { activeReviewController?.destroy(); const reviewRoot = root.querySelector("#reviewEngineRoot"); if (reviewRoot) { const preferences = () => callbacks.contentRuntime.snapshot().settingsState?.pair || {}; const audio = new LessonAudioService({ preferences }); activeReviewController = new ReviewController({ root: reviewRoot, runtime: callbacks.contentRuntime.reviewRuntime, navigate: callbacks.navigate, progressRuntime: callbacks.contentRuntime.progressRuntime, audio, preferences }); activeReviewController.mount(); } }
  } else if (activeReviewController) { activeReviewController.destroy(); activeReviewController = null; }
  root.querySelectorAll("[data-learning-action]").forEach((element) => {
    if (element.dataset.boundLearningAction) return;
    element.dataset.boundLearningAction = "true";
    element.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = element.dataset.learningAction;
      const value = element.dataset.value || "";
      if (action === "startDownload" || action === "startUpdate" || action === "repairContent") {
        try {
          if (action === "repairContent") await callbacks.contentRuntime.repair();
          else await callbacks.contentRuntime.install({ update: action === "startUpdate" });
          if (action === "startDownload") callbacks.navigate("/app/learn");
        } catch (_error) { requestAnimationFrame(() => root.querySelector("[role=alert]")?.focus?.()); }
      }
      if (action === "cancelDownload") callbacks.contentRuntime.cancel();
      if (action === "continueLearning") {
        callbacks.navigate("/app/learn");
      }
      if (action === "checkForUpdates") await callbacks.contentRuntime.checkForUpdates({ force: true });
      if (action === "startReview") { try { await callbacks.contentRuntime.reviewRuntime.start({ length: value || "standard" }); callbacks.render(); } catch (_error) { callbacks.render(); } }
      if (action === "startWeakReview") { try { await callbacks.contentRuntime.reviewRuntime.start({ length: "standard", weakOnly: true }); callbacks.render(); } catch (_error) { callbacks.render(); } }
      if (action === "startCategoryReview") { try { const result = await callbacks.contentRuntime.reviewRuntime.start({ length: callbacks.contentRuntime.snapshot().settingsState?.pair?.reviewSessionSize || "standard", categoryId: value }); if (result.session) callbacks.navigate("/app/review"); else callbacks.render(); } catch (_error) { callbacks.render(); } }
      if (action === "startPractice") { try { await callbacks.contentRuntime.reviewRuntime.start({ length: "quick", practice: true }); callbacks.render(); } catch (_error) { callbacks.render(); } }
      if (action === "toggleContentPreference") await callbacks.contentRuntime.updatePreferences({ [value]: !callbacks.contentRuntime.snapshot().preferences[value] });
      if (action === "toggleSetting") { const scope = element.dataset.settingScope; const current = callbacks.contentRuntime.snapshot().settingsState?.[scope]?.[value]; try { await callbacks.contentRuntime.updateSetting(scope, { [value]: !current }); callbacks.render(); } catch (_error) { callbacks.render(); } }
      if (action === "checkContentHealth") { await callbacks.contentRuntime.checkContentHealth(); callbacks.render(); }
      if (action === "testAudio") { const status = root.querySelector("[data-audio-status]"); const audio = new LessonAudioService({ preferences: () => callbacks.contentRuntime.snapshot().settingsState?.pair || {} }); const played = await audio.play({ text: "你好，歡迎學習中文。" }); if (status) status.textContent = played ? "Audio test started." : "No compatible audio output is available. Text remains available."; }
      if (action === "temporaryStoryMode") { const showPinyin = ["chinese_pinyin", "all"].includes(value); const showEnglish = ["chinese_english", "all"].includes(value); root.querySelectorAll("[data-story-pinyin]").forEach((node) => { node.hidden = !showPinyin; }); root.querySelectorAll("[data-story-english]").forEach((node) => { node.hidden = !showEnglish; }); }
      if (action === "setLessonPreviewStep") {
        callbacks.dispatch({ type: "SET_LESSON_PREVIEW_STEP", step: value });
        callbacks.render();
      }
      if (action === "removeDownloadedContent") {
        callbacks.showModal(confirmationModal({
          title: "Remove the downloaded course?",
          body: "The offline curriculum will be removed from this browser. Your account and future progress records are not affected.",
          confirmLabel: "Remove download",
          action: "confirmContentRemoval"
        }));
      }
      if (action === "confirmContentRemoval") {
        await callbacks.contentRuntime.removeDownloadedContent();
        callbacks.closeModal();
        callbacks.navigate("/app/languages");
      }
      if (action === "resetProgress") {
        callbacks.showModal(confirmationModal({ title: "Reset all Traditional Chinese progress?", body: "This permanently deletes lesson attempts, completion, study time, weak-item history, and saved lesson sessions for this language. Downloaded curriculum, settings, and account data are kept.", confirmLabel: "Reset progress", action: "confirmProgressReset" }));
      }
      if (action === "confirmProgressReset") {
        await callbacks.contentRuntime.progressRuntime.reset();
        callbacks.closeModal();
        callbacks.navigate("/app/learn");
      }
      if (action === "resetAllProgress") callbacks.showModal(typedConfirmationModal({ title: "Reset progress for every language?", body: "This removes all local lesson attempts, completions, review schedules, study history, and saved sessions. Downloads and settings remain.", phrase: "RESET ALL PROGRESS", confirmLabel: "Reset all progress", action: "confirmAllProgressReset" }));
      if (action === "confirmAllProgressReset") { await callbacks.contentRuntime.resetAllProgress(); callbacks.closeModal(); callbacks.navigate("/app/learn"); }
      if (action === "resetApplicationData") callbacks.showModal(typedConfirmationModal({ title: "Reset all learning application data?", body: "This advanced action removes every downloaded course, all progress and review history, lesson sessions, and learning settings from this browser.", phrase: "RESET APPLICATION DATA", confirmLabel: "Reset application data", action: "confirmApplicationReset" }));
      if (action === "confirmApplicationReset") { await callbacks.contentRuntime.resetApplicationData(); callbacks.closeModal(); globalThis.location.assign("/app/languages"); }
    });
  });
  root.querySelectorAll("[data-learning-setting]").forEach((element) => {
    if (element.dataset.boundLearningSetting) return; element.dataset.boundLearningSetting = "true";
    element.addEventListener("change", async () => { try { await callbacks.contentRuntime.updateSetting(element.dataset.settingScope, { [element.dataset.settingKey]: element.value }); callbacks.render(); } catch (_error) { callbacks.render(); } });
  });
  const confirmationInput = root.querySelector("[data-confirmation-input]"); const confirmationButton = root.querySelector("[data-confirmation-phrase]");
  if (confirmationInput && confirmationButton) confirmationInput.addEventListener("input", () => { confirmationButton.disabled = confirmationInput.value !== confirmationButton.dataset.confirmationPhrase; });

  const pathKey = `${window.location.pathname}${window.location.search}`;
  if (pathKey !== lastFocusedPath) {
    lastFocusedPath = pathKey;
    requestAnimationFrame(() => root.querySelector("[data-learning-page-title]")?.focus({ preventScroll: true }));
  }
}

export function learningStateReducer(state, action) {
  return reduceLearningUiState(state, action);
}
