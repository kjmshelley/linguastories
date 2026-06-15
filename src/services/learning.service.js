const { pool, query } = require("../db/pool");
const configService = require("./config.service");
const storageService = require("./storage.service");
const subscriptionPolicy = require("./subscription-policy.service");
const accountService = require("./account.service");
const { LANGUAGE_SKILL_LEVELS, normalizeLanguageSkillLevel } = require("../constants/language-levels");

const CEFR_LEVELS = new Set(LANGUAGE_SKILL_LEVELS);
const PROFILE_VISIBILITY = new Set(["Public", "Private"]);

function serviceError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function notFound(message = "Not found") {
  return serviceError(message, 404);
}

function cleanText(value, { required = false, max = 255, fallback = "" } = {}) {
  const text = String(value ?? fallback).trim().replace(/\s+/g, " ").slice(0, max);
  if (required && !text) throw serviceError("Required field is missing");
  return text;
}

function normalizeLevel(value) {
  const level = normalizeLanguageSkillLevel(value);
  if (!CEFR_LEVELS.has(level)) throw serviceError("Choose a valid skill level");
  return level;
}

function normalizeVisibility(value) {
  const visibility = String(value || "Private");
  return PROFILE_VISIBILITY.has(visibility) ? visibility : "Private";
}

async function subscriptionFor(user) {
  const account = await accountService.getAccount(user.id).catch(() => null);
  return subscriptionPolicy.subscriptionForUser({ ...user, account });
}

async function getStoredAsset(key) {
  const normalizedKey = String(key || "").replace(/^\/+/, "");
  const objectKey = normalizedKey.startsWith("linguastories-assets/")
    ? normalizedKey
    : `linguastories-assets/${normalizedKey}`;
  if (!objectKey.startsWith("linguastories-assets/")) throw notFound("Asset not found");
  return storageService.downloadBoxFile(objectKey);
}

async function getPostImage(postId) {
  const result = await query("select image_path_file_id from posts where id = $1", [postId]);
  const key = result.rows[0]?.image_path_file_id;
  if (!key) throw notFound("Image not found");
  return storageService.downloadBoxFile(key);
}

async function getPostThumbnail(postId) {
  const result = await query("select image_thumb_path_file_id from posts where id = $1", [postId]);
  const key = result.rows[0]?.image_thumb_path_file_id;
  if (!key) throw notFound("Image not found");
  return storageService.downloadBoxFile(key);
}

async function getLearnerAvatar(userId) {
  const result = await query("select avatar_box_file_id from users where id = $1", [userId]);
  const key = result.rows[0]?.avatar_box_file_id;
  if (!key) throw notFound("Avatar not found");
  return storageService.downloadBoxFile(key);
}

async function getLearningLanguages(userId) {
  const result = await query(
    `select language,
            current_level as "currentLevel",
            current_streak as "currentStreak",
            longest_streak as "longestStreak",
            listening_time as "listeningTime",
            profile_visibility as "profileVisibility",
            active,
            created_at as "createdAt",
            updated_at as "updatedAt"
       from user_languages
      where user_id = $1 and active = true
      order by updated_at desc, created_at desc`,
    [userId]
  );
  return result.rows;
}

