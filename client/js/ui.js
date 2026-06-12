export const ui = {
  page: "min-h-screen bg-brand-cream",
  appView: "p-4 sm:p-6 lg:p-7",
  card: "rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)]",
  cardHover: "rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)] transition hover:border-brand-orange/40 hover:shadow-[0_14px_28px_rgba(29,41,63,.08)]",
  stat: "rounded-lg border border-brand-line/70 bg-brand-panel/85 p-5 shadow-[0_1px_2px_rgba(29,41,63,.04)] transition hover:border-brand-orange/35",
  primary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-ink px-4 py-2 text-sm font-semibold text-white no-underline shadow-[0_8px_18px_rgba(29,41,63,.16)] transition hover:bg-brand-redDark",
  secondary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-line/90 bg-white/55 px-4 py-2 text-sm font-semibold text-brand-charcoal no-underline transition hover:border-brand-orange/50 hover:bg-white",
  danger: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-red/20 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-brand-redDark transition hover:border-brand-red/35 hover:bg-brand-red/15",
  row: "flex flex-wrap items-center gap-2",
  muted: "text-sm leading-6 text-brand-graphite",
  tag: "inline-flex min-h-6 items-center gap-1.5 rounded-full bg-white/65 px-2.5 py-1 text-xs font-semibold text-brand-graphite ring-1 ring-brand-line/70",
  tagGold: "inline-flex min-h-6 items-center gap-1.5 rounded-full bg-brand-mist px-2.5 py-1 text-xs font-semibold text-brand-brown ring-1 ring-brand-line/60",
  tagRed: "inline-flex min-h-6 items-center gap-1.5 rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-semibold text-brand-redDark ring-1 ring-brand-red/15",
  tagDark: "inline-flex min-h-6 items-center gap-1.5 rounded-full bg-brand-sidebar px-2.5 py-1 text-xs font-semibold text-white",
  input: "min-h-11 w-full rounded-lg border border-brand-line/90 bg-white/75 px-3 py-2 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15",
  label: "grid gap-1.5 text-sm font-semibold text-brand-graphite",
  grid2: "grid gap-4 lg:grid-cols-2",
  grid3: "grid gap-4 lg:grid-cols-3",
  grid4: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
};

export const posterPalettes = [
  "from-brand-red via-brand-amber to-brand-panel",
  "from-brand-sidebar via-brand-slate to-brand-red",
  "from-brand-blue via-brand-teal to-brand-panel",
  "from-brand-charcoal via-brand-graphite to-brand-mist"
];

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function pct(progress, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((progress / target) * 100));
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

