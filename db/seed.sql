-- Seeded account password: Juy90n1!

begin;

truncate table
  direct_messages,
  direct_conversations,
  saved_posts,
  post_appreciations,
  post_comments,
  post_likes,
  posts,
  story_comments,
  goal_supports,
  user_follows,
  user_learning_path_progress,
  learning_path_items,
  learning_paths,
  user_story_states,
  story_translations,
  user_sentence_reviews,
  goals,
  goal_templates,
  stories,
  story_categories,
  sentences,
  sentence_packs,
  coin_transactions,
  coin_rules,
  user_sessions,
  wallets,
  user_languages,
  users,
  supported_languages
restart identity cascade;

insert into supported_languages (name, sort_order)
values
  ('Arabic', 1),
  ('Dutch', 2),
  ('English', 3),
  ('French', 4),
  ('German', 5),
  ('Greek', 6),
  ('Hindi', 7),
  ('Indonesian', 8),
  ('Italian', 9),
  ('Japanese', 10),
  ('Korean', 11),
  ('Mandarin Chinese', 12),
  ('Polish', 13),
  ('Portuguese', 14),
  ('Russian', 15),
  ('Spanish', 16),
  ('Swedish', 17),
  ('Thai', 18),
  ('Turkish', 19),
  ('Vietnamese', 20);

insert into story_categories (name, slug, sort_order)
values
  ('Travel', 'travel', 10),
  ('Workplace', 'workplace', 20),
  ('Daily Life', 'daily-life', 30),
  ('Food', 'food', 40),
  ('Friendship', 'friendship', 50),
  ('Study', 'study', 60);

insert into coin_rules (rule_key, label, amount, rule_type, trigger_event)
values
  ('daily_review', 'Daily Review', 5, 'earn', 'daily_review_completed'),
  ('sentence_pack_completed', 'Sentence Pack Completed', 10, 'earn', 'sentence_pack_completed'),
  ('story_unlock', 'Story Unlock', -20, 'spend', 'story_unlocked'),
  ('story_completed', 'Story Completed', 15, 'earn', 'story_completed'),
  ('goal_completed', 'Goal Completed', 25, 'earn', 'goal_completed'),
  ('learning_post_created', 'Learning Post Created', 2, 'earn', 'learning_post_created'),
  ('sentence_mining', 'Sentence Mining', 2, 'earn', 'sentence_mined'),
  ('shadowing_session', 'Shadowing Session', 5, 'earn', 'shadowing_session_completed'),
  ('review_saved_sentences', 'Review Saved Sentences', 5, 'earn', 'saved_sentences_reviewed'),
  ('create_goal', 'Create Goal', 2, 'earn', 'goal_created'),
  ('follow_learner', 'Follow Learner', 1, 'earn', 'learner_followed'),
  ('receive_like', 'Receive Like', 1, 'earn', 'community_like_received'),
  ('welcome_bonus', 'Welcome Bonus', 25, 'earn', 'user_signup'),
  ('goal_support_sent', 'Goal Support Sent', -5, 'spend', 'goal_support_sent'),
  ('goal_support_received', 'Goal Support Received', 5, 'earn', 'goal_support_received'),
  ('moment_appreciation_sent', 'Moment Appreciation Sent', -1, 'spend', 'moment_appreciation_sent'),
  ('moment_appreciation_received', 'Moment Appreciation Received', 1, 'earn', 'moment_appreciation_received'),
  ('direct_message_sent', 'Direct Message Sent', -1, 'spend', 'direct_message_sent'),
  ('direct_message_received', 'Direct Message Received', 1, 'earn', 'direct_message_received')
on conflict (rule_key) do update
set label = excluded.label,
    amount = excluded.amount,
    rule_type = excluded.rule_type,
    trigger_event = excluded.trigger_event,
    active = true;

insert into goal_templates (title, type, target)
values
  ('Learn 50 sentences', 'Sentences', 50),
  ('Complete 5 stories', 'Stories', 5),
  ('Reach a 14-day streak', 'Streak', 14),
  ('Practice shadowing daily', 'Shadowing', 7),
  ('Read 20 minutes this week', 'Stories', 20),
  ('Master 30 saved sentences', 'Sentences', 30);

