const crypto = require("crypto");
const { pool, query } = require("../db/pool");
const { securityLog } = require("../utils/security-log");

const PROVIDER = "stripe";
const ACTIVE_ACCESS_STATES = new Set(["active", "trialing", "trial_cancelled"]);
const PAID_ACCESS_STATES = new Set(["active", "trialing", "trial_cancelled"]);

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function dollars(value) {
  return Number(value || 0);
}

function daysRemaining(endDate) {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function addDays(date, days) {
  return new Date(date.getTime() + Number(days || 0) * 86400000);
}

function mapTier(row) {
  if (!row) return null;
  return {
    key: row.tierKey,
    name: row.name,
    monthlyPriceUsd: dollars(row.monthlyPriceUsd),
    yearlyPriceUsd: dollars(row.yearlyPriceUsd),
    trialEligible: Boolean(row.trialEligible),
    trialLengthDays: Number(row.trialLengthDays || 0),
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    featureFlags: row.featureFlags || {},
    accountType: row.accountType,
    signupVisible: Boolean(row.signupVisible),
    active: Boolean(row.active),
    sortOrder: Number(row.sortOrder || 0),
    paymentProviderPriceIdMonthly: row.paymentProviderPriceIdMonthly || "",
    paymentProviderPriceIdYearly: row.paymentProviderPriceIdYearly || ""
  };
}

function mapAccount(row) {
  if (!row) return null;
  const tier = mapTier(row);
  const trialDaysRemaining = daysRemaining(row.trialEndDate);
  const isTrial = ["trialing", "trial_cancelled"].includes(row.accountState);
  return {
    userId: row.userId,
    tier,
    subscriptionTier: row.subscriptionTier,
    accountState: row.accountState,
    billingStatus: row.billingStatus,
    subscriptionStatus: row.subscriptionStatus,
    trialStartDate: row.trialStartDate,
    trialEndDate: row.trialEndDate,
    trialDaysRemaining,
    trialCancelled: row.accountState === "trial_cancelled",
    isTrial,
    hasPaymentMethod: Boolean(row.paymentProviderPaymentMethodId || row.defaultPaymentMethodId),
    subscriptionStartDate: row.subscriptionStartDate,
    renewalDate: row.renewalDate,
    cancellationDate: row.cancellationDate,
    paymentProviderCustomerId: row.paymentProviderCustomerId || "",
    paymentProviderSubscriptionId: row.paymentProviderSubscriptionId || "",
    paymentProviderPaymentMethodId: row.paymentProviderPaymentMethodId || row.defaultPaymentMethodId || "",
    canAccessPaidFeatures: tier?.monthlyPriceUsd === 0 ? row.accountState === "active" : PAID_ACCESS_STATES.has(row.accountState),
    canChangeTier: row.accountState === "active" && row.subscriptionStatus === "active",
    canReactivate: ["deactivated", "past_due", "canceled"].includes(row.accountState),
    canCancelTrial: row.accountState === "trialing",
    trialExpirationMessage: isTrial
      ? row.paymentProviderPaymentMethodId || row.defaultPaymentMethodId
        ? "Your saved payment method will be charged when the trial ends."
        : "Add a payment method before the trial ends to keep paid features active."
      : ""
  };
}

function accountSelect(whereClause) {
  return `
    select ua.user_id as "userId",
           ua.subscription_tier as "subscriptionTier",
           ua.account_state as "accountState",
           ua.billing_status as "billingStatus",
           ua.subscription_status as "subscriptionStatus",
           ua.trial_start_date as "trialStartDate",
           ua.trial_end_date as "trialEndDate",
           ua.subscription_start_date as "subscriptionStartDate",
           ua.renewal_date as "renewalDate",
           ua.cancellation_date as "cancellationDate",
           ua.payment_provider_customer_id as "paymentProviderCustomerId",
           ua.payment_provider_subscription_id as "paymentProviderSubscriptionId",
           ua.payment_provider_payment_method_id as "paymentProviderPaymentMethodId",
           bpm.provider_payment_method_id as "defaultPaymentMethodId",
           st.tier_key as "tierKey",
           st.name,
           st.monthly_price_usd as "monthlyPriceUsd",
           st.yearly_price_usd as "yearlyPriceUsd",
           st.trial_eligible as "trialEligible",
           st.trial_length_days as "trialLengthDays",
           st.permissions,
           st.feature_flags as "featureFlags",
           st.account_type as "accountType",
           st.signup_visible as "signupVisible",
           st.active,
           st.sort_order as "sortOrder",
           st.payment_provider_price_id_monthly as "paymentProviderPriceIdMonthly",
           st.payment_provider_price_id_yearly as "paymentProviderPriceIdYearly"
      from user_accounts ua
      join subscription_tiers st on st.tier_key = ua.subscription_tier
      left join billing_payment_methods bpm on bpm.user_id = ua.user_id and bpm.is_default = true and bpm.status = 'active'
     ${whereClause}`;
}

async function listTiers({ signupVisibleOnly = false } = {}) {
  const result = await query(
    `select tier_key as "tierKey",
            name,
            monthly_price_usd as "monthlyPriceUsd",
            yearly_price_usd as "yearlyPriceUsd",
            trial_eligible as "trialEligible",
            trial_length_days as "trialLengthDays",
            permissions,
            feature_flags as "featureFlags",
            account_type as "accountType",
            signup_visible as "signupVisible",
            active,
            sort_order as "sortOrder",
            payment_provider_price_id_monthly as "paymentProviderPriceIdMonthly",
            payment_provider_price_id_yearly as "paymentProviderPriceIdYearly"
       from subscription_tiers
      where active = true
        and ($1::boolean = false or signup_visible = true)
      order by sort_order, monthly_price_usd, tier_key`,
    [signupVisibleOnly]
  );
  return result.rows.map(mapTier);
}

async function getTier(tierKey, client = { query }) {
  const result = await client.query(
    `select tier_key as "tierKey",
            name,
            monthly_price_usd as "monthlyPriceUsd",
            yearly_price_usd as "yearlyPriceUsd",
            trial_eligible as "trialEligible",
            trial_length_days as "trialLengthDays",
            permissions,
            feature_flags as "featureFlags",
            account_type as "accountType",
            signup_visible as "signupVisible",
            active,
            sort_order as "sortOrder",
            payment_provider_price_id_monthly as "paymentProviderPriceIdMonthly",
            payment_provider_price_id_yearly as "paymentProviderPriceIdYearly"
       from subscription_tiers
      where tier_key = $1 and active = true`,
    [tierKey]
  );
  return mapTier(result.rows[0]);
}

async function getAccount(userId) {
  const result = await query(accountSelect("where ua.user_id = $1"), [userId]);
  return mapAccount(result.rows[0]);
}

async function accountSummary(userId) {
  const account = await getAccount(userId);
  const [tiers, methods, invoices, events] = await Promise.all([
    listTiers(),
    query(
      `select provider_payment_method_id as "providerPaymentMethodId",
              brand,
              last4,
              exp_month as "expMonth",
              exp_year as "expYear",
              is_default as "isDefault",
              status,
              created_at as "createdAt"
         from billing_payment_methods
        where user_id = $1
        order by is_default desc, created_at desc`,
      [userId]
    ),
    query(
      `select provider_invoice_id as "providerInvoiceId",
              amount_due_usd as "amountDueUsd",
              amount_paid_usd as "amountPaidUsd",
              status,
              hosted_invoice_url as "hostedInvoiceUrl",
              period_start as "periodStart",
              period_end as "periodEnd",
              created_at as "createdAt"
         from billing_invoices
        where user_id = $1
        order by created_at desc
        limit 20`,
      [userId]
    ),
    query(
      `select event_type as "eventType",
              metadata,
              created_at as "createdAt"
         from account_events
        where user_id = $1
        order by created_at desc
        limit 20`,
      [userId]
    )
  ]);
  return {
    account,
    tiers,
    paymentMethods: methods.rows,
    invoices: invoices.rows.map((row) => ({
      ...row,
      amountDueUsd: dollars(row.amountDueUsd),
      amountPaidUsd: dollars(row.amountPaidUsd)
    })),
    billingHistory: events.rows
  };
}

async function logEvent(client, userId, eventType, metadata = {}) {
  await client.query(
    `insert into account_events (user_id, event_type, metadata)
     values ($1, $2, $3)`,
    [userId, eventType, metadata]
  );
}

async function queueNotification(client, userId, type, title, body, tone = "neutral") {
  const notification = await client.query(
    `insert into account_notifications (user_id, type, title, body, tone, email_queued)
     values ($1, $2, $3, $4, $5, true)
     returning id`,
    [userId, type, title, body, tone]
  );
  const user = await client.query("select email from users where id = $1", [userId]);
  if (user.rows[0]?.email) {
    await client.query(
      `insert into email_notification_queue (user_id, notification_id, recipient_email, subject, body)
       values ($1, $2, $3, $4, $5)`,
      [userId, notification.rows[0].id, user.rows[0].email, title, body]
    );
  }
}

async function createAccountForUser(client, userId, requestedTierKey) {
  const tierKey = String(requestedTierKey || "free").trim().toLowerCase();
  const tier = await getTier(tierKey, client);
  if (!tier || !tier.signupVisible) throw serviceError("Choose a valid account tier", 400);

  const now = new Date();
  const startsTrial = tier.monthlyPriceUsd > 0 && tier.trialEligible && tier.trialLengthDays > 0;
  const trialEnd = startsTrial ? addDays(now, tier.trialLengthDays) : null;
  await client.query(
    `insert into user_accounts (
       user_id, subscription_tier, account_state, billing_status, subscription_status,
       trial_start_date, trial_end_date, subscription_start_date
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      tier.key,
      startsTrial ? "trialing" : "active",
      startsTrial ? "trialing" : "none",
      startsTrial ? "trialing" : "none",
      startsTrial ? now : null,
      trialEnd,
      startsTrial ? null : now
    ]
  );
  await syncLegacySubscriptionColumns(client, userId, tier.key, startsTrial ? "active" : "active");
  await logEvent(client, userId, startsTrial ? "trial_started" : "account_created", { tier: tier.key });
  await queueNotification(
    client,
    userId,
    startsTrial ? "trial_started" : "account_created",
    startsTrial ? "Trial started" : "Account created",
    startsTrial ? `${tier.name} is active for ${tier.trialLengthDays} days. Add a payment method before the trial ends to keep paid features active.` : `${tier.name} is active.`,
    startsTrial ? "good" : "neutral"
  );
  return tier;
}

async function syncLegacySubscriptionColumns(client, userId, tierKey, status) {
  const learnerTier = tierKey === "free" || tierKey === "basic" ? tierKey : "basic";
  const learnerStatus = status === "past_due" ? "past_due" : status === "canceled" ? "canceled" : "active";
  await client.query(
    `update users
        set learner_subscription_tier = $2,
            learner_subscription_status = $3
      where id = $1`,
    [userId, learnerTier, learnerStatus]
  );
  if (tierKey === "teacher" || tierKey === "teacher_pro") {
    await client.query(
      `insert into teacher_subscriptions (user_id, plan_key, status, current_period_end, created_at, updated_at)
       values ($1, $2, $3, now() + interval '30 days', now(), now())
       on conflict (user_id) where status in ('active', 'past_due', 'incomplete') do update
          set plan_key = excluded.plan_key,
              status = excluded.status,
              updated_at = now()`,
      [userId, tierKey, learnerStatus === "past_due" ? "past_due" : "active"]
    );
  }
}

async function changeTier(user, requestedTierKey, { immediatePayment = true } = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const current = mapAccount((await client.query(accountSelect("where ua.user_id = $1 for update of ua"), [user.id])).rows[0]);
    if (!current) throw serviceError("Account record is missing", 404);
    if (!current.canChangeTier) throw serviceError("Trial or inactive accounts cannot change tiers.", 409);
    const nextTier = await getTier(String(requestedTierKey || "").trim().toLowerCase(), client);
    if (!nextTier) throw serviceError("Choose a valid account tier", 400);
    if (nextTier.key === current.subscriptionTier) throw serviceError("You are already on this tier.", 400);
    const isUpgrade = nextTier.monthlyPriceUsd > current.tier.monthlyPriceUsd;
    if (isUpgrade && immediatePayment && nextTier.monthlyPriceUsd > 0 && !current.hasPaymentMethod && process.env.STRIPE_SECRET_KEY) {
      throw serviceError("Add a payment method before upgrading.", 402);
    }
    await client.query(
      `update user_accounts
          set subscription_tier = $2,
              account_state = 'active',
              billing_status = case when $3::numeric > 0 then 'active' else 'none' end,
              subscription_status = case when $3::numeric > 0 then 'active' else 'none' end,
              trial_start_date = null,
              trial_end_date = null,
              subscription_start_date = coalesce(subscription_start_date, now()),
              renewal_date = case when $3::numeric > 0 then coalesce(renewal_date, now() + interval '30 days') else null end,
              cancellation_date = null,
              updated_at = now()
        where user_id = $1`,
      [user.id, nextTier.key, nextTier.monthlyPriceUsd]
    );
    await syncLegacySubscriptionColumns(client, user.id, nextTier.key, "active");
    await logEvent(client, user.id, isUpgrade ? "subscription_upgraded" : "subscription_downgraded", { from: current.subscriptionTier, to: nextTier.key });
    await queueNotification(client, user.id, isUpgrade ? "subscription_upgraded" : "subscription_downgraded", isUpgrade ? "Subscription upgraded" : "Subscription downgraded", `${nextTier.name} is now active.`, "good");
    await client.query("commit");
    return accountSummary(user.id);
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function cancelTrial(user) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const account = mapAccount((await client.query(accountSelect("where ua.user_id = $1 for update of ua"), [user.id])).rows[0]);
    if (!account?.canCancelTrial) throw serviceError("Only active trials can be cancelled.", 409);
    await client.query(
      `update user_accounts
          set account_state = 'trial_cancelled',
              cancellation_date = now(),
              updated_at = now()
        where user_id = $1`,
      [user.id]
    );
    await logEvent(client, user.id, "trial_cancelled", { tier: account.subscriptionTier });
    await queueNotification(client, user.id, "subscription_cancelled", "Trial cancelled", "Your trial access stays active until the trial end date.", "neutral");
    await client.query("commit");
    return accountSummary(user.id);
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function reactivate(user, requestedTierKey) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const account = mapAccount((await client.query(accountSelect("where ua.user_id = $1 for update of ua"), [user.id])).rows[0]);
    if (!account?.canReactivate) throw serviceError("This account is not eligible for reactivation.", 409);
    const tier = await getTier(requestedTierKey || account.subscriptionTier, client);
    if (!tier) throw serviceError("Choose a valid account tier", 400);
    await client.query(
      `update user_accounts
          set subscription_tier = $2,
              account_state = 'active',
              billing_status = case when $3::numeric > 0 then 'active' else 'none' end,
              subscription_status = case when $3::numeric > 0 then 'active' else 'none' end,
              trial_start_date = null,
              trial_end_date = null,
              subscription_start_date = now(),
              renewal_date = case when $3::numeric > 0 then now() + interval '30 days' else null end,
              cancellation_date = null,
              updated_at = now()
        where user_id = $1`,
      [user.id, tier.key, tier.monthlyPriceUsd]
    );
    await syncLegacySubscriptionColumns(client, user.id, tier.key, "active");
    await logEvent(client, user.id, "account_reactivated", { tier: tier.key });
    await queueNotification(client, user.id, "account_reactivated", "Account reactivated", `${tier.name} is active again.`, "good");
    await client.query("commit");
    return accountSummary(user.id);
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function deactivateForTrialExpiry(client, account, reason = "trial_expired") {
  await client.query(
    `update user_accounts
        set account_state = 'deactivated',
            billing_status = 'payment_required',
            subscription_status = 'incomplete',
            updated_at = now()
      where user_id = $1`,
    [account.userId]
  );
  await syncLegacySubscriptionColumns(client, account.userId, "free", "canceled");
  await logEvent(client, account.userId, reason, { tier: account.subscriptionTier });
  await queueNotification(client, account.userId, "payment_required", "Payment required", "Your trial ended. Add a payment method or downgrade to Free to continue.", "urgent");
}

async function processTrialExpirations() {
  const client = await pool.connect();
  let processed = 0;
  try {
    await client.query("begin");
    const result = await client.query(`${accountSelect("where ua.account_state in ('trialing', 'trial_cancelled') and ua.trial_end_date <= now() for update of ua")}`);
    for (const row of result.rows) {
      const account = mapAccount(row);
      if (account.hasPaymentMethod) {
        await client.query(
          `update user_accounts
              set account_state = 'active',
                  billing_status = 'active',
                  subscription_status = 'active',
                  trial_start_date = null,
                  trial_end_date = null,
                  subscription_start_date = now(),
                  renewal_date = now() + interval '30 days',
                  updated_at = now()
            where user_id = $1`,
          [account.userId]
        );
        await syncLegacySubscriptionColumns(client, account.userId, account.subscriptionTier, "active");
        await logEvent(client, account.userId, "payment_successful", { source: "trial_expiration", tier: account.subscriptionTier });
        await queueNotification(client, account.userId, "payment_successful", "Payment successful", "Your subscription is active.", "good");
      } else {
        await deactivateForTrialExpiry(client, account);
      }
      processed += 1;
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
  return { processed };
}

async function processRenewals() {
  const result = await query(
    `insert into account_events (user_id, event_type, metadata)
     select user_id, 'subscription_renewal_checked', jsonb_build_object('renewalDate', renewal_date)
       from user_accounts
      where subscription_status = 'active'
        and renewal_date is not null
        and renewal_date <= now()
     returning id`
  );
  return { processed: result.rowCount };
}

async function reconcileProviderState() {
  const result = await query(
    `insert into account_events (user_id, event_type, metadata)
     select user_id, 'subscription_status_synchronized', jsonb_build_object('provider', 'stripe')
       from user_accounts
      where payment_provider_subscription_id is not null
     returning id`
  );
  return { processed: result.rowCount };
}

async function listAccountNotifications(userId) {
  const result = await query(
    `select type,
            type as label,
            title,
            body,
            tone,
            created_at as "createdAt"
       from account_notifications
      where user_id = $1
      order by created_at desc
      limit 10`,
    [userId]
  );
  return result.rows;
}

function verifyStripeSignature(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const timestamp = String(signature).split(",").find((part) => part.startsWith("t="))?.slice(2);
  const expected = String(signature).split(",").find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !expected) return false;
  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return digest.length === expected.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

async function handleStripeWebhook(req) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw serviceError("Stripe webhook is not configured", 500);
  const signature = req.headers["stripe-signature"];
  if (!Buffer.isBuffer(req.body) || !verifyStripeSignature(req.body, signature)) throw serviceError("Invalid Stripe webhook signature", 400);
  const event = JSON.parse(req.body.toString("utf8"));
  const client = await pool.connect();
  try {
    await client.query("begin");
    const inserted = await client.query(
      `insert into billing_webhook_events (provider, provider_event_id, event_type, payload)
       values ($1, $2, $3, $4)
       on conflict (provider, provider_event_id) do nothing`,
      [PROVIDER, event.id, event.type, event]
    );
    if (!inserted.rowCount) {
      await client.query("commit");
      return { received: true, duplicate: true };
    }
    const object = event.data?.object || {};
    const customerId = object.customer || object.customer_id;
    if (customerId) {
      const accountResult = await client.query(accountSelect("where ua.payment_provider_customer_id = $1 for update of ua"), [customerId]);
      const account = mapAccount(accountResult.rows[0]);
      if (account) await applyProviderEvent(client, account, event.type, object);
    }
    await client.query("commit");
    return { received: true };
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function applyProviderEvent(client, account, eventType, object) {
  if (eventType === "invoice.payment_succeeded" || eventType === "checkout.session.completed") {
    await client.query(
      `update user_accounts
          set account_state = 'active',
              billing_status = 'active',
              subscription_status = 'active',
              trial_start_date = null,
              trial_end_date = null,
              subscription_start_date = coalesce(subscription_start_date, now()),
              renewal_date = coalesce(to_timestamp(($2::bigint)), now() + interval '30 days'),
              payment_provider_subscription_id = coalesce($3, payment_provider_subscription_id),
              updated_at = now()
        where user_id = $1`,
      [account.userId, object.lines?.data?.[0]?.period?.end || object.current_period_end || null, object.subscription || object.id || null]
    );
    await syncLegacySubscriptionColumns(client, account.userId, account.subscriptionTier, "active");
    await logEvent(client, account.userId, "payment_successful", { providerEvent: eventType });
    await queueNotification(client, account.userId, "payment_successful", "Payment successful", "Your subscription payment was received.", "good");
  }
  if (eventType === "invoice.payment_failed") {
    await client.query(
      `update user_accounts
          set account_state = 'past_due',
              billing_status = 'past_due',
              subscription_status = 'past_due',
              updated_at = now()
        where user_id = $1`,
      [account.userId]
    );
    await syncLegacySubscriptionColumns(client, account.userId, account.subscriptionTier, "past_due");
    await logEvent(client, account.userId, "payment_failed", { providerEvent: eventType });
    await queueNotification(client, account.userId, "payment_failed", "Payment failed", "Update your payment method to keep paid features active.", "urgent");
  }
  if (eventType === "customer.subscription.deleted") {
    await client.query(
      `update user_accounts
          set account_state = 'canceled',
              billing_status = 'canceled',
              subscription_status = 'canceled',
              cancellation_date = now(),
              updated_at = now()
        where user_id = $1`,
      [account.userId]
    );
    await syncLegacySubscriptionColumns(client, account.userId, "free", "canceled");
    await logEvent(client, account.userId, "subscription_cancelled", { providerEvent: eventType });
    await queueNotification(client, account.userId, "subscription_cancelled", "Subscription cancelled", "Paid features are no longer active.", "neutral");
  }
}

function accountFromUser(user = {}) {
  return user.account || user.subscription?.account || null;
}

function canUsePaidFeatures(user = {}) {
  const account = accountFromUser(user);
  if (!account) return true;
  if (!ACTIVE_ACCESS_STATES.has(account.accountState)) return false;
  if (account.tier?.monthlyPriceUsd > 0) return PAID_ACCESS_STATES.has(account.accountState);
  return account.accountState === "active";
}

module.exports = {
  listTiers,
  getTier,
  getAccount,
  accountSummary,
  createAccountForUser,
  changeTier,
  cancelTrial,
  reactivate,
  processTrialExpirations,
  processRenewals,
  reconcileProviderState,
  listAccountNotifications,
  handleStripeWebhook,
  canUsePaidFeatures,
  mapTier,
  mapAccount
};
