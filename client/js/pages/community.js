import { button, escapeHtml, formatDate, icon, pct, progressBar, ui } from "../ui.js";

const POST_TYPES = ["Learning Update", "Sentence Share", "Story Completion", "Goal Share", "Question Post"];
const COMMUNITY_PAGE_SIZE = 10;

function optionList(items, getLabel, getValue = getLabel) {
  return items.map((item) => `<option value="${escapeHtml(getValue(item))}">${escapeHtml(getLabel(item))}</option>`).join("");
}

function profileImage(person, size = "h-12 w-12") {
  if (person.avatarUrl) return `<img class="${size} rounded-full object-cover" src="${escapeHtml(person.avatarUrl)}" alt="">`;
  return `<div class="grid ${size} place-items-center rounded-full bg-brand-sidebar text-sm font-bold text-white">${escapeHtml(person.avatar || "?")}</div>`;
}

function learningLanguages(learner) {
  const languages = learner.learningLanguages?.length ? learner.learningLanguages : [{ language: learner.targetLanguage, level: learner.currentLevel }];
  return languages.filter((item) => item.language);
}

function learnerLanguageText(learner) {
  return learningLanguages(learner)
    .map((item) => `${item.language}${item.level ? ` ${item.level}` : ""}`)
    .join(", ");
}

function activeLanguages(state) {
  const languages = (state.learningLanguages || []).filter((item) => item.active !== false).map((item) => item.language);
  if (state.user.targetLanguage && !languages.includes(state.user.targetLanguage)) languages.push(state.user.targetLanguage);
  return languages;
}

function isLikeMinded(state, learnerOrPost) {
  const languages = activeLanguages(state);
  const learnerLanguages = learnerOrPost.learningLanguages
    ? learningLanguages(learnerOrPost).map((item) => item.language)
    : [learnerOrPost.targetLanguage, learnerOrPost.authorLanguage].filter(Boolean);
  return learnerLanguages.some((language) => languages.includes(language));
}

