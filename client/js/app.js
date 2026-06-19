import { dashboardView } from "./pages/dashboard.js";
import { communityConnectView, communityLearnerView, communityPostView, createPostModal, postImageModal } from "./pages/community.js";
import { landingView, loginView, signupView } from "./pages/public.js?v=auth-logo-copy-20260615";
import { addLanguageModal, deleteProfileConfirmModal, editLanguageModal, profileInfoView, profileView, subscriptionsView } from "./pages/profile.js";
import {
  bookLessonView,
  findTeacherView,
  learningNotesView,
  myLearningView,
  teacherBookingRulesModal,
  teacherAvailabilityView,
  teacherBookingsView,
  teacherDashboardView,
  teacherLessonNotesView,
  teacherProfileCreateView,
  teacherProfileDetailView,
  teacherProfileEditView,
  teacherResourcesView,
  teacherStudentDetailView,
  teacherStudentsView,
  teacherTemplatesView
} from "./pages/learning.js";
import { createVoiceVideoRoomModal, voiceVideoRoomCardsView, voiceVideoRoomView, voiceVideoRoomsView, voiceVideoRulesModal } from "./pages/voice-video-rooms.js";
import { languageName, languageSelectOptions } from "./languages.js";
import { languageSkillLevelOptions } from "./levels.js";
import { escapeHtml, icon, ui } from "./ui.js";
import { gsap } from "../vendor/gsap/gsap.esm.js";

const routeGroups = [
  {
    title: "",
    routes: [
      ["dashboard", "Home"],
      ["findTeacher", "Find a Teacher"]
    ]
  },
  {
    title: "Community",
    routes: [
      ["communityConnect", "Connections"],
      ["voiceVideoRooms", "Video/Voice Practice"]
    ]
  },
  {
    title: "For teachers",
    routes: [
      ["teacherDashboard", "Teacher Workspace"],
      ["teacherAvailability", "My Availablity"],
      ["teacherStudents", "My Students"]
    ]
  },
  {
    title: "",
    routes: [
      ["teacherProfileCreate", "How do I become a teacher?", "teacherDashboard"]
    ]
  }
];

const myLearningTabTitles = {
  lessons: "My Lessons",
  teachers: "My Booked Teachers",
  calendar: "My Scheduled Classes"
};

const hiddenRoutes = [
  ["communityLearner", "Learner Profile"],
  ["communityPost", "Post"],
  ["voiceVideoRoom", "Voice/Video Room"],
  ["teacherProfileDetail", "Teacher Profile"],
  ["teacherProfileCreate", "Create Teacher Profile"],
  ["teacherProfileEdit", "Edit Teacher Profile"],
  ["bookLesson", "Book Lesson"],
  ["teacherClassroom", "Classroom"],
  ["myLessons", "My Lessons"],
  ["myTeachers", "My Booked Teachers"],
  ["learningNotes", "Learning Notes"],
  ["profileInfo", "My Account"],
  ["teacherAvailability", "My Open Time Slots"],
  ["teacherBookings", "Unavailable Blocks"],
  ["teacherStudents", "My Students"],
  ["teacherStudentDetail", "Student Profile"],
  ["teacherLessonNotes", "Lesson Notes"],
  ["teacherResources", "Resources"],
  ["teacherTemplates", "Lesson Templates"],
  ["profileSubscriptions", "Subscriptions"],
  ["profile", "Profile"],
];

const routes = [...routeGroups.flatMap((group) => group.routes), ...hiddenRoutes];
const routeSlugs = {
  dashboard: "dashboard",
  communityConnect: "community",
  voiceVideoRooms: "community/voice-video-rooms",
  voiceVideoRoom: "community/voice-video-rooms",
  findTeacher: "learning/find-teacher",
  teacherProfileDetail: "learning/teacher-profile",
  teacherProfileCreate: "learning/teacher-profile/new",
  teacherProfileEdit: "learning/teacher-profile",
  bookLesson: "learning/teacher-profile",
  teacherClassroom: "learning/classroom",
  myLessons: "learning/my-lessons",
  myTeachers: "learning/my-teachers",
  learningNotes: "learning/learning-notes",
  teacherDashboard: "learning/teacher-dashboard",
  teacherAvailability: "learning/availability",
  teacherBookings: "learning/unavailable-blocks",
  teacherStudents: "learning/students",
  teacherStudentDetail: "learning/students",
  teacherLessonNotes: "learning/lesson-notes",
  teacherResources: "learning/resources",
  teacherTemplates: "learning/templates",
  profileInfo: "profile/my-info",
  profileSubscriptions: "profile/subscriptions",
};
const browseRoutes = new Set([]);
const communityRoutes = new Set(["communityLearner", "communityPost"]);
const teacherStudentRoutes = new Set(["dashboard", "findTeacher", "teacherProfileDetail", "teacherProfileCreate", "teacherProfileEdit", "bookLesson", "myLessons", "myTeachers", "learningNotes", "profileInfo", "profileSubscriptions", "teacherDashboard", "teacherAvailability", "teacherBookings", "teacherStudents", "teacherStudentDetail", "teacherLessonNotes", "teacherResources", "teacherTemplates"]);

let appConfig = { supportedLanguages: [], accountTiers: [] };
let state = null;
let communityListLimits = { communityConnect: 10 };
let voiceVideoRooms = [];
let voiceVideoRoomFilters = { q: "", cefrLevel: "", roomType: "" };
let voiceVideoRoomsLoaded = false;
let voiceVideoShowHistory = false;
let voiceVideoPollTimer = null;
let voiceVideoListCountdownTimer = null;
let voiceVideoPollRoute = "";
let teacherStudentData = {};
let accountBillingData = {};
let teacherStudentFilters = { q: "", language: "", countryOfBirth: "", speaksLanguage: "", nativeSpeaker: "", professionalTutor: "", speakingPracticeOnly: "", maxRate: "" };
let teacherStudentLoadedKeys = new Set();
let teacherSearchDebounceTimer = null;
let syncedStripeReturnBookings = new Set();
let bookingSelection = { teacherProfileId: "", lessonType: "one_on_one", durationMinutes: "", date: "", startsAt: "" };
let myLearningTab = "lessons";
let myLearningWeekStart = "";
let teacherCalendarFilters = { view: "month", teacherProfileId: "", status: "" };
let teacherWorkspaceShowCompletedPaid = false;
let activeVoiceVideoRoom = null;
let activeVoiceVideoSession = null;
let activeVoiceVideoParticipants = [];
let livekitRoomConnection = null;
let livekitRoomTimer = null;
let endingVoiceVideoRoom = false;
let livekitWarningFlags = { abandoned: false, three: false, one: false, ten: false };
let livekitParticipantTiles = new Map();
let livekitHiddenAudioLayer = null;
let livekitLocalTracks = [];
let livekitLocalAudioMuted = false;
let livekitLocalVideoMuted = false;
let livekitLayoutMode = "grid";
let classroomBookingId = "";
let classroomConnecting = false;
let classroomConnected = false;
let classroomSelfPosition = localStorage.getItem("linguaStoriesClassroomSelfPosition") || "bottom-right";
let classroomSelfCustomPosition = loadClassroomSelfCustomPosition();
let chatOpen = false;
let chatContactsHidden = false;
let chatMobileScreen = "contacts";
let modalRestoreFocus = null;
let mobileMenuOpen = false;
let selectedConversationId = "";
let pendingChatRecipientId = "";
let seenNotificationKeys = loadSeenNotificationKeys();


const appShell = document.querySelector("#appShell");
const sidebar = document.querySelector("#sidebar");
const topbar = document.querySelector("#topbar");
const view = document.querySelector("#view");
const nav = document.querySelector("#nav");
const chatDrawer = document.querySelector("#chatDrawer");
const pageTitle = document.querySelector("#pageTitle");
const messageBadge = document.querySelector("#messageBadge");
const notificationBadge = document.querySelector("#notificationBadge");
const mobileTopbar = document.querySelector("#mobileTopbar");
const mobilePageTitle = document.querySelector("#mobilePageTitle");
const mobileMessageBadge = document.querySelector("#mobileMessageBadge");
const mobileMenuBackdrop = document.querySelector("#mobileMenuBackdrop");
let lastRenderedPageKey = "";

