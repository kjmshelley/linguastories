const crypto = require("crypto");
const { AccessToken, TrackSource } = require("livekit-server-sdk");
const { pool, query } = require("../db/pool");
const subscriptionPolicy = require("./subscription-policy.service");
const { LANGUAGE_SKILL_LEVELS, normalizeLanguageSkillLevel } = require("../constants/language-levels");

const CEFR_LEVELS = new Set(LANGUAGE_SKILL_LEVELS);
const LESSON_TYPES = new Set(["trial", "one_on_one", "group"]);
const VIDEO_HOSTS = [
  { provider: "youtube", pattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { provider: "vimeo", pattern: /(^|\.)vimeo\.com$/i }
];
const PLATFORM_FEE_USD = 0.5;
const JOIN_EARLY_MINUTES = 5;
const JOIN_LATE_MINUTES = 15;
const ACTIVE_BOOKING_STATUSES = new Set(["pending_payment", "confirmed", "pending_teacher_approval", "reschedule_requested", "rescheduled", "active"]);
const CANCELLED_BOOKING_STATUSES = new Set(["cancelled_by_student", "cancelled_by_teacher", "canceled"]);
const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function text(value, { fallback = "", max = 255, required = false, min = 0 } = {}) {
  const output = String(value ?? fallback).trim().replace(/\s+/g, " ");
  if (required && !output) throw serviceError("Required field is missing");
  if (output && output.length < min) throw serviceError("A required field is too short");
  return output.slice(0, max);
}

function money(value, { min = 0, fallback = 0 } = {}) {
  const amount = Number(value ?? fallback);
  if (!Number.isFinite(amount) || amount < min) throw serviceError("Enter a valid price");
  return Math.round(amount * 100) / 100;
}

function integer(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < min || number > max) throw serviceError("Enter a valid number");
  return number;
}

function list(value, { maxItems = 12, maxLength = 80 } = {}) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(values.map((item) => text(item, { max: maxLength })).filter(Boolean))].slice(0, maxItems);
}

function normalizeLevel(value) {
  const level = normalizeLanguageSkillLevel(value);
  if (!CEFR_LEVELS.has(level)) throw serviceError("Choose a valid skill level");
  return level;
}

function languageLevelMap(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([language, level]) => [text(language, { max: 80 }), normalizeLevel(level)])
    );
  } catch {
    return {};
  }
}

function normalizeLessonType(value) {
  const type = text(value, { fallback: "one_on_one", max: 20 });
  if (!LESSON_TYPES.has(type)) throw serviceError("Choose a valid lesson type");
  return type;
}

function normalizeVideoUrl(value) {
  const url = text(value, { max: 500 });
  if (!url) return { url: "", provider: null };
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_error) {
    throw serviceError("Intro video must be a valid YouTube or Vimeo URL");
  }
  const match = VIDEO_HOSTS.find((host) => host.pattern.test(parsed.hostname));
  if (!match) throw serviceError("Intro video must be hosted on YouTube or Vimeo");
  return { url: parsed.toString(), provider: match.provider };
}

function profileSelect(whereClause, orderClause = "tp.updated_at desc") {
  return `
    select tp.id,
           tp.user_id as "userId",
           u.display_name as "ownerName",
           tp.display_name as "displayName",
           tp.headline,
           tp.bio,
           tp.teaching_style as "teachingStyle",
           tp.experience_summary as "experienceSummary",
           tp.certifications,
           tp.native_language as "nativeLanguage",
           tp.timezone,
           tp.country,
           tp.professional_tutor as "professionalTutor",
           tp.speaking_practice_only as "speakingPracticeOnly",
           tp.hourly_rate_usd as "hourlyRateUsd",
           tp.trial_rate_usd as "trialRateUsd",
           tp.min_lesson_minutes as "minLessonMinutes",
           tp.max_lesson_minutes as "maxLessonMinutes",
           tp.group_lesson_enabled as "groupLessonEnabled",
           tp.group_max_students as "groupMaxStudents",
           tp.video_intro_url as "videoIntroUrl",
           tp.video_provider as "videoProvider",
           coalesce(u.avatar, left(u.display_name, 2)) as avatar,
           case when u.avatar_box_file_id is not null then '/api/learners/' || u.id || '/avatar' else coalesce(u.avatar_url, '') end as "avatarUrl",
           tp.status,
           coalesce(lang.languages, '[]'::json) as languages,
           coalesce(tags.tags, '[]'::json) as tags,
           coalesce(reviews.review_count, 0)::int as "reviewCount",
           coalesce(reviews.average_rating, 0)::float as "averageRating",
           coalesce(ts.plan_key, '') as "subscriptionTier",
           coalesce(tsp.can_create_group_lessons, false) as "canCreateGroupLessons",
           tp.created_at as "createdAt",
           tp.updated_at as "updatedAt"
      from teacher_profiles tp
      join users u on u.id = tp.user_id
      left join lateral (
        select json_agg(json_build_object('language', language, 'role', role, 'cefrLevel', cefr_level) order by role, language) as languages
          from teacher_profile_languages tpl
         where tpl.teacher_profile_id = tp.id
      ) lang on true
      left join lateral (
        select json_agg(tag order by tag) as tags
          from teacher_profile_tags tpt
         where tpt.teacher_profile_id = tp.id
      ) tags on true
      left join lateral (
        select count(*) as review_count, avg(rating) as average_rating
          from teacher_reviews tr
         where tr.teacher_profile_id = tp.id
      ) reviews on true
      left join teacher_subscriptions ts on ts.user_id = tp.user_id and ts.status in ('active', 'past_due')
      left join teacher_subscription_plans tsp on tsp.plan_key = ts.plan_key
     ${whereClause}
     order by ${orderClause}`;
}

function mapProfile(row) {
  return {
    ...row,
    hourlyRateUsd: Number(row.hourlyRateUsd || 0),
    trialRateUsd: row.trialRateUsd === null ? null : Number(row.trialRateUsd || 0),
    minLessonMinutes: Number(row.minLessonMinutes || 30),
    maxLessonMinutes: Number(row.maxLessonMinutes || 60),
    groupMaxStudents: Number(row.groupMaxStudents || 1),
    groupLessonEnabled: Boolean(row.groupLessonEnabled),
    professionalTutor: Boolean(row.professionalTutor),
    speakingPracticeOnly: Boolean(row.speakingPracticeOnly),
    canCreateGroupLessons: Boolean(row.canCreateGroupLessons),
    averageRating: Number(row.averageRating || 0),
    languages: Array.isArray(row.languages) ? row.languages : [],
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

function userWithTeacherSubscription(user, subscription) {
  const activeTeacherStatus = ["active", "past_due", "incomplete"].includes(subscription?.status);
  return activeTeacherStatus ? { ...user, teacherSubscriptionTier: subscription.planKey, teacherSubscriptionStatus: subscription.status } : user;
}

async function hasActiveTeacherProfile(userId) {
  const result = await query(
    `select exists (
       select 1
         from teacher_profiles
        where user_id = $1
          and status = 'published'
     ) as "hasActiveTeacherProfile"`,
    [userId]
  );
  return Boolean(result.rows[0]?.hasActiveTeacherProfile);
}

async function requireTeacherWorkspace(user) {
  const [subscription, activeTeacherProfile] = await Promise.all([
    teacherSubscriptionForUser(user.id),
    hasActiveTeacherProfile(user.id)
  ]);
  subscriptionPolicy.requireCapability(
    userWithTeacherSubscription({ ...user, hasActiveTeacherProfile: activeTeacherProfile }, subscription),
    "teacherWorkspace"
  );
  return subscription;
}

function mapBooking(row) {
  return {
    ...row,
    durationMinutes: Number(row.durationMinutes || 0),
    maxStudents: Number(row.maxStudents || 1),
    lessonPriceUsd: Number(row.lessonPriceUsd || 0),
    platformFeeUsd: Number(row.platformFeeUsd || PLATFORM_FEE_USD),
    totalStudentChargeUsd: Number(row.totalStudentChargeUsd || 0),
    teacherPayoutUsd: Number(row.teacherPayoutUsd || 0)
  };
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + Number(minutes || 0) * 60 * 1000);
}

function parseTimeMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) throw serviceError("Enter a valid time");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) throw serviceError("Enter a valid time");
  return hours * 60 + minutes;
}

function timeTextFromMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeZoneOffsetMinutes(timezone, date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      timeZoneName: "shortOffset",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);
    const zone = parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
    const match = zone.match(/^GMT(?:(\+|-)(\d{1,2})(?::?(\d{2}))?)?$/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2] || 0) * 60 + Number(match[3] || 0));
  } catch (_error) {
    return 0;
  }
}

