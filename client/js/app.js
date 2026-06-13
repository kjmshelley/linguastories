import { dashboardView } from "./pages/dashboard.js";
import { adminView } from "./pages/admin.js";
import { appreciateMomentModal, communityConnectView, communityLearnerView, communityMomentView, communityMomentsView, createPostModal, momentImageModal, profileMomentsView, supportGoalModal } from "./pages/community.js";
import { deckView } from "./pages/deck.js";
import { createGoalModal, editGoalModal, goalSupportersModal, goalsView } from "./pages/goals.js";
import { landingView, loginView, signupView } from "./pages/public.js";
import { addLanguageModal, deleteProfileConfirmModal, editLanguageModal, myProfilesView, profileInfoView, profileView, subscriptionsView } from "./pages/profile.js";
import { progressView } from "./pages/progress.js";
import { reviewView } from "./pages/review.js";
import { addDeckSentenceModal, createDeckModal, deleteMinedSentenceModal, deleteTopicConfirmModal, editMinedSentenceModal, editTopicModal, sentenceDeckDetailView, sentenceDeckTopicSentencesView, sentenceMiningView, topicModal } from "./pages/sentence-mining.js";
import { sentencesView } from "./pages/sentence-library.js";
import { shadowingView } from "./pages/shadowing.js";
import { shortStoriesView, shortStorySearchView } from "./pages/short-stories.js";
import { storiesView } from "./pages/stories.js";
import { storyDetailView, storyLevelModal } from "./pages/story-detail.js";
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
  teacherProfileModal,
  teacherProfilesPanel,
  teacherResourcesView,
  teacherStudentsView,
  teacherTemplatesView
} from "./pages/learning.js";
import { createVoiceVideoRoomModal, voiceVideoRoomView, voiceVideoRoomsView } from "./pages/voice-video-rooms.js";
import { coinRulesModal, walletView } from "./pages/wallet.js";
import { escapeHtml, icon, ui } from "./ui.js";
import { gsap } from "../vendor/gsap/gsap.esm.js";

const routeGroups = [
  {
    title: "Menu",
    routes: [
      ["dashboard", "Dashboard"],
      ["shortStories", "Short Stories"],
      ["sentenceMining", "Sentence Mining"]
    ]
  },
  {
    title: "Community",
    routes: [
      ["communityConnect", "Connect"],
      ["communityMoments", "Moments"],
      ["voiceVideoRooms", "Voice/Video Rooms"]
    ]
  },
  {
    title: "Learning",
    routes: [
      ["findTeacher", "Find a Teacher"],
      ["myLearning", "My Schedule"],
      ["teacherDashboard", "Teacher Dashboard"]
    ]
  },
  {
    title: "Profile",
    routes: [
      ["profileInfo", "My Account"],
      ["profileProfiles", "My Profiles"],
      ["profileGoals", "My Goals"],
      ["profileMoments", "My Moments"],
      ["profileWallet", "My Wallet"]
    ]
  }
];

const myLearningTabTitles = {
  lessons: "My Booked lessons",
  teachers: "My Booked Teachers",
  calendar: "My Scheduled Classes"
};

const hiddenRoutes = [
  ["storyDetail", "Story"],
  ["sentenceDeckDetail", "Sentence Deck"],
  ["sentenceDeckTopicSentences", "Topic Sentences"],
  ["shortStorySearch", "Search Short Stories"],
  ["communityLearner", "Learner Profile"],
  ["communityMoment", "Moment Detail"],
  ["voiceVideoRoom", "Voice/Video Room"],
  ["teacherProfileDetail", "Teacher Profile"],
  ["teacherProfileCreate", "Create Teacher Profile"],
  ["bookLesson", "Book Lesson"],
  ["myLessons", "My Booked lessons"],
  ["myTeachers", "My Booked Teachers"],
  ["learningNotes", "Learning Notes"],
  ["teacherAvailability", "Availability"],
  ["teacherBookings", "Unavailable Blocks"],
  ["teacherStudents", "My Students"],
  ["teacherLessonNotes", "Lesson Notes"],
  ["teacherResources", "Resources"],
  ["teacherTemplates", "Lesson Templates"],
  ["profileSubscriptions", "Subscriptions"],
  ["profileLanguages", "My Language Profiles"],
  ["stories", "Stories"],
  ["review", "SRS Review"],
  ["shadowing", "Shadowing"],
  ["wallet", "Coin Wallet"],
  ["goals", "Goals"],
  ["progress", "Progress Dashboard"],
  ["profile", "Profile"],
  ["admin", "Admin"]
];

const routes = [...routeGroups.flatMap((group) => group.routes), ...hiddenRoutes];
const routeSlugs = {
  dashboard: "dashboard",
  sentenceMining: "sentence-mining",
  sentences: "sentence-library",
  shortStories: "short-stories",
  shortStorySearch: "short-stories/search",
  stories: "stories",
  communityConnect: "community/connect",
  communityMoments: "community/moments",
  voiceVideoRooms: "community/voice-video-rooms",
  voiceVideoRoom: "community/voice-video-rooms",
  findTeacher: "learning/find-teacher",
  myLearning: "learning/my-learning",
  teacherProfileDetail: "learning/teacher-profile",
  teacherProfileCreate: "profile/my-profiles/teacher/new",
  bookLesson: "learning/teacher-profile",
  myLessons: "learning/my-lessons",
  myTeachers: "learning/my-teachers",
  learningNotes: "learning/learning-notes",
  teacherDashboard: "learning/teacher-dashboard",
  teacherProfiles: "learning/teacher-profiles",
  teacherAvailability: "learning/availability",
  teacherBookings: "learning/unavailable-blocks",
  teacherStudents: "learning/students",
  teacherLessonNotes: "learning/lesson-notes",
  teacherResources: "learning/resources",
  teacherTemplates: "learning/templates",
  profileInfo: "profile/my-info",
  profileSubscriptions: "profile/subscriptions",
  profileProfiles: "profile/my-profiles",
  profileLanguages: "profile/language-profiles",
  profileGoals: "profile/goals",
  profileMoments: "profile/moments",
  profileWallet: "profile/wallet"
};
const browseRoutes = new Set(["sentenceMining", "sentenceDeckDetail", "sentenceDeckTopicSentences", "sentences", "shortStories", "shortStorySearch", "stories"]);
const communityRoutes = new Set(["communityLearner", "communityMoment"]);
const teacherStudentRoutes = new Set(["findTeacher", "teacherProfileDetail", "teacherProfileCreate", "bookLesson", "myLearning", "myLessons", "myTeachers", "learningNotes", "profileInfo", "profileSubscriptions", "profileProfiles", "teacherDashboard", "teacherProfiles", "teacherAvailability", "teacherBookings", "teacherStudents", "teacherLessonNotes", "teacherResources", "teacherTemplates"]);

let appConfig = { supportedLanguages: [] };
let state = null;
let selectedProfileLanguage = "";
let selectedFeaturedStoryIndex = 0;
let shortStoryFilters = {
  query: "",
  status: "all",
  maxMinutes: "",
  reward: "all",
  engagement: "all",
  sort: "recommended"
};
let selectedStoryLanguages = {};
let selectedStoryLevels = {};
let selectedStoryTabs = {};
let selectedStoryReaderOptions = {};
let selectedLearnerProfileTabs = {};
let communityListLimits = { communityConnect: 10, communityMoments: 10 };
let connectMyCommunityOnly = true;
let voiceVideoRooms = [];
let voiceVideoRoomFilters = { q: "", cefrLevel: "", roomType: "" };
let voiceVideoRoomsLoaded = false;
let voiceVideoShowHistory = false;
let voiceVideoPollTimer = null;
let teacherStudentData = {};
let teacherStudentFilters = { q: "", maxRate: "" };
let teacherStudentLoadedKeys = new Set();
let syncedStripeReturnBookings = new Set();
let bookingSelection = { teacherProfileId: "", lessonType: "one_on_one", durationMinutes: "", date: "", startsAt: "" };
let myLearningTab = "lessons";
let myLearningWeekStart = "";
let myProfilesTab = "languages";
let teacherCalendarFilters = { view: "month", teacherProfileId: "", status: "" };
let teacherWorkspaceShowCompletedPaid = false;
let activeVoiceVideoRoom = null;
let activeVoiceVideoSession = null;
let activeVoiceVideoParticipants = [];
let livekitRoomConnection = null;
let livekitRoomTimer = null;
let endingVoiceVideoRoom = false;
let livekitWarningFlags = { three: false, one: false, ten: false };
let livekitParticipantTiles = new Map();
let livekitHiddenAudioLayer = null;
let livekitLocalTracks = [];
let livekitLocalAudioMuted = false;
let livekitLocalVideoMuted = false;
let chatOpen = false;
let chatContactsHidden = false;
let chatMobileScreen = "contacts";
let mobileMenuOpen = false;
let selectedConversationId = "";
let pendingChatRecipientId = "";
let topicAudioPlayback = { active: false, stopRequested: false, audio: null, resolve: null, runId: 0 };
let activeReviewResults = { key: "", total: 0, responses: [] };
let seenNotificationKeys = loadSeenNotificationKeys();

const defaultReviewSettings = {
  playAudioAutomatically: true,
  showSourceLanguage: false,
  showRomanization: false,
  goToNextCardAutomatically: true,
  autoNextDelaySeconds: 5
};
let reviewSettings = loadReviewSettings();

const appShell = document.querySelector("#appShell");
const sidebar = document.querySelector("#sidebar");
const topbar = document.querySelector("#topbar");
const view = document.querySelector("#view");
const nav = document.querySelector("#nav");
const chatDrawer = document.querySelector("#chatDrawer");
const pageTitle = document.querySelector("#pageTitle");
const coinBalance = document.querySelector("#coinBalance");
const mobileCoinBalance = document.querySelector("#mobileCoinBalance");
const topbarLanguage = document.querySelector("#topbarLanguage");
const messageBadge = document.querySelector("#messageBadge");
const notificationBadge = document.querySelector("#notificationBadge");
const mobileTopbar = document.querySelector("#mobileTopbar");
const mobilePageTitle = document.querySelector("#mobilePageTitle");
const mobileMessageBadge = document.querySelector("#mobileMessageBadge");
const shortStorySearchButton = document.querySelector("#shortStorySearchButton");
const mobileShortStorySearchButton = document.querySelector("#mobileShortStorySearchButton");
const mobileMenuBackdrop = document.querySelector("#mobileMenuBackdrop");
let lastCoinAnimationOrigin = null;
let lastRenderedPageKey = "";

