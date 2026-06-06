import { button, escapeHtml, formatDate, icon, pct, progressBar, ui } from "../ui.js";

function getLanguageContext({ state, selectedProfileLanguage }) {
  const user = state.user;
  const learningLanguages = state.learningLanguages?.length
    ? state.learningLanguages
    : [{ language: user.targetLanguage, currentLevel: user.currentLevel, currentStreak: user.currentStreak, longestStreak: user.longestStreak, listeningTime: user.listeningTime, shadowingTime: user.shadowingTime, active: true }];
  const selectedLanguage = selectedProfileLanguage || user.targetLanguage || learningLanguages[0]?.language || "";
  const selectedLanguageProfile = learningLanguages.find((item) => item.language === selectedLanguage) || learningLanguages[0] || {};
  const languageSentences = state.sentences.filter((sentence) => !sentence.targetLanguage || sentence.targetLanguage === selectedLanguage);
  const languageStories = state.stories.filter((story) => !story.targetLanguage || story.targetLanguage === selectedLanguage);
  const languageGoals = state.goals.filter((goal) => goal.goalScope !== "Global" && goal.targetLanguage === selectedLanguage);
  const languagePaths = state.paths.filter((path) => !path.targetLanguage || path.targetLanguage === selectedLanguage);

  return {
    learningLanguages,
    selectedLanguage,
    selectedLanguageProfile,
    languageSentences,
    languageStories,
    languageGoals,
    languagePaths
  };
}

function languageOptions(languages, selected) {
  return languages.map((language) => `<option ${language === selected ? "selected" : ""}>${escapeHtml(language)}</option>`).join("");
}

function levelOptions(selected = "A1") {
  return ["A1", "A2", "B1", "B2", "C1", "C2"]
    .map((level) => `<option ${level === selected ? "selected" : ""}>${level}</option>`)
    .join("");
}

function visibilityOptions(selected = "Private") {
  return ["Private", "Public"].map((visibility) => `<option ${visibility === selected ? "selected" : ""}>${visibility}</option>`).join("");
}

export function profileInfoView({ state, appConfig }) {
  const user = state.user;
  const avatarPreview = user.avatarUrl
    ? `<img class="h-24 w-24 rounded-full object-cover shadow-sm" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.displayName)} avatar">`
    : `<div class="grid h-24 w-24 place-items-center rounded-full bg-brand-sidebar text-3xl font-bold text-white">${escapeHtml(user.avatar)}</div>`;

  return `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section class="${ui.card}">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Account details</h2>
            <p class="mt-2 ${ui.muted}">Keep your account identity and native language current.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${button("Delete Profile", "openDeleteProfileModal", ui.danger)}
            ${button("Log Out", "logout", ui.secondary)}
          </div>
        </div>

        <form class="mt-6 grid gap-4" data-form="profileInfo">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="${ui.label}">Display Name<input class="${ui.input}" name="displayName" value="${escapeHtml(user.displayName)}" required></label>
            <label class="${ui.label}">Email<input class="${ui.input}" name="email" type="email" value="${escapeHtml(user.email)}" required></label>
            <label class="${ui.label}">Native Language<select class="${ui.input}" name="nativeLanguage" required>${languageOptions(appConfig.supportedLanguages, user.nativeLanguage)}</select></label>
          </div>
          <label class="${ui.label}">Bio<textarea class="${ui.input} min-h-32 resize-y" name="bio" placeholder="Tell the community what you are practicing.">${escapeHtml(user.bio || "")}</textarea></label>
          <div class="flex flex-wrap gap-2">
            <button class="${ui.primary}">${icon("edit")}<span>Save Info</span></button>
            <a class="${ui.secondary}" href="/app/profile/language-profiles" data-app-link>Language Profiles</a>
          </div>
        </form>
        <form class="mt-6 border-t border-brand-line pt-5" data-form="avatarUpload">
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label class="${ui.label}">Profile Picture<input class="${ui.input}" name="avatarImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required></label>
            <button class="${ui.primary}">${icon("upload")}<span>Crop & Upload</span></button>
          </div>
        </form>
      </section>

      <aside class="${ui.card}">
        <div class="grid place-items-center rounded-lg bg-brand-mist/70 p-6 text-center">
          ${avatarPreview}
          <h3 class="mt-4 text-xl font-bold text-brand-ink">${escapeHtml(user.displayName)}</h3>
          <p class="mt-1 text-sm font-bold text-brand-graphite">${escapeHtml(user.email)}</p>
        </div>
        <div class="mt-4 grid gap-3">
          ${infoRow("Native language", user.nativeLanguage)}
          ${infoRow("Current app language", user.targetLanguage)}
          ${infoRow("Current level", user.currentLevel)}
        </div>
      </aside>
    </div>
  `;
}

