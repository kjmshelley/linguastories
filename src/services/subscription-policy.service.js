const LEARNER_PLANS = {
  free: {
    key: "free",
    name: "Free Membership",
    monthlyPriceUsd: 0
  }
};

const TEACHER_PLANS = {
  teacher: {
    key: "teacher",
    name: "Teacher",
    monthlyPriceUsd: 0
  }
};

const PLAN_CAPABILITIES = {
  free: {
    dashboard: true,
    connect: true,
    communityPosts: true,
    voiceVideoRooms: true,
    findTeacher: true,
    mySchedule: true,
    maxLanguageProfiles: 10,
    canEditLanguageProfiles: true,
    canDeleteLanguageProfiles: true,
    teacherWorkspace: false,
    groupLessons: false
  },
  teacher: {
    dashboard: true,
    connect: true,
    communityPosts: true,
    voiceVideoRooms: true,
    findTeacher: true,
    mySchedule: true,
    maxLanguageProfiles: null,
    canEditLanguageProfiles: true,
    canDeleteLanguageProfiles: true,
    teacherWorkspace: true,
    groupLessons: false
  }
};

const FEATURE_MESSAGES = {
  voiceVideoRooms: "Voice/Video Rooms are unavailable.",
  teacherWorkspace: "Teacher workspace access requires an active Teacher profile.",
  groupLessons: "Group lessons are unavailable.",
  canEditLanguageProfiles: "Language editing is unavailable.",
  canDeleteLanguageProfiles: "Language removal is unavailable."
};

const INACTIVE_ACCOUNT_STATES = new Set(["past_due", "deactivated", "canceled"]);

function normalizeLearnerPlan(value) {
  return Object.prototype.hasOwnProperty.call(LEARNER_PLANS, value) ? value : "free";
}

function normalizeTeacherPlan(value) {
  return Object.prototype.hasOwnProperty.call(TEACHER_PLANS, value) ? value : "";
}

function effectivePlanKey(user = {}) {
  const teacherPlan = normalizeTeacherPlan(user.teacherSubscriptionTier || user.teacherPlanKey);
  if (teacherPlan) return teacherPlan;
  return normalizeLearnerPlan(user.learnerSubscriptionTier || user.subscriptionTier);
}

function subscriptionForUser(user = {}) {
  if (user.account?.tier) {
    const tier = user.account.tier;
    const accountState = user.account.accountState || "active";
    const billingStatus = user.account.billingStatus || "none";
    const paidAccess = !INACTIVE_ACCOUNT_STATES.has(accountState);
    const capabilities = paidAccess ? { ...tier.featureFlags } : { ...PLAN_CAPABILITIES.free };
    if (!paidAccess) {
      capabilities.voiceVideoRooms = false;
      capabilities.teacherWorkspace = false;
      capabilities.groupLessons = false;
      capabilities.canEditLanguageProfiles = true;
      capabilities.canDeleteLanguageProfiles = true;
      capabilities.maxLanguageProfiles = 10;
    }
    return {
      learner: {
        key: tier.accountType === "learner" ? tier.key : "free",
        name: tier.accountType === "learner" ? tier.name : LEARNER_PLANS.free.name,
        monthlyPriceUsd: tier.accountType === "learner" ? tier.monthlyPriceUsd : LEARNER_PLANS.free.monthlyPriceUsd,
        status: billingStatus
      },
      teacher: tier.accountType === "teacher"
        ? {
            key: tier.key,
            name: tier.name,
            monthlyPriceUsd: tier.monthlyPriceUsd,
            status: billingStatus
          }
        : null,
      account: user.account,
      effectivePlanKey: tier.key,
      effectivePlanName: tier.name,
      permissions: [...tier.permissions],
      capabilities
    };
  }
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