insert into sentence_packs (title, target_language, topic, level, premium_cost)
values
  ('Japanese Travel Essentials', 'Japanese', 'Travel', 'A1', 0),
  ('Japanese Workplace Basics', 'Japanese', 'Workplace', 'A2', 0),
  ('Japanese Daily Requests', 'Japanese', 'Daily Life', 'A1', 0),
  ('Spanish Cafe Conversations', 'Spanish', 'Food', 'A1', 0),
  ('Spanish Travel Moments', 'Spanish', 'Travel', 'A2', 0),
  ('French Weekend Plans', 'French', 'Daily Life', 'A1', 0),
  ('Korean Study Group', 'Korean', 'Study', 'A2', 0);

insert into sentences (pack_id, target_language, target, translation, romanization, level, topic, difficulty, notes, source, variations)
values
  ((select id from sentence_packs where title = 'Japanese Travel Essentials'), 'Japanese', '駅はどこですか。', 'Where is the train station?', 'Eki wa doko desu ka.', 'A1', 'Travel', 1, 'Use this pattern for asking where places are.', 'Japanese Travel Essentials', '["ホテルはどこですか。", "出口はどこですか。"]'::jsonb),
  ((select id from sentence_packs where title = 'Japanese Travel Essentials'), 'Japanese', '飛行機が遅れています。', 'My flight is delayed.', 'Hikoki ga okurete imasu.', 'A2', 'Travel', 3, 'Present-progressive form for travel problems.', 'Japanese Travel Essentials', '["電車が遅れています。", "バスが遅れています。"]'::jsonb),
  ((select id from sentence_packs where title = 'Japanese Daily Requests'), 'Japanese', '手伝ってください。', 'Please help me.', 'Tetsudatte kudasai.', 'A1', 'Daily Life', 2, 'Polite request form with kudasai.', 'Japanese Daily Requests', '["待ってください。", "見てください。"]'::jsonb),
  ((select id from sentence_packs where title = 'Japanese Workplace Basics'), 'Japanese', '何時に始まりますか。', 'What time does it start?', 'Nanji ni hajimarimasu ka.', 'A2', 'Workplace', 2, 'Time question pattern for meetings.', 'Japanese Workplace Basics', '["何時に終わりますか。", "何時に開きますか。"]'::jsonb),
  ((select id from sentence_packs where title = 'Japanese Workplace Basics'), 'Japanese', '確認してもいいですか。', 'May I confirm?', 'Kakunin shite mo ii desu ka.', 'B1', 'Workplace', 3, 'Useful for polite clarification.', 'Japanese Workplace Basics', '["質問してもいいですか。", "共有してもいいですか。"]'::jsonb),
  ((select id from sentence_packs where title = 'Spanish Cafe Conversations'), 'Spanish', 'Quisiera un cafe, por favor.', 'I would like a coffee, please.', '', 'A1', 'Food', 1, 'Polite cafe ordering.', 'Spanish Cafe Conversations', '["Quisiera un te, por favor.", "Quisiera agua, por favor."]'::jsonb),
  ((select id from sentence_packs where title = 'Spanish Cafe Conversations'), 'Spanish', 'La cuenta, por favor.', 'The bill, please.', '', 'A1', 'Food', 1, 'Short restaurant request.', 'Spanish Cafe Conversations', '["El menu, por favor.", "Una mesa, por favor."]'::jsonb),
  ((select id from sentence_packs where title = 'Spanish Travel Moments'), 'Spanish', 'Mi tren sale a las ocho.', 'My train leaves at eight.', '', 'A2', 'Travel', 2, 'Travel time sentence.', 'Spanish Travel Moments', '["Mi autobus sale a las nueve.", "Mi vuelo sale a las seis."]'::jsonb),
  ((select id from sentence_packs where title = 'Spanish Travel Moments'), 'Spanish', 'Estoy buscando la estacion.', 'I am looking for the station.', '', 'A2', 'Travel', 2, 'Useful city navigation phrase.', 'Spanish Travel Moments', '["Estoy buscando el hotel.", "Estoy buscando la salida."]'::jsonb),
  ((select id from sentence_packs where title = 'French Weekend Plans'), 'French', 'Je vais au marche samedi.', 'I am going to the market on Saturday.', '', 'A1', 'Daily Life', 1, 'Weekend plan sentence.', 'French Weekend Plans', '["Je vais au parc samedi.", "Je vais au musee dimanche."]'::jsonb),
  ((select id from sentence_packs where title = 'French Weekend Plans'), 'French', 'Tu veux venir avec moi ?', 'Do you want to come with me?', '', 'A2', 'Friendship', 2, 'Friendly invitation.', 'French Weekend Plans', '["Tu veux etudier avec moi ?", "Tu veux manger avec moi ?"]'::jsonb),
  ((select id from sentence_packs where title = 'Korean Study Group'), 'Korean', '오늘 같이 공부해요.', 'Let us study together today.', 'Oneul gachi gongbuhaeyo.', 'A1', 'Study', 1, 'Friendly study invitation.', 'Korean Study Group', '["내일 같이 공부해요.", "도서관에서 공부해요."]'::jsonb),
  ((select id from sentence_packs where title = 'Korean Study Group'), 'Korean', '이 문장을 다시 읽어요.', 'Read this sentence again.', 'I munjangeul dasi ilgeoyo.', 'A2', 'Study', 2, 'Reading practice phrase.', 'Korean Study Group', '["이 단어를 다시 읽어요.", "이 이야기를 다시 읽어요."]'::jsonb);

