const { pool, query } = require("../db/pool");
const { today, addDays } = require("../utils/date");
const configService = require("./config.service");
const storageService = require("./storage.service");
const subscriptionPolicy = require("./subscription-policy.service");
const accountService = require("./account.service");

const reviewDelay = { Again: 0, Hard: 1, Good: 3, Easy: 7 };
const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const PROFILE_VISIBILITIES = new Set(["Public", "Private"]);
const DECK_VISIBILITIES = new Set(["Public", "Private"]);

function normalizeLevel(level = "A1") {
  const value = String(level || "A1").trim().toUpperCase();
  if (!CEFR_LEVELS.has(value)) {
    const error = new Error("Choose a valid current level");
    error.status = 400;
    throw error;
  }
  return value;
}

function normalizeProfileVisibility(visibility = "Private") {
  const value = String(visibility || "Private").trim();
  if (!PROFILE_VISIBILITIES.has(value)) {
    const error = new Error("Choose a valid profile visibility");
    error.status = 400;
    throw error;
  }
  return value;
}

function normalizeDeckVisibility(visibility = "Private") {
  const value = String(visibility || "Private").trim().toLowerCase() === "public" ? "Public" : "Private";
  if (!DECK_VISIBILITIES.has(value)) {
    const error = new Error("Choose a valid deck visibility");
    error.status = 400;
    throw error;
  }
  return value;
}

function subscriptionError(message) {
  const error = new Error(message);
  error.status = 402;
  return error;
}

function slug(value) {
  return String(value || "deck")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "deck";
}

async function awardCoins(client, userId, amount, label) {
  const rule = await client.query(
    `select id
       from coin_rules
      where label = $1 and active = true
      limit 1`,
    [label]
  );
  await client.query(
    `insert into coin_transactions (user_id, coin_rule_id, amount, label)
     values ($1, $2, $3, $4)`,
    [userId, rule.rows[0]?.id || null, amount, label]
  );

  if (amount >= 0) {
    await client.query(
      `update wallets
          set balance = balance + $2,
              lifetime_earned = lifetime_earned + $2,
              daily_earned = daily_earned + $2,
              weekly_earned = weekly_earned + $2
        where user_id = $1`,
      [userId, amount]
    );
  } else {
    await client.query(
      `update wallets
          set balance = balance + $2,
              lifetime_spent = lifetime_spent + abs($2)
        where user_id = $1`,
      [userId, amount]
    );
  }
}

async function getWallet(userId) {
  const wallet = await query(
    `select balance,
            lifetime_earned as "lifetimeEarned",
            lifetime_spent as "lifetimeSpent",
            daily_earned as "dailyEarned",
            weekly_earned as "weeklyEarned"
       from wallets
      where user_id = $1`,
    [userId]
  );

  const transactions = await query(
    `select id, amount, label, created_at::date::text as date
       from coin_transactions
      where user_id = $1
        and created_at >= current_date - interval '90 days'
      order by created_at desc
      limit 250`,
    [userId]
  );

  return { ...wallet.rows[0], transactions: transactions.rows };
}

async function getCoinRules() {
  const result = await query(
    `select rule_key as "ruleKey",
            label,
            amount,
            rule_type as "ruleType",
            trigger_event as "triggerEvent"
       from coin_rules
      where active = true
      order by rule_type asc, amount desc, label asc`
  );
  return result.rows;
}

async function getSentences(userId) {
  const result = await query(
    `select s.id,
            s.target,
            s.translation,
            coalesce(s.romanization, '') as romanization,
            s.source_language as "sourceLanguage",
            s.target_language as "targetLanguage",
            coalesce(s.audio_url, '') as "audioUrl",
            coalesce(s.image_url, '') as "imageUrl",
            coalesce(s.video_url, '') as "videoUrl",
            s.topic,
            s.level,
            s.difficulty,
            coalesce(s.notes, '') as notes,
            s.variations,
            coalesce(r.state, 'New') as state,
            coalesce(r.due_date, current_date)::text as "dueDate",
            coalesce(r.last_rating, '') as "lastRating",
            coalesce(s.source, 'Sentence Library') as source
       from sentences s
       left join user_sentence_reviews r on r.sentence_id = s.id and r.user_id = $1
      order by s.created_at desc`,
    [userId]
  );
  return result.rows;
}

function reviewStateForSentences(sentences) {
  if (!sentences.length) return "New";
  if (sentences.every((sentence) => sentence.state === "Mastered")) return "Mastered";
  if (sentences.some((sentence) => sentence.dueDate <= today() && sentence.state !== "Mastered")) return "Review Due";
  if (sentences.some((sentence) => sentence.state === "Review" || sentence.state === "Learning")) return "In Progress";
  return "New";
}

function deckActionForStatus(status) {
  if (status === "Mastered") return "Mastered";
  if (status === "Review Due") return "Practice Review";
  if (status === "In Progress") return "Continue";
  return "Start";
}

function buildDeckProgress(sentences) {
  if (!sentences.length) return 0;
  const points = sentences.reduce((sum, sentence) => {
    if (sentence.state === "Mastered") return sum + 1;
    if (sentence.state === "Review") return sum + 0.65;
    if (sentence.state === "Learning") return sum + 0.3;
    return sum;
  }, 0);
  return Math.round((points / sentences.length) * 100);
}

async function getSentenceDecks(user, sentences) {
  const decks = await query(
    `select d.id,
            d.user_id as "creatorId",
            d.user_id as "ownerId",
            case when d.deck_kind = 'System' then 'LinguaStories' else u.display_name end as creator,
            case when d.deck_kind = 'System' then 'LinguaStories' else u.display_name end as "ownerName",
            d.deck_kind as "deckKind",
            d.name,
            coalesce(d.description, '') as description,
            d.coins,
            d.level,
            d.visibility,
            d.source_language as "sourceLanguage",
            d.target_language as "targetLanguage",
            coalesce(d.image_url, '') as "imageUrl",
            usd.saved_at as "savedAt",
            (usd.user_id is not null) as "savedByUser",
            d.created_at
       from sentence_decks d
       left join users u on u.id = d.user_id
       left join user_saved_sentence_decks usd on usd.deck_id = d.id and usd.user_id = $1
      where d.deck_kind = 'System'
         or d.user_id = $1
         or (d.visibility = 'Public' and usd.user_id is not null)
      order by d.created_at desc`,
    [user.id]
  );
  return buildSentenceDeckPayload(user, decks.rows);
}

async function getPublicSentenceDeckLibrary(user) {
  const decks = await query(
    `select d.id,
            d.user_id as "creatorId",
            d.user_id as "ownerId",
            u.display_name as creator,
            u.display_name as "ownerName",
            d.deck_kind as "deckKind",
            d.name,
            coalesce(d.description, '') as description,
            d.coins,
            d.level,
            d.visibility,
            d.source_language as "sourceLanguage",
            d.target_language as "targetLanguage",
            coalesce(d.image_url, '') as "imageUrl",
            usd.saved_at as "savedAt",
            false as "savedByUser",
            d.created_at
       from sentence_decks d
       join users u on u.id = d.user_id
       left join user_saved_sentence_decks usd on usd.deck_id = d.id and usd.user_id = $1
      where d.deck_kind = 'User'
        and d.visibility = 'Public'
        and d.user_id <> $1
        and usd.user_id is null
      order by d.created_at desc
      limit 80`,
    [user.id]
  );
  return buildSentenceDeckPayload(user, decks.rows, { marketplace: true });
}

async function buildSentenceDeckPayload(user, deckRows, { marketplace = false } = {}) {
  const decks = { rows: deckRows };
  const deckIds = decks.rows.map((deck) => deck.id);
  if (!deckIds.length) return [];

  const topics = await query(
    `select id,
            deck_id as "deckId",
            name,
            coalesce(description, '') as description,
            sort_order as "sortOrder"
       from sentence_deck_topics
      where deck_id = any($1::uuid[])
      order by sort_order asc, created_at asc`,
    [deckIds]
  );
  const items = await query(
    `select i.id as "itemId",
            i.deck_id as "deckId",
            i.topic_id as "topicId",
            i.sort_order as "sortOrder",
            s.id,
            s.target,
            s.translation,
            coalesce(s.romanization, '') as romanization,
            coalesce(s.notes, '') as notes,
            s.source_language as "sourceLanguage",
            s.target_language as "targetLanguage",
            coalesce(s.audio_url, '') as "audioUrl",
            coalesce(s.image_url, '') as "imageUrl",
            coalesce(s.video_url, '') as "videoUrl",
            s.level,
            s.topic,
            coalesce(r.state, 'New') as state,
            coalesce(r.due_date, current_date)::text as "dueDate",
            coalesce(r.last_rating, '') as "lastRating"
       from sentence_deck_items i
       join sentences s on s.id = i.sentence_id
       left join user_sentence_reviews r on r.sentence_id = s.id and r.user_id = $2
      where i.deck_id = any($1::uuid[])
      order by i.sort_order asc, i.created_at asc`,
    [deckIds, user.id]
  );

  const topicsByDeck = topics.rows.reduce((groups, topic) => {
    groups[topic.deckId] = groups[topic.deckId] || [];
    groups[topic.deckId].push({ ...topic, sentences: [] });
    return groups;
  }, {});
  const directSentencesByDeck = {};
  for (const item of items.rows) {
    const deckTopics = topicsByDeck[item.deckId] || [];
    if (!item.topicId) {
      directSentencesByDeck[item.deckId] = directSentencesByDeck[item.deckId] || [];
      directSentencesByDeck[item.deckId].push(item);
      continue;
    }
    let topic = deckTopics.find((candidate) => candidate.id === item.topicId);
    if (!topic) {
      topic = { id: item.topicId, name: "General", description: "", sortOrder: 0, sentences: [] };
      if (!deckTopics.includes(topic)) deckTopics.push(topic);
      topicsByDeck[item.deckId] = deckTopics;
    }
    topic.sentences.push(item);
  }

  const customDecks = decks.rows.map((deck) => {
    const deckTopics = topicsByDeck[deck.id] || [];
    const directSentences = directSentencesByDeck[deck.id] || [];
    const deckSentences = [...directSentences, ...deckTopics.flatMap((topic) => topic.sentences)];
    const status = reviewStateForSentences(deckSentences);
    const normalizedTopics = deckTopics.map((topic) => ({
      ...topic,
      progress: buildDeckProgress(topic.sentences),
      sentenceCount: topic.sentences.length
    }));
    return {
      ...deck,
      category: deck.deckKind === "System" ? "System Decks" : deck.creatorId === user.id ? "My Decks" : "Public Decks",
      custom: deck.deckKind !== "System",
      system: deck.deckKind === "System",
      owner: deck.creatorId === user.id,
      marketplace,
      savedByUser: Boolean(deck.savedByUser),
      ownerId: deck.ownerId || "",
      layout: normalizedTopics.length ? "Topic Deck" : "Sentence Deck",
      sentences: normalizedTopics.length ? [] : directSentences,
      sentenceCount: deckSentences.length,
      progress: buildDeckProgress(deckSentences),
      reviewStatus: status,
      nextReviewDate: deckSentences.map((sentence) => sentence.dueDate).sort()[0] || "",
      action: deckActionForStatus(status),
      topics: normalizedTopics
    };
  });

  return customDecks;
}

