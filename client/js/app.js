import { landingView, loginView, signupView } from "./pages/public.js?v=focused-learning-20260722";
import {
  bindLearningExperience,
  learningExperienceView,
  learningRouteFromPath,
  learningStateReducer
} from "./pages/learn-experience.js";
import { loadLearningUiState, saveLearningUiState } from "./learning/state.mjs";
import { learningContentRuntime } from "./content/content-runtime.js";
import { escapeHtml } from "./ui.js";

const appShell = document.querySelector("#appShell");
const view = document.querySelector("#view");
const modalTemplate = document.querySelector("#modalTemplate");
const publicRoutes = new Set(["/", "/login", "/signup"]);

let appConfig = { supportedLanguages: [] };
let authState = { authenticated: false, user: null };
let learningUiState = loadLearningUiState();
let contentListenerBound = false;
let modalRestoreFocus = null;

function setFocusedShell() {
  appShell.className = "min-h-screen";
  view.className = "min-h-screen";
  document.body.classList.remove("overflow-hidden");
}

function currentLearningState() {
  return { ...learningUiState, ...learningContentRuntime.snapshot() };
}

function dispatchLearning(action) {
  learningUiState = saveLearningUiState(learningStateReducer(learningUiState, action));
  return learningUiState;
}

async function initializeLearningContent() {
  await learningContentRuntime.init();
  if (contentListenerBound) return;
  learningContentRuntime.subscribe(() => {
    if (authState.authenticated && learningRouteFromPath()) render();
  });
  contentListenerBound = true;
}

function navigate(path, { replace = false } = {}) {
  if (replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  render();
}

function closeModal() {
  document.querySelector("[data-modal-root]")?.remove();
  document.body.classList.remove("overflow-hidden");
  modalRestoreFocus?.focus?.();
  modalRestoreFocus = null;
}

function showModal(html) {
  closeModal();
  modalRestoreFocus = document.activeElement;
  const modal = modalTemplate.content.firstElementChild.cloneNode(true);
  modal.dataset.modalRoot = "true";
  modal.querySelector("[data-modal-body]").innerHTML = html;
  document.body.append(modal);
  document.body.classList.add("overflow-hidden");
  bindGlobalActions(modal);
  bindLearning(modal);
  requestAnimationFrame(() => modal.querySelector("button, input, select, [tabindex]")?.focus());
}

function publicContext() {
  return { appConfig };
}

function bindLearning(root = view) {
  bindLearningExperience(root, {
    getState: currentLearningState,
    dispatch: dispatchLearning,
    contentRuntime: learningContentRuntime,
    render,
    navigate,
    showModal,
    closeModal
  });
}

async function submitAuthForm(form) {
  const formType = form.dataset.form;
  if (!["login", "register"].includes(formType)) return;
  const button = form.querySelector('button[type="submit"], button:not([type])');
  const originalLabel = button?.innerHTML || "";
  if (button) { button.disabled = true; button.textContent = formType === "login" ? "Logging in…" : "Creating account…"; }
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`/api/auth/${formType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Account request failed");
    authState = { authenticated: true, user: body.user || body };
    await initializeLearningContent();
    navigate(learningContentRuntime.snapshot().installed ? "/app/learn" : "/app/languages", { replace: true });
  } catch (error) {
    let alert = form.querySelector("[role=alert]");
    if (!alert) { alert = document.createElement("p"); alert.setAttribute("role", "alert"); alert.className = "rounded-lg bg-brand-red/10 px-3 py-2 text-sm font-bold text-brand-redDark"; form.prepend(alert); }
    alert.textContent = error.message;
    alert.focus?.();
  } finally {
    if (button?.isConnected) { button.disabled = false; button.innerHTML = originalLabel; }
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => null);
  authState = { authenticated: false, user: null };
  navigate("/", { replace: true });
}

function bindGlobalActions(root = document) {
  root.querySelectorAll("form[data-form]").forEach((form) => {
    if (form.dataset.boundFocusedForm) return;
    form.dataset.boundFocusedForm = "true";
    form.addEventListener("submit", (event) => { event.preventDefault(); void submitAuthForm(form); });
  });
  root.querySelectorAll('[data-action="closeModal"]').forEach((button) => {
    if (button.dataset.boundCloseModal) return;
    button.dataset.boundCloseModal = "true";
    button.addEventListener("click", closeModal);
  });
  root.querySelectorAll('[data-auth-action="logout"]').forEach((button) => {
    if (button.dataset.boundLogout) return;
    button.dataset.boundLogout = "true";
    button.addEventListener("click", () => void logout());
  });
  root.querySelectorAll("[data-public-menu-link]").forEach((link) => link.addEventListener("click", () => link.closest("details")?.removeAttribute("open"), { once: true }));
}

function renderPublic() {
  setFocusedShell();
  const page = window.location.pathname === "/login" ? loginView(publicContext()) : window.location.pathname === "/signup" ? signupView(publicContext()) : landingView(publicContext());
  view.innerHTML = page;
  document.title = window.location.pathname === "/login" ? "Log in | LinguaStories" : window.location.pathname === "/signup" ? "Start learning | LinguaStories" : "LinguaStories | Short Lessons, Lasting Progress";
  bindGlobalActions(view);
}

function renderLearning() {
  setFocusedShell();
  const route = learningRouteFromPath();
  if (!route) return navigate(learningContentRuntime.snapshot().installed ? "/app/learn" : "/app/languages", { replace: true });
  document.documentElement.lang = "en";
  document.documentElement.dataset.learningMotion = currentLearningState().settingsState?.global?.reducedMotion || "system";
  document.title = `${route.id === "languageSelection" ? "Choose a Language" : "Learn"} | LinguaStories`;
  view.innerHTML = learningExperienceView({ route, user: authState.user || {}, learningState: currentLearningState() });
  bindGlobalActions(view);
  bindLearning(view);
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function render() {
  closeModal();
  if (window.location.pathname.startsWith("/app")) {
    if (!authState.authenticated) return navigate("/login", { replace: true });
    return renderLearning();
  }
  if (!publicRoutes.has(window.location.pathname)) return navigate("/", { replace: true });
  renderPublic();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link], a[data-app-link]");
  if (!link || link.target || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(`${url.pathname}${url.search}${url.hash}`);
});

window.addEventListener("popstate", render);
window.addEventListener("online", () => { if (authState.authenticated && learningRouteFromPath()) render(); });
window.addEventListener("offline", () => { if (authState.authenticated && learningRouteFromPath()) render(); });

async function init() {
  try {
    setFocusedShell();
    appConfig = await fetch("/api/config").then((response) => response.ok ? response.json() : { supportedLanguages: [] }).catch(() => ({ supportedLanguages: [] }));
    authState = await fetch("/api/auth/me").then((response) => response.ok ? response.json() : { authenticated: false, user: null }).catch(() => ({ authenticated: false, user: null }));
    if (authState.authenticated) await initializeLearningContent();
    if (authState.authenticated && ["/login", "/signup"].includes(window.location.pathname)) {
      history.replaceState({}, "", learningContentRuntime.snapshot().installed ? "/app/learn" : "/app/languages");
    } else if (!authState.authenticated && window.location.pathname.startsWith("/app")) {
      history.replaceState({}, "", "/login");
    }
    render();
  } catch (error) {
    view.innerHTML = `<div class="grid min-h-screen place-items-center bg-brand-snow px-4 text-center"><div><h1 class="text-2xl font-black">Unable to start LinguaStories</h1><p class="mt-3 text-brand-graphite">${escapeHtml(error.message)}</p></div></div>`;
  }
}

void init();
