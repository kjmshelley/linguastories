import { escapeHtml, icon, ui } from "../ui.js";

const statusConfig = {
  locked: { label: "Locked", icon: "lock-keyhole", tone: "muted" },
  available: { label: "Available", icon: "sparkles", tone: "blue" },
  in_progress: { label: "In progress", icon: "play", tone: "red" },
  completed: { label: "Completed", icon: "circle-check", tone: "teal" },
  review_due: { label: "Review due", icon: "rotate-ccw", tone: "amber" },
  not_installed: { label: "Not installed", icon: "download", tone: "blue" },
  preparing: { label: "Preparing", icon: "loader-circle", tone: "blue" },
  downloading: { label: "Downloading", icon: "download", tone: "red" },
  interrupted: { label: "Interrupted", icon: "circle-alert", tone: "danger" },
  download_failed: { label: "Download failed", icon: "circle-alert", tone: "danger" },
  update_failed: { label: "Update failed", icon: "circle-alert", tone: "danger" },
  offline: { label: "Offline", icon: "wifi-off", tone: "amber" },
  validating_checksum: { label: "Verifying files", icon: "shield-check", tone: "blue" },
  validating_schema: { label: "Checking content", icon: "shield-check", tone: "blue" },
  saving: { label: "Installing", icon: "database", tone: "blue" },
  installed: { label: "Ready offline", icon: "circle-check", tone: "teal" },
  update_available: { label: "Update available", icon: "refresh-cw", tone: "amber" },
  updating: { label: "Updating", icon: "refresh-cw", tone: "red" },
  corrupted_local_content: { label: "Repair needed", icon: "triangle-alert", tone: "danger" },
  unsupported_app_version: { label: "App update required", icon: "circle-alert", tone: "danger" },
  unsupported_schema_version: { label: "Unsupported course", icon: "circle-alert", tone: "danger" },
  insufficient_storage: { label: "Storage needed", icon: "hard-drive", tone: "danger" }
};

export function statusBadge(status, options = {}) {
  const config = statusConfig[status] || statusConfig.available;
  const label = options.label || config.label;
  return `<span class="ls-status ls-status--${config.tone}" aria-label="Status: ${escapeHtml(label)}">${icon(config.icon, "h-3.5 w-3.5")}<span>${escapeHtml(label)}</span></span>`;
}

export function progressIndicator(value, label = "Progress", options = {}) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const compact = options.compact ? " ls-progress--compact" : "";
  return `
    <div class="ls-progress${compact}">
      <div class="ls-progress__meta">
        <span>${escapeHtml(label)}</span>
        <strong>${progress}%</strong>
      </div>
      <div class="ls-progress__track" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
        <span class="ls-progress__fill" style="--ls-progress-value:${progress}%"></span>
      </div>
    </div>
  `;
}

export function placeholderIllustration({ iconName = "book-open", accent = "red", label = "Lesson illustration", index = 1 } = {}) {
  return `
    <div class="ls-illustration ls-illustration--${escapeHtml(accent)}" role="img" aria-label="${escapeHtml(label)}">
      <span class="ls-illustration__wash" aria-hidden="true"></span>
      <span class="ls-illustration__number" aria-hidden="true">${String(index).padStart(2, "0")}</span>
      <span class="ls-illustration__icon" aria-hidden="true">${icon(iconName, "h-8 w-8")}</span>
    </div>
  `;
}

export function offlineBanner({ visible = true, message = "You are offline. Downloaded lessons remain available." } = {}) {
  if (!visible) return "";
  return `<div class="ls-offline-banner" role="status">${icon("wifi-off", "h-4 w-4")}<span>${escapeHtml(message)}</span></div>`;
}

export function emptyState({ title, body, action = "" }) {
  return `
    <section class="ls-state-card" aria-labelledby="learning-empty-title">
      <span class="ls-state-card__icon">${icon("book-dashed", "h-6 w-6")}</span>
      <h2 id="learning-empty-title">${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      ${action}
    </section>
  `;
}

export function errorState({ title, body, action = "" }) {
  return `
    <section class="ls-state-card ls-state-card--error" role="alert" aria-labelledby="learning-error-title">
      <span class="ls-state-card__icon">${icon("circle-alert", "h-6 w-6")}</span>
      <h2 id="learning-error-title">${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      ${action}
    </section>
  `;
}

export function lockedOverlay(message = "Complete the previous category to continue") {
  return `<div class="ls-locked-note">${icon("lock-keyhole", "h-4 w-4")}<span>${escapeHtml(message)}</span></div>`;
}

