import { stat, ui } from "../ui.js";

export function progressView({ state }) {
  return `<section class="${ui.grid4}">${Object.entries(state.dashboard.progress).map(([key, value]) => stat(key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`), value)).join("")}</section>`;
}