async function getStories(userId) {
  const languageResult = await query(
    `select language, current_level as "currentLevel"
       from (
         select target_language as language, current_level, 0 as sort_order
           from users
          where id = $1
         union
         select language, current_level, 1 as sort_order
           from user_languages
          where user_id = $1
            and active = true
       ) profile_languages
      where coalesce(language, '') <> ''
      order by sort_order asc, language asc`,
    [userId]
  );
  const profileLanguages = [...new Set(languageResult.rows.map((row) => row.language))];
  const profileLanguageLevels = languageResult.rows.reduce((levels, row) => {
    if (!levels[row.language]) levels[row.language] = row.currentLevel || "A1";
    return levels;
  }, {});

  const result = await query(
    `select s.id,
            s.title,
            s.category_id as "categoryId",
            coalesce(sc.name, s.topic) as "categoryName",
            coalesce(sc.slug, lower(regexp_replace(s.topic, '[^a-zA-Z0-9]+', '-', 'g'))) as "categorySlug",
            s.source_language as "sourceLanguage",
            s.topic,
            case
              when s.image_path_file_id is not null then '/api/stories/' || s.id || '/image'
              else coalesce(s.image_url, '')
            end as "imageUrl",
            coalesce(s.video_url, '') as "videoUrl",
            s.unlock_cost as cost,
            s.reward_coins as reward,
            coalesce(us.unlocked, false) as unlocked,
            coalesce(us.completed, false) as completed,
            coalesce(us.liked, false) as liked,
            coalesce(us.favorite, false) as favorite,
            (
              select count(*)::int
                from user_story_states liked_states
               where liked_states.story_id = s.id
                 and coalesce(liked_states.liked, false) = true
            ) as "likeCount",
            (
              select count(*)::int
                from user_story_states favorite_states
               where favorite_states.story_id = s.id
                 and coalesce(favorite_states.favorite, false) = true
            ) as "favoriteCount"
       from stories s
       left join story_categories sc on sc.id = s.category_id
       left join user_story_states us on us.story_id = s.id and us.user_id = $1
      where exists (
           select 1
             from story_translations st
            where st.story_id = s.id
              and st.target_language = any($2::text[])
         )
      order by s.created_at asc`,
    [userId, profileLanguages]
  );

  const translations = await query(
    `select story_id as "storyId",
            target_language as "targetLanguage",
            level,
            title,
            text,
            coalesce(source_text, '') as translation,
            coalesce(romanization, '') as romanization,
            reading_time as "readingTime",
            coalesce(highlights, '[]'::jsonb) as highlights,
            coalesce(key_sentences, '[]'::jsonb) as "keySentences",
            coalesce(key_words, '[]'::jsonb) as "keyWords",
            coalesce(grammar_points, '[]'::jsonb) as "grammarPoints"
       from story_translations
      where target_language = any($1::text[])
      order by target_language asc, level asc`,
    [profileLanguages]
  );
  const translationsByStory = translations.rows.reduce((groups, translation) => {
    groups[translation.storyId] = groups[translation.storyId] || [];
    groups[translation.storyId].push(translation);
    return groups;
  }, {});

  return result.rows.map((story) => {
    const storyTranslations = translationsByStory[story.id] || [];
    const preferredLanguage = profileLanguages.find((language) => storyTranslations.some((translation) => translation.targetLanguage === language));
    const preferredLevel = profileLanguageLevels[preferredLanguage] || "A1";
    const preferredTranslation =
      storyTranslations.find((translation) => translation.targetLanguage === preferredLanguage && translation.level === preferredLevel) ||
      storyTranslations.find((translation) => translation.targetLanguage === preferredLanguage) ||
      storyTranslations[0];
    const levelVersions = storyTranslations
      .filter((translation) => translation.targetLanguage === preferredTranslation?.targetLanguage)
      .reduce((versions, translation) => {
        versions[translation.level] = {
          title: translation.title,
          text: translation.text,
          translation: translation.translation,
          romanization: translation.romanization,
          readingTime: translation.readingTime,
          highlights: translation.highlights,
          keySentences: translation.keySentences,
          keyWords: translation.keyWords,
          grammarPoints: translation.grammarPoints
        };
        return versions;
      }, {});

    return {
      ...story,
      targetLanguage: preferredTranslation?.targetLanguage || story.targetLanguage,
      level: preferredTranslation?.level || preferredLevel,
      title: preferredTranslation?.title || story.title,
      text: preferredTranslation?.text || "",
      translation: preferredTranslation?.translation || "",
      romanization: preferredTranslation?.romanization || "",
      readingTime: preferredTranslation?.readingTime || "",
      keySentences: preferredTranslation?.keySentences || [],
      highlights: preferredTranslation?.highlights || [],
      keyWords: preferredTranslation?.keyWords || [],
      grammarPoints: preferredTranslation?.grammarPoints || [],
      levelVersions,
      translations: storyTranslations
    };
  });
}

async function getStoryCategories() {
  const result = await query(
    `select id, name, slug
       from story_categories
      where active = true
      order by sort_order asc, name asc`
  );
  return result.rows;
}

async function getStoryImage(storyId) {
  const result = await query(
    `select image_path_file_id as "imagePathFileId"
       from stories
      where id = $1`,
    [storyId]
  );
  if (!result.rows[0]) throw notFound("Story not found");
  if (!result.rows[0].imagePathFileId) throw notFound("Story image not found");
  return storageService.downloadBoxFile(result.rows[0].imagePathFileId);
}

async function getStoredAsset(objectKey) {
  const key = String(objectKey || "").trim();
  if (!key.startsWith("linguastories-assets/")) throw notFound("Asset not found");
  return storageService.downloadBoxFile(key);
}

async function getPostImage(postId) {
  const result = await query(
    `select image_path_file_id as "imagePathFileId"
       from posts
      where id = $1`,
    [postId]
  );
  if (!result.rows[0]) throw notFound("Post not found");
  if (!result.rows[0].imagePathFileId) throw notFound("Post image not found");
  return storageService.downloadBoxFile(result.rows[0].imagePathFileId);
}

async function getPostThumbnail(postId) {
  const result = await query(
    `select image_thumb_path_file_id as "imageThumbPathFileId",
            image_path_file_id as "imagePathFileId"
       from posts
      where id = $1`,
    [postId]
  );
  if (!result.rows[0]) throw notFound("Post not found");
  const imageKey = result.rows[0].imageThumbPathFileId || result.rows[0].imagePathFileId;
  if (!imageKey) throw notFound("Post image not found");
  return storageService.downloadBoxFile(imageKey);
}

async function getLearnerAvatar(learnerId) {
  const result = await query(
    `select avatar_box_file_id as "avatarBoxFileId"
       from users
      where id = $1`,
    [learnerId]
  );
  if (!result.rows[0]) throw notFound("Learner not found");
  if (!result.rows[0].avatarBoxFileId) throw notFound("Profile picture not found");
  return storageService.downloadBoxFile(result.rows[0].avatarBoxFileId);
}

async function getGoals(userId) {
  const result = await query(
    `select goals.id,
            goals.title,
            goals.type,
            goals.goal_scope as "goalScope",
            goals.target_language as "targetLanguage",
            goals.target,
            goals.progress,
            goals.visibility,
            goals.reward,
            goals.completed,
            goals.due_date::text as "dueDate",
            coalesce(sum(supporter_totals.amount), 0)::int as "supportReceived",
            coalesce(
              jsonb_agg(
                distinct jsonb_build_object(
                  'userId', supporter.id,
                  'displayName', supporter.display_name,
                  'avatar', coalesce(supporter.avatar, left(supporter.display_name, 1)),
                  'avatarUrl', coalesce(supporter.avatar_url, ''),
                  'amount', supporter_totals.amount,
                  'message', coalesce(supporter_totals.message, ''),
                  'date', supporter_totals.last_supported::date::text
                )
              ) filter (where supporter.id is not null),
              '[]'::jsonb
            ) as supporters
       from goals
       left join (
         select goal_id,
                supporter_id,
                sum(amount)::int as amount,
                max(message) filter (where coalesce(message, '') <> '') as message,
                max(created_at) as last_supported
           from goal_supports
          group by goal_id, supporter_id
       ) supporter_totals on supporter_totals.goal_id = goals.id
       left join users supporter on supporter.id = supporter_totals.supporter_id
      where goals.user_id = $1
      group by goals.id
      order by coalesce(goals.due_date, '9999-12-31'::date) asc, goals.created_at desc`,
    [userId]
  );
  return result.rows;
}

async function getCommunityGoals(userId) {
  const result = await query(
    `select g.id,
            g.user_id as "userId",
            u.display_name as author,
            coalesce(u.avatar, left(u.display_name, 1)) as avatar,
            case when u.avatar_box_file_id is not null then '/api/learners/' || u.id || '/avatar' else coalesce(u.avatar_url, '') end as "avatarUrl",
            g.title,
            g.type,
            g.goal_scope as "goalScope",
            g.target_language as "targetLanguage",
            g.target,
            g.progress,
            g.reward,
            g.completed,
            g.due_date::text as "dueDate",
            coalesce(sum(gs.amount), 0)::int as "supportReceived",
            coalesce(sum(gs.amount) filter (where gs.supporter_id = $1), 0)::int as "supportedByMe"
       from goals g
       join users u on u.id = g.user_id
       left join goal_supports gs on gs.goal_id = g.id
      where g.visibility = 'Public'
        and g.user_id <> $1
      group by g.id, u.id, u.display_name, u.avatar, u.avatar_url, u.avatar_box_file_id
      order by g.completed asc, g.due_date asc, g.created_at desc`,
    [userId]
  );
  return result.rows;
}