function isWithinLastDays(date, days = 7) {
  if (!date) return false;
  const value = new Date(String(date).includes("T") ? date : `${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const oldest = new Date(today);
  oldest.setDate(today.getDate() - (days - 1));
  oldest.setHours(0, 0, 0, 0);
  return value >= oldest && value <= today;
}

function pagedItems(items, route, communityListLimits = {}) {
  const visible = Math.max(COMMUNITY_PAGE_SIZE, communityListLimits[route] || COMMUNITY_PAGE_SIZE);
  return { visible, items: items.slice(0, visible), hasMore: items.length > visible, total: items.length };
}

function loadMoreMessage({ route, visible, total, noun }) {
  if (!total) return "";
  return `
    <div class="px-5 py-4 text-center sm:px-7" data-community-load-more="${route}" data-visible="${visible}" data-total="${total}">
      <p class="text-sm font-semibold text-brand-graphite">${
        total > visible ? `Scroll to load more ${noun}. Showing ${Math.min(visible, total)} of ${total}.` : `Showing all ${total} ${noun} from the last 7 days.`
      }</p>
    </div>
  `;
}

function communityShell({ title, subtitle, action = "", children }) {
  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-[linear-gradient(135deg,#fff7ef_0%,#f0f7f5_45%,#f8ebe7_100%)] px-4 py-5 sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel/92 shadow-[0_18px_44px_rgba(29,41,63,.08)]">
        <div class="border-b border-brand-line/80 bg-[linear-gradient(115deg,rgba(29,41,63,.96)_0%,rgba(88,112,115,.92)_58%,rgba(224,114,88,.34)_100%)] px-5 py-6 text-white sm:px-7">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl">
              <p class="text-xs font-semibold uppercase tracking-[.16em] text-white/58">Community</p>
              <h2 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">${escapeHtml(title)}</h2>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-white/72">${escapeHtml(subtitle)}</p>
            </div>
            ${action}
          </div>
        </div>
        <div class="grid gap-0 bg-brand-panel/88">
          ${children}
        </div>
      </section>
    </div>
  `;
}

function postMomentButton() {
  return `<button class="${ui.primary}" data-action="openCreatePostModal">${icon("message", "h-4 w-4")}<span>Post a moment</span></button>`;
}

export function createPostModal({ state }) {
  const completedStories = state.stories.filter((story) => story.completed || story.unlocked);
  const savedSentences = state.sentences.filter((sentence) => state.savedSentences.includes(sentence.id));
  const publicGoals = state.goals.filter((goal) => goal.visibility === "Public");
  return `
    <div>
      <span class="${ui.tagGold}">${escapeHtml(state.user.targetLanguage)}</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Post a moment</h2>
      <p class="mt-2 ${ui.muted}">Post a story insight, sentence you practiced, goal update, or question for other learners.</p>
      <form class="mt-5 grid gap-3" data-form="post">
        <input type="hidden" name="targetLanguage" value="${escapeHtml(state.user.targetLanguage)}">
        <div class="grid gap-3 md:grid-cols-2">
          <label class="${ui.label}">Post Type<select class="${ui.input}" name="type">${optionList(POST_TYPES, (type) => type)}</select></label>
          <label class="${ui.label}">Sentence<select class="${ui.input}" name="sentenceId"><option value="">No sentence</option>${optionList(savedSentences, (sentence) => sentence.target, (sentence) => sentence.id)}</select></label>
          <label class="${ui.label}">Story<select class="${ui.input}" name="storyId"><option value="">No story</option>${optionList(completedStories, (story) => story.title, (story) => story.id)}</select></label>
          <label class="${ui.label}">Goal<select class="${ui.input}" name="goalId"><option value="">No goal</option>${optionList(publicGoals, (goal) => goal.title, (goal) => goal.id)}</select></label>
        </div>
        <label class="${ui.label}">Picture<input class="${ui.input}" name="momentImage" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <label class="${ui.label}">Post<textarea class="${ui.input} min-h-28" name="body" required placeholder="Share what this story, sentence, or goal helped you practice."></textarea></label>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-line pt-4">
          <p class="text-xs font-semibold text-brand-graphite">Sharing a learning post gives 2 coins.</p>
          <button class="${ui.primary}">${icon("message", "h-4 w-4")}<span>Post</span></button>
        </div>
      </form>
    </div>
  `;
}

function linkedContext(post) {
  const parts = [];
  if (post.sentenceTarget) parts.push(`<span class="${ui.tagGold}">Sentence: ${escapeHtml(post.sentenceTarget)}</span>`);
  if (post.storyTitle) parts.push(`<span class="${ui.tagGold}">Story: ${escapeHtml(post.storyTitle)}</span>`);
  if (post.goalTitle) parts.push(`<span class="${ui.tagGold}">Goal: ${escapeHtml(post.goalTitle)}</span>`);
  return parts.length ? `<div class="mt-3 flex flex-wrap gap-2">${parts.join("")}</div>` : "";
}

function momentImage(post, detail = false) {
  if (!post.imageUrl) return "";
  const previewUrl = post.imageThumbUrl || post.imageUrl;
  const frameClass = detail
    ? "mt-4 block w-full"
    : "mt-4 block h-24 w-24 sm:h-28 sm:w-28";
  const imageClass = detail
    ? "max-h-[420px] w-full object-cover"
    : "h-full w-full object-cover";
  return `
    <button class="${frameClass} overflow-hidden rounded-lg border border-brand-line/80 bg-white/55 text-left transition hover:border-brand-orange/50" data-action="expandMomentImage:${escapeHtml(post.id)}" aria-label="Expand moment picture">
      <img class="${imageClass}" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(post.author)}'s moment picture">
    </button>
  `;
}

export function momentImageModal({ state }, postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post?.imageUrl) return `<h2 class="text-2xl font-bold text-brand-ink">Picture not found</h2>`;
  return `
    <div>
      <span class="${ui.tagGold}">${escapeHtml(post.author)}</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Moment picture</h2>
      <div class="mt-5 overflow-hidden rounded-lg border border-brand-line/80 bg-white">
        <img class="max-h-[76vh] w-full object-contain" src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.author)}'s moment picture">
      </div>
    </div>
  `;
}