function zonedDateTimeToUtc(timezone, localDateKey, localTimeText) {
  const [year, month, day] = localDateKey.split("-").map(Number);
  const minutes = parseTimeMinutes(localTimeText);
  const guess = new Date(Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60));
  const offset = timeZoneOffsetMinutes(timezone, guess);
  return new Date(guess.getTime() - offset * 60 * 1000);
}

function weekdayInTimezone(localDateKey, timezone) {
  const noon = zonedDateTimeToUtc(timezone, localDateKey, "12:00");
  const label = new Intl.DateTimeFormat("en-US", { timeZone: timezone || "UTC", weekday: "long" }).format(noon);
  return WEEKDAY_LABELS.indexOf(label);
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function slotPrice(profile, lessonType, durationMinutes) {
  const hourly = lessonType === "trial" && profile.trialRateUsd !== null ? profile.trialRateUsd : profile.hourlyRateUsd;
  const lessonPrice = money((hourly * durationMinutes) / 60, { min: 0 });
  return {
    lessonPriceUsd: lessonPrice,
    platformFeeUsd: PLATFORM_FEE_USD,
    totalStudentChargeUsd: money(lessonPrice + PLATFORM_FEE_USD, { min: PLATFORM_FEE_USD }),
    teacherPayoutUsd: lessonPrice
  };
}

function normalizeDurations(raw, profile) {
  const values = Array.isArray(raw) ? raw : [];
  const durations = values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= profile.minLessonMinutes && value <= profile.maxLessonMinutes);
  return [...new Set(durations.length ? durations : [profile.minLessonMinutes, profile.maxLessonMinutes])].sort((a, b) => a - b);
}

function mapBookingRules(row, profile) {
  return {
    teacherUserId: row?.teacherUserId || profile.userId,
    teacherProfileId: row?.teacherProfileId || profile.id,
    minBookingNoticeMinutes: Number(row?.minBookingNoticeMinutes ?? 720),
    maxAdvanceBookingDays: Number(row?.maxAdvanceBookingDays ?? 30),
    bufferBeforeMinutes: Number(row?.bufferBeforeMinutes ?? 10),
    bufferAfterMinutes: Number(row?.bufferAfterMinutes ?? 10),
    cancellationCutoffMinutes: Number(row?.cancellationCutoffMinutes ?? 720),
    rescheduleCutoffMinutes: Number(row?.rescheduleCutoffMinutes ?? 720),
    supportedDurations: normalizeDurations(row?.supportedDurations, profile),
    autoConfirmBookings: row?.autoConfirmBookings !== false
  };
}

async function upsertProfileMetadata(client, profileId, payload) {
  await client.query("delete from teacher_profile_languages where teacher_profile_id = $1", [profileId]);
  const teaches = list(payload.teachesLanguages, { maxItems: 8 });
  const speaks = list(payload.speaksLanguages, { maxItems: 8 });
  const teachesLevels = languageLevelMap(payload.teachesLanguageLevels);
  const speaksLevels = languageLevelMap(payload.speaksLanguageLevels);
  for (const language of teaches) {
    await client.query(
      `insert into teacher_profile_languages (teacher_profile_id, language, role, cefr_level)
       values ($1, $2, 'teaches', $3)`,
      [profileId, language, teachesLevels[language] || normalizeLevel(payload.cefrLevel || "A1")]
    );
  }
  for (const language of speaks) {
    await client.query(
      `insert into teacher_profile_languages (teacher_profile_id, language, role, cefr_level)
       values ($1, $2, 'speaks', $3)
       on conflict do nothing`,
      [profileId, language, speaksLevels[language] || (language.toLowerCase() === text(payload.nativeLanguage).toLowerCase() ? "Native" : null)]
    );
  }

  await client.query("delete from teacher_profile_tags where teacher_profile_id = $1", [profileId]);
  for (const tag of list(payload.tags, { maxItems: 16, maxLength: 50 })) {
    await client.query("insert into teacher_profile_tags (teacher_profile_id, tag) values ($1, $2) on conflict do nothing", [profileId, tag]);
  }
}

async function teacherSubscriptionForUser(userId) {
  const result = await query(
    `select coalesce(ts.plan_key, '') as "planKey",
            coalesce(tsp.name, 'No teacher subscription') as name,
            coalesce(tsp.monthly_price_usd, 0)::float as "monthlyPriceUsd",
            coalesce(tsp.can_create_group_lessons, false) as "canCreateGroupLessons",
            coalesce(ts.status, 'inactive') as status,
            ts.current_period_end as "currentPeriodEnd"
       from users u
       left join teacher_subscriptions ts on ts.user_id = u.id and ts.status in ('active', 'past_due', 'incomplete')
       left join teacher_subscription_plans tsp on tsp.plan_key = ts.plan_key
      where u.id = $1
      limit 1`,
    [userId]
  );
  return result.rows[0] || { planKey: "", name: "No teacher subscription", monthlyPriceUsd: 0, canCreateGroupLessons: false, status: "inactive" };
}

async function myProfiles(user) {
  const result = await query(profileSelect("where tp.user_id = $1"), [user.id]);
  return { profiles: result.rows.map(mapProfile), subscription: await teacherSubscriptionForUser(user.id) };
}

async function teacherFilterOptions() {
  const countries = await query(
    `select distinct country
       from teacher_profiles
      where status = 'published'
        and nullif(trim(country), '') is not null
      order by country`
  );
  return { countries: countries.rows.map((row) => row.country).filter(Boolean) };
}

async function searchTeachers(user, filters = {}) {
  const params = [];
  const clauses = ["tp.status = 'published'", "tp.user_id <> $1"];
  params.push(user.id);
  const q = text(filters.q, { max: 120 });
  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    clauses.push(`(lower(tp.display_name) like $${params.length} or lower(tp.headline) like $${params.length} or lower(tp.bio) like $${params.length})`);
  }
  const language = text(filters.language, { max: 80 });
  if (language) {
    params.push(language);
    clauses.push(`exists (select 1 from teacher_profile_languages tpl where tpl.teacher_profile_id = tp.id and tpl.role = 'teaches' and lower(tpl.language) = lower($${params.length}))`);
  }
  const countryOfBirth = text(filters.countryOfBirth || filters.country, { max: 80 });
  if (countryOfBirth) {
    params.push(countryOfBirth);
    clauses.push(`lower(tp.country) = lower($${params.length})`);
  }
  const speaksLanguage = text(filters.speaksLanguage, { max: 80 });
  if (speaksLanguage) {
    params.push(speaksLanguage);
    clauses.push(`exists (select 1 from teacher_profile_languages tpl where tpl.teacher_profile_id = tp.id and tpl.role = 'speaks' and lower(tpl.language) = lower($${params.length}))`);
  }
  if (String(filters.nativeSpeaker || "") === "true") {
    if (language) {
      params.push(language);
      clauses.push(`lower(tp.native_language) = lower($${params.length})`);
    } else {
      clauses.push(`exists (select 1 from teacher_profile_languages tpl where tpl.teacher_profile_id = tp.id and tpl.role = 'teaches' and lower(tpl.language) = lower(tp.native_language))`);
    }
  }
  if (String(filters.professionalTutor || "") === "true") {
    clauses.push("tp.professional_tutor = true");
  }
  if (String(filters.speakingPracticeOnly || "") === "true") {
    clauses.push("tp.speaking_practice_only = true");
  }
  const maxRate = filters.maxRate ? money(filters.maxRate, { min: 1 }) : 0;
  if (maxRate) {
    params.push(maxRate);
    clauses.push(`tp.hourly_rate_usd <= $${params.length}`);
  }
  const result = await query(`${profileSelect(`where ${clauses.join(" and ")}`, "tp.status asc, reviews.average_rating desc nulls last, tp.hourly_rate_usd asc")} limit 40`, params);
  return { teachers: result.rows.map(mapProfile), filterOptions: await teacherFilterOptions() };
}

async function getProfile(user, profileId) {
  const result = await query(profileSelect("where tp.id = $1 and (tp.status = 'published' or tp.user_id = $2)"), [profileId, user.id]);
  if (!result.rows[0]) throw serviceError("Teacher profile not found", 404);
  const reviews = await query(
    `select tr.id, tr.rating, tr.body, tr.created_at as "createdAt", u.display_name as "studentName"
       from teacher_reviews tr
       join users u on u.id = tr.student_user_id
      where tr.teacher_profile_id = $1
      order by tr.created_at desc
      limit 20`,
    [profileId]
  );
  return { profile: mapProfile(result.rows[0]), reviews: reviews.rows };
}

