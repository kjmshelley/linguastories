import { button, escapeHtml, ui } from "../ui.js";
import { languageName } from "../languages.js";

const LEVELS = [
  ["A1", "Short, direct sentences with very common words."],
  ["A2", "Simple narration with familiar grammar and light detail."],
  ["B1", "Clear story flow with richer everyday vocabulary."],
  ["B2", "More natural phrasing, longer sentences, and nuance."],
  ["C1", "Advanced style with flexible grammar and subtle meaning."],
  ["C2", "Literary, idiomatic, and close to native-level narration."]
];

function userProfileLanguages(state) {
  const languages = (state.learningLanguages || []).filter((item) => item.active !== false).map((item) => item.language);
  if (state.user.targetLanguage && !languages.includes(state.user.targetLanguage)) languages.unshift(state.user.targetLanguage);
  return languages;
}

function availableStoryLanguages(story, state) {
  const profileLanguages = userProfileLanguages(state);
  const translationLanguages = [...new Set((story.translations || []).map((translation) => translation.targetLanguage))];
  const languages = profileLanguages.filter((language) => translationLanguages.includes(language));
  if (!languages.length && story.targetLanguage) languages.push(story.targetLanguage);
  return languages;
}

function selectedStoryLanguage(story, state, selectedStoryLanguages) {
  const languages = availableStoryLanguages(story, state);
  if (selectedStoryLanguages?.[story.id] && languages.includes(selectedStoryLanguages[story.id])) return selectedStoryLanguages[story.id];
  if (languages.includes(state.user.targetLanguage)) return state.user.targetLanguage;
  return languages[0] || story.targetLanguage;
}

function availableStoryLevels(story, language) {
  const levels = [...new Set((story.translations || []).filter((translation) => translation.targetLanguage === language).map((translation) => translation.level))];
  return LEVELS.map(([level]) => level).filter((level) => levels.includes(level));
}

function selectedLevel(story, selectedStoryLevels, language) {
  const levels = availableStoryLevels(story, language);
  if (selectedStoryLevels?.[story.id] && levels.includes(selectedStoryLevels[story.id])) return selectedStoryLevels[story.id];
  if (story.level && levels.includes(story.level)) return story.level;
  return levels[0] || story.level || "A1";
}

function storyLevelContent(story, language, level) {
  const translation = (story.translations || []).find((item) => item.targetLanguage === language && item.level === level);
  const version = translation || {};
  return {
    ...story,
    ...version,
    targetLanguage: translation?.targetLanguage || language || story.targetLanguage,
    title: version.title || story.title,
    text: version.text || "",
    translation: version.translation || "",
    romanization: version.romanization || story.romanization || "",
    readingTime: version.readingTime || "",
    keySentences: version.keySentences || [],
    highlights: version.highlights || [],
    keyWords: version.keyWords || version.highlights || [],
    grammarPoints: version.grammarPoints || []
  };
}

function storyDetailImage(story, title, className = "aspect-[4/3] w-full object-cover") {
  if (story.imageUrl) {
    return `<img class="${className}" src="${escapeHtml(story.imageUrl)}" alt="${escapeHtml(title)}">`;
  }

  return `
    <div class="${className} grid place-items-center bg-brand-snow">
      <div class="px-5 text-center">
        <span class="${ui.tagGold}">${escapeHtml(story.categoryName || story.topic)}</span>
        <p class="mt-3 text-2xl font-bold leading-tight text-brand-ink">${escapeHtml(title)}</p>
      </div>
    </div>
  `;
}

function storyDetailVideo(story) {
  if (!story.videoUrl) return "";
  return `<video class="mt-4 max-h-96 w-full rounded-lg bg-black object-contain" controls src="${escapeHtml(story.videoUrl)}"></video>`;
}