const navItems = [
  ["learn", "Learn", "book-open", "/app/learn"],
  ["review", "Review", "rotate-ccw", "/app/review"],
  ["progress", "Progress", "chart-no-axes-column-increasing", "/app/progress"],
  ["settings", "Settings", "settings", "/app/settings"]
];

function navigationItems(active, reviewDue = 0, settingsAttention = false) {
  return navItems.map(([id, label, iconName, href]) => `
    <a class="ls-primary-nav__item ${active === id ? "is-active" : ""}" href="${href}" data-app-link ${active === id ? 'aria-current="page"' : ""}>
      ${icon(iconName, "h-5 w-5")}
      <span>${label}</span>
      ${id === "review" && reviewDue ? `<b class="ls-nav-badge" aria-label="${reviewDue} reviews due">${reviewDue > 99 ? "99+" : reviewDue}</b>` : ""}
      ${id === "settings" && settingsAttention ? `<b class="ls-nav-badge" aria-label="Content needs attention">!</b>` : ""}
    </a>
  `).join("");
}

export function mobileNavigation(active, reviewDue = 0, settingsAttention = false) {
  return `<nav class="ls-primary-nav ls-primary-nav--mobile" aria-label="Learning navigation">${navigationItems(active, reviewDue, settingsAttention)}</nav>`;
}

export function desktopNavigation(active, user = {}, reviewDue = 0, settingsAttention = false) {
  return `
    <aside class="ls-learning-sidebar">
      <a class="ls-learning-brand" href="/app/learn" data-app-link aria-label="LinguaStories Learn home">
        <img src="/assets/img/linguastories.png" alt="" />
        <span><strong>LinguaStories</strong><small>Learn through real stories</small></span>
      </a>
      <nav class="ls-primary-nav ls-primary-nav--desktop" aria-label="Learning navigation">${navigationItems(active, reviewDue, settingsAttention)}</nav>
      <div class="ls-learning-sidebar__course">
        <span class="ls-learning-sidebar__course-icon">繁</span>
        <span><small>Learning</small><strong>Traditional Chinese</strong></span>
      </div>
      <a class="ls-learning-sidebar__back" href="/app/dashboard" data-app-link>${icon("layout-grid", "h-4 w-4")}<span>Community & lessons</span></a>
      <div class="ls-learning-sidebar__user">
        <span>${escapeHtml(String(user.displayName || "Learner").slice(0, 1).toUpperCase())}</span>
        <strong>${escapeHtml(user.displayName || "Learner")}</strong>
      </div>
    </aside>
  `;
}

export function appShell({ active, title, eyebrow = "Traditional Chinese", user, body, offline = false, wide = false, reviewDue = 0, settingsAttention = false }) {
  return `
    <div class="ls-learning-shell ${wide ? "ls-learning-shell--wide" : ""}">
      ${desktopNavigation(active, user, reviewDue, settingsAttention)}
      <div class="ls-learning-stage">
        ${offlineBanner({ visible: offline })}
        <header class="ls-learning-topbar">
          <a class="ls-learning-topbar__brand" href="/app/learn" data-app-link aria-label="LinguaStories Learn home">
            <img src="/assets/img/linguastories.png" alt="" />
          </a>
          <div class="ls-learning-topbar__title">
            <span>${escapeHtml(eyebrow)}</span>
            <strong>${escapeHtml(title)}</strong>
          </div>
          <a class="ls-learning-topbar__course" href="/app/languages" data-app-link aria-label="Change learning language"><span>繁</span>${icon("chevron-down", "h-3.5 w-3.5")}</a>
        </header>
        <div class="ls-learning-content" id="learningMain" tabindex="-1">${body}</div>
        ${mobileNavigation(active, reviewDue, settingsAttention)}
      </div>
    </div>
  `;
}