async function saveProfile(user, payload, profileId = "") {
  const video = normalizeVideoUrl(payload.videoIntroUrl);
  const displayName = text(payload.displayName || user.displayName, { required: true, min: 2, max: 120 });
  const headline = text(payload.headline, { required: true, min: 3, max: 160 });
  const bio = text(payload.bio, { required: true, min: 20, max: 3000 });
  const minLessonMinutes = integer(payload.minLessonMinutes, { min: 15, max: 90, fallback: 30 });
  const maxLessonMinutes = integer(payload.maxLessonMinutes, { min: minLessonMinutes, max: 90, fallback: 60 });
  const subscription = await teacherSubscriptionForUser(user.id);
  const groupEnabled = payload.groupLessonEnabled === true || String(payload.groupLessonEnabled) === "true";
  const entitlementUser = userWithTeacherSubscription(user, subscription);
  if (groupEnabled && !subscription.canCreateGroupLessons) subscriptionPolicy.requireCapability(entitlementUser, "groupLessons");

  const client = await pool.connect();
  try {
    await client.query("begin");
    let saved;
    if (profileId) {
      const owner = await client.query("select id, status from teacher_profiles where id = $1 and user_id = $2", [profileId, user.id]);
      if (!owner.rows[0]) throw serviceError("Teacher profile not found", 404);
      saved = await client.query(
        `update teacher_profiles
            set display_name = $3,
                headline = $4,
                bio = $5,
                teaching_style = $6,
                experience_summary = $7,
                certifications = $8,
                native_language = $9,
                timezone = $10,
                country = $11,
                professional_tutor = $12,
                speaking_practice_only = $13,
                hourly_rate_usd = $14,
                trial_rate_usd = $15,
                min_lesson_minutes = $16,
                max_lesson_minutes = $17,
                group_lesson_enabled = $18,
                group_max_students = $19,
                video_intro_url = $20,
                video_provider = $21,
                status = $22,
                updated_at = now()
          where id = $1 and user_id = $2
          returning id`,
        [
          profileId,
          user.id,
          displayName,
          headline,
          bio,
          text(payload.teachingStyle, { max: 1200 }),
          text(payload.experienceSummary, { max: 1200 }),
          text(payload.certifications, { max: 1000 }),
          text(payload.nativeLanguage || user.nativeLanguage || "en-US", { required: true, max: 80 }),
          text(payload.timezone || "UTC", { required: true, max: 80 }),
          text(payload.country, { max: 80 }),
          payload.professionalTutor === true || String(payload.professionalTutor) === "true",
          payload.speakingPracticeOnly === true || String(payload.speakingPracticeOnly) === "true",
          money(payload.hourlyRateUsd, { min: 1, fallback: 20 }),
          payload.trialRateUsd === "" || payload.trialRateUsd === undefined ? null : money(payload.trialRateUsd, { min: 0 }),
          minLessonMinutes,
          maxLessonMinutes,
          groupEnabled,
          groupEnabled ? integer(payload.groupMaxStudents, { min: 2, max: 8, fallback: 4 }) : 1,
          video.url || null,
          video.provider,
          owner.rows[0].status || "draft"
        ]
      );
    } else {
      saved = await client.query(
        `insert into teacher_profiles (
           user_id, display_name, headline, bio, teaching_style, experience_summary, certifications,
           native_language, timezone, country, professional_tutor, speaking_practice_only, hourly_rate_usd, trial_rate_usd, min_lesson_minutes,
           max_lesson_minutes, group_lesson_enabled, group_max_students, video_intro_url, video_provider,
           status
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         returning id`,
        [
          user.id,
          displayName,
          headline,
          bio,
          text(payload.teachingStyle, { max: 1200 }),
          text(payload.experienceSummary, { max: 1200 }),
          text(payload.certifications, { max: 1000 }),
          text(payload.nativeLanguage || user.nativeLanguage || "en-US", { required: true, max: 80 }),
          text(payload.timezone || "UTC", { required: true, max: 80 }),
          text(payload.country, { max: 80 }),
          payload.professionalTutor === true || String(payload.professionalTutor) === "true",
          payload.speakingPracticeOnly === true || String(payload.speakingPracticeOnly) === "true",
          money(payload.hourlyRateUsd, { min: 1, fallback: 20 }),
          payload.trialRateUsd === "" || payload.trialRateUsd === undefined ? null : money(payload.trialRateUsd, { min: 0 }),
          minLessonMinutes,
          maxLessonMinutes,
          groupEnabled,
          groupEnabled ? integer(payload.groupMaxStudents, { min: 2, max: 8, fallback: 4 }) : 1,
          video.url || null,
          video.provider,
          "draft"
        ]
      );
      await client.query(
        `insert into teacher_lesson_settings (teacher_profile_id, group_enabled, supported_durations)
         values ($1, $2, $3)`,
        [saved.rows[0].id, groupEnabled, [minLessonMinutes, maxLessonMinutes]]
      );
    }
    await upsertProfileMetadata(client, saved.rows[0].id, payload);
    await client.query("commit");
    return myProfiles(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteProfile(user, profileId) {
  await requireTeacherWorkspace(user);
  const result = await query("update teacher_profiles set status = 'archived', updated_at = now() where id = $1 and user_id = $2 returning id", [profileId, user.id]);
  if (!result.rows[0]) throw serviceError("Teacher profile not found", 404);
  return myProfiles(user);
}

async function getAvailability(user) {
  await requireTeacherWorkspace(user);
  const result = await query(
    `select tar.id, tar.teacher_profile_id as "teacherProfileId", tar.weekday, tar.start_time::text as "startTime",
            tar.end_time::text as "endTime", tar.timezone, tar.active
       from teacher_availability_rules tar
       join teacher_profiles tp on tp.id = tar.teacher_profile_id
      where tp.user_id = $1
      order by tar.weekday, tar.start_time`,
    [user.id]
  );
  return { availability: result.rows };
}

async function bookingRules(client, profile) {
  const result = await client.query(
    `select teacher_user_id as "teacherUserId",
            teacher_profile_id as "teacherProfileId",
            min_booking_notice_minutes as "minBookingNoticeMinutes",
            max_advance_booking_days as "maxAdvanceBookingDays",
            buffer_before_minutes as "bufferBeforeMinutes",
            buffer_after_minutes as "bufferAfterMinutes",
            cancellation_cutoff_minutes as "cancellationCutoffMinutes",
            reschedule_cutoff_minutes as "rescheduleCutoffMinutes",
            supported_durations as "supportedDurations",
            auto_confirm_bookings as "autoConfirmBookings"
       from teacher_booking_rules
      where teacher_profile_id = $1
      limit 1`,
    [profile.id]
  );
  if (result.rows[0]) return mapBookingRules(result.rows[0], profile);
  const legacy = await client.query(
    `select advance_notice_hours as "advanceNoticeHours",
            buffer_minutes as "bufferMinutes",
            supported_durations as "supportedDurations"
       from teacher_lesson_settings
      where teacher_profile_id = $1
      limit 1`,
    [profile.id]
  );
  const row = legacy.rows[0] || {};
  return mapBookingRules(
    {
      teacherUserId: profile.userId,
      teacherProfileId: profile.id,
      minBookingNoticeMinutes: Number(row.advanceNoticeHours ?? 12) * 60,
      maxAdvanceBookingDays: 30,
      bufferBeforeMinutes: Number(row.bufferMinutes ?? 10),
      bufferAfterMinutes: Number(row.bufferMinutes ?? 10),
      supportedDurations: row.supportedDurations,
      autoConfirmBookings: true
    },
    profile
  );
}

async function bookingSourceData(client, profile, { from = new Date(), days = 30 } = {}) {
  const rules = await bookingRules(client, profile);
  const windowStart = new Date(from);
  windowStart.setUTCHours(0, 0, 0, 0);
  const windowEnd = addMinutes(windowStart, Math.min(Number(days || rules.maxAdvanceBookingDays), rules.maxAdvanceBookingDays) * 24 * 60 + 24 * 60);
  const availability = await client.query(
    `select id, weekday, start_time::text as "startTime", end_time::text as "endTime", timezone, active
       from teacher_availability_rules
      where teacher_profile_id = $1 and active = true
      order by weekday, start_time`,
    [profile.id]
  );
  const unavailable = await client.query(
    `select id,
            title,
            reason,
            timezone,
            is_full_day as "isFullDay",
            starts_at as "startsAt",
            ends_at as "endsAt"
       from teacher_unavailable_blocks
      where teacher_profile_id = $1
        and starts_at < $3
        and ends_at > $2
      order by starts_at`,
    [profile.id, windowStart, windowEnd]
  );
  const bookings = await client.query(
    `select id,
            starts_at as "startsAt",
            ends_at as "endsAt",
            status
       from lesson_bookings
      where teacher_profile_id = $1
        and status in ('pending_payment', 'confirmed', 'pending_teacher_approval', 'reschedule_requested', 'rescheduled', 'active')
        and starts_at < $3
        and ends_at > $2
      order by starts_at`,
    [profile.id, windowStart, windowEnd]
  );
  return { rules, availability: availability.rows, unavailableBlocks: unavailable.rows, bookings: bookings.rows, windowStart, windowEnd };
}

async function expirePendingPaymentBookings(clientOrPool = { query }) {
  await clientOrPool.query(
    `update lesson_bookings
        set status = 'expired_payment',
            payment_status = 'failed',
            updated_at = now()
      where status = 'pending_payment'
        and payment_status = 'pending'
        and payment_expires_at is not null
        and payment_expires_at < now()`
  );
  await clientOrPool.query(
    `update lesson_payments lp
        set status = 'failed',
            updated_at = now()
       from lesson_bookings lb
      where lb.id = lp.lesson_booking_id
        and lb.status = 'expired_payment'
        and lp.status = 'pending'`
  );
}

function buildCalendarFromSource(profile, source, options = {}) {
  const lessonType = normalizeLessonType(options.lessonType || "one_on_one");
  if (lessonType === "group" && (!profile.groupLessonEnabled || !profile.canCreateGroupLessons)) throw serviceError("This teacher cannot offer group lessons yet.", 400);
  const durations = source.rules.supportedDurations;
  const durationMinutes = integer(options.durationMinutes || durations[0] || profile.minLessonMinutes, {
    min: Math.min(...durations),
    max: Math.max(...durations),
    fallback: durations[0] || profile.minLessonMinutes
  });
  if (!durations.includes(durationMinutes)) throw serviceError("Choose a supported lesson duration");
  const now = new Date();
  const minStart = addMinutes(now, source.rules.minBookingNoticeMinutes);
  const maxStart = addMinutes(now, source.rules.maxAdvanceBookingDays * 24 * 60);
  const days = [];
  const requestedDate = text(options.date, { max: 10 });
  const dayCount = Math.min(Number(options.days || source.rules.maxAdvanceBookingDays), source.rules.maxAdvanceBookingDays);

  for (let offset = 0; offset <= dayCount; offset += 1) {
    const currentDate = new Date(source.windowStart.getTime() + offset * 24 * 60 * 60 * 1000);
    const key = dateKey(currentDate);
    const weekday = weekdayInTimezone(key, profile.timezone);
    const dayRules = source.availability.filter((rule) => Number(rule.weekday) === weekday);
    const slots = [];
    const disabledReasons = [];
    if (!dayRules.length) disabledReasons.push("No weekly availability");
    for (const rule of dayRules) {
      const startMinute = parseTimeMinutes(rule.startTime);
      const endMinute = parseTimeMinutes(rule.endTime);
      for (let minute = startMinute; minute + durationMinutes <= endMinute; minute += durationMinutes) {
        const startsAt = zonedDateTimeToUtc(rule.timezone || profile.timezone, key, timeTextFromMinutes(minute));
        const endsAt = addMinutes(startsAt, durationMinutes);
        let reason = "";
        if (startsAt <= minStart) reason = "Past minimum booking notice";
        if (startsAt > maxStart) reason = "Outside booking window";
        const blocked = source.unavailableBlocks.find((block) => overlaps(startsAt, endsAt, new Date(block.startsAt), new Date(block.endsAt)));
        if (blocked) reason = blocked.title || blocked.reason || "Teacher unavailable";
        const bufferedStart = addMinutes(startsAt, -source.rules.bufferBeforeMinutes);
        const bufferedEnd = addMinutes(endsAt, source.rules.bufferAfterMinutes);
        const existing = source.bookings.find((booking) => overlaps(bufferedStart, bufferedEnd, new Date(booking.startsAt), new Date(booking.endsAt)));
        if (existing) reason = existing.status === "pending_payment" ? "Payment hold" : "Already booked";
        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          localTime: timeTextFromMinutes(minute),
          teacherTimezone: rule.timezone || profile.timezone,
          available: !reason,
          reason
        });
      }
    }
    const availableCount = slots.filter((slot) => slot.available).length;
    days.push({
      date: key,
      weekday: WEEKDAY_LABELS[weekday] || "",
      availableCount,
      blockedCount: slots.length - availableCount,
      disabled: availableCount === 0,
      reason: availableCount ? "" : disabledReasons[0] || "No available slots",
      slots: !requestedDate || requestedDate === key ? slots : []
    });
  }

  return {
    lessonType,
    durationMinutes,
    durations,
    timezone: profile.timezone,
    studentTimezone: options.studentTimezone || "Local time",
    price: slotPrice(profile, lessonType, durationMinutes),
    rules: source.rules,
    days,
    unavailableBlocks: source.unavailableBlocks
  };
}

async function getBookingPage(user, profileId, filters = {}) {
  const client = await pool.connect();
  try {
    await expirePendingPaymentBookings(client);
    const result = await client.query(profileSelect("where tp.id = $1 and tp.status = 'published'"), [profileId]);
    if (!result.rows[0]) throw serviceError("Teacher profile not found", 404);
    const profile = mapProfile(result.rows[0]);
    if (profile.userId === user.id) throw serviceError("You cannot book your own teacher profile", 403);
    const source = await bookingSourceData(client, profile, { days: filters.days || 30 });
    return { profile, calendar: buildCalendarFromSource(profile, source, filters), platformFeeUsd: PLATFORM_FEE_USD };
  } finally {
    client.release();
  }
}

async function availableDays(user, profileId, filters = {}) {
  const page = await getBookingPage(user, profileId, filters);
  return { days: page.calendar.days.map(({ slots, ...day }) => day), rules: page.calendar.rules };
}

async function availableSlots(user, profileId, filters = {}) {
  const page = await getBookingPage(user, profileId, filters);
  const date = text(filters.date, { required: true, max: 10 });
  return { slots: page.calendar.days.find((day) => day.date === date)?.slots || [], price: page.calendar.price };
}

async function validateBookingSlot(client, profile, payload) {
  const source = await bookingSourceData(client, profile, { days: 60 });
  const durationMinutes = integer(payload.durationMinutes, { min: profile.minLessonMinutes, max: profile.maxLessonMinutes, fallback: profile.minLessonMinutes });
  const lessonType = normalizeLessonType(payload.lessonType);
  const startsAt = new Date(payload.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw serviceError("Choose a valid lesson time");
  const localDate = dateKey(startsAt);
  const calendar = buildCalendarFromSource(profile, source, { durationMinutes, lessonType, date: localDate, days: source.rules.maxAdvanceBookingDays });
  const selected = calendar.days.flatMap((day) => day.slots).find((slot) => slot.startsAt === startsAt.toISOString());
  if (!selected?.available) throw serviceError(selected?.reason || "Choose an available lesson slot");
  return { startsAt, endsAt: new Date(selected.endsAt), durationMinutes, lessonType, rules: source.rules, price: calendar.price };
}

async function saveAvailability(user, payload) {
  await requireTeacherWorkspace(user);
  const profileId = text(payload.teacherProfileId, { required: true, max: 64 });
  const owner = await query("select id from teacher_profiles where id = $1 and user_id = $2", [profileId, user.id]);
  if (!owner.rows[0]) throw serviceError("Teacher profile not found", 404);
  await query(
    `insert into teacher_availability_rules (teacher_profile_id, weekday, start_time, end_time, timezone, active)
     values ($1, $2, $3::time, $4::time, $5, true)`,
    [
      profileId,
      integer(payload.weekday, { min: 0, max: 6, fallback: 1 }),
      text(payload.startTime, { required: true, max: 8 }),
      text(payload.endTime, { required: true, max: 8 }),
      text(payload.timezone || "UTC", { max: 80 })
    ]
  );
  return getAvailability(user);
}

async function createBooking(user, payload) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await expirePendingPaymentBookings(client);
    const profile = await client.query(profileSelect("where tp.id = $1 and tp.status = 'published'"), [payload.teacherProfileId]);
    if (!profile.rows[0]) throw serviceError("Teacher profile not found", 404);
    const teacher = mapProfile(profile.rows[0]);
    if (teacher.userId === user.id) throw serviceError("You cannot book your own teacher profile");
    const slot = await validateBookingSlot(client, teacher, payload);
    const livekitRoomName = `linguastories-classroom-${crypto.randomUUID()}`;
    const booking = await client.query(
      `insert into lesson_bookings (
         teacher_profile_id, teacher_user_id, student_user_id, lesson_type, title, target_language,
         starts_at, ends_at, duration_minutes, max_students, lesson_price_usd, platform_fee_usd,
         total_student_charge_usd, teacher_payout_usd, payment_expires_at, livekit_room_name
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0.50, $12, $13, now() + interval '15 minutes', $14)
       returning id,
                 teacher_profile_id as "teacherProfileId",
                 teacher_user_id as "teacherUserId",
                 student_user_id as "studentUserId",
                 lesson_type as "lessonType",
                 title,
                 target_language as "targetLanguage",
                 starts_at as "startsAt",
                 ends_at as "endsAt",
                 duration_minutes as "durationMinutes",
                 max_students as "maxStudents",
                 status,
                 payment_status as "paymentStatus",
                 lesson_price_usd as "lessonPriceUsd",
                 platform_fee_usd as "platformFeeUsd",
                 total_student_charge_usd as "totalStudentChargeUsd",
                 teacher_payout_usd as "teacherPayoutUsd",
                 livekit_room_name as "livekitRoomName"`,
      [
        teacher.id,
        teacher.userId,
        user.id,
        slot.lessonType,
        text(payload.title || `${teacher.displayName} lesson`, { required: true, max: 160 }),
        text(payload.targetLanguage || teacher.languages.find((item) => item.role === "teaches")?.language, { required: true, max: 80 }),
        slot.startsAt,
        slot.endsAt,
        slot.durationMinutes,
        slot.lessonType === "group" ? integer(payload.maxStudents, { min: 2, max: teacher.groupMaxStudents, fallback: 4 }) : 1,
        slot.price.lessonPriceUsd,
        slot.price.totalStudentChargeUsd,
        slot.price.teacherPayoutUsd,
        livekitRoomName
      ]
    );
    await client.query(
      `insert into lesson_participants (lesson_booking_id, user_id, role)
       values ($1, $2, 'teacher'), ($1, $3, 'student')`,
      [booking.rows[0].id, teacher.userId, user.id]
    );
    await client.query(
      `insert into classroom_sessions (lesson_booking_id, livekit_room_name)
       values ($1, $2)`,
      [booking.rows[0].id, livekitRoomName]
    );
    await client.query(
      `insert into lesson_payments (
         lesson_booking_id, student_user_id, teacher_user_id, lesson_price_usd,
         total_student_charge_usd, teacher_payout_usd
       )
       values ($1, $2, $3, $4, $5, $4)`,
      [booking.rows[0].id, user.id, teacher.userId, slot.price.lessonPriceUsd, slot.price.totalStudentChargeUsd]
    );
    await client.query("commit");
    const checkout = await createStripeCheckoutSession(user, booking.rows[0]);
    return { booking: mapBooking(booking.rows[0]), checkoutUrl: checkout.checkoutUrl, stripeConfigured: checkout.configured };
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function createStripeCheckoutSession(user, booking) {
  if (!process.env.STRIPE_SECRET_KEY) return { configured: false, checkoutUrl: "" };
  const baseUrl = String(process.env.FRONTEND_ORIGIN || process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_email", user.email);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][product_data][name]", booking.title);
  form.set("line_items[0][price_data][unit_amount]", String(Math.round(Number(booking.totalStudentChargeUsd || 0) * 100)));
  form.set("success_url", `${baseUrl}/app/learning/my-lessons?booking=${booking.id}&payment=success`);
  form.set("cancel_url", `${baseUrl}/app/learning/find-teacher?booking=${booking.id}&payment=cancelled`);
  form.set("metadata[lessonBookingId]", booking.id);
  form.set("metadata[studentUserId]", user.id);
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok) throw serviceError(session.error?.message || "Stripe checkout could not be created", 502);
  await query(
    `update lesson_bookings
        set stripe_checkout_session_id = $2, updated_at = now()
      where id = $1`,
    [booking.id, session.id]
  );
  await query(
    `update lesson_payments
        set stripe_checkout_session_id = $2, updated_at = now()
      where lesson_booking_id = $1`,
    [booking.id, session.id]
  );
  return { configured: true, checkoutUrl: session.url || "" };
}

function verifyStripeSignature(rawBody, signatureHeader) {
  const pairs = String(signatureHeader || "").split(",").reduce((items, part) => {
    const [key, value] = part.split("=");
    items[key] = value;
    return items;
  }, {});
  if (!pairs.t || !pairs.v1) return false;
  const signedPayload = `${pairs.t}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(pairs.v1);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

async function markCheckoutSessionPaid(bookingId, paymentIntentId = null) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const updated = await client.query(
      `update lesson_bookings
          set status = 'confirmed',
              payment_status = 'paid',
              stripe_payment_intent_id = $2,
              updated_at = now()
        where id = $1
          and payment_status <> 'paid'
        returning id`,
      [bookingId, paymentIntentId]
    );
    await client.query(
      `update lesson_payments
          set status = 'paid',
              stripe_payment_intent_id = coalesce($2, stripe_payment_intent_id),
              updated_at = now()
        where lesson_booking_id = $1`,
      [bookingId, paymentIntentId]
    );
    if (updated.rows.length) {
      await client.query(
        `insert into teacher_student_relationships (teacher_profile_id, teacher_user_id, student_user_id, first_lesson_at, last_lesson_at, total_lessons)
         select teacher_profile_id, teacher_user_id, student_user_id, starts_at, starts_at, 1
           from lesson_bookings
          where id = $1
         on conflict (teacher_profile_id, student_user_id)
         do update set last_lesson_at = excluded.last_lesson_at,
                       total_lessons = teacher_student_relationships.total_lessons + 1,
                       updated_at = now()`,
        [bookingId]
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function syncStripePayment(user, bookingId) {
  if (!process.env.STRIPE_SECRET_KEY) throw serviceError("Stripe checkout is not configured", 500);
  const booking = await query(
    `select id,
            student_user_id as "studentUserId",
            teacher_user_id as "teacherUserId",
            status,
            payment_status as "paymentStatus",
            stripe_checkout_session_id as "stripeCheckoutSessionId"
       from lesson_bookings
      where id = $1
        and (student_user_id = $2 or teacher_user_id = $2)
      limit 1`,
    [bookingId, user.id]
  );
  const row = booking.rows[0];
  if (!row) throw serviceError("Lesson booking not found", 404);
  if (row.paymentStatus === "paid") {
    return { synced: true, bookingId, status: row.status, paymentStatus: row.paymentStatus };
  }
  if (!row.stripeCheckoutSessionId) throw serviceError("This lesson does not have a Stripe checkout session yet", 400);

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(row.stripeCheckoutSessionId)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok) throw serviceError(session.error?.message || "Stripe checkout session could not be verified", 502);
  if (session.metadata?.lessonBookingId && session.metadata.lessonBookingId !== bookingId) {
    throw serviceError("Stripe checkout session does not match this lesson", 409);
  }
  if (session.payment_status !== "paid") {
    return { synced: false, bookingId, status: row.status, paymentStatus: row.paymentStatus, stripePaymentStatus: session.payment_status || "" };
  }
  await markCheckoutSessionPaid(bookingId, session.payment_intent || null);
  return { synced: true, bookingId, status: "confirmed", paymentStatus: "paid" };
}

async function listLessons(user) {
  const result = await query(
    `select lb.id,
            lb.teacher_profile_id as "teacherProfileId",
            lb.teacher_user_id as "teacherUserId",
            lb.student_user_id as "studentUserId",
            tp.display_name as "teacherName",
            student.display_name as "studentName",
            lb.lesson_type as "lessonType",
            lb.title,
            lb.target_language as "targetLanguage",
            lb.starts_at as "startsAt",
            lb.ends_at as "endsAt",
            lb.duration_minutes as "durationMinutes",
            lb.max_students as "maxStudents",
            lb.status,
            lb.payment_status as "paymentStatus",
            lb.lesson_price_usd as "lessonPriceUsd",
            lb.platform_fee_usd as "platformFeeUsd",
            lb.total_student_charge_usd as "totalStudentChargeUsd",
            lb.teacher_payout_usd as "teacherPayoutUsd"
       from lesson_bookings lb
       join teacher_profiles tp on tp.id = lb.teacher_profile_id
       join users student on student.id = lb.student_user_id
      where lb.student_user_id = $1 or lb.teacher_user_id = $1
      order by lb.starts_at desc
      limit 80`,
    [user.id]
  );
  return { lessons: result.rows.map(mapBooking) };
}

async function listMyTeachers(user) {
  const result = await query(
    `select tsr.id,
            tsr.teacher_profile_id as "teacherProfileId",
            tp.display_name as "teacherName",
            tp.headline,
            coalesce(u.avatar, left(u.display_name, 2)) as avatar,
            case when u.avatar_box_file_id is not null then '/api/learners/' || u.id || '/avatar' else coalesce(u.avatar_url, '') end as "avatarUrl",
            tsr.first_lesson_at as "firstLessonAt",
            tsr.last_lesson_at as "lastLessonAt",
            tsr.total_lessons as "totalLessons"
       from teacher_student_relationships tsr
       join teacher_profiles tp on tp.id = tsr.teacher_profile_id
       join users u on u.id = tp.user_id
      where tsr.student_user_id = $1
      order by tsr.updated_at desc`,
    [user.id]
  );
  return { teachers: result.rows };
}

async function teacherDashboard(user) {
  await requireTeacherWorkspace(user);
  const [profiles, lessons, subscription] = await Promise.all([myProfiles(user), listLessons(user), teacherSubscriptionForUser(user.id)]);
  const teacherLessons = lessons.lessons.filter((lesson) => lesson.teacherUserId === user.id);
  const earnings = teacherLessons
    .filter((lesson) => lesson.paymentStatus === "paid")
    .reduce((sum, lesson) => sum + Number(lesson.teacherPayoutUsd || 0), 0);
  return {
    profiles: profiles.profiles,
    lessons: teacherLessons,
    subscription,
    stats: {
      profileCount: profiles.profiles.length,
      upcomingLessons: teacherLessons.filter((lesson) => new Date(lesson.startsAt) > new Date() && !CANCELLED_BOOKING_STATUSES.has(lesson.status)).length,
      totalEarningsUsd: Math.round(earnings * 100) / 100
    }
  };
}

function calendarRange(queryParams = {}) {
  const now = new Date();
  const start = queryParams.from ? new Date(queryParams.from) : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const end = queryParams.to ? new Date(queryParams.to) : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw serviceError("Choose a valid calendar range");
  return { start, end };
}

async function teacherCalendar(user, filters = {}) {
  await requireTeacherWorkspace(user);
  const { start, end } = calendarRange(filters);
  await expirePendingPaymentBookings();
  const params = [user.id, start, end];
  const clauses = ["lb.teacher_user_id = $1", "lb.starts_at < $3", "lb.ends_at > $2"];
  if (filters.teacherProfileId) {
    params.push(filters.teacherProfileId);
    clauses.push(`lb.teacher_profile_id = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`lb.status = $${params.length}`);
  }
  const [profiles, lessons, blocks, reschedules] = await Promise.all([
    myProfiles(user),
    query(
      `select lb.id,
              lb.teacher_profile_id as "teacherProfileId",
              lb.teacher_user_id as "teacherUserId",
              lb.student_user_id as "studentUserId",
              tp.display_name as "teacherName",
              student.display_name as "studentName",
              lb.lesson_type as "lessonType",
              lb.title,
              lb.target_language as "targetLanguage",
              lb.starts_at as "startsAt",
              lb.ends_at as "endsAt",
              lb.duration_minutes as "durationMinutes",
              lb.max_students as "maxStudents",
              lb.status,
              lb.payment_status as "paymentStatus",
              lb.lesson_price_usd as "lessonPriceUsd",
              lb.platform_fee_usd as "platformFeeUsd",
              lb.total_student_charge_usd as "totalStudentChargeUsd",
              lb.teacher_payout_usd as "teacherPayoutUsd",
              lb.cancel_reason as "cancelReason",
              lb.refund_status as "refundStatus"
         from lesson_bookings lb
         join teacher_profiles tp on tp.id = lb.teacher_profile_id
         join users student on student.id = lb.student_user_id
        where ${clauses.join(" and ")}
        order by lb.starts_at`,
      params
    ),
    query(
      `select tub.id,
              tub.teacher_profile_id as "teacherProfileId",
              tub.title,
              tub.reason,
              tub.timezone,
              tub.is_full_day as "isFullDay",
              tub.starts_at as "startsAt",
              tub.ends_at as "endsAt"
         from teacher_unavailable_blocks tub
         join teacher_profiles tp on tp.id = tub.teacher_profile_id
        where tp.user_id = $1
          and tub.starts_at < $3
          and tub.ends_at > $2
        order by tub.starts_at`,
      [user.id, start, end]
    ),
    query(
      `select lrr.id,
              lrr.lesson_id as "lessonId",
              lrr.requested_by_user_id as "requestedByUserId",
              requester.display_name as "requestedByName",
              lrr.proposed_start_time as "proposedStartTime",
              lrr.proposed_end_time as "proposedEndTime",
              lrr.reason,
              lrr.status,
              lrr.created_at as "createdAt"
         from lesson_reschedule_requests lrr
         join lesson_bookings lb on lb.id = lrr.lesson_id
         join users requester on requester.id = lrr.requested_by_user_id
        where lb.teacher_user_id = $1
          and lrr.created_at >= $2
          and lrr.created_at <= $3
        order by lrr.created_at desc`,
      [user.id, start, end]
    )
  ]);
  return { profiles: profiles.profiles, lessons: lessons.rows.map(mapBooking), unavailableBlocks: blocks.rows, rescheduleRequests: reschedules.rows };
}

