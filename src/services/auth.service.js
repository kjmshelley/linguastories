const crypto = require("crypto");
const { query, pool } = require("../db/pool");
const configService = require("./config.service");
const storageService = require("./storage.service");
const subscriptionPolicy = require("./subscription-policy.service");
const accountService = require("./account.service");

const SESSION_COOKIE = "lingua_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS);
const PASSWORD_ITERATIONS = Number(process.env.PASSWORD_ITERATIONS);
const MIN_PASSWORD_ITERATIONS = 210000;

if (!SESSION_DAYS || !PASSWORD_ITERATIONS) {
  throw new Error("SESSION_DAYS and PASSWORD_ITERATIONS are required.");
}
if (PASSWORD_ITERATIONS < MIN_PASSWORD_ITERATIONS) {
  throw new Error(`PASSWORD_ITERATIONS must be at least ${MIN_PASSWORD_ITERATIONS}.`);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [scheme, iterations, salt, hash] = String(storedHash || "").split("$");
  if (scheme !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256").toString("hex");
  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

function parseCookies(req) {
  const cookies = {};
  for (const cookie of String(req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)) {
    const index = cookie.indexOf("=");
    if (index <= 0) continue;
    try {
      cookies[decodeURIComponent(cookie.slice(0, index))] = decodeURIComponent(cookie.slice(index + 1));
    } catch (_error) {
      continue;
    }
  }
  return cookies;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sessionCookie(value, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "PROD") parts.push("Secure");
  return parts.join("; ");
}

function publicUserSql(whereClause) {
  return `select id,
                 email,
                 display_name as "displayName",
                 avatar,
                 case when avatar_box_file_id is not null then '/api/auth/avatar' else avatar_url end as "avatarUrl",
                 bio,
                 native_language as "nativeLanguage",
                 target_language as "targetLanguage",
                 current_level as "currentLevel",
                 timezone,
                 site_language as "siteLanguage",
                 currency,
	                 current_streak as "currentStreak",
	                 longest_streak as "longestStreak",
	                 listening_time as "listeningTime",
	                 coalesce(learner_subscription_tier, 'free') as "learnerSubscriptionTier",
	                 coalesce(learner_subscription_status, 'active') as "learnerSubscriptionStatus",
	                 ua.subscription_tier as "accountSubscriptionTier",
	                 ua.account_state as "accountState",
	                 ua.billing_status as "billingStatus",
	                 ua.subscription_status as "accountSubscriptionStatus",
	                 ua.trial_start_date as "trialStartDate",
	                 ua.trial_end_date as "trialEndDate",
	                 ua.subscription_start_date as "subscriptionStartDate",
	                 ua.renewal_date as "renewalDate",
	                 ua.cancellation_date as "cancellationDate",
	                 st.tier_key as "tierKey",
	                 st.name as "tierName",
	                 st.monthly_price_usd as "tierMonthlyPriceUsd",
	                 st.yearly_price_usd as "tierYearlyPriceUsd",
	                 st.trial_eligible as "tierTrialEligible",
	                 st.trial_length_days as "tierTrialLengthDays",
	                 st.permissions as "tierPermissions",
	                 st.feature_flags as "tierFeatureFlags",
	                 st.account_type as "tierAccountType"
	            from users
              left join user_accounts ua on ua.user_id = users.id
              left join subscription_tiers st on st.tier_key = ua.subscription_tier
	           ${whereClause}`;
}

async function attachLearningLanguages(user) {
  if (!user) return user;
  const languages = await query(
    `select language,
            current_level as "currentLevel",
            current_streak as "currentStreak",
            longest_streak as "longestStreak",
            listening_time as "listeningTime",
            coalesce(profile_visibility, 'Private') as "profileVisibility",
            active
       from user_languages
      where user_id = $1 and active = true
      order by active desc, created_at asc`,
    [user.id]
  );
  return { ...user, learningLanguages: languages.rows };
}

async function attachSubscription(user) {
  if (!user) return user;
  const teacher = await query(
    `select plan_key as "teacherSubscriptionTier",
            status as "teacherSubscriptionStatus"
       from teacher_subscriptions
      where user_id = $1
        and status in ('active', 'past_due', 'incomplete')
      order by updated_at desc
      limit 1`,
    [user.id]
  );
  const account = user.accountSubscriptionTier
    ? {
        userId: user.id,
        subscriptionTier: user.accountSubscriptionTier,
        accountState: user.accountState,
        billingStatus: user.billingStatus,
        subscriptionStatus: user.accountSubscriptionStatus,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        trialDaysRemaining: user.trialEndDate ? Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / 86400000)) : null,
        trialCancelled: user.accountState === "trial_cancelled",
        isTrial: ["trialing", "trial_cancelled"].includes(user.accountState),
        subscriptionStartDate: user.subscriptionStartDate,
        renewalDate: user.renewalDate,
        cancellationDate: user.cancellationDate,
        tier: {
          key: user.tierKey,
          name: user.tierName,
          monthlyPriceUsd: Number(user.tierMonthlyPriceUsd || 0),
          yearlyPriceUsd: Number(user.tierYearlyPriceUsd || 0),
          trialEligible: Boolean(user.tierTrialEligible),
          trialLengthDays: Number(user.tierTrialLengthDays || 0),
          permissions: Array.isArray(user.tierPermissions) ? user.tierPermissions : [],
          featureFlags: user.tierFeatureFlags || {},
          accountType: user.tierAccountType
        }
      }
    : null;
  const withTeacher = teacher.rows[0] ? { ...user, ...teacher.rows[0], account } : { ...user, account };
  return { ...withTeacher, subscription: subscriptionPolicy.subscriptionForUser(withTeacher) };
}