function momentIcon(name) {
  const icons = {
    eye: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>`,
    like: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10l5-8a3 3 0 0 1 3 3v4h4.2a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 17.8 21H7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    comment: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.6 8.6 0 0 1-7.7 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.6a8.4 8.4 0 0 1-.9-3.9 8.6 8.6 0 0 1 4.7-7.7 8.4 8.4 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11v.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };
  return icons[name] || "";
}

function iconAction({ label, count, action, active = false }) {
  return `
    <button class="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
      active ? "border-brand-red/35 bg-brand-red/10 text-brand-redDark" : "border-brand-line/90 bg-white/60 text-brand-charcoal hover:border-brand-orange/50 hover:bg-white"
    }" data-action="${action}" aria-label="${escapeHtml(label)}">
      ${momentIcon(label === "Like" ? "like" : "comment")}
      <span>${escapeHtml(count)}</span>
    </button>
  `;
}

function iconLink({ label, count, href }) {
  return `
    <a class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-line/90 bg-white/60 px-3 py-2 text-sm font-semibold text-brand-charcoal no-underline transition hover:border-brand-orange/50 hover:bg-white" href="${href}" data-app-link aria-label="${escapeHtml(label)}">
      ${momentIcon(label === "Like" ? "like" : "comment")}
      <span>${escapeHtml(count)}</span>
    </a>
  `;
}

function iconMetric({ label, count, iconName }) {
  return `
    <span class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-line/90 bg-white/60 px-3 py-2 text-sm font-semibold text-brand-charcoal" aria-label="${escapeHtml(label)}">
      ${momentIcon(iconName)}
      <span>${escapeHtml(count)}</span>
    </span>
  `;
}

function feedRow(post, { appPath, currentUserId = "", detail = false, showFollow = true } = {}) {
  const authorProfileHref = post.userId === currentUserId ? appPath("profileInfo") : post.userId ? appPath("communityLearner", { learnerId: post.userId }) : "";
  const momentHref = appPath("communityMoment", { postId: post.id });
  const isOwnMoment = post.userId === currentUserId;
  const authorAvatar = authorProfileHref
    ? `<a class="shrink-0 no-underline" href="${authorProfileHref}" data-app-link aria-label="View ${escapeHtml(post.author)}'s profile">${profileImage(post, "h-11 w-11")}</a>`
    : profileImage(post, "h-11 w-11");
  const authorName = authorProfileHref
    ? `<a class="font-bold text-brand-ink no-underline hover:text-brand-redDark" href="${authorProfileHref}" data-app-link>${escapeHtml(post.author)}</a>`
    : `<strong class="text-brand-ink">${escapeHtml(post.author)}</strong>`;
  const body = `
    <div class="flex items-start gap-3">
      ${authorAvatar}
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          ${authorName}
          <span class="${ui.tag}">${escapeHtml(post.type)}</span>
          <span class="text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(post.date))}</span>
        </div>
        <p class="mt-2 text-sm leading-6 text-brand-charcoal">${escapeHtml(post.body)}</p>
        ${momentImage(post, detail)}
        ${linkedContext(post)}
        <div class="mt-3 flex flex-wrap items-center gap-2">
          ${isOwnMoment ? iconMetric({ label: "Likes", count: post.likes, iconName: "like" }) : iconAction({ label: "Like", count: post.likes, action: `like:${post.id}`, active: post.liked })}
          ${!detail ? iconLink({ label: "Comment", count: post.comments, href: momentHref }) : ""}
          ${!detail && showFollow && post.userId && !isOwnMoment ? button(post.following ? "Following" : "Follow", `followLearner:${post.userId}`, ui.secondary) : ""}
        </div>
      </div>
    </div>
  `;
  return `<article class="border-b border-brand-line/70 px-5 py-5 transition hover:bg-brand-mist/35 sm:px-7 ${!detail ? "cursor-pointer" : ""}" ${
    !detail ? `data-row-link="${momentHref}" data-moment-view-id="${escapeHtml(post.id)}"` : ""
  }>${body}</article>`;
}

function emptyState(title, body) {
  return `
    <div class="px-5 py-12 text-center sm:px-7">
      <h3 class="text-xl font-bold text-brand-ink">${escapeHtml(title)}</h3>
      <p class="mx-auto mt-2 max-w-xl ${ui.muted}">${escapeHtml(body)}</p>
    </div>
  `;
}

function profileStat(label, value) {
  return `
    <div class="rounded-lg bg-white/70 p-4 ring-1 ring-brand-line/75">
      <strong class="block text-2xl font-bold tracking-tight text-brand-ink">${escapeHtml(value)}</strong>
      <span class="mt-1 block text-xs font-semibold uppercase text-brand-graphite">${escapeHtml(label)}</span>
    </div>
  `;
}

function languagePanel(title, items) {
  return `
    <div>
      <h3 class="text-sm font-bold uppercase text-brand-graphite">${escapeHtml(title)}</h3>
      <div class="mt-3 flex flex-wrap gap-2">
        ${items.length ? items.join("") : `<span class="${ui.tag}">Not set</span>`}
      </div>
    </div>
  `;
}

function supportGoalCard(goal) {
  return `
    <article class="rounded-lg border border-brand-line/80 bg-white/68 p-4 ring-1 ring-white/35">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex flex-wrap gap-2">
            <span class="${goal.goalScope === "Global" ? ui.tagDark : ui.tagGold}">${escapeHtml(goal.goalScope === "Global" ? "All languages" : goal.targetLanguage || "Language")}</span>
            <span class="${ui.tag}">${escapeHtml(goal.type)}</span>
            ${goal.dueDate ? `<span class="${ui.tagRed}">By ${escapeHtml(formatDate(goal.dueDate))}</span>` : ""}
          </div>
          <h4 class="mt-3 text-lg font-bold tracking-tight text-brand-ink">${escapeHtml(goal.title)}</h4>
        </div>
        <button class="${ui.primary}" data-action="openSupportGoalModal:${goal.id}">Support</button>
      </div>
      <div class="mt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-semibold text-brand-graphite">${goal.progress} / ${goal.target}</span>
          <span class="text-sm font-semibold text-brand-red">${pct(goal.progress, goal.target)}%</span>
        </div>
        <div class="mt-2">${progressBar(pct(goal.progress, goal.target))}</div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="${ui.tagGold}">${goal.supportReceived || 0} coins supported</span>
        ${goal.supportedByMe ? `<span class="${ui.tagDark}">You gave ${goal.supportedByMe}</span>` : ""}
      </div>
    </article>
  `;
}

function learnerActivityRow(activity) {
  return `
    <article class="flex gap-3 rounded-lg border border-brand-line/80 bg-white/68 p-4">
      <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-redDark">
        ${icon(activity.type === "story" ? "book" : "check", "h-4 w-4")}
      </div>
      <div class="min-w-0">
        <div class="${ui.row}">
          <span class="${activity.type === "story" ? ui.tagGold : ui.tagRed}">${escapeHtml(activity.label)}</span>
          <span class="${ui.tag}">${escapeHtml(activity.targetLanguage || "Language")}</span>
          <span class="text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(activity.date))}</span>
        </div>
        <p class="mt-2 text-sm font-semibold leading-6 text-brand-charcoal">${escapeHtml(activity.detail)}</p>
      </div>
    </article>
  `;
}

function learnerProfileTabs({ learner, posts, activities, activeTab, appPath, currentUserId }) {
  const tabs = [
    ["activity", "Recent Learning Activity", activities.length],
    ["moments", "Moments", posts.length]
  ];
  const tabButton = ([id, label, count]) => `
    <button class="flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      activeTab === id ? "bg-brand-sidebar text-white shadow-[0_8px_16px_rgba(29,41,63,.12)]" : "text-brand-graphite hover:bg-white hover:text-brand-ink"
    }" data-action="setLearnerProfileTab:${learner.id}:${id}">
      <span>${escapeHtml(label)}</span>
      <span class="${activeTab === id ? "bg-white/15 text-white" : "bg-brand-mist text-brand-graphite"} rounded-full px-2 py-0.5 text-[11px]">${count}</span>
    </button>
  `;
  const body =
    activeTab === "moments"
      ? posts.length
        ? posts.map((post) => feedRow(post, { appPath, currentUserId, showFollow: false })).join("")
        : emptyState("No moments yet", "This learner has not created any moment posts yet.")
      : activities.length
        ? `<div class="grid gap-3 px-5 py-5 sm:px-7">${activities.map(learnerActivityRow).join("")}</div>`
        : emptyState("No learning activity yet", "Completed stories and remembered sentences will appear here.");

  return `
    <section>
      <div class="border-b border-brand-line/70 px-5 py-4 sm:px-7">
        <div class="grid gap-2 rounded-lg bg-brand-mist/55 p-1 sm:grid-cols-2">
          ${tabs.map(tabButton).join("")}
        </div>
      </div>
      ${body}
    </section>
  `;
}

export function supportGoalModal({ state }, goalId) {
  const goal = state.communityGoals?.find((item) => item.id === goalId);
  if (!goal) return `<h2 class="text-2xl font-bold text-brand-ink">Goal not found</h2>`;
  const maxAmount = Math.max(0, state.wallet.balance || 0);
  const defaultAmount = maxAmount > 0 ? Math.min(10, maxAmount) : 0;
  return `
    <div>
      <span class="${ui.tagGold}">${escapeHtml(goal.author)}</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Support This Goal</h2>
      <p class="mt-2 ${ui.muted}">Give coins to encourage this learner and help them stay committed.</p>
      <div class="mt-4 rounded-lg bg-brand-mist/60 px-4 py-3">
        <span class="block text-xs font-semibold uppercase text-brand-graphite">Goal</span>
        <strong class="mt-1 block text-sm text-brand-ink">${escapeHtml(goal.title)}</strong>
        <p class="mt-2 text-xs font-semibold text-brand-graphite">${goal.supportReceived || 0} coins supported so far · Your balance: ${maxAmount}</p>
      </div>
      <form class="mt-5 grid gap-4" data-form="goalSupport">
        <input type="hidden" name="goalId" value="${escapeHtml(goal.id)}">
        <label class="${ui.label}">Coins<input class="${ui.input}" name="amount" type="number" min="1" max="${maxAmount}" value="${defaultAmount}" required></label>
        <label class="${ui.label}">Message<textarea class="${ui.input} min-h-24" name="message" placeholder="Optional encouragement"></textarea></label>
        <div class="flex justify-end border-t border-brand-line pt-4">
          <button class="${ui.primary}" ${maxAmount < 1 ? "disabled" : ""}>Give Coins</button>
        </div>
      </form>
    </div>
  `;
}

export function appreciateMomentModal({ state }, postId) {
  const post = state.posts?.find((item) => item.id === postId);
  if (!post) return `<h2 class="text-2xl font-bold text-brand-ink">Moment not found</h2>`;
  const maxAmount = Math.max(0, state.wallet.balance || 0);
  const defaultAmount = maxAmount > 0 ? Math.min(5, maxAmount) : 0;
  return `
    <div>
      <span class="${ui.tagGold}">${escapeHtml(post.author)}</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Send Appreciation</h2>
      <p class="mt-2 ${ui.muted}">Send coins to thank this learner for sharing a useful language-learning moment.</p>
      <div class="mt-4 rounded-lg bg-brand-mist/60 px-4 py-3">
        <span class="block text-xs font-semibold uppercase text-brand-graphite">Moment</span>
        <p class="mt-1 text-sm font-semibold leading-6 text-brand-ink">${escapeHtml(post.body)}</p>
        <p class="mt-2 text-xs font-semibold text-brand-graphite">Your balance: ${maxAmount}</p>
      </div>
      <form class="mt-5 grid gap-4" data-form="momentAppreciation">
        <input type="hidden" name="postId" value="${escapeHtml(post.id)}">
        <label class="${ui.label}">Coins<input class="${ui.input}" name="amount" type="number" min="1" max="${maxAmount}" value="${defaultAmount}" required></label>
        <label class="${ui.label}">Message<textarea class="${ui.input} min-h-24" name="message" maxlength="255" placeholder="Optional thank-you note"></textarea></label>
        <div class="flex justify-end border-t border-brand-line pt-4">
          <button class="${ui.primary}" ${maxAmount < 1 ? "disabled" : ""}>Send Coins</button>
        </div>
      </form>
    </div>
  `;
}

function myMomentRow(post, { appPath }) {
  const momentHref = appPath("communityMoment", { postId: post.id });
  return `
    <article class="cursor-pointer border-b border-brand-line/70 px-5 py-5 transition hover:bg-brand-mist/35 sm:px-7" data-row-link="${momentHref}" data-moment-view-id="${escapeHtml(post.id)}">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${ui.tag}">${escapeHtml(post.type)}</span>
          <span class="text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(post.date))}</span>
        </div>
        <p class="mt-3 text-sm leading-6 text-brand-charcoal">${escapeHtml(post.body)}</p>
        ${momentImage(post)}
        ${linkedContext(post)}
        <div class="mt-3 flex flex-wrap gap-2">
          ${iconMetric({ label: "Viewed", count: Number(post.viewCount || 0), iconName: "eye" })}
          ${iconMetric({ label: "Likes", count: Number(post.likes || 0), iconName: "like" })}
          ${iconLink({ label: "Comment", count: Number(post.comments || 0), href: momentHref })}
        </div>
      </div>
    </article>
  `;
}

export function profileMomentsView({ state, appPath }) {
  const moments = state.posts.filter((post) => post.userId === state.user.id);
  return communityShell({
    title: "My Moments",
    subtitle: "Review the moments you posted and see how many people viewed each one.",
    action: postMomentButton(),
    children: moments.length ? moments.map((post) => myMomentRow(post, { appPath })).join("") : emptyState("No moments posted yet", "Post a moment from Moments to share your learning progress.")
  });
}

function learnerRow(learner, { appPath }) {
  return `
    <a class="block border-b border-brand-line/70 px-5 py-5 no-underline transition hover:bg-brand-mist/35 sm:px-7" href="${appPath("communityLearner", { learnerId: learner.id })}" data-app-link>
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div class="flex min-w-0 items-start gap-3">
          ${profileImage(learner)}
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-brand-ink">${escapeHtml(learner.displayName)}</h3>
              <span class="${ui.tag}">${learner.following ? "Following" : "Connect"}</span>
            </div>
            <p class="mt-1 text-xs font-semibold text-brand-graphite">Learning ${escapeHtml(learnerLanguageText(learner) || "a language")} · Native ${escapeHtml(learner.nativeLanguage || "Not set")}</p>
            <p class="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-brand-charcoal">${escapeHtml(learner.bio || "Practicing through stories, sentences, and steady progress.")}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="rounded-lg bg-white/65 p-3 ring-1 ring-brand-line/70"><strong class="block text-lg text-brand-ink">${learner.posts}</strong><span class="text-xs font-semibold text-brand-graphite">posts</span></div>
          <div class="rounded-lg bg-white/65 p-3 ring-1 ring-brand-line/70"><strong class="block text-lg text-brand-ink">${learner.goals}</strong><span class="text-xs font-semibold text-brand-graphite">goals</span></div>
        </div>
      </div>
    </a>
  `;
}

export function communityConnectView({ state, appPath, communityListLimits, connectMyCommunityOnly = false }) {
  const recentLearnerIds = new Set(state.posts.filter((post) => isWithinLastDays(post.date, 7)).map((post) => post.userId).filter(Boolean));
  const matchedLearners = state.learners.filter((learner) => recentLearnerIds.has(learner.id) && isLikeMinded(state, learner));
  const communityLearners = matchedLearners.filter((learner) => learner.following);
  const newLearners = matchedLearners.filter((learner) => !learner.following);
  const learners = connectMyCommunityOnly ? communityLearners : newLearners;
  const page = pagedItems(learners, "communityConnect", communityListLimits);
  const languageList = activeLanguages(state).join(", ");
  const tabButton = ({ id, label, count, active }) => `
    <button class="flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-brand-sidebar text-white shadow-[0_8px_16px_rgba(29,41,63,.12)]" : "text-brand-graphite hover:bg-white hover:text-brand-ink"
    }" data-action="setConnectCommunityFilter:${id}" role="tab" aria-selected="${active ? "true" : "false"}">
      <span>${label}</span>
      <span class="${active ? "bg-white/15 text-white" : "bg-brand-mist text-brand-graphite"} rounded-full px-2 py-0.5 text-[11px]">${count}</span>
    </button>
  `;
  const tabs = `
    <section class="border-b border-brand-line/70 px-5 py-4 sm:px-7">
      <div class="grid gap-2 rounded-lg bg-brand-mist/55 p-1 sm:grid-cols-2" role="tablist" aria-label="Connect filters">
        ${tabButton({ id: "community", label: "My Community", count: communityLearners.length, active: connectMyCommunityOnly })}
        ${tabButton({ id: "new", label: "New Connects", count: newLearners.length, active: !connectMyCommunityOnly })}
      </div>
    </section>
  `;
  return communityShell({
    title: "Connect",
    subtitle: connectMyCommunityOnly
      ? `Learners you follow with activity from the last 7 days: ${languageList || state.user.targetLanguage}.`
      : `Learners you are not following yet with activity from the last 7 days: ${languageList || state.user.targetLanguage}.`,
    children: `${tabs}${
      page.items.length
        ? `${page.items.map((learner) => learnerRow(learner, { appPath })).join("")}${loadMoreMessage({ route: "communityConnect", visible: page.visible, total: page.total, noun: "learners" })}`
        : connectMyCommunityOnly
          ? emptyState("No followed learners active", "Follow learners from Connect to build your community.")
          : emptyState("No new matched learners", "You are caught up with like-minded learners outside your community.")
    }`
  });
}

function momentRow(post, { appPath, currentUserId = "" }) {
  const profileHref = post.userId === currentUserId ? appPath("profileInfo") : post.userId ? appPath("communityLearner", { learnerId: post.userId }) : "";
  const momentHref = appPath("communityMoment", { postId: post.id });
  const isOwnMoment = post.userId === currentUserId;
  return `
    <article class="cursor-pointer border-b border-brand-line/70 px-5 py-5 transition hover:bg-brand-mist/35 sm:px-7" data-row-link="${momentHref}" data-moment-view-id="${escapeHtml(post.id)}">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div class="flex min-w-0 items-start gap-3">
          ${profileHref ? `<a class="shrink-0 no-underline" href="${profileHref}" data-app-link aria-label="View ${escapeHtml(post.author)}'s profile">${profileImage(post)}</a>` : profileImage(post)}
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              ${
                profileHref
                  ? `<a class="font-bold text-brand-ink no-underline hover:text-brand-redDark" href="${profileHref}" data-app-link>${escapeHtml(post.author)}</a>`
                  : `<strong class="text-brand-ink">${escapeHtml(post.author)}</strong>`
              }
              <span class="${ui.tag}">Learning ${escapeHtml(post.targetLanguage || post.authorLanguage || "Language")}</span>
              <span class="${ui.tagGold}">Native ${escapeHtml(post.nativeLanguage || "Not set")}</span>
            </div>
            <p class="mt-1 text-xs font-semibold text-brand-graphite">${escapeHtml(post.type)} · ${escapeHtml(formatDate(post.date))}</p>
            <p class="mt-3 text-sm leading-6 text-brand-charcoal">${escapeHtml(post.body)}</p>
            ${momentImage(post)}
            <div class="mt-3 flex flex-wrap gap-2">
              ${post.storyTitle ? `<span class="${ui.tagGold}">Story: ${escapeHtml(post.storyTitle)}</span>` : ""}
              ${post.goalTitle ? `<span class="${ui.tagGold}">Goal: ${escapeHtml(post.goalTitle)}</span>` : ""}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              ${isOwnMoment ? iconMetric({ label: "Likes", count: post.likes, iconName: "like" }) : iconAction({ label: "Like", count: post.likes, action: `like:${post.id}`, active: post.liked })}
              ${iconLink({ label: "Comment", count: post.comments, href: momentHref })}
            </div>
          </div>
        </div>
        <div class="flex justify-start lg:justify-end">
          ${post.userId && post.userId !== currentUserId ? button(post.following ? "Following" : "Follow", `followLearner:${post.userId}`, ui.secondary) : ""}
        </div>
      </div>
    </article>
  `;
}

export function communityMomentsView({ state, appPath, communityListLimits }) {
  const moments = state.posts.filter((post) => post.userId === state.user.id || isLikeMinded(state, post));
  const page = pagedItems(moments, "communityMoments", communityListLimits);
  return communityShell({
    title: "Moments",
    subtitle: "See how followed learners and new like-minded learners are progressing in their language journey.",
    action: postMomentButton(),
    children: page.items.length
      ? `${page.items.map((post) => momentRow(post, { appPath, currentUserId: state.user.id })).join("")}${loadMoreMessage({ route: "communityMoments", visible: page.visible, total: page.total, noun: "moments" })}`
      : emptyState("No moments yet", "You are caught up with learners in your language profiles.")
  });
}

export function communityLearnerView({ state, appPath, activeLearnerId, selectedLearnerProfileTabs }) {
  const learner = state.learners.find((item) => item.id === activeLearnerId);
  if (!learner) {
    return communityShell({
      title: "Learner Profile",
      subtitle: "This learner profile could not be found.",
      children: emptyState("Profile unavailable", "The learner may no longer be visible.")
    });
  }
  const posts = state.posts.filter((post) => post.userId === learner.id).slice(0, 20);
  const activities = state.learnerActivities?.[learner.id] || [];
  const activeProfileTab = selectedLearnerProfileTabs?.[learner.id] || "activity";
  const publicGoals = (state.communityGoals || []).filter((goal) => goal.userId === learner.id).slice(0, 4);
  const sharedLanguages = learningLanguages(learner).filter((item) => activeLanguages(state).includes(item.language));
  const latestPost = posts[0];
  return communityShell({
    title: learner.displayName,
    subtitle: `${learner.displayName} is learning ${learnerLanguageText(learner) || learner.targetLanguage}. Native language: ${learner.nativeLanguage || "Not set"}.`,
    children: `
      <section class="border-b border-brand-line/70 bg-[linear-gradient(135deg,rgba(255,250,244,.92),rgba(240,247,245,.88))] px-5 py-6 sm:px-7">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
            ${profileImage(learner, "h-24 w-24")}
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-3xl font-bold tracking-tight text-brand-ink">${escapeHtml(learner.displayName)}</h2>
                <span class="${learner.following ? ui.tagDark : ui.tagGold}">${learner.following ? "In your community" : "Recommended match"}</span>
              </div>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-brand-charcoal">${escapeHtml(learner.bio || "Practicing through stories, sentences, and steady progress.")}</p>
              <div class="mt-5 flex flex-wrap gap-2">
                ${button(learner.following ? "Following" : "Follow Learner", `followLearner:${learner.id}`, ui.primary)}
                ${button("Encourage Message", `openChatWith:${learner.id}`, ui.secondary)}
              </div>
            </div>
          </div>
          <aside class="rounded-lg border border-brand-line/80 bg-brand-panel/80 p-4">
            <h3 class="text-sm font-bold uppercase text-brand-graphite">Why follow</h3>
            <p class="mt-3 text-sm leading-6 text-brand-charcoal">${
              sharedLanguages.length
                ? `You both practice ${escapeHtml(sharedLanguages.map((item) => item.language).join(", "))}, so their sentences, story notes, and goals are likely useful to your own study.`
                : "This learner shares story-based updates, sentence practice, and goal progress you can learn from."
            }</p>
          </aside>
        </div>
      </section>
      <section class="grid gap-0 border-b border-brand-line/70 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="px-5 py-6 sm:px-7">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            ${profileStat("Posts", learner.posts)}
            ${profileStat("Public Goals", learner.goals)}
            ${profileStat("Followers", learner.followers || 0)}
            ${profileStat("Current Streak", learner.currentStreak || 0)}
          </div>
          <div class="mt-7 grid gap-6 lg:grid-cols-2">
            ${languagePanel(
              "Learning",
              learningLanguages(learner).map((item) => `<span class="${ui.tagGold}">${escapeHtml(item.language)} ${escapeHtml(item.level || "")}</span>`)
            )}
            ${languagePanel("Native Language", learner.nativeLanguage ? [`<span class="${ui.tagDark}">${escapeHtml(learner.nativeLanguage)}</span>`] : [])}
          </div>
        </div>
        <aside class="border-t border-brand-line/70 bg-brand-mist/25 px-5 py-6 sm:px-7 lg:border-l lg:border-t-0">
          <h3 class="text-lg font-bold text-brand-ink">Latest focus</h3>
          ${
            latestPost
              ? `
                <p class="mt-2 text-xs font-semibold uppercase text-brand-graphite">${escapeHtml(latestPost.type)} · ${escapeHtml(formatDate(latestPost.date))}</p>
                <p class="mt-3 text-sm leading-6 text-brand-charcoal">${escapeHtml(latestPost.body)}</p>
                ${linkedContext(latestPost)}
              `
              : `<p class="mt-2 ${ui.muted}">No recent learning focus yet.</p>`
          }
        </aside>
      </section>
      <section class="border-b border-brand-line/70 px-5 py-6 sm:px-7">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-brand-ink">Goals You Can Support</h3>
            <p class="mt-1 ${ui.muted}">Give coins to encourage this learner's public goals.</p>
          </div>
          <span class="text-xs font-semibold uppercase text-brand-graphite">${publicGoals.length} goals</span>
        </div>
        <div class="mt-4 grid gap-3 lg:grid-cols-2">
          ${publicGoals.length ? publicGoals.map(supportGoalCard).join("") : `<div class="rounded-lg bg-white/68 p-4 ring-1 ring-brand-line/75"><p class="${ui.muted}">No public goals available to support yet.</p></div>`}
        </div>
      </section>
      ${learnerProfileTabs({ learner, posts, activities, activeTab: activeProfileTab, appPath, currentUserId: state.user.id })}
    `
  });
}

export function communityMomentView({ state, appPath, activePostId }) {
  const post = state.posts.find((item) => item.id === activePostId);
  if (!post) {
    return communityShell({
      title: "Moment Detail",
      subtitle: "This learning moment could not be found.",
      children: emptyState("Moment unavailable", "The moment may have been removed.")
    });
  }
  return communityShell({
    title: "Moment Detail",
    subtitle: `${post.author} shared a ${post.type.toLowerCase()} for ${post.targetLanguage || post.authorLanguage || "language learning"}.`,
    children: `
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line/70 px-5 py-4 sm:px-7">
        <a class="${ui.secondary}" href="${appPath("communityMoments")}" data-app-link>${icon("arrowLeft", "h-4 w-4")}<span>Back to Moments</span></a>
        ${post.userId && post.userId !== state.user.id ? `<button class="${ui.primary}" data-action="openMomentAppreciation:${post.id}">${icon("coins", "h-4 w-4")}<span>Send Appreciation</span></button>` : ""}
      </div>
      ${feedRow(post, { appPath, currentUserId: state.user.id, detail: true })}
      <section class="px-5 py-5 sm:px-7">
        <h3 class="text-lg font-bold text-brand-ink">Comments</h3>
        <div class="mt-4 grid gap-3">
          ${(post.commentItems || [])
            .map(
              (comment) => `
                <div class="rounded-lg bg-white/68 px-4 py-3 ring-1 ring-brand-line/75">
                  <div class="flex items-center gap-2">
                    ${profileImage(comment, "h-8 w-8")}
                    <strong class="text-sm text-brand-ink">${escapeHtml(comment.author)}</strong>
                    <span class="text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(comment.date))}</span>
                  </div>
                  <p class="mt-2 text-sm leading-6 text-brand-charcoal">${escapeHtml(comment.body)}</p>
                </div>
              `
            )
            .join("") || `<p class="${ui.muted}">No comments yet. Add a useful note or encouragement.</p>`}
        </div>
        <form class="mt-4 grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" data-form="comment">
          <input type="hidden" name="postId" value="${escapeHtml(post.id)}">
          <textarea class="${ui.input} min-h-16 resize-y" name="body" maxlength="255" rows="2" required placeholder="Comment with a useful tip or encouragement"></textarea>
          <button class="${ui.primary} min-h-10 px-4 py-2 sm:w-auto">Post</button>
        </form>
      </section>
    `
  });
}