async function cancelBooking(user, bookingId, payload = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const found = await client.query(
      `select id,
              teacher_user_id as "teacherUserId",
              student_user_id as "studentUserId",
              payment_status as "paymentStatus",
              status
         from lesson_bookings
        where id = $1
          and (student_user_id = $2 or teacher_user_id = $2)
        for update`,
      [bookingId, user.id]
    );
    const lesson = found.rows[0];
    if (!lesson || !ACTIVE_BOOKING_STATUSES.has(lesson.status)) throw serviceError("Lesson could not be canceled", 404);
    const status = lesson.teacherUserId === user.id ? "cancelled_by_teacher" : "cancelled_by_student";
    const otherUserId = lesson.teacherUserId === user.id ? lesson.studentUserId : lesson.teacherUserId;
    await client.query(
      `update lesson_bookings
          set status = $3,
              cancel_reason = $4,
              cancelled_at = now(),
              cancelled_by_user_id = $2,
              refund_status = case when payment_status = 'paid' then 'pending_manual_review' else 'not_required' end,
              updated_at = now()
        where id = $1`,
      [bookingId, user.id, status, text(payload.reason || "Cancelled from calendar", { max: 500 })]
    );
    await client.query(
      `insert into direct_conversations (participant_one, participant_two, conversation_type, lesson_booking_id)
       values ($1, $2, 'teacher_student', $3)
       on conflict do nothing`,
      [user.id, otherUserId, bookingId]
    ).catch(() => null);
    await client.query("commit");
    return listLessons(user);
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function saveBookingRules(user, payload) {
  await requireTeacherWorkspace(user);
  const profileId = text(payload.teacherProfileId, { required: true, max: 64 });
  const profile = await query("select id, user_id from teacher_profiles where id = $1 and user_id = $2", [profileId, user.id]);
  if (!profile.rows[0]) throw serviceError("Teacher profile not found", 404);
  const supportedDurations = String(payload.supportedDurations || "30,60")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => [15, 30, 45, 60, 90].includes(value));
  await query(
    `insert into teacher_booking_rules (
       teacher_user_id, teacher_profile_id, min_booking_notice_minutes, max_advance_booking_days,
       buffer_before_minutes, buffer_after_minutes, cancellation_cutoff_minutes, reschedule_cutoff_minutes,
       supported_durations, auto_confirm_bookings
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
     on conflict (teacher_profile_id)
     do update set min_booking_notice_minutes = excluded.min_booking_notice_minutes,
                   max_advance_booking_days = excluded.max_advance_booking_days,
                   buffer_before_minutes = excluded.buffer_before_minutes,
                   buffer_after_minutes = excluded.buffer_after_minutes,
                   cancellation_cutoff_minutes = excluded.cancellation_cutoff_minutes,
                   reschedule_cutoff_minutes = excluded.reschedule_cutoff_minutes,
                   supported_durations = excluded.supported_durations,
                   updated_at = now()`,
    [
      user.id,
      profileId,
      integer(payload.minBookingNoticeMinutes, { min: 0, max: 43200, fallback: 720 }),
      integer(payload.maxAdvanceBookingDays, { min: 1, max: 365, fallback: 30 }),
      integer(payload.bufferBeforeMinutes, { min: 0, max: 240, fallback: 10 }),
      integer(payload.bufferAfterMinutes, { min: 0, max: 240, fallback: 10 }),
      integer(payload.cancellationCutoffMinutes, { min: 0, max: 43200, fallback: 720 }),
      integer(payload.rescheduleCutoffMinutes, { min: 0, max: 43200, fallback: 720 }),
      supportedDurations.length ? supportedDurations : [30, 60]
    ]
  );
  return teacherCalendar(user, {});
}

