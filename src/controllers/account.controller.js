const accountService = require("../services/account.service");
const authService = require("../services/auth.service");
const learningService = require("../services/learning.service");

async function tiers(_req, res) {
  res.json({ tiers: await accountService.listTiers({ signupVisibleOnly: true }) });
}

async function summary(req, res) {
  res.json(await accountService.accountSummary(req.user.id));
}

async function changeTier(req, res) {
  await accountService.changeTier(req.user, req.body.tierKey);
  res.json(await learningService.getState(await authService.getUserById(req.user.id)));
}

async function cancelTrial(req, res) {
  await accountService.cancelTrial(req.user);
  res.json(await learningService.getState(await authService.getUserById(req.user.id)));
}

async function reactivate(req, res) {
  await accountService.reactivate(req.user, req.body.tierKey);
  res.json(await learningService.getState(await authService.getUserById(req.user.id)));
}

async function processTrials(_req, res) {
  res.json(await accountService.processTrialExpirations());
}

async function processRenewals(_req, res) {
  res.json(await accountService.processRenewals());
}

async function reconcile(_req, res) {
  res.json(await accountService.reconcileProviderState());
}

async function stripeWebhook(req, res) {
  res.json(await accountService.handleStripeWebhook(req));
}

module.exports = {
  tiers,
  summary,
  changeTier,
  cancelTrial,
  reactivate,
  processTrials,
  processRenewals,
  reconcile,
  stripeWebhook
};