export function deleteProfileConfirmModal({ state }) {
  return `
    <div>
      <span class="${ui.tagRed}">Delete Profile</span>
      <h2 class="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-ink">${icon("trash", "h-5 w-5 text-brand-redDark")}<span>Delete your profile?</span></h2>
      <p class="mt-2 ${ui.muted}">This permanently deletes ${escapeHtml(state.user.displayName)}'s account, profile picture, language profiles, wallet records, story progress, goals, community posts, comments, messages, and saved learning activity. This cannot be undone.</p>
      <div class="mt-5 rounded-lg border border-brand-red/20 bg-brand-red/10 p-4">
        <p class="text-sm font-semibold leading-6 text-brand-redDark">Only continue if you are sure you no longer need this LinguaStories profile.</p>
      </div>
      <div class="mt-6 flex justify-end border-t border-brand-line pt-4">
        <button class="${ui.danger}" data-action="confirmDeleteProfile">${icon("trash", "h-4 w-4")}<span>Delete Profile</span></button>
      </div>
    </div>
  `;
}

export function languageProfilesView({ state, appConfig, selectedProfileLanguage }) {
  const user = state.user;
  const { learningLanguages, selectedLanguage } = getLanguageContext({ state, selectedProfileLanguage });
  const languageNames = learningLanguages.map((item) => item.language);
  const availableLanguages = appConfig.supportedLanguages.filter((language) => !languageNames.includes(language));

  return `
    <div class="grid gap-4">
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Active language profiles</h2>
          <p class="mt-2 ${ui.muted}">Manage the languages you are learning and choose which one is current.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="${ui.primary}" data-action="openAddLanguageModal">${icon("add")}<span>Add Language</span></button>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        ${learningLanguages.map((languageProfile) => languageProfileCard({ state, user, languageProfile, selectedLanguage })).join("")}
      </section>
    </div>
  `;
}

export function addLanguageModal({ appConfig, state }) {
  const languageNames = (state.learningLanguages || []).map((item) => item.language);
  const availableLanguages = appConfig.supportedLanguages.filter((language) => !languageNames.includes(language));

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">Language Profile</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Create Language Profile</h2>
      <p class="mt-2 ${ui.muted}">Choose the language, starting level, and who can see this profile.</p>
    </div>
    <form class="mt-6 grid gap-4" data-form="addLanguage">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="${ui.label} sm:col-span-2">
          Language
          <select class="${ui.input}" name="language" required>
            <option value="" disabled selected>Choose a language</option>
            ${availableLanguages.map((language) => `<option>${escapeHtml(language)}</option>`).join("")}
          </select>
        </label>
        <label class="${ui.label}">Current Level<select class="${ui.input}" name="currentLevel">${levelOptions("A1")}</select></label>
        <label class="${ui.label}">Profile Visibility<select class="${ui.input}" name="profileVisibility">${visibilityOptions("Private")}</select></label>
      </div>
      <div class="flex justify-end border-t border-brand-line pt-4">
        <button class="${availableLanguages.length ? ui.primary : `${ui.secondary} opacity-60 pointer-events-none`}">${icon("add")}<span>Create Profile</span></button>
      </div>
    </form>
  `;
}

export function editLanguageModal({ state }, language) {
  const profile = state.learningLanguages.find((item) => item.language === language);
  if (!profile) return `<h2 class="text-2xl font-bold text-brand-ink">Language profile not found</h2>`;
  const isCurrent = profile.language === state.user.targetLanguage;

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">Language Profile</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Edit ${escapeHtml(profile.language)}</h2>
      <p class="mt-2 ${ui.muted}">Update the level and visibility for this language profile.</p>
    </div>
    <form class="mt-6 grid gap-4" data-form="editLanguage">
      <input type="hidden" name="language" value="${escapeHtml(profile.language)}">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="${ui.label}">Current Level<select class="${ui.input}" name="currentLevel">${levelOptions(profile.currentLevel || "A1")}</select></label>
        <label class="${ui.label}">Profile Visibility<select class="${ui.input}" name="profileVisibility">${visibilityOptions(profile.profileVisibility || "Private")}</select></label>
      </div>
      <div class="flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
        <button class="${ui.primary}">${icon("edit")}<span>Save Profile</span></button>
      </div>
    </form>
  `;
}