async function createUnavailableBlock(user, payload) {
  await requireTeacherWorkspace(user);
  const profileId = text(payload.teacherProfileId, { required: true, max: 64 });
  const owner = await query("select id, timezone from teacher_profiles where id = $1 and user_id = $2", [profileId, user.id]);
  if (!owner.rows[0]) throw serviceError("Teacher profile not found", 404);
  const startsAt = new Date(payload.startsAt);
  const endsAt = new Date(payload.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) throw serviceError("Choose a valid unavailable time");
  await query(
    `insert into teacher_unavailable_blocks (teacher_profile_id, teacher_user_id, title, starts_at, ends_at, timezone, reason, is_full_day)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      profileId,
      user.id,
      text(payload.title || "Unavailable", { max: 160 }),
      startsAt,
      endsAt,
      text(payload.timezone || owner.rows[0].timezone || "UTC", { max: 80 }),
      text(payload.reason, { max: 500 }),
      payload.isFullDay === true || String(payload.isFullDay) === "true"
    ]
  );
  return teacherCalendar(user, {});
}

async function deleteUnavailableBlock(user, blockId) {
  await requireTeacherWorkspace(user);
  const result = await query(
    `delete from teacher_unavailable_blocks tub
      using teacher_profiles tp
      where tub.id = $1
        and tp.id = tub.teacher_profile_id
        and tp.user_id = $2
      returning tub.id`,
    [blockId, user.id]
  );
  if (!result.rows[0]) throw serviceError("Unavailable block not found", 404);
  return teacherCalendar(user, {});
}

async function createRescheduleRequest(user, bookingId, payload) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const booking = await client.query(
      `select lb.*,
              tp.display_name as "displayName",
              tp.headline,
              tp.bio,
              tp.native_language as "nativeLanguage",
              tp.timezone,
              tp.hourly_rate_usd as "hourlyRateUsd",
              tp.trial_rate_usd as "trialRateUsd",
              tp.min_lesson_minutes as "minLessonMinutes",
              tp.max_lesson_minutes as "maxLessonMinutes",
              tp.group_lesson_enabled as "groupLessonEnabled",
              tp.group_max_students as "groupMaxStudents",
              tp.status as "profileStatus",
              coalesce(tsp.can_create_group_lessons, false) as "canCreateGroupLessons"
         from lesson_bookings lb
         join teacher_profiles tp on tp.id = lb.teacher_profile_id
         left join teacher_subscriptions ts on ts.user_id = tp.user_id and ts.status in ('active', 'past_due')
         left join teacher_subscription_plans tsp on tsp.plan_key = ts.plan_key
        where lb.id = $1
          and (lb.teacher_user_id = $2 or lb.student_user_id = $2)
        for update`,
      [bookingId, user.id]
    );
    const row = booking.rows[0];
    if (!row || !ACTIVE_BOOKING_STATUSES.has(row.status)) throw serviceError("Lesson not found", 404);
    const profile = mapProfile({
      id: row.teacher_profile_id,
      userId: row.teacher_user_id,
      displayName: row.displayName,
      headline: row.headline,
      bio: row.bio,
      nativeLanguage: row.nativeLanguage,
      timezone: row.timezone,
      hourlyRateUsd: row.hourlyRateUsd,
      trialRateUsd: row.trialRateUsd,
      minLessonMinutes: row.minLessonMinutes,
      maxLessonMinutes: row.maxLessonMinutes,
      groupLessonEnabled: row.groupLessonEnabled,
      groupMaxStudents: row.groupMaxStudents,
      status: row.profileStatus,
      canCreateGroupLessons: row.canCreateGroupLessons,
      languages: []
    });
    const slot = await validateBookingSlot(client, profile, { ...payload, lessonType: row.lesson_type, durationMinutes: row.duration_minutes });
    const request = await client.query(
      `insert into lesson_reschedule_requests (lesson_id, requested_by_user_id, proposed_start_time, proposed_end_time, reason)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [bookingId, user.id, slot.startsAt, slot.endsAt, text(payload.reason || "Reschedule proposed", { max: 500 })]
    );
    await client.query("update lesson_bookings set status = 'reschedule_requested', updated_at = now() where id = $1", [bookingId]);
    await client.query("commit");
    return { requestId: request.rows[0].id };
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function respondToRescheduleRequest(user, requestId, payload) {
  const accept = payload.action === "accept";
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      `select lrr.id,
              lrr.lesson_id as "lessonId",
              lrr.requested_by_user_id as "requestedByUserId",
              lrr.proposed_start_time as "proposedStartTime",
              lrr.proposed_end_time as "proposedEndTime",
              lb.student_user_id as "studentUserId",
              lb.teacher_user_id as "teacherUserId"
         from lesson_reschedule_requests lrr
         join lesson_bookings lb on lb.id = lrr.lesson_id
        where lrr.id = $1
          and lrr.status = 'pending'
          and (lb.student_user_id = $2 or lb.teacher_user_id = $2)
        for update`,
      [requestId, user.id]
    );
    const requestRow = result.rows[0];
    if (!requestRow) throw serviceError("Reschedule request not found", 404);
    if (requestRow.requestedByUserId === user.id) throw serviceError("Another participant must respond to this reschedule request", 403);
    await client.query(
      `update lesson_reschedule_requests
          set status = $2,
              responded_by_user_id = $3,
              responded_at = now(),
              updated_at = now()
        where id = $1`,
      [requestId, accept ? "accepted" : "rejected", user.id]
    );
    if (accept) {
      await client.query(
        `update lesson_bookings
            set starts_at = $2,
                ends_at = $3,
                status = 'rescheduled',
                updated_at = now()
          where id = $1`,
        [requestRow.lessonId, requestRow.proposedStartTime, requestRow.proposedEndTime]
      );
    } else {
      await client.query("update lesson_bookings set status = 'confirmed', updated_at = now() where id = $1 and status = 'reschedule_requested'", [requestRow.lessonId]);
    }
    await client.query("commit");
    return { ok: true };
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function classroomToken(user, bookingId) {
  const result = await query(
    `select lb.id,
            lb.teacher_user_id as "teacherUserId",
            lb.student_user_id as "studentUserId",
            lb.status,
            lb.payment_status as "paymentStatus",
            lb.starts_at as "startsAt",
            lb.ends_at as "endsAt",
            lb.livekit_room_name as "livekitRoomName",
            cs.id as "sessionId",
            cs.status as "sessionStatus"
       from lesson_bookings lb
       join lesson_participants lp on lp.lesson_booking_id = lb.id and lp.user_id = $2
       join classroom_sessions cs on cs.lesson_booking_id = lb.id
      where lb.id = $1`,
    [bookingId, user.id]
  );
  const lesson = result.rows[0];
  if (!lesson) throw serviceError("Classroom not found", 404);
  if (lesson.paymentStatus !== "paid") throw serviceError("Payment must be confirmed before joining the classroom", 402);
  const now = Date.now();
  const earliest = new Date(lesson.startsAt).getTime() - JOIN_EARLY_MINUTES * 60 * 1000;
  const latest = new Date(lesson.endsAt).getTime() + JOIN_LATE_MINUTES * 60 * 1000;
  if (now < earliest) throw serviceError(`Classroom opens ${JOIN_EARLY_MINUTES} minutes before the lesson starts`);
  if (now > latest) throw serviceError("This classroom is closed");
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
    throw serviceError("Missing LiveKit env vars for classroom tokens", 500);
  }
  if (lesson.teacherUserId === user.id && lesson.sessionStatus === "scheduled") {
    await query("update classroom_sessions set status = 'active', started_by_user_id = $2, started_at = coalesce(started_at, now()) where id = $1", [lesson.sessionId, user.id]);
    await query("update lesson_bookings set status = 'active', updated_at = now() where id = $1 and status = 'confirmed'", [bookingId]);
  } else if (lesson.sessionStatus === "scheduled") {
    throw serviceError("The teacher has not started the classroom yet");
  }
  await query(
    `update lesson_participants
        set joined_at = coalesce(joined_at, now())
      where lesson_booking_id = $1 and user_id = $2`,
    [bookingId, user.id]
  );
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: `${user.id}:${bookingId}`,
    name: user.displayName || "Learner",
    ttl: 2 * 60 * 60
  });
  token.addGrant({
    roomJoin: true,
    room: lesson.livekitRoomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
    canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE]
  });
  return { livekitUrl: process.env.LIVEKIT_URL, token: await token.toJwt(), roomName: lesson.livekitRoomName };
}

