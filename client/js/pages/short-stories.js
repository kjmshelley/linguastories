import { browseButton, escapeHtml, getReadingMinutes, groupItems, icon, pct, progressBar, ui } from "../ui.js";

function storyImage(story, className, placeholderClass = "") {
  if (story.imageUrl) {
    return `<img class="${className}" src="${escapeHtml(story.imageUrl)}" alt="${escapeHtml(story.title)}">`;
  }

  return `
    <div class="${placeholderClass || className} grid place-items-center bg-brand-snow">
      <div class="px-4 text-center">
        <span class="${ui.tagGold}">${escapeHtml(story.categoryName || story.topic)}</span>
        <p class="mt-3 text-lg font-bold leading-tight text-brand-ink">${escapeHtml(story.title)}</p>
      </div>
    </div>
  `;
}

function storyText(story) {
  return [story.title, story.translation, story.categoryName, story.topic, story.level, story.readingTime]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function highRewardCutoff(stories) {
  const rewards = [...new Set(stories.map((story) => Number(story.reward || 0)).filter((reward) => reward > 0))].sort((a, b) => b - a);
  return rewards[Math.min(1, rewards.length - 1)] || rewards[0] || 0;
}

function applyStoryFilters(stories, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const maxMinutes = Number(filters.maxMinutes || 0);
  const rewardCutoff = highRewardCutoff(stories);

  const filtered = stories.filter((story) => {
    const minutes = getReadingMinutes(story);
    if (query && !storyText(story).includes(query)) return false;
    if (filters.status === "completed" && !story.completed) return false;
    if (filters.status === "notCompleted" && story.completed) return false;
    if (filters.status === "unlocked" && !story.unlocked) return false;
    if (filters.status === "locked" && story.unlocked) return false;
    if (filters.status === "liked" && !story.liked) return false;
    if (filters.status === "favorite" && !story.favorite) return false;
    if (maxMinutes && minutes > maxMinutes) return false;
    if (filters.reward === "high" && Number(story.reward || 0) < rewardCutoff) return false;
    if (filters.engagement === "popular" && Number(story.likeCount || 0) <= 0) return false;
    if (filters.engagement === "saved" && Number(story.favoriteCount || 0) <= 0) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "reward") return Number(b.reward || 0) - Number(a.reward || 0) || a.title.localeCompare(b.title);
    if (filters.sort === "shortest") return getReadingMinutes(a) - getReadingMinutes(b) || a.title.localeCompare(b.title);
    if (filters.sort === "popular") return Number(b.likeCount || 0) - Number(a.likeCount || 0) || Number(b.favoriteCount || 0) - Number(a.favoriteCount || 0);
    if (filters.sort === "incomplete") return Number(a.completed) - Number(b.completed) || a.title.localeCompare(b.title);
    return Number(b.unlocked) - Number(a.unlocked) || Number(a.completed) - Number(b.completed) || a.title.localeCompare(b.title);
  });
}

function hasActiveFilters(filters = {}) {
  return Boolean(
    String(filters.query || "").trim() ||
      filters.status !== "all" ||
      filters.maxMinutes ||
      filters.reward !== "all" ||
      filters.engagement !== "all" ||
      filters.sort !== "recommended"
  );
}

function filterSelect({ label, key, value, options }) {
  return `
    <label class="grid gap-1.5 text-xs font-semibold uppercase text-brand-graphite">
      <span>${label}</span>
      <select class="h-11 rounded-lg border border-brand-line/90 bg-white/75 px-3 text-sm font-semibold normal-case text-brand-ink outline-none transition focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15" data-short-story-filter="${key}">
        ${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${value === optionValue ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    </label>
  `;
}

