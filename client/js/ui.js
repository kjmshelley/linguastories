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

export function escapeHtml(value) {
  const text =
    value && typeof value === "object" && ("name" in value || "code" in value)
      ? value.name || value.code
      : value;
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  calendar: `<path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path>`,
  check: `<path d="m20 6-11 11-5-5"></path>`,
  chevronLeft: `<path d="m15 18-6-6 6-6"></path>`,
  chevronRight: `<path d="m9 18 6-6-6-6"></path>`,
  dashboard: `<rect x="3" y="3" width="7" height="8" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="15" width="7" height="6" rx="1"></rect>`,
  edit: `<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>`,
  eye: `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>`,
  filter: `<path d="M3 5h18"></path><path d="M6 12h12"></path><path d="M10 19h4"></path>`,
  flag: `<path d="M5 22V4"></path><path d="M5 4h12l-1 5 1 5H5"></path>`,
  globe: `<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 0 20"></path><path d="M12 2a15.3 15.3 0 0 0 0 20"></path>`,
  login: `<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><path d="m10 17 5-5-5-5"></path><path d="M15 12H3"></path>`,
  logout: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path>`,
  menu: `<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>`,
  message: `<path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>`,
  mic: `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v3"></path>`,
  play: `<path d="m8 5 11 7-11 7Z"></path>`,
  save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8"></path><path d="M7 3v5h8"></path>`,
  search: `<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`,
  star: `<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"></path>`,
  target: `<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>`,
  trash: `<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path>`,
  trophy: `<path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v5a5 5 0 0 1-10 0Z"></path><path d="M17 6h3a3 3 0 0 1-3 3"></path><path d="M7 6H4a3 3 0 0 0 3 3"></path>`,
  upload: `<path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M5 21h14"></path>`,
  user: `<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>`,
  users: `<path d="M16 21a6 6 0 0 0-12 0"></path><circle cx="10" cy="8" r="4"></circle><path d="M22 21a5 5 0 0 0-5-5"></path><path d="M17 4a4 4 0 0 1 0 8"></path>`,
  video: `<path d="M15 10.5 21 7v10l-6-3.5"></path><rect x="3" y="6" width="12" height="12" rx="2"></rect>`
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
  if (text.includes("edit") || text.includes("save profile") || text.includes("save info")) return "edit";
  if (text.includes("encourage")) return "message";
  if (text.includes("follow")) return "users";
  if (text.includes("learn") || text.includes("review")) return "book";
  if (text.includes("log in")) return "login";
  if (text.includes("log out")) return "logout";
  if (text.includes("practice")) return "mic";
  if (text.includes("read")) return "play";
  if (text.includes("remove")) return "trash";
  if (text.includes("share")) return "message";
  if (text.includes("support")) return "trophy";
  if (text.includes("upload")) return "upload";
  if (text.includes("save")) return "save";
  return "";
}

export function button(label, action, className = ui.primary, iconName = iconForLabel(label)) {
  return `<button class="${className}" data-action="${action}">${icon(iconName)}<span>${label}</span></button>`;
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