const iconPaths = {
  add: `<path d="M12 5v14"></path><path d="M5 12h14"></path>`,
  alert: `<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>`,
  arrowLeft: `<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>`,
  arrowRight: `<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`,
  bell: `<path d="M10 21h4"></path><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>`,
  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4v15.5"></path><path d="M20 22V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5"></path>`,
  bookmark: `<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"></path>`,
  check: `<path d="m20 6-11 11-5-5"></path>`,
  chevronLeft: `<path d="m15 18-6-6 6-6"></path>`,
  chevronRight: `<path d="m9 18 6-6-6-6"></path>`,
  coins: `<circle cx="8" cy="8" r="5"></circle><path d="M13 8c3.3.2 6 2.1 6 4.5 0 2.5-3.1 4.5-7 4.5-2.1 0-4-.6-5.3-1.6"></path><path d="M13 12.5V17"></path>`,
  dashboard: `<rect x="3" y="3" width="7" height="8" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="15" width="7" height="6" rx="1"></rect>`,
  edit: `<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>`,
  eye: `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>`,
  filter: `<path d="M3 5h18"></path><path d="M6 12h12"></path><path d="M10 19h4"></path>`,
  flag: `<path d="M5 22V4"></path><path d="M5 4h12l-1 5 1 5H5"></path>`,
  globe: `<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 0 20"></path><path d="M12 2a15.3 15.3 0 0 0 0 20"></path>`,
  goal: `<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>`,
  login: `<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><path d="m10 17 5-5-5-5"></path><path d="M15 12H3"></path>`,
  logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path>`,
  menu: `<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>`,
  message: `<path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>`,
  mic: `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v3"></path>`,
  play: `<path d="m8 5 11 7-11 7Z"></path>`,
  reading: `<path d="M12 6.5A6 6 0 0 0 6 4H3v15h3a6 6 0 0 1 6 2Z"></path><path d="M12 6.5A6 6 0 0 1 18 4h3v15h-3a6 6 0 0 0-6 2Z"></path><path d="M12 6.5V21"></path>`,
  save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8"></path><path d="M7 3v5h8"></path>`,
  scanText: `<path d="M7 3H5a2 2 0 0 0-2 2v2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 8h10"></path><path d="M7 12h8"></path><path d="M7 16h6"></path>`,
  search: `<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`,
  shadowing: `<path d="M12 2v20"></path><path d="M8 6a4 4 0 0 1 8 0c0 5-8 5-8 10a4 4 0 0 0 8 0"></path>`,
  star: `<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"></path>`,
  target: `<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>`,
  trash: `<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path>`,
  trophy: `<path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v5a5 5 0 0 1-10 0Z"></path><path d="M17 6h3a3 3 0 0 1-3 3"></path><path d="M7 6H4a3 3 0 0 0 3 3"></path>`,
  upload: `<path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M5 21h14"></path>`,
  user: `<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>`,
  users: `<path d="M16 21a6 6 0 0 0-12 0"></path><circle cx="10" cy="8" r="4"></circle><path d="M22 21a5 5 0 0 0-5-5"></path><path d="M17 4a4 4 0 0 1 0 8"></path>`,
  video: `<path d="M15 10.5 21 7v10l-6-3.5"></path><rect x="3" y="6" width="12" height="12" rx="2"></rect>`,
  wallet: `<path d="M3 7a2 2 0 0 1 2-2h14v14H5a2 2 0 0 1-2-2Z"></path><path d="M16 12h.01"></path><path d="M19 9h-5a3 3 0 0 0 0 6h5"></path>`
};

