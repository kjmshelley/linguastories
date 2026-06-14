const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateBody } = require("../middleware/validation.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

const tierChangeSchema = {
  tierKey: { type: "string", required: true, max: 40, label: "Tier" }
};

function requireJobSecret(req, _res, next) {
  if (!process.env.ACCOUNT_JOB_SECRET) {
    const error = new Error("Account jobs are not configured for HTTP execution");
    error.status = 404;
    throw error;
  }
  if (req.headers["x-account-job-secret"] !== process.env.ACCOUNT_JOB_SECRET) {
    const error = new Error("Account job secret is invalid");
    error.status = 403;
    throw error;
  }
  next();
}

router.get("/account/tiers", asyncHandler(accountController.tiers));
router.get("/account", requireAuth, asyncHandler(accountController.summary));
router.post("/account/tier", requireAuth, validateBody(tierChangeSchema), asyncHandler(accountController.changeTier));
router.post("/account/trial/cancel", requireAuth, asyncHandler(accountController.cancelTrial));
router.post("/account/reactivate", requireAuth, validateBody(tierChangeSchema), asyncHandler(accountController.reactivate));
router.post("/account/jobs/trials", requireJobSecret, asyncHandler(accountController.processTrials));
router.post("/account/jobs/renewals", requireJobSecret, asyncHandler(accountController.processRenewals));
router.post("/account/jobs/reconcile", requireJobSecret, asyncHandler(accountController.reconcile));

module.exports = router;