async function leaveClassroom(user, bookingId) {
  const result = await query(
    `select teacher_user_id as "teacherUserId" from lesson_bookings where id = $1 and (teacher_user_id = $2 or student_user_id = $2)`,
    [bookingId, user.id]
  );
  if (!result.rows[0]) throw serviceError("Classroom not found", 404);
  await query("update lesson_participants set left_at = now() where lesson_booking_id = $1 and user_id = $2", [bookingId, user.id]);
  if (result.rows[0].teacherUserId === user.id) {
    await query("update classroom_sessions set status = 'ended', ended_at = coalesce(ended_at, now()) where lesson_booking_id = $1", [bookingId]);
    await query("update lesson_bookings set status = case when status = 'active' then 'completed' else status end, updated_at = now() where id = $1", [bookingId]);
  }
  return { ok: true };
}

async function createNote(user, payload) {
  const bookingId = text(payload.lessonBookingId, { required: true, max: 64 });
  const booking = await query("select teacher_user_id, student_user_id from lesson_bookings where id = $1 and (teacher_user_id = $2 or student_user_id = $2)", [bookingId, user.id]);
  if (!booking.rows[0]) throw serviceError("Lesson not found", 404);
  const visibility = payload.visibility === "teacher_private" && booking.rows[0].teacher_user_id === user.id ? "teacher_private" : "shared";
  await query(
    `insert into lesson_notes (lesson_booking_id, author_user_id, visibility, body)
     values ($1, $2, $3, $4)`,
    [bookingId, user.id, visibility, text(payload.body, { required: true, max: 4000 })]
  );
  return listNotes(user);
}