async function getUserById(userId) {
  const result = await query(publicUserSql("where id = $1"), [userId]);
  const user = await attachLearningLanguages(result.rows[0]);
  return attachSubscription(user);
}

async function getUserByEmail(email) {
  const result = await query(
    `select id,
            email,
            display_name as "displayName",
            password_hash as "passwordHash",
            avatar,
            case when avatar_box_file_id is not null then '/api/auth/avatar' else avatar_url end as "avatarUrl",
            bio,
            native_language as "nativeLanguage",
            target_language as "targetLanguage",
            current_level as "currentLevel",
            timezone,
            site_language as "siteLanguage",
            currency,
            current_streak as "currentStreak",
            longest_streak as "longestStreak",
            listening_time as "listeningTime",
            coalesce(learner_subscription_tier, 'free') as "learnerSubscriptionTier",
            coalesce(learner_subscription_status, 'active') as "learnerSubscriptionStatus",
            ua.subscription_tier as "accountSubscriptionTier",
            ua.account_state as "accountState",
            ua.billing_status as "billingStatus",
            ua.subscription_status as "accountSubscriptionStatus",
            ua.trial_start_date as "trialStartDate",
            ua.trial_end_date as "trialEndDate",
            ua.subscription_start_date as "subscriptionStartDate",
            ua.renewal_date as "renewalDate",
            ua.cancellation_date as "cancellationDate",
            st.tier_key as "tierKey",
            st.name as "tierName",
            st.monthly_price_usd as "tierMonthlyPriceUsd",
            st.yearly_price_usd as "tierYearlyPriceUsd",
            st.trial_eligible as "tierTrialEligible",
            st.trial_length_days as "tierTrialLengthDays",
            st.permissions as "tierPermissions",
            st.feature_flags as "tierFeatureFlags",
            st.account_type as "tierAccountType"
       from users
       left join user_accounts ua on ua.user_id = users.id
       left join subscription_tiers st on st.tier_key = ua.subscription_tier
      where lower(email) = lower($1)`,
    [email]
  );
  const user = result.rows[0];
  return user ? { ...(await attachSubscription(await attachLearningLanguages(user))), passwordHash: user.passwordHash } : user;
}

async function getAuthenticatedUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const result = await query(
    `select u.id
       from user_sessions s
       join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)]
  );
  if (!result.rows[0]) return null;
  return getUserById(result.rows[0].id);
}

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `insert into user_sessions (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt]
  );
  res.setHeader("Set-Cookie", sessionCookie(token, SESSION_DAYS * 24 * 60 * 60));
}

async function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) {
    await query("delete from user_sessions where token_hash = $1", [hashToken(token)]);
  }
  res.setHeader("Set-Cookie", sessionCookie("", 0));
}

async function registerUser(input, res) {
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const displayName = String(input.displayName || "").trim();
  const targetLanguage = String(input.targetLanguage || "").trim();
  const nativeLanguage = String(input.nativeLanguage || "").trim();
  const tierKey = String(input.tierKey || "").trim().toLowerCase();

  if (!email || !password || !displayName || !targetLanguage || !nativeLanguage || !tierKey) {
    const error = new Error("Name, email, password, native language, first learning language, and membership option are required");
    error.status = 400;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters");
    error.status = 400;
    throw error;
  }
  if (!(await configService.isSupportedLanguage(nativeLanguage)) || !(await configService.isSupportedLanguage(targetLanguage))) {
    const error = new Error("Please choose supported native and learning languages");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const user = await client.query(
      `insert into users
        (display_name, email, password_hash, avatar, native_language, target_language, current_level)
       values ($1, $2, $3, $4, $5, $6, 'A1')
       returning id`,
      [displayName, email, hashPassword(password), displayName.slice(0, 2).toUpperCase(), nativeLanguage, targetLanguage]
    );
    await client.query(
      `insert into user_languages (user_id, language, current_level, active)
       values ($1, $2, 'A1', true)`,
      [user.rows[0].id, targetLanguage]
    );
    await accountService.createAccountForUser(client, user.rows[0].id, tierKey);
    await client.query("commit");
    await createSession(res, user.rows[0].id);
    return getUserById(user.rows[0].id);
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") {
      error.message = "An account with that email already exists";
      error.status = 409;
    }
    throw error;
  } finally {
    client.release();
  }
}