function keySentenceCard(sentence, fallbackText, savedSentences) {
  const saved = sentence && savedSentences.includes(sentence.id);

  return `
    <article class="rounded-lg border border-brand-line/80 bg-brand-panel p-4 shadow-[0_1px_2px_rgba(29,41,63,.05)] transition hover:border-brand-orange/40">
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
        <div class="min-w-0">
          <span class="block text-[11px] font-semibold uppercase tracking-wide text-brand-graphite">Target</span>
          <p class="mt-1 text-lg font-bold leading-7 text-brand-ink">${escapeHtml(sentence?.target || fallbackText)}</p>
        </div>
        <div class="min-w-0 border-t border-brand-line pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <span class="block text-[11px] font-semibold uppercase tracking-wide text-brand-graphite">Source</span>
          <p class="mt-1 text-sm font-semibold leading-6 text-brand-charcoal">${escapeHtml(sentence?.translation || "Translation unavailable.")}</p>
        </div>
        <div class="md:justify-self-end">
          ${
            sentence
              ? `<button class="${saved ? `${ui.secondary} opacity-70` : ui.secondary} whitespace-nowrap" data-action="saveSentence:${sentence.id}">${saved ? "Saved" : "Save Sentence"}</button>`
              : `<span class="${ui.tag}">No saved sentence record</span>`
          }
        </div>
      </div>
    </article>
  `;
}

