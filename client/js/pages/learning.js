import { escapeHtml, icon, ui } from "../ui.js";
import { languageMultiSelectOptions, languageName, languageSelectOptions } from "../languages.js";
import { languageSkillLevelLabel, languageSkillLevelOptions } from "../levels.js";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fallbackTimezones = ["America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Taipei", "Asia/Tokyo", "Australia/Sydney"];
const JOIN_EARLY_MINUTES = 5;
const JOIN_LATE_MINUTES = 15;
const CLASSROOM_READY_STATUSES = new Set(["confirmed", "rescheduled", "active"]);
const PAYOUT_SETUP_DISABLED = true;
const countryCodes = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CD", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "KP", "MK", "NO", "OM", "PK", "PW", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO", "RU", "RW", "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "KR", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VA", "VE", "VN", "YE", "ZM", "ZW"
];

function alphabetize(items, label = (item) => item) {
  return [...items].sort((a, b) => String(label(a)).localeCompare(String(label(b))));
}

function profileOptions(profiles = [], selected = "", placeholder = "") {
  const options = alphabetize(profiles, (profile) => profile.displayName).map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === selected ? "selected" : ""}>${escapeHtml(profile.displayName)}</option>`);
  if (placeholder) options.unshift(`<option value="">${escapeHtml(placeholder)}</option>`);
  return options.join("");
}

function optionPairs(options, selected = "", placeholder = "") {
  const choices = alphabetize(options, ([, label]) => label).map(([value, label]) => `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(label)}</option>`);
  if (placeholder) choices.unshift(`<option value="">${escapeHtml(placeholder)}</option>`);
  return choices.join("");
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function dateTime(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function dateTimeShort(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function classroomAvailability(lesson = {}) {
  if (!CLASSROOM_READY_STATUSES.has(lesson.status) || lesson.paymentStatus !== "paid") return { available: false, label: "" };
  const startsAt = new Date(lesson.startsAt).getTime();
  const endsAt = new Date(lesson.endsAt).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return { available: false, label: "" };
  const now = Date.now();
  const opensAt = startsAt - JOIN_EARLY_MINUTES * 60 * 1000;
  const closesAt = endsAt + JOIN_LATE_MINUTES * 60 * 1000;
  if (now < opensAt) return { available: false, label: `Opens ${dateTimeShort(opensAt)}` };
  if (now > closesAt) return { available: false, label: "Classroom closed" };
  return { available: true, label: "" };
}

function classroomAction(lesson = {}, currentUserId = "", className = ui.secondary) {
  const classroomLabel = currentUserId && lesson.teacherUserId === currentUserId ? "Start" : "Join";
  const availability = classroomAvailability(lesson);
  if (availability.available) {
    return `<a class="${className}" href="/app/learning/classroom/${escapeHtml(lesson.id)}" target="_blank" rel="noopener">${icon("video", "h-4 w-4")}<span>${classroomLabel}</span></a>`;
  }
  return availability.label ? `<span class="${ui.tag}">${escapeHtml(availability.label)}</span>` : "";
}

function introVideoEmbedUrl(profile = {}) {
  if (!profile.videoIntroUrl) return "";
  try {
    const url = new URL(profile.videoIntroUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
    }
    if (hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") || (url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : "");
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : "";
    }
    if (hostname.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : "";
    }
  } catch (_error) {
    return "";
  }
  return "";
}

function teacherIntroVideoCard(profile = {}) {
  const embedUrl = introVideoEmbedUrl(profile);
  return `
    <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
      ${teacherCardTitle("video", "Intro Video")}
      ${
        embedUrl
          ? `<div class="mt-3 overflow-hidden rounded-lg border border-brand-line bg-brand-ink">
              <iframe class="aspect-video w-full" src="${escapeHtml(embedUrl)}" title="${escapeHtml(profile.displayName || "Teacher")} intro video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
            </div>`
          : `<div class="mt-3 grid aspect-video place-items-center rounded-lg border border-dashed border-brand-line bg-brand-snow p-4 text-center text-sm font-semibold text-brand-graphite">No intro video listed.</div>`
      }
    </div>
  `;
}

function teacherCardTitle(iconName, title) {
  return `
    <h3 class="flex items-center gap-2 font-bold text-brand-ink">
      <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-mist text-brand-redDark ring-1 ring-brand-line/70">${icon(iconName, "h-4 w-4")}</span>
      <span>${escapeHtml(title)}</span>
    </h3>
  `;
}

function payoutAccountStatus(account = {}) {
  if (!account.configured) return { tone: ui.tagRed, label: "Stripe not configured", body: "Stripe needs to be configured before teacher payouts can be set up." };
  if (account.ready) return { tone: ui.tagGold, label: "Payouts ready", body: "Student payments can be routed to your teacher payout account." };
  if (account.stripeAccountId) return { tone: ui.tag, label: "Payout setup pending", body: "Finish Stripe payout onboarding before students can book paid lessons." };
  return { tone: ui.tagRed, label: "Payout setup required", body: "Set up teacher payouts before students can book paid lessons." };
}

function teacherPayoutPanel(account = {}) {
  const status = payoutAccountStatus(account);
  const requirements = Array.isArray(account.requirementsDue) ? account.requirementsDue : [];
  return `
    <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span class="${status.tone}">${escapeHtml(status.label)}</span>
          <h3 class="mt-3 text-2xl font-bold text-brand-ink">Teacher payouts</h3>
          <p class="mt-1 ${ui.muted}">${escapeHtml(status.body)}</p>
          ${requirements.length ? `<p class="mt-2 text-xs font-semibold text-brand-graphite">Stripe still needs: ${escapeHtml(requirements.slice(0, 4).join(", "))}${requirements.length > 4 ? "..." : ""}</p>` : ""}
          ${account.disabledReason ? `<p class="mt-2 text-xs font-semibold text-brand-redDark">${escapeHtml(account.disabledReason)}</p>` : ""}
        </div>
        <div class="flex flex-wrap gap-2">
          ${!account.configured ? "" : account.ready ? `<button class="${ui.secondary}" data-action="syncTeacherPayoutAccount">${icon("check", "h-4 w-4")}<span>Refresh status</span></button>` : `<button class="${ui.primary}" data-action="startTeacherPayoutOnboarding">${icon("arrow-right", "h-4 w-4")}<span>${account.stripeAccountId ? "Continue payout setup" : "Set up payouts"}</span></button>`}
          ${account.stripeAccountId && !account.ready ? `<button class="${ui.secondary}" data-action="syncTeacherPayoutAccount">${icon("check", "h-4 w-4")}<span>Refresh status</span></button>` : ""}
        </div>
      </div>
    </section>
  `;
}

function languageOptions(appConfig, selected = "") {
  return languageSelectOptions(appConfig, selected);
}

function languageFilterOptions(appConfig, selected = "", placeholder = "Any language") {
  return `<option value="">${escapeHtml(placeholder)}</option>${languageSelectOptions(appConfig, selected)}`;
}

function languageMultiOptions(appConfig, selected = []) {
  return languageMultiSelectOptions(appConfig, selected);
}

function levelOptions(selected = "A1") {
  return languageSkillLevelOptions(selected);
}

function teacherLanguageRow({ appConfig, role, language = "", level = "A1" }) {
  return `
    <div class="grid gap-2 rounded-lg border border-brand-line/70 bg-white/65 p-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end" data-teacher-language-row="${escapeHtml(role)}">
      <label class="${ui.label}">Language<select class="${ui.input}" name="${escapeHtml(role)}Language">${languageOptions(appConfig, language)}</select></label>
      <label class="${ui.label}">Skill level<select class="${ui.input}" name="${escapeHtml(role)}Level">${levelOptions(level || "A1")}</select></label>
      <button class="${ui.secondary} min-h-11" type="button" data-action="removeTeacherLanguageRow">${icon("trash-2", "h-4 w-4")}<span>Remove</span></button>
    </div>
  `;
}

function teacherLanguagePanel({ appConfig, role, title, items = [], fallbackLanguage = "", fallbackLevel = "A1" }) {
  const rows = items.length ? items : [{ language: fallbackLanguage, cefrLevel: fallbackLevel }].filter((item) => item.language);
  return `
    <section class="rounded-lg border border-brand-line/70 bg-brand-snow p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold uppercase text-brand-graphite">${escapeHtml(title)}</h3>
          <p class="mt-1 text-xs font-semibold text-brand-graphite">Add each language with its own skill level.</p>
        </div>
        <button class="${ui.secondary} px-3 py-2 text-xs" type="button" data-action="addTeacherLanguageRow:${escapeHtml(role)}">${icon("plus", "h-3.5 w-3.5")}<span>Add</span></button>
      </div>
      <div class="mt-3 grid gap-2" data-teacher-language-list="${escapeHtml(role)}" data-empty-language="${escapeHtml(fallbackLanguage)}">
        ${(rows.length ? rows : [{ language: "", cefrLevel: fallbackLevel }]).map((item) => teacherLanguageRow({ appConfig, role, language: item.language, level: item.cefrLevel || fallbackLevel })).join("")}
      </div>
    </section>
  `;
}

function tagChips(tags = []) {
  return tags.map((tag) => `
    <span class="inline-flex items-center gap-1 rounded-full bg-brand-mist px-3 py-1 text-xs font-bold text-brand-charcoal" data-teacher-tag="${escapeHtml(tag)}">
      <span>${escapeHtml(tag)}</span>
      <button class="text-brand-redDark" type="button" data-action="removeTeacherTag" data-tag="${escapeHtml(tag)}" aria-label="Remove ${escapeHtml(tag)}">x</button>
    </span>
  `).join("");
}

function timezoneOptions(selected = "UTC") {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const current = selected && selected !== "UTC" ? selected : resolved && resolved !== "UTC" ? resolved : fallbackTimezones[0];
  const supported = (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : fallbackTimezones).filter((timezone) => timezone !== "UTC");
  const timezones = alphabetize(supported.includes(current) ? supported : [current, ...supported]);
  return timezones.map((timezone) => `<option value="${escapeHtml(timezone)}" ${timezone === current ? "selected" : ""}>${escapeHtml(timezone)}</option>`).join("");
}

function timezoneSelect(selected) {
  return `<select class="${ui.input}" name="timezone" required>${timezoneOptions(selected)}</select>`;
}

function countryFilterOptions(countries = [], selected = "") {
  return `<option value="">Any country</option>${alphabetize(countries).map((country) => `<option value="${escapeHtml(country)}" ${country === selected ? "selected" : ""}>${escapeHtml(country)}</option>`).join("")}`;
}

function countryOptions(selected = "") {
  const displayNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
  return `<option value="">Choose country</option>${countryCodes
    .map((code) => displayNames?.of(code) || code)
    .sort((a, b) => a.localeCompare(b))
    .map((country) => `<option value="${escapeHtml(country)}" ${country === selected ? "selected" : ""}>${escapeHtml(country)}</option>`)
    .join("")}`;
}

function toggleFilter({ name, label, checked = false }) {
  return `
    <label class="flex min-h-11 items-center gap-2 rounded-lg border border-brand-line/70 bg-white/70 px-3 py-2 text-sm font-semibold text-brand-charcoal">
      <input class="h-5 w-5 accent-brand-red" type="checkbox" name="${escapeHtml(name)}" value="true" ${checked ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function profileImage(profile, size = "h-20 w-20") {
  if (profile.avatarUrl) return `<img class="${size} rounded-lg object-cover" src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName || profile.teacherName || "Teacher")}">`;
  return `<div class="grid ${size} place-items-center rounded-lg bg-brand-sidebar text-sm font-bold text-white">${escapeHtml(profile.avatar || String(profile.displayName || profile.teacherName || "?").slice(0, 2))}</div>`;
}

function teacherLanguageList(appConfig, languages = [], role = "teaches") {
  const items = languages.filter((item) => item.role === role);
  if (!items.length) return `<p class="${ui.muted}">Not listed yet.</p>`;
  return `
    <div class="mt-3 flex flex-wrap gap-2">
      ${items.map((item) => `<span class="${ui.tag}">${escapeHtml(languageName(appConfig, item.language))} · ${escapeHtml(languageSkillLevelLabel(item.cefrLevel || "A1"))}</span>`).join("")}
    </div>
  `;
}

function teacherTutorType(profile = {}) {
  return profile.professionalTutor ? "Professional Tutor / Teacher" : "Community Practice Tutor";
}

function teacherPracticeFocus(profile = {}) {
  return profile.speakingPracticeOnly ? "Only Practice Speaking Tutor" : "Structured lessons";
}

function teacherTextSection(title, body) {
  if (!body) return "";
  const iconName = title === "Teaching style" ? "hand-coins" : title === "Experience" ? "book-open" : title === "Certifications" ? "trophy" : "bookmark";
  return `
    <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
      ${teacherCardTitle(iconName, title)}
      <p class="mt-2 whitespace-pre-line text-sm leading-7 text-brand-graphite">${escapeHtml(body)}</p>
    </div>
  `;
}

function teacherProfileTags(tags = []) {
  if (!tags.length) return `<p class="${ui.muted}">No tags listed.</p>`;
  return `
    <div class="mt-3 flex flex-wrap gap-2">
      ${tags.map((tag) => `<span class="${ui.tag}">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function detailBadge({ iconName, label, value, tone = "default" }) {
  const toneClass = tone === "gold"
    ? "bg-brand-mist text-brand-brown ring-brand-line/70"
    : tone === "red"
      ? "bg-brand-red/10 text-brand-redDark ring-brand-red/15"
      : tone === "dark"
        ? "bg-brand-sidebar text-white ring-brand-sidebar/25"
        : "bg-white/70 text-brand-charcoal ring-brand-line/80";
  return `
    <span class="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${toneClass} ring-1">
      ${icon(iconName, "h-4 w-4")}
      <span class="grid gap-0.5">
        <span class="text-[10px] uppercase tracking-[.12em] opacity-70">${escapeHtml(label)}</span>
        <span>${escapeHtml(value)}</span>
      </span>
    </span>
  `;
}

function emptyState(title, body) {
  return `
    <div class="rounded-lg border border-dashed border-brand-line bg-white/55 p-8 text-center">
      <div class="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-brand-mist text-brand-redDark">${icon("book-open", "h-5 w-5")}</div>
      <h3 class="mt-4 text-lg font-bold text-brand-ink">${escapeHtml(title)}</h3>
      <p class="mt-2 ${ui.muted}">${escapeHtml(body)}</p>
    </div>
  `;
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

function isDisabledTeacherProfile(status = "") {
  return status === "paused" || status === "archived";
}

export function findTeacherView({ appPath, appConfig, state, teacherStudentData = {}, teacherStudentFilters = {} }) {
  const teachers = teacherStudentData.teachers || [];
  const filterOptions = teacherStudentData.filterOptions || {};
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span class="${ui.tagGold}">Live lessons</span>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">Search Teachers</h2>
            <p class="mt-2 ${ui.muted}">Book paid live lessons with professional teachers. Lesson payments are handled through Stripe.</p>
          </div>
        </div>
        <form class="mt-5 grid gap-3" data-form="teacherSearch">
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(150px,1fr))_120px]">
            <input class="${ui.input}" name="q" value="${escapeHtml(teacherStudentFilters.q || "")}" placeholder="Search by name, goal, or style">
            <select class="${ui.input}" name="language" aria-label="Language taught">${languageFilterOptions(appConfig, teacherStudentFilters.language || "", "Any taught language")}</select>
            <select class="${ui.input}" name="countryOfBirth" aria-label="Country of birth">${countryFilterOptions(filterOptions.countries || [], teacherStudentFilters.countryOfBirth || "")}</select>
            <select class="${ui.input}" name="speaksLanguage" aria-label="Also speaks">${languageFilterOptions(appConfig, teacherStudentFilters.speaksLanguage || "", "Also speaks")}</select>
            <input class="${ui.input}" name="maxRate" type="number" min="1" step="1" value="${escapeHtml(teacherStudentFilters.maxRate || "")}" placeholder="Max $/hr">
            <button class="${ui.primary}">${icon("search", "h-4 w-4")}<span>Search</span></button>
          </div>
          <div class="grid gap-2 md:grid-cols-3">
            ${toggleFilter({ name: "nativeSpeaker", label: "Native speaker", checked: teacherStudentFilters.nativeSpeaker === "true" })}
            ${toggleFilter({ name: "professionalTutor", label: "Professional Tutor (Teacher)", checked: teacherStudentFilters.professionalTutor === "true" })}
            ${toggleFilter({ name: "speakingPracticeOnly", label: "Only Practice Speaking Tutor", checked: teacherStudentFilters.speakingPracticeOnly === "true" })}
          </div>
        </form>
      </section>
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${
          teachers.length
            ? teachers.map((teacher) => `
              <article class="rounded-lg border border-brand-line bg-brand-panel p-5 shadow-sm">
                <div class="flex gap-4">
                  ${profileImage(teacher, "h-16 w-16")}
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-lg font-bold text-brand-ink">${escapeHtml(teacher.displayName)}</h3>
                    <p class="mt-1 line-clamp-2 text-sm font-semibold text-brand-charcoal">${escapeHtml(teacher.headline)}</p>
                    <p class="mt-2 text-xs font-bold text-brand-graphite">${teacher.averageRating ? `${teacher.averageRating.toFixed(1)} stars · ` : ""}${teacher.reviewCount} reviews</p>
                  </div>
                </div>
                <p class="mt-4 line-clamp-3 text-sm leading-6 text-brand-graphite">${escapeHtml(teacher.bio)}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                  ${(teacher.languages || []).filter((item) => item.role === "teaches").slice(0, 3).map((item) => `<span class="${ui.tag}">${escapeHtml(languageName(appConfig, item.language))}</span>`).join("")}
                  ${teacher.nativeLanguage ? `<span class="${ui.tag}">Native ${escapeHtml(languageName(appConfig, teacher.nativeLanguage))}</span>` : ""}
                  ${teacher.country ? `<span class="${ui.tag}">${escapeHtml(teacher.country)}</span>` : ""}
                  ${teacher.professionalTutor ? `<span class="${ui.tagGold}">Professional tutor</span>` : ""}
                  ${teacher.speakingPracticeOnly ? `<span class="${ui.tag}">Speaking practice</span>` : ""}
                  <span class="${ui.tagGold}">${money(teacher.hourlyRateUsd)}/hr</span>
                </div>
                <div class="mt-5 flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
                  <button class="${ui.secondary}" data-action="messageTeacher:${escapeHtml(teacher.userId)}:${escapeHtml(teacher.id)}">${icon("message-circle", "h-4 w-4")}<span>Message</span></button>
                  <a class="${ui.secondary}" href="/app/learning/teacher-profile/${escapeHtml(teacher.id)}" data-app-link>${icon("user", "h-4 w-4")}<span>View</span></a>
                  ${PAYOUT_SETUP_DISABLED || teacher.payoutAccount?.ready ? `<a class="${ui.primary}" href="${escapeHtml(appPath("bookLesson", { teacherProfileId: teacher.id }))}" data-app-link>${icon("book-open", "h-4 w-4")}<span>Book</span></a>` : `<span class="${ui.tag}">Payout setup pending</span>`}
                </div>
              </article>
            `).join("")
            : emptyState("No teachers yet", "Try a broader search or create a teacher profile.")
        }
      </section>
    </div>
  `;
}

export function teacherProfileDetailView({ activeTeacherProfileId, appConfig, appPath, teacherStudentData = {}, state }) {
  const profile = teacherStudentData.profile;
  if (!profile || profile.id !== activeTeacherProfileId) return emptyState("Loading teacher", "Teacher details will appear here.");
  const reviews = teacherStudentData.reviews || [];
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex gap-4">
            ${profileImage(profile, "h-24 w-24")}
            <div>
              <span class="${ui.tagGold}">${profile.averageRating ? `${profile.averageRating.toFixed(1)} stars` : "New teacher"}</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">${escapeHtml(profile.displayName)}</h2>
              <p class="mt-2 text-lg font-semibold text-brand-charcoal">${escapeHtml(profile.headline)}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button class="${ui.secondary}" data-action="messageTeacher:${escapeHtml(profile.userId)}:${escapeHtml(profile.id)}">${icon("message-circle", "h-4 w-4")}<span>Message</span></button>
            ${PAYOUT_SETUP_DISABLED || profile.payoutAccount?.ready ? `<a class="${ui.primary}" href="${escapeHtml(appPath("bookLesson", { teacherProfileId: profile.id }))}" data-app-link>${icon("book-open", "h-4 w-4")}<span>Book Lesson</span></a>` : `<span class="${ui.tag}">Payout setup pending</span>`}
          </div>
        </div>
        <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          ${teacherIntroVideoCard(profile)}
          <aside class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
            ${teacherCardTitle("book-user", "Tutor details")}
            <div class="mt-3 flex flex-wrap gap-2">
              ${detailBadge({ iconName: profile.professionalTutor ? "trophy" : "users", label: "Tutor type", value: teacherTutorType(profile), tone: profile.professionalTutor ? "gold" : "default" })}
              ${detailBadge({ iconName: profile.speakingPracticeOnly ? "mic" : "book-open", label: "Focus", value: teacherPracticeFocus(profile), tone: profile.speakingPracticeOnly ? "red" : "dark" })}
              ${detailBadge({ iconName: "users", label: "Students taught", value: Number(profile.studentCount || 0).toLocaleString(), tone: Number(profile.studentCount || 0) > 0 ? "gold" : "default" })}
            </div>
            <div class="mt-5 border-t border-brand-line pt-4">
              ${teacherCardTitle("calendar", "Booking")}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              ${detailBadge({ iconName: "clock", label: "Lessons", value: `${profile.minLessonMinutes}-${profile.maxLessonMinutes} minutes`, tone: "default" })}
              ${detailBadge({ iconName: "banknote-check", label: "Trial", value: profile.trialRateUsd === null ? "Not listed" : money(profile.trialRateUsd), tone: profile.trialRateUsd === null ? "default" : "gold" })}
              ${detailBadge({ iconName: "coins", label: "Booking Price", value: `${money(profile.hourlyRateUsd)}/hr`, tone: "gold" })}
              ${detailBadge({ iconName: "users", label: "Group lessons", value: profile.groupLessonEnabled ? "Available" : "Not available", tone: profile.groupLessonEnabled ? "red" : "default" })}
            </div>
          </aside>
          <div class="grid gap-4 lg:col-start-1">
            <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">${teacherCardTitle("user", "About")}<p class="mt-2 text-sm leading-7 text-brand-graphite">${escapeHtml(profile.bio)}</p></div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
                ${teacherCardTitle("book-open-text", "Teaches")}
                ${teacherLanguageList(appConfig, profile.languages || [], "teaches")}
              </div>
              <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
                ${teacherCardTitle("mic-vocal", "Speaks")}
                ${teacherLanguageList(appConfig, profile.languages || [], "speaks")}
              </div>
            </div>
            ${teacherTextSection("Teaching style", profile.teachingStyle)}
            ${teacherTextSection("Experience", profile.experienceSummary)}
            ${teacherTextSection("Certifications", profile.certifications)}
            <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
              ${teacherCardTitle("tags", "Tags")}
              ${teacherProfileTags(profile.tags || [])}
            </div>
            <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4">${teacherCardTitle("star", "Reviews")}<div class="mt-3 grid gap-3">${reviews.length ? reviews.map((review) => `<article class="rounded-lg bg-brand-snow p-3"><strong class="text-sm text-brand-ink">${review.rating} stars · ${escapeHtml(review.studentName)}</strong><p class="mt-1 text-sm text-brand-graphite">${escapeHtml(review.body || "")}</p></article>`).join("") : `<p class="${ui.muted}">No reviews yet.</p>`}</div></div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function teacherProfileForm({ appConfig, state, profile = null }) {
  const teachesLanguages = (profile?.languages || []).filter((item) => item.role === "teaches");
  const speaksLanguages = (profile?.languages || []).filter((item) => item.role === "speaks");
  const tags = profile?.tags || [];
  return `
    <form class="grid gap-3" data-form="${profile ? "teacherProfileEdit" : "teacherProfile"}">
      ${profile ? `<input type="hidden" name="id" value="${escapeHtml(profile.id)}">` : ""}
      <div class="grid gap-3 md:grid-cols-2">
        <label class="${ui.label}">Display name<input class="${ui.input}" name="displayName" required value="${escapeHtml(profile?.displayName || state.user.displayName || "")}"></label>
        <label class="${ui.label}">Headline<input class="${ui.input}" name="headline" required maxlength="160" value="${escapeHtml(profile?.headline || "")}" placeholder="Friendly Japanese conversation coach"></label>
        <label class="${ui.label}">Native language<select class="${ui.input}" name="nativeLanguage">${languageOptions(appConfig, profile?.nativeLanguage || state.user.nativeLanguage || "en-US")}</select></label>
        <label class="${ui.label}">Timezone${timezoneSelect(profile?.timezone)}</label>
        <label class="${ui.label}">Hourly rate USD<input class="${ui.input}" name="hourlyRateUsd" required type="number" min="1" step="0.01" value="${escapeHtml(profile?.hourlyRateUsd || "20")}"></label>
        <label class="${ui.label}">Trial rate USD<input class="${ui.input}" name="trialRateUsd" type="number" min="0" step="0.01" value="${escapeHtml(profile?.trialRateUsd ?? "")}"></label>
        <label class="${ui.label}">Min lesson minutes<input class="${ui.input}" name="minLessonMinutes" type="number" min="15" max="90" step="15" value="${escapeHtml(profile?.minLessonMinutes || "30")}"></label>
        <label class="${ui.label}">Max lesson minutes<input class="${ui.input}" name="maxLessonMinutes" type="number" min="15" max="90" step="15" value="${escapeHtml(profile?.maxLessonMinutes || "60")}"></label>
        <label class="${ui.label}">Group lessons<select class="${ui.input}" name="groupLessonEnabled"><option value="false">Off</option><option value="true" ${profile?.groupLessonEnabled ? "selected" : ""}>On</option></select></label>
        <label class="${ui.label}">Group max students<input class="${ui.input}" name="groupMaxStudents" type="number" min="1" max="8" value="${escapeHtml(profile?.groupMaxStudents || "4")}"></label>
        <label class="${ui.label}">Country of birth<select class="${ui.input}" name="country">${countryOptions(profile?.country || "")}</select></label>
        <label class="${ui.label}">Tutor type<select class="${ui.input}" name="professionalTutor">${optionPairs([["false", "Community Practice Tutor"], ["true", "Professional Tutor (Teacher)"]], profile?.professionalTutor === false ? "false" : "true")}</select></label>
        <label class="${ui.label}">Practice focus<select class="${ui.input}" name="speakingPracticeOnly">${optionPairs([["true", "Only Practice Speaking Tutor"], ["false", "Structured lessons"]], profile?.speakingPracticeOnly ? "true" : "false")}</select></label>
      </div>
      <div class="grid gap-3 lg:grid-cols-2">
        ${teacherLanguagePanel({ appConfig, role: "teaches", title: "Teaches", items: teachesLanguages, fallbackLanguage: state.user.targetLanguage || "", fallbackLevel: state.user.currentLevel || "A1" })}
        ${teacherLanguagePanel({ appConfig, role: "speaks", title: "Speaks", items: speaksLanguages, fallbackLanguage: state.user.nativeLanguage || "", fallbackLevel: "Native" })}
      </div>
      <label class="${ui.label}">Bio<textarea class="${ui.input} min-h-28" name="bio" required minlength="20" maxlength="3000">${escapeHtml(profile?.bio || "")}</textarea></label>
      <label class="${ui.label}">Teaching style<textarea class="${ui.input} min-h-20" name="teachingStyle" maxlength="1200">${escapeHtml(profile?.teachingStyle || "")}</textarea></label>
      <label class="${ui.label}">Experience<textarea class="${ui.input} min-h-20" name="experienceSummary" maxlength="1200">${escapeHtml(profile?.experienceSummary || "")}</textarea></label>
      <label class="${ui.label}">Certifications<textarea class="${ui.input} min-h-20" name="certifications" maxlength="1000">${escapeHtml(profile?.certifications || "")}</textarea></label>
      <section class="grid gap-2">
        <label class="${ui.label}">Tags<input class="${ui.input}" data-teacher-tag-input placeholder="Type a tag and press Enter"></label>
        <input type="hidden" name="tags" value="${escapeHtml(tags.join(", "))}" data-teacher-tags-value>
        <div class="flex flex-wrap gap-2" data-teacher-tags>${tagChips(tags)}</div>
      </section>
      <label class="${ui.label}">Intro video URL<input class="${ui.input}" name="videoIntroUrl" value="${escapeHtml(profile?.videoIntroUrl || "")}" placeholder="YouTube or Vimeo only"></label>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-brand-line pt-4">
        <p class="text-xs font-semibold text-brand-graphite">New profiles are reviewed before they appear on Find a Teacher.</p>
        <button class="${ui.primary}">${icon("save", "h-4 w-4")}<span>Save Profile</span></button>
      </div>
    </form>
  `;
}

export function teacherProfileCreateView(ctx) {
  return `
    <div class="grid gap-5">
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="${ui.tagGold}">Teacher profile</span>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">Create Teacher Profile</h2>
        </div>
        <a class="${ui.secondary}" href="${escapeHtml(ctx.appPath("teacherDashboard"))}" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>Back to Teacher Workspace</span></a>
      </section>
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        ${teacherProfileForm(ctx)}
      </section>
    </div>
  `;
}

export function teacherProfileEditView(ctx) {
  const profile = (ctx.teacherStudentData.profiles || []).find((item) => item.id === ctx.activeTeacherProfileId);
  return `
    <div class="grid gap-5">
      <section class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="${ui.tagGold}">Teacher profile</span>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">Edit Teacher Profile</h2>
        </div>
        <a class="${ui.secondary}" href="${escapeHtml(ctx.appPath("teacherDashboard"))}" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>Back to Teacher Workspace</span></a>
      </section>
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        ${profile ? teacherProfileForm({ ...ctx, profile }) : emptyState("Profile not found", "This teacher profile could not be loaded.")}
      </section>
    </div>
  `;
}

function compactDate(value) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function dayName(value) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

function dayNumber(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function timeRange(slot) {
  const formatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  return `${formatter.format(new Date(slot.startsAt))}-${formatter.format(new Date(slot.endsAt))}`;
}

export function bookLessonView({ appConfig, teacherStudentData = {}, bookingSelection = {}, appPath }) {
  const page = teacherStudentData.bookingPage || {};
  const profile = page.profile;
  const calendar = page.calendar || {};
  if (!profile) return emptyState("Loading booking page", "Available lesson times will appear here.");
  const durations = calendar.durations || [profile.minLessonMinutes, profile.maxLessonMinutes];
  const days = calendar.days || [];
  const selectedDate = bookingSelection.date || days.find((day) => day.availableCount > 0)?.date || days[0]?.date || "";
  const selectedIndex = Math.max(0, days.findIndex((day) => day.date === selectedDate));
  const visibleDays = days.slice(selectedIndex, selectedIndex + 7);
  const selectedSlot = days.flatMap((day) => day.slots || []).find((slot) => slot.startsAt === bookingSelection.startsAt);
  const openSlots = visibleDays.reduce((count, day) => count + Number(day.availableCount || 0), 0);
  const payoutSetupRequired = !PAYOUT_SETUP_DISABLED && Boolean(calendar.payoutSetupRequired || !profile.payoutAccount?.ready);
  const lessonTypes = [
    ["group", "Group lesson"],
    ["one_on_one", "Private lesson"],
    ["trial", "Trial lesson"]
  ].filter(([value]) => value !== "group" || profile.groupLessonEnabled);
  return `
    <div>
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
          <a class="inline-flex items-center gap-2 text-sm font-bold text-brand-red" href="${escapeHtml(appPath("teacherProfileDetail", { teacherProfileId: profile.id }))}" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>Teacher profile</span></a>
          <div class="mt-5 flex flex-col gap-4 md:flex-row md:items-start">
            ${profileImage(profile, "h-24 w-24")}
            <div class="min-w-0 flex-1">
              <span class="${ui.tagGold}">${PAYOUT_SETUP_DISABLED ? "Lesson booking" : "Stripe lesson booking"}</span>
              <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">${escapeHtml(profile.displayName)}</h2>
              <p class="mt-2 text-lg font-semibold text-brand-charcoal">${escapeHtml(profile.headline)}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                ${(profile.languages || []).filter((item) => item.role === "teaches").map((item) => `<span class="${ui.tag}">${escapeHtml(languageName(appConfig, item.language))}</span>`).join("")}
                <span class="${ui.tagGold}">${money(profile.hourlyRateUsd)}/hr</span>
                <span class="${ui.tag}">${escapeHtml(calendar.timezone || profile.timezone)}</span>
              </div>
            </div>
          </div>
          <form class="mt-6 grid gap-3 lg:grid-cols-[190px_150px_minmax(220px,1fr)]" data-form="bookingScheduler">
            <label class="${ui.label}">Lesson type<select class="${ui.input}" name="lessonType">${optionPairs(lessonTypes, bookingSelection.lessonType || calendar.lessonType)}</select></label>
            <label class="${ui.label}">Duration<select class="${ui.input}" name="durationMinutes">${durations.map((duration) => `<option value="${duration}" ${String(duration) === String(bookingSelection.durationMinutes || calendar.durationMinutes) ? "selected" : ""}>${duration} min</option>`).join("")}</select></label>
            <label class="${ui.label}">Start date<select class="${ui.input}" name="date" data-booking-date-select>${days.map((day) => `<option value="${escapeHtml(day.date)}" ${day.date === selectedDate ? "selected" : ""}>${compactDate(day.date)} · ${day.availableCount} open</option>`).join("")}</select></label>
          </form>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-brand-line py-3">
            <div>
              <h3 class="text-lg font-bold text-brand-ink">Available calendar</h3>
              <p class="${ui.muted}">${visibleDays.length ? `${compactDate(visibleDays[0].date)} to ${compactDate(visibleDays[visibleDays.length - 1].date)}` : "No booking days found."}</p>
            </div>
            <span class="${openSlots ? ui.tagGold : ui.tagRed}">${openSlots} open slot${openSlots === 1 ? "" : "s"}</span>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            ${payoutSetupRequired ? emptyState("Booking unavailable", "This teacher is finishing payout setup before accepting paid lessons.") : visibleDays.length ? visibleDays.map((day) => `
              <article class="min-h-[220px] rounded-lg border ${day.date === selectedDate ? "border-brand-red/45 bg-brand-mist/45" : "border-brand-line bg-white/65"} p-3">
                <div class="flex items-start justify-between gap-2 border-b border-brand-line/70 pb-3">
                  <div>
                    <span class="block text-xs font-bold uppercase text-brand-graphite">${dayName(day.date)}</span>
                    <strong class="mt-1 block text-base text-brand-ink">${dayNumber(day.date)}</strong>
                  </div>
                  <span class="${day.availableCount ? ui.tagGold : ui.tag}">${day.availableCount || 0}</span>
                </div>
                <div class="mt-3 grid gap-2">
                  ${(day.slots || []).length ? day.slots.map((slot) => `
                    <button class="min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${slot.available ? slot.startsAt === bookingSelection.startsAt ? "border-brand-red bg-brand-sidebar text-white shadow-sm" : "border-brand-line bg-white text-brand-ink hover:border-brand-orange/70 hover:bg-brand-mist/50" : "cursor-not-allowed border-brand-line bg-brand-snow text-brand-graphite opacity-60"}" ${slot.available ? `data-action="selectBookingSlot" data-value="${escapeHtml(slot.startsAt)}"` : "disabled"}>
                      <span class="block">${timeRange(slot)}</span>
                      <span class="mt-1 block font-semibold ${slot.available && slot.startsAt === bookingSelection.startsAt ? "text-white/75" : "text-brand-graphite"}">${slot.available ? "Available" : escapeHtml(slot.reason || "Blocked")}</span>
                    </button>
                  `).join("") : `<p class="rounded-lg border border-dashed border-brand-line bg-brand-snow p-3 text-xs font-semibold leading-5 text-brand-graphite">${escapeHtml(day.reason || "No slots")}</p>`}
                </div>
              </article>
            `).join("") : emptyState("No calendar days", "This teacher has not opened booking availability yet.")}
          </div>
        </section>
        <aside class="rounded-lg border border-brand-line bg-brand-panel p-5 xl:sticky xl:top-5 xl:self-start">
          <h3 class="text-xl font-bold text-brand-ink">${PAYOUT_SETUP_DISABLED ? "Booking request" : "Checkout"}</h3>
          <div class="mt-4 grid gap-3 text-sm font-semibold text-brand-charcoal">
            <div class="flex justify-between gap-3"><span>Date/time</span><strong class="text-right text-brand-ink">${selectedSlot ? dateTime(selectedSlot.startsAt) : "Select a slot"}</strong></div>
            <div class="flex justify-between gap-3"><span>Your timezone</span><strong class="text-right text-brand-ink">${escapeHtml(Intl.DateTimeFormat().resolvedOptions().timeZone || "Local")}</strong></div>
            <div class="rounded-lg border border-brand-line/70 bg-brand-mist/60 p-3">
              <span class="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand-graphite">${icon("coins", "h-4 w-4")}<span>Lesson price</span></span>
              <strong class="mt-2 block text-2xl text-brand-ink">${money(calendar.price?.lessonPriceUsd)}</strong>
            </div>
            <div class="flex justify-between gap-3 border-t border-brand-line pt-3 text-base"><span>Total</span><strong class="text-brand-ink">${money(calendar.price?.totalStudentChargeUsd)}</strong></div>
          </div>
          <button class="${selectedSlot && !payoutSetupRequired ? ui.primary : `${ui.secondary} pointer-events-none opacity-60`} mt-5 w-full justify-center" ${selectedSlot && !payoutSetupRequired ? `data-action="checkoutLesson:${escapeHtml(profile.id)}"` : "disabled"}>${icon("arrow-right", "h-4 w-4")}<span>${payoutSetupRequired ? "Payout setup pending" : PAYOUT_SETUP_DISABLED ? "Request Booking" : "Continue with Payment"}</span></button>
          <p class="mt-3 text-xs font-semibold leading-5 text-brand-graphite">${payoutSetupRequired ? "This teacher is not accepting paid lesson bookings yet." : PAYOUT_SETUP_DISABLED ? "The teacher can confirm this booking from Teacher Workspace." : "Review the lesson details before continuing."}</p>
        </aside>
      </div>
    </div>
  `;
}

function lessonsTable(lessons = [], state) {
  if (!lessons.length) return emptyState("No lessons yet", "Booked lessons will appear here.");
  return `
    <div class="responsive-table-shell overflow-auto rounded-lg border border-brand-line bg-brand-panel">
      <table class="responsive-card-table min-w-full text-left text-sm">
        <thead class="bg-brand-mist/60 text-xs uppercase text-brand-graphite"><tr><th class="px-4 py-3">Lesson</th><th class="px-4 py-3">When</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Payment</th><th class="px-4 py-3 text-right">Action</th></tr></thead>
        <tbody>
          ${lessons.map((lesson) => {
            const classroom = classroomAction(lesson, state.user.id);
            return `
              <tr class="border-t border-brand-line/70">
                <td class="px-4 py-3" data-label="Lesson"><strong class="text-brand-ink">${escapeHtml(lesson.title)}</strong><span class="mt-1 block text-xs text-brand-graphite">${escapeHtml(lesson.teacherName || lesson.studentName || "")}</span></td>
                <td class="px-4 py-3 text-brand-charcoal" data-label="When">${dateTime(lesson.startsAt)}</td>
                <td class="px-4 py-3" data-label="Status"><span class="${ui.tag}">${escapeHtml(lesson.status)}</span></td>
                <td class="px-4 py-3" data-label="Payment"><span class="${lesson.paymentStatus === "paid" ? ui.tagGold : ui.tagRed}">${escapeHtml(lesson.paymentStatus)} · ${money(lesson.totalStudentChargeUsd)}</span></td>
                <td class="px-4 py-3 text-right" data-label="Action">
                  <div class="flex flex-wrap justify-end gap-2">
                    ${classroom}
                    ${lesson.status === "pending_payment" ? `<button class="${ui.secondary}" data-action="syncLessonPayment:${escapeHtml(lesson.id)}">${icon("arrow-right", "h-4 w-4")}<span>Sync payment</span></button>` : ""}
                    ${["pending_payment", "confirmed"].includes(lesson.status) ? `<button class="${ui.danger}" data-action="cancelLesson:${escapeHtml(lesson.id)}">${icon("trash-2", "h-4 w-4")}<span>Cancel</span></button>` : ""}
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function localDateKey(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || localDateKey()).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function weekStartKey(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return localDateKey(start);
}

function lessonDateKey(lesson) {
  return localDateKey(new Date(lesson.startsAt));
}

function weekRangeLabel(days) {
  if (!days.length) return "";
  const sameYear = days[0].getFullYear() === days[days.length - 1].getFullYear();
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
  const endFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${formatter.format(days[0])} - ${endFormatter.format(days[days.length - 1])}`;
}

function calendarLessons(lessons = []) {
  return lessons
    .filter((lesson) => lesson.startsAt && !String(lesson.status || "").startsWith("cancelled"))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

function teacherProfileName(teacher = {}, appPath) {
  if (!teacher.teacherProfileId || typeof appPath !== "function") return `<h3 class="font-bold text-brand-ink">${escapeHtml(teacher.teacherName)}</h3>`;
  return `<a class="font-bold text-brand-ink no-underline hover:text-brand-redDark" href="${escapeHtml(appPath("teacherProfileDetail", { teacherProfileId: teacher.teacherProfileId }))}" data-app-link>${escapeHtml(teacher.teacherName)}</a>`;
}

function myTeachersPanel(teacherStudentData = {}, appPath) {
  const teachers = teacherStudentData.myTeachers || [];
  return `
    <div class="grid gap-3">
      ${teachers.length ? teachers.map((teacher) => `
        <article class="flex flex-col gap-4 rounded-lg border border-brand-line/70 bg-white/60 p-4 sm:flex-row sm:items-center">
          ${profileImage(teacher, "h-14 w-14")}
          <div class="min-w-0 flex-1">
            ${teacherProfileName(teacher, appPath)}
            <p class="text-sm text-brand-graphite">${Number(teacher.totalLessons || 0)} lessons · last lesson ${teacher.lastLessonAt ? dateTime(teacher.lastLessonAt) : "not yet"}</p>
          </div>
        </article>
      `).join("") : emptyState("No teachers yet", "Teachers appear after confirmed lessons.")}
    </div>
  `;
}

function myCalendarPanel({ teacherStudentData = {}, myLearningWeekStart = "", state }) {
  const todayKey = localDateKey();
  const start = dateFromKey(myLearningWeekStart || weekStartKey());
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const lessonsByDay = new Map();
  calendarLessons(teacherStudentData.lessons || []).forEach((lesson) => {
    const key = lessonDateKey(lesson);
    lessonsByDay.set(key, [...(lessonsByDay.get(key) || []), lesson]);
  });
  const visibleCount = days.reduce((total, day) => total + (lessonsByDay.get(localDateKey(day)) || []).length, 0);
  return `
    <div class="grid gap-4">
      <div class="flex flex-col gap-3 border-b border-brand-line pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="${ui.muted}">${visibleCount} scheduled class${visibleCount === 1 ? "" : "es"} this week.</p>
        </div>
        <div class="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:flex-wrap">
          <button class="grid h-11 w-11 place-items-center rounded-lg border border-brand-line bg-white text-brand-ink transition hover:border-brand-orange/60 hover:bg-brand-mist/50" data-action="shiftMyLearningWeek:prev" aria-label="Previous week">${icon("chevron-left", "h-4 w-4")}</button>
          <span class="min-w-0 text-center text-sm font-bold text-brand-ink sm:min-w-[190px]">${escapeHtml(weekRangeLabel(days))}</span>
          <button class="grid h-11 w-11 place-items-center rounded-lg border border-brand-line bg-white text-brand-ink transition hover:border-brand-orange/60 hover:bg-brand-mist/50" data-action="shiftMyLearningWeek:next" aria-label="Next week">${icon("chevron-right", "h-4 w-4")}</button>
          <button class="${ui.secondary} col-span-3 sm:col-span-1" data-action="shiftMyLearningWeek:today">${icon("calendar", "h-4 w-4")}<span>Today</span></button>
        </div>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        ${days.map((day) => {
          const key = localDateKey(day);
          const dayLessons = lessonsByDay.get(key) || [];
          const isToday = key === todayKey;
          return `
            <article class="min-h-[240px] rounded-lg border ${isToday ? "border-brand-red/50 bg-brand-mist/60 ring-2 ring-brand-orange/30" : "border-brand-line bg-white/65"} p-3">
              <div class="flex items-start justify-between gap-2 border-b border-brand-line/70 pb-3">
                <div>
                  <span class="block text-xs font-bold uppercase text-brand-graphite">${dayName(key)}</span>
                  <strong class="mt-1 block text-base text-brand-ink">${dayNumber(key)}</strong>
                </div>
                <span class="${isToday ? ui.tagRed : dayLessons.length ? ui.tagGold : ui.tag}">${isToday ? "Today" : dayLessons.length}</span>
              </div>
              <div class="mt-3 grid gap-2">
                ${dayLessons.length ? dayLessons.map((lesson) => `
                  <div class="rounded-lg border ${isToday ? "border-brand-red/35 bg-white" : "border-brand-line/80 bg-brand-snow"} p-3 text-left">
                    <span class="block text-xs font-black uppercase text-brand-redDark">${escapeHtml(new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(lesson.startsAt)))}</span>
                    <strong class="mt-1 block text-sm leading-5 text-brand-ink">${escapeHtml(lesson.title || "Lesson")}</strong>
                    <span class="mt-1 block text-xs font-semibold text-brand-graphite">${escapeHtml(lesson.teacherUserId === state.user.id ? lesson.studentName || "Student" : lesson.teacherName || "Teacher")} · ${escapeHtml(lesson.status || "scheduled")}</span>
                    <div class="mt-3">${classroomAction(lesson, state.user.id, `${ui.secondary} w-full justify-center`)}</div>
                  </div>
                `).join("") : `<p class="rounded-lg border border-dashed border-brand-line bg-brand-snow p-3 text-xs font-semibold leading-5 text-brand-graphite">No classes scheduled.</p>`}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

export function myLearningView({ teacherStudentData = {}, state, appPath, myLearningTab = "lessons", myLearningWeekStart = "" }) {
  const activeTab = ["lessons", "teachers", "calendar"].includes(myLearningTab) ? myLearningTab : "lessons";
  const tabs = [
    ["lessons", "My Booked Lessons"],
    ["teachers", "My Booked Teachers"],
    ["calendar", "My Scheduled Classes"]
  ];
  const panels = {
    lessons: `<div>${lessonsTable(teacherStudentData.lessons || [], state)}</div>`,
    teachers: myTeachersPanel(teacherStudentData, appPath),
    calendar: myCalendarPanel({ teacherStudentData, myLearningWeekStart, state })
  };
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div>
          <div class="flex flex-wrap justify-start gap-2" role="tablist" aria-label="My lessons views">
            ${tabs.map(([id, label]) => `
              <button class="${activeTab === id ? ui.primary : ui.secondary}" data-action="setMyLearningTab:${id}" role="tab" aria-selected="${activeTab === id ? "true" : "false"}">${icon(id === "teachers" ? "users" : id === "calendar" ? "calendar" : "book-open", "h-4 w-4")}<span>${label}</span></button>
            `).join("")}
          </div>
        </div>
        <div class="mt-5">
          ${panels[activeTab]}
        </div>
      </section>
    </div>
  `;
}

export function myLessonsView({ teacherStudentData = {}, state }) {
  return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5"><h2 class="text-2xl font-bold text-brand-ink">My Lessons</h2><div class="mt-5">${lessonsTable(teacherStudentData.lessons || [], state)}</div></section></div>`;
}

export function myTeachersView({ teacherStudentData = {}, appPath }) {
  const teachers = teacherStudentData.myTeachers || [];
  return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5"><h2 class="text-2xl font-bold text-brand-ink">My Booked Teachers</h2><div class="mt-5 grid gap-3">${teachers.length ? teachers.map((teacher) => `<article class="flex flex-col gap-4 rounded-lg border border-brand-line/70 bg-white/60 p-4 sm:flex-row sm:items-center">${profileImage(teacher, "h-14 w-14")}<div class="min-w-0">${teacherProfileName(teacher, appPath)}<p class="text-sm text-brand-graphite">${Number(teacher.totalLessons || 0)} lessons · last lesson ${teacher.lastLessonAt ? dateTime(teacher.lastLessonAt) : "not yet"}</p></div></article>`).join("") : emptyState("No teachers yet", "Teachers appear after confirmed lessons.")}</div></section></div>`;
}

export function learningNotesView({ teacherStudentData = {} }) {
  return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5"><h2 class="text-2xl font-bold text-brand-ink">Learning Notes</h2><div class="mt-5 grid gap-3">${noteRows(teacherStudentData.notes || [])}</div></section></div>`;
}

function noteRows(notes = []) {
  return notes.length ? notes.map((note) => `<article class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><div class="flex flex-wrap justify-between gap-2"><strong class="text-brand-ink">${escapeHtml(note.authorName)}</strong><span class="${note.visibility === "teacher_private" ? ui.tagRed : ui.tagGold}">${escapeHtml(note.visibility)}</span></div><p class="mt-2 text-sm leading-6 text-brand-graphite">${escapeHtml(note.body)}</p></article>`).join("") : emptyState("No notes yet", "Shared lesson notes will appear here.");
}

export function teacherDashboardView({ appConfig, appPath, state, teacherStudentData = {} }) {
  const canUseTeacherWorkspace = Boolean(state?.subscription?.capabilities?.teacherWorkspace || state?.user?.subscription?.capabilities?.teacherWorkspace);
  const stats = teacherStudentData.dashboard?.stats || {};
  const lessons = teacherWorkspaceBookings(teacherStudentData);
  const profiles = teacherStudentData.profiles || [];
  const payoutAccount = teacherStudentData.dashboard?.payoutAccount || profiles.find((profile) => profile.payoutAccount)?.payoutAccount || {};
  if (!canUseTeacherWorkspace) {
    return `
      <div class="grid gap-5">
        ${teacherProfilesPanel({ appPath, teacherStudentData })}
        ${profiles.length ? `
          <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
            <span class="${ui.tag}">Awaiting approval</span>
            <h2 class="mt-3 text-2xl font-bold text-brand-ink">Workspace tools unlock after approval</h2>
            <p class="mt-2 ${ui.muted}">Once a teacher profile is approved, scheduling, bookings, students, and lesson tools appear in Teacher Workspace.</p>
          </section>
        ` : ""}
      </div>
    `;
  }
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <h2 class="text-3xl font-bold tracking-tight text-brand-ink">Teacher Workspace</h2>
        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><span class="text-xs font-bold uppercase text-brand-graphite">Profiles</span><strong class="mt-2 block text-3xl text-brand-ink">${stats.profileCount || 0}</strong></div>
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><span class="text-xs font-bold uppercase text-brand-graphite">Upcoming</span><strong class="mt-2 block text-3xl text-brand-ink">${stats.upcomingLessons || 0}</strong></div>
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><span class="text-xs font-bold uppercase text-brand-graphite">Earnings</span><strong class="mt-2 block text-3xl text-brand-ink">${money(stats.totalEarningsUsd)}</strong></div>
        </div>
      </section>
      ${teacherProfilesPanel({ appPath, teacherStudentData })}
      ${PAYOUT_SETUP_DISABLED ? "" : teacherPayoutPanel(payoutAccount)}
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 class="text-2xl font-bold text-brand-ink">Bookings</h3>
            <p class="mt-1 ${ui.muted}">${teacherStudentData.teacherWorkspaceShowCompletedPaid ? "Showing active bookings plus completed paid bookings." : "Showing active bookings only."}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="${teacherStudentData.teacherWorkspaceShowCompletedPaid ? ui.primary : ui.secondary}" data-action="toggleTeacherCompletedPaid">${icon("flag", "h-4 w-4")}<span>Completed and paid</span></button>
            <button class="${ui.secondary}" data-action="openTeacherBookingRulesModal">${icon("save", "h-4 w-4")}<span>Book Rules</span></button>
            <a class="${ui.secondary}" href="${escapeHtml(teacherStudentData.unavailableBlocksHref || "/app/learning/unavailable-blocks")}" data-app-link>${icon("calendar", "h-4 w-4")}<span>Unavailable Blocks</span></a>
          </div>
        </div>
        <div class="mt-5">
          ${teacherBookingsTable(lessons, appConfig, teacherStudentData.currentUserId)}
          ${teacherBookingsCards(lessons, appConfig, teacherStudentData.currentUserId)}
        </div>
      </section>
    </div>
  `;
}

export function teacherProfilesPanel({ appPath, teacherStudentData = {} }) {
  const profiles = teacherStudentData.profiles || [];
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><h2 class="text-2xl font-bold text-brand-ink">Teacher Profile</h2><p class="mt-1 ${ui.muted}">Create and manage teacher profiles for admin approval.</p></div>
          <a class="${ui.primary}" href="${escapeHtml(appPath("teacherProfileCreate"))}" data-app-link>${icon("plus", "h-4 w-4")}<span>${profiles.length ? "Add Teacher Profile" : "Create a teacher profile..."}</span></a>
        </div>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          ${profiles.length ? profiles.map((profile) => `
            <article class="rounded-lg border border-brand-line/70 bg-white/60 p-4">
              <div class="flex gap-4">
                ${profileImage(profile, "h-16 w-16")}
                <div>
                  <span class="${teacherProfileStatusTone(profile.status)}">${escapeHtml(teacherProfileStatusLabel(profile.status))}</span>
                  <h3 class="mt-2 font-bold text-brand-ink">${escapeHtml(profile.displayName)}</h3>
                  <p class="text-sm text-brand-graphite">${escapeHtml(profile.headline)}</p>
                  ${profile.status === "draft" ? `<p class="mt-2 text-xs font-semibold text-brand-graphite">Awaiting approval. Approval typically takes 1 - 2 days.</p>` : ""}
                </div>
              </div>
              <div class="mt-4 flex flex-wrap justify-end gap-2">
                ${isDisabledTeacherProfile(profile.status) ? `<button class="${ui.primary}" data-action="enableTeacherProfile:${escapeHtml(profile.id)}">${icon("check", "h-4 w-4")}<span>Request re-enable</span></button>` : ""}
                <a class="${ui.secondary}" href="${escapeHtml(appPath("teacherProfileEdit", { teacherProfileId: profile.id }))}" data-app-link>${icon("pencil", "h-4 w-4")}<span>Edit</span></a>
                <button class="${ui.danger}" data-action="deleteTeacherProfile:${escapeHtml(profile.id)}">${icon("trash-2", "h-4 w-4")}<span>Delete</span></button>
              </div>
            </article>
          `).join("") : emptyState("No teacher profiles yet", "Create a teacher profile to apply for approval.")}
        </div>
      </section>
    </div>
  `;
}

export function teacherAvailabilityView({ teacherStudentData = {} }) {
  const profiles = teacherStudentData.profiles || [];
  const availability = teacherStudentData.availability || [];
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <h2 class="text-2xl font-bold text-brand-ink">My Open Time Slots</h2>
        <form class="mt-5 grid gap-3 lg:grid-cols-[1fr_140px_140px_140px_1fr_auto]" data-form="teacherAvailability">
          <select class="${ui.input}" name="teacherProfileId" required>${profileOptions(profiles)}</select>
          <select class="${ui.input}" name="weekday">${alphabetize(weekdays.map((day, index) => [index, day]), ([, day]) => day).map(([index, day]) => `<option value="${index}">${day}</option>`).join("")}</select>
          <input class="${ui.input}" name="startTime" type="time" required value="09:00">
          <input class="${ui.input}" name="endTime" type="time" required value="10:00">
          ${timezoneSelect()}
          <button class="${ui.primary}">${icon("plus", "h-4 w-4")}<span>Add</span></button>
        </form>
        <div class="mt-5 grid gap-2">${availability.length ? availability.map((slot) => `<div class="rounded-lg border border-brand-line/70 bg-white/60 p-3 text-sm font-semibold text-brand-charcoal">${weekdays[slot.weekday]} · ${escapeHtml(slot.startTime)}-${escapeHtml(slot.endTime)} · ${escapeHtml(slot.timezone)}</div>`).join("") : emptyState("No availability", "Add weekly availability for bookings.")}</div>
      </section>
    </div>
  `;
}

function statusTone(status) {
  if (String(status).includes("cancel")) return ui.tagRed;
  if (status === "confirmed" || status === "rescheduled" || status === "completed") return ui.tagGold;
  return ui.tag;
}

const ACTIVE_TEACHER_BOOKING_STATUSES = new Set(["pending_payment", "confirmed", "pending_teacher_approval", "reschedule_requested", "rescheduled", "active"]);

function isActiveTeacherBooking(lesson) {
  return ACTIVE_TEACHER_BOOKING_STATUSES.has(lesson.status);
}

function isCompletedPaidBooking(lesson) {
  return lesson.status === "completed" && lesson.paymentStatus === "paid";
}

function teacherWorkspaceBookings(teacherStudentData = {}) {
  const userId = teacherStudentData.currentUserId || "";
  const source = teacherStudentData.dashboard?.lessons || teacherStudentData.lessons || [];
  return source
    .filter((lesson) => !userId || lesson.teacherUserId === userId)
    .filter((lesson) => isActiveTeacherBooking(lesson) || (teacherStudentData.teacherWorkspaceShowCompletedPaid && isCompletedPaidBooking(lesson)))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

function bookingPaymentBadge(lesson) {
  return `<span class="${lesson.paymentStatus === "paid" ? ui.tagGold : ui.tagRed}">${escapeHtml(lesson.paymentStatus || "unpaid")} · ${money(lesson.totalStudentChargeUsd)}</span>`;
}

function bookingActions(lesson, currentUserId = "") {
  const classroom = classroomAction(lesson, currentUserId);
  return `
    <div class="flex flex-wrap justify-end gap-2">
      ${lesson.status === "pending_teacher_approval" && lesson.teacherUserId === currentUserId ? `<button class="${ui.primary}" data-action="confirmLesson:${escapeHtml(lesson.id)}">${icon("check", "h-4 w-4")}<span>Confirm</span></button>` : ""}
      ${classroom}
      ${isActiveTeacherBooking(lesson) ? `<button class="${ui.danger}" data-action="cancelLesson:${escapeHtml(lesson.id)}">${icon("trash-2", "h-4 w-4")}<span>Cancel</span></button>` : ""}
    </div>
  `;
}

function teacherBookingsTable(lessons = [], appConfig = {}, currentUserId = "") {
  return `
    <div class="hidden overflow-hidden rounded-lg border border-brand-line/80 bg-white/60 lg:block">
      <table class="responsive-card-table w-full border-collapse text-left">
        <thead class="bg-brand-mist/60 text-xs font-semibold uppercase tracking-[.12em] text-brand-graphite">
          <tr>
            <th class="px-4 py-3">Class</th>
            <th class="px-4 py-3">Student</th>
            <th class="px-4 py-3">When</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Payment</th>
            <th class="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          ${lessons.length ? lessons.map((lesson) => `
            <tr class="border-t border-brand-line/70 align-middle">
              <td class="px-4 py-3" data-label="Class"><strong class="text-sm text-brand-ink">${escapeHtml(lesson.title || "Lesson")}</strong><span class="mt-1 block text-xs font-semibold text-brand-graphite">${escapeHtml(languageName(appConfig, lesson.targetLanguage))} · ${lesson.durationMinutes || 30} min</span></td>
              <td class="px-4 py-3 text-sm font-semibold text-brand-charcoal" data-label="Student">${escapeHtml(lesson.studentName || "Student")}</td>
              <td class="px-4 py-3 text-sm font-semibold text-brand-charcoal" data-label="When">${dateTime(lesson.startsAt)}</td>
              <td class="px-4 py-3" data-label="Status"><span class="${statusTone(lesson.status)}">${escapeHtml(lesson.status)}</span></td>
              <td class="px-4 py-3" data-label="Payment">${bookingPaymentBadge(lesson)}</td>
              <td class="px-4 py-3 text-right" data-label="Action">${bookingActions(lesson, currentUserId)}</td>
            </tr>
          `).join("") : `<tr><td colspan="6" class="px-4 py-10 text-center text-sm font-semibold text-brand-graphite">No bookings match this view.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function teacherBookingsCards(lessons = [], appConfig = {}, currentUserId = "") {
  return `
    <div class="grid gap-3 lg:hidden">
      ${lessons.length ? lessons.map((lesson) => `
        <article class="rounded-lg border border-brand-line/80 bg-white/65 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span class="${statusTone(lesson.status)}">${escapeHtml(lesson.status)}</span>
              <h4 class="mt-3 text-base font-bold text-brand-ink">${escapeHtml(lesson.title || "Lesson")}</h4>
              <p class="mt-1 text-sm font-semibold text-brand-graphite">${escapeHtml(languageName(appConfig, lesson.targetLanguage))} · ${dateTime(lesson.startsAt)}</p>
            </div>
            ${bookingPaymentBadge(lesson)}
          </div>
          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-brand-line/70 bg-brand-snow p-3"><span class="block text-[11px] font-bold uppercase tracking-[.12em] text-brand-graphite">Student</span><strong class="mt-1 block text-sm text-brand-ink">${escapeHtml(lesson.studentName || "Student")}</strong></div>
            <div class="rounded-lg border border-brand-line/70 bg-brand-snow p-3"><span class="block text-[11px] font-bold uppercase tracking-[.12em] text-brand-graphite">Duration</span><strong class="mt-1 block text-sm text-brand-ink">${lesson.durationMinutes || 30} min</strong></div>
          </div>
          <div class="mt-4">${bookingActions(lesson, currentUserId)}</div>
        </article>
      `).join("") : emptyState("No bookings match this view", "Active bookings will appear here.")}
    </div>
  `;
}

export function teacherBookingRulesModal({ teacherStudentData = {} }) {
  const profiles = teacherStudentData.profiles || teacherStudentData.dashboard?.profiles || [];
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Book Rules</h2>
      <p class="mt-2 ${ui.muted}">Set the limits students see when booking your lessons.</p>
      <form class="mt-5 grid gap-3" data-form="teacherBookingRules">
        <label class="${ui.label}">Teacher profile<select class="${ui.input}" name="teacherProfileId" required>${profileOptions(profiles)}</select></label>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="${ui.label}">Minimum notice before booking (minutes)<input class="${ui.input}" name="minBookingNoticeMinutes" type="number" min="0" value="720"></label>
          <label class="${ui.label}">Maximum advance booking window (days)<input class="${ui.input}" name="maxAdvanceBookingDays" type="number" min="1" value="30"></label>
          <label class="${ui.label}">Buffer before each lesson (minutes)<input class="${ui.input}" name="bufferBeforeMinutes" type="number" min="0" value="10"></label>
          <label class="${ui.label}">Buffer after each lesson (minutes)<input class="${ui.input}" name="bufferAfterMinutes" type="number" min="0" value="10"></label>
          <label class="${ui.label}">Cancellation cutoff (minutes before class)<input class="${ui.input}" name="cancellationCutoffMinutes" type="number" min="0" value="720"></label>
          <label class="${ui.label}">Reschedule cutoff (minutes before class)<input class="${ui.input}" name="rescheduleCutoffMinutes" type="number" min="0" value="720"></label>
        </div>
        <label class="${ui.label}">Supported lesson durations (comma separated minutes)<input class="${ui.input}" name="supportedDurations" value="30,60" placeholder="15,30,45,60,90"></label>
        <div class="mt-3 flex justify-end border-t border-brand-line pt-4">
          <button class="${ui.primary}">${icon("save", "h-4 w-4")}<span>Save Rules</span></button>
        </div>
      </form>
    </div>
  `;
}

export function teacherBookingsView({ teacherStudentData = {}, teacherCalendarFilters = {}, state }) {
  const calendar = teacherStudentData.calendar || {};
  const profiles = calendar.profiles || teacherStudentData.profiles || [];
  const blocks = calendar.unavailableBlocks || [];
  const requests = calendar.rescheduleRequests || [];
  const firstProfile = profiles[0];
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-brand-ink">Unavailable Blocks</h2>
            <p class="mt-2 ${ui.muted}">Block dates and times when students should not book you.</p>
          </div>
          <form class="grid gap-3 sm:grid-cols-[220px_190px_auto]" data-form="teacherCalendarFilters">
            <input type="hidden" name="view" value="${escapeHtml(teacherCalendarFilters.view || "list")}">
            <select class="${ui.input}" name="teacherProfileId">${profileOptions(profiles, teacherCalendarFilters.teacherProfileId, "All profiles")}</select>
            <select class="${ui.input}" name="status">${optionPairs(["pending_payment", "confirmed", "reschedule_requested", "rescheduled", "cancelled_by_teacher", "cancelled_by_student", "completed"].map((status) => [status, status]), teacherCalendarFilters.status, "Any booking status")}</select>
            <button class="${ui.primary}">${icon("search", "h-4 w-4")}<span>Filter</span></button>
          </form>
        </div>
      </section>
      <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div class="rounded-lg border border-brand-line bg-brand-panel p-5">
          <h3 class="text-xl font-bold text-brand-ink">Unavailable Blocks</h3>
          <form class="mt-4 grid gap-3 md:grid-cols-2" data-form="teacherUnavailableBlock">
            <select class="${ui.input}" name="teacherProfileId" required>${profileOptions(profiles)}</select>
            <input class="${ui.input}" name="title" placeholder="Vacation, lunch, appointment">
            <input class="${ui.input}" name="startsAt" type="datetime-local" required>
            <input class="${ui.input}" name="endsAt" type="datetime-local" required>
            ${timezoneSelect(firstProfile?.timezone)}
            <button class="${ui.primary}">${icon("plus", "h-4 w-4")}<span>Block time</span></button>
          </form>
          <div class="mt-4 grid gap-2">
            ${blocks.length ? blocks.map((block) => `<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-line/70 bg-white/70 p-3 text-sm font-semibold text-brand-charcoal"><span>${escapeHtml(block.title || block.reason || "Unavailable")} · ${dateTime(block.startsAt)}-${dateTime(block.endsAt)}</span><button class="${ui.danger}" data-action="deleteUnavailableBlock:${escapeHtml(block.id)}">${icon("trash-2", "h-4 w-4")}<span>Delete</span></button></div>`).join("") : `<p class="${ui.muted}">No unavailable blocks in this calendar range.</p>`}
          </div>
        </div>
        <aside class="rounded-lg border border-brand-line bg-brand-panel p-5">
          <h3 class="text-xl font-bold text-brand-ink">Reschedule Requests</h3>
          <div class="mt-5 grid gap-2">
            ${requests.length ? requests.map((request) => `<div class="rounded-lg border border-brand-line/70 bg-white/70 p-3 text-sm"><strong class="text-brand-ink">${dateTime(request.proposedStartTime)}</strong><p class="mt-1 text-brand-graphite">${escapeHtml(request.reason || "Reschedule request")} · ${escapeHtml(request.status)}</p>${request.status === "pending" && request.requestedByUserId !== state.user.id ? `<div class="mt-3 flex gap-2"><button class="${ui.primary}" data-action="respondReschedule:${escapeHtml(request.id)}" data-value="accept">Accept</button><button class="${ui.secondary}" data-action="respondReschedule:${escapeHtml(request.id)}" data-value="reject">Reject</button></div>` : ""}</div>`).join("") : `<p class="${ui.muted}">No pending reschedule requests.</p>`}
          </div>
        </aside>
      </section>
    </div>
  `;
}

export function teacherStudentsView({ appConfig, teacherStudentData = {}, appPath }) {
  const students = teacherStudentData.students || [];
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <h2 class="text-2xl font-bold text-brand-ink">My Students</h2>
        <div class="mt-5 grid gap-3">
          ${students.length ? students.map((student) => `
            <a class="flex flex-col gap-4 rounded-lg border border-brand-line/70 bg-white/65 p-4 text-brand-charcoal no-underline transition hover:border-brand-orange/70 hover:bg-white sm:flex-row sm:items-center" href="${escapeHtml(appPath("teacherStudentDetail", { studentId: student.id }))}" data-app-link>
              ${profileImage(student, "h-14 w-14")}
              <span class="min-w-0 flex-1">
                <strong class="block text-base text-brand-ink">${escapeHtml(student.displayName || "Student")}</strong>
                <span class="mt-1 block text-sm font-semibold text-brand-graphite">${Number(student.totalLessons || 0)} classes · last class ${student.lastLessonAt ? dateTime(student.lastLessonAt) : "not yet"}</span>
                <span class="mt-1 block text-xs font-semibold text-brand-graphite">${escapeHtml(student.teacherProfiles || "")}</span>
              </span>
              <span class="${ui.tagGold}">${escapeHtml(languageName(appConfig, student.targetLanguage) || student.targetLanguage || "Learning")}</span>
            </a>
          `).join("") : emptyState("Students appear after bookings", "Confirmed teacher/student relationships are listed here.")}
        </div>
      </section>
    </div>
  `;
}

function lessonNoteForm(lesson) {
  return `
    <form class="mt-4 grid gap-3 border-t border-brand-line pt-4" data-form="teacherLessonNote">
      <input type="hidden" name="lessonBookingId" value="${escapeHtml(lesson.id)}">
      <textarea class="${ui.input} min-h-20" name="body" required placeholder="Add lesson notes for this class"></textarea>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <select class="${ui.input} max-w-56" name="visibility">
          <option value="shared">Shared with student</option>
          <option value="teacher_private">Teacher private</option>
        </select>
        <button class="${ui.primary}">${icon("save", "h-4 w-4")}<span>Add note</span></button>
      </div>
    </form>
  `;
}

function lessonWithNotesCard(lesson) {
  const notes = lesson.notes || [];
  return `
    <article class="rounded-lg border border-brand-line/70 bg-white/65 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span class="${statusTone(lesson.status)}">${escapeHtml(lesson.status || "scheduled")}</span>
          <h3 class="mt-3 text-lg font-bold text-brand-ink">${escapeHtml(lesson.title || "Lesson")}</h3>
          <p class="mt-1 text-sm font-semibold text-brand-graphite">${escapeHtml(lesson.teacherProfileName || "Teacher profile")} · ${dateTime(lesson.startsAt)} · ${lesson.durationMinutes || 30} min</p>
        </div>
        <span class="${lesson.paymentStatus === "paid" ? ui.tagGold : ui.tagRed}">${escapeHtml(lesson.paymentStatus || "unpaid")}</span>
      </div>
      <div class="mt-4 grid gap-2">
        ${notes.length ? notes.map((note) => `<article class="rounded-lg border border-brand-line/70 bg-brand-snow p-3"><div class="flex flex-wrap justify-between gap-2"><strong class="text-sm text-brand-ink">${escapeHtml(note.authorName || "Teacher")}</strong><span class="${note.visibility === "teacher_private" ? ui.tagRed : ui.tagGold}">${escapeHtml(note.visibility || "shared")}</span></div><p class="mt-2 text-sm leading-6 text-brand-graphite">${escapeHtml(note.body || "")}</p></article>`).join("") : `<p class="${ui.muted}">No notes for this class yet.</p>`}
      </div>
      ${lessonNoteForm(lesson)}
    </article>
  `;
}

export function teacherStudentDetailView({ appConfig, teacherStudentData = {}, appPath }) {
  const detail = teacherStudentData.studentDetail || {};
  const student = detail.student || {};
  const lessons = detail.lessons || [];
  if (!student.id) {
    return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5">${emptyState("Student profile unavailable", "This student could not be loaded.")}</section></div>`;
  }
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <a class="${ui.secondary}" href="${escapeHtml(appPath("teacherStudents"))}" data-app-link>${icon("arrow-left", "h-4 w-4")}<span>My Students</span></a>
        <div class="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          ${profileImage(student, "h-20 w-20")}
          <div class="min-w-0">
            <h2 class="text-3xl font-bold tracking-tight text-brand-ink">${escapeHtml(student.displayName || "Student")}</h2>
            <p class="mt-2 ${ui.muted}">${escapeHtml(student.bio || "No profile bio yet.")}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="${ui.tagGold}">${Number(student.totalLessons || 0)} classes</span>
              <span class="${ui.tag}">Target: ${escapeHtml(languageName(appConfig, student.targetLanguage) || student.targetLanguage || "Not listed")}</span>
              <span class="${ui.tag}">Level: ${escapeHtml(student.currentLevel || "A1")}</span>
            </div>
          </div>
        </div>
      </section>
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <h3 class="text-2xl font-bold text-brand-ink">Classes and Lesson Notes</h3>
        <div class="mt-5 grid gap-4">
          ${lessons.length ? lessons.map(lessonWithNotesCard).join("") : emptyState("No paid classes yet", "Classes and notes will appear here after paid lessons with this student.")}
        </div>
      </section>
    </div>
  `;
}

export function teacherLessonNotesView({ teacherStudentData = {} }) {
  return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5"><h2 class="text-2xl font-bold text-brand-ink">Lesson Notes</h2><div class="mt-5 grid gap-3">${noteRows(teacherStudentData.notes || [])}</div></section></div>`;
}

function simpleCreateForm(type, profiles) {
  if (type === "resource") {
    return `<form class="grid gap-3 rounded-lg border border-brand-line/70 bg-white/60 p-4" data-form="teacherResource"><input class="${ui.input}" name="title" required placeholder="Resource title"><input class="${ui.input}" name="url" placeholder="https://..."><textarea class="${ui.input} min-h-20" name="body" placeholder="Optional notes"></textarea><button class="${ui.primary}">${icon("plus", "h-4 w-4")}<span>Add Resource</span></button></form>`;
  }
  return `<form class="grid gap-3 rounded-lg border border-brand-line/70 bg-white/60 p-4" data-form="teacherTemplate"><input class="${ui.input}" name="title" required placeholder="Template title"><select class="${ui.input}" name="teacherProfileId">${profileOptions(profiles, "", "Any profile")}</select><select class="${ui.input}" name="lessonType">${optionPairs([["group", "Group"], ["one_on_one", "1:1"], ["trial", "Trial"]])}</select><textarea class="${ui.input} min-h-28" name="body" required placeholder="Lesson structure, prompts, practice notes..."></textarea><button class="${ui.primary}">${icon("plus", "h-4 w-4")}<span>Add Template</span></button></form>`;
}

export function teacherResourcesView({ teacherStudentData = {} }) {
  const resources = teacherStudentData.resources || [];
  return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5"><h2 class="text-2xl font-bold text-brand-ink">Resources</h2><div class="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">${simpleCreateForm("resource", [])}<div class="grid gap-3">${resources.length ? resources.map((item) => `<article class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><strong class="text-brand-ink">${escapeHtml(item.title)}</strong><p class="mt-2 text-sm text-brand-graphite">${escapeHtml(item.body || item.url || "")}</p></article>`).join("") : emptyState("No resources", "Add reusable resources for lessons.")}</div></div></section></div>`;
}

export function teacherTemplatesView({ teacherStudentData = {} }) {
  const templates = teacherStudentData.templates || [];
  return `<div class="grid gap-5"><section class="rounded-lg border border-brand-line bg-brand-panel p-5"><h2 class="text-2xl font-bold text-brand-ink">Lesson Templates</h2><div class="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">${simpleCreateForm("template", teacherStudentData.profiles || [])}<div class="grid gap-3">${templates.length ? templates.map((item) => `<article class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><strong class="text-brand-ink">${escapeHtml(item.title)}</strong><p class="mt-2 whitespace-pre-line text-sm text-brand-graphite">${escapeHtml(item.body)}</p></article>`).join("") : emptyState("No templates", "Create reusable lesson structures.")}</div></div></section></div>`;
}
