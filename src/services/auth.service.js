const crypto = require("crypto");
const { query, pool } = require("../db/pool");
const configService = require("./config.service");

const SESSION_COOKIE = "lingua_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS);
const PASSWORD_ITERATIONS = Number(process.env.PASSWORD_ITERATIONS);
const MIN_PASSWORD_ITERATIONS = 210000;

if (!SESSION_DAYS || !PASSWORD_ITERATIONS) throw new Error("SESSION_DAYS and PASSWORD_ITERATIONS are required.");
if (PASSWORD_ITERATIONS < MIN_PASSWORD_ITERATIONS) throw new Error(`PASSWORD_ITERATIONS must be at least ${MIN_PASSWORD_ITERATIONS}.`);

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
  for (const rawCookie of String(req.headers.cookie || "").split(";").map((item) => item.trim()).filter(Boolean)) {
    const separator = rawCookie.indexOf("=");
    if (separator < 1) continue;
    try { cookies[decodeURIComponent(rawCookie.slice(0, separator))] = decodeURIComponent(rawCookie.slice(separator + 1)); } catch (_error) { /* Ignore malformed cookies. */ }
  }
  return cookies;
}

function hashToken(token) { return crypto.createHash("sha256").update(token).digest("hex"); }

function sessionCookie(value, maxAgeSeconds) {
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];
  if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "PROD") parts.push("Secure");
  return parts.join("; ");
}

function userSelect(extra = "") {
  return `select id,
                 email,
                 display_name as "displayName",
                 avatar,
                 native_language as "nativeLanguage",
                 target_language as "targetLanguage",
                 site_language as "siteLanguage"
                 ${extra}
            from users`;
}

async function getUserById(userId) {
  const result = await query(`${userSelect()} where id = $1`, [userId]);
  return result.rows[0] || null;
}

async function getUserByEmail(email) {
  const result = await query(`${userSelect(', password_hash as "passwordHash"')} where lower(email) = lower($1)`, [String(email || "").trim()]);
  return result.rows[0] || null;
}

async function getAuthenticatedUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const result = await query(
    `select u.id from user_sessions s join users u on u.id = s.user_id where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)]
  );
  return result.rows[0] ? getUserById(result.rows[0].id) : null;
}

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query("insert into user_sessions (user_id, token_hash, expires_at) values ($1, $2, $3)", [userId, hashToken(token), expiresAt]);
  res.setHeader("Set-Cookie", sessionCookie(token, SESSION_DAYS * 86400));
}

async function destroySession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) await query("delete from user_sessions where token_hash = $1", [hashToken(token)]);
  res.setHeader("Set-Cookie", sessionCookie("", 0));
}

async function registerUser(input, res) {
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const displayName = String(input.displayName || "").trim();
  const nativeLanguage = String(input.nativeLanguage || "").trim();
  const targetLanguage = String(input.targetLanguage || "zh-TW").trim();
  if (!email || password.length < 8 || !displayName || !nativeLanguage || !targetLanguage) {
    const error = new Error("Name, email, a password of at least 8 characters, and language are required"); error.status = 400; throw error;
  }
  if (!(await configService.isSupportedLanguage(nativeLanguage)) || !(await configService.isSupportedLanguage(targetLanguage))) {
    const error = new Error("Please choose a supported language"); error.status = 400; throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const created = await client.query(
      `insert into users (display_name, email, password_hash, avatar, native_language, target_language)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [displayName, email, hashPassword(password), displayName.slice(0, 2).toUpperCase(), nativeLanguage, targetLanguage]
    );
    await client.query("commit");
    await createSession(res, created.rows[0].id);
    return getUserById(created.rows[0].id);
  } catch (error) {
    await client.query("rollback");
    if (error.code === "23505") { error.message = "An account with that email already exists"; error.status = 409; }
    throw error;
  } finally { client.release(); }
}

async function loginUser(input, res) {
  const user = await getUserByEmail(input.email);
  if (!user || !verifyPassword(String(input.password || ""), user.passwordHash)) {
    const error = new Error("Invalid email or password"); error.status = 401; throw error;
  }
  await createSession(res, user.id);
  return getUserById(user.id);
}

module.exports = { hashPassword, verifyPassword, getUserById, getUserByEmail, getAuthenticatedUser, registerUser, loginUser, destroySession };
