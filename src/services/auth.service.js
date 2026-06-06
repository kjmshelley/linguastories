const crypto = require("crypto");
const { query, pool } = require("../db/pool");
const configService = require("./config.service");
const storageService = require("./storage.service");

const SESSION_COOKIE = "lingua_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS);
const PASSWORD_ITERATIONS = Number(process.env.PASSWORD_ITERATIONS);
const SIGNUP_BONUS_TRIGGER_EVENT = "user_signup";

if (!SESSION_DAYS || !PASSWORD_ITERATIONS) {
  throw new Error("SESSION_DAYS and PASSWORD_ITERATIONS are required.");
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
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return [decodeURIComponent(cookie.slice(0, index)), decodeURIComponent(cookie.slice(index + 1))];
      })
  );
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
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function publicUserSql(whereClause) {
  return `select id,
                 email,
                 display_name as "displayName",
                 avatar,
                 case when avatar_box_file_id is not null then '/api/auth/avatar' else avatar_url end as "avatarUrl",
                 avatar_box_file_id as "avatarBoxFileId",
                 bio,
                 native_language as "nativeLanguage",
                 target_language as "targetLanguage",
                 current_level as "currentLevel",
                 current_streak as "currentStreak",
                 longest_streak as "longestStreak",
                 listening_time as "listeningTime",
                 shadowing_time as "shadowingTime"
            from users
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
            shadowing_time as "shadowingTime",
            coalesce(profile_visibility, 'Private') as "profileVisibility",
            active
       from user_languages
      where user_id = $1 and active = true
      order by active desc, created_at asc`,
    [user.id]
  );
  return { ...user, learningLanguages: languages.rows };
}

async function getUserById(userId) {
  const result = await query(publicUserSql("where id = $1"), [userId]);
  return attachLearningLanguages(result.rows[0]);
}

async function getUserByEmail(email) {
  const result = await query(
    `select id,
            email,
            display_name as "displayName",
            password_hash as "passwordHash",
            avatar,
            case when avatar_box_file_id is not null then '/api/auth/avatar' else avatar_url end as "avatarUrl",
            avatar_box_file_id as "avatarBoxFileId",
            bio,
            native_language as "nativeLanguage",
            target_language as "targetLanguage",
            current_level as "currentLevel",
            current_streak as "currentStreak",
            longest_streak as "longestStreak",
            listening_time as "listeningTime",
            shadowing_time as "shadowingTime"
       from users
      where lower(email) = lower($1)`,
    [email]
  );
  const user = result.rows[0];
  return user ? { ...(await attachLearningLanguages(user)), passwordHash: user.passwordHash } : user;
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

  if (!email || !password || !displayName || !targetLanguage || !nativeLanguage) {
    const error = new Error("Name, email, password, native language, and first learning language are required");
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
    const bonusRule = await client.query(
      `select id, label, amount
         from coin_rules
        where trigger_event = $1 and rule_type = 'earn' and active = true
        limit 1`,
      [SIGNUP_BONUS_TRIGGER_EVENT]
    );
    if (!bonusRule.rows[0]) {
      const error = new Error("Signup bonus coin rule is not configured");
      error.status = 500;
      throw error;
    }

    const signupBonus = bonusRule.rows[0];
    const user = await client.query(
      `insert into users
        (display_name, email, password_hash, avatar, native_language, target_language, current_level)
       values ($1, $2, $3, $4, $5, $6, 'A1')
       returning id`,
      [displayName, email, hashPassword(password), displayName.slice(0, 2).toUpperCase(), nativeLanguage, targetLanguage]
    );
    await client.query(
      `insert into wallets (user_id, balance, lifetime_earned, daily_earned, weekly_earned)
       values ($1, $2, $2, $2, $2)`,
      [user.rows[0].id, signupBonus.amount]
    );
    await client.query(
      `insert into user_languages (user_id, language, current_level, active)
       values ($1, $2, 'A1', true)`,
      [user.rows[0].id, targetLanguage]
    );
    await client.query(
      `insert into coin_transactions (user_id, coin_rule_id, amount, label)
       values ($1, $2, $3, $4)`,
      [user.rows[0].id, signupBonus.id, signupBonus.amount, signupBonus.label]
    );
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

  try {
    await query(
      `update users
          set display_name = $2,
              email = $3,
              avatar = $4,
              bio = $5,
              native_language = $6
        where id = $1`,
      [user.id, displayName, email, avatar, bio, nativeLanguage]
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
  const previousAvatarKey = user.avatarBoxFileId;
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
      console.warn(`Could not delete previous avatar ${previousAvatarKey}: ${error.message}`);
    }
  }

  return getUserById(user.id);
}

async function getUserAvatar(user) {
  if (!user.avatarBoxFileId) {
    const error = new Error("Profile picture not found");
    error.status = 404;
    throw error;
  }
  return storageService.downloadBoxFile(user.avatarBoxFileId);
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