async function loginUser(input, res) {
  const user = await getUserByEmail(input.email || "");
  if (!user || !verifyPassword(String(input.password || ""), user.passwordHash)) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }
  await createSession(res, user.id);
  return getUserById(user.id);
}

async function updateUserProfile(user, input) {
  const displayName = String(input.displayName || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const nativeLanguage = String(input.nativeLanguage || "").trim();
  const timezone = String(input.timezone || user.timezone || "UTC").trim() || "UTC";
  const siteLanguage = String(input.siteLanguage || user.siteLanguage || "en-US").trim();
  const currency = String(input.currency || user.currency || "USD").trim().toUpperCase();
  const bio = String(input.bio || "").trim();
  const avatar = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || displayName.slice(0, 2).toUpperCase();

  if (!displayName || !email || !nativeLanguage) {
    const error = new Error("Display name, email, and native language are required");
    error.status = 400;
    throw error;
  }
  if (!(await configService.isSupportedLanguage(nativeLanguage))) {
    const error = new Error("Please choose a supported native language");
    error.status = 400;
    throw error;
  }
  if (!new Set(["en-US", "es-ES", "fr-FR", "it-IT", "pt-PT", "nl-NL", "de-DE", "ru-RU", "zh-CN", "ja-JP", "ko-KR", "th-TH", "id-ID", "vi-VN", "ar-SA"]).has(siteLanguage)) {
    const error = new Error("Please choose a supported site language");
    error.status = 400;
    throw error;
  }
  if (!new Set(["USD", "EUR", "GBP", "JPY", "CNY", "TWD", "KRW", "CAD", "AUD", "SGD"]).has(currency)) {
    const error = new Error("Please choose a supported currency");
    error.status = 400;
    throw error;
  }

  try {
    await query(
      `update users
          set display_name = $2,
              email = $3,
              avatar = $4,
              bio = $5,
              native_language = $6,
              timezone = $7,
              site_language = $8,
              currency = $9
        where id = $1`,
      [user.id, displayName, email, avatar, bio, nativeLanguage, timezone, siteLanguage, currency]
    );
  } catch (error) {
    if (error.code === "23505") {
      error.message = "An account with that email already exists";
      error.status = 409;
    }
    throw error;
  }

  return getUserById(user.id);
}

async function uploadUserAvatar(user, input) {
  const previousAvatar = await query("select avatar_box_file_id from users where id = $1", [user.id]);
  const previousAvatarKey = previousAvatar.rows[0]?.avatar_box_file_id || "";
  const result = await storageService.uploadUserAvatar({
    userId: user.id,
    fileName: input.fileName,
    dataUrl: input.dataUrl
  });

  await query(
    `update users
        set avatar_url = $2,
            avatar_box_file_id = $3
      where id = $1`,
    [user.id, result.url, result.boxFileId]
  );

  if (previousAvatarKey && previousAvatarKey !== result.boxFileId) {
    try {
      await storageService.deleteStoredFile(previousAvatarKey);
    } catch (error) {
      console.warn("Could not delete previous avatar file");
    }
  }

  return getUserById(user.id);
}

async function getUserAvatar(user) {
  const result = await query("select avatar_box_file_id from users where id = $1", [user.id]);
  const avatarBoxFileId = result.rows[0]?.avatar_box_file_id || "";
  if (!avatarBoxFileId) {
    const error = new Error("Profile picture not found");
    error.status = 404;
    throw error;
  }
  return storageService.downloadBoxFile(avatarBoxFileId);
}

async function deleteUserProfile(user) {
  await query("delete from users where id = $1", [user.id]);
}

module.exports = {
  hashPassword,
  getUserById,
  getUserByEmail,
  getAuthenticatedUser,
  registerUser,
  loginUser,
  updateUserProfile,
  uploadUserAvatar,
  getUserAvatar,
  deleteUserProfile,
  destroySession
};