async function getPosts(userId) {
  const result = await query(
    `select p.id,
            p.user_id as "userId",
            u.display_name as author,
            coalesce(u.avatar, left(u.display_name, 1)) as avatar,
            case when u.avatar_box_file_id is not null then '/api/learners/' || u.id || '/avatar' else coalesce(u.avatar_url, '') end as "avatarUrl",
            coalesce(u.native_language, '') as "nativeLanguage",
            u.target_language as "authorLanguage",
            p.type,
            p.body,
            p.target_language as "targetLanguage",
            case when p.image_path_file_id is not null then '/api/posts/' || p.id || '/image' else '' end as "imageUrl",
            case when p.image_thumb_path_file_id is not null then '/api/posts/' || p.id || '/thumbnail' else '' end as "imageThumbUrl",
            p.sentence_id as "sentenceId",
            p.story_id as "storyId",
            p.goal_id as "goalId",
            s.target as "sentenceTarget",
            s.translation as "sentenceTranslation",
            st.title as "storyTitle",
            g.title as "goalTitle",
            count(distinct l.user_id)::int as likes,
            count(distinct c.id)::int as comments,
            count(distinct pv.viewer_id)::int as "viewCount",
            bool_or(l.user_id = $1) as liked,
            exists(select 1 from saved_posts sp where sp.post_id = p.id and sp.user_id = $1) as saved,
            exists(select 1 from user_follows uf where uf.follower_id = $1 and uf.following_id = p.user_id) as following,
            p.created_at::date::text as date
       from posts p
       join users u on u.id = p.user_id
       left join sentences s on s.id = p.sentence_id
       left join stories st on st.id = p.story_id
       left join goals g on g.id = p.goal_id
       left join post_likes l on l.post_id = p.id
       left join post_comments c on c.post_id = p.id
       left join post_views pv on pv.post_id = p.id
      group by p.id, u.id, u.display_name, u.avatar, u.avatar_url, u.avatar_box_file_id, u.native_language, u.target_language, s.target, s.translation, st.title, g.title
      order by p.created_at desc`,
    [userId]
  );
  return result.rows.map((post) => ({ ...post, liked: Boolean(post.liked) }));
}

async function getPostComments(userId) {
  const result = await query(
    `select c.id,
            c.post_id as "postId",
            u.display_name as author,
            coalesce(u.avatar, left(u.display_name, 1)) as avatar,
            case when u.avatar_box_file_id is not null then '/api/learners/' || u.id || '/avatar' else coalesce(u.avatar_url, '') end as "avatarUrl",
            c.body,
            c.created_at::date::text as date
       from post_comments c
       join users u on u.id = c.user_id
       join posts p on p.id = c.post_id
      where p.user_id = $1
         or c.user_id = $1
         or exists(select 1 from user_follows uf where uf.follower_id = $1 and uf.following_id = p.user_id)
         or coalesce(p.target_language, '') in (
              select language from user_languages where user_id = $1 and active = true
            )
      order by c.created_at asc`,
    [userId]
  );
  return result.rows;
}

async function getLearners(userId) {
  const result = await query(
    `select u.id,
            u.display_name as "displayName",
            coalesce(u.avatar, left(u.display_name, 1)) as avatar,
            case when u.avatar_box_file_id is not null then '/api/learners/' || u.id || '/avatar' else coalesce(u.avatar_url, '') end as "avatarUrl",
            coalesce(u.native_language, '') as "nativeLanguage",
            u.target_language as "targetLanguage",
            u.current_level as "currentLevel",
            u.current_streak as "currentStreak",
            u.bio,
            coalesce(
              jsonb_agg(
                distinct jsonb_build_object(
                  'language', ul.language,
                  'level', ul.current_level,
                  'visibility', ul.profile_visibility
                )
              ) filter (where ul.language is not null),
              '[]'::jsonb
            ) as "learningLanguages",
            count(distinct p.id)::int as posts,
            count(distinct g.id)::int as goals,
            count(distinct followers.follower_id)::int as followers,
            exists(select 1 from user_follows uf where uf.follower_id = $1 and uf.following_id = u.id) as following
       from users u
       left join user_languages ul on ul.user_id = u.id and ul.active = true
       left join posts p on p.user_id = u.id
       left join goals g on g.user_id = u.id and g.visibility = 'Public'
       left join user_follows followers on followers.following_id = u.id
      where u.id <> $1
      group by u.id
      order by following desc, posts desc, u.display_name asc
      limit 100`,
    [userId]
  );
  return result.rows.map((learner) => ({ ...learner, following: Boolean(learner.following) }));
}

async function getLearnerActivities(userId) {
  const result = await query(
    `with activity as (
       select uss.user_id as learner_id,
              'story' as type,
              case when uss.completed then 'Completed story' else 'Unlocked story' end as label,
              st.title as detail,
              story_language.target_language as target_language,
              uss.updated_at as created_at
         from user_story_states uss
         join stories st on st.id = uss.story_id
         join users learner on learner.id = uss.user_id
         join (
           select distinct story_id, target_language
             from story_translations
         ) story_language
           on story_language.story_id = st.id
          and story_language.target_language = learner.target_language
        where uss.user_id <> $1
          and (uss.completed = true or uss.unlocked = true)
       union all
       select usr.user_id as learner_id,
              'sentence' as type,
              case when usr.state = 'Mastered' then 'Remembered sentence' else 'Practiced sentence' end as label,
              s.target || ' - ' || s.translation as detail,
              s.target_language as target_language,
              usr.updated_at as created_at
         from user_sentence_reviews usr
         join sentences s on s.id = usr.sentence_id
        where usr.user_id <> $1
          and usr.state in ('Learning', 'Review', 'Mastered')
     ),
     ranked as (
       select learner_id,
              type,
              label,
              detail,
              target_language,
              created_at,
              row_number() over (partition by learner_id order by created_at desc) as rank
         from activity
     )
     select learner_id as "learnerId",
            type,
            label,
            detail,
            target_language as "targetLanguage",
            created_at::date::text as date
       from ranked
      where rank <= 20
      order by created_at desc`,
    [userId]
  );

  return result.rows.reduce((groups, item) => {
    groups[item.learnerId] = groups[item.learnerId] || [];
    groups[item.learnerId].push(item);
    return groups;
  }, {});
}

async function getDirectChat(userId) {
  const conversations = await query(
    `select dc.id,
            other_user.id as "otherUserId",
            other_user.display_name as "otherName",
            coalesce(other_user.avatar, left(other_user.display_name, 1)) as "otherAvatar",
            case when other_user.avatar_box_file_id is not null then '' else coalesce(other_user.avatar_url, '') end as "otherAvatarUrl",
            dc.updated_at as "updatedAt",
            dc.conversation_type as "conversationType",
            dc.teacher_profile_id as "teacherProfileId",
            dc.lesson_booking_id as "lessonBookingId",
            last_message.body as "lastMessage",
            last_message.created_at as "lastMessageAt",
            last_message.sender_id = $1 as "lastMessageMine",
            count(unread.id)::int as "unreadCount"
       from direct_conversations dc
       join users other_user on other_user.id = case when dc.participant_one = $1 then dc.participant_two else dc.participant_one end
       left join lateral (
         select dm.body, dm.created_at, dm.sender_id
           from direct_messages dm
          where dm.conversation_id = dc.id
          order by dm.created_at desc
          limit 1
       ) last_message on true
       left join direct_messages unread on unread.conversation_id = dc.id
            and unread.recipient_id = $1
            and unread.read_at is null
      where dc.participant_one = $1 or dc.participant_two = $1
      group by dc.id, other_user.id, last_message.body, last_message.created_at, last_message.sender_id
      order by dc.updated_at desc`,
    [userId]
  );
  const conversationIds = conversations.rows.map((conversation) => conversation.id);
  if (!conversationIds.length) return { conversations: [], unreadCount: 0 };

  const messages = await query(
    `select dm.id,
            dm.conversation_id as "conversationId",
            dm.sender_id as "senderId",
            dm.recipient_id as "recipientId",
            dm.body,
            dm.coin_amount as "coinAmount",
            dm.message_context as "messageContext",
            dm.read_at as "readAt",
            dm.created_at as "createdAt",
            dm.created_at::date::text as date,
            u.display_name as "senderName",
            coalesce(u.avatar, left(u.display_name, 1)) as "senderAvatar"
       from direct_messages dm
       join users u on u.id = dm.sender_id
      where dm.conversation_id = any($1::uuid[])
      order by dm.created_at asc`,
    [conversationIds]
  );
  const messagesByConversation = messages.rows.reduce((groups, message) => {
    groups[message.conversationId] = groups[message.conversationId] || [];
    groups[message.conversationId].push({ ...message, mine: message.senderId === userId });
    return groups;
  }, {});
  const chatConversations = conversations.rows.map((conversation) => ({
    ...conversation,
    lastMessageMine: Boolean(conversation.lastMessageMine),
    messages: messagesByConversation[conversation.id] || []
  }));

  return {
    conversations: chatConversations,
    unreadCount: chatConversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0)
  };
}

async function getStoryComments() {
  const result = await query(
    `select sc.id,
            sc.story_id as "storyId",
            sc.parent_comment_id as "parentCommentId",
            u.display_name as author,
            coalesce(u.avatar, left(u.display_name, 1)) as avatar,
            sc.body,
            sc.created_at::date::text as date
       from story_comments sc
       join users u on u.id = sc.user_id
      order by sc.created_at asc`
  );
  return result.rows;
}

async function getSavedSentences(userId) {
  const result = await query(
    `select sentence_id as id
       from user_sentence_reviews
      where user_id = $1 and saved = true`,
    [userId]
  );
  return result.rows.map((row) => row.id);
}

async function getPaths(userId) {
  const paths = await query(
    `select lp.id, lp.title, lp.target_language as "targetLanguage", lp.description, coalesce(ulp.progress, 0) as progress
       from learning_paths lp
       left join user_learning_path_progress ulp on ulp.path_id = lp.id and ulp.user_id = $1
      order by lp.created_at asc`,
    [userId]
  );

  const items = await query(
    `select path_id, label
       from learning_path_items
      order by sort_order asc`
  );

  return paths.rows.map((pathRow) => ({
    title: pathRow.title,
    targetLanguage: pathRow.targetLanguage,
    progress: pathRow.progress,
    items: items.rows.filter((item) => item.path_id === pathRow.id).map((item) => item.label)
  }));
}