export function icon(name, className = "h-4 w-4") {
  const path = iconPaths[name];
  if (!path) return "";
  return `<svg class="${className} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function iconForLabel(label = "") {
  const text = String(label).toLowerCase();
  if (text.includes("add")) return "add";
  if (text.includes("back")) return "arrowLeft";
  if (text.includes("change") || text.includes("language")) return "globe";
  if (text.includes("complete")) return "check";
  if (text.includes("create")) return "add";
  if (text.includes("detail") || text.includes("open")) return "search";
  if (text.includes("edit") || text.includes("save goal") || text.includes("save profile") || text.includes("save info")) return "edit";
  if (text.includes("encourage")) return "message";
  if (text.includes("follow")) return "users";
  if (text.includes("give") || text.includes("coin")) return "coins";
  if (text.includes("learn") || text.includes("review")) return "book";
  if (text.includes("log in")) return "login";
  if (text.includes("log out")) return "logout";
  if (text.includes("practice") || text.includes("shadowing")) return "shadowing";
  if (text.includes("read")) return "play";
  if (text.includes("remove")) return "trash";
  if (text.includes("share")) return "message";
  if (text.includes("sentence") || text.includes("story")) return "book";
  if (text.includes("support")) return "trophy";
  if (text.includes("unlock")) return "target";
  if (text.includes("upload")) return "upload";
  if (text.includes("save")) return "save";
  return "";
}

export function button(label, action, className = ui.primary, iconName = iconForLabel(label)) {
  return `<button class="${className}" data-action="${action}">${icon(iconName)}<span>${label}</span></button>`;
}

export function progressBar(value) {
  return `<div class="h-2 overflow-hidden rounded-full bg-brand-mist"><span class="block h-full rounded-full bg-gradient-to-r from-brand-red to-brand-teal" style="width:${value}%"></span></div>`;
}

export function stat(label, value) {
  return `
    <div class="${ui.stat}">
      <div class="flex items-center justify-between gap-3">
        <span class="block text-sm font-semibold text-brand-graphite">${label}</span>
        <span class="grid h-9 w-9 place-items-center rounded-lg bg-white/70 text-brand-redDark ring-1 ring-brand-line/70">${icon(iconForLabel(label) || "star")}</span>
      </div>
      <strong class="mt-2 block text-3xl font-bold tracking-tight text-brand-ink">${value}</strong>
    </div>
  `;
}

export function groupItems(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item) || "Recommended";
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

export function getReadingMinutes(story) {
  return Number.parseInt(story.readingTime, 10) || 0;
}

export function browseButton(label, action, tone = "primary") {
  const className =
    tone === "primary"
      ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-ink px-3 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(29,41,63,.14)] transition hover:bg-brand-redDark"
      : "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-line/90 bg-white/60 px-3 py-2 text-sm font-semibold text-brand-charcoal transition hover:border-brand-orange hover:bg-white";
  return `<button class="${className}" data-action="${action}">${icon(iconForLabel(label))}<span>${label}</span></button>`;
}

export function browsePage({ eyebrow, title, description, hero, rails }) {
  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] overflow-hidden bg-brand-cream px-4 py-5 text-brand-ink sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <section class="relative overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.09)]">
        <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,250,244,.98)_0%,rgba(248,246,242,.94)_58%,rgba(224,114,88,.13)_100%)]"></div>
        <div class="relative grid min-h-[360px] items-end gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div class="max-w-3xl">
            <span class="inline-flex min-h-6 items-center rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-semibold uppercase text-brand-redDark ring-1 ring-brand-red/15">${escapeHtml(eyebrow)}</span>
            <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">${escapeHtml(title)}</h2>
            <p class="mt-4 max-w-2xl text-sm leading-6 text-brand-charcoal sm:text-base">${escapeHtml(description)}</p>
            <div class="mt-5 flex flex-wrap gap-2">${hero.actions}</div>
          </div>
          <div class="hidden xl:block">${hero.poster}</div>
        </div>
      </section>
      <div class="mt-8 grid gap-8">${rails}</div>
    </div>
  `;
}

export function browseRail(title, items, renderItem) {
  if (!items.length) return "";
  return `
    <section class="min-w-0">
      <div class="mb-3 flex min-w-0 items-end justify-between gap-3">
        <h3 class="min-w-0 text-xl font-bold tracking-tight text-brand-ink">${escapeHtml(title)}</h3>
        <span class="shrink-0 text-xs font-semibold uppercase text-brand-graphite">${items.length} items</span>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        ${items.map(renderItem).join("")}
      </div>
    </section>
  `;
}

export function sentencePoster(sentence, index = 0) {
  const palette = posterPalettes[index % posterPalettes.length];
  return `
    <article class="group w-full overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.05)] transition hover:-translate-y-1 hover:border-brand-orange/50 hover:shadow-[0_16px_30px_rgba(29,41,63,.1)]">
      <div class="flex aspect-[3/4] flex-col justify-between bg-gradient-to-br ${palette} p-4">
        <div class="flex items-center justify-between gap-2">
          <span class="rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">${escapeHtml(sentence.level)}</span>
          <span class="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-950">${escapeHtml(sentence.state)}</span>
        </div>
        <div>
          <p class="text-3xl font-bold leading-tight text-white drop-shadow">${escapeHtml(sentence.target)}</p>
          <p class="mt-3 line-clamp-3 text-sm font-semibold leading-5 text-white/80">${escapeHtml(sentence.translation)}</p>
        </div>
      </div>
      <div class="p-4">
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full bg-brand-red/10 px-2 py-1 text-xs font-semibold text-brand-redDark">${escapeHtml(sentence.topic)}</span>
          <span class="rounded-full bg-white/65 px-2 py-1 text-xs font-semibold text-brand-graphite ring-1 ring-brand-line/70">${escapeHtml(sentence.source)}</span>
        </div>
        <p class="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-brand-graphite">${escapeHtml(sentence.notes)}</p>
        <p class="mt-4 text-xs font-semibold text-brand-graphite">Learning this sentence gives 10 coins.</p>
        <div class="mt-2 flex gap-2">${browseButton("Learn", `learn:${sentence.id}`)}${browseButton("Details", `sentence:${sentence.id}`, "secondary")}</div>
      </div>
    </article>
  `;
}

