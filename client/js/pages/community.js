import { button, escapeHtml, formatDate, icon, ui } from "../ui.js";
import { languageName } from "../languages.js";
import { languageSkillLevelLabel } from "../levels.js";

const POST_TYPES = ["Learning Update", "Practice Note", "Lesson Win", "Question Post"];
const COMMUNITY_PAGE_SIZE = 10;

function optionList(items) {
  return [...items].sort((a, b) => a.localeCompare(b)).map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("");
}

function displayName(person = {}) {
  return person.displayName || person.name || person.author || "Learner";
}

function profileImage(person, size = "h-12 w-12") {
  if (person.avatarUrl) return `<img class="${size} rounded-full object-cover" src="${escapeHtml(person.avatarUrl)}" alt="">`;
  return `<div class="grid ${size} place-items-center rounded-full bg-brand-sidebar text-sm font-bold text-white">${escapeHtml(person.avatar || "?")}</div>`;
}

function learningLanguages(learner) {
  return (learner.learningLanguages || []).filter((item) => item.language);
}

function learnerLanguageText(learner, appConfig = {}) {
  return learningLanguages(learner)
    .map((item) => `${languageName(appConfig, item.language)}${item.currentLevel || item.level ? ` ${languageSkillLevelLabel(item.currentLevel || item.level)}` : ""}`)
    .join(", ");
}

function pagedItems(items, route, communityListLimits = {}) {
  const visible = Math.max(COMMUNITY_PAGE_SIZE, communityListLimits[route] || COMMUNITY_PAGE_SIZE);
  return { visible, items: items.slice(0, visible), total: items.length };
}

function loadMoreMessage({ route, visible, total }) {
  if (!total) return "";
  return `
    <div class="px-5 py-4 text-center sm:px-7" data-community-load-more="${route}" data-visible="${visible}" data-total="${total}">
      <p class="text-sm font-semibold text-brand-graphite">${
        total > visible ? `Scroll to load more posts. Showing ${Math.min(visible, total)} of ${total}.` : `Showing all ${total} posts from the last 7 days.`
      }</p>
    </div>
  `;
}

function communityShell({ title, subtitle, action = "", eyebrow = "Community", children }) {
  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-[linear-gradient(135deg,#fff7ef_0%,#f0f7f5_45%,#f8ebe7_100%)] px-4 py-5 sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel/92 shadow-[0_18px_44px_rgba(29,41,63,.08)]">
        <div class="border-b border-brand-line/80 bg-[linear-gradient(115deg,rgba(29,41,63,.96)_0%,rgba(88,112,115,.92)_58%,rgba(224,114,88,.34)_100%)] px-5 py-6 text-white sm:px-7">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl">
              ${eyebrow ? `<p class="text-xs font-semibold uppercase tracking-[.16em] text-white/58">${escapeHtml(eyebrow)}</p>` : ""}
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

function communityFeedShell({ action = "", children }) {
  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-brand-snow px-4 py-5 sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      ${action ? `<div class="mb-3 flex justify-end">${action}</div>` : ""}
      <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel/92 shadow-[0_12px_30px_rgba(29,41,63,.06)]">
        <div class="grid gap-0 bg-brand-panel/88">
          ${children}
        </div>
      </section>
    </div>
  `;
}

function postButton() {
  return `<button class="${ui.primary}" data-action="openCreatePostModal">${icon("message", "h-4 w-4")}<span>Post</span></button>`;
}

export function createPostModal() {
  return `
    <div>
      <span class="${ui.tagGold}">Community</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Create Post</h2>
      <p class="mt-2 ${ui.muted}">Share a practice update, lesson win, question, or useful tip with the community.</p>
      <form class="mt-5 grid gap-3" data-form="post">
        <label class="${ui.label}">Post Type<select class="${ui.input}" name="type">${optionList(POST_TYPES)}</select></label>
        <label class="${ui.label}">Picture<input class="${ui.input}" name="postImage" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <label class="${ui.label}">Post<textarea class="${ui.input} min-h-28" name="body" maxlength="5000" required placeholder="Share what you practiced, what helped, or what you want help with."></textarea></label>
        <div class="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-brand-line pt-4">
          <button class="${ui.primary}" type="submit" data-pending-label="Posting">${icon("message", "h-4 w-4")}<span>Post</span></button>
        </div>
      </form>
    </div>
  `;
}

function postImage(post) {
  if (!post.imageUrl) return "";
  const previewUrl = post.imageThumbUrl || post.imageUrl;
  return `
    <button class="mt-4 block h-24 w-24 overflow-hidden rounded-lg border border-brand-line/80 bg-white/55 text-left transition hover:border-brand-orange/50 sm:h-28 sm:w-28" data-action="expandPostImage:${escapeHtml(post.id)}" aria-label="Expand post picture">
      <img class="h-full w-full object-cover" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(post.author)}'s post picture">
    </button>
  `;
}

export function postImageModal({ state }, postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post?.imageUrl) return `<h2 class="text-2xl font-bold text-brand-ink">Picture not found</h2>`;
  return `
    <div>
      <span class="${ui.tagGold}">${escapeHtml(post.author)}</span>
      <div class="relative mt-5 min-h-[18rem] overflow-hidden rounded-lg border border-brand-line/80 bg-white" data-loading-image-frame>
        <div class="absolute inset-0 grid place-items-center text-brand-redDark" data-loading-image-indicator>
          <svg class="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3"></circle>
            <path class="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
          </svg>
        </div>
        <img class="max-h-[76vh] w-full object-contain opacity-0 transition-opacity duration-200" data-loading-image src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.author)}'s post picture">
      </div>
    </div>
  `;
}

function smallIcon(name) {
  const icons = {
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
      ${smallIcon("like")}
      <span>${escapeHtml(count)}</span>
    </button>
  `;
}