function scrollToPageTopOnRouteChange() {
  const pageKey = `${location.pathname}${location.search}${location.hash}`;
  if (pageKey === lastRenderedPageKey) return;
  lastRenderedPageKey = pageKey;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function activeRoute() {
  const hashRoute = location.hash.replace("#", "");
  if (hashRoute) return routes.some(([id]) => id === hashRoute) ? hashRoute : "dashboard";
  if (!location.pathname.startsWith("/app")) return "dashboard";
  const slug = location.pathname.replace(/^\/app\/?/, "").replace(/\/$/, "") || "dashboard";
  if (slug === "community/connect") return "communityConnect";
  if (slug.startsWith("community/connect/")) return "communityLearner";
  if (slug.startsWith("community/posts/")) return "communityPost";
  if (slug.startsWith("community/voice-video-rooms/")) return "voiceVideoRoom";
  if (slug.startsWith("learning/classroom/")) return "teacherClassroom";
  if (/^learning\/students\/[^/]+$/.test(slug)) return "teacherStudentDetail";
  if (slug === "learning/teacher-profile/new") {
    return "teacherProfileCreate";
  }
  if (/^learning\/teacher-profile\/[^/]+\/edit$/.test(slug)) {
    return "teacherProfileEdit";
  }
  if (/^learning\/teacher-profile\/[^/]+\/book$/.test(slug)) return "bookLesson";
  if (slug.startsWith("learning/teacher-profile/")) return "teacherProfileDetail";
  const match = routes.find(([id]) => (routeSlugs[id] || id) === slug);
  return match?.[0] || "dashboard";
}

function activeNavRoute() {
  const route = activeRoute();
  if (route === "voiceVideoRoom") return "voiceVideoRooms";
  if (route === "communityPost") return "communityConnect";
  if (route === "teacherProfileDetail" || route === "bookLesson") return "findTeacher";
  if (["myTeachers", "learningNotes"].includes(route)) return "myLessons";
  if (route === "profileSubscriptions") return "profileInfo";
  if (route === "teacherProfileCreate" && !hasTeacherProfile()) return "teacherProfileCreate";
  if (["teacherProfileCreate", "teacherProfileEdit"].includes(route)) return "teacherDashboard";
  if (route === "teacherStudentDetail") return "teacherStudents";
  if (["teacherBookings", "teacherLessonNotes", "teacherResources", "teacherTemplates"].includes(route)) return "teacherDashboard";
  return route;
}

function activeLearnerId() {
  const match = location.pathname.match(/^\/app\/community\/connect\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activePostId() {
  const match = location.pathname.match(/^\/app\/community\/posts\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeVoiceVideoRoomId() {
  const match = location.pathname.match(/^\/app\/community\/voice-video-rooms\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeClassroomBookingId() {
  const match = location.pathname.match(/^\/app\/learning\/classroom\/([0-9a-f-]+)\/?$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeStudentId() {
  const match = location.pathname.match(/^\/app\/learning\/students\/([0-9a-f-]+)\/?$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeTeacherProfileId() {
  const match = location.pathname.match(/^\/app\/learning\/teacher-profile\/([0-9a-f-]+)(?:\/book)?\/?$/i)
    || location.pathname.match(/^\/app\/learning\/teacher-profile\/([0-9a-f-]+)\/edit\/?$/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function appPath(id, params = {}) {
  if (id === "communityLearner") return `/app/community/connect/${encodeURIComponent(params.learnerId || "")}`;
  if (id === "communityPost") return `/app/community/posts/${encodeURIComponent(params.postId || "")}`;
  if (id === "voiceVideoRoom") return `/app/community/voice-video-rooms/${encodeURIComponent(params.roomId || "")}`;
  if (id === "teacherClassroom") return `/app/learning/classroom/${encodeURIComponent(params.bookingId || "")}`;
  if (id === "teacherStudentDetail") return `/app/learning/students/${encodeURIComponent(params.studentId || "")}`;
  if (id === "teacherProfileDetail") return `/app/learning/teacher-profile/${encodeURIComponent(params.teacherProfileId || "")}`;
  if (id === "teacherProfileEdit") return `/app/learning/teacher-profile/${encodeURIComponent(params.teacherProfileId || "")}/edit`;
  if (id === "bookLesson") return `/app/learning/teacher-profile/${encodeURIComponent(params.teacherProfileId || "")}/book`;
  return `/app/${routeSlugs[id] || id}`;
}

function routeIcon(id) {
  const icons = {
    dashboard: "dashboard",
    communityConnect: "users",
    voiceVideoRooms: "video",
    findTeacher: "search",
    myLessons: "book",
    myTeachers: "users",
    teacherDashboard: "dashboard",
    teacherAvailability: "calendar",
    teacherBookings: "book",
    teacherStudents: "users",
    teacherLessonNotes: "book",
    teacherProfileCreate: "trophy",
    profileInfo: "user",
  };
  return icon(icons[id] || "book");
}

function normalizeAppUrl() {
  if (!location.pathname.startsWith("/app")) return;
  const route = activeRoute();
  const cleanPath =
    route === "communityLearner"
        ? appPath(route, { learnerId: activeLearnerId() })
        : route === "communityPost"
          ? appPath(route, { postId: activePostId() })
        : route === "voiceVideoRoom"
            ? appPath(route, { roomId: activeVoiceVideoRoomId() || activeVoiceVideoRoom?.id })
          : route === "teacherStudentDetail"
            ? appPath(route, { studentId: activeStudentId() })
          : route === "teacherClassroom"
            ? appPath(route, { bookingId: activeClassroomBookingId() || classroomBookingId })
          : route === "teacherProfileDetail"
            ? appPath(route, { teacherProfileId: activeTeacherProfileId() })
          : route === "teacherProfileEdit"
            ? appPath(route, { teacherProfileId: activeTeacherProfileId() })
          : route === "bookLesson"
            ? appPath(route, { teacherProfileId: activeTeacherProfileId() })
          : appPath(route);
  if (location.pathname !== cleanPath || location.hash) history.replaceState({}, "", cleanPath);
}

function context() {
  return {
    state,
    appConfig,
    appPath,
    activeLearnerId,
    activePostId,
    activeVoiceVideoRoomId,
    activeTeacherProfileId,
    communityListLimits,
    voiceVideoRooms,
    voiceVideoRoomFilters,
    voiceVideoShowHistory,
    activeVoiceVideoRoom,
    activeVoiceVideoSession,
    activeVoiceVideoParticipants,
    teacherStudentData: {
      ...teacherStudentData,
      teacherWorkspaceShowCompletedPaid,
      unavailableBlocksHref: appPath("teacherBookings"),
      currentUserId: state?.user?.id || ""
    },
    accountBillingData,
    teacherStudentFilters,
    bookingSelection,
    myLearningTab,
    myLearningWeekStart,
    teacherCalendarFilters,
    activeTeacherProfileId: activeTeacherProfileId(),
    activeStudentId: activeStudentId()
  };
}

function subscriptionCapabilities() {
  return state?.subscription?.capabilities || state?.user?.subscription?.capabilities || {};
}

function hasTeacherProfile() {
  if (Array.isArray(teacherStudentData.profiles) && teacherStudentData.profiles.length > 0) return true;
  if (typeof state?.user?.hasTeacherProfile === "boolean") return state.user.hasTeacherProfile;
  if (state?.user?.hasActiveTeacherProfile) return true;
  return false;
}

function canAccessRoute(id) {
  const capabilities = subscriptionCapabilities();
  if (["teacherProfileCreate", "teacherProfileEdit"].includes(id)) return true;
  if (id === "teacherDashboard") return true;
  if (["teacherDashboard", "teacherAvailability", "teacherBookings", "teacherStudents", "teacherStudentDetail", "teacherLessonNotes", "teacherResources", "teacherTemplates"].includes(id)) {
    return Boolean(capabilities.teacherWorkspace);
  }
  return true;
}

function subscriptionLockedView(route) {
  return `
    <section class="${ui.card}">
      <span class="${ui.tagGold}">Subscription</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Upgrade required</h2>
      <p class="mt-2 ${ui.muted}">Teacher workspace access requires a teacher account.</p>
      <a class="${ui.primary} mt-5" href="${appPath("profileSubscriptions")}" data-app-link>${icon("user", "h-4 w-4")}<span>View Account</span></a>
    </section>
  `;
}

function classroomView() {
  const bookingId = activeClassroomBookingId();
  const audioLabel = livekitLocalAudioMuted ? "Unmute" : "Mute";
  const cameraLabel = livekitLocalVideoMuted ? "Turn camera on" : "Turn camera off";
  return `
    <section class="relative min-h-screen overflow-hidden bg-black text-white">
      <div class="absolute inset-0" data-livekit-stage>
        <div class="grid h-full min-h-screen place-items-center p-6 text-center text-sm font-semibold text-white/70">
          <div>
            <span class="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
            Opening classroom...
          </div>
        </div>
      </div>
      <div class="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div class="pointer-events-auto flex items-center justify-between gap-3">
          <a class="grid h-11 w-11 place-items-center rounded-lg bg-white/12 text-white ring-1 ring-white/15 transition hover:bg-white/18" href="${appPath("myLessons")}" aria-label="Back to lessons">${icon("arrowLeft", "h-5 w-5")}</a>
          <span class="rounded bg-black/45 px-3 py-1 text-xs font-bold uppercase tracking-[.12em] text-white/72">Classroom</span>
        </div>
      </div>
      <div class="absolute inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-black/75 to-transparent px-3 pb-[max(0.75rem,var(--safe-bottom))] pt-8 sm:px-4">
        <div class="grid w-full max-w-3xl grid-cols-2 gap-2 rounded-lg bg-black/55 p-2 ring-1 ring-white/15 backdrop-blur sm:flex sm:flex-wrap sm:items-center sm:justify-center">
          <button class="${ui.secondary} border-white/15 bg-white/12 text-white hover:bg-white/18" data-action="toggleClassroomAudio" data-skip-pending="true">${icon(livekitLocalAudioMuted ? "mic" : "mic", "h-4 w-4")}<span>${audioLabel}</span></button>
          <button class="${ui.secondary} border-white/15 bg-white/12 text-white hover:bg-white/18" data-action="toggleClassroomCamera" data-skip-pending="true">${icon("video", "h-4 w-4")}<span>${cameraLabel}</span></button>
          <button class="${ui.secondary} border-white/15 bg-white/12 text-white hover:bg-white/18" data-action="moveClassroomSelfView">${icon("arrowRight", "h-4 w-4")}<span>Move preview</span></button>
          <button class="${ui.danger}" data-action="leaveTeacherClassroom:${escapeHtml(bookingId)}">${icon("logout", "h-4 w-4")}<span>Leave</span></button>
        </div>
      </div>
    </section>
  `;
}

function renderNav() {
  const activeNav = activeNavRoute();
  const capabilities = subscriptionCapabilities();
  const userHasTeacherProfile = hasTeacherProfile();
  nav.innerHTML = routeGroups
    .map((group) => {
      const visibleRoutes = group.routes.filter(([id]) => {
        if (id === "teacherProfileCreate") return !userHasTeacherProfile;
        if (group.title === "For teachers" && !userHasTeacherProfile) return false;
        if (group.title === "For teachers" && !capabilities.teacherWorkspace) return id === "teacherDashboard";
        return canAccessRoute(id);
      });
      if (!visibleRoutes.length) return "";
      return `
        <section class="grid gap-1.5">
          ${group.title ? `<div class="px-2 text-[11px] font-semibold uppercase text-white/38">${group.title}</div>` : ""}
          ${visibleRoutes
            .map(([id, label, targetId]) => {
              const active =
                activeNav === id ||
                (activeNav === "communityLearner" && id === "communityConnect");
              return `
                <a href="${appPath(targetId || id)}" data-app-link class="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium no-underline transition ${
                  active ? "bg-white/12 text-white ring-1 ring-white/10" : "text-white/58 hover:bg-white/[.07] hover:text-white"
                }">
                  ${routeIcon(id)}
                  <span>${label}</span>
                </a>
              `;
            })
            .join("")}
        </section>
      `;
    })
    .join("");
}

function notificationItems() {
  return Array.isArray(state?.notifications) ? state.notifications : [];
}

function notificationKey(item) {
  return [item.type || "notification", item.title || "", item.body || ""].join("::");
}

function loadSeenNotificationKeys() {
  try {
    return new Set(JSON.parse(localStorage.getItem("linguaStoriesSeenNotifications") || "[]"));
  } catch {
    return new Set();
  }
}

function loadClassroomSelfCustomPosition() {
  try {
    return JSON.parse(localStorage.getItem("linguaStoriesClassroomSelfCustomPosition") || "null");
  } catch {
    return null;
  }
}

function saveSeenNotificationKeys() {
  localStorage.setItem("linguaStoriesSeenNotifications", JSON.stringify([...seenNotificationKeys].slice(-80)));
}

function markNotificationsSeen() {
  notificationItems().forEach((item) => seenNotificationKeys.add(notificationKey(item)));
  saveSeenNotificationKeys();
  syncNotificationBadge();
}

function syncNotificationBadge() {
  if (!notificationBadge) return;
  const count = notificationItems().filter((item) => !seenNotificationKeys.has(notificationKey(item))).length;
  notificationBadge.textContent = count;
  notificationBadge.className = `absolute -right-1 -top-1 ${count ? "inline-flex" : "hidden"} min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white`;
}

function notificationsModal() {
  const items = notificationItems();
  return `
    <div>
      <span class="${items.length ? ui.tagRed : ui.tagGold}">${items.length} updates</span>
      <h2 class="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-ink">${icon("bell", "h-5 w-5 text-brand-redDark")}<span>Notifications</span></h2>
      ${
        items.length
          ? `<div class="mt-5 grid gap-3">
              ${items
                .map(
                  (item) => `
                    <div class="rounded-lg border border-brand-line/80 bg-white/60 p-4">
                      <div class="${ui.row}">
                        <span class="${item.tone === "urgent" ? ui.tagRed : item.tone === "good" ? ui.tagGold : ui.tag}">${escapeHtml(item.label || "Update")}</span>
                      </div>
                      <h3 class="mt-3 text-sm font-bold text-brand-ink">${escapeHtml(item.title)}</h3>
                      <p class="mt-1 text-sm leading-6 text-brand-graphite">${escapeHtml(item.body)}</p>
                    </div>
                  `
                )
                .join("")}
            </div>`
          : `<p class="mt-4 ${ui.muted}">You are all caught up. New messages, lesson updates, and community replies will show here.</p>`
      }
    </div>
  `;
}

function syncMobileMenu() {
  if (!sidebar) return;
  sidebar.className = mobileMenuOpen
    ? "fixed inset-y-0 left-0 z-50 block w-[min(286px,calc(100vw-24px))] overflow-y-auto border-r border-black/10 bg-brand-sidebar px-4 py-5 text-white shadow-[18px_0_50px_rgba(29,41,63,.26)] lg:sticky lg:top-0 lg:block lg:min-h-screen lg:w-[286px] lg:shadow-none"
    : "hidden min-h-screen border-r border-black/10 bg-brand-sidebar px-4 py-5 text-white lg:sticky lg:top-0 lg:block";
  sidebar.setAttribute("aria-hidden", mobileMenuOpen || window.matchMedia("(min-width: 1024px)").matches ? "false" : "true");
  if (mobileMenuBackdrop) mobileMenuBackdrop.className = mobileMenuOpen ? "fixed inset-0 z-40 bg-brand-ink/55 backdrop-blur-sm lg:hidden" : "hidden fixed inset-0 z-40 bg-brand-ink/55 backdrop-blur-sm lg:hidden";
  document.body.classList.toggle("overflow-hidden", mobileMenuOpen);
}

function loadingSpinnerMarkup(className = "h-4 w-4") {
  return `<svg class="${className} shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3"></circle><path class="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg>`;
}

function setButtonPending(button, pendingLabel = "Working") {
  if (!button?.matches?.("button, a, [role='button'], input[type='submit']")) return () => {};
  if (button.dataset.skipPending === "true") return () => {};
  if (!button || button.dataset.pending === "true" || button.disabled) return () => {};
  const explicitLoadingLabel = button.dataset.pendingLabel;
  const loadingLabel = explicitLoadingLabel || pendingLabel;
  if (button.matches("input[type='submit']")) {
    const originalValue = button.value;
    const originalAriaBusy = button.getAttribute("aria-busy");
    button.dataset.pending = "true";
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
    button.value = loadingLabel;
    return () => {
      if (!button.isConnected) return;
      button.value = originalValue;
      button.disabled = false;
      if (originalAriaBusy === null) button.removeAttribute("aria-busy");
      else button.setAttribute("aria-busy", originalAriaBusy);
      delete button.dataset.pending;
    };
  }
  const originalHtml = button.innerHTML;
  const originalAriaBusy = button.getAttribute("aria-busy");
  const originalAriaDisabled = button.getAttribute("aria-disabled");
  const label = explicitLoadingLabel || button.querySelector("span")?.textContent?.trim() || button.textContent?.trim() || button.getAttribute("aria-label") || button.getAttribute("title") || pendingLabel;
  const iconOnly = !button.querySelector("span") && (button.className.includes("place-items-center") || button.className.includes("w-11"));
  button.dataset.pending = "true";
  button.setAttribute("aria-busy", "true");
  button.setAttribute("aria-disabled", "true");
  button.classList.add("pointer-events-none", "opacity-75");
  if ("disabled" in button) button.disabled = true;
  button.innerHTML = iconOnly
    ? loadingSpinnerMarkup("h-5 w-5")
    : `${loadingSpinnerMarkup()}<span>${escapeHtml(label)}</span>`;
  return () => {
    if (!button.isConnected) return;
    button.innerHTML = originalHtml;
    button.classList.remove("pointer-events-none", "opacity-75");
    if ("disabled" in button) button.disabled = false;
    if (originalAriaBusy === null) button.removeAttribute("aria-busy");
    else button.setAttribute("aria-busy", originalAriaBusy);
    if (originalAriaDisabled === null) button.removeAttribute("aria-disabled");
    else button.setAttribute("aria-disabled", originalAriaDisabled);
    delete button.dataset.pending;
  };
}

function pendingButtonForForm(form, submitter) {
  if (submitter?.matches?.("button, input[type='submit']")) return submitter;
  return form.querySelector("button[type='submit'], button:not([type]), input[type='submit']");
}

function bindLoadingImages(root = document) {
  root.querySelectorAll("img").forEach((image) => {
    if (!image.hasAttribute("loading")) image.loading = "lazy";
    if (!image.hasAttribute("decoding")) image.decoding = "async";
  });
  root.querySelectorAll("[data-loading-image]").forEach((image) => {
    if (image.dataset.boundLoadingImage) return;
    image.dataset.boundLoadingImage = "true";
    const frame = image.closest("[data-loading-image-frame]");
    const indicator = frame?.querySelector("[data-loading-image-indicator]");
    const showImage = () => {
      indicator?.classList.add("hidden");
      image.classList.remove("opacity-0");
    };
    if (image.complete && image.naturalWidth > 0) {
      showImage();
      return;
    }
    image.addEventListener("load", showImage, { once: true });
    image.addEventListener("error", () => {
      indicator?.classList.add("hidden");
      image.classList.remove("opacity-0");
    }, { once: true });
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  if (response.status === 401) {
    state = null;
    navigatePublic("/login");
    return state;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    showModal(`<h2 class="text-xl font-black">Action unavailable</h2><p class="${ui.muted}">${escapeHtml(body.error)}</p>`);
    return state;
  }
  state = await response.json();
  render();
  return state;
}

async function authRequest(path, data) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    showModal(`<h2 class="text-xl font-black">Account action failed</h2><p class="${ui.muted}">${escapeHtml(body.error)}</p>`);
    return;
  }
  state = await response.json();
  history.pushState({}, "", appPath("dashboard"));
  render();
}

async function livekitApi(path, options = {}) {
  const { quiet = false, ...fetchOptions } = options;
  const response = await fetch(path, { ...fetchOptions, headers: { "Content-Type": "application/json", ...(fetchOptions.headers || {}) } });
  if (response.status === 401) {
    state = null;
    navigatePublic("/login");
    return null;
  }
  const body = await response.json().catch(() => ({ error: "Request failed" }));
  if (!response.ok) {
    if (!quiet) showModal(`<h2 class="text-xl font-black">Room unavailable</h2><p class="${ui.muted}">${escapeHtml(body.error || "Request failed")}</p>`);
    return null;
  }
  return body;
}

async function teacherStudentApi(path, options = {}) {
  const { quiet = false, ...fetchOptions } = options;
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...fetchOptions });
  if (response.status === 401) {
    state = null;
    navigatePublic("/login");
    return null;
  }
  const body = await response.json().catch(() => ({ error: "Request failed" }));
  if (!response.ok) {
    if (!quiet) showModal(`<h2 class="text-xl font-black">Learning action unavailable</h2><p class="${ui.muted}">${escapeHtml(body.error || "Request failed")}</p>`);
    return null;
  }
  return body;
}

async function accountApi(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  if (response.status === 401) {
    state = null;
    navigatePublic("/login");
    return null;
  }
  const body = await response.json().catch(() => ({ error: "Request failed" }));
  if (!response.ok) {
    showModal(`<h2 class="text-xl font-black">Billing action unavailable</h2><p class="${ui.muted}">${escapeHtml(body.error || "Request failed")}</p>`);
    return null;
  }
  return body;
}

async function loadAccountBillingData({ force = false } = {}) {
  if (!force && accountBillingData.account) return;
  const body = await accountApi("/api/account");
  if (!body) return;
  accountBillingData = body;
  if (activeRoute() === "profileSubscriptions") render();
}

function teacherStudentQuery() {
  const params = new URLSearchParams();
  Object.entries(teacherStudentFilters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function teacherSearchFiltersFromForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    q: data.q || "",
    language: data.language || "",
    countryOfBirth: data.countryOfBirth || "",
    speaksLanguage: data.speaksLanguage || "",
    nativeSpeaker: data.nativeSpeaker || "",
    professionalTutor: data.professionalTutor || "",
    speakingPracticeOnly: data.speakingPracticeOnly || "",
    maxRate: data.maxRate || ""
  };
}

async function applyTeacherSearchFilters(form) {
  teacherStudentFilters = teacherSearchFiltersFromForm(form);
  teacherStudentLoadedKeys = new Set();
  await loadTeacherStudentData("findTeacher", { force: true });
}

function localDateKey(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekStartKey(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  local.setDate(local.getDate() - local.getDay());
  return localDateKey(local);
}

function shiftDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey || localDateKey()).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

async function loadTeacherStudentData(route = activeRoute(), { force = false } = {}) {
  const capabilities = subscriptionCapabilities();
  const canUseTeacherWorkspace = Boolean(capabilities.teacherWorkspace);
  const profileId = activeTeacherProfileId();
  const studentId = activeStudentId();
  const bookingQuery = new URLSearchParams({
    lessonType: bookingSelection.lessonType || "one_on_one",
    durationMinutes: bookingSelection.durationMinutes || "",
    studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local"
  }).toString();
  const calendarQuery = new URLSearchParams(teacherCalendarFilters);
  const key = `${route}:${profileId}:${studentId}:${teacherStudentQuery()}:${bookingQuery}:${calendarQuery}`;
  if (!force && teacherStudentLoadedKeys.has(key)) return;
  const requests = [];
  if (route === "findTeacher") requests.push(["teachers", `/api/teacher-student/teachers${teacherStudentQuery()}`]);
  if (route === "teacherProfileDetail" && profileId) requests.push(["profileDetail", `/api/teacher-student/teacher-profiles/${encodeURIComponent(profileId)}`]);
  if (route === "bookLesson" && profileId) requests.push(["bookingPage", `/api/teacher-student/teacher-profiles/${encodeURIComponent(profileId)}/booking-page?${bookingQuery}`]);
  if (["teacherProfileCreate", "teacherProfileEdit", "teacherAvailability", "teacherDashboard", "teacherTemplates"].includes(route)) requests.push(["profiles", "/api/teacher-student/teacher-profiles/my"]);
  if (["dashboard", "myLessons"].includes(route) || (route === "teacherDashboard" && canUseTeacherWorkspace)) requests.push(["lessons", "/api/teacher-student/lessons"]);
  if (route === "teacherBookings") requests.push(["calendar", `/api/teacher-student/calendar?${calendarQuery}`]);
  if (route === "teacherStudents") requests.push(["students", "/api/teacher-student/students"]);
  if (route === "teacherStudentDetail" && studentId) requests.push(["studentDetail", `/api/teacher-student/students/${encodeURIComponent(studentId)}`]);
  if (["dashboard", "myLessons", "myTeachers"].includes(route)) requests.push(["myTeachers", "/api/teacher-student/my-teachers"]);
  if (["learningNotes", "teacherLessonNotes"].includes(route)) requests.push(["notes", "/api/teacher-student/notes"]);
  if (route === "teacherAvailability") requests.push(["availability", "/api/teacher-student/availability"]);
  if (route === "teacherDashboard" && canUseTeacherWorkspace) requests.push(["dashboard", "/api/teacher-student/dashboard"]);
  if (route === "teacherResources") requests.push(["resources", "/api/teacher-student/resources"]);
  if (route === "teacherTemplates") requests.push(["templates", "/api/teacher-student/templates"]);
  if (route === "profileInfo" || route === "profileSubscriptions") requests.push(["subscription", "/api/teacher-student/subscription"]);
  if (!requests.length) return;
  const loaded = await Promise.all(requests.map(async ([name, path]) => [name, await teacherStudentApi(path, { quiet: route === "dashboard" })]));
  loaded.forEach(([name, body]) => {
    if (!body) return;
    if (name === "teachers") teacherStudentData = { ...teacherStudentData, teachers: body.teachers || [], filterOptions: body.filterOptions || {} };
    if (name === "profileDetail") teacherStudentData = { ...teacherStudentData, profile: body.profile, reviews: body.reviews || [] };
    if (name === "bookingPage") {
      teacherStudentData = { ...teacherStudentData, bookingPage: body };
      if (body.profile?.id && bookingSelection.teacherProfileId !== body.profile.id) {
        bookingSelection = {
          teacherProfileId: body.profile.id,
          lessonType: body.calendar?.lessonType || "one_on_one",
          durationMinutes: String(body.calendar?.durationMinutes || body.calendar?.durations?.[0] || ""),
          date: body.calendar?.days?.find((day) => day.availableCount > 0)?.date || body.calendar?.days?.[0]?.date || "",
          startsAt: ""
        };
      }
    }
    if (name === "profiles") teacherStudentData = { ...teacherStudentData, profiles: body.profiles || [], subscription: body.subscription || teacherStudentData.subscription };
    if (name === "lessons") teacherStudentData.lessons = body.lessons || [];
    if (name === "myTeachers") teacherStudentData.myTeachers = body.teachers || [];
    if (name === "students") teacherStudentData.students = body.students || [];
    if (name === "studentDetail") teacherStudentData.studentDetail = body;
    if (name === "notes") teacherStudentData.notes = body.notes || [];
    if (name === "availability") teacherStudentData.availability = body.availability || [];
    if (name === "dashboard") teacherStudentData.dashboard = body;
    if (name === "calendar") teacherStudentData.calendar = body;
    if (name === "resources") teacherStudentData.resources = body.resources || [];
    if (name === "templates") teacherStudentData.templates = body.templates || [];
    if (name === "subscription") teacherStudentData.subscription = body.subscription || {};
  });
  teacherStudentLoadedKeys.add(key);
  if (teacherStudentRoutes.has(activeRoute())) render();
}

async function syncStripeReturnPayment(route = activeRoute()) {
  if (route !== "myLessons") return;
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("booking") || "";
  if (params.get("payment") !== "success" || !bookingId || syncedStripeReturnBookings.has(bookingId)) return;
  syncedStripeReturnBookings.add(bookingId);
  const payload = await teacherStudentApi(`/api/teacher-student/bookings/${encodeURIComponent(bookingId)}/sync-payment`, { method: "POST" });
  if (!payload) return;
  teacherStudentLoadedKeys = new Set();
  params.delete("payment");
  const queryString = params.toString();
  history.replaceState({}, "", `${location.pathname}${queryString ? `?${queryString}` : ""}`);
  await loadTeacherStudentData("myLessons", { force: true });
}

async function syncTeacherPayoutReturn(route = activeRoute()) {
  if (route !== "teacherDashboard") return;
  const params = new URLSearchParams(window.location.search);
  if (!["return", "refresh"].includes(params.get("payout"))) return;
  const payload = await teacherStudentApi("/api/teacher-student/payout-account/sync", { method: "POST" });
  if (!payload) return;
  teacherStudentLoadedKeys = new Set();
  params.delete("payout");
  const queryString = params.toString();
  history.replaceState({}, "", `${location.pathname}${queryString ? `?${queryString}` : ""}`);
  await loadTeacherStudentData("teacherDashboard", { force: true });
}

function voiceVideoRoomQuery() {
  const params = new URLSearchParams();
  Object.entries(voiceVideoRoomFilters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (voiceVideoShowHistory) params.set("history", "true");
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function loadVoiceVideoRooms({ force = false, quiet = false } = {}) {
  if (voiceVideoRoomsLoaded && !force) return;
  const body = await livekitApi(`/api/livekit/rooms${voiceVideoRoomQuery()}`, { quiet });
  if (!body) return;
  voiceVideoRooms = body.rooms || [];
  voiceVideoRoomsLoaded = true;
  if (activeRoute() === "voiceVideoRooms") {
    if (quiet) renderVoiceVideoRoomList();
    else if (!activeVoiceVideoSession) render();
  }
}

function renderVoiceVideoRoomList() {
  const list = document.querySelector("[data-voice-video-room-list]");
  if (!list || !state) return;
  list.innerHTML = voiceVideoRoomCardsView({
    appConfig,
    voiceVideoRooms,
    activeVoiceVideoSession,
    state,
    voiceVideoShowHistory
  });
  bindActions(list);
  updateVoiceVideoListCountdowns();
}

function remainingSecondsFromStartedAt(startedAt, fallback = 360) {
  const started = new Date(startedAt || "").getTime();
  if (!Number.isFinite(started)) return Math.max(0, Number(fallback || 0));
  return Math.max(0, 360 - Math.min(360, Math.max(0, Math.ceil((Date.now() - started) / 1000))));
}

function formatVoiceVideoCountdown(seconds = 360) {
  const remaining = Math.max(0, Number(seconds || 0));
  const minutes = Math.floor(remaining / 60);
  const secondsOnly = remaining % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secondsOnly).padStart(2, "0")}`;
}

function updateVoiceVideoListCountdowns() {
  document.querySelectorAll("[data-room-list-countdown]").forEach((element) => {
    element.textContent = formatVoiceVideoCountdown(remainingSecondsFromStartedAt(element.dataset.roomListCountdown));
  });
}

async function clearActiveVoiceVideoRoom({ quiet = false, message = "" } = {}) {
  if (endingVoiceVideoRoom) return;
  endingVoiceVideoRoom = true;
  try {
    stopVoiceVideoTimer();
    await disconnectLiveKitTracks();
    activeVoiceVideoRoom = null;
    activeVoiceVideoSession = null;
    activeVoiceVideoParticipants = [];
    voiceVideoRoomsLoaded = false;
    if (activeRoute() === "voiceVideoRoom") history.pushState({}, "", appPath("voiceVideoRooms"));
    await loadVoiceVideoRooms({ force: true, quiet: true });
    render();
    if (message && !quiet) {
      showModal(`<h2 class="text-xl font-black">Room closed</h2><p class="${ui.muted}">${escapeHtml(message)}</p>`);
    }
  } finally {
    endingVoiceVideoRoom = false;
  }
}

async function refreshActiveVoiceVideoRoom({ quiet = true } = {}) {
  if (!activeVoiceVideoRoom || !activeVoiceVideoSession || endingVoiceVideoRoom) return;
  const detail = await livekitApi(`/api/livekit/rooms/${activeVoiceVideoRoom.id}`, { quiet: true });
  if (!detail?.room || detail.room.status !== "active") {
    await clearActiveVoiceVideoRoom({ quiet, message: "The host closed this room." });
    return;
  }
  activeVoiceVideoRoom = detail.room;
  activeVoiceVideoParticipants = detail.participants || activeVoiceVideoParticipants;
}

function updateVoiceVideoCountdown() {
  if (!activeVoiceVideoSession) return;
  const remaining = remainingSecondsFromStartedAt(activeVoiceVideoRoom?.startedAt || activeVoiceVideoSession.startedAt, activeVoiceVideoSession.secondsRemaining);
  const elapsed = 360 - remaining;
  activeVoiceVideoSession = { ...activeVoiceVideoSession, elapsedSeconds: elapsed, secondsRemaining: remaining };
  const countdown = document.querySelector("[data-room-countdown]");
  if (countdown) {
    countdown.textContent = formatVoiceVideoCountdown(remaining);
  }
  updateVoiceVideoListCountdowns();
  const hostIsAlone = activeVoiceVideoRoom?.ownerUserId === state?.user?.id && Number(activeVoiceVideoRoom?.participantCount || activeVoiceVideoParticipants.length || 0) <= 1;
  if (hostIsAlone && elapsed >= 120 && elapsed < 180 && !livekitWarningFlags.abandoned) {
    livekitWarningFlags.abandoned = true;
    showModal(`<h2 class="text-xl font-black">Waiting for learners</h2><p class="${ui.muted}">This room will close in 60 seconds if no one joins. Invite someone in or join another active room.</p>`);
  }
  if (hostIsAlone && elapsed >= 180) {
    refreshActiveVoiceVideoRoom({ quiet: false });
    return;
  }
  if (remaining <= 180 && !hostIsAlone && !livekitWarningFlags.three) {
    livekitWarningFlags.three = true;
    showModal(`<h2 class="text-xl font-black">3 minutes remaining</h2><p class="${ui.muted}">Keep the practice focused: one phrase, one correction, one retry.</p>`);
  }
  if (remaining <= 60 && !livekitWarningFlags.one) {
    livekitWarningFlags.one = true;
    showModal(`<h2 class="text-xl font-black">1 minute remaining</h2><p class="${ui.muted}">Wrap up your speaking turn and final correction.</p>`);
  }
  if (remaining <= 10 && !livekitWarningFlags.ten) {
    livekitWarningFlags.ten = true;
    showModal(`<h2 class="text-xl font-black">10 seconds remaining</h2><p class="${ui.muted}">The room will disconnect automatically.</p>`);
  }
  if (remaining <= 0) leaveVoiceVideoRoom({ timedOut: true });
}

function syncVoiceVideoPolling(route = activeRoute()) {
  if (route !== "voiceVideoRooms" && route !== "voiceVideoRoom") {
    if (voiceVideoPollTimer) window.clearInterval(voiceVideoPollTimer);
    if (voiceVideoListCountdownTimer) window.clearInterval(voiceVideoListCountdownTimer);
    voiceVideoPollTimer = null;
    voiceVideoListCountdownTimer = null;
    voiceVideoPollRoute = "";
    return;
  }
  if (voiceVideoPollTimer && voiceVideoPollRoute === route) return;
  if (voiceVideoPollTimer) {
    window.clearInterval(voiceVideoPollTimer);
    voiceVideoPollTimer = null;
  }
  if (voiceVideoListCountdownTimer) {
    window.clearInterval(voiceVideoListCountdownTimer);
    voiceVideoListCountdownTimer = null;
  }
  voiceVideoPollRoute = route;
  voiceVideoPollTimer = window.setInterval(() => {
    if (activeRoute() === "voiceVideoRooms") loadVoiceVideoRooms({ force: true, quiet: true });
    if (activeRoute() === "voiceVideoRoom") refreshActiveVoiceVideoRoom({ quiet: true });
  }, 10000);
  if (route === "voiceVideoRooms") {
    updateVoiceVideoListCountdowns();
    voiceVideoListCountdownTimer = window.setInterval(updateVoiceVideoListCountdowns, 1000);
  }
}

function stopVoiceVideoTimer() {
  if (livekitRoomTimer) window.clearInterval(livekitRoomTimer);
  livekitRoomTimer = null;
}

function startVoiceVideoTimer() {
  stopVoiceVideoTimer();
  livekitWarningFlags = { abandoned: false, three: false, one: false, ten: false };
  updateVoiceVideoCountdown();
  livekitRoomTimer = window.setInterval(updateVoiceVideoCountdown, 1000);
}

function tileClassFor(index, count) {
  const base = "relative min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/[.05] p-3";
  if (count === 1) return `${base} col-span-2 row-span-2`;
  if (count === 2) return `${base} row-span-2`;
  if (count === 3 && index === 0) return `${base} row-span-2`;
  return base;
}

function applyLiveKitTileLayout() {
  const stage = document.querySelector("[data-livekit-stage]");
  if (!stage) return;
  const tiles = [...livekitParticipantTiles.values()].slice(0, 4);
  if (livekitLayoutMode === "classroom") {
    stage.className = "relative h-full min-h-screen overflow-hidden bg-black";
    const remoteTiles = tiles.filter((tile) => tile.dataset.livekitLocal !== "true");
    const mainTile = remoteTiles[0] || tiles[0];
    tiles.forEach((tile) => {
      tile.style.left = "";
      tile.style.top = "";
      if (tile === mainTile) {
        tile.className = "absolute inset-0 overflow-hidden bg-black";
      } else {
        tile.className = `absolute z-20 h-24 w-32 cursor-move touch-none overflow-hidden rounded-lg border border-white/20 bg-black shadow-2xl ring-1 ring-black/40 min-[380px]:h-28 min-[380px]:w-40 sm:h-40 sm:w-56 ${classroomSelfCustomPosition ? "" : classroomSelfPositionClass()}`;
        if (classroomSelfCustomPosition) {
          tile.style.left = `${classroomSelfCustomPosition.left}px`;
          tile.style.top = `${classroomSelfCustomPosition.top}px`;
        }
        bindClassroomSelfDrag(tile);
      }
    });
    return;
  }
  stage.className = "grid h-full min-h-[360px] grid-cols-2 grid-rows-2 gap-3";
  tiles.forEach((tile, index) => {
    tile.className = tileClassFor(index, tiles.length);
  });
}

function bindClassroomSelfDrag(tile) {
  if (tile.dataset.boundClassroomDrag) return;
  tile.dataset.boundClassroomDrag = "true";
  tile.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const stage = document.querySelector("[data-livekit-stage]");
    if (!stage) return;
    event.preventDefault();
    tile.setPointerCapture?.(event.pointerId);
    const tileRect = tile.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const offsetX = event.clientX - tileRect.left;
    const offsetY = event.clientY - tileRect.top;
    const move = (moveEvent) => {
      const margin = stageRect.width < 380 ? 8 : 16;
      const maxLeft = Math.max(margin, stageRect.width - tile.offsetWidth - margin);
      const maxTop = Math.max(margin, stageRect.height - tile.offsetHeight - margin);
      const left = Math.min(maxLeft, Math.max(margin, moveEvent.clientX - stageRect.left - offsetX));
      const top = Math.min(maxTop, Math.max(margin, moveEvent.clientY - stageRect.top - offsetY));
      classroomSelfCustomPosition = { left, top };
      tile.style.left = `${left}px`;
      tile.style.top = `${top}px`;
      tile.className = tile.className.replace(/\s?(left|right|top|bottom)-\d+/g, "");
    };
    const finish = () => {
      localStorage.setItem("linguaStoriesClassroomSelfCustomPosition", JSON.stringify(classroomSelfCustomPosition));
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  });
}

function classroomSelfPositionClass() {
  const positions = {
    "top-left": "left-4 top-20",
    "top-right": "right-4 top-20",
    "bottom-left": "bottom-40 left-4 sm:bottom-28",
    "bottom-right": "bottom-40 right-4 sm:bottom-28"
  };
  return positions[classroomSelfPosition] || positions["bottom-right"];
}

function ensureParticipantTile(identity, participantName = "Participant", isLocal = false) {
  const stage = document.querySelector("[data-livekit-stage]");
  if (!stage) return null;
  if (livekitParticipantTiles.size === 0) stage.innerHTML = "";
  if (!livekitHiddenAudioLayer) {
    livekitHiddenAudioLayer = document.createElement("div");
    livekitHiddenAudioLayer.className = "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0";
    stage.append(livekitHiddenAudioLayer);
  }
  const key = identity || participantName;
  let tile = livekitParticipantTiles.get(key);
  if (!tile) {
    tile = document.createElement("div");
    tile.dataset.livekitTile = key;
    tile.dataset.livekitLocal = isLocal ? "true" : "false";
    tile.innerHTML = `
      <div class="absolute inset-0 grid place-items-center text-center">
        <div>
          ${icon("mic", "mx-auto h-8 w-8 text-white/66")}
          <p class="mt-2 text-sm font-semibold text-white/76">${escapeHtml(participantName)}</p>
        </div>
      </div>
      <div class="absolute bottom-2 left-2 rounded bg-black/45 px-2 py-1 text-xs font-semibold text-white">${escapeHtml(participantName)}</div>
    `;
    livekitParticipantTiles.set(key, tile);
    stage.append(tile);
    applyLiveKitTileLayout();
  }
  if (isLocal) tile.dataset.livekitLocal = "true";
  return tile;
}

function renderTrack(track, participantName = "Participant", identity = "", isLocal = false) {
  if (!track?.attach) return;
  if (isLocal && track.kind === "audio") return;
  const element = track.attach();
  if (track.kind === "audio") {
    ensureParticipantTile(identity, participantName, isLocal);
    const audioKey = identity || participantName;
    livekitHiddenAudioLayer?.querySelectorAll("[data-remote-audio]").forEach((audio) => {
      if (audio.dataset.remoteAudio === audioKey) audio.remove();
    });
    element.autoplay = true;
    element.playsInline = true;
    element.dataset.remoteAudio = audioKey;
    livekitHiddenAudioLayer?.append(element);
    element.play?.().catch(() => {
      // Some browsers require the user's join gesture before remote audio can play.
    });
    return;
  }
  const tile = ensureParticipantTile(identity, participantName, isLocal);
  if (!tile) return;
  tile.innerHTML = `<div class="absolute bottom-2 left-2 z-10 rounded bg-black/45 px-2 py-1 text-xs font-semibold text-white">${escapeHtml(participantName)}</div>`;
  element.className = "absolute inset-0 h-full w-full bg-black object-cover";
  element.autoplay = true;
  element.playsInline = true;
  if (isLocal) element.muted = true;
  tile.append(element);
  applyLiveKitTileLayout();
}

function renderSubscribedRemoteTracks(participant) {
  participant.trackPublications?.forEach((publication) => {
    if (!publication.track || !publication.isSubscribed) return;
    renderTrack(publication.track, participant.name || "Participant", participant.identity, false);
  });
}

function stopLocalTracks(tracks = []) {
  tracks.forEach((track) => {
    try {
      track.stop?.();
      track.detach?.().forEach((element) => element.remove());
    } catch (_error) {
      // Best-effort cleanup for denied or partially-created media tracks.
    }
  });
}

function mediaPermissionName({ audio = false, video = false } = {}) {
  if (audio && video) return "microphone and camera";
  if (video) return "camera";
  return "microphone";
}

async function requestMediaPermission(constraints = { audio: true, video: false }) {
  const mediaName = mediaPermissionName(constraints);
  if (!navigator.mediaDevices?.getUserMedia) {
    showModal(`
      <h2 class="text-xl font-black">Browser permission unavailable</h2>
      <p class="${ui.muted}">Your browser will only ask for ${mediaName} access on localhost or a secure HTTPS site. Open LinguaStories with HTTPS, or use localhost on this device.</p>
    `);
    throw new Error("Media permissions require a secure browser context.");
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach((track) => track.stop());
  } catch (error) {
    const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
    const missing = error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError";
    showModal(`
      <h2 class="text-xl font-black">Allow ${mediaName} access</h2>
      <p class="${ui.muted}">${
        denied
          ? `Your browser blocked ${mediaName} access. Use the browser permission icon near the address bar to allow access for this site, then try again.`
          : missing
            ? `No ${mediaName} device was found. Connect a device or check your browser device settings, then try again.`
            : `LinguaStories could not request ${mediaName} access. Make sure this page is opened with HTTPS or localhost, then try again.`
      }</p>
    `);
    throw error;
  }
}

function setLocalTrackMuted(kind, muted) {
  livekitLocalTracks
    .filter((track) => track.kind === kind)
    .forEach((track) => {
      try {
        if (muted) track.mute?.();
        else track.unmute?.();
        if (track.mediaStreamTrack) track.mediaStreamTrack.enabled = !muted;
      } catch (_error) {
        // Track state can already be closed after a disconnect.
      }
    });
}

function applyLiveKitLocalMediaState() {
  setLocalTrackMuted("audio", livekitLocalAudioMuted);
  setLocalTrackMuted("video", livekitLocalVideoMuted);
}

function toggleVoiceVideoAudio() {
  livekitLocalAudioMuted = !livekitLocalAudioMuted;
  setLocalTrackMuted("audio", livekitLocalAudioMuted);
}

function toggleVoiceVideoCamera() {
  livekitLocalVideoMuted = !livekitLocalVideoMuted;
  setLocalTrackMuted("video", livekitLocalVideoMuted);
}

function syncVoiceVideoControlLabels() {
  const audioButton = document.querySelector('[data-action="toggleVoiceVideoAudio"]');
  const audioLabel = audioButton?.querySelector("span");
  const cameraButton = document.querySelector('[data-action="toggleVoiceVideoCamera"]');
  const cameraLabel = cameraButton?.querySelector("span");
  if (audioLabel) audioLabel.textContent = livekitLocalAudioMuted ? "Unmute myself" : "Mute myself";
  if (cameraLabel) cameraLabel.textContent = livekitLocalVideoMuted ? "Turn on camera" : "Turn off camera";
  if (audioButton) audioButton.className = livekitLocalAudioMuted
    ? `${ui.danger} ring-2 ring-brand-red/25`
    : ui.secondary;
  if (cameraButton) cameraButton.className = livekitLocalVideoMuted
    ? `${ui.danger} ring-2 ring-brand-red/25`
    : ui.secondary;
  audioButton?.setAttribute("aria-pressed", String(livekitLocalAudioMuted));
  cameraButton?.setAttribute("aria-pressed", String(livekitLocalVideoMuted));
}

function syncClassroomControlLabels() {
  const audioButton = document.querySelector('[data-action="toggleClassroomAudio"] span');
  const cameraButton = document.querySelector('[data-action="toggleClassroomCamera"] span');
  if (audioButton) audioButton.textContent = livekitLocalAudioMuted ? "Unmute" : "Mute";
  if (cameraButton) cameraButton.textContent = livekitLocalVideoMuted ? "Turn camera on" : "Turn camera off";
}

async function createVoiceVideoLocalTracks(room) {
  const constraints = { audio: true, video: room?.roomType === "video" };
  await requestMediaPermission(constraints);
  try {
    const { createLocalTracks } = await import("/vendor/livekit/livekit-client.esm.mjs");
    return await createLocalTracks(constraints);
  } catch (error) {
    const mediaName = mediaPermissionName(constraints);
    showModal(`
      <h2 class="text-xl font-black">Allow ${mediaName} access</h2>
      <p class="${ui.muted}">Your browser denied ${mediaName} permission, so LinguaStories did not start a paid room session. Allow access for this site, then try again.</p>
    `);
    throw error;
  }
}

async function createTeacherClassroomLocalTracks() {
  const constraints = { audio: true, video: true };
  await requestMediaPermission(constraints);
  const { createLocalTracks } = await import("/vendor/livekit/livekit-client.esm.mjs");
  return createLocalTracks(constraints);
}

async function connectLiveKitRoom(payload, localTracks = [], options = {}) {
  const { modalOnError = true, layoutMode = "grid" } = options;
  livekitLayoutMode = layoutMode;
  const stage = document.querySelector("[data-livekit-stage]");
  if (stage) stage.innerHTML = `<div class="rounded-lg border border-white/10 bg-white/[.04] p-4 text-sm font-semibold text-white/72">Connecting media...</div>`;
  try {
    const { Room, RoomEvent } = await import("/vendor/livekit/livekit-client.esm.mjs");
    const room = new Room({ adaptiveStream: true, dynacast: true });
    livekitRoomConnection = room;
    livekitParticipantTiles = new Map();
    livekitHiddenAudioLayer = null;
    room.on(RoomEvent.ParticipantConnected, (participant) => ensureParticipantTile(participant.identity, participant.name || "Participant"));
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      livekitParticipantTiles.get(participant.identity)?.remove();
      livekitParticipantTiles.delete(participant.identity);
      livekitHiddenAudioLayer?.querySelectorAll("[data-remote-audio]").forEach((audio) => {
        if (audio.dataset.remoteAudio === participant.identity) audio.remove();
      });
      applyLiveKitTileLayout();
    });
    room.on(RoomEvent.TrackPublished, (publication) => publication.setSubscribed?.(true));
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => renderTrack(track, participant.name || "Participant", participant.identity, false));
    room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach?.().forEach((element) => element.remove()));
    room.on(RoomEvent.Disconnected, () => {
      if (activeVoiceVideoSession && !endingVoiceVideoRoom) leaveVoiceVideoRoom({ silent: true });
    });
    await room.connect(payload.livekitUrl, payload.token);
    if (stage) stage.innerHTML = "";
    ensureParticipantTile(room.localParticipant.identity || "local", "You", true);
    room.remoteParticipants?.forEach((participant) => {
      ensureParticipantTile(participant.identity, participant.name || "Participant");
      renderSubscribedRemoteTracks(participant);
    });
    livekitLocalTracks = localTracks;
    applyLiveKitLocalMediaState();
    syncVoiceVideoControlLabels();
    syncClassroomControlLabels();
    for (const track of localTracks) {
      await room.localParticipant.publishTrack(track);
      renderTrack(track, "You", room.localParticipant.identity || "local", true);
    }
    applyLiveKitLocalMediaState();
    syncVoiceVideoControlLabels();
    syncClassroomControlLabels();
    if (stage && !stage.children.length) {
      stage.innerHTML = `<div class="grid min-h-[252px] place-items-center rounded-lg border border-white/10 bg-white/[.04] text-sm font-semibold text-white/72">Connected. Audio is active.</div>`;
    }
    return true;
  } catch (error) {
    stopLocalTracks(localTracks);
    livekitLocalTracks = [];
    if (modalOnError) {
      showModal(`<h2 class="text-xl font-black">LiveKit connection failed</h2><p class="${ui.muted}">${escapeHtml(error.message || "Could not connect to the room.")}</p>`);
    } else if (stage) {
      stage.innerHTML = `
        <div class="grid min-h-[360px] place-items-center rounded-lg border border-white/10 bg-white/[.04] p-4 text-center text-sm font-semibold text-white/76">
          ${escapeHtml(error.message || "Could not connect to the classroom.")}
        </div>
      `;
    }
    return false;
  }
}

async function joinVoiceVideoRoom(roomId) {
  const room = voiceVideoRooms.find((item) => item.id === roomId) || activeVoiceVideoRoom;
  livekitLocalAudioMuted = false;
  livekitLocalVideoMuted = false;
  let localTracks = [];
  try {
    localTracks = await createVoiceVideoLocalTracks(room);
  } catch (_error) {
    return;
  }
  const payload = await livekitApi(`/api/livekit/rooms/${roomId}/join`, { method: "POST" });
  if (!payload) {
    stopLocalTracks(localTracks);
    return;
  }
  activeVoiceVideoRoom = payload.room;
  activeVoiceVideoSession = payload.session;
  activeVoiceVideoParticipants = payload.participants || [];
  voiceVideoRoomsLoaded = false;
  await loadVoiceVideoRooms({ force: true, quiet: true });
  history.pushState({}, "", appPath("voiceVideoRoom", { roomId }));
  render();
  startVoiceVideoTimer();
  await connectLiveKitRoom(payload, localTracks);
}

async function disconnectLiveKitTracks() {
  const room = livekitRoomConnection;
  livekitRoomConnection = null;
  if (!room) return;
  try {
    room.localParticipant?.trackPublications?.forEach((publication) => {
      publication.track?.stop?.();
      publication.track?.detach?.().forEach((element) => element.remove());
    });
    room.disconnect();
    livekitParticipantTiles = new Map();
    livekitHiddenAudioLayer = null;
    livekitLocalTracks = [];
    livekitLayoutMode = "grid";
  } catch (_error) {
    // Best-effort cleanup after disconnect.
  }
}

async function leaveVoiceVideoRoom({ timedOut = false, silent = false } = {}) {
  if (!activeVoiceVideoRoom || !activeVoiceVideoSession) return;
  if (endingVoiceVideoRoom) return;
  endingVoiceVideoRoom = true;
  try {
    const roomId = activeVoiceVideoRoom.id;
    const sessionId = activeVoiceVideoSession.id;
    const wasTimedOut = timedOut || activeVoiceVideoSession.secondsRemaining <= 0;
    stopVoiceVideoTimer();
    await disconnectLiveKitTracks();
    const payload = await livekitApi(wasTimedOut ? `/api/livekit/sessions/${sessionId}/end` : `/api/livekit/rooms/${roomId}/leave`, {
      method: "POST",
      quiet: silent,
      body: JSON.stringify(wasTimedOut ? { status: "timed_out" } : {})
    });
    activeVoiceVideoRoom = null;
    activeVoiceVideoSession = null;
    activeVoiceVideoParticipants = [];
    voiceVideoRoomsLoaded = false;
    if (activeRoute() === "voiceVideoRoom") history.pushState({}, "", appPath("voiceVideoRooms"));
    await loadVoiceVideoRooms({ force: true });
    render();
  } finally {
    endingVoiceVideoRoom = false;
  }
}

async function deleteVoiceVideoRoom(roomId) {
  const payload = await livekitApi(`/api/livekit/rooms/${roomId}`, { method: "DELETE" });
  if (!payload) return;
  voiceVideoRoomsLoaded = false;
  await loadVoiceVideoRooms({ force: true });
}

async function moderateVoiceVideoParticipant(roomId, value = "") {
  const [participantId, action] = String(value).split("~");
  if (!participantId || !action) return;
  const payload = await livekitApi(`/api/livekit/rooms/${roomId}/participants/${participantId}/moderate`, {
    method: "POST",
    body: JSON.stringify({ action })
  });
  if (!payload) return;
  const detail = await livekitApi(`/api/livekit/rooms/${roomId}`);
  if (detail) {
    activeVoiceVideoRoom = detail.room;
    activeVoiceVideoParticipants = detail.participants || [];
    render();
  }
}

async function joinTeacherClassroom(bookingId) {
  if (activeRoute() !== "teacherClassroom") {
    window.open(appPath("teacherClassroom", { bookingId }), "_blank", "noopener");
    return;
  }
  if (classroomConnecting || classroomConnected) return;
  classroomConnecting = true;
  classroomBookingId = bookingId;
  livekitLocalAudioMuted = false;
  livekitLocalVideoMuted = false;
  if (livekitRoomConnection) await disconnectLiveKitTracks();
  let localTracks = [];
  try {
    localTracks = await createTeacherClassroomLocalTracks();
  } catch (_error) {
    classroomConnecting = false;
    return;
  }
  const payload = await teacherStudentApi(`/api/teacher-student/bookings/${bookingId}/classroom-token`, { method: "POST" });
  if (!payload) {
    stopLocalTracks(localTracks);
    classroomConnecting = false;
    return;
  }
  classroomConnected = await connectLiveKitRoom(payload, localTracks, { modalOnError: false, layoutMode: "classroom" });
  classroomConnecting = false;
}

async function leaveTeacherClassroom(bookingId) {
  try {
    await disconnectLiveKitTracks();
  } catch (_error) {
    // Classroom cleanup should not block the server-side leave call.
  }
  await teacherStudentApi(`/api/teacher-student/bookings/${bookingId}/leave-classroom`, { method: "POST" });
  classroomConnected = false;
  classroomConnecting = false;
  classroomBookingId = "";
  if (activeRoute() === "teacherClassroom") {
    history.replaceState({}, "", appPath("myLessons"));
    render();
    return;
  }
  closeModal();
  teacherStudentLoadedKeys = new Set();
  await loadTeacherStudentData(activeRoute(), { force: true });
}

function syncClassroomRoute() {
  if (activeRoute() !== "teacherClassroom") return;
  const bookingId = activeClassroomBookingId();
  if (!bookingId) return;
  if (bookingId !== classroomBookingId) {
    classroomConnected = false;
    classroomConnecting = false;
    classroomBookingId = bookingId;
  }
  joinTeacherClassroom(bookingId);
}

function moveClassroomSelfView() {
  const order = ["bottom-right", "bottom-left", "top-left", "top-right"];
  const next = order[(order.indexOf(classroomSelfPosition) + 1) % order.length] || order[0];
  classroomSelfPosition = next;
  classroomSelfCustomPosition = null;
  localStorage.setItem("linguaStoriesClassroomSelfPosition", next);
  localStorage.removeItem("linguaStoriesClassroomSelfCustomPosition");
  applyLiveKitTileLayout();
}

function dismissModal(modal = document.querySelector(".fixed.inset-0.z-50")) {
  if (!modal) return;
  modal.remove();
  if (!document.querySelector(".fixed.inset-0.z-50")) {
    document.body.classList.remove("overflow-hidden");
    modalRestoreFocus?.focus?.();
    modalRestoreFocus = null;
  }
}

function showModal(html, options = {}) {
  const { closeButton: includeCloseButton = true, wide = false } = options;
  dismissModal();
  modalRestoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const template = document.querySelector("#modalTemplate").content.cloneNode(true);
  const modalBody = template.querySelector("[data-modal-body]");
  modalBody.innerHTML = html;
  const modal = template.querySelector(".fixed.inset-0.z-50");
  const panel = modal.querySelector("[data-modal-panel]");
  if (wide) {
    panel?.classList.remove("max-w-lg");
    panel?.classList.add("max-w-5xl");
  }
  if (includeCloseButton) {
    const removedCloseRows = [...modalBody.querySelectorAll('[data-action="closeModal"]')]
      .map((button) => {
        const row = button.parentElement;
        button.remove();
        return row;
      })
      .filter(Boolean);
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = ui.secondary;
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => dismissModal(modal));

    const actionRow =
      removedCloseRows.find((row) => row.isConnected) ||
      modalBody.querySelector("form div[class*='border-t']") ||
      modalBody.querySelector("div[class*='border-t']") ||
      [...modalBody.querySelectorAll("form div, div")]
        .reverse()
        .find((row) => row.querySelector("button, a"));
    if (actionRow) {
      actionRow.classList.add("flex", "flex-wrap", "justify-end", "gap-2");
      const firstAction = actionRow.querySelector("button, a");
      if (firstAction) actionRow.insertBefore(closeButton, firstAction);
      else actionRow.append(closeButton);
    } else {
      const fallbackRow = document.createElement("div");
      fallbackRow.className = "mt-6 flex justify-end border-t border-brand-line pt-4";
      fallbackRow.append(closeButton);
      modalBody.append(fallbackRow);
    }
  }
  document.body.append(template);
  document.body.classList.add("overflow-hidden");
  modal.addEventListener("click", (event) => {
    if (event.target === modal && includeCloseButton) dismissModal(modal);
  });
  const handleEscape = (event) => {
    if (event.key !== "Escape" || !includeCloseButton) return;
    dismissModal(modal);
    document.removeEventListener("keydown", handleEscape);
  };
  document.addEventListener("keydown", handleEscape);
  bindActions(modal);
  requestAnimationFrame(() => {
    const activePanel = document.querySelector("[data-modal-panel]");
    activePanel?.focus({ preventScroll: true });
  });
}

function closeModal() {
  dismissModal();
}

function removeLanguageConfirmModal(language) {
  return `
    <div>
      <span class="${ui.tagRed}">Remove Language</span>
      <h2 class="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-ink">${icon("trash", "h-5 w-5 text-brand-redDark")}<span>Remove ${escapeHtml(languageName(appConfig, language))}?</span></h2>
      <p class="mt-2 ${ui.muted}">This will remove the language from your learning list. This cannot be undone.</p>
    </div>
    <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
      <button class="${ui.danger}" data-action="confirmRemoveLanguage:${escapeHtml(language)}">Remove Language</button>
    </div>
  `;
}

function chatAvatar({ avatar, avatarUrl, name }, size = "h-10 w-10") {
  if (avatarUrl) return `<img class="${size} rounded-full object-cover" src="${escapeHtml(avatarUrl)}" alt="">`;
  return `<div class="grid ${size} place-items-center rounded-full bg-brand-sidebar text-sm font-bold text-white">${escapeHtml(avatar || String(name || "?").slice(0, 1))}</div>`;
}

function selectedChatContext() {
  const conversations = state?.directChat?.conversations || [];
  const selected = conversations.find((conversation) => conversation.id === selectedConversationId) || conversations[0] || null;
  if (selected && !selectedConversationId) selectedConversationId = selected.id;
  const pendingLearner = pendingChatRecipientId ? state.learners.find((learner) => learner.id === pendingChatRecipientId) : null;
  return { conversations, selected, pendingLearner };
}

function chatRecipientMeta(conversation, pendingLearner) {
  if (conversation) {
    return {
      id: conversation.otherUserId,
      name: conversation.otherName,
      avatar: conversation.otherAvatar,
      avatarUrl: conversation.otherAvatarUrl
    };
  }
  if (pendingLearner) {
    return {
      id: pendingLearner.id,
      name: pendingLearner.displayName,
      avatar: pendingLearner.avatar,
      avatarUrl: pendingLearner.avatarUrl
    };
  }
  return null;
}

function chatContextLabel(conversation) {
  if (conversation?.conversationType === "teacher_student") return "Teacher/Student";
  if (conversation?.conversationType === "community_follower") return "Community Follower";
  return "Community";
}

function scrollChatToLatest() {
  requestAnimationFrame(() => {
    const scroller = chatDrawer?.querySelector("[data-chat-message-scroll]");
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
    requestAnimationFrame(() => {
      scroller.scrollTop = scroller.scrollHeight;
    });
  });
}

function renderChatDrawer() {
  if (!chatDrawer) return;
  if (!state || !chatOpen) {
    chatDrawer.innerHTML = "";
    return;
  }

  const { conversations, selected, pendingLearner } = selectedChatContext();
  const recipient = chatRecipientMeta(selected, pendingLearner);
  const messages = selected?.messages || [];
  const selectedContextLabel = chatContextLabel(selected);
  const teacherStudentConversation = selected?.conversationType === "teacher_student";
    const drawerWidth = chatContactsHidden ? "w-full sm:w-[min(560px,calc(100vw-24px))]" : "w-full sm:w-[min(760px,calc(100vw-24px))]";
  const gridClass = chatContactsHidden ? "" : "md:grid-cols-[250px_minmax(0,1fr)]";
  const contactsClass = chatMobileScreen === "contacts" ? "block" : "hidden md:block";
  const contactPanelClass = chatContactsHidden ? `${chatMobileScreen === "contacts" ? "block" : "hidden"} md:hidden` : contactsClass;
  const messagesClass = chatMobileScreen === "messages" || pendingLearner ? "grid" : "hidden md:grid";

  chatDrawer.innerHTML = `
    <aside class="fixed inset-x-0 bottom-0 z-40 ${drawerWidth} overflow-hidden rounded-t-lg border border-brand-line bg-brand-panel shadow-[0_24px_70px_rgba(29,41,63,.28)] sm:inset-x-auto sm:right-4">
      <header class="flex min-h-14 items-center justify-between gap-3 border-b border-brand-line bg-brand-sidebar px-4 text-white">
        <div class="flex items-center gap-2">
          ${icon("message", "h-4 w-4")}
          <div>
            <h2 class="text-sm font-bold">Messages</h2>
            <p class="text-xs font-semibold text-white/55">Community and lesson messages stay organized here.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="hidden min-h-11 items-center gap-2 rounded-lg bg-white/10 px-2.5 text-xs font-bold text-white transition hover:bg-white/15 md:inline-flex" data-action="toggleChatContacts" aria-label="${chatContactsHidden ? "Show Contacts" : "Hide Contacts"}">
            ${icon(chatContactsHidden ? "users" : "chevronLeft", "h-3.5 w-3.5")}
            <span>${chatContactsHidden ? "Show Contacts" : "Hide Contacts"}</span>
          </button>
          <button class="grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/15" data-action="closeChatPanel" aria-label="Close messages">x</button>
        </div>
      </header>
      <div class="grid h-[min(620px,calc(100dvh-112px))] bg-brand-panel ${gridClass}">
        <section class="${contactPanelClass} grid min-h-0 grid-rows-[auto_minmax(0,1fr)] border-b border-brand-line bg-brand-mist/35 md:border-b-0 md:border-r">
          <div class="border-b border-brand-line px-3 py-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold uppercase text-brand-graphite">Inbox</span>
              <span class="${ui.tagGold}">${conversations.length}</span>
            </div>
          </div>
          <div class="min-h-0 overflow-auto">
            ${
              conversations.length
                ? conversations
                    .map(
                      (conversation) => `
                        <button class="flex w-full gap-3 border-b border-brand-line/70 px-3 py-3 text-left transition ${
                          selected?.id === conversation.id ? "bg-brand-panel" : "hover:bg-white/55"
                        }" data-action="selectChatConversation:${conversation.id}">
                          ${chatAvatar({ avatar: conversation.otherAvatar, avatarUrl: conversation.otherAvatarUrl, name: conversation.otherName }, "h-10 w-10")}
                          <span class="min-w-0 flex-1">
                            <span class="flex items-center justify-between gap-2">
                              <strong class="truncate text-sm text-brand-ink">${escapeHtml(conversation.otherName)}</strong>
                              ${conversation.unreadCount ? `<span class="rounded-full bg-brand-red px-2 py-0.5 text-[11px] font-bold text-white">${conversation.unreadCount}</span>` : ""}
                            </span>
                            <span class="mt-1 block truncate text-xs font-semibold text-brand-graphite">${conversation.lastMessageMine ? "You: " : ""}${escapeHtml(conversation.lastMessage || "No messages yet")}</span>
                            <span class="mt-2 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-graphite">${escapeHtml(chatContextLabel(conversation))}</span>
                          </span>
                        </button>
                      `
                    )
                    .join("")
                : `<div class="px-4 py-8 text-center"><p class="${ui.muted}">Open a learner profile and start a paid direct chat.</p></div>`
            }
          </div>
        </section>
        <section class="${messagesClass} min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
          ${
            recipient
              ? `
                <div class="flex items-center justify-between gap-3 border-b border-brand-line bg-brand-panel px-4 py-3">
                  <div class="flex items-center gap-3">
                    <button class="grid h-11 w-11 place-items-center rounded-lg border border-brand-line bg-white/70 text-brand-ink md:hidden" data-action="showChatContacts" aria-label="Back to contacts">
                      ${icon("arrowLeft", "h-4 w-4")}
                    </button>
                    ${chatAvatar(recipient, "h-10 w-10")}
                    <div class="min-w-0">
                      <h3 class="text-sm font-bold text-brand-ink">${escapeHtml(recipient.name)}</h3>
                      <p class="text-xs font-semibold text-brand-graphite">${escapeHtml(selectedContextLabel)} message</p>
                    </div>
                  </div>
                </div>
                <div class="overflow-auto bg-white/45 px-4 py-4" data-chat-message-scroll>
                  <div class="grid gap-3">
                    ${
                      messages.length
                        ? messages
                            .map(
                              (message) => `
                                <article class="flex ${message.mine ? "justify-end" : "justify-start"}">
                    <div class="max-w-[min(82%,34rem)] rounded-lg px-4 py-3 shadow-sm ${
                                    message.mine ? "bg-brand-sidebar text-white" : "border border-brand-line bg-brand-panel text-brand-charcoal"
                                  }">
                                    <p class="text-sm leading-6">${escapeHtml(message.body)}</p>
                                    <div class="mt-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold ${message.mine ? "text-white/55" : "text-brand-graphite"}">
                                      <span>${escapeHtml(chatContextLabel({ conversationType: message.messageContext }))}</span>
                                    </div>
                                  </div>
                                </article>
                              `
                            )
                            .join("")
                        : `<div class="rounded-lg border border-dashed border-brand-line bg-brand-panel/65 p-5 text-center"><p class="${ui.muted}">${teacherStudentConversation ? "Start the lesson conversation." : `Start the conversation.`}</p></div>`
                    }
                  </div>
                </div>
                <form class="border-t border-brand-line bg-brand-panel p-3" data-form="directMessage">
                  <input type="hidden" name="recipientId" value="${escapeHtml(recipient.id)}">
                  <div class="grid gap-2">
                    <textarea class="${ui.input} min-h-20 resize-none" name="body" maxlength="1000" required placeholder="Message ${escapeHtml(recipient.name)}..."></textarea>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <span class="text-xs font-semibold text-brand-graphite">Teacher/Student and community context</span>
                      <button class="${ui.primary}">${icon("message")}<span>Send Message</span></button>
                    </div>
                  </div>
                </form>
              `
              : `<div class="grid place-items-center p-8 text-center"><div><div class="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-brand-mist text-brand-redDark">${icon("message")}</div><h3 class="mt-4 text-lg font-bold text-brand-ink">No conversation selected</h3><p class="mt-2 ${ui.muted}">Choose a conversation or open a learner profile to start one.</p></div></div>`
          }
        </section>
      </div>
    </aside>
  `;
  bindActions(chatDrawer);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function waitForImageLoad(image) {
  return new Promise((resolve, reject) => {
    if (image.complete && image.naturalWidth) return resolve();
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", () => reject(new Error("Image could not be loaded")), { once: true });
  });
}

async function cropAvatarImage(file) {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    showModal(`
      <div class="pr-10">
        <span class="${ui.tagGold}">${icon("upload", "h-3.5 w-3.5")}<span>Profile Picture</span></span>
        <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Crop your picture</h2>
        <p class="mt-2 ${ui.muted}">Drag the picture and adjust the zoom so your face fits neatly inside the circle.</p>
      </div>
      <div class="mt-5 grid gap-5">
        <div class="mx-auto grid gap-3">
          <div class="relative h-auto w-[min(18rem,calc(100vw-4rem))] touch-none overflow-hidden rounded-full bg-brand-mist ring-4 ring-white shadow-[0_18px_40px_rgba(29,41,63,.16)]" data-avatar-crop-frame>
            <img class="absolute max-w-none select-none" src="${escapeHtml(dataUrl)}" alt="" data-avatar-crop-image draggable="false">
          </div>
          <p class="text-center text-xs font-semibold text-brand-graphite">Drag to reposition</p>
        </div>
        <label class="${ui.label}">Zoom<input class="${ui.input} accent-brand-red" data-avatar-crop-zoom type="range" min="1" max="3" step="0.01" value="1"></label>
      </div>
      <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
        <button class="${ui.primary}" data-avatar-crop-save type="button">${icon("upload")}<span>Upload Picture</span></button>
      </div>
    `);

    const modal = document.querySelector(".fixed.inset-0.z-50");
    const frame = modal?.querySelector("[data-avatar-crop-frame]");
    const image = modal?.querySelector("[data-avatar-crop-image]");
    const zoomControl = modal?.querySelector("[data-avatar-crop-zoom]");
    const saveButton = modal?.querySelector("[data-avatar-crop-save]");
    const closeButton = modal?.querySelector("button");
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let dragStart = null;

    const settle = () => {
      const frameSize = frame.clientWidth;
      const baseScale = Math.max(frameSize / image.naturalWidth, frameSize / image.naturalHeight);
      const width = image.naturalWidth * baseScale * zoom;
      const height = image.naturalHeight * baseScale * zoom;
      const minOffsetX = (frameSize - width) / 2;
      const maxOffsetX = (width - frameSize) / 2;
      const minOffsetY = (frameSize - height) / 2;
      const maxOffsetY = (height - frameSize) / 2;
      offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, offsetX));
      offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      image.style.left = `${(frameSize - width) / 2 + offsetX}px`;
      image.style.top = `${(frameSize - height) / 2 + offsetY}px`;
    };

    const finish = () => {
      const frameRect = frame.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const scaleX = image.naturalWidth / imageRect.width;
      const scaleY = image.naturalHeight / imageRect.height;
      const sourceX = (frameRect.left - imageRect.left) * scaleX;
      const sourceY = (frameRect.top - imageRect.top) * scaleY;
      const sourceWidth = frameRect.width * scaleX;
      const sourceHeight = frameRect.height * scaleY;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.beginPath();
      context.arc(256, 256, 256, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      context.restore();
      const croppedDataUrl = canvas.toDataURL("image/png");
      closeModal();
      resolve(croppedDataUrl);
    };

    const fail = (error) => {
      closeModal();
      reject(error);
    };

    waitForImageLoad(image)
      .then(() => {
        settle();
        frame.addEventListener("pointerdown", (event) => {
          frame.setPointerCapture(event.pointerId);
          dragStart = { x: event.clientX, y: event.clientY, offsetX, offsetY };
        });
        frame.addEventListener("pointermove", (event) => {
          if (!dragStart) return;
          offsetX = dragStart.offsetX + event.clientX - dragStart.x;
          offsetY = dragStart.offsetY + event.clientY - dragStart.y;
          settle();
        });
        frame.addEventListener("pointerup", () => {
          dragStart = null;
        });
        frame.addEventListener("pointercancel", () => {
          dragStart = null;
        });
        zoomControl.addEventListener("input", () => {
          zoom = Number(zoomControl.value || 1);
          settle();
        });
        saveButton.addEventListener("click", finish);
        closeButton?.addEventListener("click", () => reject(new Error("Crop cancelled")), { once: true });
      })
      .catch(fail);
  });
}

function uploadProgressModal() {
  showModal(`
    <div class="grid place-items-center py-6 text-center">
      <div class="grid h-16 w-16 animate-spin place-items-center rounded-full border-4 border-brand-line border-t-brand-red"></div>
      <h2 class="mt-5 text-2xl font-bold text-brand-ink">Uploading picture</h2>
      <p class="mt-2 ${ui.muted}">Saving your cropped profile picture now.</p>
    </div>
  `, { closeButton: false });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read image file")));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, quality = 0.8) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))), "image/webp", quality);
  });
}

async function blobToDataUrl(blob) {
  return fileToDataUrl(blob);
}

async function resizeImageToWebP(image, maxSize, quality = 0.8) {
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvasToBlob(canvas, quality);
}

async function processPostImage(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("Post picture must be a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Post picture must be 10 MB or smaller.");

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.src = objectUrl;
  await waitForImageLoad(image);

  try {
    let imageBlob = await resizeImageToWebP(image, 1200, 0.8);
    const sizeSteps = [1100, 1000, 900, 800, 720, 640, 560];
    const qualitySteps = [0.76, 0.72, 0.68, 0.64, 0.6];
    for (const quality of qualitySteps) {
      if (imageBlob.size <= 250 * 1024) break;
      imageBlob = await resizeImageToWebP(image, 1200, quality);
    }
    for (const maxSize of sizeSteps) {
      if (imageBlob.size <= 250 * 1024) break;
      imageBlob = await resizeImageToWebP(image, maxSize, 0.68);
    }
    const thumbnailBlob = await resizeImageToWebP(image, 360, 0.72);
    return {
      imageDataUrl: await blobToDataUrl(imageBlob),
      imageThumbnailDataUrl: await blobToDataUrl(thumbnailBlob),
      imageFileName: `${file.name.replace(/\.[^.]+$/, "") || "community-post"}.webp`
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function processVoiceVideoRoomImage(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("Room picture must be a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Room picture must be 10 MB or smaller.");

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.src = objectUrl;
  await waitForImageLoad(image);

  try {
    let imageBlob = await resizeImageToWebP(image, 1200, 0.78);
    const sizeSteps = [1100, 1000, 900, 800, 720, 640, 560, 480];
    const qualitySteps = [0.72, 0.68, 0.64, 0.6, 0.56];
    for (const quality of qualitySteps) {
      if (imageBlob.size <= 520 * 1024) break;
      imageBlob = await resizeImageToWebP(image, 1200, quality);
    }
    for (const maxSize of sizeSteps) {
      if (imageBlob.size <= 520 * 1024) break;
      imageBlob = await resizeImageToWebP(image, maxSize, 0.62);
    }
    if (imageBlob.size > 520 * 1024) throw new Error("Room picture could not be compressed enough. Try a smaller image.");
    return {
      imageDataUrl: await blobToDataUrl(imageBlob),
      imageFileName: `${file.name.replace(/\.[^.]+$/, "") || "voice-video-room"}.webp`
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function teacherLanguageRowHtml(role) {
  return `
    <div class="grid gap-2 rounded-lg border border-brand-line/70 bg-white/65 p-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end" data-teacher-language-row="${escapeHtml(role)}">
      <label class="${ui.label}">Language<select class="${ui.input}" name="${escapeHtml(role)}Language">${languageSelectOptions(appConfig, "")}</select></label>
      <label class="${ui.label}">Skill level<select class="${ui.input}" name="${escapeHtml(role)}Level">${languageSkillLevelOptions(role === "speaks" ? "Native" : "A1")}</select></label>
      <button class="${ui.secondary} min-h-11" type="button" data-action="removeTeacherLanguageRow">${icon("trash", "h-4 w-4")}<span>Remove</span></button>
    </div>
  `;
}

function teacherTagValues(form) {
  return [...form.querySelectorAll("[data-teacher-tag]")]
    .map((item) => item.dataset.teacherTag || "")
    .filter(Boolean);
}

function syncTeacherTags(form) {
  const hidden = form.querySelector("[data-teacher-tags-value]");
  if (hidden) hidden.value = teacherTagValues(form).join(", ");
}

function renderTeacherTags(form, tags) {
  const container = form.querySelector("[data-teacher-tags]");
  if (!container) return;
  container.innerHTML = tags.map((tag) => `
    <span class="inline-flex items-center gap-1 rounded-full bg-brand-mist px-3 py-1 text-xs font-bold text-brand-charcoal" data-teacher-tag="${escapeHtml(tag)}">
      <span>${escapeHtml(tag)}</span>
      <button class="text-brand-redDark" type="button" data-action="removeTeacherTag" data-tag="${escapeHtml(tag)}" aria-label="Remove ${escapeHtml(tag)}">x</button>
    </span>
  `).join("");
  syncTeacherTags(form);
  bindActions(container);
}

function addTeacherTag(form, rawTag) {
  const tag = String(rawTag || "").trim().replace(/\s+/g, " ").slice(0, 50);
  if (!tag) return;
  const existing = teacherTagValues(form);
  if (existing.some((item) => item.toLowerCase() === tag.toLowerCase())) return;
  renderTeacherTags(form, [...existing, tag].slice(0, 16));
}

function teacherLanguageRows(form, role) {
  return [...form.querySelectorAll(`[data-teacher-language-row="${role}"]`)];
}

function syncTeacherLanguageOptions(form, role) {
  const rows = teacherLanguageRows(form, role);
  const used = new Set();
  rows.forEach((row) => {
    const select = row.querySelector(`[name="${role}Language"]`);
    if (!select) return;
    const current = select.value || "";
    const currentKey = current.toLowerCase();
    if (current && used.has(currentKey)) {
      const available = [...select.options].find((option) => option.value && !used.has(option.value.toLowerCase()));
      if (available) select.value = available.value;
    }
    if (select.value) used.add(select.value.toLowerCase());
  });
  const selected = rows.map((row) => row.querySelector(`[name="${role}Language"]`)?.value || "").filter(Boolean);
  rows.forEach((row) => {
    const select = row.querySelector(`[name="${role}Language"]`);
    if (!select) return;
    [...select.options].forEach((option) => {
      option.disabled = Boolean(option.value) && option.value !== select.value && selected.some((value) => value.toLowerCase() === option.value.toLowerCase());
    });
  });
}

function syncTeacherLanguageOptionGroups(form) {
  ["teaches", "speaks"].forEach((role) => syncTeacherLanguageOptions(form, role));
}

function duplicateTeacherLanguages(form, role) {
  const seen = new Set();
  const duplicates = new Set();
  teacherLanguageRows(form, role).forEach((row) => {
    const select = row.querySelector(`[name="${role}Language"]`);
    const language = select?.value || "";
    if (!language) return;
    const key = language.toLowerCase();
    if (seen.has(key)) duplicates.add(select?.selectedOptions?.[0]?.textContent?.trim() || language);
    seen.add(key);
  });
  return [...duplicates];
}

function teacherLanguagePayload(form, role) {
  const rows = teacherLanguageRows(form, role);
  const pairs = rows
    .map((row) => ({
      language: row.querySelector(`[name="${role}Language"]`)?.value || "",
      level: row.querySelector(`[name="${role}Level"]`)?.value || ""
    }))
    .filter((item) => item.language);
  return {
    languages: pairs.map((item) => item.language).join(", "),
    levels: JSON.stringify(Object.fromEntries(pairs.map((item) => [item.language, item.level || (role === "speaks" ? "Native" : "A1")]))),
    count: pairs.length
  };
}

function bindActions(root = document) {
  bindLoadingImages(root);
  if (root === document && !document.documentElement.dataset.boundAppNavigationDelegates) {
    document.documentElement.dataset.boundAppNavigationDelegates = "true";
    document.addEventListener(
      "click",
      async (event) => {
        if (event.target.closest("[data-action]")) return;
        const appLink = event.target.closest("a[data-app-link]");
        if (appLink) {
          event.preventDefault();
          event.stopPropagation();
          mobileMenuOpen = false;
          const href = appLink.getAttribute("href");
          history.pushState({}, "", href);
          render();
          return;
        }

        const row = event.target.closest("[data-row-link]");
        if (!row || event.target.closest("a, button, input, textarea, select, label")) return;
        event.preventDefault();
        event.stopPropagation();
        history.pushState({}, "", row.dataset.rowLink);
        render();
      },
      true
    );
  }

  root.querySelectorAll("a[data-link]").forEach((link) => {
    if (link.dataset.boundPublicLink) return;
    link.dataset.boundPublicLink = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      link.closest("[data-public-menu]")?.removeAttribute("open");
      navigatePublic(link.getAttribute("href"));
    });
  });

  root.querySelectorAll("[data-public-menu]").forEach((menu) => {
    if (menu.dataset.boundPublicMenu) return;
    menu.dataset.boundPublicMenu = "true";
    menu.querySelectorAll("[data-public-menu-link]").forEach((link) => {
      link.addEventListener("click", () => menu.removeAttribute("open"));
    });
    menu.querySelector("[data-public-menu-backdrop]")?.addEventListener("click", () => menu.removeAttribute("open"));
    menu.addEventListener("toggle", () => {
      document.body.classList.toggle("overflow-hidden", menu.open);
      menu.querySelector("summary")?.setAttribute("aria-expanded", menu.open ? "true" : "false");
    });
    menu.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      menu.removeAttribute("open");
      menu.querySelector("summary")?.focus();
    });
  });

  root.querySelectorAll("a[data-app-link]").forEach((link) => {
    if (link.dataset.boundAppLink) return;
    link.dataset.boundAppLink = "true";
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      mobileMenuOpen = false;
      const href = link.getAttribute("href");
      history.pushState({}, "", href);
      render();
    });
  });

  root.querySelectorAll("[data-row-link]").forEach((row) => {
    if (row.dataset.boundRowLink) return;
    row.dataset.boundRowLink = "true";
    row.addEventListener("click", async (event) => {
      if (event.target.closest("a, button, input, textarea, select, label")) return;
      history.pushState({}, "", row.dataset.rowLink);
      render();
    });
  });

  root.querySelectorAll("[data-carousel]").forEach((carousel) => {
    if (carousel.dataset.boundDrag) return;
    carousel.dataset.boundDrag = "true";
    let dragging = false;
    let startX = 0;
    let scrollLeft = 0;
    carousel.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target.closest("a, button, input, textarea, select, label, [data-action]")) return;
      dragging = true;
      startX = event.clientX;
      scrollLeft = carousel.scrollLeft;
      carousel.setPointerCapture?.(event.pointerId);
      carousel.classList.add("cursor-grabbing");
    });
    carousel.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      carousel.scrollLeft = scrollLeft - (event.clientX - startX);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
      carousel.addEventListener(type, (event) => {
        if (!dragging) return;
        dragging = false;
        carousel.releasePointerCapture?.(event.pointerId);
        carousel.classList.remove("cursor-grabbing");
      });
    });
  });

  root.querySelectorAll("[data-teacher-language-row]").forEach((row) => {
    if (row.dataset.boundTeacherLanguageRow) return;
    row.dataset.boundTeacherLanguageRow = "true";
    const form = row.closest("form");
    const role = row.dataset.teacherLanguageRow;
    row.querySelector(`[name="${role}Language"]`)?.addEventListener("change", () => syncTeacherLanguageOptions(form, role));
    if (form && role) syncTeacherLanguageOptions(form, role);
  });

  root.querySelectorAll("[data-teacher-tag-input]").forEach((input) => {
    if (input.dataset.boundTeacherTagInput) return;
    input.dataset.boundTeacherTagInput = "true";
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== ",") return;
      event.preventDefault();
      const form = input.closest("form");
      addTeacherTag(form, input.value);
      input.value = "";
    });
    input.addEventListener("blur", () => {
      const form = input.closest("form");
      addTeacherTag(form, input.value);
      input.value = "";
    });
  });
  root.querySelectorAll("[data-action]").forEach((element) => {
    if (element.dataset.boundAction) return;
    element.dataset.boundAction = "true";
    if (element.getAttribute("role") === "button" && !["BUTTON", "A"].includes(element.tagName)) {
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          element.click();
        }
      });
    }
    element.addEventListener("click", async (event) => {
      const nestedControl = event.target.closest("a, button, input, textarea, select, label");
      if (nestedControl && nestedControl !== element) return;
      event.preventDefault();
      event.stopPropagation();
      const restorePending = setButtonPending(element);
      try {
        const [action, id, value] = element.dataset.action.split(":");
        if (action === "closeModal") closeModal();
        if (action === "closePublicMenu") {
          element.closest("[data-public-menu]")?.removeAttribute("open");
        }
        if (action === "like") await api(`/api/posts/${id}/like`, { method: "POST" });
        if (action === "followLearner") await api(`/api/learners/${id}/follow`, { method: "POST" });
      if (action === "openMobileMenu") {
        mobileMenuOpen = true;
        syncMobileMenu();
      }
      if (action === "closeMobileMenu") {
        mobileMenuOpen = false;
        syncMobileMenu();
      }
      if (action === "openChatPanel") {
        chatOpen = true;
        pendingChatRecipientId = "";
        chatMobileScreen = "contacts";
        renderChatDrawer();
      }
      if (action === "closeChatPanel") {
        chatOpen = false;
        pendingChatRecipientId = "";
        chatContactsHidden = false;
        chatMobileScreen = "contacts";
        renderChatDrawer();
      }
      if (action === "toggleChatContacts") {
        chatContactsHidden = !chatContactsHidden;
        renderChatDrawer();
      }
      if (action === "showChatContacts") {
        chatMobileScreen = "contacts";
        renderChatDrawer();
      }
      if (action === "openChatWith") {
        const existing = state.directChat?.conversations?.find((conversation) => conversation.otherUserId === id);
        selectedConversationId = existing?.id || "";
        pendingChatRecipientId = existing ? "" : id;
        chatOpen = true;
        chatMobileScreen = "messages";
        renderChatDrawer();
      }
      if (action === "selectChatConversation") {
        selectedConversationId = id;
        pendingChatRecipientId = "";
        chatOpen = true;
        chatMobileScreen = "messages";
        await api(`/api/messages/${id}/read`, { method: "POST" });
        renderChatDrawer();
        scrollChatToLatest();
      }
      if (action === "openCreateVoiceVideoRoomModal") showModal(createVoiceVideoRoomModal(context()));
      if (action === "openVoiceVideoRulesModal") showModal(voiceVideoRulesModal());
      if (action === "joinVoiceVideoRoom") await joinVoiceVideoRoom(id);
      if (action === "leaveVoiceVideoRoom") await leaveVoiceVideoRoom();
      if (action === "deleteVoiceVideoRoom") await deleteVoiceVideoRoom(id);
      if (action === "toggleVoiceVideoHistory") {
        voiceVideoShowHistory = !voiceVideoShowHistory;
        voiceVideoRoomsLoaded = false;
        await loadVoiceVideoRooms({ force: true });
      }
      if (action === "toggleVoiceVideoAudio") {
        toggleVoiceVideoAudio();
        syncVoiceVideoControlLabels();
      }
      if (action === "toggleVoiceVideoCamera") {
        toggleVoiceVideoCamera();
        syncVoiceVideoControlLabels();
      }
      if (action === "toggleClassroomAudio") {
        toggleVoiceVideoAudio();
        syncClassroomControlLabels();
      }
      if (action === "toggleClassroomCamera") {
        toggleVoiceVideoCamera();
        syncClassroomControlLabels();
      }
      if (action === "moveClassroomSelfView") {
        moveClassroomSelfView();
      }
      if (action === "moderateVoiceVideoParticipant") await moderateVoiceVideoParticipant(id, value);
      if (action === "openTeacherProfileModal") {
        history.pushState({}, "", appPath("teacherProfileCreate"));
        render();
      }
      if (action === "addTeacherLanguageRow") {
        const form = element.closest("form");
        const list = form?.querySelector(`[data-teacher-language-list="${id}"]`);
        if (list) {
          list.insertAdjacentHTML("beforeend", teacherLanguageRowHtml(id));
          bindActions(list);
          syncTeacherLanguageOptions(form, id);
        }
      }
      if (action === "removeTeacherLanguageRow") {
        const row = element.closest("[data-teacher-language-row]");
        const list = row?.parentElement;
        const form = row?.closest("form");
        const role = row?.dataset.teacherLanguageRow;
        if (row && list && list.querySelectorAll("[data-teacher-language-row]").length > 1) {
          row.remove();
          if (form && role) syncTeacherLanguageOptions(form, role);
        }
      }
      if (action === "removeTeacherTag") {
        const form = element.closest("form");
        element.closest("[data-teacher-tag]")?.remove();
        if (form) syncTeacherTags(form);
      }
      if (action === "deleteTeacherProfile") {
        await teacherStudentApi(`/api/teacher-student/teacher-profiles/${id}`, { method: "DELETE" });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
        render();
      }
      if (action === "enableTeacherProfile") {
        await teacherStudentApi(`/api/teacher-student/teacher-profiles/${id}/enable`, { method: "POST" });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
        render();
      }
      if (action === "toggleTeacherCompletedPaid") {
        teacherWorkspaceShowCompletedPaid = !teacherWorkspaceShowCompletedPaid;
        render();
      }
      if (action === "startTeacherPayoutOnboarding") {
        const response = await fetch("/api/teacher-student/payout-account/onboarding-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (response.status === 401) {
          state = null;
          navigatePublic("/login");
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          showModal(`<h2 class="text-xl font-black">Payout setup unavailable</h2><p class="${ui.muted}">Payout setup could not be started. Please try again or contact support.</p>`);
          return;
        }
        if (payload?.onboardingUrl) {
          window.location.href = payload.onboardingUrl;
          return;
        }
        showModal(`<h2 class="text-xl font-black">Payout setup unavailable</h2><p class="${ui.muted}">Payout setup could not be started. Please try again or contact support.</p>`);
      }
      if (action === "syncTeacherPayoutAccount") {
        const payload = await teacherStudentApi("/api/teacher-student/payout-account/sync", { method: "POST" });
        if (!payload) return;
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherDashboard", { force: true });
        render();
      }
      if (action === "openTeacherBookingRulesModal") showModal(teacherBookingRulesModal(context()));
      if (action === "setMyLearningTab") {
        myLearningTab = ["lessons", "teachers", "calendar"].includes(id) ? id : "lessons";
        const route = activeRoute() === "dashboard" ? "dashboard" : "myLessons";
        if (!["dashboard", "myLessons"].includes(activeRoute())) history.pushState({}, "", appPath("myLessons"));
        await loadTeacherStudentData(route, { force: true });
        render();
      }
      if (action === "shiftMyLearningWeek") {
        const currentStart = myLearningWeekStart || weekStartKey();
        if (id === "today") myLearningWeekStart = weekStartKey();
        else myLearningWeekStart = shiftDateKey(currentStart, id === "next" ? 7 : -7);
        myLearningTab = "calendar";
        const route = activeRoute() === "dashboard" ? "dashboard" : "myLessons";
        if (!["dashboard", "myLessons"].includes(activeRoute())) history.pushState({}, "", appPath("myLessons"));
        await loadTeacherStudentData(route, { force: true });
        render();
      }
      if (action === "selectBookingSlot") {
        bookingSelection = { ...bookingSelection, startsAt: element.dataset.value || id };
        render();
      }
      if (action === "checkoutLesson") {
        const profile = teacherStudentData.bookingPage?.profile;
        if (!profile || !bookingSelection.startsAt) return;
        const payload = await teacherStudentApi("/api/teacher-student/bookings", {
          method: "POST",
          body: JSON.stringify({
            teacherProfileId: profile.id,
            lessonType: bookingSelection.lessonType || "one_on_one",
            durationMinutes: Number(bookingSelection.durationMinutes || teacherStudentData.bookingPage?.calendar?.durationMinutes || profile.minLessonMinutes),
            startsAt: bookingSelection.startsAt,
            maxStudents: bookingSelection.lessonType === "group" ? profile.groupMaxStudents : 1,
            title: `${profile.displayName} lesson`
          })
        });
        if (payload?.checkoutUrl) {
          window.location.href = payload.checkoutUrl;
          return;
        }
        teacherStudentLoadedKeys = new Set();
        showModal(`<h2 class="text-xl font-black">Booking requested</h2><p class="${ui.muted}">The lesson is ready for the teacher to confirm.</p>`);
      }
      if (action === "confirmLesson") {
        const payload = await teacherStudentApi(`/api/teacher-student/bookings/${id}/confirm`, { method: "POST" });
        if (!payload) return;
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
        showModal(`<h2 class="text-xl font-black">Booking confirmed</h2><p class="${ui.muted}">The classroom will be available at the scheduled time.</p>`);
      }
      if (action === "syncLessonPayment") {
        const payload = await teacherStudentApi(`/api/teacher-student/bookings/${id}/sync-payment`, { method: "POST" });
        if (!payload) return;
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
        if (payload.paymentStatus === "paid") {
          showModal(`<h2 class="text-xl font-black">Payment synced</h2><p class="${ui.muted}">Stripe confirmed this lesson payment, so the lesson is now confirmed.</p>`);
        } else {
          showModal(`<h2 class="text-xl font-black">Payment still pending</h2><p class="${ui.muted}">Stripe has not marked this Checkout Session as paid yet.</p>`);
        }
      }
      if (action === "messageTeacher") {
        pendingChatRecipientId = id;
        chatOpen = true;
        chatMobileScreen = "messages";
        showModal(`
          <h2 class="text-xl font-black">Message teacher</h2>
          <form class="mt-5 grid gap-3" data-form="teacherMessage">
            <input type="hidden" name="recipientId" value="${escapeHtml(id)}">
            <input type="hidden" name="teacherProfileId" value="${escapeHtml(value || "")}">
            <textarea class="${ui.input} min-h-24" name="body" required maxlength="1000" placeholder="Ask about lesson fit, availability, or practice needs."></textarea>
            <div class="flex justify-end border-t border-brand-line pt-4"><button class="${ui.primary}">${icon("message", "h-4 w-4")}<span>Send Message</span></button></div>
          </form>
        `);
      }
      if (action === "joinClassroom") await joinTeacherClassroom(id);
      if (action === "leaveTeacherClassroom") await leaveTeacherClassroom(id);
      if (action === "cancelLesson") {
        const reason = window.prompt("Cancellation reason") || "";
        await teacherStudentApi(`/api/teacher-student/bookings/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (action === "deleteUnavailableBlock") {
        await teacherStudentApi(`/api/teacher-student/calendar/blocks/${id}`, { method: "DELETE" });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherBookings", { force: true });
      }
      if (action === "respondReschedule") {
        await teacherStudentApi(`/api/teacher-student/reschedule-requests/${id}/respond`, { method: "POST", body: JSON.stringify({ action: value }) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (action === "openAddLanguageModal") showModal(addLanguageModal(context()));
      if (action === "openEditLanguageModal") showModal(editLanguageModal(context(), id));
      if (action === "openDeleteProfileModal") showModal(deleteProfileConfirmModal(context()));
      if (action === "goToLearnerProfile") {
        closeModal();
        history.pushState({}, "", appPath("communityLearner", { learnerId: id }));
        render();
      }
      if (action === "openCreatePostModal") showModal(createPostModal(context()));
      if (action === "expandPostImage") showModal(postImageModal(context(), id));
      if (action === "removeLanguage") {
        showModal(removeLanguageConfirmModal(id));
      }
      if (action === "confirmRemoveLanguage") {
        await api("/api/languages/remove", { method: "POST", body: JSON.stringify({ language: id }) });
        closeModal();
      }
      if (action === "confirmDeleteProfile") {
        const response = await fetch("/api/auth/profile", { method: "DELETE" });
        if (!response.ok) {
          const body = await response.json().catch(() => ({ error: "Could not delete profile" }));
          showModal(`<h2 class="text-xl font-black">Delete failed</h2><p class="${ui.muted}">${escapeHtml(body.error)}</p>`);
          return;
        }
        state = null;
        closeModal();
        navigatePublic("/");
      }
      if (action === "logout") {
        await fetch("/api/auth/logout", { method: "POST" });
        state = null;
        navigatePublic("/");
      }
      if (action === "cancelAccountTrial") {
        await api("/api/account/trial/cancel", { method: "POST" });
        accountBillingData = {};
        await loadAccountBillingData({ force: true });
      }
      if (action === "reactivateAccount") {
        await api("/api/account/reactivate", { method: "POST", body: JSON.stringify({ tierKey: id }) });
        accountBillingData = {};
        await loadAccountBillingData({ force: true });
      }
      } finally {
        restorePending();
      }
    });
  });

  root.querySelectorAll("form[data-form]").forEach((form) => {
    if (form.dataset.boundAction) return;
    form.dataset.boundAction = "true";
    if (form.dataset.form === "bookingScheduler") {
      form.addEventListener("change", async (event) => {
        const data = Object.fromEntries(new FormData(form).entries());
        bookingSelection = {
          ...bookingSelection,
          teacherProfileId: activeTeacherProfileId(),
          lessonType: data.lessonType || "one_on_one",
          durationMinutes: data.durationMinutes || "",
          date: data.date || "",
          startsAt: ""
        };
        if (event.target?.name === "date") {
          render();
          return;
        }
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("bookLesson", { force: true });
      });
    }
    if (form.dataset.form === "teacherSearch") {
      form.addEventListener("change", async () => {
        clearTimeout(teacherSearchDebounceTimer);
        await applyTeacherSearchFilters(form);
      });
      form.addEventListener("input", () => {
        clearTimeout(teacherSearchDebounceTimer);
        teacherSearchDebounceTimer = setTimeout(() => {
          applyTeacherSearchFilters(form);
        }, 350);
      });
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const restorePending = setButtonPending(pendingButtonForForm(form, event.submitter), "Saving");
      try {
      const data = Object.fromEntries(new FormData(form).entries());
      if (form.dataset.form === "login") {
        await authRequest("/api/auth/login", data);
        return;
      }
      if (form.dataset.form === "register") {
        await authRequest("/api/auth/register", data);
        return;
      }
      if (form.dataset.form === "profileInfo") await api("/api/auth/profile", { method: "POST", body: JSON.stringify(data) });
      if (form.dataset.form === "avatarUpload") {
        const file = form.elements.avatarImage.files[0];
        if (!file) return;
        let croppedDataUrl = "";
        try {
          croppedDataUrl = await cropAvatarImage(file);
        } catch (_error) {
          return;
        }
        uploadProgressModal();
        const response = await fetch("/api/auth/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `${file.name.replace(/\.[^.]+$/, "") || "avatar"}.png`,
            dataUrl: croppedDataUrl
          })
        });
        if (response.status === 401) {
          state = null;
          closeModal();
          navigatePublic("/login");
          return;
        }
        if (!response.ok) {
          const body = await response.json().catch(() => ({ error: "Upload failed" }));
          closeModal();
          showModal(`<h2 class="text-xl font-black">Upload failed</h2><p class="${ui.muted}">${escapeHtml(body.error)}</p>`);
          return;
        }
        state = await response.json();
        closeModal();
        render();
      }
      if (form.dataset.form === "addLanguage") {
        await api("/api/languages", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "editLanguage") {
        await api("/api/languages/update", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "post") {
        const imageFile = form.elements.postImage?.files?.[0];
        delete data.postImage;
        if (imageFile) {
          try {
            Object.assign(data, await processPostImage(imageFile));
          } catch (error) {
            showModal(`<h2 class="text-xl font-black">Picture unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
            return;
          }
        }
        await api("/api/posts", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "voiceVideoRoom") {
        const imageFile = form.elements.roomImage?.files?.[0];
        delete data.roomImage;
        if (imageFile) {
          try {
            Object.assign(data, await processVoiceVideoRoomImage(imageFile));
          } catch (error) {
            showModal(`<h2 class="text-xl font-black">Room picture unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
            return;
          }
        }
        const payload = await livekitApi("/api/livekit/rooms", { method: "POST", body: JSON.stringify(data) });
        if (!payload) return;
        closeModal();
        voiceVideoRoomsLoaded = false;
        await loadVoiceVideoRooms({ force: true });
        render();
      }
      if (form.dataset.form === "voiceVideoRoomFilters") {
        voiceVideoRoomFilters = {
          q: data.q || "",
          cefrLevel: data.cefrLevel || "",
          roomType: data.roomType || ""
        };
        voiceVideoRoomsLoaded = false;
        await loadVoiceVideoRooms({ force: true });
      }
      if (form.dataset.form === "teacherSearch") {
        clearTimeout(teacherSearchDebounceTimer);
        await applyTeacherSearchFilters(form);
      }
      if (form.dataset.form === "teacherProfile" || form.dataset.form === "teacherProfileEdit") {
        const creatingTeacherProfile = form.dataset.form === "teacherProfile";
        syncTeacherLanguageOptionGroups(form);
        const duplicateTeaches = duplicateTeacherLanguages(form, "teaches");
        const duplicateSpeaks = duplicateTeacherLanguages(form, "speaks");
        if (duplicateTeaches.length || duplicateSpeaks.length) {
          const messages = [
            duplicateTeaches.length ? `Teaches: ${duplicateTeaches.join(", ")}` : "",
            duplicateSpeaks.length ? `Speaks: ${duplicateSpeaks.join(", ")}` : ""
          ].filter(Boolean);
          showModal(`<h2 class="text-xl font-black">Duplicate language</h2><p class="${ui.muted}">Each language can only be selected once in the same card.</p><p class="mt-3 text-sm font-semibold text-brand-charcoal">${escapeHtml(messages.join(" · "))}</p>`);
          return;
        }
        const teachesPayload = teacherLanguagePayload(form, "teaches");
        const speaksPayload = teacherLanguagePayload(form, "speaks");
        if (!teachesPayload.count) {
          showModal(`<h2 class="text-xl font-black">Language required</h2><p class="${ui.muted}">Add at least one language this teacher can teach.</p>`);
          return;
        }
        data.teachesLanguages = teachesPayload.languages;
        data.teachesLanguageLevels = teachesPayload.levels;
        data.speaksLanguages = speaksPayload.languages;
        data.speaksLanguageLevels = speaksPayload.levels;
        syncTeacherTags(form);
        data.tags = form.querySelector("[data-teacher-tags-value]")?.value || "";
        delete data.teachesLanguage;
        delete data.teachesLevel;
        delete data.speaksLanguage;
        delete data.speaksLevel;
        const profileId = data.id;
        delete data.id;
        const path = form.dataset.form === "teacherProfileEdit" ? `/api/teacher-student/teacher-profiles/${profileId}` : "/api/teacher-student/teacher-profiles";
        await teacherStudentApi(path, { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        if (activeRoute() === "teacherProfileCreate" || activeRoute() === "teacherProfileEdit") {
          history.pushState({}, "", appPath("teacherDashboard"));
          await loadTeacherStudentData("teacherDashboard", { force: true });
          if (creatingTeacherProfile) {
            showModal(`
              <div>
                <span class="${ui.tagGold}">Profile created</span>
                <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Awaiting approval</h2>
                <p class="mt-2 ${ui.muted}">Your teacher profile has been created and is awaiting approval. Approval typically takes 1 - 2 days.</p>
                <div class="mt-5 flex justify-end">
                  <button class="${ui.primary}" data-action="closeModal">${icon("check", "h-4 w-4")}<span>Done</span></button>
                </div>
              </div>
            `);
          }
          return;
        }
        closeModal();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (form.dataset.form === "teacherAvailability") {
        await teacherStudentApi("/api/teacher-student/availability", { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherAvailability", { force: true });
      }
      if (form.dataset.form === "bookingScheduler") {
        bookingSelection = {
          ...bookingSelection,
          teacherProfileId: activeTeacherProfileId(),
          lessonType: data.lessonType || "one_on_one",
          durationMinutes: data.durationMinutes || "",
          date: data.date || "",
          startsAt: ""
        };
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("bookLesson", { force: true });
      }
      if (form.dataset.form === "teacherBooking") {
        const payload = await teacherStudentApi("/api/teacher-student/bookings", { method: "POST", body: JSON.stringify(data) });
        closeModal();
        if (payload?.checkoutUrl) {
          window.location.href = payload.checkoutUrl;
          return;
        }
        showModal(`<h2 class="text-xl font-black">Booking created</h2><p class="${ui.muted}">Stripe checkout is not configured yet, so the lesson remains pending payment.</p>`);
        teacherStudentLoadedKeys = new Set();
      }
      if (form.dataset.form === "teacherCalendarFilters") {
        teacherCalendarFilters = { view: data.view || "month", teacherProfileId: data.teacherProfileId || "", status: data.status || "" };
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherBookings", { force: true });
      }
      if (form.dataset.form === "teacherUnavailableBlock") {
        await teacherStudentApi("/api/teacher-student/calendar/blocks", { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherBookings", { force: true });
      }
      if (form.dataset.form === "teacherBookingRules") {
        await teacherStudentApi("/api/teacher-student/booking-rules", { method: "POST", body: JSON.stringify(data) });
        closeModal();
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (form.dataset.form === "teacherReschedule") {
        const bookingId = data.bookingId;
        delete data.bookingId;
        await teacherStudentApi(`/api/teacher-student/bookings/${bookingId}/reschedule-requests`, { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (form.dataset.form === "teacherLessonNote") {
        await teacherStudentApi("/api/teacher-student/notes", { method: "POST", body: JSON.stringify(data) });
        form.reset();
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (form.dataset.form === "teacherResource") {
        await teacherStudentApi("/api/teacher-student/resources", { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherResources", { force: true });
      }
      if (form.dataset.form === "teacherTemplate") {
        await teacherStudentApi("/api/teacher-student/templates", { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("teacherTemplates", { force: true });
      }
      if (form.dataset.form === "teacherMessage") {
        const nextState = await teacherStudentApi("/api/teacher-student/messages", { method: "POST", body: JSON.stringify(data) });
        if (!nextState) return;
        state = nextState;
        closeModal();
        chatOpen = true;
        chatMobileScreen = "messages";
        const nextConversation = state.directChat?.conversations?.find((item) => item.otherUserId === data.recipientId && item.conversationType === "teacher_student");
        selectedConversationId = nextConversation?.id || selectedConversationId;
        pendingChatRecipientId = "";
        render();
        scrollChatToLatest();
      }
      if (form.dataset.form === "comment") {
        await api(`/api/posts/${data.postId}/comments`, { method: "POST", body: JSON.stringify(data) });
      }
      if (form.dataset.form === "directMessage") {
        const recipientId = data.recipientId;
        const conversation = state.directChat?.conversations?.find((item) => item.id === selectedConversationId);
        if (conversation?.conversationType === "teacher_student") {
          await teacherStudentApi("/api/teacher-student/messages", {
            method: "POST",
            body: JSON.stringify({
              recipientId,
              body: data.body,
              teacherProfileId: conversation.teacherProfileId || "",
              lessonBookingId: conversation.lessonBookingId || ""
            })
          });
          await api("/api/state");
        } else {
          await api("/api/messages", { method: "POST", body: JSON.stringify(data) });
        }
        const nextConversation = state.directChat?.conversations?.find((item) => item.otherUserId === recipientId);
        selectedConversationId = nextConversation?.id || selectedConversationId;
        pendingChatRecipientId = "";
        chatOpen = true;
        renderChatDrawer();
        scrollChatToLatest();
      }
      form.reset();
      } finally {
        restorePending();
      }
    });
  });
}

function setPublicShell() {
  appShell.className = "min-h-screen";
  sidebar.className = "hidden";
  topbar.className = "hidden";
  if (mobileTopbar) mobileTopbar.className = "hidden";
  if (mobileMenuBackdrop) mobileMenuBackdrop.className = "hidden fixed inset-0 z-40 bg-brand-ink/55 backdrop-blur-sm lg:hidden";
  mobileMenuOpen = false;
  document.body.classList.remove("overflow-hidden");
  if (chatDrawer) chatDrawer.innerHTML = "";
  view.className = "min-h-screen";
}

function setAppShell() {
  appShell.className = "min-h-screen lg:grid lg:grid-cols-[286px_minmax(0,1fr)]";
  syncMobileMenu();
  if (mobileTopbar) mobileTopbar.className = "flex min-h-16 items-center justify-between gap-3 border-b border-brand-line bg-brand-panel/95 px-4 py-3 backdrop-blur lg:hidden";
  topbar.className = "hidden min-h-20 items-center justify-between gap-4 border-b border-brand-line bg-brand-panel/90 px-7 py-4 backdrop-blur lg:flex";
  view.className = `${ui.page} ${ui.appView}`;
}

function navigatePublic(path) {
  history.pushState({}, "", path);
  renderPublicPage();
}

function renderPublicPage() {
  setPublicShell();
  pageTitle.textContent = "LinguaStories";
  if (mobilePageTitle) mobilePageTitle.textContent = "LinguaStories";
  if (messageBadge) {
    messageBadge.textContent = "0";
    messageBadge.className = "absolute -right-1 -top-1 hidden min-w-5 rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white";
  }
  if (notificationBadge) {
    notificationBadge.textContent = "0";
    notificationBadge.className = "absolute -right-1 -top-1 hidden min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white";
  }
  if (mobileMessageBadge) {
    mobileMessageBadge.textContent = "0";
    mobileMessageBadge.className = "absolute -right-1 -top-1 hidden min-w-5 rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white";
  }
  nav.innerHTML = "";
  const publicViews = { "/": landingView, "/login": loginView, "/signup": signupView };
  view.innerHTML = (publicViews[window.location.pathname] || landingView)(context());
  bindActions();
  scrollToPageTopOnRouteChange();
}

async function fetchJsonWithTimeout(url, fallback, timeoutMs = 4000) {
  try {
    const response = await Promise.race([
      fetch(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeoutMs))
    ]);
    if (!response?.ok) return fallback;
    return await response.json().catch(() => fallback);
  } catch (_error) {
    return fallback;
  }
}

function render() {
  if (!state) return;
  document.documentElement.lang = state.user.siteLanguage || "en-US";
  normalizeAppUrl();
  setAppShell();
  const route = activeRoute();
  if (route === "communityConnect" || communityRoutes.has(route) || route === "voiceVideoRoom" || route === "teacherClassroom") topbar.className = "hidden";
  if ((route === "voiceVideoRoom" || route === "teacherClassroom") && mobileTopbar) mobileTopbar.className = "hidden";
  if (route === "teacherClassroom") {
    appShell.className = "min-h-screen";
    sidebar.className = "hidden";
  }
  const match = routes.find(([id]) => id === route) || routes[0];
  const learnerForTitle = route === "communityLearner"
    ? state.learners.find((learner) => learner.id === activeLearnerId()) || state.posts.find((post) => post.userId === activeLearnerId())
    : null;
  const teacherProfileForTitle = route === "teacherProfileDetail" ? teacherStudentData.profile : route === "bookLesson" ? teacherStudentData.bookingPage?.profile : null;
  const titleText =
    route === "communityLearner" && learnerForTitle
      ? learnerForTitle.displayName || learnerForTitle.name || learnerForTitle.author || match[1]
      : route === "communityConnect"
        ? "Community"
        : route === "voiceVideoRooms"
          ? "Practice"
        : route === "findTeacher"
          ? "Find a Teacher"
        : route === "myLessons"
          ? myLearningTabTitles.lessons
        : route === "myTeachers"
          ? myLearningTabTitles.teachers
        : route === "teacherProfileCreate"
          ? "Create Teacher Profile"
          : route === "teacherProfileEdit"
            ? "Edit Teacher Profile"
            : (route === "teacherProfileDetail" || route === "bookLesson") && teacherProfileForTitle
              ? teacherProfileForTitle.displayName
              : match[1] || "LinguaStories";
  pageTitle.textContent = titleText;
  if (mobilePageTitle) mobilePageTitle.textContent = titleText.replace(/\s+\([^)]*\)$/, "");
  if (messageBadge) {
    const unread = Number(state.directChat?.unreadCount || 0);
    messageBadge.textContent = unread;
    messageBadge.className = `absolute -right-1 -top-1 ${unread ? "inline-flex" : "hidden"} min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white`;
    if (mobileMessageBadge) {
      mobileMessageBadge.textContent = unread;
      mobileMessageBadge.className = `absolute -right-1 -top-1 ${unread ? "inline-flex" : "hidden"} min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white`;
    }
  }
  syncNotificationBadge();
  document.querySelector("#miniAvatar").innerHTML = state.user.avatarUrl
    ? `<img class="h-10 w-10 rounded-full object-cover" src="${escapeHtml(state.user.avatarUrl)}" alt="">`
    : escapeHtml(state.user.avatar);
  document.querySelector("#miniName").innerHTML = `${icon("user", "h-3.5 w-3.5")}<span>${escapeHtml(state.user.displayName)}</span>`;
  document.querySelector("#miniTarget").textContent = "Learner";
  renderNav();

  const views = {
    dashboard: dashboardView,
    communityConnect: communityConnectView,
    voiceVideoRooms: voiceVideoRoomsView,
    voiceVideoRoom: voiceVideoRoomView,
    teacherClassroom: classroomView,
    communityLearner: (ctx) => communityLearnerView({ ...ctx, activeLearnerId: activeLearnerId() }),
    communityPost: (ctx) => communityPostView({ ...ctx, activePostId: activePostId() }),
    findTeacher: findTeacherView,
    teacherProfileDetail: (ctx) => teacherProfileDetailView({ ...ctx, activeTeacherProfileId: activeTeacherProfileId() }),
    teacherProfileCreate: teacherProfileCreateView,
    teacherProfileEdit: (ctx) => teacherProfileEditView({ ...ctx, activeTeacherProfileId: activeTeacherProfileId() }),
    bookLesson: bookLessonView,
    myLessons: myLearningView,
    myTeachers: (ctx) => myLearningView({ ...ctx, myLearningTab: "teachers" }),
    learningNotes: learningNotesView,
    teacherDashboard: teacherDashboardView,
    teacherAvailability: teacherAvailabilityView,
    teacherBookings: teacherBookingsView,
    teacherStudents: teacherStudentsView,
    teacherStudentDetail: teacherStudentDetailView,
    teacherLessonNotes: teacherLessonNotesView,
    teacherResources: teacherResourcesView,
    teacherTemplates: teacherTemplatesView,
    profile: profileView,
    profileInfo: profileInfoView,
    profileSubscriptions: subscriptionsView
  };
	  if (browseRoutes.has(route)) view.className = `${ui.page} ${ui.appView}`;
	  if (route === "voiceVideoRoom") view.className = "min-h-screen bg-brand-cream";
	  if (route === "teacherClassroom") view.className = "min-h-screen bg-black";
	  view.innerHTML = canAccessRoute(route) ? (views[route] || dashboardView)(context()) : subscriptionLockedView(route);
	  bindActions();
	  renderChatDrawer();
	  if (!canAccessRoute(route)) {
	    syncVoiceVideoPolling(route);
	  } else if (route === "voiceVideoRooms") {
	    loadVoiceVideoRooms();
	    syncVoiceVideoPolling(route);
  } else if (route === "voiceVideoRoom") {
    syncVoiceVideoPolling(route);
    if (activeVoiceVideoSession) startVoiceVideoTimer();
  } else if (route === "teacherClassroom") {
    syncVoiceVideoPolling(route);
    syncClassroomRoute();
  } else {
    syncVoiceVideoPolling(route);
  }
	  if (canAccessRoute(route) && teacherStudentRoutes.has(route)) {
	    loadTeacherStudentData(route);
	    syncStripeReturnPayment(route);
	    syncTeacherPayoutReturn(route);
  }
  if (canAccessRoute(route) && route === "profileSubscriptions") loadAccountBillingData();
  scrollToPageTopOnRouteChange();
}

function loadMoreCommunityListIfNeeded() {
  if (!state) return;
  const route = activeRoute();
  if (route !== "communityConnect") return;
  const marker = document.querySelector(`[data-community-load-more="${route}"]`);
  if (!marker) return;

  const visible = Number(marker.dataset.visible || 0);
  const total = Number(marker.dataset.total || 0);
  if (!total || visible >= total) return;

  const scrollBottom = window.innerHeight + window.scrollY;
  const triggerPoint = document.documentElement.scrollHeight - 240;
  if (scrollBottom < triggerPoint) return;

  communityListLimits = { ...communityListLimits, [route]: visible + 10 };
  render();
}

window.addEventListener("popstate", () => {
  if (state && window.location.pathname.startsWith("/app")) return render();
  renderPublicPage();
});

window.addEventListener("beforeunload", () => {
  if (activeRoute() === "teacherClassroom" && classroomBookingId) {
    navigator.sendBeacon?.(`/api/teacher-student/bookings/${encodeURIComponent(classroomBookingId)}/leave-classroom`, new Blob(["{}"], { type: "application/json" }));
  }
  if (!activeVoiceVideoSession?.id) return;
  const body = JSON.stringify({ status: "disconnected" });
  const blob = new Blob([body], { type: "application/json" });
  navigator.sendBeacon?.(`/api/livekit/sessions/${activeVoiceVideoSession.id}/end`, blob);
});

window.addEventListener("scroll", loadMoreCommunityListIfNeeded, { passive: true });

document.querySelector("#notifyButton").addEventListener("click", () => {
  if (!state) return;
  markNotificationsSeen();
  showModal(notificationsModal());
});

async function init() {
  try {
    setPublicShell();
    const isPublicPath = !window.location.pathname.startsWith("/app");
    if (isPublicPath) renderPublicPage();
    appConfig = await fetchJsonWithTimeout("/api/config", { supportedLanguages: [] });
    if (isPublicPath) renderPublicPage();
    const tiersBody = await fetchJsonWithTimeout("/api/account/tiers", { tiers: [] });
    appConfig.accountTiers = tiersBody.tiers || [];
    if (isPublicPath) renderPublicPage();
    const auth = await fetchJsonWithTimeout("/api/auth/me", { authenticated: false });
    if (!auth.authenticated) {
      if (window.location.pathname.startsWith("/app")) history.replaceState({}, "", "/login");
      renderPublicPage();
      return;
    }
    if (window.location.pathname === "/") {
      renderPublicPage();
      return;
    }
    if (["/login", "/signup"].includes(window.location.pathname)) history.replaceState({}, "", appPath("dashboard"));
    normalizeAppUrl();
    await api("/api/state");
  } catch (_error) {
    state = null;
    renderPublicPage();
  }
}

init();