async function listNotes(user) {
  const result = await query(
    `select ln.id,
            ln.lesson_booking_id as "lessonBookingId",
            ln.author_user_id as "authorUserId",
            u.display_name as "authorName",
            ln.visibility,
            ln.body,
            ln.created_at as "createdAt"
       from lesson_notes ln
       join lesson_bookings lb on lb.id = ln.lesson_booking_id
       join users u on u.id = ln.author_user_id
      where (lb.teacher_user_id = $1 or lb.student_user_id = $1)
        and (ln.visibility = 'shared' or lb.teacher_user_id = $1)
      order by ln.created_at desc
      limit 80`,
    [user.id]
  );
  return { notes: result.rows };
}

async function createResource(user, payload) {
  await requireTeacherWorkspace(user);
  await query(
    `insert into teacher_resources (teacher_user_id, teacher_profile_id, title, resource_type, url, body, visibility)
     values ($1, nullif($2, '')::uuid, $3, $4, $5, $6, $7)`,
    [
      user.id,
      payload.teacherProfileId || "",
      text(payload.title, { required: true, max: 160 }),
      payload.resourceType === "text" ? "text" : "link",
      text(payload.url, { max: 500 }),
      text(payload.body, { max: 4000 }),
      payload.visibility === "lesson_students" ? "lesson_students" : "teacher_only"
    ]
  );
  return listResources(user);
}