function filterToolbar({ filters, total, visible }) {
  const active = hasActiveFilters(filters);

  return `
    <section class="mb-5 rounded-lg border border-brand-line/80 bg-brand-panel p-4 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="grid gap-3">
        <label class="grid gap-1.5 text-xs font-semibold uppercase text-brand-graphite">
          <span>Search</span>
          <div class="flex h-11 items-center gap-2 rounded-lg border border-brand-line/90 bg-white/75 px-3 transition focus-within:border-brand-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-orange/15">
            ${icon("search", "h-4 w-4 text-brand-graphite")}
            <input class="min-h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold normal-case text-brand-ink outline-none placeholder:text-brand-muted" data-short-story-filter="query" value="${escapeHtml(filters.query || "")}" placeholder="Title, topic, level">
          </div>
        </label>
      </div>
      <div class="mt-4 border-t border-brand-line/70 pt-4">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
          ${filterSelect({
            label: "Progress",
            key: "status",
            value: filters.status || "all",
            options: [
              ["all", "All stories"],
              ["notCompleted", "Not completed"],
              ["completed", "Completed"],
              ["unlocked", "Unlocked"],
              ["locked", "Locked"],
              ["liked", "Liked by me"],
              ["favorite", "My favorites"]
            ]
          })}
          <label class="grid gap-1.5 text-xs font-semibold uppercase text-brand-graphite">
            <span>Length</span>
            <input class="h-11 rounded-lg border border-brand-line/90 bg-white/75 px-3 text-sm font-semibold normal-case text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15" data-short-story-filter="maxMinutes" value="${escapeHtml(filters.maxMinutes || "")}" inputmode="numeric" type="number" min="1" max="60" placeholder="Any">
          </label>
          ${filterSelect({
            label: "Coins",
            key: "reward",
            value: filters.reward || "all",
            options: [
              ["all", "Any reward"],
              ["high", "High reward"]
            ]
          })}
          ${filterSelect({
            label: "Signals",
            key: "engagement",
            value: filters.engagement || "all",
            options: [
              ["all", "Any signal"],
              ["popular", "Most liked"],
              ["saved", "Most saved"]
            ]
          })}
          ${filterSelect({
            label: "Sort",
            key: "sort",
            value: filters.sort || "recommended",
            options: [
              ["recommended", "Recommended"],
              ["reward", "Highest coins"],
              ["shortest", "Shortest first"],
              ["popular", "Most liked"],
              ["incomplete", "To finish"]
            ]
          })}
        </div>
        <div class="mt-4 flex justify-start md:justify-end">
          <button class="${active ? ui.secondary : `${ui.secondary} opacity-50`} h-11 whitespace-nowrap" data-action="resetShortStoryFilters" ${active ? "" : "disabled"}>${icon("trash", "h-4 w-4")}Reset</button>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-line/70 pt-3">
        <span class="text-sm font-semibold text-brand-charcoal">${visible} of ${total} stories</span>
        <div class="flex flex-wrap gap-2">
          ${active ? `<span class="${ui.tagRed}">Filtered</span>` : `<span class="${ui.tagGold}">Full catalog</span>`}
          <span class="${ui.tag}">Short reads</span>
        </div>
      </div>
    </section>
  `;
}

function shortStoryCatalog(state) {
  const currentLanguage = state.user.targetLanguage;
  const languageStories = state.stories.filter((story) => !story.targetLanguage || story.targetLanguage === currentLanguage);
  const shortStories = languageStories.filter((story) => getReadingMinutes(story) <= 6);
  return shortStories.length ? shortStories : languageStories;
}

