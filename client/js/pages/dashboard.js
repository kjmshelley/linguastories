import { escapeHtml, icon, progressBar, ui } from "../ui.js";
import { languageName } from "../languages.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function sameLanguage(item, language) {
  return !item?.targetLanguage || item.targetLanguage === language;
}

function appLink(appPath, route, label, iconName, className = ui.secondary) {
  return `<a class="${className}" href="${escapeHtml(appPath(route))}" data-app-link>${icon(iconName, "h-4 w-4")}<span>${escapeHtml(label)}</span></a>`;
}

function metric(label, value, tone = "neutral") {
  const toneClass = tone === "urgent" ? "text-brand-redDark" : tone === "good" ? "text-brand-teal" : "text-brand-ink";
  return `
    <div class="rounded-lg border border-brand-line/75 bg-white/65 p-4">
      <span class="block text-xs font-bold uppercase text-brand-graphite">${escapeHtml(label)}</span>
      <strong class="mt-2 block text-2xl font-bold ${toneClass}">${escapeHtml(value)}</strong>
    </div>
  `;
}

function actionCard({ title, body, meta, iconName, href, action = "", buttonLabel, buttonIcon, primary = false }) {
  const control = action
    ? `<button class="${primary ? ui.primary : ui.secondary}" data-action="${escapeHtml(action)}">${icon(buttonIcon, "h-4 w-4")}<span>${escapeHtml(buttonLabel)}</span></button>`
    : `<a class="${primary ? ui.primary : ui.secondary}" href="${escapeHtml(href)}" data-app-link>${icon(buttonIcon, "h-4 w-4")}<span>${escapeHtml(buttonLabel)}</span></a>`;

  return `
    <article class="rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="flex items-start gap-3">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-redDark">${icon(iconName, "h-5 w-5")}</div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-brand-ink">${escapeHtml(title)}</h3>
          <p class="mt-1 text-sm leading-6 text-brand-graphite">${escapeHtml(body)}</p>
          ${meta ? `<p class="mt-2 text-xs font-bold text-brand-charcoal">${escapeHtml(meta)}</p>` : ""}
        </div>
      </div>
      <div class="mt-4">${control}</div>
    </article>
  `;
}

function listItem(title, body, href, iconName) {
  return `
    <a class="flex items-center gap-3 rounded-lg border border-brand-line/75 bg-white/65 p-3 no-underline transition hover:border-brand-orange/45 hover:bg-white" href="${escapeHtml(href)}" data-app-link>
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-redDark">${icon(iconName, "h-4 w-4")}</span>
      <span class="min-w-0">
        <strong class="block truncate text-sm text-brand-ink">${escapeHtml(title)}</strong>
        <span class="block truncate text-xs font-semibold text-brand-graphite">${escapeHtml(body)}</span>
      </span>
      <span class="ml-auto text-brand-graphite">${icon("arrowRight", "h-4 w-4")}</span>
    </a>
  `;
}

function progressLine(label, value) {
  return `
    <div class="flex items-center justify-between gap-3 border-b border-brand-line/70 py-3 last:border-b-0">
      <span class="text-sm font-semibold text-brand-graphite">${escapeHtml(label)}</span>
      <strong class="text-sm text-brand-ink">${escapeHtml(value)}</strong>
    </div>
  `;
}

