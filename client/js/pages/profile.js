import { button, escapeHtml, formatDate, icon, ui } from "../ui.js";
import { languageName, languageSelectOptions, supportedLanguageOptions } from "../languages.js";
import { languageSkillLevelLabel, languageSkillLevelOptions } from "../levels.js";

const siteLanguageOptions = [
  ["en-US", "English"],
  ["es-ES", "Spanish"],
  ["fr-FR", "French"],
  ["it-IT", "Italian"],
  ["pt-PT", "Portuguese"],
  ["nl-NL", "Dutch"],
  ["de-DE", "German"],
  ["ru-RU", "Russian"],
  ["zh-CN", "Mandarin Chinese"],
  ["ja-JP", "Japanese"],
  ["ko-KR", "Korean"],
  ["th-TH", "Thai"],
  ["id-ID", "Indonesian"],
  ["vi-VN", "Vietnamese"],
  ["ar-SA", "Arabic"]
];

const currencyOptions = [
  ["USD", "USD — US Dollar ($)"],
  ["EUR", "EUR — Euro (€)"],
  ["GBP", "GBP — British Pound (£)"],
  ["JPY", "JPY — Japanese Yen (¥)"],
  ["CNY", "CNY — Chinese Yuan (¥)"],
  ["TWD", "TWD — Taiwan Dollar (NT$)"],
  ["KRW", "KRW — South Korean Won (₩)"],
  ["CAD", "CAD — Canadian Dollar (C$)"],
  ["AUD", "AUD — Australian Dollar (A$)"],
  ["SGD", "SGD — Singapore Dollar (S$)"]
];

function getLanguageContext({ state }) {
  const user = state.user;
  const learningLanguages = state.learningLanguages?.length
    ? state.learningLanguages
    : [];

  return {
    learningLanguages
  };
}

function languageOptions(languages, selected) {
  return languageSelectOptions({ supportedLanguages: languages }, selected);
}

function levelOptions(selected = "A1") {
  return languageSkillLevelOptions(selected);
}

function timezoneOptions(selected = "UTC") {
  const fallbackTimezones = ["America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Taipei", "Asia/Tokyo", "Australia/Sydney"];
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const current = selected && selected !== "UTC" ? selected : resolved && resolved !== "UTC" ? resolved : fallbackTimezones[0];
  const supported = (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : fallbackTimezones).filter((timezone) => timezone !== "UTC");
  const timezones = (supported.includes(current) ? supported : [current, ...supported]).sort((a, b) => a.localeCompare(b));
  return timezones.map((timezone) => `<option value="${escapeHtml(timezone)}" ${timezone === current ? "selected" : ""}>${escapeHtml(timezone)}</option>`).join("");
}