async function getPosts(user) {
  const posts = await query(
    `select p.id,
            p.user_id as "userId",
            u.display_name as author,
            coalesce(u.avatar, left(u.display_name, 2)) as avatar,
            coalesce(u.avatar_url, '') as "avatarUrl",
            u.native_language as "nativeLanguage",
            u.target_language as "authorLanguage",
            p.type,
            p.body,
            p.target_language as "targetLanguage",
            p.created_at as "createdAt",
            p.created_at::date::text as date,
            (select count(*)::int from post_likes pl where pl.post_id = p.id) as likes,
            exists(select 1 from post_likes pl where pl.post_id = p.id and pl.user_id = $1) as liked,
            (select count(*)::int from post_comments pc where pc.post_id = p.id) as comments,
            exists(select 1 from user_follows uf where uf.follower_id = $1 and uf.following_id = p.user_id) as following,
            case when p.image_path_file_id is not null then '/api/posts/' || p.id || '/image' else '' end as "imageUrl",
            case when p.image_thumb_path_file_id is not null then '/api/posts/' || p.id || '/thumbnail' else '' end as "imageThumbUrl"
       from posts p
       join users u on u.id = p.user_id
      where p.created_at >= now() - interval '7 days'
      order by p.created_at desc
      limit 80`,
    [user.id]
  );
  const comments = await query(
    `select pc.id,
            pc.post_id as "postId",
            pc.user_id as "userId",
            u.display_name as author,
            coalesce(u.avatar, left(u.display_name, 2)) as avatar,
            coalesce(u.avatar_url, '') as "avatarUrl",
            pc.body,
            pc.created_at as "createdAt"
       from post_comments pc
       join users u on u.id = pc.user_id
      where pc.post_id = any($1::uuid[])
      order by pc.created_at asc`,
    [posts.rows.map((post) => post.id)]
  );
  const groupedComments = comments.rows.reduce((groups, comment) => {
    groups[comment.postId] = groups[comment.postId] || [];
    groups[comment.postId].push(comment);
    return groups;
  }, {});
  return posts.rows.map((post) => ({ ...post, commentItems: groupedComments[post.id] || [] }));
}

async function getLearners(user) {
  const result = await query(
    `select u.id,
            u.display_name as name,
            coalesce(u.avatar, left(u.display_name, 2)) as avatar,
            coalesce(u.avatar_url, '') as "avatarUrl",
            u.bio,
            u.native_language as "nativeLanguage",
            u.target_language as "targetLanguage",
            u.current_level as "currentLevel",
            exists(select 1 from user_follows uf where uf.follower_id = $1 and uf.following_id = u.id) as following,
            (select count(*)::int from user_follows uf where uf.following_id = u.id) as followers,
            (select count(*)::int from posts p where p.user_id = u.id) as posts
       from users u
      where u.id <> $1
      order by followers desc, u.created_at desc
      limit 80`,
    [user.id]
  );
  return result.rows;
}

async function getLearnerActivities() {
  const result = await query(
    `select p.user_id as "userId",
            p.type as label,
            p.body as detail,
            p.target_language as "targetLanguage",
            p.created_at::date::text as date
       from posts p
      order by p.created_at desc
      limit 120`
  );
  return result.rows.reduce((groups, activity) => {
    groups[activity.userId] = groups[activity.userId] || [];
    groups[activity.userId].push(activity);
    return groups;
  }, {});
}

async function getDirectChat(user) {
  const conversations = await query(
    `select dc.id,
            case when dc.participant_one = $1 then dc.participant_two else dc.participant_one end as "otherUserId",
            dc.conversation_type as "conversationType",
            dc.teacher_profile_id as "teacherProfileId",
            dc.lesson_booking_id as "lessonBookingId",
            dc.updated_at as "updatedAt",
            u.display_name as "otherName",
            coalesce(u.avatar, left(u.display_name, 2)) as "otherAvatar",
            coalesce(u.avatar_url, '') as "otherAvatarUrl",
            (select count(*)::int
               from direct_messages unread
              where unread.conversation_id = dc.id
                and unread.recipient_id = $1
                and unread.read_at is null) as "unreadCount"
       from direct_conversations dc
       join users u on u.id = case when dc.participant_one = $1 then dc.participant_two else dc.participant_one end
      where dc.participant_one = $1 or dc.participant_two = $1
      order by dc.updated_at desc
      limit 30`,
    [user.id]
  );
  const messages = await query(
    `select id,
            conversation_id as "conversationId",
            sender_id as "senderId",
            recipient_id as "recipientId",
            body,
            message_context as "messageContext",
            read_at as "readAt",
            created_at as "createdAt"
       from direct_messages
      where conversation_id = any($1::uuid[])
      order by created_at asc`,
    [conversations.rows.map((conversation) => conversation.id)]
  );
  const groupedMessages = messages.rows.reduce((groups, message) => {
    groups[message.conversationId] = groups[message.conversationId] || [];
    groups[message.conversationId].push(message);
    return groups;
  }, {});
  return conversations.rows.map((conversation) => {
    const conversationMessages = groupedMessages[conversation.id] || [];
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    return {
      ...conversation,
      unread: conversation.unreadCount,
      lastMessage: lastMessage?.body || "",
      lastMessageMine: lastMessage?.senderId === user.id,
      messages: conversationMessages.map((message) => ({
        ...message,
        mine: message.senderId === user.id
      }))
    };
  });
}