create temporary table seed_story_payload (
  title text,
  category_id uuid,
  source_language text,
  topic text,
  level text,
  reading_time text,
  text text,
  translation text,
  highlights jsonb,
  key_sentences jsonb,
  key_words jsonb,
  grammar_points jsonb,
  unlock_cost integer,
  reward_coins integer
) on commit drop;

insert into seed_story_payload (
  title, category_id, source_language, topic, level, reading_time, text, translation, highlights, key_sentences, key_words, grammar_points, unlock_cost, reward_coins
)
values
  ('The Lost Passport', (select id from story_categories where slug = 'travel'), 'English', 'Travel', 'A1', '4 min',
   'Mika is at the airport. Her flight is delayed, and she cannot find her passport. She asks, "Where is the information desk?" A worker smiles and says, "Please wait here." After ten minutes, the worker returns with the passport.',
   'A travel story about asking for help at the airport.',
   '["airport", "delayed", "passport", "please wait"]'::jsonb,
   '["駅はどこですか。", "手伝ってください。", "飛行機が遅れています。"]'::jsonb,
   '["airport", "delayed", "passport", "information desk"]'::jsonb,
   '["Location questions", "Polite requests", "Present-progressive travel problems"]'::jsonb, 20, 15),
  ('First Day at the Office', (select id from story_categories where slug = 'workplace'), 'English', 'Workplace', 'A2', '6 min',
   'Ren joins a new team on Monday. He asks when the meeting starts, introduces himself, and writes down useful phrases from his coworkers.',
   'A workplace story about meetings and introductions.',
   '["meeting", "team", "introduction", "coworkers"]'::jsonb,
   '["何時に始まりますか。", "確認してもいいですか。"]'::jsonb,
   '["meeting", "team", "introduction", "phrases"]'::jsonb,
   '["Time questions", "Self-introduction", "Polite clarification"]'::jsonb, 20, 15),
  ('The Rainy Cafe', (select id from story_categories where slug = 'food'), 'English', 'Food', 'A1', '3 min',
   'Lucia enters a small cafe because it is raining. She orders coffee, reads a short story, and asks for the bill before the sun returns.',
   'A simple cafe story for ordering and small talk.',
   '["cafe", "rain", "coffee", "bill"]'::jsonb,
   '["Quisiera un cafe, por favor.", "La cuenta, por favor."]'::jsonb,
   '["cafe", "rain", "coffee", "bill"]'::jsonb,
   '["Polite ordering", "Simple past sequence", "Restaurant requests"]'::jsonb, 15, 12),
  ('The Late Train', (select id from story_categories where slug = 'travel'), 'English', 'Travel', 'A2', '5 min',
   'Mateo arrives at the station early, but his train is late. He asks for help, checks the platform, and sends a message to his friend.',
   'A station story with travel timing and problem solving.',
   '["station", "train", "platform", "message"]'::jsonb,
   '["Mi tren sale a las ocho.", "Estoy buscando la estacion."]'::jsonb,
   '["station", "train", "platform", "message"]'::jsonb,
   '["Time expressions", "Estoy buscando", "Travel updates"]'::jsonb, 20, 15),
  ('Saturday Market', (select id from story_categories where slug = 'daily-life'), 'English', 'Daily Life', 'A1', '4 min',
   'Camille goes to the market on Saturday. She buys bread, meets a friend, and invites him to walk with her.',
   'A weekend daily-life story with invitations.',
   '["market", "Saturday", "bread", "friend"]'::jsonb,
   '["Je vais au marche samedi.", "Tu veux venir avec moi ?"]'::jsonb,
   '["market", "Saturday", "bread", "friend"]'::jsonb,
   '["Near future", "Invitations", "Weekend plans"]'::jsonb, 15, 12),
  ('Study Room Window', (select id from story_categories where slug = 'study'), 'English', 'Study', 'A2', '5 min',
   'Hana meets her study group near the window. They read one story again, compare notes, and choose three sentences to review tomorrow.',
   'A study-group story about reading and review habits.',
   '["study group", "window", "notes", "review"]'::jsonb,
   '["오늘 같이 공부해요.", "이 문장을 다시 읽어요."]'::jsonb,
   '["study group", "window", "notes", "review"]'::jsonb,
   '["Invitations", "Again/repetition", "Study routine verbs"]'::jsonb, 20, 15);