function featuredStorySlide(story, currentIndex, total) {
  const locked = !story.unlocked;
  const action = locked ? browseButton(`Unlock ${story.cost}`, `unlockStory:${story.id}`) : browseButton(story.completed ? "Read Again" : "Read Story", `readStory:${story.id}`);

  return `
    <section class="relative overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.09)]">
      <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,250,244,.98)_0%,rgba(248,246,242,.94)_58%,rgba(224,114,88,.13)_100%)]"></div>
      <div class="relative grid min-h-[320px] gap-6 px-5 py-5 sm:min-h-[360px] sm:px-8 sm:py-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-12 lg:py-8 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div class="max-w-4xl self-center">
          <div class="${ui.row}">
            <span class="${ui.tagGold}">${escapeHtml(story.categoryName || story.topic)}</span>
            <span class="${ui.tag}">${escapeHtml(story.level)}</span>
            <span class="${locked ? ui.tag : ui.tagDark}">${locked ? "Locked" : story.completed ? "Completed" : "Unlocked"}</span>
            ${Number(story.likeCount || 0) ? `<span class="${ui.tag}">${Number(story.likeCount || 0)} likes</span>` : ""}
          </div>
          <h2 class="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">${escapeHtml(story.title)}</h2>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-brand-charcoal sm:text-base">${escapeHtml(story.translation)}</p>
          <div class="mt-5 flex flex-wrap gap-2">
            <span class="${ui.tagRed}">${escapeHtml(story.readingTime || `${getReadingMinutes(story)} min`)}</span>
            <span class="${ui.tagGold}">+${story.reward} coins</span>
          </div>
          <div class="mt-6 flex flex-wrap gap-2">${action}</div>
        </div>
        <div class="self-center overflow-hidden rounded-lg border border-white/70 bg-white/45 shadow-[0_18px_36px_rgba(29,41,63,.12)]">
          ${storyImage(story, "aspect-[4/3] w-full object-cover", "aspect-[4/3] w-full")}
        </div>
        <div class="absolute bottom-5 right-5 hidden rounded-lg border border-brand-line/70 bg-white/65 px-3 py-2 text-xs font-semibold text-brand-graphite backdrop-blur sm:block">
          ${currentIndex + 1} / ${total}
        </div>
      </div>
    </section>
  `;
}

function storyListCard(story) {
  const locked = !story.unlocked;
  const action = locked ? browseButton(`Unlock ${story.cost}`, `unlockStory:${story.id}`) : browseButton(story.completed ? "Read Again" : "Read Story", `readStory:${story.id}`);

  return `
    <section class="w-full overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.05)] transition hover:border-brand-orange/35 hover:shadow-[0_14px_28px_rgba(29,41,63,.08)]">
      <div class="relative">
        ${storyImage(story, "aspect-[4/3] w-full object-cover", "aspect-[4/3] w-full")}
        <div class="absolute left-3 top-3 flex flex-wrap gap-2">
          <span class="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-redDark shadow-sm">${escapeHtml(story.level)}</span>
          ${locked || story.completed ? `<span class="rounded-full ${locked ? "bg-white/90 text-brand-graphite" : "bg-brand-ink text-white"} px-2.5 py-1 text-xs font-semibold shadow-sm">${locked ? "Locked" : "Completed"}</span>` : ""}
        </div>
      </div>
      <div class="p-4">
        <h3 class="line-clamp-2 min-h-14 text-xl font-bold leading-tight text-brand-ink">${escapeHtml(story.title)}</h3>
        <p class="mt-3 line-clamp-3 min-h-16 text-sm leading-5 text-brand-graphite">${escapeHtml(story.translation)}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="${ui.tagRed}">${escapeHtml(story.readingTime || `${getReadingMinutes(story)} min`)}</span>
          <span class="${ui.tagGold}">+${story.reward} coins</span>
          ${Number(story.likeCount || 0) ? `<span class="${ui.tag}">${Number(story.likeCount || 0)} likes</span>` : ""}
        </div>
        <div class="mt-4">${action}</div>
      </div>
    </section>
  `;
}

function categoryRail(category, stories) {
  if (!stories.length) return "";

  return `
    <section>
      <div class="mb-3 flex items-end justify-between gap-3">
        <h3 class="text-xl font-bold tracking-tight text-brand-ink">${escapeHtml(category.name)}</h3>
        <span class="text-xs font-semibold uppercase text-brand-graphite">${stories.length} stories</span>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        ${stories.map(storyListCard).join("")}
      </div>
    </section>
  `;
}