export function languageCard(language, state) {
  const status = state.forcedOffline ? "offline" : state.downloadStatus;
  const isBusy = ["preparing", "downloading", "validating_checksum", "validating_schema", "saving", "updating"].includes(status);
  const actionConfig = {
    not_installed: ["Download course", "startDownload", "download"],
    interrupted: ["Retry download", "startDownload", "refresh-cw"],
    download_failed: ["Try again", "startDownload", "refresh-cw"],
    update_failed: ["Retry update", "startUpdate", "refresh-cw"],
    offline: [state.installed ? "Continue offline" : "Connect to download", state.installed ? "continueLearning" : "", state.installed ? "arrow-right" : "wifi-off"],
    installed: ["Continue learning", "continueLearning", "arrow-right"],
    update_available: ["Download update", "startUpdate", "refresh-cw"],
    downloading: ["Downloading…", "", "loader-circle"],
    preparing: ["Preparing…", "", "loader-circle"],
    validating_checksum: ["Verifying…", "", "shield-check"],
    validating_schema: ["Checking content…", "", "shield-check"],
    saving: ["Installing…", "", "database"],
    updating: ["Updating…", "", "loader-circle"],
    corrupted_local_content: ["Repair download", "repairContent", "refresh-cw"],
    unsupported_app_version: ["App update required", "", "circle-alert"],
    unsupported_schema_version: ["Unsupported course", "", "circle-alert"],
    insufficient_storage: ["Free storage and retry", "startDownload", "hard-drive"]
  }[status] || ["Download course", "startDownload", "download"];
  const totalBytes = state.totalBytes || language.bytes || 0;
  const sizeLabel = totalBytes ? `${(totalBytes / 1024 / 1024).toFixed(1)} MB` : language.downloadSize;
  return `
    <article class="ls-language-card" aria-labelledby="language-${escapeHtml(language.id)}-title">
      <div class="ls-language-card__art" aria-hidden="true">
        <span class="ls-language-card__character">繁</span>
        <span class="ls-language-card__seal">中文</span>
      </div>
      <div class="ls-language-card__content">
        <div class="ls-language-card__heading">
          <div>
            <p>${escapeHtml(language.language)} · ${escapeHtml(language.scriptLabel)}</p>
            <h2 id="language-${escapeHtml(language.id)}-title">${escapeHtml(language.nativeName)}</h2>
          </div>
          ${statusBadge(status)}
        </div>
        <p class="ls-language-card__description">${escapeHtml(language.description)}</p>
        <dl class="ls-language-card__facts">
          <div><dt>From</dt><dd>${escapeHtml(language.sourceLanguage)}</dd></div>
          <div><dt>Locale</dt><dd>${escapeHtml(language.locale)}</dd></div>
          <div><dt>Download</dt><dd>${escapeHtml(sizeLabel)}</dd></div>
        </dl>
        ${isBusy ? progressIndicator(state.downloadProgress, status === "updating" ? "Updating course" : status === "validating" ? "Checking files" : "Downloading course") : ""}
        ${state.errorMessage ? `<p class="ls-language-card__message ls-language-card__message--error" role="alert">${icon("circle-alert", "h-4 w-4")}<span>${escapeHtml(state.errorMessage)}${state.errorCode ? `<small> Reference: ${escapeHtml(state.errorCode)}</small>` : ""}</span></p>` : ""}
        ${status === "offline" ? `<p class="ls-language-card__message" role="status">${icon("wifi-off", "h-4 w-4")}Connect to the internet to download this course.</p>` : ""}
        <div class="ls-language-card__actions">
          <button class="${ui.primary}" type="button" ${actionConfig[1] ? `data-learning-action="${actionConfig[1]}"` : "disabled"}>
            ${icon(actionConfig[2], `h-4 w-4 ${isBusy ? "animate-spin" : ""}`)}<span>${actionConfig[0]}</span>
          </button>
          ${isBusy ? `<button class="${ui.secondary}" type="button" data-learning-action="cancelDownload">Cancel</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

export function downloadStatus(state, { compact = false } = {}) {
  const status = state.forcedOffline ? "offline" : state.downloadStatus;
  return `
    <section class="ls-download-status ${compact ? "ls-download-status--compact" : ""}" aria-labelledby="download-status-title">
      <span class="ls-download-status__icon">${icon(statusConfig[status]?.icon || "download", "h-5 w-5")}</span>
      <div>
        <p id="download-status-title">Traditional Chinese</p>
        <strong>${statusConfig[status]?.label || "Course status"}</strong>
        <small>${state.installedVersion ? `Version ${escapeHtml(state.installedVersion)} · Available without internet` : status === "update_available" ? `Version ${escapeHtml(state.availableVersion || "new")} is ready` : "Stored privately in this browser"}</small>
      </div>
      ${statusBadge(status)}
    </section>
  `;
}

export function categoryCard(category, index) {
  const locked = category.status === "locked";
  const href = `/app/learn/${encodeURIComponent(category.id)}`;
  return `
    <article class="ls-category-card ls-category-card--${escapeHtml(category.status)}">
      <div class="ls-journey-marker" aria-hidden="true"><span>${category.status === "completed" || category.status === "review_due" ? icon("check", "h-4 w-4") : index + 1}</span></div>
      <div class="ls-category-card__panel">
        ${placeholderIllustration({ iconName: category.icon, accent: category.accent, label: `${category.name} illustration`, index: category.order })}
        <div class="ls-category-card__content">
          <div class="ls-category-card__heading">
            <div><p>Category ${category.order}</p><h2>${escapeHtml(category.name)}</h2></div>
            ${statusBadge(category.status)}
          </div>
          <p class="ls-category-card__description">${escapeHtml(category.description)}</p>
          <div class="ls-category-card__meta">
            <span>${icon("whole-word", "h-4 w-4")} ${category.wordCount} words</span>
            <span>${icon("layers-3", "h-4 w-4")} ${category.lessonCount} lessons</span>
          </div>
          ${progressIndicator(category.progress, `${category.name} progress`, { compact: true })}
          ${locked ? lockedOverlay() : `
            <a class="${category.status === "in_progress" ? ui.primary : ui.secondary} ls-category-card__action" href="${href}" data-app-link>
              ${icon(category.status === "review_due" ? "rotate-ccw" : category.status === "completed" ? "eye" : category.status === "in_progress" ? "play" : "arrow-right", "h-4 w-4")}
              <span>${category.status === "review_due" ? "Review category" : category.status === "completed" ? "View lessons" : category.status === "in_progress" ? "Continue" : "Explore category"}</span>
            </a>
          `}
        </div>
      </div>
    </article>
  `;
}

export function lessonCard(lesson, categoryId) {
  const locked = lesson.status === "locked";
  const generated = String(lesson.id).startsWith("lesson-category-");
  const href = generated ? `/app/learn/${encodeURIComponent(categoryId)}/${encodeURIComponent(lesson.id)}` : `/app/lesson/${encodeURIComponent(lesson.id)}?category=${encodeURIComponent(categoryId)}`;
  return `
    <article class="ls-lesson-card ls-lesson-card--${escapeHtml(lesson.status)}">
      <div class="ls-lesson-card__number" aria-hidden="true">${lesson.status === "completed" ? icon("check", "h-4 w-4") : lesson.number}</div>
      <div class="ls-lesson-card__body">
        <div class="ls-lesson-card__heading">
          <div><p>Lesson ${lesson.number}</p><h2>${escapeHtml(lesson.title)}</h2></div>
          ${statusBadge(lesson.status)}
        </div>
        <ul class="ls-word-preview" aria-label="Words in this lesson">${lesson.words.map((word) => `<li lang="zh-Hant">${escapeHtml(word)}</li>`).join("")}</ul>
        <div class="ls-lesson-card__footer">
          <span>${icon("clock-3", "h-4 w-4")} About ${lesson.minutes} min</span>
          ${progressIndicator(lesson.progress, `Lesson ${lesson.number} progress`, { compact: true })}
        </div>
        ${locked ? lockedOverlay("Finish the previous lesson to unlock this one") : `
          <a class="${lesson.status === "in_progress" ? ui.primary : ui.secondary}" href="${href}" data-app-link>
            ${icon(lesson.status === "in_progress" ? "play" : lesson.status === "completed" ? "rotate-ccw" : "arrow-right", "h-4 w-4")}
            <span>${lesson.status === "in_progress" ? "Continue lesson" : lesson.status === "completed" ? "Preview again" : "Start lesson"}</span>
          </a>
        `}
      </div>
    </article>
  `;
}

export function confirmationModal({ title, body, confirmLabel = "Continue", action = "confirmLearningReset" }) {
  return `
    <div class="ls-confirmation">
      <span class="ls-confirmation__icon">${icon("circle-help", "h-6 w-6")}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      <div class="ls-confirmation__actions">
        <button class="${ui.secondary}" type="button" data-action="closeModal">Cancel</button>
        <button class="${ui.danger}" type="button" data-learning-action="${escapeHtml(action)}">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>
  `;
}

export function typedConfirmationModal({ title, body, phrase, confirmLabel, action }) {
  return `<div class="ls-confirmation"><span class="ls-confirmation__icon">${icon("triangle-alert", "h-6 w-6")}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p><label class="ls-confirmation__field"><span>Type <strong>${escapeHtml(phrase)}</strong> to confirm</span><input type="text" data-confirmation-input autocomplete="off" spellcheck="false" /></label><div class="ls-confirmation__actions"><button class="${ui.secondary}" type="button" data-action="closeModal">Cancel</button><button class="${ui.danger}" type="button" data-learning-action="${escapeHtml(action)}" data-confirmation-phrase="${escapeHtml(phrase)}" disabled>${escapeHtml(confirmLabel)}</button></div></div>`;
}