insert into stories (
  title, category_id, source_language, topic, unlock_cost, reward_coins
)
select title, category_id, source_language, topic, unlock_cost, reward_coins
from seed_story_payload;

insert into story_translations (
  story_id,
  target_language,
  level,
  title,
  text,
  source_text,
  reading_time,
  highlights,
  key_sentences,
  key_words,
  grammar_points
)
select
  s.id,
  language_map.target_language,
  versions.level,
  coalesce(versions.content ->> 'title', payload.title),
  coalesce(versions.content ->> 'text', payload.text),
  coalesce(versions.content ->> 'translation', payload.translation),
  coalesce(versions.content ->> 'readingTime', payload.reading_time),
  coalesce(versions.content -> 'highlights', payload.highlights, '[]'::jsonb),
  coalesce(versions.content -> 'keySentences', payload.key_sentences, '[]'::jsonb),
  coalesce(versions.content -> 'keyWords', versions.content -> 'highlights', payload.key_words, '[]'::jsonb),
  coalesce(versions.content -> 'grammarPoints', payload.grammar_points, '[]'::jsonb)
from stories s
join seed_story_payload payload on payload.title = s.title
join (
  values
    ('The Lost Passport', 'Japanese'),
    ('First Day at the Office', 'Japanese'),
    ('The Rainy Cafe', 'Spanish'),
    ('The Late Train', 'Spanish'),
    ('Saturday Market', 'French'),
    ('Study Room Window', 'Korean')
) as language_map(title, target_language) on language_map.title = s.title
cross join lateral jsonb_each(
  jsonb_build_object(
    'A1', jsonb_build_object('readingTime', '3 min', 'translation', payload.translation, 'text', payload.text, 'highlights', payload.highlights, 'keySentences', payload.key_sentences, 'keyWords', payload.key_words, 'grammarPoints', payload.grammar_points),
    'A2', jsonb_build_object('readingTime', payload.reading_time, 'translation', payload.translation, 'text', payload.text, 'highlights', payload.highlights, 'keySentences', payload.key_sentences, 'keyWords', payload.key_words, 'grammarPoints', payload.grammar_points),
    'B1', jsonb_build_object('readingTime', '5 min', 'translation', payload.translation || ' The B1 version adds more detail and connective phrases.', 'text', payload.text || ' The learner notices repeated phrases and writes down the useful ones.', 'highlights', payload.highlights, 'keySentences', payload.key_sentences, 'keyWords', payload.key_words, 'grammarPoints', payload.grammar_points),
    'B2', jsonb_build_object('readingTime', '6 min', 'translation', payload.translation || ' The B2 version reads more naturally with smoother transitions.', 'text', payload.text || ' The scene becomes more natural as the learner reacts, asks clearer questions, and connects each event.', 'highlights', payload.highlights, 'keySentences', payload.key_sentences, 'keyWords', payload.key_words, 'grammarPoints', payload.grammar_points),
    'C1', jsonb_build_object('readingTime', '7 min', 'translation', payload.translation || ' The C1 version uses more precise phrasing and nuance.', 'text', payload.text || ' At this level, the story includes more subtle choices, more precise descriptions, and more natural pacing.', 'highlights', payload.highlights, 'keySentences', payload.key_sentences, 'keyWords', payload.key_words, 'grammarPoints', payload.grammar_points),
    'C2', jsonb_build_object('readingTime', '8 min', 'translation', payload.translation || ' The C2 version is denser and closer to native narration.', 'text', payload.text || ' The final version turns the same learning moment into a polished, near-native narrative with idiomatic rhythm.', 'highlights', payload.highlights, 'keySentences', payload.key_sentences, 'keyWords', payload.key_words, 'grammarPoints', payload.grammar_points)
  )
) as versions(level, content);