export function dashboardView({ appConfig, state, appPath = (route) => `/app/${route}`, selectedProfileLanguage }) {
  const activeLanguage = selectedProfileLanguage || state.user.targetLanguage;
  const activeLanguageName = languageName(appConfig, activeLanguage);
  const sentences = (state.sentences || []).filter((sentence) => sameLanguage(sentence, activeLanguage));
  const stories = (state.stories || []).filter((story) => sameLanguage(story, activeLanguage));
  const goals = (state.goals || []).filter((goal) => sameLanguage(goal, activeLanguage));
  const today = todayKey();
  const dueSentences = sentences.filter((sentence) => sentence.state !== "New" && sentence.dueDate <= today);
  const unlockedStories = stories.filter((story) => story.unlocked && !story.completed);
  const activeGoals = goals.filter((goal) => !goal.completed);
  const followedLearners = (state.learners || []).filter((learner) => learner.following);
  const newLearners = (state.learners || []).filter((learner) => !learner.following);
  const recentMoments = state.posts || [];
  const decks = (state.sentenceDecks || []).filter((deck) => sameLanguage(deck, activeLanguage));
  const reviewDecks = decks.filter((deck) => deck.reviewStatus === "Review Due");
  const savedDecks = decks.filter((deck) => deck.savedByUser || deck.owner || deck.category === "My Decks");
  const progress = state.dashboard?.progress || {};
  const goalProgress = Number(progress.goalCompletionRate || 0);

  const primaryActions = [
    actionCard({
      title: "Review what is due",
      body: dueSentences.length ? "Keep saved sentences fresh before they pile up." : "No sentence reviews are due right now. You can still practice your deck.",
      meta: `${dueSentences.length || state.dashboard?.reviewsDue || 0} due today`,
      iconName: "bell",
      action: "openReview",
      buttonLabel: "Start Review",
      buttonIcon: "book",
      primary: true
    }),
    actionCard({
      title: "Mine useful sentences",
      body: "Build decks from phrases you actually want to remember.",
      meta: `${savedDecks.length} active decks, ${reviewDecks.length} needing attention`,
      iconName: "scanText",
      href: appPath("sentenceMining"),
      buttonLabel: "Open Sentence Mining",
      buttonIcon: "scanText"
    }),
    actionCard({
      title: "Practice live",
      body: "Join voice/video rooms for real-time language practice.",
      meta: `${state.wallet?.balance || 0} coins available`,
      iconName: "video",
      href: appPath("voiceVideoRooms"),
      buttonLabel: "View Rooms",
      buttonIcon: "video"
    })
  ].join("");

  const communityItems = [
    listItem("Connect", `${followedLearners.length} followed, ${newLearners.length} new matches`, appPath("communityConnect"), "users"),
    listItem("Moments", `${recentMoments.length} recent posts from the community`, appPath("communityMoments"), "message"),
    listItem("My Moments", "Review what you have shared", appPath("profileMoments"), "user")
  ].join("");

  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span class="${ui.tagGold}">${escapeHtml(activeLanguageName)} workspace</span>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">Today on LinguaStories</h2>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-brand-graphite">Jump into the work that matters: reading, reviews, sentence mining, live practice, community, and lessons.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${appLink(appPath, "profileProfiles", "My Profiles", "user")}
            ${appLink(appPath, "profileSubscriptions", "Subscriptions", "wallet")}
          </div>
        </div>
      </section>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${metric("Reviews due", dueSentences.length || state.dashboard?.reviewsDue || 0, dueSentences.length ? "urgent" : "neutral")}
        ${metric("Unread stories", unlockedStories.length || state.dashboard?.storiesAvailable || 0)}
        ${metric("Active goals", activeGoals.length)}
        ${metric("Coin balance", state.wallet?.balance || 0, Number(state.wallet?.balance || 0) < 5 ? "urgent" : "good")}
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        ${primaryActions}
      </section>

      <section class="grid gap-4 md:grid-cols-2">
          <article class="${ui.card}">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-brand-ink">Learning Progress</h3>
                <p class="mt-1 ${ui.muted}">Current movement across stories, sentences, goals, and streaks.</p>
              </div>
              ${icon("trophy", "h-6 w-6 text-brand-redDark")}
            </div>
            <div class="mt-4 rounded-lg border border-brand-line/75 bg-white/55 px-4">
              ${progressLine("Sentences learned", progress.totalSentencesLearned || 0)}
              ${progressLine("Stories completed", progress.storiesCompleted || 0)}
              ${progressLine("Current streak", `${progress.currentStreak || 0} days`)}
            </div>
            <div class="mt-4">
              <div class="flex justify-between text-xs font-bold uppercase text-brand-graphite"><span>Goal completion</span><span>${goalProgress}%</span></div>
              <div class="mt-2">${progressBar(goalProgress)}</div>
            </div>
          </article>

          <article class="${ui.card}">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-brand-ink">Community</h3>
                <p class="mt-1 ${ui.muted}">Follow learners, read moments, and keep conversations moving.</p>
              </div>
              ${icon("users", "h-6 w-6 text-brand-redDark")}
            </div>
            <div class="mt-4 grid gap-2">${communityItems}</div>
          </article>
      </section>
    </div>
  `;
}