async function getNotifications(user, directChat) {
  const accountNotifications = await accountService.listAccountNotifications(user.id).catch(() => []);
  const unread = directChat.reduce((sum, conversation) => sum + Number(conversation.unreadCount || conversation.unread || 0), 0);
  return [
    ...accountNotifications,
    ...(unread ? [{ type: "messages", label: "Messages", title: "Unread messages", body: `You have ${unread} unread message${unread === 1 ? "" : "s"}.`, tone: "info" }] : [])
  ];
}

async function getState(user) {
  const [subscription, learningLanguages, posts, learners, learnerActivities, directChat] = await Promise.all([
    subscriptionFor(user),
    getLearningLanguages(user.id),
    getPosts(user),
    getLearners(user),
    getLearnerActivities(),
    getDirectChat(user)
  ]);
  return {
    user: { ...user, subscription },
    subscription,
    learningLanguages,
    posts,
    learners,
    learnerActivities,
    directChat,
    notifications: await getNotifications(user, directChat),
    dashboard: {
      communityPosts: posts.length,
      following: learners.filter((learner) => learner.following).length,
      unreadMessages: directChat.reduce((sum, conversation) => sum + Number(conversation.unreadCount || conversation.unread || 0), 0)
    }
  };
}

async function ensureSupportedLanguage(language) {
  if (!(await configService.isSupportedLanguage(language))) throw serviceError("Choose a supported language");
}

async function addLearningLanguage(user, payload) {
  const language = cleanText(payload.language, { required: true, max: 80 });
  await ensureSupportedLanguage(language);
  const currentLevel = normalizeLevel(payload.currentLevel);
  const profileVisibility = normalizeVisibility(payload.profileVisibility);
  await query(
    `insert into user_languages (user_id, language, current_level, profile_visibility, active, updated_at)
     values ($1, $2, $3, $4, true, now())
     on conflict (user_id, language)
     do update set current_level = excluded.current_level,
                   profile_visibility = excluded.profile_visibility,
                   active = true,
                   updated_at = now()`,
    [user.id, language, currentLevel, profileVisibility]
  );
  return getState(user);
}

async function updateLearningLanguage(user, payload) {
  const language = cleanText(payload.language, { required: true, max: 80 });
  const profileVisibility = payload.profileVisibility ? normalizeVisibility(payload.profileVisibility) : null;
  const result = await query(
    `update user_languages
        set current_level = $3,
            profile_visibility = coalesce($4, profile_visibility),
            updated_at = now()
      where user_id = $1 and language = $2 and active = true
      returning language`,
    [user.id, language, normalizeLevel(payload.currentLevel), profileVisibility]
  );
  if (!result.rows[0]) throw notFound("Language profile not found");
  return getState(user);
}

async function removeLearningLanguage(user, payload) {
  const language = cleanText(payload.language, { required: true, max: 80 });
  await query("update user_languages set active = false, updated_at = now() where user_id = $1 and language = $2", [user.id, language]);
  return getState(user);
}