function readerIcon(name) {
  const paths = {
    audio: `<path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18 6a8 8 0 0 1 0 12"></path>`,
    source: `<path d="M4 5h7"></path><path d="M9 3v2c0 4-2 7-5 9"></path><path d="M5 9c1 2 3 4 6 5"></path><path d="M13 19l4-10 4 10"></path><path d="M14.5 15h5"></path>`,
    target: `<path d="M4 6h16"></path><path d="M4 12h10"></path><path d="M4 18h16"></path>`,
    romanization: `<path d="M5 19V5h5a4 4 0 0 1 0 8H5"></path><path d="M12 13l5 6"></path>`,
    send: `<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>`
  };
  return `<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function storyActionIcon(name) {
  const paths = {
    like: `<path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10l5-8a3 3 0 0 1 3 3v4h4.2a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 17.8 21H7Z"></path>`,
    favorite: `<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"></path>`
  };
  return `<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="${name === "favorite" ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function storyStateButton({ active, action, label, iconName }) {
  return `
    <button class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
      active ? "border-brand-red/30 bg-brand-red/10 text-brand-redDark" : "border-brand-line/90 bg-white/60 text-brand-charcoal hover:border-brand-orange/50 hover:bg-white"
    }" data-action="${action}" aria-pressed="${active ? "true" : "false"}">
      ${storyActionIcon(iconName)}
      <span>${label}</span>
    </button>
  `;
}

function readerControlButton({ story, key, label, iconName, enabled }) {
  return `
    <button class="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
      enabled ? "border-brand-sidebar bg-brand-sidebar text-white" : "border-brand-line/80 bg-white/60 text-brand-charcoal hover:border-brand-orange/45 hover:bg-white"
    }" data-action="toggleStoryReader:${story.id}:${key}">
      <span class="flex min-w-0 items-center gap-2">${readerIcon(iconName)}<span>${label}</span></span>
      <span class="${enabled ? "bg-white/15 text-white" : "bg-brand-mist text-brand-graphite"} rounded-full px-2 py-0.5 text-[11px]">${enabled ? "On" : "Off"}</span>
    </button>
  `;
}

function readerLanguageSelector({ appConfig, story, languages, selectedLanguage }) {
  if (!languages.length) return "";
  return `
    <div class="rounded-lg bg-brand-mist/55 p-2">
      <span class="block px-1 text-[11px] font-semibold uppercase tracking-wide text-brand-graphite">Story Language</span>
      <div class="mt-2 grid gap-1">
        ${languages
          .map(
            (language) => `
              <button class="min-h-11 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                language === selectedLanguage ? "bg-white text-brand-ink ring-1 ring-brand-orange/45" : "text-brand-charcoal hover:bg-white/80"
              }" data-action="setStoryLanguage:${story.id}:${language}">
                ${escapeHtml(languageName(appConfig, language))}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function readerTools({ appConfig, story, options, languages, selectedLanguage }) {
  return `
    <aside class="self-start rounded-lg border border-brand-line/80 bg-brand-panel p-4 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <h3 class="text-base font-bold text-brand-ink">Reader tools</h3>
      <div class="mt-4 grid gap-2">
        ${readerLanguageSelector({ appConfig, story, languages, selectedLanguage })}
        <button class="flex min-h-11 w-full items-center gap-2 rounded-lg border border-brand-line/80 bg-white/60 px-3 py-2 text-left text-sm font-semibold text-brand-charcoal transition hover:border-brand-orange/45 hover:bg-white" data-action="playStoryAudio:${story.id}">
          ${readerIcon("audio")}
          <span>Play Audio</span>
        </button>
        <button class="flex min-h-11 w-full items-center gap-2 rounded-lg border border-brand-line/80 bg-white/60 px-3 py-2 text-left text-sm font-semibold text-brand-charcoal transition hover:border-brand-orange/45 hover:bg-white" data-action="openStoryLevelModal:${story.id}">
          ${readerIcon("target")}
          <span>Change Reading Level</span>
        </button>
        ${readerControlButton({ story, key: "source", label: "Show Source Language", iconName: "source", enabled: options.source })}
        ${readerControlButton({ story, key: "target", label: "Show Target Language", iconName: "target", enabled: options.target })}
        ${readerControlButton({ story, key: "romanization", label: "Show Romanization", iconName: "romanization", enabled: options.romanization })}
        <button class="flex min-h-11 w-full items-center gap-2 rounded-lg border border-brand-line/80 bg-white/60 px-3 py-2 text-left text-sm font-semibold text-brand-charcoal transition hover:border-brand-orange/45 hover:bg-white" data-action="shareStory:${story.id}">
          ${readerIcon("send")}
          <span>Share Story</span>
        </button>
      </div>
    </aside>
  `;
}

function storyCommunity(story, comments) {
  const parents = comments.filter((comment) => !comment.parentCommentId);
  const repliesByParent = comments
    .filter((comment) => comment.parentCommentId)
    .reduce((groups, comment) => {
      groups[comment.parentCommentId] = groups[comment.parentCommentId] || [];
      groups[comment.parentCommentId].push(comment);
      return groups;
    }, {});

  return `
    <div class="grid gap-4">
      <form class="grid gap-3 rounded-lg bg-brand-mist/55 p-4" data-form="storyComment">
        <input type="hidden" name="storyId" value="${escapeHtml(story.id)}">
        <label class="${ui.label}">Add to this story discussion<textarea class="${ui.input} min-h-24" name="body" required placeholder="Ask a question, share what confused you, or encourage another reader."></textarea></label>
        <div class="flex justify-end"><button class="${ui.primary}">Post Comment</button></div>
      </form>
      <div class="grid gap-3">
        ${
          parents.length
            ? parents
                .map(
                  (comment) => `
                    <article class="rounded-lg border border-brand-line/80 bg-white/55 p-4">
                      <div class="flex items-center gap-2">
                        <div class="grid h-8 w-8 place-items-center rounded-full bg-brand-sidebar text-xs font-bold text-white">${escapeHtml(comment.avatar)}</div>
                        <strong class="text-sm text-brand-ink">${escapeHtml(comment.author)}</strong>
                      </div>
                      <p class="mt-3 text-sm leading-6 text-brand-charcoal">${escapeHtml(comment.body)}</p>
                      <div class="mt-3 grid gap-2 border-l border-brand-line pl-3">
                        ${(repliesByParent[comment.id] || [])
                          .map((reply) => `<div class="rounded-lg bg-brand-mist/60 px-3 py-2 text-sm leading-6"><strong>${escapeHtml(reply.author)}</strong> ${escapeHtml(reply.body)}</div>`)
                          .join("")}
                      </div>
                      <form class="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" data-form="storyComment">
                        <input type="hidden" name="storyId" value="${escapeHtml(story.id)}">
                        <input type="hidden" name="parentCommentId" value="${escapeHtml(comment.id)}">
                        <input class="${ui.input}" name="body" required placeholder="Reply once">
                        <button class="${ui.secondary}">Reply</button>
                      </form>
                    </article>
                  `
                )
                .join("")
            : `<p class="${ui.muted}">No comments yet. Start the story discussion.</p>`
        }
      </div>
    </div>
  `;
}

function storyTabs({ story, activeTab, keySentences, keyWords, grammarPoints, savedSentences, comments }) {
  const tabs = [
    ["sentences", "Key Sentences", keySentences.length],
    ["words", "Key Words", keyWords.length],
    ["grammar", "Key Grammar Points", grammarPoints.length],
    ["community", "Community", comments.length]
  ];
  const tabButton = ([id, label, count]) => `
    <button class="flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      activeTab === id ? "bg-brand-sidebar text-white shadow-[0_8px_16px_rgba(29,41,63,.12)]" : "text-brand-graphite hover:bg-white hover:text-brand-ink"
    }" data-action="setStoryTab:${story.id}:${id}">
      <span>${label}</span>
      <span class="${activeTab === id ? "bg-white/15 text-white" : "bg-brand-mist text-brand-graphite"} rounded-full px-2 py-0.5 text-[11px]">${count}</span>
    </button>
  `;

  const body =
    activeTab === "words"
      ? `<div class="flex flex-wrap gap-2">${keyWords.map((word) => `<span class="${ui.tagRed}">${escapeHtml(word)}</span>`).join("") || `<p class="${ui.muted}">No key words yet.</p>`}</div>`
      : activeTab === "grammar"
        ? `<div class="grid gap-3">${
            grammarPoints.length
              ? grammarPoints.map((point) => `<article class="rounded-lg bg-white/55 p-4 text-sm font-semibold leading-6 text-brand-charcoal">${escapeHtml(point)}</article>`).join("")
              : `<p class="${ui.muted}">No key grammar points yet.</p>`
          }</div>`
        : activeTab === "community"
          ? storyCommunity(story, comments)
        : `<div class="grid gap-3">${
            keySentences.length
              ? keySentences.map((item) => keySentenceCard(item.sentence, item.target, savedSentences)).join("")
              : `<p class="${ui.muted}">No key sentences yet.</p>`
          }</div>`;

  return `
    <section class="rounded-lg border border-brand-line/80 bg-brand-panel p-4 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="grid gap-2 rounded-lg bg-brand-mist/55 p-1 sm:grid-cols-4">
        ${tabs.map(tabButton).join("")}
      </div>
      <div class="mt-5">${body}</div>
    </section>
  `;
}

export function storyLevelModal({ state, selectedStoryLanguages, selectedStoryLevels }, story) {
  const currentLanguage = selectedStoryLanguage(story, state, selectedStoryLanguages);
  const availableLevels = availableStoryLevels(story, currentLanguage);
  const currentLevel = selectedLevel(story, selectedStoryLevels, currentLanguage);

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">${escapeHtml(currentLanguage)}</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Choose Reading Level</h2>
      <p class="mt-2 ${ui.muted}">Pick the level you want to read this story in.</p>
    </div>
    <div class="mt-6 grid gap-3">
      ${LEVELS.filter(([level]) => availableLevels.includes(level)).map(
        ([level, description]) => `
          <button class="rounded-lg border p-4 text-left transition ${
            level === currentLevel ? "border-brand-red/35 bg-brand-mist shadow-sm" : "border-brand-line/80 bg-white/55 hover:border-brand-orange/45 hover:bg-white"
          }" data-action="setStoryLevel:${story.id}:${level}">
            <span class="text-base font-bold text-brand-ink">${level}</span>
            <span class="mt-1 block text-sm leading-6 text-brand-graphite">${escapeHtml(description)}</span>
          </button>
        `
      ).join("")}
    </div>
  `;
}