function scrollToPageTopOnRouteChange() {
  const pageKey = `${location.pathname}${location.search}${location.hash}`;
  if (pageKey === lastRenderedPageKey) return;
  lastRenderedPageKey = pageKey;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function hasActiveShortStoryFilters() {
  return Boolean(
    String(shortStoryFilters.query || "").trim() ||
      shortStoryFilters.status !== "all" ||
      shortStoryFilters.maxMinutes ||
      shortStoryFilters.reward !== "all" ||
      shortStoryFilters.engagement !== "all" ||
      shortStoryFilters.sort !== "recommended"
  );
}

function activeRoute() {
  const hashRoute = location.hash.replace("#", "");
  if (hashRoute) return routes.some(([id]) => id === hashRoute) ? hashRoute : "dashboard";
  if (location.pathname === "/sentence-mining") return "sentenceMining";
  if (!location.pathname.startsWith("/app")) return "dashboard";
  const slug = location.pathname.replace(/^\/app\/?/, "").replace(/\/$/, "") || "dashboard";
  if (slug === "community") return "communityMoments";
  if (/^sentence-mining\/decks\/[^/]+\/topics\/[^/]+$/.test(slug)) return "sentenceDeckTopicSentences";
  if (slug.startsWith("sentence-mining/decks/")) return "sentenceDeckDetail";
  if (slug.startsWith("stories/")) return "storyDetail";
  if (slug.startsWith("community/connect/")) return "communityLearner";
  if (slug.startsWith("community/moments/")) return "communityMoment";
  if (slug.startsWith("community/voice-video-rooms/")) return "voiceVideoRoom";
  if (/^learning\/teacher-profile\/[^/]+\/book$/.test(slug)) return "bookLesson";
  if (slug.startsWith("learning/teacher-profile/")) return "teacherProfileDetail";
  const match = routes.find(([id]) => (routeSlugs[id] || id) === slug);
  return match?.[0] || "dashboard";
}

function activeNavRoute() {
  const route = activeRoute();
  if (route === "sentences" || route === "deck") return "sentenceMining";
  if (route === "sentenceDeckDetail" || route === "sentenceDeckTopicSentences") return "sentenceMining";
  if (route === "shortStorySearch") return "shortStories";
  if (route === "voiceVideoRoom") return "voiceVideoRooms";
  if (route === "teacherProfileDetail" || route === "bookLesson") return "findTeacher";
  if (["myLessons", "myTeachers", "learningNotes"].includes(route)) return "myLearning";
  if (route === "profileSubscriptions") return "profileInfo";
  if (["profileLanguages", "teacherProfiles", "teacherProfileCreate"].includes(route)) return "profileProfiles";
  if (["teacherAvailability", "teacherBookings", "teacherStudents", "teacherLessonNotes", "teacherResources", "teacherTemplates"].includes(route)) return "teacherDashboard";
  return route === "storyDetail" ? "stories" : route;
}

function activeStoryId() {
  const match = location.pathname.match(/^\/app\/stories\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeDeckId() {
  const match = location.pathname.match(/^\/app\/sentence-mining\/decks\/([^/]+)(?:\/topics\/[^/]+)?\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeTopicId() {
  const match = location.pathname.match(/^\/app\/sentence-mining\/decks\/[^/]+\/topics\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeLearnerId() {
  const match = location.pathname.match(/^\/app\/community\/connect\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activePostId() {
  const match = location.pathname.match(/^\/app\/community\/moments\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function resetLanguageScopedViews() {
  shortStoryFilters = {
    query: "",
    status: "all",
    maxMinutes: "",
    reward: "all",
    engagement: "all",
    sort: "recommended"
  };
  selectedFeaturedStoryIndex = 0;
  selectedStoryLanguages = {};
  selectedStoryLevels = {};
  selectedStoryTabs = {};
  selectedStoryReaderOptions = {};
  activeReviewResults = { key: "", total: 0, responses: [] };
  voiceVideoRoomFilters = { q: "", cefrLevel: "", roomType: "" };
  voiceVideoRoomsLoaded = false;
}

function activeVoiceVideoRoomId() {
  const match = location.pathname.match(/^\/app\/community\/voice-video-rooms\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function activeTeacherProfileId() {
  const match = location.pathname.match(/^\/app\/learning\/teacher-profile\/([^/]+)(?:\/book)?\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function momentIdFromPath(path) {
  const match = String(path || "").match(/^\/app\/community\/moments\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function appPath(id, params = {}) {
  if (id === "storyDetail") return `/app/stories/${encodeURIComponent(params.storyId || "")}`;
  if (id === "sentenceDeckDetail") return `/app/sentence-mining/decks/${encodeURIComponent(params.deckId || "")}`;
  if (id === "sentenceDeckTopicSentences") return `/app/sentence-mining/decks/${encodeURIComponent(params.deckId || "")}/topics/${encodeURIComponent(params.topicId || "")}`;
  if (id === "communityLearner") return `/app/community/connect/${encodeURIComponent(params.learnerId || "")}`;
  if (id === "communityMoment") return `/app/community/moments/${encodeURIComponent(params.postId || "")}`;
  if (id === "voiceVideoRoom") return `/app/community/voice-video-rooms/${encodeURIComponent(params.roomId || "")}`;
  if (id === "teacherProfileDetail") return `/app/learning/teacher-profile/${encodeURIComponent(params.teacherProfileId || "")}`;
  if (id === "bookLesson") return `/app/learning/teacher-profile/${encodeURIComponent(params.teacherProfileId || "")}/book`;
  return `/app/${routeSlugs[id] || id}`;
}

function routeIcon(id) {
  const icons = {
    dashboard: "dashboard",
    shortStories: "reading",
    sentenceMining: "scanText",
    communityConnect: "search",
    communityMoments: "message",
    voiceVideoRooms: "video",
    findTeacher: "search",
    myLearning: "calendar",
    myLessons: "book",
    myTeachers: "users",
    teacherDashboard: "dashboard",
    teacherProfiles: "user",
    teacherBookings: "book",
    profileInfo: "user",
    profileProfiles: "users",
    profileLanguages: "globe",
    profileGoals: "goal",
    profileMoments: "message",
    profileWallet: "wallet"
  };
  return icon(icons[id] || "book");
}

function normalizeAppUrl() {
  if (!location.pathname.startsWith("/app")) return;
  const route = activeRoute();
  const cleanPath =
    route === "storyDetail"
      ? appPath(route, { storyId: activeStoryId() })
      : route === "sentenceDeckDetail"
        ? appPath(route, { deckId: activeDeckId() })
      : route === "sentenceDeckTopicSentences"
        ? appPath(route, { deckId: activeDeckId(), topicId: activeTopicId() })
      : route === "communityLearner"
        ? appPath(route, { learnerId: activeLearnerId() })
        : route === "communityMoment"
          ? appPath(route, { postId: activePostId() })
          : route === "voiceVideoRoom"
            ? appPath(route, { roomId: activeVoiceVideoRoomId() || activeVoiceVideoRoom?.id })
          : route === "teacherProfileDetail"
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
    activeStoryId,
    activeLearnerId,
    activePostId,
    activeVoiceVideoRoomId,
    activeTeacherProfileId,
    selectedProfileLanguage,
    selectedFeaturedStoryIndex,
    shortStoryFilters,
    selectedStoryLanguages,
    selectedStoryLevels,
    selectedStoryTabs,
    selectedStoryReaderOptions,
    selectedLearnerProfileTabs,
    communityListLimits,
    connectMyCommunityOnly,
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
    teacherStudentFilters,
    bookingSelection,
    myLearningTab,
    myLearningWeekStart,
    myProfilesTab,
    teacherCalendarFilters,
    activeTeacherProfileId: activeTeacherProfileId()
  };
}

function subscriptionCapabilities() {
  return state?.subscription?.capabilities || state?.user?.subscription?.capabilities || {};
}

function canAccessRoute(id) {
  const capabilities = subscriptionCapabilities();
  if (["voiceVideoRooms", "voiceVideoRoom"].includes(id)) return Boolean(capabilities.voiceVideoRooms);
  if (["teacherDashboard", "teacherProfileCreate", "teacherProfiles", "teacherAvailability", "teacherBookings", "teacherStudents", "teacherLessonNotes", "teacherResources", "teacherTemplates"].includes(id)) {
    return Boolean(capabilities.teacherWorkspace);
  }
  return true;
}

function subscriptionLockedView(route) {
  const message = ["voiceVideoRooms", "voiceVideoRoom"].includes(route)
    ? "Voice/Video Rooms require the Basic tier or higher."
    : "Teacher workspace access requires the Teacher tier or Teacher Pro tier.";
  return `
    <section class="${ui.card}">
      <span class="${ui.tagGold}">Subscription</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Upgrade required</h2>
      <p class="mt-2 ${ui.muted}">${escapeHtml(message)}</p>
      <a class="${ui.primary} mt-5" href="${appPath("profileSubscriptions")}" data-app-link>${icon("wallet", "h-4 w-4")}<span>View Subscriptions</span></a>
    </section>
  `;
}

function renderNav() {
  const activeNav = activeNavRoute();
  nav.innerHTML = routeGroups
    .map(
      (group) => `
        <section class="grid gap-1.5">
          <div class="px-2 text-[11px] font-semibold uppercase text-white/38">${group.title}</div>
          ${group.routes
            .filter(([id]) => canAccessRoute(id))
            .map(([id, label]) => {
              const active =
                activeNav === id ||
                (activeNav === "communityLearner" && id === "communityConnect") ||
                (activeNav === "communityMoment" && id === "communityMoments");
              return `
                <a href="${appPath(id)}" data-app-link class="flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium no-underline transition ${
                  active ? "bg-white/12 text-white ring-1 ring-white/10" : "text-white/58 hover:bg-white/[.07] hover:text-white"
                }">
                  ${routeIcon(id)}
                  <span>${label}</span>
                </a>
              `;
            })
            .join("")}
        </section>
      `
    )
    .join("");
}

function syncShortStorySearchButtons(route = activeRoute()) {
  const show = route === "shortStories" || route === "shortStorySearch";
  const active = hasActiveShortStoryFilters();
  const buttons = [shortStorySearchButton, mobileShortStorySearchButton].filter(Boolean);
  buttons.forEach((button) => {
    const isDesktop = button === shortStorySearchButton;
    button.className = `${show ? "flex" : "hidden"} h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition ${
      route === "shortStorySearch"
        ? "border-brand-orange/60 bg-brand-orange text-white hover:bg-brand-redDark"
        : active
          ? "border-brand-orange/60 bg-brand-mist text-brand-redDark hover:-translate-y-0.5 hover:bg-white"
          : "border-brand-line bg-white/70 text-brand-charcoal hover:-translate-y-0.5 hover:border-brand-orange/60 hover:bg-white"
    }`;
    if (!isDesktop) button.className = button.className.replace("px-3 text-sm", "w-11 px-0 text-sm");
    const iconElement = button.querySelector("svg");
    const labelElement = button.querySelector("span");
    if (iconElement) iconElement.classList.toggle("text-white", route === "shortStorySearch");
    if (iconElement) iconElement.classList.toggle("text-brand-redDark", route !== "shortStorySearch");
    if (labelElement) labelElement.className = route === "shortStorySearch" ? "text-white" : active ? "text-brand-redDark" : "text-brand-graphite";
    button.title = active ? "Search filters active" : "Search Short Stories";
  });
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
          : `<p class="mt-4 ${ui.muted}">You are all caught up. New messages, due reviews, goal deadlines, and wallet updates will show here.</p>`
      }
    </div>
  `;
}

function syncMobileMenu() {
  if (!sidebar) return;
  sidebar.className = mobileMenuOpen
    ? "fixed inset-y-0 left-0 z-50 block w-[min(286px,calc(100vw-24px))] overflow-y-auto border-r border-black/10 bg-brand-sidebar px-4 py-5 text-white shadow-[18px_0_50px_rgba(29,41,63,.26)] lg:sticky lg:top-0 lg:block lg:min-h-screen lg:w-[286px] lg:shadow-none"
    : "hidden min-h-screen border-r border-black/10 bg-brand-sidebar px-4 py-5 text-white lg:sticky lg:top-0 lg:block";
  if (mobileMenuBackdrop) mobileMenuBackdrop.className = mobileMenuOpen ? "fixed inset-0 z-40 bg-brand-ink/55 backdrop-blur-sm lg:hidden" : "hidden fixed inset-0 z-40 bg-brand-ink/55 backdrop-blur-sm lg:hidden";
}

function captureCoinAnimationOrigin(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  if (!rect.width && !rect.height) return;
  lastCoinAnimationOrigin = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function visibleCoinTarget() {
  const candidates = [coinBalance, mobileCoinBalance].filter(Boolean);
  return candidates.find((element) => element.getClientRects().length && element.offsetParent !== null) || coinBalance || mobileCoinBalance;
}

function animateCoinsToWallet(amount, origin = lastCoinAnimationOrigin) {
  const target = visibleCoinTarget();
  if (!gsap || !target || !amount || amount <= 0) return;

  const targetRect = target.getBoundingClientRect();
  const start = origin || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const end = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2
  };
  const count = Math.min(8, Math.max(3, amount));
  const layer = document.createElement("div");
  layer.className = "pointer-events-none fixed inset-0 z-[70]";
  document.body.appendChild(layer);

  for (let index = 0; index < count; index += 1) {
    const coin = document.createElement("div");
    coin.className = "absolute grid h-7 w-7 place-items-center rounded-full border border-brand-orange/40 bg-brand-mist text-xs font-black text-brand-brown shadow-[0_8px_18px_rgba(29,41,63,.18)]";
    coin.textContent = "¢";
    coin.style.left = `${start.x - 14}px`;
    coin.style.top = `${start.y - 14}px`;
    layer.appendChild(coin);
    gsap.to(coin, {
      x: end.x - start.x + (index % 2 ? 10 : -10),
      y: end.y - start.y,
      scale: 0.55,
      opacity: 0,
      rotate: 260,
      duration: 0.72,
      delay: index * 0.045,
      ease: "power2.inOut",
      onComplete: () => coin.remove()
    });
  }

  gsap.fromTo(target, { scale: 1 }, { scale: 1.18, duration: 0.16, yoyo: true, repeat: 1, ease: "power1.out", delay: 0.42 });
  window.setTimeout(() => layer.remove(), 1400);
  lastCoinAnimationOrigin = null;
}

async function api(path, options = {}) {
  const hadWalletState = Boolean(state?.wallet);
  const requestMethod = String(options.method || "GET").toUpperCase();
  const previousBalance = Number(state?.wallet?.balance || 0);
  const previousTargetLanguage = state?.user?.targetLanguage || "";
  const animationOrigin = lastCoinAnimationOrigin;
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
  const nextBalance = Number(state?.wallet?.balance || 0);
  const languageExists = state.learningLanguages?.some((item) => item.language === selectedProfileLanguage);
  if (!selectedProfileLanguage || !languageExists) selectedProfileLanguage = state.user.targetLanguage || state.learningLanguages?.[0]?.language || "";
  if (previousTargetLanguage && previousTargetLanguage !== state.user.targetLanguage) {
    voiceVideoRoomsLoaded = false;
    teacherStudentLoadedKeys = new Set();
  }
  render();
  if (hadWalletState && requestMethod !== "GET" && nextBalance > previousBalance) animateCoinsToWallet(nextBalance - previousBalance, animationOrigin);
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
  selectedProfileLanguage = state.user.targetLanguage || state.learningLanguages?.[0]?.language || "";
  history.pushState({}, "", appPath("shortStories"));
  render();
}

async function livekitApi(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  if (response.status === 401) {
    state = null;
    navigatePublic("/login");
    return null;
  }
  const body = await response.json().catch(() => ({ error: "Request failed" }));
  if (!response.ok) {
    showModal(`<h2 class="text-xl font-black">Room unavailable</h2><p class="${ui.muted}">${escapeHtml(body.error || "Request failed")}</p>`);
    return null;
  }
  return body;
}

async function teacherStudentApi(path, options = {}) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  if (response.status === 401) {
    state = null;
    navigatePublic("/login");
    return null;
  }
  const body = await response.json().catch(() => ({ error: "Request failed" }));
  if (!response.ok) {
    showModal(`<h2 class="text-xl font-black">Learning action unavailable</h2><p class="${ui.muted}">${escapeHtml(body.error || "Request failed")}</p>`);
    return null;
  }
  return body;
}

function teacherStudentQuery() {
  const params = new URLSearchParams();
  if (activeRoute() === "findTeacher" && state?.user?.targetLanguage) params.set("language", state.user.targetLanguage);
  Object.entries(teacherStudentFilters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
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
  const profileId = activeTeacherProfileId();
  const bookingQuery = new URLSearchParams({
    lessonType: bookingSelection.lessonType || "one_on_one",
    durationMinutes: bookingSelection.durationMinutes || "",
    studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local"
  }).toString();
  const calendarQuery = new URLSearchParams(teacherCalendarFilters);
  const key = `${route}:${profileId}:${teacherStudentQuery()}:${bookingQuery}:${calendarQuery}`;
  if (!force && teacherStudentLoadedKeys.has(key)) return;
  const requests = [];
  if (route === "findTeacher") requests.push(["teachers", `/api/teacher-student/teachers${teacherStudentQuery()}`]);
  if (route === "teacherProfileDetail" && profileId) requests.push(["profileDetail", `/api/teacher-student/teacher-profiles/${encodeURIComponent(profileId)}`]);
  if (route === "bookLesson" && profileId) requests.push(["bookingPage", `/api/teacher-student/teacher-profiles/${encodeURIComponent(profileId)}/booking-page?${bookingQuery}`]);
  if (["profileProfiles", "teacherProfileCreate", "teacherProfiles", "teacherAvailability", "teacherDashboard", "teacherTemplates"].includes(route)) requests.push(["profiles", "/api/teacher-student/teacher-profiles/my"]);
  if (["myLearning", "myLessons", "teacherDashboard"].includes(route)) requests.push(["lessons", "/api/teacher-student/lessons"]);
  if (route === "teacherBookings") requests.push(["calendar", `/api/teacher-student/calendar?${calendarQuery}`]);
  if (route === "myLearning" || route === "myTeachers") requests.push(["myTeachers", "/api/teacher-student/my-teachers"]);
  if (["learningNotes", "teacherLessonNotes"].includes(route)) requests.push(["notes", "/api/teacher-student/notes"]);
  if (route === "teacherAvailability") requests.push(["availability", "/api/teacher-student/availability"]);
  if (route === "teacherDashboard") requests.push(["dashboard", "/api/teacher-student/dashboard"]);
  if (route === "teacherResources") requests.push(["resources", "/api/teacher-student/resources"]);
  if (route === "teacherTemplates") requests.push(["templates", "/api/teacher-student/templates"]);
  if (route === "profileInfo" || route === "profileSubscriptions") requests.push(["subscription", "/api/teacher-student/subscription"]);
  if (!requests.length) return;
  const loaded = await Promise.all(requests.map(async ([name, path]) => [name, await teacherStudentApi(path)]));
  loaded.forEach(([name, body]) => {
    if (!body) return;
    if (name === "teachers") teacherStudentData.teachers = body.teachers || [];
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
  if (route !== "myLearning" && route !== "myLessons") return;
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
  await loadTeacherStudentData(route === "myLessons" ? "myLessons" : "myLearning", { force: true });
}

function voiceVideoRoomQuery() {
  const params = new URLSearchParams();
  if (state?.user?.targetLanguage) params.set("targetLanguage", state.user.targetLanguage);
  Object.entries(voiceVideoRoomFilters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (voiceVideoShowHistory) params.set("history", "true");
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function loadVoiceVideoRooms({ force = false, quiet = false } = {}) {
  if (voiceVideoRoomsLoaded && !force) return;
  const body = await livekitApi(`/api/livekit/rooms${voiceVideoRoomQuery()}`);
  if (!body) return;
  voiceVideoRooms = body.rooms || [];
  voiceVideoRoomsLoaded = true;
  if (activeRoute() === "voiceVideoRooms" && (!quiet || !activeVoiceVideoSession)) render();
}

function updateVoiceVideoCountdown() {
  if (!activeVoiceVideoSession) return;
  const startedAt = new Date(activeVoiceVideoRoom?.startedAt || activeVoiceVideoSession.startedAt).getTime();
  const elapsed = Math.min(360, Math.max(0, Math.ceil((Date.now() - startedAt) / 1000)));
  const remaining = Math.max(0, 360 - elapsed);
  activeVoiceVideoSession = { ...activeVoiceVideoSession, elapsedSeconds: elapsed, secondsRemaining: remaining };
  const countdown = document.querySelector("[data-room-countdown]");
  const charge = document.querySelector("[data-room-estimated-charge]");
  if (countdown) {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    countdown.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  if (charge) charge.textContent = Math.min(6000, Math.max(1000, Math.ceil(Math.max(1, elapsed) / 60) * 1000));
  if (remaining <= 180 && !livekitWarningFlags.three) {
    livekitWarningFlags.three = true;
    showModal(`<h2 class="text-xl font-black">3 minutes remaining</h2><p class="${ui.muted}">Keep the practice focused: one sentence, one correction, one retry.</p>`);
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
  if (route === "voiceVideoRooms" && !voiceVideoPollTimer) {
    voiceVideoPollTimer = window.setInterval(() => loadVoiceVideoRooms({ force: true, quiet: true }), 8000);
  }
  if (route !== "voiceVideoRooms" && voiceVideoPollTimer) {
    window.clearInterval(voiceVideoPollTimer);
    voiceVideoPollTimer = null;
  }
}

function stopVoiceVideoTimer() {
  if (livekitRoomTimer) window.clearInterval(livekitRoomTimer);
  livekitRoomTimer = null;
}

function startVoiceVideoTimer() {
  stopVoiceVideoTimer();
  livekitWarningFlags = { three: false, one: false, ten: false };
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
  stage.className = "grid h-full min-h-[360px] grid-cols-2 grid-rows-2 gap-3";
  tiles.forEach((tile, index) => {
    tile.className = tileClassFor(index, tiles.length);
  });
}

function ensureParticipantTile(identity, participantName = "Participant") {
  const stage = document.querySelector("[data-livekit-stage]");
  if (!stage) return null;
  if (livekitParticipantTiles.size === 0) stage.innerHTML = "";
  if (!livekitHiddenAudioLayer) {
    livekitHiddenAudioLayer = document.createElement("div");
    livekitHiddenAudioLayer.className = "hidden";
    stage.append(livekitHiddenAudioLayer);
  }
  const key = identity || participantName;
  let tile = livekitParticipantTiles.get(key);
  if (!tile) {
    tile = document.createElement("div");
    tile.dataset.livekitTile = key;
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
  return tile;
}

function renderTrack(track, participantName = "Participant", identity = "", isLocal = false) {
  if (!track?.attach) return;
  if (isLocal && track.kind === "audio") return;
  const element = track.attach();
  if (track.kind === "audio") {
    ensureParticipantTile(identity, participantName);
    element.autoplay = true;
    element.dataset.remoteAudio = identity || participantName;
    livekitHiddenAudioLayer?.append(element);
    return;
  }
  const tile = ensureParticipantTile(identity, participantName);
  if (!tile) return;
  tile.innerHTML = `<div class="absolute bottom-2 left-2 z-10 rounded bg-black/45 px-2 py-1 text-xs font-semibold text-white">${escapeHtml(participantName)}</div>`;
  element.className = "absolute inset-0 h-full w-full bg-black object-cover";
  element.autoplay = true;
  element.playsInline = true;
  if (isLocal) element.muted = true;
  tile.append(element);
  applyLiveKitTileLayout();
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

function toggleVoiceVideoAudio() {
  livekitLocalAudioMuted = !livekitLocalAudioMuted;
  setLocalTrackMuted("audio", livekitLocalAudioMuted);
}

function toggleVoiceVideoCamera() {
  livekitLocalVideoMuted = !livekitLocalVideoMuted;
  setLocalTrackMuted("video", livekitLocalVideoMuted);
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

async function connectLiveKitRoom(payload, localTracks = []) {
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
      applyLiveKitTileLayout();
    });
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => renderTrack(track, participant.name || "Participant", participant.identity, false));
    room.on(RoomEvent.Disconnected, () => {
      if (activeVoiceVideoSession && !endingVoiceVideoRoom) leaveVoiceVideoRoom({ silent: true });
    });
    await room.connect(payload.livekitUrl, payload.token);
    if (stage) stage.innerHTML = "";
    ensureParticipantTile(room.localParticipant.identity || "local", "You");
    room.remoteParticipants?.forEach((participant) => ensureParticipantTile(participant.identity, participant.name || "Participant"));
    livekitLocalTracks = localTracks;
    livekitLocalAudioMuted = false;
    livekitLocalVideoMuted = false;
    for (const track of localTracks) {
      await room.localParticipant.publishTrack(track);
      renderTrack(track, "You", room.localParticipant.identity || "local", true);
    }
    if (stage && !stage.children.length) {
      stage.innerHTML = `<div class="grid min-h-[252px] place-items-center rounded-lg border border-white/10 bg-white/[.04] text-sm font-semibold text-white/72">Connected. Audio is active.</div>`;
    }
  } catch (error) {
    stopLocalTracks(localTracks);
    livekitLocalTracks = [];
    showModal(`<h2 class="text-xl font-black">LiveKit connection failed</h2><p class="${ui.muted}">${escapeHtml(error.message || "Could not connect to the room.")}</p>`);
  }
}

async function joinVoiceVideoRoom(roomId) {
  const room = voiceVideoRooms.find((item) => item.id === roomId) || activeVoiceVideoRoom;
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
  } catch (_error) {
    // The server-side end call is the billing source of truth.
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
      body: JSON.stringify(wasTimedOut ? { status: "timed_out" } : {})
    });
    if (payload?.wallet && state?.wallet) state.wallet = { ...state.wallet, ...payload.wallet };
    const charged = payload?.session?.coinsCharged;
    activeVoiceVideoRoom = null;
    activeVoiceVideoSession = null;
    activeVoiceVideoParticipants = [];
    voiceVideoRoomsLoaded = false;
    if (activeRoute() === "voiceVideoRoom") history.pushState({}, "", appPath("voiceVideoRooms"));
    await loadVoiceVideoRooms({ force: true });
    render();
    if (!silent && charged) {
      showModal(`<h2 class="text-xl font-black">Session ended</h2><p class="${ui.muted}">You were charged ${charged} coins for ${payload.session.billedMinutes} minute${payload.session.billedMinutes === 1 ? "" : "s"} of focused practice.</p>`);
    }
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
  let localTracks = [];
  try {
    localTracks = await createTeacherClassroomLocalTracks();
  } catch (_error) {
    return;
  }
  const payload = await teacherStudentApi(`/api/teacher-student/bookings/${bookingId}/classroom-token`, { method: "POST" });
  if (!payload) {
    stopLocalTracks(localTracks);
    return;
  }
  try {
    const { Room } = await import("/vendor/livekit/livekit-client.esm.mjs");
    const room = new Room({ adaptiveStream: true, dynacast: true });
    await room.connect(payload.livekitUrl, payload.token);
    for (const track of localTracks) await room.localParticipant.publishTrack(track);
    showModal(`
      <h2 class="text-xl font-black">Classroom connected</h2>
      <p class="${ui.muted}">Your microphone and camera are connected to the LiveKit classroom. Keep this page open during the lesson.</p>
      <div class="mt-5 flex justify-end border-t border-brand-line pt-4">
        <button class="${ui.danger}" data-action="leaveTeacherClassroom:${escapeHtml(bookingId)}">${icon("logout", "h-4 w-4")}<span>Leave Classroom</span></button>
      </div>
    `, { closeButton: false });
    window.activeTeacherClassroomConnection = room;
    window.activeTeacherClassroomTracks = localTracks;
  } catch (error) {
    stopLocalTracks(localTracks);
    showModal(`<h2 class="text-xl font-black">Classroom connection failed</h2><p class="${ui.muted}">${escapeHtml(error.message || "Could not connect to LiveKit.")}</p>`);
  }
}

async function leaveTeacherClassroom(bookingId) {
  try {
    window.activeTeacherClassroomTracks?.forEach((track) => track.stop?.());
    window.activeTeacherClassroomConnection?.disconnect?.();
  } finally {
    window.activeTeacherClassroomTracks = [];
    window.activeTeacherClassroomConnection = null;
  }
  await teacherStudentApi(`/api/teacher-student/bookings/${bookingId}/leave-classroom`, { method: "POST" });
  closeModal();
  teacherStudentLoadedKeys = new Set();
  await loadTeacherStudentData(activeRoute(), { force: true });
}

function showModal(html, options = {}) {
  const { closeButton: includeCloseButton = true } = options;
  const template = document.querySelector("#modalTemplate").content.cloneNode(true);
  const modalBody = template.querySelector("[data-modal-body]");
  modalBody.innerHTML = html;
  const modal = template.querySelector(".fixed.inset-0.z-50");
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
    closeButton.addEventListener("click", () => modal.remove());

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
  bindActions(modal);
}

function loadReviewSettings() {
  try {
    return { ...defaultReviewSettings, ...JSON.parse(localStorage.getItem("linguaStoriesReviewSettings") || "{}") };
  } catch {
    return { ...defaultReviewSettings };
  }
}

function saveReviewSettings() {
  localStorage.setItem("linguaStoriesReviewSettings", JSON.stringify(reviewSettings));
}

function reviewDelayControl() {
  return `
    <label class="grid gap-2 rounded-lg border border-brand-line/80 bg-white/70 px-4 py-3 text-sm font-bold text-brand-ink sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
      <span>Seconds before next card</span>
      <input class="${ui.input}" type="number" min="1" max="60" step="1" value="${escapeHtml(reviewSettings.autoNextDelaySeconds || 5)}" data-review-setting-number="autoNextDelaySeconds">
    </label>
  `;
}

function reviewSettingControl(key, label) {
  return `
    <label class="flex items-center justify-between gap-4 rounded-lg border border-brand-line/80 bg-white/70 px-4 py-3 text-sm font-bold text-brand-ink">
      <span>${escapeHtml(label)}</span>
      <input class="h-5 w-5 accent-brand-red" type="checkbox" data-review-setting="${key}" ${reviewSettings[key] ? "checked" : ""}>
    </label>
  `;
}

function reviewSettingsModal() {
  return `
    <div>
      <span class="${ui.tagGold}">Review Settings</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Sentence Review</h2>
      <div class="mt-5 grid gap-3">
        ${reviewSettingControl("playAudioAutomatically", "Play audio automatically")}
        ${reviewSettingControl("showSourceLanguage", "Show Source Language")}
        ${reviewSettingControl("showRomanization", "Show romanization")}
        ${reviewSettingControl("goToNextCardAutomatically", "Go to next card automatically")}
        ${reviewDelayControl()}
      </div>
    </div>
  `;
}

function sentenceDetail(id) {
  const sentence = state.sentences.find((item) => item.id === id);
  showModal(`
    <div class="${ui.row}"><span class="${ui.tagGold}">${sentence.level}</span><span class="${ui.tag}">${escapeHtml(sentence.topic)}</span></div>
    <h2 class="mt-4 text-3xl font-black">${escapeHtml(sentence.target)}</h2>
    <p class="mt-2 text-brand-charcoal">${escapeHtml(sentence.translation)}</p>
    <p class="mt-1 text-sm text-brand-graphite">${escapeHtml(sentence.romanization)}</p>
    <h3 class="mt-5 font-black">Variations</h3>
    <p class="mt-2 leading-7 text-brand-charcoal">${sentence.variations.map(escapeHtml).join("<br>") || "No variations yet."}</p>
  `);
}

function advanceReviewCardUrl() {
  if (activeRoute() !== "review") return;
  const params = new URLSearchParams(location.search);
  const reviewCard = document.querySelector("[data-review-card]");
  const currentIndex = Number(reviewCard?.dataset.cardIndex ?? params.get("card") ?? 0) || 0;
  const cardCount = Number(reviewCard?.dataset.cardCount || 0) || 0;
  if (cardCount && currentIndex >= cardCount - 1) {
    params.set("card", String(cardCount - 1));
    history.replaceState({}, "", `${location.pathname}?${params.toString()}`);
    return;
  }
  params.set("card", String(currentIndex + 1));
  history.replaceState({}, "", `${location.pathname}?${params.toString()}`);
}

function currentReviewSession() {
  const params = new URLSearchParams(location.search);
  const deckId = params.get("deckId") || "";
  const topicId = params.get("topicId") || "";
  return {
    key: `${deckId}:${topicId}`,
    deckId,
    topicId,
    card: Number(params.get("card") || 0) || 0
  };
}

function ensureReviewResultsSession(total = 0) {
  const session = currentReviewSession();
  if (activeReviewResults.key !== session.key || session.card === 0) {
    activeReviewResults = { key: session.key, total, responses: [] };
  }
  if (total) activeReviewResults.total = total;
  return session;
}

function recordReviewResult(response) {
  const reviewCard = document.querySelector("[data-review-card]");
  ensureReviewResultsSession(Number(reviewCard?.dataset.cardCount || 0) || 0);
  const normalized = { Again: "show_again", Hard: "hard", Good: "easy", Easy: "known" }[response] || response;
  activeReviewResults.responses.push(normalized);
}

function reviewResultsModal() {
  const session = currentReviewSession();
  const deck = state?.sentenceDecks?.find((item) => item.id === session.deckId);
  const topic = deck?.topics?.find((item) => item.id === session.topicId);
  const total = activeReviewResults.total || activeReviewResults.responses.length;
  const counts = activeReviewResults.responses.reduce((items, response) => {
    items[response] = (items[response] || 0) + 1;
    return items;
  }, {});
  const stat = (label, key) => `
    <div class="rounded-lg bg-brand-mist/60 px-3 py-2">
      <span class="block text-xs font-semibold uppercase text-brand-graphite">${label}</span>
      <strong class="mt-1 block text-lg text-brand-ink">${counts[key] || 0}</strong>
    </div>
  `;
  return `
    <div>
      <span class="${ui.tagGold}">Review Complete</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">${escapeHtml(topic?.name || deck?.name || "Sentence Review")}</h2>
      <p class="mt-2 ${ui.muted}">You reviewed ${activeReviewResults.responses.length || total} of ${total} sentences.</p>
      <div class="mt-5 grid gap-2 sm:grid-cols-4">
        ${stat("Show again", "show_again")}
        ${stat("Hard", "hard")}
        ${stat("Easy", "easy")}
        ${stat("I know this", "known")}
      </div>
    </div>
    <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
      <button class="${ui.secondary}" data-action="reviewAgain">${icon("book")}<span>Review again</span></button>
      <button class="${ui.primary}" data-action="goBackToReviewDeck:${escapeHtml(session.deckId)}">${icon("arrowLeft")}<span>Go back to deck</span></button>
    </div>
  `;
}

function closeModal() {
  document.querySelector(".fixed.inset-0.z-50")?.remove();
}

function removeLanguageConfirmModal(language) {
  return `
    <div>
      <span class="${ui.tagRed}">Remove Profile</span>
      <h2 class="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-ink">${icon("trash", "h-5 w-5 text-brand-redDark")}<span>Remove ${escapeHtml(language)}?</span></h2>
      <p class="mt-2 ${ui.muted}">This will remove this language profile and delete its language-specific goals, reviews, story progress, and path progress. This cannot be undone.</p>
    </div>
    <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-brand-line pt-4">
      <button class="${ui.danger}" data-action="confirmRemoveLanguage:${escapeHtml(language)}">Remove Profile</button>
    </div>
  `;
}

function languageSwitcherModal({ state }) {
  const user = state.user;
  const languages = state.learningLanguages?.length
    ? state.learningLanguages
    : [{ language: user.targetLanguage, currentLevel: user.currentLevel, profileVisibility: "Private", currentStreak: user.currentStreak, listeningTime: user.listeningTime, shadowingTime: user.shadowingTime }];

  return `
    <div class="pr-10">
      <span class="${ui.tagGold}">Language Profile</span>
      <h2 class="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-brand-ink">${icon("globe", "h-5 w-5 text-brand-redDark")}<span>Choose Current Language</span></h2>
      <p class="mt-2 ${ui.muted}">Choose the default language profile for the app.</p>
    </div>
    <div class="mt-6 grid gap-3">
      ${languages
        .map((profile) => {
          const language = profile.language;
          const isCurrent = language === user.targetLanguage;
          return `
            <button class="group rounded-lg border p-4 text-left transition ${
              isCurrent ? "border-brand-red/50 bg-brand-mist shadow-sm" : "border-brand-line bg-white hover:-translate-y-0.5 hover:border-brand-orange/60 hover:shadow-md"
            }" data-action="makeCurrentLanguage:${escapeHtml(language)}">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="${ui.row}">
                    ${isCurrent ? `<span class="${ui.tagDark}">${icon("check", "h-3.5 w-3.5")}<span>Default</span></span>` : ""}
                    <span class="${ui.tag}">${icon("target", "h-3.5 w-3.5")}<span>${escapeHtml(profile.currentLevel || "A1")}</span></span>
                    <span class="${ui.tag}">${icon("eye", "h-3.5 w-3.5")}<span>${escapeHtml(profile.profileVisibility || "Private")}</span></span>
                  </div>
                  <h3 class="mt-3 text-xl font-bold tracking-tight text-brand-ink">${escapeHtml(language)}</h3>
                </div>
                <span class="mt-1 text-sm font-bold text-brand-red">${isCurrent ? "Default" : "Make default"}</span>
              </div>
              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <div class="rounded-lg bg-brand-snow px-3 py-2">
                  <span class="flex items-center gap-1.5 text-[11px] font-bold uppercase text-brand-graphite">${icon("trophy", "h-3.5 w-3.5")}<span>Streak</span></span>
                  <strong class="text-sm text-brand-ink">${Number(profile.currentStreak || 0)} days</strong>
                </div>
                <div class="rounded-lg bg-brand-snow px-3 py-2">
                  <span class="flex items-center gap-1.5 text-[11px] font-bold uppercase text-brand-graphite">${icon("play", "h-3.5 w-3.5")}<span>Listening</span></span>
                  <strong class="text-sm text-brand-ink">${Number(profile.listeningTime || 0)} min</strong>
                </div>
                <div class="rounded-lg bg-brand-snow px-3 py-2">
                  <span class="flex items-center gap-1.5 text-[11px] font-bold uppercase text-brand-graphite">${icon("book", "h-3.5 w-3.5")}<span>Reading</span></span>
                  <strong class="text-sm text-brand-ink">${Number(profile.shadowingTime || 0)} min</strong>
                </div>
              </div>
            </button>
          `;
        })
        .join("")}
    </div>
    <div class="mt-6 flex flex-wrap justify-between gap-2 border-t border-brand-line pt-4">
      <button class="${ui.secondary}" data-action="goToLanguageProfiles">Manage Profiles</button>
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
  const balance = state.wallet?.balance || 0;
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
            <p class="text-xs font-semibold text-white/55">Community messages use coins. Lesson messages stay contextual.</p>
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
                      <p class="text-xs font-semibold text-brand-graphite">${escapeHtml(selectedContextLabel)} message${teacherStudentConversation ? "" : " · recipient earns 1 coin"}</p>
                    </div>
                  </div>
                  <span class="${balance > 0 ? ui.tagGold : ui.tagRed}">${icon("coins", "h-3.5 w-3.5")}<span>${balance} coins</span></span>
                </div>
                <div class="overflow-auto bg-white/45 px-4 py-4">
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
                                      ${Number(message.coinAmount || 0) > 0 ? `${icon("coins", "h-3 w-3")}<span>${message.mine ? "-1" : "+1"} coin</span>` : `<span>${escapeHtml(chatContextLabel({ conversationType: message.messageContext }))}</span>`}
                                    </div>
                                  </div>
                                </article>
                              `
                            )
                            .join("")
                        : `<div class="rounded-lg border border-dashed border-brand-line bg-brand-panel/65 p-5 text-center"><p class="${ui.muted}">${teacherStudentConversation ? "Start the lesson conversation." : `Start the conversation. Your first message costs 1 coin and gives it to ${escapeHtml(recipient.name)}.`}</p></div>`
                    }
                  </div>
                </div>
                <form class="border-t border-brand-line bg-brand-panel p-3" data-form="directMessage">
                  <input type="hidden" name="recipientId" value="${escapeHtml(recipient.id)}">
                  <div class="grid gap-2">
                    <textarea class="${ui.input} min-h-20 resize-none" name="body" maxlength="1000" required placeholder="${teacherStudentConversation || balance > 0 ? `Message ${escapeHtml(recipient.name)}...` : "You need coins to send a direct message."}" ${teacherStudentConversation || balance > 0 ? "" : "disabled"}></textarea>
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <span class="text-xs font-semibold text-brand-graphite">${teacherStudentConversation ? "Teacher/Student context" : "Cost: 1 coin per message"}</span>
                      <button class="${teacherStudentConversation || balance > 0 ? ui.primary : `${ui.secondary} opacity-60 pointer-events-none`}" ${teacherStudentConversation || balance > 0 ? "" : "disabled"}>${icon("message")}<span>Send Message</span></button>
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

async function processMomentImage(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("Moment picture must be a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Moment picture must be 10 MB or smaller.");

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
      imageFileName: `${file.name.replace(/\.[^.]+$/, "") || "moment"}.webp`
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function processDeckImage(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("Deck image must be a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Deck image must be 10 MB or smaller.");

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.src = objectUrl;
  await waitForImageLoad(image);

  try {
    let imageBlob = await resizeImageToWebP(image, 900, 0.8);
    const sizeSteps = [820, 760, 700, 640, 560];
    const qualitySteps = [0.76, 0.72, 0.68, 0.64];
    for (const quality of qualitySteps) {
      if (imageBlob.size <= 350 * 1024) break;
      imageBlob = await resizeImageToWebP(image, 900, quality);
    }
    for (const maxSize of sizeSteps) {
      if (imageBlob.size <= 350 * 1024) break;
      imageBlob = await resizeImageToWebP(image, maxSize, 0.68);
    }
    return {
      imageDataUrl: await blobToDataUrl(imageBlob),
      imageFileName: `${file.name.replace(/\.[^.]+$/, "") || "deck"}.webp`
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function processSentenceImage(file) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("Sentence image must be a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Sentence image must be 10 MB or smaller.");

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.src = objectUrl;
  await waitForImageLoad(image);

  try {
    let imageBlob = await resizeImageToWebP(image, 900, 0.8);
    const sizeSteps = [820, 760, 700, 640, 560];
    const qualitySteps = [0.76, 0.72, 0.68, 0.64];
    for (const quality of qualitySteps) {
      if (imageBlob.size <= 350 * 1024) break;
      imageBlob = await resizeImageToWebP(image, 900, quality);
    }
    for (const maxSize of sizeSteps) {
      if (imageBlob.size <= 350 * 1024) break;
      imageBlob = await resizeImageToWebP(image, maxSize, 0.68);
    }
    return {
      imageDataUrl: await blobToDataUrl(imageBlob),
      imageFileName: `${file.name.replace(/\.[^.]+$/, "") || "sentence-image"}.webp`
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function processSentenceAudio(file) {
  const allowedTypes = new Set(["audio/mpeg", "audio/mp3"]);
  const hasMp3Extension = /\.mp3$/i.test(file.name || "");
  if (!allowedTypes.has(file.type) && !hasMp3Extension) throw new Error("Sentence audio must be an MP3 file.");
  if (file.size > 6 * 1024 * 1024) throw new Error("Sentence audio must be 6 MB or smaller.");
  return {
    audioDataUrl: await fileToDataUrl(file),
    audioFileName: file.name || "sentence-audio.mp3"
  };
}

async function processSentenceVideo(file) {
  const allowedTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
  if (!allowedTypes.has(file.type)) throw new Error("Sentence video must be an MP4, WebM, or MOV file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Sentence video must be 8 MB or smaller.");
  return {
    videoDataUrl: await fileToDataUrl(file),
    videoFileName: file.name || "sentence-video.mp4"
  };
}

async function appendSentenceAssets(data, form) {
  const audioFile = form.elements.sentenceAudio?.files?.[0];
  const imageFile = form.elements.sentenceImage?.files?.[0];
  const videoFile = form.elements.sentenceVideo?.files?.[0];
  delete data.sentenceAudio;
  delete data.sentenceImage;
  delete data.sentenceVideo;
  if (audioFile) Object.assign(data, await processSentenceAudio(audioFile));
  if (imageFile) Object.assign(data, await processSentenceImage(imageFile));
  if (videoFile) Object.assign(data, await processSentenceVideo(videoFile));
}

function clearTopicAudioHighlights() {
  document.querySelectorAll("[data-topic-audio-row]").forEach((row) => {
    row.classList.remove("bg-brand-mist", "ring-2", "ring-brand-orange/40");
  });
}

function setPlayAllTopicAudioState(button, playing) {
  if (!button) return;
  button.dataset.playing = playing ? "true" : "false";
  const label = button.querySelector("span");
  if (label) label.textContent = playing ? "Stop" : "Play All";
}

function stopTopicAudioPlayback(button = document.querySelector("[data-action='playAllTopicAudio']")) {
  topicAudioPlayback.stopRequested = true;
  topicAudioPlayback.active = false;
  if (topicAudioPlayback.audio) {
    topicAudioPlayback.audio.pause();
    topicAudioPlayback.audio.currentTime = 0;
  }
  if (topicAudioPlayback.resolve) topicAudioPlayback.resolve();
  topicAudioPlayback.audio = null;
  topicAudioPlayback.resolve = null;
  setPlayAllTopicAudioState(button, false);
  clearTopicAudioHighlights();
}

function bindActions(root = document) {
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
          const momentId = momentIdFromPath(href);
          if (momentId) {
            await fetch(`/api/posts/${encodeURIComponent(momentId)}/view`, {
              method: "POST",
              headers: { "Content-Type": "application/json" }
            }).catch(() => null);
          }
          history.pushState({}, "", href);
          render();
          return;
        }

        const row = event.target.closest("[data-row-link]");
        if (!row || event.target.closest("a, button, input, textarea, select, label")) return;
        event.preventDefault();
        event.stopPropagation();
        if (row.dataset.momentViewId) {
          await fetch(`/api/posts/${encodeURIComponent(row.dataset.momentViewId)}/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          }).catch(() => null);
        }
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
      navigatePublic(link.getAttribute("href"));
    });
  });

  root.querySelectorAll("a[data-app-link]").forEach((link) => {
    if (link.dataset.boundAppLink) return;
    link.dataset.boundAppLink = "true";
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      mobileMenuOpen = false;
      const href = link.getAttribute("href");
      const momentId = momentIdFromPath(href);
      if (momentId) {
        await fetch(`/api/posts/${encodeURIComponent(momentId)}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }).catch(() => null);
      }
      history.pushState({}, "", href);
      render();
    });
  });

  root.querySelectorAll("[data-row-link]").forEach((row) => {
    if (row.dataset.boundRowLink) return;
    row.dataset.boundRowLink = "true";
    row.addEventListener("click", async (event) => {
      if (event.target.closest("a, button, input, textarea, select, label")) return;
      if (row.dataset.momentViewId) {
        await fetch(`/api/posts/${encodeURIComponent(row.dataset.momentViewId)}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }).catch(() => null);
      }
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

  root.querySelectorAll("[data-short-story-filter]").forEach((control) => {
    if (control.dataset.boundAction) return;
    control.dataset.boundAction = "true";
    const updateFilter = () => {
      const key = control.dataset.shortStoryFilter;
      const selectionStart = typeof control.selectionStart === "number" ? control.selectionStart : null;
      const selectionEnd = typeof control.selectionEnd === "number" ? control.selectionEnd : null;
      shortStoryFilters = { ...shortStoryFilters, [key]: control.value };
      if (key !== "query") selectedFeaturedStoryIndex = 0;
      render();
      window.requestAnimationFrame(() => {
        const nextControl = document.querySelector(`[data-short-story-filter="${key}"]`);
        if (!nextControl) return;
        nextControl.focus();
        if (selectionStart !== null && typeof nextControl.setSelectionRange === "function") {
          nextControl.setSelectionRange(selectionStart, selectionEnd);
        }
      });
    };
    control.addEventListener(control.tagName === "SELECT" ? "change" : "input", updateFilter);
  });

  root.querySelectorAll("[data-review-setting]").forEach((control) => {
    if (control.dataset.boundAction) return;
    control.dataset.boundAction = "true";
    control.addEventListener("change", () => {
      const key = control.dataset.reviewSetting;
      reviewSettings = { ...reviewSettings, [key]: control.checked };
      saveReviewSettings();
      if (activeRoute() === "review") render();
    });
  });

  root.querySelectorAll("[data-review-setting-number]").forEach((control) => {
    if (control.dataset.boundAction) return;
    control.dataset.boundAction = "true";
    control.addEventListener("change", () => {
      const key = control.dataset.reviewSettingNumber;
      const value = Math.min(60, Math.max(1, Number(control.value || 5) || 5));
      control.value = String(value);
      reviewSettings = { ...reviewSettings, [key]: value };
      saveReviewSettings();
      if (activeRoute() === "review") render();
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
      event.stopPropagation();
      captureCoinAnimationOrigin(element);
      const [action, id, value] = element.dataset.action.split(":");
      if (action === "learn") await api(`/api/sentences/${id}/learn`, { method: "POST" });
      if (action === "review") {
        const reviewCard = document.querySelector("[data-review-card]");
        const isLastCard = Number(reviewCard?.dataset.cardIndex || 0) >= Number(reviewCard?.dataset.cardCount || 0) - 1;
        recordReviewResult(value);
        advanceReviewCardUrl();
        await api(`/api/reviews/${id}/rate`, { method: "POST", body: JSON.stringify({ rating: value }) });
        if (isLastCard) showModal(reviewResultsModal(), { closeButton: false });
      }
      if (action === "deckReview") {
        const [, deckId, sentenceId, response] = element.dataset.action.split(":");
        const reviewCard = document.querySelector("[data-review-card]");
        const isLastCard = Number(reviewCard?.dataset.cardIndex || 0) >= Number(reviewCard?.dataset.cardCount || 0) - 1;
        recordReviewResult(response);
        advanceReviewCardUrl();
        await api(`/api/sentence-decks/${deckId}/reviews`, { method: "POST", body: JSON.stringify({ sentenceId, response }) });
        if (isLastCard) showModal(reviewResultsModal(), { closeButton: false });
      }
      if (action === "flipReviewCard") {
        const answer = document.querySelector("[data-review-answer]");
        if (answer) answer.classList.toggle("hidden");
        return;
      }
      if (action === "unlockStory") await api(`/api/stories/${id}/unlock`, { method: "POST" });
      if (action === "readStory") {
        history.pushState({}, "", appPath("storyDetail", { storyId: id }));
        render();
      }
      if (action === "completeStory") await api(`/api/stories/${id}/complete`, { method: "POST" });
      if (action === "toggleStoryLike") await api(`/api/stories/${id}/like`, { method: "POST" });
      if (action === "toggleStoryFavorite") await api(`/api/stories/${id}/favorite`, { method: "POST" });
      if (action === "saveStory") await api(`/api/stories/${id}/save-sentences`, { method: "POST" });
      if (action === "saveSentence") await api(`/api/sentences/${id}/save`, { method: "POST" });
      if (action === "openCreateDeckModal") showModal(createDeckModal(context()));
      if (action === "openReviewSettingsModal") showModal(reviewSettingsModal());
      if (action === "openAddTopicModal") showModal(topicModal(context(), id));
      if (action === "openEditTopicModal") showModal(editTopicModal(context(), id));
      if (action === "openDeleteTopicModal") showModal(deleteTopicConfirmModal(context(), id));
      if (action === "deleteTopic") {
        await api(`/api/sentence-decks/topics/${id}`, { method: "DELETE" });
        closeModal();
      }
      if (action === "openAddDeckSentenceModal") showModal(addDeckSentenceModal(context(), id));
      if (action === "openEditSentenceModal") showModal(editMinedSentenceModal(context(), id));
      if (action === "openDeleteSentenceModal") showModal(deleteMinedSentenceModal(context(), id));
      if (action === "deleteSentence") {
        await api(`/api/sentences/${id}`, { method: "DELETE" });
        closeModal();
      }
      if (action === "closeModal") closeModal();
      if (action === "completeShadowing") await api("/api/shadowing", { method: "POST" });
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
      if (action === "openWallet") {
        history.pushState({}, "", appPath("profileWallet"));
        render();
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
      }
      if (action === "sentence") sentenceDetail(id);
      if (action === "openDeck") {
        history.pushState({}, "", appPath("sentenceDeckDetail", { deckId: id }));
        render();
      }
      if (action === "practiceDeck") {
        activeReviewResults = { key: `${id}:`, total: 0, responses: [] };
        history.pushState({}, "", `${appPath("review")}?deckId=${encodeURIComponent(id)}`);
        render();
      }
      if (action === "savePublicDeck") {
        await api(`/api/sentence-decks/${id}/save`, { method: "POST" });
      }
      if (action === "reviewTopic") {
        activeReviewResults = { key: `${id}:${value}`, total: 0, responses: [] };
        history.pushState({}, "", `${appPath("review")}?deckId=${encodeURIComponent(id)}&topicId=${encodeURIComponent(value)}`);
        render();
      }
      if (action === "showTopicSentences") {
        const [, deckId, topicId] = element.dataset.action.split(":");
        const targetDeckId = element.dataset.deckId || deckId || "";
        const targetTopicId = element.dataset.topicId || topicId || "";
        history.pushState({}, "", `/app/sentence-mining/decks/${encodeURIComponent(targetDeckId)}/topics/${encodeURIComponent(targetTopicId)}`);
        render();
      }
      if (action === "toggleDeckTopic") {
        const topic = document.querySelector(`[data-topic-body="${CSS.escape(id)}"]`);
        const icon = document.querySelector(`[data-topic-toggle="${CSS.escape(id)}"]`);
        if (topic) topic.classList.toggle("hidden");
        if (icon) icon.classList.toggle("rotate-180");
      }
      if (action === "scrollCarousel") {
        const carousel = document.querySelector(`#${id}`);
        if (carousel) carousel.scrollBy({ left: (value === "prev" ? -1 : 1) * Math.max(carousel.clientWidth * 0.86, 280), behavior: "smooth" });
      }
      if (action === "featuredStory") {
        const total = Number(document.querySelector("[data-featured-story-count]")?.dataset.featuredStoryCount || 0);
        if (total) {
          if (id === "prev") selectedFeaturedStoryIndex = (selectedFeaturedStoryIndex - 1 + total) % total;
          else if (id === "next") selectedFeaturedStoryIndex = (selectedFeaturedStoryIndex + 1) % total;
          else selectedFeaturedStoryIndex = Math.max(0, Math.min(Number(id), total - 1));
          render();
        }
      }
      if (action === "resetShortStoryFilters") {
        shortStoryFilters = { query: "", status: "all", maxMinutes: "", reward: "all", engagement: "all", sort: "recommended" };
        selectedFeaturedStoryIndex = 0;
        render();
      }
      if (action === "setConnectCommunityFilter") {
        connectMyCommunityOnly = id === "community";
        communityListLimits = { ...communityListLimits, communityConnect: 10 };
        render();
      }
      if (action === "openCreateVoiceVideoRoomModal") showModal(createVoiceVideoRoomModal(context()));
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
      }
      if (action === "toggleVoiceVideoCamera") {
        toggleVoiceVideoCamera();
      }
      if (action === "moderateVoiceVideoParticipant") await moderateVoiceVideoParticipant(id, value);
      if (action === "openTeacherProfileModal") {
        history.pushState({}, "", appPath("teacherProfileCreate"));
        render();
      }
      if (action === "openTeacherProfileEdit") {
        const profile = (teacherStudentData.profiles || []).find((item) => item.id === id);
        if (profile) showModal(teacherProfileModal({ ...context(), profile }));
      }
      if (action === "deleteTeacherProfile") {
        await teacherStudentApi(`/api/teacher-student/teacher-profiles/${id}`, { method: "DELETE" });
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData(activeRoute(), { force: true });
      }
      if (action === "toggleTeacherCompletedPaid") {
        teacherWorkspaceShowCompletedPaid = !teacherWorkspaceShowCompletedPaid;
        render();
      }
      if (action === "openTeacherBookingRulesModal") showModal(teacherBookingRulesModal(context()));
      if (action === "setMyLearningTab") {
        myLearningTab = ["lessons", "teachers", "calendar"].includes(id) ? id : "lessons";
        if (activeRoute() !== "myLearning") history.pushState({}, "", appPath("myLearning"));
        render();
      }
      if (action === "shiftMyLearningWeek") {
        const currentStart = myLearningWeekStart || weekStartKey();
        if (id === "today") myLearningWeekStart = weekStartKey();
        else myLearningWeekStart = shiftDateKey(currentStart, id === "next" ? 7 : -7);
        myLearningTab = "calendar";
        if (activeRoute() !== "myLearning") history.pushState({}, "", appPath("myLearning"));
        render();
      }
      if (action === "setMyProfilesTab") {
        myProfilesTab = ["languages", "teachers"].includes(id) ? id : "languages";
        if (activeRoute() !== "profileProfiles") history.pushState({}, "", appPath("profileProfiles"));
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
        showModal(`<h2 class="text-xl font-black">Booking created</h2><p class="${ui.muted}">Stripe checkout is not configured yet, so this lesson is holding as pending payment for 15 minutes.</p>`);
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
            <textarea class="${ui.input} min-h-24" name="body" required maxlength="1000" placeholder="Ask about lesson fit, availability, or goals."></textarea>
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
      if (action === "openShortStorySearch") {
        history.pushState({}, "", appPath("shortStorySearch"));
        render();
      }
      if (action === "openReview") {
        history.pushState({}, "", id ? `${appPath("review")}?deckId=${encodeURIComponent(id)}` : appPath("review"));
        render();
      }
      if (action === "openStoryLevelModal") {
        const story = state.stories.find((item) => item.id === id);
        if (story) showModal(storyLevelModal(context(), story));
      }
      if (action === "setStoryLevel") {
        selectedStoryLevels = { ...selectedStoryLevels, [id]: value };
        closeModal();
        render();
      }
      if (action === "setStoryLanguage") {
        selectedStoryLanguages = { ...selectedStoryLanguages, [id]: value };
        const nextStoryLevels = { ...selectedStoryLevels };
        delete nextStoryLevels[id];
        selectedStoryLevels = nextStoryLevels;
        render();
      }
      if (action === "setStoryTab") {
        selectedStoryTabs = { ...selectedStoryTabs, [id]: value };
        render();
      }
      if (action === "setLearnerProfileTab") {
        selectedLearnerProfileTabs = { ...selectedLearnerProfileTabs, [id]: value };
        render();
      }
      if (action === "toggleStoryReader") {
        const current = selectedStoryReaderOptions[id] || { target: true, source: false, romanization: false };
        selectedStoryReaderOptions = {
          ...selectedStoryReaderOptions,
          [id]: { ...current, [value]: !current[value] }
        };
        render();
      }
      if (action === "playStoryAudio") {
        const text = document.querySelector("[data-reading-text]")?.textContent?.trim();
        if (text && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
      }
      if (action === "playSentenceAudio") {
        stopTopicAudioPlayback();
        const audioUrl = element.dataset.audioUrl || "";
        if (audioUrl) new Audio(audioUrl).play().catch(() => null);
      }
      if (action === "playAllTopicAudio") {
        if (topicAudioPlayback.active) {
          stopTopicAudioPlayback(element);
          return;
        }
        const audioButtons = [...document.querySelectorAll("[data-action='playSentenceAudio'][data-audio-url]")]
          .filter((button) => button.dataset.audioUrl && !button.disabled);
        const runId = topicAudioPlayback.runId + 1;
        topicAudioPlayback = { active: true, stopRequested: false, audio: null, resolve: null, runId };
        setPlayAllTopicAudioState(element, true);
        clearTopicAudioHighlights();
        try {
          for (const button of audioButtons) {
            if (topicAudioPlayback.stopRequested || topicAudioPlayback.runId !== runId) break;
            const row = button.closest("[data-topic-audio-row]");
            clearTopicAudioHighlights();
            row?.classList.add("bg-brand-mist", "ring-2", "ring-brand-orange/40");
            const audio = new Audio(button.dataset.audioUrl);
            topicAudioPlayback.audio = audio;
            await new Promise((resolve) => {
              topicAudioPlayback.resolve = resolve;
              audio.addEventListener("ended", resolve, { once: true });
              audio.addEventListener("error", resolve, { once: true });
              audio.play().catch(resolve);
            });
          }
        } finally {
          if (topicAudioPlayback.runId === runId) {
            topicAudioPlayback = { active: false, stopRequested: false, audio: null, resolve: null, runId };
            setPlayAllTopicAudioState(element, false);
            clearTopicAudioHighlights();
          }
        }
      }
      if (action === "shareStory") {
        const story = state.stories.find((item) => item.id === id);
        const url = `${location.origin}${appPath("storyDetail", { storyId: id })}`;
        if (navigator.share) {
          await navigator.share({ title: story?.title || "LinguaStories", text: story?.translation || "Read this story on LinguaStories.", url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          showModal(`<h2 class="text-xl font-bold text-brand-ink">Link copied</h2><p class="${ui.muted}">The story link is ready to share.</p>`);
        }
      }
      if (action === "setProfileLanguage") {
        selectedProfileLanguage = id;
        render();
      }
      if (action === "openLanguageSwitcher") showModal(languageSwitcherModal(context()));
      if (action === "reviewAgain") {
        const params = new URLSearchParams(location.search);
        const session = currentReviewSession();
        activeReviewResults = { key: session.key, total: activeReviewResults.total, responses: [] };
        params.set("card", "0");
        closeModal();
        history.replaceState({}, "", `${location.pathname}?${params.toString()}`);
        render();
      }
      if (action === "goBackToReviewDeck") {
        closeModal();
        history.pushState({}, "", appPath("sentenceDeckDetail", { deckId: id }));
        render();
      }
      if (action === "goToLanguageProfiles") {
        closeModal();
        history.pushState({}, "", appPath("profileLanguages"));
        render();
      }
      if (action === "makeCurrentLanguage") {
        selectedProfileLanguage = id;
        closeModal();
        const updatedState = await api("/api/languages/current", { method: "POST", body: JSON.stringify({ language: id }) });
        if (updatedState?.user?.targetLanguage === id) {
          resetLanguageScopedViews();
          history.pushState({}, "", appPath("shortStories"));
          render();
        }
      }
      if (action === "openAddLanguageModal") showModal(addLanguageModal(context()));
      if (action === "openEditLanguageModal") showModal(editLanguageModal(context(), id));
      if (action === "openDeleteProfileModal") showModal(deleteProfileConfirmModal(context()));
      if (action === "openCreateGoalModal") showModal(createGoalModal(context()));
      if (action === "openEditGoalModal") showModal(editGoalModal(context(), id));
      if (action === "openGoalSupporters") showModal(goalSupportersModal(context(), id));
      if (action === "goToLearnerProfile") {
        closeModal();
        history.pushState({}, "", appPath("communityLearner", { learnerId: id }));
        render();
      }
      if (action === "openCreatePostModal") showModal(createPostModal(context()));
      if (action === "openSupportGoalModal") showModal(supportGoalModal(context(), id));
      if (action === "openMomentAppreciation") showModal(appreciateMomentModal(context(), id));
      if (action === "expandMomentImage") showModal(momentImageModal(context(), id));
      if (action === "openCoinRulesModal") showModal(coinRulesModal(context()));
      if (action === "removeLanguage") {
        showModal(removeLanguageConfirmModal(id));
      }
      if (action === "confirmRemoveLanguage") {
        await api("/api/languages/remove", { method: "POST", body: JSON.stringify({ language: id }) });
        if (selectedProfileLanguage === id) selectedProfileLanguage = state.user.targetLanguage || state.learningLanguages?.[0]?.language || "";
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
      if (action === "shadowing") {
        history.pushState({}, "", appPath("shadowing"));
        render();
      }
      if (action === "logout") {
        await fetch("/api/auth/logout", { method: "POST" });
        state = null;
        navigatePublic("/");
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
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      captureCoinAnimationOrigin(event.submitter || form.querySelector("button"));
      const data = Object.fromEntries(new FormData(form).entries());
      if (form.dataset.form === "login") return authRequest("/api/auth/login", data);
      if (form.dataset.form === "register") return authRequest("/api/auth/register", data);
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
      if (form.dataset.form === "customSentence") {
        try {
          await appendSentenceAssets(data, form);
        } catch (error) {
          showModal(`<h2 class="text-xl font-black">Sentence asset unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
          return;
        }
        await api("/api/sentences/custom", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "sentenceDeck") {
        const imageFile = form.elements.deckImage?.files?.[0];
        delete data.deckImage;
        if (imageFile) {
          try {
            Object.assign(data, await processDeckImage(imageFile));
          } catch (error) {
            showModal(`<h2 class="text-xl font-black">Deck image unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
            return;
          }
        }
        await api("/api/sentence-decks", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "sentenceDeckTopic") {
        await api(`/api/sentence-decks/${data.deckId}/topics`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "editSentenceDeckTopic") {
        await api(`/api/sentence-decks/topics/${data.id}`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "deckSentence") {
        try {
          await appendSentenceAssets(data, form);
        } catch (error) {
          showModal(`<h2 class="text-xl font-black">Sentence asset unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
          return;
        }
        await api(`/api/sentence-decks/${data.deckId}/sentences`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "editSentence") {
        try {
          await appendSentenceAssets(data, form);
        } catch (error) {
          showModal(`<h2 class="text-xl font-black">Sentence asset unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
          return;
        }
        await api(`/api/sentences/${data.id}`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "goal") {
        data.goalScope = form.elements.isGlobal?.checked ? "Global" : "Language";
        delete data.isGlobal;
        await api("/api/goals", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "editGoal") {
        await api(`/api/goals/${data.id}`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "goalSupport") {
        await api(`/api/goals/${data.goalId}/support`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "addLanguage") {
        selectedProfileLanguage = data.language;
        await api("/api/languages", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "editLanguage") {
        selectedProfileLanguage = data.language;
        await api("/api/languages/update", { method: "POST", body: JSON.stringify(data) });
        closeModal();
      }
      if (form.dataset.form === "post") {
        const imageFile = form.elements.momentImage?.files?.[0];
        delete data.momentImage;
        if (imageFile) {
          try {
            Object.assign(data, await processMomentImage(imageFile));
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
            Object.assign(data, await processDeckImage(imageFile));
          } catch (error) {
            showModal(`<h2 class="text-xl font-black">Room image unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
            return;
          }
        }
        await livekitApi("/api/livekit/rooms", { method: "POST", body: JSON.stringify(data) });
        closeModal();
        voiceVideoRoomsLoaded = false;
        await loadVoiceVideoRooms({ force: true });
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
        teacherStudentFilters = { q: data.q || "", maxRate: data.maxRate || "" };
        teacherStudentLoadedKeys = new Set();
        await loadTeacherStudentData("findTeacher", { force: true });
      }
      if (form.dataset.form === "teacherProfile" || form.dataset.form === "teacherProfileEdit") {
        const imageFile = form.elements.teacherImage?.files?.[0];
        delete data.teacherImage;
        const profileId = data.id;
        delete data.id;
        if (imageFile) {
          try {
            Object.assign(data, await processDeckImage(imageFile));
          } catch (error) {
            showModal(`<h2 class="text-xl font-black">Profile image unavailable</h2><p class="${ui.muted}">${escapeHtml(error.message)}</p>`);
            return;
          }
        }
        const path = form.dataset.form === "teacherProfileEdit" ? `/api/teacher-student/teacher-profiles/${profileId}` : "/api/teacher-student/teacher-profiles";
        await teacherStudentApi(path, { method: "POST", body: JSON.stringify(data) });
        teacherStudentLoadedKeys = new Set();
        if (form.dataset.form === "teacherProfile" && activeRoute() === "teacherProfileCreate") {
          myProfilesTab = "teachers";
          history.pushState({}, "", appPath("profileProfiles"));
          await loadTeacherStudentData("profileProfiles", { force: true });
          return;
        }
        closeModal();
        await loadTeacherStudentData(activeRoute() === "profileProfiles" ? "profileProfiles" : "teacherProfiles", { force: true });
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
        await teacherStudentApi("/api/teacher-student/messages", { method: "POST", body: JSON.stringify(data) });
        closeModal();
        chatOpen = true;
        pendingChatRecipientId = "";
        await api("/api/state");
      }
      if (form.dataset.form === "comment") {
        await api(`/api/posts/${data.postId}/comments`, { method: "POST", body: JSON.stringify(data) });
      }
      if (form.dataset.form === "momentAppreciation") {
        await api(`/api/posts/${data.postId}/appreciate`, { method: "POST", body: JSON.stringify(data) });
        closeModal();
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
      }
      if (form.dataset.form === "storyComment") await api(`/api/stories/${data.storyId}/comments`, { method: "POST", body: JSON.stringify(data) });
      form.reset();
    });
  });

  const reviewCard = root.querySelector("[data-review-card]");
  if (reviewCard && !reviewCard.dataset.timerBound) {
    reviewCard.dataset.timerBound = "true";
    ensureReviewResultsSession(Number(reviewCard.dataset.cardCount || 0) || 0);
    const audioElement = reviewCard.querySelector("audio");
    if (audioElement && reviewCard.dataset.autoPlayAudio === "true") {
      window.setTimeout(() => {
        if (!document.body.contains(reviewCard)) return;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => null);
      }, 120);
    }
    if (reviewCard.dataset.autoNextCard === "true") {
      const delayMs = Math.min(60000, Math.max(1000, Number(reviewCard.dataset.autoNextDelayMs || 5000) || 5000));
      window.setTimeout(() => {
        if (!document.body.contains(reviewCard)) return;
        advanceReviewCardUrl();
        render();
      }, delayMs);
    }
  }
}

function setPublicShell() {
  appShell.className = "min-h-screen";
  sidebar.className = "hidden";
  topbar.className = "hidden";
  if (mobileTopbar) mobileTopbar.className = "hidden";
  if (mobileMenuBackdrop) mobileMenuBackdrop.className = "hidden fixed inset-0 z-40 bg-brand-ink/55 backdrop-blur-sm lg:hidden";
  syncShortStorySearchButtons("");
  mobileMenuOpen = false;
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
  coinBalance.textContent = "0";
  if (mobileCoinBalance) mobileCoinBalance.textContent = "0";
  if (topbarLanguage) topbarLanguage.textContent = "Language";
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

function render() {
  if (!state) return;
  normalizeAppUrl();
  setAppShell();
  const route = activeRoute();
  if (communityRoutes.has(route) || route === "voiceVideoRoom") topbar.className = "hidden";
  if (route === "voiceVideoRoom" && mobileTopbar) mobileTopbar.className = "hidden";
  syncShortStorySearchButtons(route);
  const match = routes.find(([id]) => id === route) || routes[0];
  const storyForTitle = route === "storyDetail" ? state.stories.find((story) => story.id === activeStoryId()) : null;
  const deckForTitle = route === "sentenceDeckDetail" || route === "sentenceDeckTopicSentences" ? state.sentenceDecks?.find((deck) => deck.id === activeDeckId()) : null;
  const topicForTitle = route === "sentenceDeckTopicSentences" ? deckForTitle?.topics?.find((topic) => topic.id === activeTopicId()) : null;
  const storyLanguageForTitle = storyForTitle ? selectedStoryLanguages[storyForTitle.id] || storyForTitle.targetLanguage || state.user.targetLanguage : "";
  const learnerForTitle = route === "communityLearner" ? state.learners.find((learner) => learner.id === activeLearnerId()) : null;
  const teacherProfileForTitle = route === "teacherProfileDetail" ? teacherStudentData.profile : route === "bookLesson" ? teacherStudentData.bookingPage?.profile : null;
  const goalsLanguage = new URLSearchParams(window.location.search).get("language") || state.user.targetLanguage;
  const titleText =
    route === "profileGoals" || route === "goals"
      ? `My ${goalsLanguage} Goals`
      : route === "sentenceDeckTopicSentences" && deckForTitle
        ? topicForTitle ? `${deckForTitle.name}: ${topicForTitle.name}` : deckForTitle.name
      : route === "sentenceDeckDetail" && deckForTitle
        ? deckForTitle.name
      : route === "sentenceMining"
        ? "Sentence Mining"
      : route === "shortStories"
        ? `Short Stories (${state.user.targetLanguage})`
        : route === "shortStorySearch"
          ? `Search Short Stories (${state.user.targetLanguage})`
        : route === "storyDetail" && storyForTitle
          ? `${storyForTitle.title} (${storyLanguageForTitle})`
      : route === "communityLearner" && learnerForTitle
            ? learnerForTitle.displayName
        : route === "communityConnect"
          ? "Connect with followers"
        : route === "communityMoments"
          ? "Followers Moments"
        : route === "voiceVideoRooms"
          ? "Community Voice/Video Rooms"
        : route === "findTeacher"
          ? "Learning - Find a Teacher"
        : route === "myLearning"
          ? "My Schedule"
        : route === "myLessons"
          ? myLearningTabTitles.lessons
        : route === "myTeachers"
          ? myLearningTabTitles.teachers
        : route === "profileProfiles" || route === "profileLanguages" || route === "teacherProfiles"
          ? "My Profiles"
        : route === "teacherProfileCreate"
          ? "Create Teacher Profile"
            : (route === "teacherProfileDetail" || route === "bookLesson") && teacherProfileForTitle
              ? teacherProfileForTitle.displayName
            : storyForTitle?.title || match[1];
  pageTitle.textContent = titleText;
  if (mobilePageTitle) mobilePageTitle.textContent = titleText.replace(/\s+\([^)]*\)$/, "");
  coinBalance.textContent = state.wallet.balance;
  if (mobileCoinBalance) mobileCoinBalance.textContent = state.wallet.balance;
  if (topbarLanguage) topbarLanguage.textContent = state.user.targetLanguage;
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
  document.querySelector("#miniTarget").textContent = state.user.targetLanguage;
  renderNav();

  const views = {
    dashboard: dashboardView,
    sentenceMining: sentenceMiningView,
    sentenceDeckDetail: (ctx) => sentenceDeckDetailView({ ...ctx, activeDeckId: activeDeckId() }),
    sentenceDeckTopicSentences: (ctx) => sentenceDeckTopicSentencesView({ ...ctx, activeDeckId: activeDeckId(), activeTopicId: activeTopicId() }),
    sentences: sentencesView,
    shortStories: shortStoriesView,
    shortStorySearch: shortStorySearchView,
    storyDetail: storyDetailView,
    stories: storiesView,
    review: (ctx) => reviewView({ ...ctx, reviewSettings }),
    shadowing: shadowingView,
    deck: deckView,
    wallet: walletView,
    goals: goalsView,
    communityConnect: communityConnectView,
    communityMoments: communityMomentsView,
    voiceVideoRooms: voiceVideoRoomsView,
    voiceVideoRoom: voiceVideoRoomView,
    communityLearner: (ctx) => communityLearnerView({ ...ctx, activeLearnerId: activeLearnerId() }),
    communityMoment: (ctx) => communityMomentView({ ...ctx, activePostId: activePostId() }),
    findTeacher: findTeacherView,
    teacherProfileDetail: (ctx) => teacherProfileDetailView({ ...ctx, activeTeacherProfileId: activeTeacherProfileId() }),
    teacherProfileCreate: teacherProfileCreateView,
    bookLesson: bookLessonView,
    myLearning: myLearningView,
    myLessons: (ctx) => myLearningView({ ...ctx, myLearningTab: "lessons" }),
    myTeachers: (ctx) => myLearningView({ ...ctx, myLearningTab: "teachers" }),
    learningNotes: learningNotesView,
    teacherDashboard: teacherDashboardView,
    teacherProfiles: (ctx) => myProfilesView({ ...ctx, myProfilesTab: "teachers", teacherProfilesContent: teacherProfilesPanel(ctx) }),
    teacherAvailability: teacherAvailabilityView,
    teacherBookings: teacherBookingsView,
    teacherStudents: teacherStudentsView,
    teacherLessonNotes: teacherLessonNotesView,
    teacherResources: teacherResourcesView,
    teacherTemplates: teacherTemplatesView,
    progress: progressView,
    profile: profileView,
    profileInfo: profileInfoView,
    profileSubscriptions: subscriptionsView,
    profileProfiles: (ctx) => myProfilesView({ ...ctx, teacherProfilesContent: teacherProfilesPanel(ctx) }),
    profileLanguages: (ctx) => myProfilesView({ ...ctx, myProfilesTab: "languages", teacherProfilesContent: teacherProfilesPanel(ctx) }),
    profileGoals: goalsView,
    profileMoments: profileMomentsView,
    profileWallet: walletView,
    admin: adminView
  };
	  if (browseRoutes.has(route)) view.className = `${ui.page} ${ui.appView}`;
	  if (route === "voiceVideoRoom") view.className = "min-h-screen bg-brand-cream";
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
  } else {
    syncVoiceVideoPolling(route);
  }
	  if (canAccessRoute(route) && teacherStudentRoutes.has(route)) {
	    loadTeacherStudentData(route);
	    syncStripeReturnPayment(route);
  }
  scrollToPageTopOnRouteChange();
}

function loadMoreCommunityListIfNeeded() {
  if (!state) return;
  const route = activeRoute();
  if (route !== "communityConnect" && route !== "communityMoments") return;
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
    const configResponse = await fetch("/api/config");
    appConfig = await configResponse.json().catch(() => ({ supportedLanguages: [] }));
    const response = await fetch("/api/auth/me");
    const auth = await response.json().catch(() => ({ authenticated: false }));
    if (!auth.authenticated) {
      if (window.location.pathname.startsWith("/app") || window.location.pathname === "/sentence-mining") history.replaceState({}, "", "/login");
      renderPublicPage();
      return;
    }
    if (["/", "/login", "/signup"].includes(window.location.pathname)) history.replaceState({}, "", appPath("shortStories"));
    if (window.location.pathname === "/sentence-mining") history.replaceState({}, "", appPath("sentenceMining"));
    normalizeAppUrl();
    await api("/api/state");
  } catch (_error) {
    state = null;
    renderPublicPage();
  }
}

init();