function iconMetric({ label, count, iconName }) {
  return `
    <span class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-line/90 bg-white/60 px-3 py-2 text-sm font-semibold text-brand-charcoal" aria-label="${escapeHtml(label)}">
      ${smallIcon(iconName)}
      <span>${escapeHtml(count)}</span>
    </span>
  `;
}

function profileHref(appPath, userId) {
  return userId ? appPath("communityLearner", { learnerId: userId }) : "";
}

function profileClickAttrs(appPath, userId) {
  const href = profileHref(appPath, userId);
  return href ? `href="${escapeHtml(href)}" data-app-link` : "";
}

function commentRow(comment, { appPath }) {
  const href = profileHref(appPath, comment.userId);
  const attrs = profileClickAttrs(appPath, comment.userId);
  const name = displayName(comment);
  return `
    <div class="rounded-lg bg-white/68 px-4 py-3 ring-1 ring-brand-line/75">
      <div class="flex items-center gap-2">
        ${href ? `<a class="shrink-0 no-underline" ${attrs} aria-label="View ${escapeHtml(name)}'s profile">${profileImage(comment, "h-8 w-8")}</a>` : profileImage(comment, "h-8 w-8")}
        ${href ? `<a class="text-sm font-bold text-brand-ink no-underline hover:text-brand-redDark" ${attrs}>${escapeHtml(name)}</a>` : `<strong class="text-sm text-brand-ink">${escapeHtml(name)}</strong>`}
        <span class="text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(comment.createdAt || comment.date))}</span>
      </div>
      <p class="mt-2 text-sm leading-6 text-brand-charcoal">${escapeHtml(comment.body)}</p>
    </div>
  `;
}

function commentSection(post, { appPath }) {
  const comments = post.commentItems || [];
  return `
    <div class="mt-4 grid gap-3">
      ${comments.length ? comments.map((comment) => commentRow(comment, { appPath })).join("") : `<p class="${ui.muted}">No comments yet.</p>`}
    </div>
    <form class="mt-4 grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" data-form="comment">
      <input type="hidden" name="postId" value="${escapeHtml(post.id)}">
      <textarea class="${ui.input} min-h-16 resize-y" name="body" maxlength="255" rows="2" required placeholder="Add a helpful reply"></textarea>
      <button class="${ui.primary} min-h-10 px-4 py-2 sm:w-auto">Reply</button>
    </form>
  `;
}

