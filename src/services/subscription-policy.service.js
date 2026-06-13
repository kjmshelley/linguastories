const LEARNER_PLANS = {
  free: {
    key: "free",
    name: "Free Tier",
    monthlyPriceUsd: 0,
    monthlyCoins: 100
  },
  basic: {
    key: "basic",
    name: "Basic Tier",
    monthlyPriceUsd: 2.99,
    monthlyCoins: 500
  }
};

const TEACHER_PLANS = {
  teacher: {
    key: "teacher",
    name: "Teacher Tier",
    monthlyPriceUsd: 2.99,
    monthlyCoins: 1000
  },
  teacher_pro: {
    key: "teacher_pro",
    name: "Teacher Pro Tier",
    monthlyPriceUsd: 6.99,
    monthlyCoins: 5000
  }
};

const PLAN_CAPABILITIES = {
  free: {
    dashboard: true,
    shortStories: true,
    sentenceMining: true,
    canCreateShortStories: false,
    canUseSystemDecks: true,
    canUsePublicDecks: true,
    personalDeckLimit: 1,
    connect: true,
    moments: true,
    voiceVideoRooms: false,
    findTeacher: true,
    mySchedule: true,
    maxLanguageProfiles: 1,
    canEditLanguageProfiles: false,
    canDeleteLanguageProfiles: false,
    goals: true,
    wallet: true,
    teacherWorkspace: false,
    groupLessons: false
  },
  basic: {
    dashboard: true,
    shortStories: true,
    sentenceMining: true,
    canCreateShortStories: true,
    canUseSystemDecks: true,
    canUsePublicDecks: true,
    personalDeckLimit: null,
    connect: true,
    moments: true,
    voiceVideoRooms: true,
    findTeacher: true,
    mySchedule: true,
    maxLanguageProfiles: null,
    canEditLanguageProfiles: true,
    canDeleteLanguageProfiles: true,
    goals: true,
    wallet: true,
    teacherWorkspace: false,
    groupLessons: false
  },
  teacher: {
    dashboard: true,
    shortStories: true,
    sentenceMining: true,
    canCreateShortStories: true,
    canUseSystemDecks: true,
    canUsePublicDecks: true,
    personalDeckLimit: null,
    connect: true,
    moments: true,
    voiceVideoRooms: true,
    findTeacher: true,
    mySchedule: true,
    maxLanguageProfiles: null,
    canEditLanguageProfiles: true,
    canDeleteLanguageProfiles: true,
    goals: true,
    wallet: true,
    teacherWorkspace: true,
    groupLessons: false
  },
  teacher_pro: {
    dashboard: true,
    shortStories: true,
    sentenceMining: true,
    canCreateShortStories: true,
    canUseSystemDecks: true,
    canUsePublicDecks: true,
    personalDeckLimit: null,
    connect: true,
    moments: true,
    voiceVideoRooms: true,
    findTeacher: true,
    mySchedule: true,
    maxLanguageProfiles: null,
    canEditLanguageProfiles: true,
    canDeleteLanguageProfiles: true,
    goals: true,
    wallet: true,
    teacherWorkspace: true,
    groupLessons: true
  }
};

const FEATURE_MESSAGES = {
  voiceVideoRooms: "Voice/Video Rooms require the Basic tier or higher.",
  teacherWorkspace: "Teacher workspace access requires the Teacher tier or Teacher Pro tier.",
  groupLessons: "Group lessons require the Teacher Pro tier.",
  canEditLanguageProfiles: "Free tier profiles cannot be changed.",
  canDeleteLanguageProfiles: "Free tier profiles cannot be deleted.",
  personalDeckLimit: "Free tier users can create one personal deck."
};

function normalizeLearnerPlan(value) {
  return Object.prototype.hasOwnProperty.call(LEARNER_PLANS, value) ? value : "free";
}

function normalizeTeacherPlan(value) {
  if (value === "starter") return "teacher";
  if (value === "pro") return "teacher_pro";
  return Object.prototype.hasOwnProperty.call(TEACHER_PLANS, value) ? value : "";
}

function effectivePlanKey(user = {}) {
  const teacherPlan = normalizeTeacherPlan(user.teacherSubscriptionTier || user.teacherPlanKey);
  if (teacherPlan) return teacherPlan;
  return normalizeLearnerPlan(user.learnerSubscriptionTier || user.subscriptionTier);
}

function subscriptionForUser(user = {}) {
  const learnerKey = normalizeLearnerPlan(user.learnerSubscriptionTier || user.subscriptionTier);
  const teacherKey = normalizeTeacherPlan(user.teacherSubscriptionTier || user.teacherPlanKey);
  const effectiveKey = teacherKey || learnerKey;
  return {
    learner: {
      ...LEARNER_PLANS[learnerKey],
      status: user.learnerSubscriptionStatus || user.subscriptionStatus || "active"
    },
    teacher: teacherKey
      ? {
          ...TEACHER_PLANS[teacherKey],
          status: user.teacherSubscriptionStatus || "active"
        }
      : null,
    effectivePlanKey: effectiveKey,
    effectivePlanName: PLAN_CAPABILITIES[effectiveKey]?.teacherWorkspace
      ? TEACHER_PLANS[effectiveKey].name
      : LEARNER_PLANS[effectiveKey].name,
    capabilities: { ...PLAN_CAPABILITIES[effectiveKey] }
  };
}

function hasCapability(user, capability) {
  return Boolean(subscriptionForUser(user).capabilities[capability]);
}

function planLimit(user, limitName) {
  return subscriptionForUser(user).capabilities[limitName];
}

function requireCapability(user, capability, message = FEATURE_MESSAGES[capability]) {
  if (hasCapability(user, capability)) return;
  const error = new Error(message || "Your subscription does not include this feature.");
  error.status = 402;
  throw error;
}

module.exports = {
  LEARNER_PLANS,
  TEACHER_PLANS,
  PLAN_CAPABILITIES,
  subscriptionForUser,
  effectivePlanKey,
  hasCapability,
  planLimit,
  requireCapability
};
