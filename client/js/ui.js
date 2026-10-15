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

const LUCIDE_SPRITE_HREF = "/assets/icons/lucide-sprite.svg";
const LUCIDE_ICON_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

export function icon(name, className = "h-4 w-4") {
  const iconName = String(name || "");
  if (!LUCIDE_ICON_NAME_RE.test(iconName)) return "";
  return `<svg class="${className} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="${LUCIDE_SPRITE_HREF}#${iconName}"></use></svg>`;
}