export function shortStoriesView({ state, selectedFeaturedStoryIndex = 0 }) {
  const catalog = shortStoryCatalog(state);
  const featured = catalog.slice(0, 5);
  const activeIndex = featured.length ? Math.min(selectedFeaturedStoryIndex, featured.length - 1) : 0;
  const activeStory = featured[activeIndex];
  const categories = state.storyCategories?.length
    ? state.storyCategories
    : Object.keys(groupItems(catalog, (story) => story.categoryName || story.topic)).map((name) => ({ name, slug: name.toLowerCase() }));
  const rails = categories
    .map((category) => categoryRail(category, catalog.filter((story) => story.categorySlug === category.slug || story.categoryName === category.name || story.topic === category.name)))
    .join("");

  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-brand-cream px-4 py-5 text-brand-ink sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <section>
        <div class="mb-4 flex flex-wrap justify-end gap-3">
          <span class="hidden" data-featured-story-count="${featured.length}"></span>
          <span class="text-xs font-semibold uppercase text-brand-graphite">${featured.length} featured</span>
        </div>
        <div class="relative">
          ${activeStory ? featuredStorySlide(activeStory, activeIndex, featured.length) : `<section class="rounded-lg border border-brand-line/80 bg-brand-panel p-6 shadow-[0_18px_42px_rgba(29,41,63,.09)]"><p class="${ui.muted}">No short stories available yet.</p></section>`}
          ${
            featured.length > 1
              ? `
                <button class="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg border border-brand-line/80 bg-white/80 text-brand-ink shadow-lg backdrop-blur transition hover:-translate-x-0.5 hover:border-brand-orange/50 hover:bg-white sm:left-3 sm:h-11 sm:w-11" data-action="featuredStory:prev" aria-label="Previous featured story">${icon("chevronLeft", "h-5 w-5")}</button>
                <button class="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg bg-brand-ink text-white shadow-lg transition hover:translate-x-0.5 hover:bg-brand-redDark sm:right-3 sm:h-11 sm:w-11" data-action="featuredStory:next" aria-label="Next featured story">${icon("chevronRight", "h-5 w-5")}</button>
              `
              : ""
          }
          ${
            featured.length > 1
              ? `<div class="mt-4 flex flex-wrap justify-center gap-2">
                  ${featured
                    .map(
                      (story, index) => `
                        <button class="h-2.5 rounded-full transition ${index === activeIndex ? "w-8 bg-brand-red" : "w-2.5 bg-brand-line hover:bg-brand-orange/60"}" data-action="featuredStory:${index}" aria-label="Show ${escapeHtml(story.title)}"></button>
                      `
                    )
                    .join("")}
                </div>`
              : ""
          }
        </div>
      </section>

      <section class="mt-7 grid gap-8">
        ${
          rails ||
          `<section class="${ui.card}">
            <h3 class="text-xl font-bold text-brand-ink">No matching stories</h3>
            <p class="mt-2 ${ui.muted}">Try a broader search, remove the time limit, or reset the filters.</p>
            <div class="mt-4"><button class="${ui.secondary}" data-action="resetShortStoryFilters">${icon("trash", "h-4 w-4")}Reset Filters</button></div>
          </section>`
        }
      </section>
    </div>
  `;
}

export function shortStorySearchView({ state, shortStoryFilters = {} }) {
  const filters = shortStoryFilters || {};
  const baseCatalog = shortStoryCatalog(state);
  const catalog = applyStoryFilters(baseCatalog, filters);
  const categories = state.storyCategories?.length
    ? state.storyCategories
    : Object.keys(groupItems(catalog, (story) => story.categoryName || story.topic)).map((name) => ({ name, slug: name.toLowerCase() }));
  const rails = categories
    .map((category) => categoryRail(category, catalog.filter((story) => story.categorySlug === category.slug || story.categoryName === category.name || story.topic === category.name)))
    .join("");

  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-brand-cream px-4 py-5 text-brand-ink sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <a class="${ui.secondary}" href="/app/short-stories" data-app-link>${icon("chevronLeft", "h-4 w-4")}<span>Back to Short Stories</span></a>
        <span class="${ui.tagGold}">Search Short Stories</span>
      </div>
      ${filterToolbar({ filters, total: baseCatalog.length, visible: catalog.length })}
      <section class="mt-7 grid gap-8">
        ${
          rails ||
          `<section class="${ui.card}">
            <h3 class="text-xl font-bold text-brand-ink">No matching stories</h3>
            <p class="mt-2 ${ui.muted}">Try a broader search, remove the time limit, or reset the filters.</p>
            <div class="mt-4"><button class="${ui.secondary}" data-action="resetShortStoryFilters">${icon("trash", "h-4 w-4")}Reset Filters</button></div>
          </section>`
        }
      </section>
    </div>
  `;
}