insert into learning_paths (title, target_language, description, level)
values
  ('Japanese Travel Path', 'Japanese', 'Airport, train, hotel, and travel stories.', 'A1-A2'),
  ('Japanese Workplace Path', 'Japanese', 'Meetings, introductions, and office story practice.', 'A2-B1'),
  ('Spanish Daily Path', 'Spanish', 'Cafe, travel, and daily life moments.', 'A1-A2'),
  ('French Weekend Path', 'French', 'Weekend plans, invitations, and market stories.', 'A1'),
  ('Korean Study Path', 'Korean', 'Study group and review routine practice.', 'A1-A2');

insert into learning_path_items (path_id, label, sort_order)
select lp.id, item.label, item.sort_order
from learning_paths lp
join lateral (
  values
    ('Core Sentences', 1),
    ('Mini Story', 2),
    ('Saved Sentence Review', 3),
    ('Shadowing Practice', 4)
) as item(label, sort_order) on true;

do $$
declare
  password_hash constant text := 'pbkdf2_sha256$310000$linguastories-demo-salt$4dcf782c48e2ddcfca5e2fc7babb9ecaf14ed4318768aea46ee4be4b0992b75d';
  user_specs text[][] := array[
    array['Mika Tan','demo@linguastories.local','MT','English','Japanese','A2','Building fluency through useful sentences and short stories.'],
    array['Noah Reed','noah@linguastories.local','NR','English','Japanese','A2','Travel-story learner who likes mining practical airport and train sentences.'],
    array['Ari Kim','ari@linguastories.local','AK','English','Japanese','B1','Reading short stories twice: once for flow and once for sentence mining.'],
    array['Sofia Rivera','sofia@linguastories.local','SR','English','Spanish','A2','Cafe conversations, train stations, and small wins every morning.'],
    array['Mateo Cruz','mateo@linguastories.local','MC','English','Spanish','B1','Spanish learner focused on travel stories and speaking confidence.'],
    array['Camille Stone','camille@linguastories.local','CS','English','French','A1','French beginner building a weekend routine with tiny stories.'],
    array['Hana Park','hana@linguastories.local','HP','English','Korean','A2','Korean learner who studies through group reading and shadowing.'],
    array['Eli Morgan','eli@linguastories.local','EM','English','Japanese','A1','Starting over with Japanese and keeping the streak gentle.'],
    array['Priya Shah','priya@linguastories.local','PS','Hindi','Japanese','A2','Uses story context to make grammar feel less abstract.'],
    array['Lucas Meyer','lucas@linguastories.local','LM','German','Spanish','A1','Spanish learner who loves food scenes and travel moments.'],
    array['Nora Ellis','nora@linguastories.local','NE','English','French','A2','Collects useful weekend phrases and reads aloud after work.'],
    array['Kenji Brooks','kenji@linguastories.local','KB','English','Korean','B1','Korean study-group regular focused on listening and recall.'],
    array['Amara Okafor','amara@linguastories.local','AO','English','Japanese','B2','Advanced reader who comments on grammar patterns in stories.'],
    array['Theo Grant','theo@linguastories.local','TG','English','Spanish','A2','Building travel confidence one short story at a time.'],
    array['Lina Chen','lina@linguastories.local','LC','Mandarin Chinese','French','A1','French beginner who likes simple daily-life stories.'],
    array['Owen Patel','owen@linguastories.local','OP','English','Japanese','A2','Practices shadowing with workplace stories before meetings.']
  ];
  spec text[];
  idx integer := 0;
  new_user_id uuid;
  supporter uuid;
  recipient uuid;
  conversation_id uuid;
  target_story_id uuid;
  target_sentence_id uuid;
  target_goal_id uuid;
  post_id uuid;
  comment_user_id uuid;