export function storyDetailView({ appConfig, state, activeStoryId, appPath, selectedStoryLanguages, selectedStoryLevels, selectedStoryTabs, selectedStoryReaderOptions }) {
  const storiesPath = appPath("shortStories");
  const story = state.stories.find((item) => item.id === activeStoryId());
  if (!story) {
    return `
      <section class="${ui.card}">
        <a class="inline-flex items-center gap-2 text-sm font-semibold text-brand-red no-underline hover:text-brand-redDark" href="${storiesPath}" data-app-link><span aria-hidden="true">&larr;</span> Back to Stories</a>
        <h2 class="mt-4 text-3xl font-bold text-brand-ink">Story not found</h2>
        <p class="mt-2 ${ui.muted}">This story may have been removed or the link may be outdated.</p>
      </section>
    `;
  }

  const languageOptions = availableStoryLanguages(story, state);
  const currentLanguage = selectedStoryLanguage(story, state, selectedStoryLanguages);
  const currentLevel = selectedLevel(story, selectedStoryLevels, currentLanguage);
  const content = storyLevelContent(story, currentLanguage, currentLevel);
  const activeTab = selectedStoryTabs?.[story.id] || "sentences";
  const readerOptions = selectedStoryReaderOptions?.[story.id] || { target: true, source: false, romanization: false };
  const sentenceMap = new Map(state.sentences.map((sentence) => [sentence.target, sentence]));
  const keySentences = content.keySentences.map((target) => ({ target, sentence: sentenceMap.get(target) }));
  const keyWords = content.keyWords || [];
  const grammarPoints = content.grammarPoints || [];
  const comments = state.storyComments?.[story.id] || [];
  const highlightedText = content.highlights.reduce(
    (body, word) => body.replaceAll(word, `<span class="rounded bg-brand-mist px-1 font-bold text-brand-ink">${escapeHtml(word)}</span>`),
    escapeHtml(content.text)
  );

  if (!story.unlocked) {
    return `
      <div class="grid gap-4">
        <a class="inline-flex items-center gap-2 text-sm font-semibold text-brand-red no-underline hover:text-brand-redDark" href="${storiesPath}" data-app-link><span aria-hidden="true">&larr;</span> Back to Stories</a>
        <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.09)]">
          <div class="grid lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_460px]">
            <div class="p-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="${ui.row}">
                  <span class="${ui.tagDark}">Target: ${escapeHtml(currentLanguage)}</span>
                  <span class="${ui.tag}">Source: ${escapeHtml(languageName(appConfig, story.sourceLanguage) || "Source")}</span>
                  <span class="${ui.tagGold}">${escapeHtml(currentLevel)}</span>
                  <span class="${ui.tag}">${escapeHtml(content.readingTime)}</span>
                  <span class="${ui.tag}">${escapeHtml(story.topic)}</span>
                </div>
                ${button(`Unlock ${story.cost}`, `unlockStory:${story.id}`)}
              </div>
              <h2 class="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl">${escapeHtml(content.title)}</h2>
              <p class="mt-4 max-w-2xl leading-7 text-brand-charcoal">${escapeHtml(content.translation)}</p>
              <div class="mt-6">${button("Change Reading Level", `openStoryLevelModal:${story.id}`, ui.secondary)}</div>
              ${storyDetailVideo(story)}
            </div>
            <div class="border-t border-brand-line/70 bg-white/45 lg:border-l lg:border-t-0">
              ${storyDetailImage(story, content.title, "aspect-[4/3] h-full min-h-72 w-full object-cover")}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  return `
    <article class="grid gap-5">
      <a class="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-red no-underline hover:text-brand-redDark" href="${storiesPath}" data-app-link><span aria-hidden="true">&larr;</span> Back to Stories</a>

      <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_14px_34px_rgba(29,41,63,.07)]">
        <div class="grid lg:grid-cols-[340px_minmax(0,1fr)]">
          <div class="border-b border-brand-line/70 bg-white/45 lg:border-b-0 lg:border-r">
              ${storyDetailImage(story, content.title, "aspect-[4/3] h-full min-h-64 w-full object-cover")}
              ${storyDetailVideo(story)}
            </div>
          <div class="flex flex-wrap items-start justify-between gap-4 p-5">
            <div class="min-w-0">
              <div class="${ui.row}">
                <span class="${ui.tagDark}">Target: ${escapeHtml(currentLanguage)}</span>
                <span class="${ui.tag}">Source: ${escapeHtml(languageName(appConfig, story.sourceLanguage) || "Source")}</span>
                <span class="${ui.tagGold}">${escapeHtml(currentLevel)}</span>
                <span class="${ui.tag}">${escapeHtml(content.readingTime)}</span>
                <span class="${ui.tag}">${escapeHtml(story.topic)}</span>
              </div>
              <h2 class="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-brand-ink lg:text-4xl">${escapeHtml(content.title)}</h2>
              <p class="mt-2 max-w-3xl leading-7 text-brand-graphite">${escapeHtml(content.translation)}</p>
            </div>
            <div>
              ${!story.completed ? `<p class="mb-2 text-xs font-semibold text-brand-graphite">Completing this story gives ${story.reward} coins.</p>` : ""}
              <div class="flex flex-wrap gap-2">
              ${button(story.completed ? "Completed" : "Complete", `completeStory:${story.id}`)}
              ${storyStateButton({ active: story.liked, action: `toggleStoryLike:${story.id}`, label: story.liked ? "Liked" : "Like", iconName: "like" })}
              ${storyStateButton({ active: story.favorite, action: `toggleStoryFavorite:${story.id}`, label: story.favorite ? "Favorited" : "Favorite", iconName: "favorite" })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid items-start gap-4 xl:grid-cols-[270px_minmax(0,1fr)]">
        ${readerTools({ appConfig, story, options: readerOptions, languages: languageOptions, selectedLanguage: currentLanguage })}
        <div class="w-full rounded-lg border border-brand-line/80 bg-brand-panel px-5 py-8 shadow-[0_22px_50px_rgba(29,41,63,.1)] sm:px-8 lg:px-10 lg:py-10">
          <span class="hidden" data-reading-text>${escapeHtml(content.text)}</span>
          <div class="mb-6 flex items-center justify-between gap-3 border-b border-brand-line pb-4">
            <span class="text-xs font-semibold uppercase tracking-wide text-brand-graphite">Reading Text</span>
            <span class="${ui.tag}">${escapeHtml(currentLanguage)} · ${escapeHtml(currentLevel)}</span>
          </div>
          <div class="grid gap-5">
            ${
              readerOptions.target
                ? `<p class="text-[1.0625rem] font-medium leading-9 text-brand-charcoal sm:text-lg sm:leading-10">${highlightedText}</p>`
                : ""
            }
            ${
              readerOptions.source
                ? `<div class="rounded-lg bg-brand-mist/60 p-4"><span class="block text-xs font-semibold uppercase text-brand-graphite">${escapeHtml(languageName(appConfig, story.sourceLanguage) || "Source Language")}</span><p class="mt-2 text-sm leading-6 text-brand-charcoal">${escapeHtml(content.translation)}</p></div>`
                : ""
            }
            ${
              readerOptions.romanization
                ? `<div class="rounded-lg bg-white/55 p-4"><span class="block text-xs font-semibold uppercase text-brand-graphite">Romanization</span><p class="mt-2 text-sm leading-6 text-brand-charcoal">${escapeHtml(content.romanization || "Romanization is not available for this story yet.")}</p></div>`
                : ""
            }
            ${!readerOptions.target && !readerOptions.source && !readerOptions.romanization ? `<p class="${ui.muted}">Choose a reader tool to show story content.</p>` : ""}
          </div>
        </div>
      </section>

      ${storyTabs({ story, activeTab, keySentences, keyWords, grammarPoints, savedSentences: state.savedSentences, comments })}
    </article>
  `;
}
