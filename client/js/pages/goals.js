import { escapeHtml, formatDate, icon, pct, progressBar, ui } from "../ui.js";
import { languageName } from "../languages.js";

const GOAL_TYPES = ["Sentences", "Stories", "Streak", "Shadowing"];
const VISIBILITIES = ["Public", "Private"];

function selectedGoalsLanguage() {
  return new URLSearchParams(window.location.search).get("language") || "";
}

function optionList(options, selected = "") {
  return options.map((item) => `<option ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
}

function currentGoalsLanguage(state) {
  return selectedGoalsLanguage() || state.user.targetLanguage || state.learningLanguages?.[0]?.language || "";
}

function goalScopeLabel(goal, appConfig = {}) {
  return goal.goalScope === "Global" ? "All languages" : languageName(appConfig, goal.targetLanguage) || "Language specific";
}

function supporterAvatar(supporter) {
  if (supporter.avatarUrl) return `<img class="h-10 w-10 rounded-full object-cover" src="${escapeHtml(supporter.avatarUrl)}" alt="">`;
  return `<div class="grid h-10 w-10 place-items-center rounded-full bg-brand-sidebar text-sm font-bold text-white">${escapeHtml(supporter.avatar || "?")}</div>`;
}

function goalCard(goal, appConfig = {}) {
  const supportReceived = Number(goal.supportReceived || 0);
  return `
    <article class="rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)] transition hover:border-brand-orange/35">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="${ui.row}">
            <span class="${goal.goalScope === "Global" ? ui.tagDark : ui.tagGold}">${escapeHtml(goalScopeLabel(goal, appConfig))}</span>
            <span class="${ui.tag}">${escapeHtml(goal.type)}</span>
            <span class="${ui.tagDark}">${escapeHtml(goal.visibility)}</span>
            ${goal.dueDate ? `<span class="${ui.tagRed}">Complete by ${escapeHtml(formatDate(goal.dueDate))}</span>` : ""}
            ${
              goal.goalScope === "Global"
                ? `<button class="${ui.tagGold} transition hover:border-brand-orange/40 hover:bg-white" data-action="openGoalSupporters:${goal.id}">${icon("coins", "h-3.5 w-3.5")}<span>${supportReceived} coins received</span></button>`
                : goal.supportReceived
                  ? `<span class="${ui.tagGold}">${icon("coins", "h-3.5 w-3.5")}<span>${supportReceived} coins supported</span></span>`
                  : ""
            }
          </div>
          <h3 class="mt-3 text-xl font-bold tracking-tight text-brand-ink">${escapeHtml(goal.title)}</h3>
        </div>
        <button class="${ui.secondary}" data-action="openEditGoalModal:${goal.id}">${icon("edit")}<span>Edit</span></button>
      </div>
      <div class="mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-semibold text-brand-graphite">${goal.progress} / ${goal.target}</span>
          <span class="text-sm font-semibold text-brand-red">${pct(goal.progress, goal.target)}%</span>
        </div>
        <div class="mt-2">${progressBar(pct(goal.progress, goal.target))}</div>
      </div>
    </article>
  `;
}

export function goalSupportersModal({ state }, goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return `<h2 class="text-2xl font-bold text-brand-ink">Goal not found</h2>`;
  const supporters = goal.supporters || [];
  const supportReceived = Number(goal.supportReceived || 0);

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">${icon("coins", "h-3.5 w-3.5")}<span>${supportReceived} coins received</span></span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Supporters</h2>
      <p class="mt-2 ${ui.muted}">${escapeHtml(goal.title)}</p>
    </div>
    <div class="mt-6 grid gap-3">
      ${
        supporters.length
          ? supporters
              .map(
                (supporter) => `
                  <button class="flex w-full items-start gap-3 rounded-lg border border-brand-line/80 bg-white/65 p-4 text-left text-brand-ink transition hover:border-brand-orange/45 hover:bg-white" data-action="goToLearnerProfile:${escapeHtml(supporter.userId)}">
                    ${supporterAvatar(supporter)}
                    <span class="min-w-0 flex-1">
                      <span class="flex flex-wrap items-center justify-between gap-2">
                        <strong class="text-sm text-brand-ink">${escapeHtml(supporter.displayName)}</strong>
                        <span class="${ui.tagGold}">${icon("coins", "h-3.5 w-3.5")}<span>${Number(supporter.amount || 0)} coins</span></span>
                      </span>
                      ${supporter.message ? `<span class="mt-2 block text-sm leading-6 text-brand-charcoal">${escapeHtml(supporter.message)}</span>` : ""}
                      <span class="mt-2 block text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(supporter.date))}</span>
                    </span>
                  </button>
                `
              )
              .join("")
          : `<div class="rounded-lg border border-dashed border-brand-line bg-white/55 p-5 text-center"><p class="${ui.muted}">No one has supported this goal yet.</p></div>`
      }
    </div>
  `;
}

function goalSection(title, goals, emptyText, description = "", appConfig = {}) {
  return `
    <section class="grid gap-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 class="text-lg font-bold tracking-tight text-brand-ink">${escapeHtml(title)}</h3>
          ${description ? `<p class="mt-1 ${ui.muted}">${escapeHtml(description)}</p>` : ""}
        </div>
        <span class="text-xs font-semibold uppercase text-brand-graphite">${goals.length} goals</span>
      </div>
      ${
        goals.length
          ? goals.map((goal) => goalCard(goal, appConfig)).join("")
          : `<article class="${ui.card}"><p class="${ui.muted}">${escapeHtml(emptyText)}</p></article>`
      }
    </section>
  `;
}

export function goalsView({ appConfig, state }) {
  const selectedLanguage = currentGoalsLanguage(state);
  const selectedLanguageName = languageName(appConfig, selectedLanguage);
  const globalGoals = state.goals.filter((goal) => goal.goalScope === "Global" || !goal.targetLanguage);
  const languageGoals = state.goals.filter((goal) => goal.goalScope !== "Global" && goal.targetLanguage === selectedLanguage);

  return `
    <div class="grid gap-4">
      <section class="flex flex-wrap justify-end gap-3">
        <button class="${ui.primary}" data-action="openCreateGoalModal">${icon("add")}<span>Create Goal</span></button>
      </section>

      ${goalSection("Global Goals", globalGoals, "No global goals yet.", `Global goals apply to every language. Language goals apply to ${selectedLanguageName}.`, appConfig)}
      ${goalSection("Language-Specific Goals", languageGoals, "No goals for this language profile yet.", "", appConfig)}
    </div>
  `;
}

export function createGoalModal({ appConfig, state }) {
  const selectedLanguage = currentGoalsLanguage(state);
  const selectedLanguageName = languageName(appConfig, selectedLanguage);

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">My Goals</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Create Goal</h2>
      <p class="mt-2 ${ui.muted}">Create a global goal or attach it to your current language.</p>
    </div>
    <form class="mt-6 grid gap-4" data-form="goal">
      <label class="${ui.label}">Goal<input class="${ui.input}" name="title" required placeholder="Complete 5 stories"></label>
      <div class="rounded-lg bg-brand-mist/60 px-4 py-3">
        <span class="block text-xs font-semibold uppercase text-brand-graphite">Current language</span>
        <strong class="mt-1 block text-sm text-brand-ink">${escapeHtml(selectedLanguageName)}</strong>
        <input type="hidden" name="targetLanguage" value="${escapeHtml(selectedLanguage)}">
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="${ui.label}">Type<select class="${ui.input}" name="type">${optionList(GOAL_TYPES, "Sentences")}</select></label>
        <label class="${ui.label}">Target<input class="${ui.input}" name="target" type="number" min="1" value="10"></label>
        <label class="${ui.label}">Complete By<input class="${ui.input}" name="dueDate" type="date" required></label>
        <label class="${ui.label}">Visibility<select class="${ui.input}" name="visibility">${optionList(VISIBILITIES, "Public")}</select></label>
      </div>
      <label class="flex w-full cursor-pointer items-start gap-3 rounded-lg border border-brand-line/80 bg-white/55 px-4 py-3 transition hover:border-brand-orange/40 hover:bg-white">
        <input class="mt-0.5 h-4 w-4 rounded border-brand-line accent-brand-ink" name="isGlobal" type="checkbox">
        <span>
          <span class="block text-sm font-semibold text-brand-ink">Global goal</span>
          <span class="mt-1 block text-xs leading-5 text-brand-graphite">Applies to every language instead of only ${escapeHtml(selectedLanguageName)}.</span>
        </span>
      </label>
      <div class="flex justify-end border-t border-brand-line pt-4">
        <button class="${ui.primary}">${icon("add")}<span>Create Goal</span></button>
      </div>
    </form>
  `;
}

export function editGoalModal({ appConfig, state }, goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return `<h2 class="text-2xl font-bold text-brand-ink">Goal not found</h2>`;

  return `
    <div class="pr-10">
      <span class="${goal.goalScope === "Global" ? ui.tagDark : ui.tagGold}">${escapeHtml(goalScopeLabel(goal, appConfig))}</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Edit Goal</h2>
      <p class="mt-2 ${ui.muted}">Update the goal details. Goal language cannot be changed.</p>
    </div>
    <form class="mt-6 grid gap-4" data-form="editGoal">
      <input type="hidden" name="id" value="${escapeHtml(goal.id)}">
      <label class="${ui.label}">Goal<input class="${ui.input}" name="title" required value="${escapeHtml(goal.title)}"></label>
      <div class="rounded-lg bg-brand-mist/60 px-4 py-3">
        <span class="block text-xs font-semibold uppercase text-brand-graphite">Applies to</span>
        <strong class="mt-1 block text-sm text-brand-ink">${escapeHtml(goalScopeLabel(goal, appConfig))}</strong>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="${ui.label}">Type<select class="${ui.input}" name="type">${optionList(GOAL_TYPES, goal.type)}</select></label>
        <label class="${ui.label}">Target<input class="${ui.input}" name="target" type="number" min="1" value="${escapeHtml(goal.target)}"></label>
        <label class="${ui.label}">Complete By<input class="${ui.input}" name="dueDate" type="date" value="${escapeHtml(goal.dueDate || "")}" required></label>
        <label class="${ui.label}">Visibility<select class="${ui.input}" name="visibility">${optionList(VISIBILITIES, goal.visibility)}</select></label>
      </div>
      <div class="flex justify-end border-t border-brand-line pt-4">
        <button class="${ui.primary}">${icon("edit")}<span>Save Goal</span></button>
      </div>
    </form>
  `;
}