begin
  foreach spec slice 1 in array user_specs loop
    idx := idx + 1;
    insert into users (
      display_name, email, password_hash, avatar, bio, native_language, target_language, current_level,
      current_streak, longest_streak, listening_time, shadowing_time
    )
    values (
      spec[1], spec[2], password_hash, spec[3], spec[7], spec[4], spec[5], spec[6],
      2 + (idx % 11), 8 + (idx % 21), 40 + (idx * 13), 15 + (idx * 7)
    )
    returning id into new_user_id;

    insert into user_languages (
      user_id, language, current_level, current_streak, longest_streak, listening_time, shadowing_time, profile_visibility, active
    )
    values (
      new_user_id, spec[5], spec[6], 2 + (idx % 11), 8 + (idx % 21), 40 + (idx * 13), 15 + (idx * 7), 'Public', true
    );

    if idx % 3 = 0 then
      insert into user_languages (user_id, language, current_level, profile_visibility, active)
      values (new_user_id, 'Japanese', 'A1', 'Public', true)
      on conflict do nothing;
    elsif idx % 3 = 1 then
      insert into user_languages (user_id, language, current_level, profile_visibility, active)
      values (new_user_id, 'Spanish', 'A1', 'Public', true)
      on conflict do nothing;
    else
      insert into user_languages (user_id, language, current_level, profile_visibility, active)
      values (new_user_id, 'French', 'A1', 'Private', true)
      on conflict do nothing;
    end if;

    insert into wallets (user_id, balance, lifetime_earned, lifetime_spent, daily_earned, weekly_earned)
    values (new_user_id, 90 + (idx * 11), 260 + (idx * 23), 45 + (idx * 4), 5 + (idx % 18), 30 + (idx * 3));

    insert into coin_transactions (user_id, coin_rule_id, amount, label, created_at)
    values
      (new_user_id, (select id from coin_rules where rule_key = 'welcome_bonus'), 25, 'Welcome Bonus', now() - (idx || ' days')::interval),
      (new_user_id, (select id from coin_rules where rule_key = 'daily_review'), 5, 'Daily Review', now() - ((idx % 6) || ' days')::interval),
      (new_user_id, (select id from coin_rules where rule_key = 'sentence_pack_completed'), 10, 'Sentence Pack Completed', now() - ((idx % 8) || ' days')::interval),
      (new_user_id, (select id from coin_rules where rule_key = 'story_unlock'), -20, 'Story Unlock', now() - ((idx % 10) || ' days')::interval),
      (new_user_id, (select id from coin_rules where rule_key = 'story_completed'), 15, 'Story Completed', now() - ((idx % 4) || ' days')::interval),
      (new_user_id, (select id from coin_rules where rule_key = 'learning_post_created'), 2, 'Learning Post Created', now() - ((idx % 5) || ' days')::interval);
  end loop;

  insert into user_sentence_reviews (user_id, sentence_id, state, due_date, last_rating, saved)
  select u.id,
         s.id,
         case ((row_number() over (partition by u.id order by s.created_at)) % 4)
           when 0 then 'Mastered'
           when 1 then 'Learning'
           when 2 then 'Review'
           else 'New'
         end,
         current_date + (((row_number() over (partition by u.id order by s.created_at)) % 6) - 2)::int,
         case ((row_number() over (partition by u.id order by s.created_at)) % 4)
           when 0 then 'Easy'
           when 1 then 'Good'
           when 2 then 'Hard'
           else null
         end,
         ((row_number() over (partition by u.id order by s.created_at)) % 3 = 0)
  from users u
  join sentences s on s.target_language = u.target_language
  where exists (select 1 from user_languages ul where ul.user_id = u.id and ul.language = s.target_language)
  on conflict do nothing;

  insert into user_story_states (user_id, story_id, unlocked, completed)
  select u.id,
         st.id,
         true,
         ((row_number() over (partition by u.id order by st.created_at)) % 3 <> 0)
  from users u
  join (
    select distinct on (story_id, target_language) story_id, target_language
      from story_translations
      order by story_id, target_language
  ) story_language on story_language.target_language = u.target_language
  join stories st on st.id = story_language.story_id
  on conflict do nothing;

  insert into user_learning_path_progress (user_id, path_id, progress)
  select u.id, lp.id, (20 + ((row_number() over (partition by u.id order by lp.title) * 17) % 78))::int
  from users u
  join learning_paths lp on lp.target_language = u.target_language
  on conflict do nothing;

  insert into goals (user_id, goal_scope, target_language, title, type, target, progress, visibility, reward, due_date)
  select u.id, 'Language', u.target_language,
         'Complete ' || (3 + (row_number() over (order by u.display_name) % 5)) || ' ' || u.target_language || ' stories',
         'Stories',
         (3 + (row_number() over (order by u.display_name) % 5))::int,
         (1 + (row_number() over (order by u.display_name) % 3))::int,
         'Public',
         25,
         current_date + ((10 + row_number() over (order by u.display_name)) || ' days')::interval
  from users u;

  insert into goals (user_id, goal_scope, target_language, title, type, target, progress, visibility, reward, due_date)
  select u.id, 'Global', null,
         'Keep a ' || (7 + (row_number() over (order by u.display_name) % 10)) || '-day study streak',
         'Streak',
         (7 + (row_number() over (order by u.display_name) % 10))::int,
         (1 + (row_number() over (order by u.display_name) % 5))::int,
         case when row_number() over (order by u.display_name) % 4 = 0 then 'Private' else 'Public' end,
         25,
         current_date + ((6 + row_number() over (order by u.display_name)) || ' days')::interval
  from users u;

  for idx in 1..16 loop
    select id into new_user_id from users order by display_name offset idx - 1 limit 1;
    select st.id into target_story_id
      from stories st
      join (
        select distinct on (story_id, target_language) story_id, target_language
          from story_translations
          order by story_id, target_language
      ) story_language on story_language.story_id = st.id
     where story_language.target_language = (select target_language from users where id = new_user_id)
     order by st.created_at
     offset ((idx - 1) % 2)
     limit 1;
    select id into target_sentence_id from sentences where target_language = (select target_language from users where id = new_user_id) order by created_at offset ((idx - 1) % 3) limit 1;
    select id into target_goal_id from goals where user_id = new_user_id and visibility = 'Public' order by due_date limit 1;

    insert into posts (user_id, type, body, target_language, sentence_id, story_id, goal_id, created_at)
    values (
      new_user_id,
      case idx % 5 when 0 then 'Question Post' when 1 then 'Learning Update' when 2 then 'Sentence Share' when 3 then 'Story Completion' else 'Goal Share' end,
      case idx % 5
        when 0 then 'Does anyone have a better way to remember the sentence pattern from today?'
        when 1 then 'I reviewed my saved sentences before breakfast and the story felt much smoother.'
        when 2 then 'This sentence finally clicked after I saw it inside a short story.'
        when 3 then 'I finished a story at a harder level and understood more than expected.'
        else 'Sharing my goal here so I stay accountable this week.'
      end,
      (select target_language from users where id = new_user_id),
      case when idx % 5 = 2 then target_sentence_id else null end,
      case when idx % 5 = 3 then target_story_id else null end,
      case when idx % 5 = 4 then target_goal_id else null end,
      now() - ((idx * 7) || ' hours')::interval
    )
    returning id into post_id;

    insert into posts (user_id, type, body, target_language, story_id, created_at)
    values (
      new_user_id,
      'Learning Update',
      'Tiny win: I reread yesterday''s story and noticed three phrases without translating first.',
      (select target_language from users where id = new_user_id),
      target_story_id,
      now() - ((idx * 7 + 3) || ' hours')::interval
    );
  end loop;

  insert into post_likes (post_id, user_id, created_at)
  select p.id, u.id, p.created_at + interval '30 minutes'
  from posts p
  join users u on u.id <> p.user_id
  where (abs(hashtext(p.id::text || u.id::text)) % 4) = 0
  on conflict do nothing;

  insert into post_comments (post_id, user_id, body, created_at)
  select p.id,
         u.id,
         case abs(hashtext(u.id::text || p.id::text)) % 5
           when 0 then 'This is exactly the kind of sentence I need to review.'
           when 1 then 'Nice progress. Reading the same story twice helps me too.'
           when 2 then 'I saved this idea for my next review session.'
           when 3 then 'That goal feels realistic. Keep going.'
           else 'Thanks for sharing the context. It makes the phrase easier to remember.'
         end,
         p.created_at + interval '1 hour'
  from posts p
  join users u on u.id <> p.user_id
  where (abs(hashtext(u.email || p.id::text)) % 6) = 0;

  insert into saved_posts (post_id, user_id, created_at)
  select p.id, u.id, now() - interval '2 days'
  from posts p
  join users u on u.id <> p.user_id
  where p.goal_id is not null
     or (abs(hashtext(p.id::text || u.email)) % 9) = 0
  on conflict do nothing;

  insert into user_follows (follower_id, following_id, created_at)
  select follower.id, following.id, now() - ((abs(hashtext(follower.email || following.email)) % 20) || ' days')::interval
  from users follower
  join users following on following.id <> follower.id
  where follower.target_language = following.target_language
     or (abs(hashtext(follower.email || following.email)) % 5) = 0
  on conflict do nothing;

  insert into story_comments (story_id, user_id, body, created_at)
  select st.id,
         u.id,
         case abs(hashtext(st.title || u.email)) % 4
           when 0 then 'The key sentences made this story much easier to follow.'
           when 1 then 'I like switching levels after the first read.'
           when 2 then 'The vocabulary tab helped me notice the repeated words.'
           else 'This story is good for shadowing because the scene is clear.'
         end,
         now() - ((abs(hashtext(st.id::text || u.id::text)) % 8) || ' days')::interval
  from stories st
  join (
    select distinct on (story_id, target_language) story_id, target_language
      from story_translations
      order by story_id, target_language
  ) story_language on story_language.story_id = st.id
  join users u on u.target_language = story_language.target_language
  where (abs(hashtext(st.title || u.email)) % 2) = 0;

  insert into story_comments (story_id, user_id, parent_comment_id, body, created_at)
  select parent.story_id,
         replier.id,
         parent.id,
         'Same here. The one-level replies keep the discussion easy to scan.',
         parent.created_at + interval '2 hours'
  from story_comments parent
  join users replier on replier.id <> parent.user_id
  where (abs(hashtext(parent.id::text || replier.email)) % 11) = 0
  limit 20;

  insert into goal_supports (goal_id, supporter_id, recipient_id, amount, message, created_at)
  select g.id,
         supporter.id,
         g.user_id,
         3 + (abs(hashtext(g.id::text || supporter.id::text)) % 15),
         'Cheering you on with this goal.',
         now() - ((abs(hashtext(g.id::text || supporter.email)) % 12) || ' days')::interval
  from goals g
  join users supporter on supporter.id <> g.user_id
  where g.visibility = 'Public'
    and (abs(hashtext(g.id::text || supporter.email)) % 7) = 0;

  insert into coin_transactions (user_id, coin_rule_id, amount, label, created_at)
  select supporter_id, (select id from coin_rules where rule_key = 'goal_support_sent'), -amount, 'Goal Support Sent', created_at
  from goal_supports;

  insert into coin_transactions (user_id, coin_rule_id, amount, label, created_at)
  select recipient_id, (select id from coin_rules where rule_key = 'goal_support_received'), amount, 'Goal Support Received', created_at
  from goal_supports;

  for supporter, recipient in
    select f.follower_id, f.following_id
    from user_follows f
    join users u1 on u1.id = f.follower_id
    join users u2 on u2.id = f.following_id
    order by u1.display_name, u2.display_name
    limit 28
  loop
    insert into direct_conversations (participant_one, participant_two, created_at, updated_at)
    values (supporter, recipient, now() - interval '5 days', now() - interval '1 hour')
    on conflict do nothing;

    select id into conversation_id
    from direct_conversations
    where least(participant_one::text, participant_two::text) = least(supporter::text, recipient::text)
      and greatest(participant_one::text, participant_two::text) = greatest(supporter::text, recipient::text)
    limit 1;

    insert into direct_messages (conversation_id, sender_id, recipient_id, body, read_at, created_at)
    values
      (conversation_id, supporter, recipient, 'Your latest goal inspired me to review my saved sentences today.', now() - interval '3 hours', now() - interval '4 hours'),
      (conversation_id, recipient, supporter, 'Thank you. I am trying to keep the goal small enough to finish.', now() - interval '2 hours', now() - interval '3 hours'),
      (conversation_id, supporter, recipient, 'Sending a coin with this message for extra encouragement.', null, now() - interval '1 hour');

    insert into coin_transactions (user_id, coin_rule_id, amount, label, created_at)
    values
      (supporter, (select id from coin_rules where rule_key = 'direct_message_sent'), -1, 'Direct Message Sent', now() - interval '1 hour'),
      (recipient, (select id from coin_rules where rule_key = 'direct_message_received'), 1, 'Direct Message Received', now() - interval '1 hour');
  end loop;
end $$;

commit;