async function getDashboard(user, wallet, sentences, stories, goals) {
  const activeLanguage = user.targetLanguage;
  const activeProfile = user.learningLanguages?.find((item) => item.language === activeLanguage) || user;
  const languageSentences = sentences.filter((sentence) => !sentence.targetLanguage || sentence.targetLanguage === activeLanguage);
  const languageStories = stories.filter((story) => !story.targetLanguage || story.targetLanguage === activeLanguage);
  const languageGoals = goals.filter((goal) => !goal.targetLanguage || goal.targetLanguage === activeLanguage);
  const reviewsDue = languageSentences.filter((sentence) => sentence.dueDate <= today()).length;
  const mastered = languageSentences.filter((sentence) => sentence.state === "Mastered").length;
  const completedStories = languageStories.filter((story) => story.completed).length;
  const goalCompletionRate = languageGoals.length
    ? Math.round((languageGoals.reduce((sum, goal) => sum + Math.min(goal.progress / goal.target, 1), 0) / languageGoals.length) * 100)
    : 0;

  return {
    reviewsDue,
    newSentences: languageSentences.filter((sentence) => sentence.state === "New").length,
    storiesAvailable: languageStories.filter((story) => story.unlocked && !story.completed).length,
    coinsAvailable: 42,
    progress: {
      totalSentencesLearned: languageSentences.filter((sentence) => sentence.state !== "New").length,
      sentencesMastered: mastered,
      storiesCompleted: completedStories,
      storiesRead: completedStories,
      coinsEarned: wallet.lifetimeEarned,
      coinsSpent: wallet.lifetimeSpent,
      currentStreak: activeProfile.currentStreak || 0,
      longestStreak: activeProfile.longestStreak || 0,
      listeningTime: activeProfile.listeningTime || 0,
      shadowingTime: activeProfile.shadowingTime || 0,
      goalCompletionRate
    }
  };
}

function getNotifications({ wallet, sentences, goals, directChat }) {
  const notifications = [];
  const todayDate = today();
  const soonDate = addDays(7);
  const unreadMessages = Number(directChat?.unreadCount || 0);
  const dueReviews = sentences.filter((sentence) => sentence.state !== "New" && sentence.dueDate <= todayDate).length;
  const dueSoonGoals = goals.filter((goal) => !goal.completed && goal.dueDate && goal.dueDate >= todayDate && goal.dueDate <= soonDate);

  if (unreadMessages) {
    notifications.push({
      type: "messages",
      label: "Messages",
      title: `${unreadMessages} unread ${unreadMessages === 1 ? "message" : "messages"}`,
      body: "Open Messages to reply. Each message sends 1 coin to the recipient.",
      tone: "urgent"
    });
  }

  if (dueReviews) {
    notifications.push({
      type: "reviews",
      label: "Reviews",
      title: `${dueReviews} sentence ${dueReviews === 1 ? "review is" : "reviews are"} due`,
      body: "Keep your review queue moving to protect your streak and memory.",
      tone: "urgent"
    });
  }

  dueSoonGoals.slice(0, 3).forEach((goal) => {
    notifications.push({
      type: "goal",
      label: "Goal",
      title: `${goal.title} is due ${goal.dueDate}`,
      body: `${goal.progress} of ${goal.target} ${goal.type.toLowerCase()} complete.`,
      tone: "neutral"
    });
  });

  if (Number(wallet?.balance || 0) < 5) {
    notifications.push({
      type: "wallet",
      label: "Wallet",
      title: "Your coin balance is low",
      body: "Complete reviews, stories, goals, or community actions to earn more coins.",
      tone: "urgent"
    });
  } else if (Number(wallet?.dailyEarned || 0) > 0) {
    notifications.push({
      type: "wallet",
      label: "Wallet",
      title: `${wallet.dailyEarned} coins earned today`,
      body: "Nice progress. Your wallet reflects today's learning activity.",
      tone: "good"
    });
  }

  return notifications;
}

async function getState(user) {
  const userId = user.id;
  const subscription = subscriptionPolicy.subscriptionForUser(user);
  const [wallet, coinRules, sentences, stories, goals, communityGoals, posts, postComments, storyComments, learners, learnerActivities, directChat, savedSentences, paths, storyCategories, accountNotifications] = await Promise.all([
    getWallet(userId),
    getCoinRules(),
    getSentences(userId),
    getStories(userId),
    getGoals(userId),
    getCommunityGoals(userId),
    getPosts(userId),
    getPostComments(userId),
    getStoryComments(),
    getLearners(userId),
    getLearnerActivities(userId),
    getDirectChat(userId),
    getSavedSentences(userId),
    getPaths(userId),
    getStoryCategories(),
    accountService.listAccountNotifications(userId)
  ]);
  const commentsByPost = postComments.reduce((groups, comment) => {
    groups[comment.postId] = groups[comment.postId] || [];
    groups[comment.postId].push(comment);
    return groups;
  }, {});
  const postsWithComments = posts.map((post) => ({ ...post, commentItems: commentsByPost[post.id] || [] }));
  const sentenceDecks = await getSentenceDecks(user, sentences);
  const publicSentenceDecks = await getPublicSentenceDeckLibrary(user);
  const storyDiscussions = stories
    .map((story) => ({
      storyId: story.id,
      title: story.title,
      targetLanguage: story.targetLanguage,
      posts: postsWithComments.filter((post) => post.storyId === story.id)
    }))
    .filter((discussion) => discussion.posts.length);
  const storyCommentsByStory = storyComments.reduce((groups, comment) => {
    groups[comment.storyId] = groups[comment.storyId] || [];
    groups[comment.storyId].push(comment);
    return groups;
  }, {});

  return {
    user: { ...user, subscription },
    subscription,
    learningLanguages: user.learningLanguages || [],
    wallet,
    coinRules,
    sentences,
    sentenceDecks,
    publicSentenceDecks,
    stories,
    storyCategories,
    goals,
    communityGoals,
    posts: postsWithComments,
    learners,
    learnerActivities,
    directChat,
    storyDiscussions,
    storyComments: storyCommentsByStory,
    savedSentences,
    paths,
    notifications: [...accountNotifications, ...getNotifications({ wallet, sentences, goals, directChat })],
    dashboard: await getDashboard(user, wallet, sentences, stories, goals),
    admin: {
      sentenceDecks: Number((await query("select count(*) from sentence_decks")).rows[0].count),
      stories: stories.length,
      coinRules: Number((await query("select count(*) from coin_rules")).rows[0].count),
      moderationQueue: 0,
      goalTemplates: Number((await query("select count(*) from goal_templates")).rows[0].count)
    }
  };
}

async function learnSentence(user, sentenceId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into user_sentence_reviews (user_id, sentence_id, state, due_date)
       values ($1, $2, 'Learning', current_date)
       on conflict (user_id, sentence_id)
       do update set state = 'Learning', due_date = current_date`,
      [user.id, sentenceId]
    );
    await awardCoins(client, user.id, 10, "Sentence Deck Completed");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function rateReview(user, sentenceId, rating = "Good") {
  const dueDate = addDays(reviewDelay[rating] ?? 3);
  const state = rating === "Easy" ? "Mastered" : "Review";
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, last_rating)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id, sentence_id)
       do update set state = $3, due_date = $4, last_rating = $5`,
      [user.id, sentenceId, state, dueDate, rating]
    );
    await awardCoins(client, user.id, 5, "Daily Review");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function completeShadowing(user) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("update users set shadowing_time = shadowing_time + 5 where id = $1", [user.id]);
    await client.query(
      `insert into user_languages (user_id, language, current_level, shadowing_time, active)
       values ($1, $2, $3, 5, true)
       on conflict (user_id, language)
       do update set shadowing_time = user_languages.shadowing_time + 5,
                     updated_at = now()`,
      [user.id, user.targetLanguage, user.currentLevel || "A1"]
    );
    await awardCoins(client, user.id, 5, "Shadowing Session");
    await client.query("commit");
    return getState({ ...user, shadowingTime: (user.shadowingTime || 0) + 5 });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

