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
        key: "basic",
        name: "Basic Tier",
        monthlyPriceUsd: 2.99,
        permissions: ["voice_video_rooms"],
        featureFlags: {
          voiceVideoRooms: true,
          teacherWorkspace: false,
          groupLessons: false,
          canCreateShortStories: true,
          canEditLanguageProfiles: true,
          canDeleteLanguageProfiles: true,
          maxLanguageProfiles: null,
          personalDeckLimit: null
        },
        accountType: "learner",
        ...tierOverrides
      }
    }
  };
}

test("trialing paid accounts receive selected tier capabilities", () => {
  const subscription = subscriptionPolicy.subscriptionForUser(userWithAccount("trialing"));
  assert.equal(subscription.effectivePlanKey, "basic");
  assert.equal(subscription.capabilities.voiceVideoRooms, true);
  assert.equal(subscription.capabilities.canEditLanguageProfiles, true);
});

test("deactivated paid accounts lose paid feature access", () => {
  const subscription = subscriptionPolicy.subscriptionForUser(userWithAccount("deactivated"));
  assert.equal(subscription.capabilities.voiceVideoRooms, false);
  assert.equal(subscription.capabilities.canCreateShortStories, false);
  assert.equal(subscription.capabilities.personalDeckLimit, 1);
});

test("free account capabilities remain free-tier scoped", () => {
  const subscription = subscriptionPolicy.subscriptionForUser(
    userWithAccount("active", {
      key: "free",
      name: "Free Tier",
      monthlyPriceUsd: 0,
      permissions: ["read_stories"],
      featureFlags: {
        voiceVideoRooms: false,
        canCreateShortStories: false,
        maxLanguageProfiles: 1,
        personalDeckLimit: 1
      }
    })
  );
  assert.equal(subscription.effectivePlanKey, "free");
  assert.equal(subscription.capabilities.voiceVideoRooms, false);
  assert.equal(subscription.capabilities.maxLanguageProfiles, 1);
});