async function createPost(user, payload) {
  const type = cleanText(payload.type, { fallback: "Practice Note", max: 60 });
  const body = cleanText(payload.body, { required: true, max: 5000 });
  const targetLanguage = cleanText(payload.targetLanguage, { max: 80 });
  const image = await storageService.uploadCommunityPostImage({
    userId: user.id,
    fileName: payload.imageFileName || "community-post.webp",
    dataUrl: payload.imageDataUrl,
    thumbnailDataUrl: payload.imageThumbnailDataUrl
  });
  await query(
    `insert into posts (user_id, type, body, target_language, image_path_file_id, image_thumb_path_file_id)
     values ($1, $2, $3, $4, $5, $6)`,
    [user.id, type, body, targetLanguage || null, image?.boxFileId || null, image?.thumbnailBoxFileId || null]
  );
  return getState(user);
}

async function togglePostLike(user, postId) {
  const existing = await query("select 1 from post_likes where post_id = $1 and user_id = $2", [postId, user.id]);
  if (existing.rows[0]) {
    await query("delete from post_likes where post_id = $1 and user_id = $2", [postId, user.id]);
  } else {
    await query("insert into post_likes (post_id, user_id) values ($1, $2) on conflict do nothing", [postId, user.id]);
  }
  return getState(user);
}

async function createPostComment(user, postId, payload) {
  const body = cleanText(payload.body, { required: true, max: 255 });
  await query("insert into post_comments (post_id, user_id, body) values ($1, $2, $3)", [postId, user.id, body]);
  return getState(user);
}

async function toggleFollow(user, learnerId) {
  if (learnerId === user.id) throw serviceError("Choose another learner to follow");
  const existing = await query("select 1 from user_follows where follower_id = $1 and following_id = $2", [user.id, learnerId]);
  if (existing.rows[0]) {
    await query("delete from user_follows where follower_id = $1 and following_id = $2", [user.id, learnerId]);
  } else {
    await query("insert into user_follows (follower_id, following_id) values ($1, $2) on conflict do nothing", [user.id, learnerId]);
  }
  return getState(user);
}

async function sendDirectMessage(user, payload) {
  const recipientId = cleanText(payload.recipientId, { required: true, max: 64 });
  const body = cleanText(payload.body, { required: true, max: 1000 });
  if (recipientId === user.id) throw serviceError("Choose another learner to message");
  const recipient = await query("select id from users where id = $1", [recipientId]);
  if (!recipient.rows[0]) throw notFound("Recipient not found");
  const client = await pool.connect();
  try {
    await client.query("begin");
    let conversation = await client.query(
      `select id
         from direct_conversations
        where (participant_one = $1 and participant_two = $2)
           or (participant_one = $2 and participant_two = $1)
        limit 1`,
      [user.id, recipientId]
    );
    if (!conversation.rows[0]) {
      conversation = await client.query(
        `insert into direct_conversations (participant_one, participant_two, conversation_type)
         values ($1, $2, 'community')
         returning id`,
        [user.id, recipientId]
      );
    }
    await client.query(
      `insert into direct_messages (conversation_id, sender_id, recipient_id, body, message_context)
       values ($1, $2, $3, $4, 'community')`,
      [conversation.rows[0].id, user.id, recipientId, body]
    );
    await client.query("update direct_conversations set updated_at = now() where id = $1", [conversation.rows[0].id]);
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

async function markDirectConversationRead(user, conversationId) {
  await query(
    `update direct_messages
        set read_at = now()
      where conversation_id = $1
        and recipient_id = $2
        and read_at is null`,
    [conversationId, user.id]
  );
  return getState(user);
}

module.exports = {
  getState,
  getStoredAsset,
  getPostImage,
  getPostThumbnail,
  getLearnerAvatar,
  addLearningLanguage,
  updateLearningLanguage,
  removeLearningLanguage,
  createPost,
  togglePostLike,
  createPostComment,
  toggleFollow,
  sendDirectMessage,
  markDirectConversationRead
};