async function unlockStory(user, storyId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const story = await client.query("select unlock_cost from stories where id = $1", [storyId]);
    if (!story.rows[0]) throw notFound("Story not found");

    const wallet = await client.query("select balance from wallets where user_id = $1", [user.id]);
    if (wallet.rows[0].balance < story.rows[0].unlock_cost) {
      const error = new Error("Not enough coins");
      error.status = 402;
      throw error;
    }

    const existingState = await client.query("select unlocked from user_story_states where user_id = $1 and story_id = $2", [
      user.id,
      storyId
    ]);
    if (!existingState.rows[0]?.unlocked) {
      await client.query(
        `insert into user_story_states (user_id, story_id, unlocked, completed)
         values ($1, $2, true, false)
         on conflict (user_id, story_id)
         do update set unlocked = true`,
        [user.id, storyId]
      );
      await awardCoins(client, user.id, -story.rows[0].unlock_cost, "Story Unlock");
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function completeStory(user, storyId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const story = await client.query("select reward_coins from stories where id = $1", [storyId]);
    if (!story.rows[0]) throw notFound("Story not found");

    const existingState = await client.query("select completed from user_story_states where user_id = $1 and story_id = $2", [
      user.id,
      storyId
    ]);
    if (!existingState.rows[0]?.completed) {
      await client.query(
        `insert into user_story_states (user_id, story_id, unlocked, completed)
         values ($1, $2, true, true)
         on conflict (user_id, story_id)
         do update set unlocked = true, completed = true`,
        [user.id, storyId]
      );
      await awardCoins(client, user.id, story.rows[0].reward_coins, "Story Completed");
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function toggleStoryFlag(user, storyId, flag) {
  if (!["liked", "favorite"].includes(flag)) {
    const error = new Error("Invalid story flag");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const story = await client.query("select id from stories where id = $1", [storyId]);
    if (!story.rows[0]) throw notFound("Story not found");

    await client.query(
      `insert into user_story_states (user_id, story_id, ${flag})
       values ($1, $2, true)
       on conflict (user_id, story_id)
       do update set ${flag} = not coalesce(user_story_states.${flag}, false), updated_at = now()`,
      [user.id, storyId]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function saveStorySentences(user, storyId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const story = await client.query(
      `select coalesce(st.key_sentences, '[]'::jsonb) as key_sentences
         from stories s
         join story_translations st on st.story_id = s.id
        where s.id = $1
          and st.target_language = $2
        order by case when st.level = $3 then 0 else 1 end
        limit 1`,
      [storyId, user.targetLanguage, user.currentLevel || "A1"]
    );
    if (!story.rows[0]) throw notFound("Story not found");

    for (const target of story.rows[0].key_sentences) {
      const sentence = await client.query("select id from sentences where target = $1 limit 1", [target]);
      if (sentence.rows[0]) {
        await client.query(
          `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, saved)
           values ($1, $2, 'Review', current_date, true)
           on conflict (user_id, sentence_id)
           do update set saved = true`,
          [user.id, sentence.rows[0].id]
        );
      }
    }
    await awardCoins(client, user.id, 5, "Review Saved Sentences");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function saveSentence(user, sentenceId) {
  const sentence = await query("select id from sentences where id = $1", [sentenceId]);
  if (!sentence.rows[0]) throw notFound("Sentence not found");

  await query(
    `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, saved)
     values ($1, $2, 'Review', current_date, true)
     on conflict (user_id, sentence_id)
     do update set saved = true,
                   updated_at = now()`,
    [user.id, sentenceId]
  );

  return getState(user);
}

async function uploadUserSentenceAssets(user, body) {
  const result = { audioUrl: "", imageUrl: "", videoUrl: "", uploadedAudioKey: "", uploadedImageKey: "", uploadedVideoKey: "" };
  if (body.audioDataUrl) {
    const audio = await storageService.uploadUserSentenceAudio({
      userId: user.id,
      fileName: body.audioFileName || "sentence-audio.mp3",
      dataUrl: body.audioDataUrl
    });
    result.uploadedAudioKey = audio?.boxFileId || "";
    result.audioUrl = audio?.url || "";
  }
  if (body.imageDataUrl) {
    const image = await storageService.uploadUserSentenceImage({
      userId: user.id,
      fileName: body.imageFileName || "sentence-image.webp",
      dataUrl: body.imageDataUrl
    });
    result.uploadedImageKey = image?.boxFileId || "";
    result.imageUrl = image?.url || "";
  }
  if (body.videoDataUrl) {
    const video = await storageService.uploadUserSentenceVideo({
      userId: user.id,
      fileName: body.videoFileName || "sentence-video.mp4",
      dataUrl: body.videoDataUrl
    });
    result.uploadedVideoKey = video?.boxFileId || "";
    result.videoUrl = video?.url || "";
  }
  return result;
}

async function cleanupUploadedSentenceAssets({ uploadedAudioKey = "", uploadedImageKey = "", uploadedVideoKey = "" }) {
  if (uploadedAudioKey) {
    try {
      await storageService.deleteStoredFile(uploadedAudioKey);
    } catch (deleteError) {
      console.warn("Could not delete failed sentence audio");
    }
  }
  if (uploadedImageKey) {
    try {
      await storageService.deleteStoredFile(uploadedImageKey);
    } catch (deleteError) {
      console.warn("Could not delete failed sentence image");
    }
  }
  if (uploadedVideoKey) {
    try {
      await storageService.deleteStoredFile(uploadedVideoKey);
    } catch (deleteError) {
      console.warn("Could not delete failed sentence video");
    }
  }
}

async function addCustomSentence(user, body) {
  let uploadedAssets = { uploadedAudioKey: "", uploadedImageKey: "", uploadedVideoKey: "" };
  const client = await pool.connect();
  try {
    await client.query("begin");
    uploadedAssets = await uploadUserSentenceAssets(user, body);
    const sentence = await client.query(
      `insert into sentences
        (source_language, target_language, target, translation, romanization, audio_url, image_url, video_url, topic, level, difficulty, notes, source)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning id`,
      [
        body.sourceLanguage || "en-US",
        body.targetLanguage || user.targetLanguage,
        body.target,
        body.translation,
        body.romanization || "",
        uploadedAssets.audioUrl || "",
        uploadedAssets.imageUrl || "",
        uploadedAssets.videoUrl || "",
        body.topic || "Mined Sentences",
        body.level || "A1",
        Number(body.difficulty || 2),
        body.notes || "",
        "Sentence Mining"
      ]
    );
    await client.query(
      `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, saved)
       values ($1, $2, 'New', current_date, true)`,
      [user.id, sentence.rows[0].id]
    );
    await awardCoins(client, user.id, 2, "Sentence Mining");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    await cleanupUploadedSentenceAssets(uploadedAssets);
    throw error;
  } finally {
    client.release();
  }
}

async function updateCustomSentence(user, sentenceId, body) {
  let uploadedAssets = { uploadedAudioKey: "", uploadedImageKey: "", uploadedVideoKey: "" };
  const client = await pool.connect();
  try {
    await client.query("begin");
    const existing = await client.query(
      `select s.audio_url as "audioUrl",
              s.image_url as "imageUrl",
              s.video_url as "videoUrl"
         from sentences s
         join user_sentence_reviews usr on usr.sentence_id = s.id
        where usr.user_id = $1
          and usr.saved = true
          and s.id = $2
          and coalesce(s.source, '') = 'Sentence Mining'`,
      [user.id, sentenceId]
    );
    if (!existing.rows[0]) throw notFound("Mined sentence not found");
    uploadedAssets = await uploadUserSentenceAssets(user, body);
    const audioUrl = uploadedAssets.audioUrl || existing.rows[0].audioUrl || "";
    const imageUrl = uploadedAssets.imageUrl || existing.rows[0].imageUrl || "";
    const videoUrl = uploadedAssets.videoUrl || existing.rows[0].videoUrl || "";
    await client.query(
      `update sentences
          set source_language = $2,
              target_language = $3,
              target = $4,
              translation = $5,
              level = $6,
              notes = $7,
              audio_url = $8,
              image_url = $9,
              video_url = $10,
              topic = 'Mined Sentences',
              source = 'Sentence Mining',
              updated_at = now()
        where id = $1`,
      [sentenceId, body.sourceLanguage || "en-US", body.targetLanguage || user.targetLanguage, body.target, body.translation, body.level || "A1", body.notes || "", audioUrl, imageUrl, videoUrl]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    await cleanupUploadedSentenceAssets(uploadedAssets);
    throw error;
  } finally {
    client.release();
  }
}

async function deleteSavedSentence(user, sentenceId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      `delete from user_sentence_reviews usr
        using sentences s
        where usr.sentence_id = s.id
          and usr.user_id = $1
          and usr.sentence_id = $2
          and (usr.saved = true or coalesce(s.source, '') = 'Sentence Mining')
        returning usr.sentence_id`,
      [user.id, sentenceId]
    );
    if (!result.rows[0]) throw notFound("Saved sentence not found");
    await client.query(
      `delete from sentences s
        where s.id = $1
          and coalesce(s.source, '') = 'Sentence Mining'
          and not exists (
            select 1
              from user_sentence_reviews usr
             where usr.sentence_id = s.id
          )`,
      [sentenceId]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function createSentenceDeck(user, body) {
  const name = String(body.name || "").trim();
  if (!name) {
    const error = new Error("Deck name is required");
    error.status = 400;
    throw error;
  }
  const coins = Number(body.coins || 0);
  if (!Number.isInteger(coins) || coins < 0) {
    const error = new Error("Coins must be a non-negative integer");
    error.status = 400;
    throw error;
  }
  const level = normalizeLevel(body.level || user.currentLevel || "A1");
  const visibility = normalizeDeckVisibility(body.visibility);
  const description = String(body.description || "").trim();
  let uploadedImageKey = "";
  let imageUrl = "";
  const client = await pool.connect();
  try {
    await client.query("begin");
    const personalDeckLimit = subscriptionPolicy.planLimit(user, "personalDeckLimit");
    if (Number.isInteger(personalDeckLimit)) {
      const ownedDecks = await client.query(
        `select count(*)::int as count
           from sentence_decks
          where user_id = $1
            and deck_kind = 'User'`,
        [user.id]
      );
      if (Number(ownedDecks.rows[0]?.count || 0) >= personalDeckLimit) {
        throw subscriptionError("Free tier users can create one personal deck.");
      }
    }
    if (body.imageDataUrl) {
      const image = await storageService.uploadSentenceDeckImage({
        userId: user.id,
        fileName: body.imageFileName || "deck.webp",
        dataUrl: body.imageDataUrl
      });
      uploadedImageKey = image?.boxFileId || "";
      imageUrl = image?.url || "";
    }
    const deck = await client.query(
      `insert into sentence_decks (deck_kind, user_id, name, description, coins, level, visibility, source_language, target_language, image_url)
       values ('User', $1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning id`,
      [user.id, name, description, coins, level, visibility, body.sourceLanguage || "en-US", body.targetLanguage || user.targetLanguage, imageUrl]
    );
    if (visibility === "Public") {
      const deckPath = `/app/sentence-mining/decks/${deck.rows[0].id}`;
      const bodyText = [
        `${user.displayName} created a public sentence deck: ${name}.`,
        description,
        `Level: ${level}. Coins: ${coins}.`,
        `Open deck: ${deckPath}`
      ].filter(Boolean).join("\n");
      await client.query(
        `insert into posts (user_id, type, body, target_language)
         values ($1, 'Sentence Deck', $2, $3)`,
        [user.id, bodyText, user.targetLanguage]
      );
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    if (uploadedImageKey) {
      try {
        await storageService.deleteStoredFile(uploadedImageKey);
      } catch (deleteError) {
        console.warn("Could not delete failed deck image");
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

async function savePublicSentenceDeck(user, deckId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const deck = await client.query(
      `select id, user_id
         from sentence_decks
        where id = $1
          and deck_kind = 'User'
          and visibility = 'Public'
        for share`,
      [deckId]
    );
    if (!deck.rows[0]) throw notFound("Public deck not found");
    if (deck.rows[0].user_id === user.id) {
      const error = new Error("This deck is already yours");
      error.status = 400;
      throw error;
    }
    await client.query(
      `insert into user_saved_sentence_decks (user_id, deck_id)
       values ($1, $2)
       on conflict do nothing`,
      [user.id, deckId]
    );
    await client.query(
      `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, saved)
       select $1, i.sentence_id, 'New', current_date, true
         from sentence_deck_items i
        where i.deck_id = $2
       on conflict (user_id, sentence_id)
       do update set saved = true, updated_at = now()`,
      [user.id, deckId]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteSentenceDeck(user, deckId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const deckItems = await client.query(
      `select i.sentence_id
         from sentence_deck_items i
         join sentence_decks d on d.id = i.deck_id
        where d.id = $1
          and d.user_id = $2
          and d.deck_kind = 'User'`,
      [deckId, user.id]
    );
    const deletedDeck = await client.query(
      `delete from sentence_decks
        where id = $1
          and user_id = $2
          and deck_kind = 'User'
        returning id`,
      [deckId, user.id]
    );
    if (!deletedDeck.rows[0]) throw notFound("Deck not found");
    const sentenceIds = deckItems.rows.map((item) => item.sentence_id);
    if (sentenceIds.length) {
      await client.query(
        `delete from user_sentence_reviews usr
          using sentences s
         where usr.sentence_id = s.id
           and usr.user_id = $1
           and usr.sentence_id = any($2::uuid[])
           and coalesce(s.source, '') = 'Sentence Mining'
           and not exists (
             select 1
               from sentence_deck_items i
              where i.sentence_id = usr.sentence_id
           )`,
        [user.id, sentenceIds]
      );
      await client.query(
        `delete from sentences s
         where s.id = any($1::uuid[])
           and coalesce(s.source, '') = 'Sentence Mining'
           and not exists (
             select 1
               from sentence_deck_items i
              where i.sentence_id = s.id
           )
           and not exists (
             select 1
               from user_sentence_reviews usr
              where usr.sentence_id = s.id
           )`,
        [sentenceIds]
      );
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function unsavePublicSentenceDeck(user, deckId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const savedDeck = await client.query(
      `delete from user_saved_sentence_decks
        where user_id = $1
          and deck_id = $2
        returning deck_id`,
      [user.id, deckId]
    );
    if (!savedDeck.rows[0]) throw notFound("Saved deck not found");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function getOwnedDeck(client, user, deckId) {
  const deck = await client.query("select id from sentence_decks where id = $1 and user_id = $2 and deck_kind = 'User'", [deckId, user.id]);
  if (!deck.rows[0]) throw notFound("Deck not found");
  return deck.rows[0];
}

async function createSentenceDeckTopic(user, deckId, body) {
  const name = String(body.name || "").trim();
  if (!name) {
    const error = new Error("Topic name is required");
    error.status = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    await getOwnedDeck(client, user, deckId);
    await client.query(
      `insert into sentence_deck_topics (deck_id, name, description, sort_order)
       values ($1, $2, $3, $4)`,
      [deckId, name, String(body.description || "").trim(), Number(body.sortOrder || 0)]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function updateSentenceDeckTopic(user, topicId, body) {
  const name = String(body.name || "").trim();
  if (!name) {
    const error = new Error("Topic name is required");
    error.status = 400;
    throw error;
  }
  const result = await query(
    `update sentence_deck_topics t
        set name = $3,
            description = $4,
            sort_order = $5,
            updated_at = now()
       from sentence_decks d
      where d.id = t.deck_id
        and d.user_id = $1
        and t.id = $2
      returning t.id`,
    [user.id, topicId, name, String(body.description || "").trim(), Number(body.sortOrder || 0)]
  );
  if (!result.rows[0]) throw notFound("Topic not found");
  return getState(user);
}

async function deleteSentenceDeckTopic(user, topicId) {
  const result = await query(
    `delete from sentence_deck_topics t
      using sentence_decks d
      where d.id = t.deck_id
        and d.user_id = $1
        and t.id = $2
      returning t.id`,
    [user.id, topicId]
  );
  if (!result.rows[0]) throw notFound("Topic not found");
  return getState(user);
}

async function addSentenceDeckSentence(user, deckId, body) {
  const target = String(body.target || "").trim();
  const translation = String(body.translation || "").trim();
  if (!target || !translation) {
    const error = new Error("Sentence and translation are required");
    error.status = 400;
    throw error;
  }
  let uploadedAudioKey = "";
  let uploadedImageKey = "";
  let uploadedVideoKey = "";
  const client = await pool.connect();
  try {
    await client.query("begin");
    await getOwnedDeck(client, user, deckId);
    const topic = await client.query(
      `select id, name
         from sentence_deck_topics
        where deck_id = $1
          and ($2::uuid is null or id = $2)
        order by sort_order asc, created_at asc
        limit 1`,
      [deckId, body.topicId || null]
    );
    if (body.topicId && !topic.rows[0]) throw notFound("Topic not found");
    const topicId = topic.rows[0]?.id || null;
    const topicName = topic.rows[0]?.name || String(body.topic || "General").trim();
    let audioUrl = "";
    let imageUrl = "";
    let videoUrl = "";
    if (body.audioDataUrl) {
      const audio = await storageService.uploadUserSentenceAudio({
        userId: user.id,
        fileName: body.audioFileName || "sentence-audio.mp3",
        dataUrl: body.audioDataUrl
      });
      uploadedAudioKey = audio?.boxFileId || "";
      audioUrl = audio?.url || "";
    }
    if (body.imageDataUrl) {
      const image = await storageService.uploadUserSentenceImage({
        userId: user.id,
        fileName: body.imageFileName || "sentence-image.webp",
        dataUrl: body.imageDataUrl
      });
      uploadedImageKey = image?.boxFileId || "";
      imageUrl = image?.url || "";
    }
    if (body.videoDataUrl) {
      const video = await storageService.uploadUserSentenceVideo({
        userId: user.id,
        fileName: body.videoFileName || "sentence-video.mp4",
        dataUrl: body.videoDataUrl
      });
      uploadedVideoKey = video?.boxFileId || "";
      videoUrl = video?.url || "";
    }
    const sentence = await client.query(
      `insert into sentences (source_language, target_language, target, translation, audio_url, image_url, video_url, topic, level, difficulty, notes, source)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 2, $10, 'Sentence Mining')
       returning id`,
      [body.sourceLanguage || "en-US", body.targetLanguage || user.targetLanguage, target, translation, audioUrl, imageUrl, videoUrl, topicName, normalizeLevel(body.level || user.currentLevel || "A1"), body.notes || ""]
    );
    await client.query(
      `insert into sentence_deck_items (deck_id, topic_id, sentence_id, sort_order)
       values ($1, $2, $3, $4)`,
      [deckId, topicId, sentence.rows[0].id, Number(body.sortOrder || 0)]
    );
    await client.query(
      `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, saved)
       values ($1, $2, 'New', current_date, true)
       on conflict (user_id, sentence_id) do update set saved = true`,
      [user.id, sentence.rows[0].id]
    );
    await awardCoins(client, user.id, 2, "Sentence Mining");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    if (uploadedAudioKey) {
      try {
        await storageService.deleteStoredFile(uploadedAudioKey);
      } catch (deleteError) {
        console.warn("Could not delete failed sentence audio");
      }
    }
    if (uploadedImageKey) {
      try {
        await storageService.deleteStoredFile(uploadedImageKey);
      } catch (deleteError) {
        console.warn("Could not delete failed sentence image");
      }
    }
    if (uploadedVideoKey) {
      try {
        await storageService.deleteStoredFile(uploadedVideoKey);
      } catch (deleteError) {
        console.warn("Could not delete failed sentence video");
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

async function deleteSentenceDeckItem(user, itemId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const deletedItem = await client.query(
      `delete from sentence_deck_items i
        using sentence_decks d
       where d.id = i.deck_id
         and d.user_id = $1
         and d.deck_kind = 'User'
         and i.id = $2
       returning i.sentence_id`,
      [user.id, itemId]
    );
    if (!deletedItem.rows[0]) throw notFound("Deck sentence not found");
    const sentenceId = deletedItem.rows[0].sentence_id;
    await client.query(
      `delete from user_sentence_reviews usr
        using sentences s
       where usr.sentence_id = s.id
         and usr.user_id = $1
         and usr.sentence_id = $2
         and coalesce(s.source, '') = 'Sentence Mining'
         and not exists (
           select 1
             from sentence_deck_items i
            where i.sentence_id = usr.sentence_id
         )`,
      [user.id, sentenceId]
    );
    await client.query(
      `delete from sentences s
       where s.id = $1
         and coalesce(s.source, '') = 'Sentence Mining'
         and not exists (
           select 1
             from sentence_deck_items i
            where i.sentence_id = s.id
         )
         and not exists (
           select 1
             from user_sentence_reviews usr
            where usr.sentence_id = s.id
         )`,
      [sentenceId]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function recordDeckReview(user, deckId, body) {
  const responseMap = { show_again: "Again", hard: "Hard", easy: "Good", known: "Easy" };
  const response = String(body.response || "").trim();
  const rating = responseMap[response];
  if (!rating) {
    const error = new Error("Choose a valid review response");
    error.status = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const item = await client.query(
      `select i.id, i.topic_id, i.sentence_id
         from sentence_deck_items i
         join sentence_decks d on d.id = i.deck_id
        where i.deck_id = $1
          and i.sentence_id = $2
          and (d.user_id = $3 or d.visibility = 'Public')`,
      [deckId, body.sentenceId, user.id]
    );
    if (!item.rows[0]) throw notFound("Sentence not found in deck");
    const dueDate = addDays(reviewDelay[rating] ?? 3);
    const state = rating === "Easy" ? "Mastered" : "Review";
    await client.query(
      `insert into user_sentence_reviews (user_id, sentence_id, state, due_date, last_rating, saved)
       values ($1, $2, $3, $4, $5, true)
       on conflict (user_id, sentence_id)
       do update set state = $3, due_date = $4, last_rating = $5, saved = true, updated_at = now()`,
      [user.id, item.rows[0].sentence_id, state, dueDate, rating]
    );
    await client.query(
      `insert into user_sentence_review_results (user_id, deck_id, topic_id, sentence_item_id, sentence_id, response)
       values ($1, $2, $3, $4, $5, $6)`,
      [user.id, deckId, item.rows[0].topic_id, item.rows[0].id, item.rows[0].sentence_id, response]
    );
    await awardCoins(client, user.id, 5, "Daily Review");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function createGoal(user, body) {
  const goalScope = body.goalScope === "Global" ? "Global" : "Language";
  const targetLanguage = goalScope === "Global" ? null : String(body.targetLanguage || user.targetLanguage || "").trim();
  const title = String(body.title || "").trim();
  const target = Number(body.target || 10);
  const type = body.type || "Sentences";
  const visibility = body.visibility || "Public";
  const dueDate = body.dueDate || null;

  if (!title || !target || target < 1 || !dueDate) {
    const error = new Error("Goal title, target, and completion date are required");
    error.status = 400;
    throw error;
  }

  if (Number.isNaN(new Date(`${dueDate}T00:00:00`).getTime())) {
    const error = new Error("Choose a valid completion date for this goal");
    error.status = 400;
    throw error;
  }

  if (goalScope === "Language") {
    const profile = await query(
      `select 1
         from user_languages
        where user_id = $1 and language = $2 and active = true`,
      [user.id, targetLanguage]
    );
    if (!profile.rows[0]) {
      const error = new Error("Choose one of your learning languages for this goal");
      error.status = 400;
      throw error;
    }
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into goals (user_id, goal_scope, target_language, title, type, target, visibility, due_date)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, goalScope, targetLanguage, title, type, target, visibility, dueDate]
    );
    await awardCoins(client, user.id, 2, "Create Goal");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function updateGoal(user, goalId, body) {
  const title = String(body.title || "").trim();
  const target = Number(body.target || 10);
  const type = body.type || "Sentences";
  const visibility = body.visibility || "Public";
  const dueDate = body.dueDate || null;

  if (!title || !target || target < 1 || !dueDate) {
    const error = new Error("Goal title, target, and completion date are required");
    error.status = 400;
    throw error;
  }

  if (Number.isNaN(new Date(`${dueDate}T00:00:00`).getTime())) {
    const error = new Error("Choose a valid completion date for this goal");
    error.status = 400;
    throw error;
  }

  const result = await query(
    `update goals
        set title = $3,
            type = $4,
            target = $5,
            visibility = $6,
            due_date = $7,
            progress = least(progress, $5)
      where id = $1 and user_id = $2`,
    [goalId, user.id, title, type, target, visibility, dueDate]
  );
  if (!result.rowCount) throw notFound("Goal not found");

  return getState(user);
}

async function addLearningLanguage(user, body) {
  const maxProfiles = subscriptionPolicy.planLimit(user, "maxLanguageProfiles");
  const language = String(body.language || "").trim();
  const currentLevel = normalizeLevel(body.currentLevel);
  const profileVisibility = normalizeProfileVisibility(body.profileVisibility);
  if (!language) {
    const error = new Error("Language is required");
    error.status = 400;
    throw error;
  }
  if (!(await configService.isSupportedLanguage(language))) {
    const error = new Error("Please choose a supported language");
    error.status = 400;
    throw error;
  }

  if (Number.isInteger(maxProfiles)) {
    const activeProfiles = await query("select count(*)::int as count from user_languages where user_id = $1 and active = true", [user.id]);
    if (Number(activeProfiles.rows[0]?.count || 0) >= maxProfiles) {
      throw subscriptionError("Free tier users can create one language profile.");
    }
  }

  await query(
    `insert into user_languages (user_id, language, current_level, profile_visibility, active)
     values ($1, $2, $3, $4, true)
     on conflict (user_id, language)
     do update set current_level = $3,
                   profile_visibility = $4,
                   active = true,
                   updated_at = now()`,
    [user.id, language, currentLevel, profileVisibility]
  );

  const authService = require("./auth.service");
  return getState(await authService.getUserById(user.id));
}

async function updateLearningLanguage(user, body) {
  subscriptionPolicy.requireCapability(user, "canEditLanguageProfiles");
  const language = String(body.language || "").trim();
  const currentLevel = normalizeLevel(body.currentLevel);
  const profileVisibility = normalizeProfileVisibility(body.profileVisibility);
  const result = await query(
    `update user_languages
        set current_level = $3,
            profile_visibility = $4,
            updated_at = now()
      where user_id = $1 and language = $2 and active = true`,
    [user.id, language, currentLevel, profileVisibility]
  );
  if (!result.rowCount) throw notFound("Language profile not found");

  if (language === user.targetLanguage) {
    await query("update users set current_level = $2 where id = $1", [user.id, currentLevel]);
  }

  const authService = require("./auth.service");
  return getState(await authService.getUserById(user.id));
}

async function removeLearningLanguage(user, body) {
  subscriptionPolicy.requireCapability(user, "canDeleteLanguageProfiles");
  const language = String(body.language || "").trim();
  if (language === user.targetLanguage) {
    const error = new Error("Make another language current before removing this profile");
    error.status = 400;
    throw error;
  }

  const activeProfiles = await query("select count(*)::int as count from user_languages where user_id = $1 and active = true", [user.id]);
  if (activeProfiles.rows[0].count <= 1) {
    const error = new Error("You need at least one active language profile");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      `update user_languages
          set active = false,
              updated_at = now()
        where user_id = $1 and language = $2 and active = true`,
      [user.id, language]
    );
    if (!result.rowCount) throw notFound("Language profile not found");

    await client.query(
      `delete from goals
        where user_id = $1
          and goal_scope = 'Language'
          and target_language = $2`,
      [user.id, language]
    );
    await client.query(
      `delete from user_sentence_reviews usr
        using sentences s
        where usr.sentence_id = s.id
          and usr.user_id = $1
          and s.target_language = $2`,
      [user.id, language]
    );
    await client.query(
      `delete from user_story_states uss
        using story_translations st
        where uss.story_id = st.story_id
          and uss.user_id = $1
          and st.target_language = $2`,
      [user.id, language]
    );
    await client.query(
      `delete from user_learning_path_progress ulpp
        using learning_paths lp
        where ulpp.path_id = lp.id
          and ulpp.user_id = $1
          and lp.target_language = $2`,
      [user.id, language]
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  const authService = require("./auth.service");
  return getState(await authService.getUserById(user.id));
}

async function setCurrentLanguage(user, body) {
  subscriptionPolicy.requireCapability(user, "canEditLanguageProfiles");
  const language = String(body.language || "").trim();
  const existing = await query(
    `select language,
            current_level,
            current_streak,
            longest_streak,
            listening_time,
            shadowing_time
       from user_languages
      where user_id = $1 and language = $2 and active = true`,
    [user.id, language]
  );

  if (!existing.rows[0]) {
    const error = new Error("Add this language before making it current");
    error.status = 400;
    throw error;
  }

  const profile = existing.rows[0];
  await query(
    `update users
        set target_language = $2,
            current_level = $3,
            current_streak = $4,
            longest_streak = $5,
            listening_time = $6,
            shadowing_time = $7
      where id = $1`,
    [
      user.id,
      profile.language,
      profile.current_level,
      profile.current_streak,
      profile.longest_streak,
      profile.listening_time,
      profile.shadowing_time
    ]
  );

  const authService = require("./auth.service");
  return getState(await authService.getUserById(user.id));
}

async function progressGoal(user, goalId, amount = 1) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const goal = await client.query(
      `update goals
          set progress = least(target, progress + $3)
        where id = $1 and user_id = $2
        returning target, progress, reward, completed`,
      [goalId, user.id, Number(amount)]
    );
    if (!goal.rows[0]) throw notFound("Goal not found");

    if (goal.rows[0].progress >= goal.rows[0].target && !goal.rows[0].completed) {
      await client.query("update goals set completed = true where id = $1 and user_id = $2", [goalId, user.id]);
      await awardCoins(client, user.id, goal.rows[0].reward, "Goal Completed");
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function supportGoal(user, goalId, body) {
  const amount = Number(body.amount || 0);
  const message = String(body.message || "").trim() || null;
  if (!Number.isInteger(amount) || amount < 1) {
    const error = new Error("Choose a positive coin amount to support this goal");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const goal = await client.query(
      `select g.id, g.user_id, g.title, g.visibility, u.display_name
         from goals g
         join users u on u.id = g.user_id
        where g.id = $1
        for update of g`,
      [goalId]
    );
    if (!goal.rows[0]) throw notFound("Goal not found");
    if (goal.rows[0].user_id === user.id) {
      const error = new Error("You cannot support your own goal");
      error.status = 400;
      throw error;
    }
    if (goal.rows[0].visibility !== "Public") {
      const error = new Error("Only public goals can receive support");
      error.status = 400;
      throw error;
    }

    const wallet = await client.query("select balance from wallets where user_id = $1 for update", [user.id]);
    if (!wallet.rows[0] || wallet.rows[0].balance < amount) {
      const error = new Error("You do not have enough coins to support this goal");
      error.status = 400;
      throw error;
    }

    await client.query(
      `insert into goal_supports (goal_id, supporter_id, recipient_id, amount, message)
       values ($1, $2, $3, $4, $5)`,
      [goalId, user.id, goal.rows[0].user_id, amount, message]
    );
    await awardCoins(client, user.id, -amount, `Goal Support Sent: ${goal.rows[0].title}`);
    await awardCoins(client, goal.rows[0].user_id, amount, `Goal Support Received: ${goal.rows[0].title}`);
    await client.query(
      `insert into posts (user_id, type, body, target_language, goal_id)
       values ($1, 'Goal Support', $2, $3, $4)`,
      [user.id, `Supported ${goal.rows[0].display_name}'s goal with ${amount} coins.`, user.targetLanguage, goalId]
    );
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function createPost(user, body) {
  const type = body.type || "Learning Update";
  const linkedFields = {
    sentenceId: body.sentenceId || null,
    storyId: body.storyId || null,
    goalId: body.goalId || null
  };
  const bodyText = String(body.body || "").trim();
  let uploadedImageKey = "";
  let uploadedThumbnailKey = "";
  if (!bodyText) {
    const error = new Error("Post text is required");
    error.status = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (linkedFields.sentenceId) {
      const sentence = await client.query("select id from sentences where id = $1", [linkedFields.sentenceId]);
      if (!sentence.rows[0]) throw notFound("Sentence not found");
    }
    if (linkedFields.storyId) {
      const story = await client.query("select id from stories where id = $1", [linkedFields.storyId]);
      if (!story.rows[0]) throw notFound("Story not found");
    }
    if (linkedFields.goalId) {
      const goal = await client.query("select id from goals where id = $1 and user_id = $2", [linkedFields.goalId, user.id]);
      if (!goal.rows[0]) throw notFound("Goal not found");
    }
    if (body.imageDataUrl) {
      const image = await storageService.uploadMomentImage({
        userId: user.id,
        fileName: body.imageFileName || "moment.webp",
        dataUrl: body.imageDataUrl,
        thumbnailDataUrl: body.imageThumbnailDataUrl
      });
      uploadedImageKey = image?.boxFileId || "";
      uploadedThumbnailKey = image?.thumbnailBoxFileId || "";
    }
    await client.query(
      `insert into posts (user_id, type, body, target_language, image_path_file_id, image_thumb_path_file_id, sentence_id, story_id, goal_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [user.id, type, bodyText, body.targetLanguage || user.targetLanguage, uploadedImageKey || null, uploadedThumbnailKey || null, linkedFields.sentenceId, linkedFields.storyId, linkedFields.goalId]
    );
    await awardCoins(client, user.id, 2, "Learning Post Created");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    if (uploadedImageKey) {
      try {
        await storageService.deleteStoredFile(uploadedImageKey);
      } catch (deleteError) {
        console.warn("Could not delete failed post image");
      }
    }
    if (uploadedThumbnailKey) {
      try {
        await storageService.deleteStoredFile(uploadedThumbnailKey);
      } catch (deleteError) {
        console.warn("Could not delete failed post thumbnail");
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

async function createPostComment(user, postId, body) {
  const comment = String(body.body || "").trim();
  if (!comment) {
    const error = new Error("Comment text is required");
    error.status = 400;
    throw error;
  }
  if (comment.length > 255) {
    const error = new Error("Comments must be 255 characters or fewer");
    error.status = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const post = await client.query("select user_id from posts where id = $1", [postId]);
    if (!post.rows[0]) throw notFound("Post not found");

    await client.query("insert into post_comments (post_id, user_id, body) values ($1, $2, $3)", [postId, user.id, comment]);
    if (post.rows[0].user_id !== user.id) {
      await awardCoins(client, post.rows[0].user_id, 1, "Receive Comment");
    }

    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function appreciatePost(user, postId, body) {
  const amount = Number(body.amount || 0);
  const message = String(body.message || "").trim() || null;
  if (!Number.isInteger(amount) || amount < 1) {
    const error = new Error("Choose a positive coin amount to appreciate this moment");
    error.status = 400;
    throw error;
  }
  if (message && message.length > 255) {
    const error = new Error("Appreciation messages must be 255 characters or fewer");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const post = await client.query(
      `select p.id, p.user_id, u.display_name
         from posts p
         join users u on u.id = p.user_id
        where p.id = $1
        for update of p`,
      [postId]
    );
    if (!post.rows[0]) throw notFound("Moment not found");
    if (post.rows[0].user_id === user.id) {
      const error = new Error("You cannot send coins to your own moment");
      error.status = 400;
      throw error;
    }

    const wallet = await client.query("select balance from wallets where user_id = $1 for update", [user.id]);
    if (!wallet.rows[0] || wallet.rows[0].balance < amount) {
      const error = new Error("You do not have enough coins to appreciate this moment");
      error.status = 400;
      throw error;
    }

    await client.query(
      `insert into post_appreciations (post_id, sender_id, recipient_id, amount, message)
       values ($1, $2, $3, $4, $5)`,
      [postId, user.id, post.rows[0].user_id, amount, message]
    );
    await awardCoins(client, user.id, -amount, "Moment Appreciation Sent");
    await awardCoins(client, post.rows[0].user_id, amount, "Moment Appreciation Received");
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function toggleFollow(user, learnerId) {
  if (learnerId === user.id) {
    const error = new Error("You cannot follow yourself");
    error.status = 400;
    throw error;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const learner = await client.query("select id from users where id = $1", [learnerId]);
    if (!learner.rows[0]) throw notFound("Learner not found");
    const existing = await client.query("select 1 from user_follows where follower_id = $1 and following_id = $2", [user.id, learnerId]);
    if (existing.rowCount) {
      await client.query("delete from user_follows where follower_id = $1 and following_id = $2", [user.id, learnerId]);
    } else {
      await client.query("insert into user_follows (follower_id, following_id) values ($1, $2)", [user.id, learnerId]);
      await awardCoins(client, user.id, 1, "Follow Learner");
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function encourageLearner(user, learnerId) {
  if (learnerId === user.id) {
    const error = new Error("You cannot encourage yourself");
    error.status = 400;
    throw error;
  }
  const learner = await query("select display_name from users where id = $1", [learnerId]);
  if (!learner.rows[0]) throw notFound("Learner not found");
  await query(
    `insert into posts (user_id, type, body, target_language)
     values ($1, 'Encouragement', $2, $3)`,
    [user.id, `Encouraging ${learner.rows[0].display_name}: keep going with your stories and sentence practice.`, user.targetLanguage]
  );
  return getState(user);
}

async function findOrCreateDirectConversation(client, userId, recipientId) {
  const existing = await client.query(
    `select id
       from direct_conversations
      where (participant_one = $1 and participant_two = $2)
         or (participant_one = $2 and participant_two = $1)
      limit 1`,
    [userId, recipientId]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  try {
    const created = await client.query(
      `insert into direct_conversations (participant_one, participant_two)
       values ($1, $2)
       returning id`,
      [userId, recipientId]
    );
    return created.rows[0].id;
  } catch (error) {
    if (error.code !== "23505") throw error;
    const duplicate = await client.query(
      `select id
         from direct_conversations
        where (participant_one = $1 and participant_two = $2)
           or (participant_one = $2 and participant_two = $1)
        limit 1`,
      [userId, recipientId]
    );
    return duplicate.rows[0].id;
  }
}

async function sendDirectMessage(user, body) {
  const recipientId = String(body.recipientId || "").trim();
  const message = String(body.body || "").trim();
  if (!recipientId || recipientId === user.id) {
    const error = new Error("Choose a learner to message");
    error.status = 400;
    throw error;
  }
  if (!message) {
    const error = new Error("Message text is required");
    error.status = 400;
    throw error;
  }
  if (message.length > 1000) {
    const error = new Error("Messages must be 1000 characters or fewer");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const recipient = await client.query("select id, display_name from users where id = $1", [recipientId]);
    if (!recipient.rows[0]) throw notFound("Learner not found");

    const senderWallet = await client.query("select balance from wallets where user_id = $1 for update", [user.id]);
    if (!senderWallet.rows[0] || senderWallet.rows[0].balance < 1) {
      const error = new Error("You need at least 1 coin to send a direct message");
      error.status = 400;
      throw error;
    }
    await client.query("select balance from wallets where user_id = $1 for update", [recipientId]);
    await client.query(
      `insert into wallets (user_id, balance, lifetime_earned, daily_earned, weekly_earned)
       values ($1, 0, 0, 0, 0)
       on conflict (user_id) do nothing`,
      [recipientId]
    );

    const conversationId = await findOrCreateDirectConversation(client, user.id, recipientId);
    await client.query(
      `update wallets
          set balance = balance - 1,
              lifetime_spent = lifetime_spent + 1
        where user_id = $1`,
      [user.id]
    );
    await client.query(
      `update wallets
          set balance = balance + 1,
              lifetime_earned = lifetime_earned + 1,
              daily_earned = daily_earned + 1,
              weekly_earned = weekly_earned + 1
        where user_id = $1`,
      [recipientId]
    );
    await client.query(
      `insert into coin_transactions (user_id, amount, label)
       values ($1, -1, $2), ($3, 1, $4)`,
      [user.id, `Direct Message to ${recipient.rows[0].display_name}`, recipientId, `Direct Message from ${user.displayName}`]
    );
    await client.query(
      `insert into direct_messages (conversation_id, sender_id, recipient_id, body, coin_amount)
       values ($1, $2, $3, $4, 1)`,
      [conversationId, user.id, recipientId, message]
    );
    await client.query("update direct_conversations set updated_at = now() where id = $1", [conversationId]);
    await client.query("commit");

    const authService = require("./auth.service");
    return getState(await authService.getUserById(user.id));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function markDirectConversationRead(user, conversationId) {
  const result = await query(
    `update direct_messages dm
        set read_at = now()
       from direct_conversations dc
      where dm.conversation_id = dc.id
        and dc.id = $2
        and (dc.participant_one = $1 or dc.participant_two = $1)
        and dm.recipient_id = $1
        and dm.read_at is null`,
    [user.id, conversationId]
  );
  return getState(user);
}

async function createStoryComment(user, storyId, body) {
  const comment = String(body.body || "").trim();
  const parentCommentId = body.parentCommentId || null;
  if (!comment) {
    const error = new Error("Comment text is required");
    error.status = 400;
    throw error;
  }
  if (comment.length > 1000) {
    const error = new Error("Comments must be 1000 characters or fewer");
    error.status = 400;
    throw error;
  }
  const story = await query("select id from stories where id = $1", [storyId]);
  if (!story.rows[0]) throw notFound("Story not found");
  if (parentCommentId) {
    const parent = await query("select parent_comment_id from story_comments where id = $1 and story_id = $2", [parentCommentId, storyId]);
    if (!parent.rows[0]) throw notFound("Comment not found");
    if (parent.rows[0].parent_comment_id) {
      const error = new Error("Replies can only go one level deep");
      error.status = 400;
      throw error;
    }
  }
  await query(
    `insert into story_comments (story_id, user_id, parent_comment_id, body)
     values ($1, $2, $3, $4)`,
    [storyId, user.id, parentCommentId, comment]
  );
  return getState(user);
}

async function viewPost(user, postId) {
  const post = await query("select user_id from posts where id = $1", [postId]);
  if (!post.rows[0]) throw notFound("Post not found");
  if (post.rows[0].user_id !== user.id) {
    await query(
      `insert into post_views (post_id, viewer_id)
       values ($1, $2)
       on conflict (post_id, viewer_id) do nothing`,
      [postId, user.id]
    );
  }
  return getState(user);
}

async function togglePostLike(user, postId) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const post = await client.query("select user_id from posts where id = $1", [postId]);
    if (!post.rows[0]) throw notFound("Post not found");
    if (post.rows[0].user_id === user.id) {
      const error = new Error("You cannot like your own moment");
      error.status = 400;
      throw error;
    }

    const existing = await client.query("select 1 from post_likes where post_id = $1 and user_id = $2", [postId, user.id]);
    if (existing.rowCount) {
      await client.query("delete from post_likes where post_id = $1 and user_id = $2", [postId, user.id]);
    } else {
      await client.query("insert into post_likes (post_id, user_id) values ($1, $2)", [postId, user.id]);
      await awardCoins(client, post.rows[0].user_id, 1, "Receive Like");
    }
    await client.query("commit");
    return getState(user);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getState,
  getStoryImage,
  getStoredAsset,
  getPostImage,
  getPostThumbnail,
  getLearnerAvatar,
  learnSentence,
  rateReview,
  completeShadowing,
  unlockStory,
  completeStory,
  toggleStoryFlag,
  saveStorySentences,
  saveSentence,
  addCustomSentence,
  updateCustomSentence,
  deleteSavedSentence,
  createSentenceDeck,
  deleteSentenceDeck,
  savePublicSentenceDeck,
  unsavePublicSentenceDeck,
  createSentenceDeckTopic,
  updateSentenceDeckTopic,
  deleteSentenceDeckTopic,
  addSentenceDeckSentence,
  deleteSentenceDeckItem,
  recordDeckReview,
  createGoal,
  updateGoal,
  addLearningLanguage,
  updateLearningLanguage,
  removeLearningLanguage,
  setCurrentLanguage,
  progressGoal,
  supportGoal,
  createPost,
  createPostComment,
  viewPost,
  appreciatePost,
  togglePostLike,
  toggleFollow,
  encourageLearner,
  sendDirectMessage,
  markDirectConversationRead,
  createStoryComment
};