function optionPairs(options, selected = "") {
  return [...options].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function learningLanguageList({ state, appConfig }) {
  const user = state.user;
  const languages = state.learningLanguages?.length
    ? state.learningLanguages
    : [];
  return languages
    .map((item) => `
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-line/70 bg-white/65 p-3">
        <div>
          <strong class="block text-sm text-brand-ink">${escapeHtml(languageName(appConfig, item.language))}</strong>
          <span class="mt-1 block text-xs font-bold text-brand-graphite">${escapeHtml(languageSkillLevelLabel(item.currentLevel || "A1"))}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="${ui.secondary}" data-action="openEditLanguageModal:${escapeHtml(item.language)}">${icon("edit", "h-4 w-4")}<span>Edit</span></button>
          <button class="${ui.danger}" data-action="removeLanguage:${escapeHtml(item.language)}">${icon("trash", "h-4 w-4")}<span>Remove</span></button>
        </div>
      </div>
    `)
    .join("");
}

export function profileInfoView({ state, appConfig }) {
  const user = state.user;
  const avatarPreview = user.avatarUrl
    ? `<img class="h-24 w-24 rounded-full object-cover shadow-sm" src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.displayName)} avatar">`
    : `<div class="grid h-24 w-24 place-items-center rounded-full bg-brand-sidebar text-3xl font-bold text-white">${escapeHtml(user.avatar)}</div>`;

  return `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section class="${ui.card}">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Account details</h2>
            <p class="mt-2 ${ui.muted}">Keep your account identity, preferences, and learning languages updated.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a class="${ui.secondary}" href="/app/profile/subscriptions" data-app-link>${icon("user")}<span>Membership</span></a>
            ${button("Log Out", "logout", ui.secondary)}
          </div>
        </div>

        <form class="mt-6 grid gap-4" data-form="profileInfo">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="${ui.label}">Display Name<input class="${ui.input}" name="displayName" value="${escapeHtml(user.displayName)}" required></label>
            <label class="${ui.label}">Email<input class="${ui.input}" name="email" type="email" value="${escapeHtml(user.email)}" required></label>
            <label class="${ui.label}">Native Language<select class="${ui.input}" name="nativeLanguage" required>${languageOptions(appConfig.supportedLanguages, user.nativeLanguage)}</select></label>
            <label class="${ui.label}">Time Zone<select class="${ui.input}" name="timezone" required>${timezoneOptions(user.timezone || "UTC")}</select></label>
            <label class="${ui.label}">Site Language<select class="${ui.input}" name="siteLanguage" required>${optionPairs(siteLanguageOptions, user.siteLanguage || "en-US")}</select></label>
            <label class="${ui.label}">Currency<select class="${ui.input}" name="currency" required>${optionPairs(currencyOptions, user.currency || "USD")}</select></label>
          </div>
          <label class="${ui.label}">Bio<textarea class="${ui.input} min-h-32 resize-y" name="bio" placeholder="Tell the community what you are practicing.">${escapeHtml(user.bio || "")}</textarea></label>
          <div class="flex flex-wrap gap-2">
            <button class="${ui.primary}">${icon("edit")}<span>Save Info</span></button>
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
          ${infoRow("Native language", languageName(appConfig, user.nativeLanguage))}
          <div class="rounded-lg bg-brand-mist/70 px-4 py-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm font-semibold text-brand-graphite">Languages I'm learning</span>
              <button class="${ui.secondary} px-3 py-1.5 text-xs" data-action="openAddLanguageModal">${icon("add", "h-3.5 w-3.5")}<span>Add</span></button>
            </div>
            <div class="mt-3 grid gap-2">${learningLanguageList({ state, appConfig })}</div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function accountInfoRow(label, value) {
  return `
    <div class="rounded-lg border border-brand-line/70 bg-white/60 p-3">
      <span class="block text-xs font-bold uppercase text-brand-graphite">${escapeHtml(label)}</span>
      <strong class="mt-1 block text-sm text-brand-ink">${escapeHtml(value || "Not set")}</strong>
    </div>
  `;
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function dateValue(value) {
  return value ? formatDate(String(value).slice(0, 10)) : "";
}

function teacherProfileStatusLabel(status = "") {
  if (status === "published") return "Active";
  if (status === "paused" || status === "archived") return "Disabled";
  return "Awaiting approval";
}

function teacherProfileStatusTone(status = "") {
  if (status === "published") return ui.tagGold;
  if (status === "paused" || status === "archived") return ui.tagRed;
  return ui.tag;
}

export function subscriptionsView({ state, teacherStudentData = {}, accountBillingData = {}, appPath }) {
  const user = state.user || {};
  const subscription = state.subscription || user.subscription || {};
  const account = accountBillingData.account || subscription.account || user.account || {};
  const invoices = accountBillingData.invoices || [];
  const paymentMethods = accountBillingData.paymentMethods || [];
  const billingHistory = accountBillingData.billingHistory || [];
  const teacherProfiles = teacherStudentData.profiles || [];
  const disabledStates = new Set(["disabled", "cancelled", "canceled", "deactivated", "inactive"]);
  const accountStatus = disabledStates.has(String(account.accountState || "").toLowerCase()) ? "disabled" : "active";
  const freeMembershipFeatures = ["Create an account", "Browse teachers", "Book lessons anytime", "Join the community"];
  return `
    <div class="grid gap-5">
      <section class="${ui.card}">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-brand-ink">Subscriptions</h2>
            <p class="mt-2 ${ui.muted}">Review account status, membership access, trial state, and billing history.</p>
          </div>
          <a class="${ui.secondary}" href="/app/profile/my-info" data-app-link>${icon("arrowLeft")}<span>My Account</span></a>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section class="rounded-lg border border-brand-line/70 bg-white/65 p-4">
            <span class="${accountStatus === "active" ? ui.tagGold : ui.tagRed}">${accountStatus}</span>
            <h3 class="mt-3 text-2xl font-bold text-brand-ink">Free Membership</h3>
            <div class="mt-4 grid gap-2">
              ${freeMembershipFeatures.map((feature) => `
                <div class="flex items-center gap-2 text-sm font-semibold text-brand-charcoal">
                  ${icon("check", "h-4 w-4 text-brand-redDark")}
                  <span>${escapeHtml(feature)}</span>
                </div>
              `).join("")}
            </div>
          </section>

          <aside class="rounded-lg border border-brand-line/70 bg-brand-snow p-4">
            <span class="${ui.tagDark}">Teacher Profile</span>
            <h3 class="mt-3 text-xl font-bold text-brand-ink">${teacherProfiles.length ? "Your teacher profiles" : "Start teaching"}</h3>
            ${
              teacherProfiles.length
                ? `<div class="mt-4 grid gap-3">
                    ${teacherProfiles.slice(0, 3).map((profile) => `
                      <article class="rounded-lg border border-brand-line/70 bg-white/70 p-3">
                        <span class="${teacherProfileStatusTone(profile.status)}">${escapeHtml(teacherProfileStatusLabel(profile.status))}</span>
                        <h4 class="mt-2 font-bold text-brand-ink">${escapeHtml(profile.displayName)}</h4>
                        <p class="mt-1 line-clamp-2 text-sm text-brand-graphite">${escapeHtml(profile.headline || "")}</p>
                        ${profile.status === "draft" ? `<p class="mt-2 text-xs font-semibold text-brand-graphite">Approval typically takes 1 - 2 days.</p>` : ""}
                        <div class="mt-3 flex justify-end">
                          <a class="${ui.secondary} px-3 py-1.5 text-xs" href="${escapeHtml(appPath("teacherProfileEdit", { teacherProfileId: profile.id }))}" data-app-link>${icon("edit", "h-3.5 w-3.5")}<span>Edit</span></a>
                        </div>
                      </article>
                    `).join("")}
                  </div>
                  <a class="${ui.primary} mt-4 w-full justify-center" href="${escapeHtml(appPath("teacherProfileCreate"))}" data-app-link>${icon("add", "h-4 w-4")}<span>Add Teacher Profile</span></a>`
                : `<p class="mt-2 text-sm font-semibold leading-6 text-brand-graphite">Create a teacher profile for admin review. Once approved, your active profile can appear on Find a Teacher.</p>
                  <a class="${ui.primary} mt-4 w-full justify-center" href="${escapeHtml(appPath("teacherProfileCreate"))}" data-app-link>${icon("add", "h-4 w-4")}<span>Create a teacher profile...</span></a>`
            }
          </aside>
        </div>
      </section>

      <section class="${ui.card}">
        <div class="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 class="text-xl font-bold text-brand-ink">Payment methods</h3>
            <div class="mt-3 grid gap-2">
              ${paymentMethods.length ? paymentMethods.map((method) => accountInfoRow(method.isDefault ? "Default method" : "Payment method", `${method.brand || "Card"} ${method.last4 ? `ending ${method.last4}` : method.providerPaymentMethodId}`)).join("") : `<p class="${ui.muted}">No saved payment method. Use Stripe billing settings when available to add or replace a tokenized payment method.</p>`}
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold text-brand-ink">Invoices</h3>
            <div class="mt-3 grid gap-2">
              ${invoices.length ? invoices.map((invoice) => accountInfoRow(invoice.status, `${money(invoice.amountPaidUsd)} paid ${invoice.hostedInvoiceUrl ? "- invoice available" : ""}`)).join("") : `<p class="${ui.muted}">No invoices yet.</p>`}
            </div>
          </div>
        </div>
      </section>

      <section class="${ui.card}">
        <h3 class="text-xl font-bold text-brand-ink">Billing history</h3>
        <div class="mt-3 grid gap-2">
          ${billingHistory.length ? billingHistory.map((event) => accountInfoRow(event.eventType, dateValue(event.createdAt))).join("") : `<p class="${ui.muted}">No billing events yet.</p>`}
        </div>
      </section>

      <section class="rounded-lg border border-brand-red/20 bg-brand-red/10 p-5">
        <span class="${ui.tagRed}">Danger zone</span>
        <h3 class="mt-3 text-xl font-bold text-brand-ink">Delete Account</h3>
        <p class="mt-2 ${ui.muted}">Permanently delete your account, profile picture, learning languages, community posts, comments, messages, and lesson activity.</p>
        <div class="mt-4 flex justify-end">
          ${button("Delete Account", "openDeleteProfileModal", ui.danger)}
        </div>
      </section>
    </div>
  `;
}

export function deleteProfileConfirmModal({ state }) {
  return `
    <div>
      <span class="${ui.tagRed}">Delete Account</span>
      <h2 class="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-ink">${icon("trash", "h-5 w-5 text-brand-redDark")}<span>Delete your account?</span></h2>
      <p class="mt-2 ${ui.muted}">This permanently deletes ${escapeHtml(state.user.displayName)}'s account, profile picture, learning languages, community posts, comments, messages, and lesson activity. This cannot be undone.</p>
      <div class="mt-5 rounded-lg border border-brand-red/20 bg-brand-red/10 p-4">
        <p class="text-sm font-semibold leading-6 text-brand-redDark">Only continue if you are sure you no longer need this LinguaStories profile.</p>
      </div>
      <div class="mt-6 flex justify-end border-t border-brand-line pt-4">
        <button class="${ui.danger}" data-action="confirmDeleteProfile">${icon("trash", "h-4 w-4")}<span>Delete Account</span></button>
      </div>
    </div>
  `;
}

export function languageProfilesView({ state, appConfig }) {
  const user = state.user;
  const { learningLanguages } = getLanguageContext({ state });
  const languageNames = learningLanguages.map((item) => item.language);
  const availableLanguages = supportedLanguageOptions(appConfig).filter((language) => !languageNames.includes(language.code));
  const maxLearningLanguages = 10;
  const canAddProfile = learningLanguages.length < maxLearningLanguages;

  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Languages I'm learning</h2>
            <p class="mt-1 ${ui.muted}">Manage up to 10 learning languages.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${canAddProfile ? `<button class="${ui.primary}" data-action="openAddLanguageModal">${icon("add")}<span>Add Language</span></button>` : ""}
          </div>
        </div>
        <div class="mt-5 grid gap-4 xl:grid-cols-2">
          ${learningLanguages.length ? learningLanguages.map((languageProfile) => languageProfileCard({ state, appConfig, user, languageProfile })).join("") : `<div class="rounded-lg border border-dashed border-brand-line bg-white/55 p-8 text-center text-sm font-semibold text-brand-graphite xl:col-span-2">No learning languages added yet.</div>`}
        </div>
      </section>
    </div>
  `;
}

export function myProfilesView({ state, appConfig, myProfilesTab = "languages", teacherProfilesContent = "" }) {
  const tabs = [
    ["languages", "Languages I'm learning", "globe"],
    ["teachers", "My Teacher Profiles", "user"]
  ];
  const activeTab = tabs.some(([id]) => id === myProfilesTab) ? myProfilesTab : "languages";
  return `
    <div class="grid gap-5">
      ${tabs.length > 1 ? `
        <section class="flex flex-wrap justify-end gap-2" role="tablist" aria-label="My profile views">
          ${tabs.map(([id, label, iconName]) => `
            <button class="${activeTab === id ? ui.primary : ui.secondary}" data-action="setMyProfilesTab:${id}" role="tab" aria-selected="${activeTab === id ? "true" : "false"}">${icon(iconName, "h-4 w-4")}<span>${label}</span></button>
          `).join("")}
        </section>
      ` : ""}
      ${activeTab === "teachers" ? teacherProfilesContent : languageProfilesView({ state, appConfig })}
    </div>
  `;
}

export function addLanguageModal({ appConfig, state }) {
  const languageNames = (state.learningLanguages || []).map((item) => item.language);
  const availableLanguages = supportedLanguageOptions(appConfig).filter((language) => !languageNames.includes(language.code));

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">Learning Language</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Add Learning Language</h2>
      <p class="mt-2 ${ui.muted}">Choose the language and starting level.</p>
    </div>
    <form class="mt-6 grid gap-4" data-form="addLanguage">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="${ui.label} sm:col-span-2">
          Language
          <select class="${ui.input}" name="language" required>
            <option value="" disabled selected>Choose a language</option>
            ${availableLanguages.map((language) => `<option value="${escapeHtml(language.code)}">${escapeHtml(language.name)}</option>`).join("")}
          </select>
        </label>
        <label class="${ui.label}">Skill Level<select class="${ui.input}" name="currentLevel">${levelOptions("A1")}</select></label>
      </div>
      <div class="flex justify-end border-t border-brand-line pt-4">
        <button class="${availableLanguages.length ? ui.primary : `${ui.secondary} opacity-60 pointer-events-none`}">${icon("add")}<span>Add Language</span></button>
      </div>
    </form>
  `;
}

export function editLanguageModal({ state, appConfig }, language) {
  const profile = state.learningLanguages.find((item) => item.language === language);
  if (!profile) return `<h2 class="text-2xl font-bold text-brand-ink">Language not found</h2>`;

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">Learning Language</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Edit ${escapeHtml(languageName(appConfig, profile.language))}</h2>
      <p class="mt-2 ${ui.muted}">Update the skill level for this language.</p>
    </div>
    <form class="mt-6 grid gap-4" data-form="editLanguage">
      <input type="hidden" name="language" value="${escapeHtml(profile.language)}">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="${ui.label}">Skill Level<select class="${ui.input}" name="currentLevel">${levelOptions(profile.currentLevel || "A1")}</select></label>
      </div>
      <div class="flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
        <button class="${ui.primary}">${icon("edit")}<span>Save Language</span></button>
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

function languageProfileCard({ state, appConfig, user, languageProfile }) {
  const language = languageProfile.language;
  const displayLanguage = languageName(appConfig, language);
  const profileVisibility = languageProfile.profileVisibility || "Private";
  const capabilities = state.subscription?.capabilities || user.subscription?.capabilities || {};
  const canEditProfiles = Boolean(capabilities.canEditLanguageProfiles);
  const canDeleteProfiles = Boolean(capabilities.canDeleteLanguageProfiles);

  return `
    <article class="rounded-lg border border-brand-line/80 bg-brand-panel/85 p-5 transition hover:border-brand-orange/35">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-2xl font-bold tracking-tight text-brand-ink">${escapeHtml(displayLanguage)}</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          ${canEditProfiles ? `<button class="${ui.secondary}" data-action="openEditLanguageModal:${escapeHtml(language)}">${icon("edit")}<span>Edit</span></button>` : ""}
          ${canDeleteProfiles ? `<button class="${ui.danger}" data-action="removeLanguage:${escapeHtml(language)}">Remove</button>` : ""}
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        ${infoField("Skill level", languageSkillLevelLabel(languageProfile.currentLevel || "A1"))}
        ${infoField("Visibility", profileVisibility)}
      </div>

      <div class="mt-5 rounded-lg bg-brand-mist/55 p-4">
        <strong class="text-sm text-brand-charcoal">Practice focus</strong>
        <p class="mt-2 text-sm leading-6 text-brand-graphite">Use this language to track what you are learning and share it on your account.</p>
      </div>
    </article>
  `;
}
