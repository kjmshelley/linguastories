const assert = require("node:assert/strict");
const test = require("node:test");
const subscriptionPolicy = require("../src/services/subscription-policy.service");

function userWithAccount(accountState, tierOverrides = {}) {
  return {
    account: {
      accountState,
      billingStatus: accountState === "trialing" ? "trialing" : accountState,
      subscriptionStatus: accountState === "trialing" ? "trialing" : accountState,
      tier: {
        key: "teacher",
        name: "Teacher",
        monthlyPriceUsd: 0,
        permissions: ["teacher_workspace"],
        featureFlags: {
          voiceVideoRooms: true,
          teacherWorkspace: true,
          groupLessons: false,
          canEditLanguageProfiles: true,
          canDeleteLanguageProfiles: true,
          maxLanguageProfiles: null
        },
        accountType: "teacher",
        ...tierOverrides
      }
    }
  };
}

test("active teacher accounts receive teacher capabilities", () => {
  const subscription = subscriptionPolicy.subscriptionForUser(userWithAccount("active"));
  assert.equal(subscription.effectivePlanKey, "teacher");
  assert.equal(subscription.capabilities.teacherWorkspace, true);
  assert.equal(subscription.learner.key, "free");
});

test("deactivated teacher accounts lose teacher feature access", () => {
  const subscription = subscriptionPolicy.subscriptionForUser(userWithAccount("deactivated"));
  assert.equal(subscription.capabilities.voiceVideoRooms, false);
  assert.equal(subscription.capabilities.teacherWorkspace, false);
  assert.equal(subscription.capabilities.maxLanguageProfiles, 10);
});

test("free account capabilities remain free membership scoped", () => {
  const subscription = subscriptionPolicy.subscriptionForUser(
    userWithAccount("active", {
      key: "free",
      name: "Free Membership",
      monthlyPriceUsd: 0,
      permissions: ["connect"],
      featureFlags: {
        voiceVideoRooms: true,
        connect: true,
        communityPosts: true,
        maxLanguageProfiles: 10
      }
    })
  );
  assert.equal(subscription.effectivePlanKey, "free");
  assert.equal(subscription.capabilities.voiceVideoRooms, true);
  assert.equal(subscription.capabilities.maxLanguageProfiles, 10);
});

test("active teacher profiles unlock the teacher workspace on free accounts", () => {
  const subscription = subscriptionPolicy.subscriptionForUser({
    ...userWithAccount("active", {
      key: "free",
      name: "Free Membership",
      monthlyPriceUsd: 0,
      permissions: ["connect"],
      featureFlags: {
        voiceVideoRooms: true,
        connect: true,
        communityPosts: true,
        maxLanguageProfiles: 10,
        teacherWorkspace: false
      }
    }),
    hasActiveTeacherProfile: true
  });
  assert.equal(subscription.effectivePlanKey, "free");
  assert.equal(subscription.capabilities.teacherWorkspace, true);
});

test("inactive accounts do not receive teacher workspace from an active teacher profile", () => {
  const subscription = subscriptionPolicy.subscriptionForUser({
    ...userWithAccount("deactivated"),
    hasActiveTeacherProfile: true
  });
  assert.equal(subscription.capabilities.teacherWorkspace, false);
});