export function storyPoster(story, index = 0) {
  const locked = !story.unlocked;
  const palette = posterPalettes[index % posterPalettes.length];
  const action = locked ? browseButton(`Unlock ${story.cost}`, `unlockStory:${story.id}`) : browseButton(story.completed ? "Read Again" : "Read Story", `readStory:${story.id}`);
  return `
    <article class="group w-full overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.05)] transition hover:-translate-y-1 hover:border-brand-red/45 hover:shadow-[0_16px_30px_rgba(29,41,63,.1)]">
      <div class="relative flex aspect-[3/4] flex-col justify-between bg-gradient-to-br ${palette} p-4">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,.22),transparent_24%)]"></div>
        <div class="relative flex items-center justify-between gap-2">
          <span class="rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">${escapeHtml(story.level)}</span>
          <span class="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-950">${locked ? "Locked" : story.completed ? "Completed" : "Unlocked"}</span>
        </div>
        <div class="relative">
          <p class="text-xs font-semibold uppercase tracking-[.18em] text-white/65">${escapeHtml(story.topic)}</p>
          <h3 class="mt-2 text-4xl font-bold leading-none text-white drop-shadow">${escapeHtml(story.title)}</h3>
        </div>
      </div>
      <div class="p-4">
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full bg-brand-red/10 px-2 py-1 text-xs font-semibold text-brand-redDark">${escapeHtml(story.readingTime)}</span>
          <span class="rounded-full bg-white/65 px-2 py-1 text-xs font-semibold text-brand-graphite ring-1 ring-brand-line/70">+${story.reward} coins</span>
        </div>
        <p class="mt-3 line-clamp-3 min-h-16 text-sm leading-5 text-brand-graphite">${escapeHtml(story.translation)}</p>
        ${!locked ? `<p class="mt-4 text-xs font-semibold text-brand-graphite">Saving sentences from this story gives 5 coins.</p>` : ""}
        <div class="${!locked ? "mt-2" : "mt-4"} flex flex-wrap gap-2">${action}${!locked ? browseButton("Save Sentences", `saveStory:${story.id}`, "secondary") : ""}</div>
      </div>
    </article>
  `;
}

export function featuredSentence(sentence) {
  if (!sentence) return { actions: "", poster: `<div class="rounded-lg border border-brand-line/80 bg-brand-panel p-6 text-brand-graphite">No sentences available yet.</div>` };
  return {
    actions: `<div class="w-full"><p class="mb-2 text-xs font-semibold text-brand-graphite">Learning this featured sentence gives 10 coins.</p><div class="flex flex-wrap gap-2">${browseButton("Learn Featured", `learn:${sentence.id}`)}${browseButton("Open Details", `sentence:${sentence.id}`, "secondary")}</div></div>`,
    poster: sentencePoster(sentence, 0)
  };
}

export function featuredStory(story) {
  if (!story) return { actions: "", poster: `<div class="rounded-lg border border-brand-line/80 bg-brand-panel p-6 text-brand-graphite">No stories available yet.</div>` };
  const locked = !story.unlocked;
  return {
    actions: `${!locked ? `<div class="w-full"><p class="mb-2 text-xs font-semibold text-brand-graphite">Saving sentences from this story gives 5 coins.</p><div class="flex flex-wrap gap-2">` : ""}${locked ? browseButton(`Unlock ${story.cost}`, `unlockStory:${story.id}`) : browseButton(story.completed ? "Read Again" : "Read Story", `readStory:${story.id}`)}${!locked ? `${browseButton("Save Sentences", `saveStory:${story.id}`, "secondary")}</div></div>` : ""}`,
    poster: storyPoster(story, 0)
  };
}