function feedRow(post, { appPath, currentUserId = "", showFollow = true, detail = false } = {}) {
  const href = profileHref(appPath, post.userId);
  const attrs = profileClickAttrs(appPath, post.userId);
  const postHref = appPath("communityPost", { postId: post.id });
  const isOwnPost = post.userId === currentUserId;
  const authorName = displayName(post);
  return `<article class="border-b border-brand-line/70 px-5 py-5 sm:px-7 ${detail ? "" : "cursor-pointer transition hover:bg-brand-mist/35"}" ${detail ? "" : `data-row-link="${postHref}"`}>
    <div class="flex items-start gap-3">
      ${href ? `<a class="shrink-0 no-underline" ${attrs} aria-label="View ${escapeHtml(authorName)}'s profile">${profileImage(post, "h-11 w-11")}</a>` : profileImage(post, "h-11 w-11")}
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          ${href ? `<a class="font-bold text-brand-ink no-underline hover:text-brand-redDark" ${attrs}>${escapeHtml(authorName)}</a>` : `<strong class="text-brand-ink">${escapeHtml(authorName)}</strong>`}
          <span class="${ui.tag}">${escapeHtml(post.type)}</span>
          <span class="text-xs font-semibold text-brand-graphite">${escapeHtml(formatDate(post.date || post.createdAt))}</span>
        </div>
        <p class="mt-2 text-sm leading-6 text-brand-charcoal">${escapeHtml(post.body)}</p>
        ${postImage(post)}
        <div class="mt-3 flex flex-wrap items-center gap-2">
          ${isOwnPost ? iconMetric({ label: "Likes", count: post.likes, iconName: "like" }) : iconAction({ label: "Like", count: post.likes, action: `like:${post.id}`, active: post.liked })}
          ${iconMetric({ label: "Comments", count: post.comments, iconName: "comment" })}
          ${showFollow && post.userId && !isOwnPost ? button(post.following ? "Following" : "Follow", `followLearner:${post.userId}`, ui.secondary) : ""}
        </div>
      </div>
    </div>
  </article>`;
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

function currentUserProfile(state) {
  const user = state.user || {};
  return {
    id: user.id,
    displayName: user.displayName,
    name: user.displayName,
    avatar: user.avatar,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    nativeLanguage: user.nativeLanguage,
    learningLanguages: state.learningLanguages || [],
    posts: (state.posts || []).filter((post) => post.userId === user.id).length,
    followers: 0,
    currentStreak: user.currentStreak || 0,
    following: false,
    isCurrentUser: true
  };
}

function postAuthorProfile(state, learnerId) {
  const authorPost = (state.posts || []).find((post) => post.userId === learnerId);
  if (!authorPost) return null;
  return {
    id: learnerId,
    displayName: authorPost.author,
    name: authorPost.author,
    avatar: authorPost.avatar,
    avatarUrl: authorPost.avatarUrl,
    bio: "Practicing through lessons, community, and steady progress.",
    nativeLanguage: authorPost.nativeLanguage,
    targetLanguage: authorPost.authorLanguage || authorPost.targetLanguage,
    learningLanguages: authorPost.targetLanguage ? [{ language: authorPost.targetLanguage, currentLevel: "" }] : [],
    posts: (state.posts || []).filter((post) => post.userId === learnerId).length,
    followers: 0,
    currentStreak: 0,
    following: Boolean(authorPost.following)
  };
}

function learnerPosts(state, learnerId) {
  return (state.posts || []).filter((post) => post.userId === learnerId).slice(0, 20);
}

function learnerProfilePosts({ appConfig, learner, posts, appPath, currentUserId }) {
  return `
    <section>
      <div class="border-b border-brand-line/70 px-5 py-4 sm:px-7">
        <h3 class="text-lg font-bold text-brand-ink">Posts</h3>
        <p class="mt-1 text-sm text-brand-graphite">Posts from the last 7 days.</p>
      </div>
      ${
        posts.length
          ? posts.map((post) => feedRow(post, { appPath, currentUserId, showFollow: false })).join("")
          : emptyState("No posts yet", `${displayName(learner)} has not posted in the last 7 days.`)
      }
    </section>
  `;
}

export function communityConnectView({ state, appPath, communityListLimits }) {
  const posts = state.posts || [];
  const page = pagedItems(posts, "communityConnect", communityListLimits);
  return communityShell({
    title: "Community Posts",
    eyebrow: "Community",
    subtitle: "See posts from the last 7 days, share practice updates, and keep the conversation going between lessons.",
    action: postButton(),
    children: page.items.length
      ? `${page.items.map((post) => feedRow(post, { appPath, currentUserId: state.user.id })).join("")}${loadMoreMessage({ route: "communityConnect", visible: page.visible, total: page.total })}`
      : emptyState("No posts from the last 7 days", "Start the conversation by sharing a practice update, question, or lesson win.")
  });
}

export function communityPostView({ state, appPath, activePostId }) {
  const post = (state.posts || []).find((item) => item.id === activePostId);
  if (!post) {
    return communityShell({
      title: "Post",
      subtitle: "This post could not be found.",
      children: emptyState("Post unavailable", "The post may be older than 7 days or no longer available.")
    });
  }
  return communityShell({
    title: "Post",
    eyebrow: "Community",
    subtitle: `${displayName(post)} shared a ${String(post.type || "post").toLowerCase()}.`,
    children: `
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line/70 px-5 py-4 sm:px-7">
        <a class="${ui.secondary}" href="${appPath("communityConnect")}" data-app-link>${icon("arrowLeft", "h-4 w-4")}<span>Back to Community</span></a>
      </div>
      ${feedRow(post, { appPath, currentUserId: state.user.id, showFollow: true, detail: true })}
      <section class="px-5 py-5 sm:px-7">
        <h3 class="text-lg font-bold text-brand-ink">Replies</h3>
        ${commentSection(post, { appPath })}
      </section>
    `
  });
}

export function communityLearnerView({ appConfig, state, appPath, activeLearnerId }) {
  const learner = activeLearnerId === state.user.id
    ? currentUserProfile(state)
    : state.learners.find((item) => item.id === activeLearnerId) || postAuthorProfile(state, activeLearnerId);
  if (!learner) {
    return communityShell({
      title: "Learner Profile",
      subtitle: "This learner profile could not be found.",
      children: emptyState("Profile unavailable", "The learner may no longer be visible.")
    });
  }
  const name = displayName(learner);
  const posts = learnerPosts(state, learner.id);
  const isCurrentUser = learner.id === state.user.id;
  return communityShell({
    title: name,
    subtitle: `${name} is learning ${learnerLanguageText(learner, appConfig) || languageName(appConfig, learner.targetLanguage) || "languages"}. Native language: ${languageName(appConfig, learner.nativeLanguage) || "Not set"}.`,
    children: `
      <section class="border-b border-brand-line/70 bg-[linear-gradient(135deg,rgba(255,250,244,.92),rgba(240,247,245,.88))] px-5 py-6 sm:px-7">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
            ${profileImage(learner, "h-24 w-24")}
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-3xl font-bold tracking-tight text-brand-ink">${escapeHtml(name)}</h2>
                ${isCurrentUser ? `<span class="${ui.tagDark}">Your public profile</span>` : `<span class="${learner.following ? ui.tagDark : ui.tagGold}">${learner.following ? "In your community" : "Community member"}</span>`}
              </div>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-brand-charcoal">${escapeHtml(learner.bio || "Practicing through lessons, community, and steady progress.")}</p>
              <div class="mt-5 flex flex-wrap gap-2">
                ${
                  isCurrentUser
                    ? `<a class="${ui.primary}" href="${appPath("profileInfo")}" data-app-link>${icon("user", "h-4 w-4")}<span>Edit My Account</span></a>`
                    : `${button(learner.following ? "Following" : "Follow Learner", `followLearner:${learner.id}`, ui.primary)}${button("Send Message", `openChatWith:${learner.id}`, ui.secondary)}`
                }
              </div>
            </div>
          </div>
          <aside class="rounded-lg border border-brand-line/80 bg-brand-panel/80 p-4">
            <h3 class="text-sm font-bold uppercase text-brand-graphite">Community profile</h3>
            <p class="mt-3 text-sm leading-6 text-brand-charcoal">Profiles show recent posts, languages, and the context learners share with the community.</p>
          </aside>
        </div>
      </section>
      <section class="grid gap-0 border-b border-brand-line/70 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="px-5 py-6 sm:px-7">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            ${profileStat("Posts", posts.length)}
            ${profileStat("Followers", learner.followers || 0)}
            ${profileStat("Following", learner.following ? "Yes" : "No")}
            ${profileStat("Current Streak", learner.currentStreak || 0)}
          </div>
          <div class="mt-7 grid gap-6 lg:grid-cols-2">
            ${languagePanel(
              "Learning",
              learningLanguages(learner).map((item) => `<span class="${ui.tagGold}">${escapeHtml(languageName(appConfig, item.language))} ${escapeHtml(languageSkillLevelLabel(item.currentLevel || item.level || "A1"))}</span>`)
            )}
            ${languagePanel("Native Language", learner.nativeLanguage ? [`<span class="${ui.tagDark}">${escapeHtml(languageName(appConfig, learner.nativeLanguage))}</span>`] : [])}
          </div>
        </div>
      </section>
      ${learnerProfilePosts({ appConfig, learner, posts, appPath, currentUserId: state.user.id })}
    `
  });
}