export const profileView = profileInfoView;

function infoRow(label, value) {
  return `
    <div class="flex items-center justify-between gap-3 rounded-lg bg-brand-mist/70 px-4 py-3">
      <span class="text-sm font-semibold text-brand-graphite">${label}</span>
      <strong class="text-sm text-brand-ink">${escapeHtml(value)}</strong>
    </div>
  `;
}

function infoField(label, value) {
  return `
    <div class="rounded-lg border border-brand-line/70 bg-white/50 p-4">
      <span class="block text-xs font-semibold uppercase text-brand-graphite">${label}</span>
      <strong class="mt-1 block text-lg font-bold text-brand-charcoal">${escapeHtml(value)}</strong>
    </div>
  `;
}

function languageProfileCard({ state, user, languageProfile, selectedLanguage }) {
  const language = languageProfile.language;
  const isSelected = language === user.targetLanguage;
  const languageStories = state.stories.filter((story) => !story.targetLanguage || story.targetLanguage === language);
  const languageGoals = state.goals.filter((goal) => goal.goalScope !== "Global" && goal.targetLanguage === language);
  const completedStories = languageStories.filter((story) => story.completed).length;
  const profileVisibility = languageProfile.profileVisibility || "Private";
  const recentGoals = languageGoals.slice(0, 4);

  return `
    <article class="rounded-lg border p-5 transition ${
      isSelected ? "border-brand-red/35 bg-brand-panel shadow-[0_14px_28px_rgba(29,41,63,.08)]" : "border-brand-line/80 bg-brand-panel/85 hover:border-brand-orange/35"
    }">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="${ui.row}">
            ${language === user.targetLanguage ? `<span class="${ui.tagDark}">Current</span>` : ""}
          </div>
          <h3 class="${language === user.targetLanguage ? "mt-3" : ""} text-2xl font-bold tracking-tight text-brand-ink">${escapeHtml(language)}</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="${ui.secondary}" data-action="openEditLanguageModal:${escapeHtml(language)}">${icon("edit")}<span>Edit</span></button>
          ${language !== user.targetLanguage ? button("Make Current", `makeCurrentLanguage:${language}`, ui.secondary) : ""}
          ${language !== user.targetLanguage ? `<button class="${ui.danger}" data-action="removeLanguage:${escapeHtml(language)}">Remove Profile</button>` : ""}
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        ${infoField("Current level", languageProfile.currentLevel || "A1")}
        ${infoField("Profile visibility", profileVisibility)}
      </div>

      <div class="mt-5 rounded-lg bg-brand-mist/55 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <strong class="text-sm text-brand-charcoal">Story fluency progress</strong>
          <span class="text-sm font-semibold text-brand-red">${completedStories} completed / ${languageStories.length} available</span>
        </div>
        <div class="mt-3">${progressBar(pct(completedStories, languageStories.length))}</div>
      </div>

      <div class="mt-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-semibold uppercase text-brand-graphite">Goals</h4>
          <a class="text-sm font-semibold text-brand-red no-underline hover:text-brand-redDark" href="/app/profile/goals?language=${encodeURIComponent(language)}" data-app-link>My Goals for this language</a>
        </div>
        <div class="mt-3 grid gap-3">
          ${
            recentGoals.length
              ? recentGoals
                  .map(
                    (goal) => `
                      <div class="rounded-lg bg-white/55 p-3">
                        <div class="${ui.row}"><span class="${ui.tag}">${escapeHtml(goal.type)}</span><span class="${ui.tagGold}">${escapeHtml(goal.visibility)}</span>${goal.dueDate ? `<span class="${ui.tagRed}">${escapeHtml(formatDate(goal.dueDate))}</span>` : ""}</div>
                        <h5 class="mt-2 font-bold text-brand-charcoal">${escapeHtml(goal.title)}</h5>
                        <p class="mt-1 text-sm text-brand-graphite">${goal.progress} / ${goal.target}</p>
                        <div class="mt-2">${progressBar(pct(goal.progress, goal.target))}</div>
                      </div>
                    `
                  )
                  .join("")
              : `<p class="${ui.muted}">No goals for this language profile yet.</p>`
          }
        </div>
      </div>
    </article>
  `;
}