async function listResources(user) {
  await requireTeacherWorkspace(user);
  const result = await query(
    `select id, teacher_profile_id as "teacherProfileId", title, resource_type as "resourceType", url, body, visibility, created_at as "createdAt"
       from teacher_resources
      where teacher_user_id = $1
      order by created_at desc
      limit 80`,
    [user.id]
  );
  return { resources: result.rows };
}

async function createTemplate(user, payload) {
  await requireTeacherWorkspace(user);
  await query(
    `insert into lesson_templates (teacher_user_id, teacher_profile_id, title, target_language, level, lesson_type, body)
     values ($1, nullif($2, '')::uuid, $3, $4, $5, $6, $7)`,
    [
      user.id,
      payload.teacherProfileId || "",
      text(payload.title, { required: true, max: 160 }),
      text(payload.targetLanguage, { max: 80 }),
      payload.level ? normalizeLevel(payload.level) : null,
      normalizeLessonType(payload.lessonType),
      text(payload.body, { required: true, max: 5000 })
    ]
  );
  return listTemplates(user);
}

async function listTemplates(user) {
  await requireTeacherWorkspace(user);
  const result = await query(
    `select id, teacher_profile_id as "teacherProfileId", title, target_language as "targetLanguage", level, lesson_type as "lessonType", body, created_at as "createdAt"
       from lesson_templates
      where teacher_user_id = $1
      order by created_at desc
      limit 80`,
    [user.id]
  );
  return { templates: result.rows };
}

async function createReview(user, profileId, payload) {
  const booking = await query(
    `select id from lesson_bookings
      where id = $1 and teacher_profile_id = $2 and student_user_id = $3 and status in ('completed', 'active', 'confirmed')`,
    [payload.lessonBookingId, profileId, user.id]
  );
  if (!booking.rows[0]) throw serviceError("You can review a teacher after booking a lesson", 400);
  await query(
    `insert into teacher_reviews (teacher_profile_id, lesson_booking_id, student_user_id, rating, body)
     values ($1, $2, $3, $4, $5)
     on conflict (teacher_profile_id, lesson_booking_id, student_user_id)
     do update set rating = excluded.rating, body = excluded.body, created_at = now()`,
    [profileId, booking.rows[0].id, user.id, integer(payload.rating, { min: 1, max: 5, fallback: 5 }), text(payload.body, { max: 1000 })]
  );
  return getProfile(user, profileId);
}

async function sendTeacherMessage(user, payload) {
  const recipientId = text(payload.recipientId, { required: true, max: 64 });
  const body = text(payload.body, { required: true, max: 1000 });
  if (recipientId === user.id) throw serviceError("Choose another learner to message");
  const recipient = await query("select id from users where id = $1", [recipientId]);
  if (!recipient.rows[0]) throw serviceError("Recipient not found", 404);
  const client = await pool.connect();
  try {
    await client.query("begin");
    let conversation = await client.query(
      `select id from direct_conversations
        where (participant_one = $1 and participant_two = $2)
           or (participant_one = $2 and participant_two = $1)
        limit 1`,
      [user.id, recipientId]
    );
    if (!conversation.rows[0]) {
      conversation = await client.query(
        `insert into direct_conversations (participant_one, participant_two, conversation_type, teacher_profile_id, lesson_booking_id)
         values ($1, $2, 'teacher_student', nullif($3, '')::uuid, nullif($4, '')::uuid)
         returning id`,
        [user.id, recipientId, payload.teacherProfileId || "", payload.lessonBookingId || ""]
      );
    } else {
      await client.query(
        `update direct_conversations
            set conversation_type = 'teacher_student',
                teacher_profile_id = coalesce(nullif($2, '')::uuid, teacher_profile_id),
                lesson_booking_id = coalesce(nullif($3, '')::uuid, lesson_booking_id),
                updated_at = now()
          where id = $1`,
        [conversation.rows[0].id, payload.teacherProfileId || "", payload.lessonBookingId || ""]
      );
    }
    await client.query(
      `insert into direct_messages (conversation_id, sender_id, recipient_id, body, message_context)
       values ($1, $2, $3, $4, 'teacher_student')`,
      [conversation.rows[0].id, user.id, recipientId, body]
    );
    await client.query("update direct_conversations set updated_at = now() where id = $1", [conversation.rows[0].id]);
    await client.query("commit");
    const authService = require("./auth.service");
    const learningService = require("./learning.service");
    return learningService.getState(await authService.getUserById(user.id));
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function handleStripeWebhook(req) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) throw serviceError("Stripe webhook is not configured", 500);
  const signature = req.headers["stripe-signature"];
  if (!Buffer.isBuffer(req.body) || !verifyStripeSignature(req.body, signature)) throw serviceError("Invalid Stripe webhook signature", 400);
  const event = JSON.parse(req.body.toString("utf8"));
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.lessonBookingId;
    if (bookingId) {
      await markCheckoutSessionPaid(bookingId, session.payment_intent || null);
    }
  }
  return { received: true };
}

module.exports = {
  searchTeachers,
  getProfile,
  myProfiles,
  saveProfile,
  deleteProfile,
  getAvailability,
  saveAvailability,
  getBookingPage,
  availableDays,
  availableSlots,
  createBooking,
  syncStripePayment,
  listLessons,
  listMyTeachers,
  teacherDashboard,
  teacherCalendar,
  cancelBooking,
  saveBookingRules,
  createUnavailableBlock,
  deleteUnavailableBlock,
  createRescheduleRequest,
  respondToRescheduleRequest,
  classroomToken,
  leaveClassroom,
  listNotes,
  createNote,
  listResources,
  createResource,
  listTemplates,
  createTemplate,
  createReview,
  sendTeacherMessage,
  teacherSubscriptionForUser,
  handleStripeWebhook
};
