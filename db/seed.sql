-- Seeded account password: Juy90n1!

begin;

alter table if exists stories
  add column if not exists image_url text;

do $$
declare
  requested_tables text[] := array[
    'lesson_coin_reward_suggestions',
    'teacher_payouts',
    'teacher_reviews',
    'lesson_template_resources',
    'lesson_templates',
    'teacher_resources',
    'lesson_notes',
    'teacher_private_notes',
    'teacher_student_relationships',
    'classroom_sessions',
    'lesson_reschedule_requests',
    'lesson_payments',
    'lesson_participants',
    'lesson_bookings',
    'teacher_subscriptions',
    'teacher_unavailable_blocks',
    'teacher_availability_rules',
    'teacher_booking_rules',
    'teacher_lesson_settings',
    'teacher_profile_tags',
    'teacher_profile_languages',
    'teacher_profiles',
    'teacher_subscription_plans',
    'voice_video_room_coin_transactions',
    'voice_video_room_sessions',
    'voice_video_room_participants',
    'voice_video_rooms',
    'direct_messages',
    'direct_conversations',
    'saved_posts',
    'post_appreciations',
    'post_views',
    'post_comments',
    'post_likes',
    'posts',
    'story_comments',
    'user_follows',
    'goal_supports',
    'goal_templates',
    'goals',
    'user_learning_path_progress',
    'learning_path_items',
    'learning_paths',
    'user_story_states',
    'story_translations',
    'stories',
    'story_categories',
    'user_sentence_review_results',
    'user_saved_sentence_decks',
    'sentence_deck_items',
    'sentence_deck_topics',
    'sentence_decks',
    'user_sentence_reviews',
    'sentences',
    'coin_transactions',
    'coin_rules',
    'user_sessions',
    'wallets',
    'user_languages',
    'users',
    'supported_languages'
  ];
  existing_tables text;
begin
  select string_agg(format('%I.%I', table_schema, table_name), ', ')
    into existing_tables
    from information_schema.tables
   where table_schema = 'public'
     and table_type = 'BASE TABLE'
     and table_name = any(requested_tables);

  if existing_tables is not null then
    execute format('truncate table %s restart identity cascade', existing_tables);
  end if;
end $$;

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
  ('sentence_deck_completed', 'Sentence Deck Completed', 10, 'earn', 'sentence_deck_completed'),
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

create temporary table seed_system_deck_payload (
  deck_name text,
  target_language text,
  topic text,
  level text,
  target text,
  translation text,
  romanization text,
  difficulty integer,
  notes text,
  variations jsonb
) on commit drop;

insert into seed_system_deck_payload (deck_name, target_language, topic, level, target, translation, romanization, difficulty, notes, variations)
values
  ('Japanese Travel Essentials', 'Japanese', 'Travel', 'A1', '駅はどこですか。', 'Where is the train station?', 'Eki wa doko desu ka.', 1, 'Use this pattern for asking where places are.', '["ホテルはどこですか。", "出口はどこですか。"]'::jsonb),
  ('Japanese Travel Essentials', 'Japanese', 'Travel', 'A2', '飛行機が遅れています。', 'My flight is delayed.', 'Hikoki ga okurete imasu.', 3, 'Present-progressive form for travel problems.', '["電車が遅れています。", "バスが遅れています。"]'::jsonb),
  ('Japanese Daily Requests', 'Japanese', 'Daily Life', 'A1', '手伝ってください。', 'Please help me.', 'Tetsudatte kudasai.', 2, 'Polite request form with kudasai.', '["待ってください。", "見てください。"]'::jsonb),
  ('Japanese Workplace Basics', 'Japanese', 'Workplace', 'A2', '何時に始まりますか。', 'What time does it start?', 'Nanji ni hajimarimasu ka.', 2, 'Time question pattern for meetings.', '["何時に終わりますか。", "何時に開きますか。"]'::jsonb),
  ('Japanese Workplace Basics', 'Japanese', 'Workplace', 'B1', '確認してもいいですか。', 'May I confirm?', 'Kakunin shite mo ii desu ka.', 3, 'Useful for polite clarification.', '["質問してもいいですか。", "共有してもいいですか。"]'::jsonb),
  ('Spanish Cafe Conversations', 'Spanish', 'Food', 'A1', 'Quisiera un cafe, por favor.', 'I would like a coffee, please.', '', 1, 'Polite cafe ordering.', '["Quisiera un te, por favor.", "Quisiera agua, por favor."]'::jsonb),
  ('Spanish Cafe Conversations', 'Spanish', 'Food', 'A1', 'La cuenta, por favor.', 'The bill, please.', '', 1, 'Short restaurant request.', '["El menu, por favor.", "Una mesa, por favor."]'::jsonb),
  ('Spanish Travel Moments', 'Spanish', 'Travel', 'A2', 'Mi tren sale a las ocho.', 'My train leaves at eight.', '', 2, 'Travel time sentence.', '["Mi autobus sale a las nueve.", "Mi vuelo sale a las seis."]'::jsonb),
  ('Spanish Travel Moments', 'Spanish', 'Travel', 'A2', 'Estoy buscando la estacion.', 'I am looking for the station.', '', 2, 'Useful city navigation phrase.', '["Estoy buscando el hotel.", "Estoy buscando la salida."]'::jsonb),
  ('French Weekend Plans', 'French', 'Daily Life', 'A1', 'Je vais au marche samedi.', 'I am going to the market on Saturday.', '', 1, 'Weekend plan sentence.', '["Je vais au parc samedi.", "Je vais au musee dimanche."]'::jsonb),
  ('French Weekend Plans', 'French', 'Friendship', 'A2', 'Tu veux venir avec moi ?', 'Do you want to come with me?', '', 2, 'Friendly invitation.', '["Tu veux etudier avec moi ?", "Tu veux manger avec moi ?"]'::jsonb),
  ('Korean Study Group', 'Korean', 'Study', 'A1', '오늘 같이 공부해요.', 'Let us study together today.', 'Oneul gachi gongbuhaeyo.', 1, 'Friendly study invitation.', '["내일 같이 공부해요.", "도서관에서 공부해요."]'::jsonb),
  ('Korean Study Group', 'Korean', 'Study', 'A2', '이 문장을 다시 읽어요.', 'Read this sentence again.', 'I munjangeul dasi ilgeoyo.', 2, 'Reading practice phrase.', '["이 단어를 다시 읽어요.", "이 이야기를 다시 읽어요."]'::jsonb);

insert into sentence_decks (deck_kind, name, description, coins, level, visibility, source_language, target_language)
select 'System',
       deck_name,
       'Official LinguaStories learning material.',
       count(*)::int * 10,
       min(level),
       'Public',
       'English',
       target_language
  from seed_system_deck_payload
 group by deck_name, target_language;

insert into sentences (source_language, target_language, target, translation, romanization, level, topic, difficulty, notes, source, variations)
select 'English',
       target_language,
       target,
       translation,
       romanization,
       level,
       topic,
       difficulty,
       notes,
       deck_name,
       variations
  from seed_system_deck_payload;

insert into sentence_deck_items (deck_id, sentence_id, sort_order)
select d.id,
       s.id,
       row_number() over (partition by d.id order by s.created_at, s.id)::int
  from sentence_decks d
  join sentences s on s.source = d.name and s.target_language = d.target_language
 where d.deck_kind = 'System';

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
<<seed_data>>
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
  deck_id uuid;
  topic_one_id uuid;
  topic_two_id uuid;
  deck_sentence_id uuid;
  post_id uuid;
  comment_user_id uuid;
  room_id uuid;
  room_host_id uuid;
  room_guest_id uuid;
  room_participant_id uuid;
  room_session_id uuid;
  teacher_user_id uuid;
  student_user_id uuid;
  teacher_profile_id uuid;
  lesson_id uuid;
  teacher_resource_id uuid;
  lesson_template_id uuid;
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
      (new_user_id, (select id from coin_rules where rule_key = 'sentence_deck_completed'), 10, 'Sentence Deck Completed', now() - ((idx % 8) || ' days')::interval),
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

  for idx in 1..8 loop
    select id into new_user_id
      from users
     order by case email
                when 'demo@linguastories.local' then 0
                when 'noah@linguastories.local' then 1
                when 'ari@linguastories.local' then 2
                else 3
              end,
              display_name
     offset idx - 1
     limit 1;

    insert into sentence_decks (user_id, name, description, coins, level, visibility, target_language, created_at, updated_at)
    values (
      new_user_id,
      case (select target_language from users where id = new_user_id)
        when 'Japanese' then 'Airport Survival Sentences'
        when 'Spanish' then 'Cafe Counter Confidence'
        when 'French' then 'Weekend Errand Phrases'
        when 'Korean' then 'Study Group Starters'
        else 'Useful Daily Sentences'
      end,
      case (select target_language from users where id = new_user_id)
        when 'Japanese' then 'Mined lines for airport delays, station questions, and polite help requests.'
        when 'Spanish' then 'Short cafe and travel phrases for ordering, paying, and finding places.'
        when 'French' then 'Weekend plans, invitations, and practical market phrases.'
        when 'Korean' then 'Friendly sentences for study groups, rereading, and making plans.'
        else 'A starter deck of high-utility mined sentences.'
      end,
      6 + idx,
      (select current_level from users where id = new_user_id),
      case when idx % 3 = 0 then 'Private' else 'Public' end,
      (select target_language from users where id = new_user_id),
      now() - ((idx * 5) || ' hours')::interval,
      now() - ((idx * 4) || ' hours')::interval
    )
    returning id into deck_id;

    insert into sentence_deck_topics (deck_id, name, description, sort_order)
    values
      (
        deck_id,
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'Getting Oriented'
          when 'Spanish' then 'Ordering Clearly'
          when 'French' then 'Making Plans'
          when 'Korean' then 'Starting Study'
          else 'Daily Basics'
        end,
        'First-response sentences that are easy to reuse in real conversations.',
        1
      )
    returning id into topic_one_id;

    insert into sentence_deck_topics (deck_id, name, description, sort_order)
    values
      (
        deck_id,
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'Solving Problems'
          when 'Spanish' then 'Travel Follow-ups'
          when 'French' then 'Weekend Details'
          when 'Korean' then 'Review Routine'
          else 'Follow-up Lines'
        end,
        'Follow-up sentences for keeping the exchange moving.',
        2
      )
    returning id into topic_two_id;

    insert into sentences (target_language, target, translation, romanization, level, topic, difficulty, notes, source)
    values
      (
        (select target_language from users where id = new_user_id),
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then '案内所はどこですか。'
          when 'Spanish' then 'Quisiera pedir algo pequeno.'
          when 'French' then 'Je voudrais faire quelques courses.'
          when 'Korean' then '오늘 같이 복습할까요?'
          else 'Can you say that again?'
        end,
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'Where is the information desk?'
          when 'Spanish' then 'I would like to order something small.'
          when 'French' then 'I would like to run a few errands.'
          when 'Korean' then 'Shall we review together today?'
          else 'Can you say that again?'
        end,
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'Annai-jo wa doko desu ka.'
          when 'Korean' then 'Oneul gachi bokseup halkkayo?'
          else ''
        end,
        (select current_level from users where id = new_user_id),
        (select name from sentence_deck_topics where id = topic_one_id),
        2,
        'Mined from a scenario where the learner needed a compact, reusable first question.',
        'Sentence Mining'
      )
    returning id into deck_sentence_id;

    insert into sentence_deck_items (deck_id, topic_id, sentence_id, sort_order)
    values (deck_id, topic_one_id, deck_sentence_id, 1);

    insert into user_sentence_reviews (user_id, sentence_id, state, due_date, last_rating, saved)
    values (new_user_id, deck_sentence_id, 'Review', current_date, 'Good', true)
    on conflict do nothing;

    insert into sentences (target_language, target, translation, romanization, level, topic, difficulty, notes, source)
    values
      (
        (select target_language from users where id = new_user_id),
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'もう一度ゆっくり言ってください。'
          when 'Spanish' then 'Puede hablar mas despacio, por favor?'
          when 'French' then 'Vous pouvez repeter plus lentement ?'
          when 'Korean' then '조금 천천히 말해 주세요.'
          else 'Please speak a little more slowly.'
        end,
        'Please say it a little more slowly.',
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'Mo ichido yukkuri itte kudasai.'
          when 'Korean' then 'Jogeum cheoncheonhi malhae juseyo.'
          else ''
        end,
        (select current_level from users where id = new_user_id),
        (select name from sentence_deck_topics where id = topic_two_id),
        2,
        'Useful repair phrase for keeping a conversation from collapsing.',
        'Sentence Mining'
      )
    returning id into deck_sentence_id;

    insert into sentence_deck_items (deck_id, topic_id, sentence_id, sort_order)
    values (deck_id, topic_two_id, deck_sentence_id, 1);

    insert into user_sentence_reviews (user_id, sentence_id, state, due_date, last_rating, saved)
    values (new_user_id, deck_sentence_id, 'Learning', current_date + 1, 'Hard', true)
    on conflict do nothing;

    insert into sentences (target_language, target, translation, romanization, level, topic, difficulty, notes, source)
    values
      (
        (select target_language from users where id = new_user_id),
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'この表現を覚えておきたいです。'
          when 'Spanish' then 'Quiero recordar esta expresion.'
          when 'French' then 'Je veux retenir cette expression.'
          when 'Korean' then '이 표현을 기억하고 싶어요.'
          else 'I want to remember this expression.'
        end,
        'I want to remember this expression.',
        case (select target_language from users where id = new_user_id)
          when 'Japanese' then 'Kono hyogen o oboete okitai desu.'
          when 'Korean' then 'I pyohyeoneul gieokhago sipeoyo.'
          else ''
        end,
        (select current_level from users where id = new_user_id),
        (select name from sentence_deck_topics where id = topic_two_id),
        1,
        'Meta-learning sentence for explaining why a phrase is worth saving.',
        'Sentence Mining'
      )
    returning id into deck_sentence_id;

    insert into sentence_deck_items (deck_id, topic_id, sentence_id, sort_order)
    values (deck_id, topic_two_id, deck_sentence_id, 2);

    insert into user_sentence_reviews (user_id, sentence_id, state, due_date, last_rating, saved)
    values (new_user_id, deck_sentence_id, 'New', current_date + 3, null, true)
    on conflict do nothing;

    if exists (select 1 from sentence_decks where id = deck_id and visibility = 'Public') then
      insert into posts (user_id, type, body, target_language, created_at)
      values (
        new_user_id,
        'Sentence Deck',
        (select display_name from users where id = new_user_id) || ' created a public sentence deck: ' ||
          (select name from sentence_decks where id = deck_id) || E'.\n' ||
          (select description from sentence_decks where id = deck_id) || E'\nLevel: ' ||
          (select level from sentence_decks where id = deck_id) || '. Coins: ' ||
          (select coins from sentence_decks where id = deck_id) || E'.\nOpen deck: /app/sentence-mining/decks/' || deck_id::text,
        (select target_language from users where id = new_user_id),
        now() - ((idx * 5 - 1) || ' hours')::interval
      );
    end if;
  end loop;

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

  update users
     set avatar_url = 'https://images.unsplash.com/photo-' ||
       case (abs(hashtext(email)) % 12)
         when 0 then '1494790108377-be9c29b29330'
         when 1 then '1500648767791-00dcc994a43e'
         when 2 then '1534528741775-53994a69daeb'
         when 3 then '1517841905240-472988babdf9'
         when 4 then '1527980965255-d3b416303d12'
         when 5 then '1544005313-94ddf0286df2'
         when 6 then '1506794778202-cad84cf45f1d'
         when 7 then '1547425260-76bcadfb4f2c'
         when 8 then '1552058544-f2b08422138a'
         when 9 then '1492562080023-ab3db95bfbce'
         when 10 then '1544723795-3fb6469f5b39'
         else '1531123897727-8f129e1688ce'
       end || '?auto=format&fit=crop&w=240&q=80';

  update sentence_decks
     set image_url = 'https://images.unsplash.com/photo-' ||
       case (abs(hashtext(name || target_language)) % 8)
         when 0 then '1519682337058-a94d519337bc'
         when 1 then '1481627834876-b7833e8f5570'
         when 2 then '1516321318423-f06f85e504b3'
         when 3 then '1497633762265-9d179a990aa6'
         when 4 then '1524995997946-a1c2e315a42f'
         when 5 then '1456513080510-7bf3a84b82f8'
         when 6 then '1503676260728-1c00da094a0b'
         else '1513475382585-d06e58bcb0e0'
       end || '?auto=format&fit=crop&w=720&q=80';

  update stories
     set image_url = 'https://images.unsplash.com/photo-' ||
       case topic
         when 'Travel' then
           case (abs(hashtext(title)) % 4)
             when 0 then '1500530855697-b586d89ba3ee'
             when 1 then '1500534314209-a25ddb2bd429'
             when 2 then '1488646953014-85cb44e25828'
             else '1494783367193-149034c05e8f'
           end
         when 'Workplace' then
           case (abs(hashtext(title)) % 3)
             when 0 then '1497366754035-f200968a6e72'
             when 1 then '1517245386807-bb43f82c33c4'
             else '1521737604893-d14cc237f11d'
           end
         when 'Food' then
           case (abs(hashtext(title)) % 3)
             when 0 then '1504674900247-0877df9cc836'
             when 1 then '1495474472287-4d71bcdd2085'
             else '1521017432531-fbd92d768814'
           end
         when 'Daily Life' then
           case (abs(hashtext(title)) % 3)
             when 0 then '1441986300917-64674bd600d8'
             when 1 then '1522202176988-66273c2fd55f'
             else '1488521787991-ed7bbaae773c'
           end
         when 'Study' then
           case (abs(hashtext(title)) % 3)
             when 0 then '1456513080510-7bf3a84b82f8'
             when 1 then '1516321318423-f06f85e504b3'
             else '1519389950473-47ba0277781c'
           end
         else '1519682337058-a94d519337bc'
       end || '?auto=format&fit=crop&w=960&q=80';

  update sentences
     set image_url = 'https://images.unsplash.com/photo-' ||
       case (abs(hashtext(target || translation)) % 10)
         when 0 then '1500530855697-b586d89ba3ee'
         when 1 then '1488646953014-85cb44e25828'
         when 2 then '1504674900247-0877df9cc836'
         when 3 then '1517245386807-bb43f82c33c4'
         when 4 then '1522202176988-66273c2fd55f'
         when 5 then '1529156069898-49953e39b3ac'
         when 6 then '1500534314209-a25ddb2bd429'
         when 7 then '1498837167922-ddd27525d352'
         when 8 then '1517048676732-d65bc937f952'
         else '1523240795612-9a054b0db644'
       end || '?auto=format&fit=crop&w=720&q=80';

  insert into post_appreciations (post_id, sender_id, recipient_id, amount, message, created_at)
  select p.id,
         sender.id,
         p.user_id,
         1 + (abs(hashtext(p.id::text || sender.id::text)) % 12),
         'This moment helped me choose what to review next.',
         p.created_at + interval '90 minutes'
    from posts p
    join users sender on sender.id <> p.user_id
   where (abs(hashtext(p.id::text || sender.email)) % 10) = 0;

  insert into coin_transactions (user_id, coin_rule_id, amount, label, created_at)
  select sender_id, (select id from coin_rules where rule_key = 'moment_appreciation_sent'), -amount, 'Moment Appreciation Sent', created_at
    from post_appreciations;

  insert into coin_transactions (user_id, coin_rule_id, amount, label, created_at)
  select recipient_id, (select id from coin_rules where rule_key = 'moment_appreciation_received'), amount, 'Moment Appreciation Received', created_at
    from post_appreciations;

  insert into teacher_subscription_plans (plan_key, name, monthly_price_usd, can_create_group_lessons)
  values
    ('teacher', 'Teacher Tier', 2.99, false),
    ('teacher_pro', 'Teacher Pro Tier', 6.99, true)
  on conflict (plan_key) do update
  set name = excluded.name,
      monthly_price_usd = excluded.monthly_price_usd,
      can_create_group_lessons = excluded.can_create_group_lessons,
      active = true;

  for idx in 1..10 loop
    select id into room_host_id from users order by display_name offset idx - 1 limit 1;
    insert into voice_video_rooms (
      owner_user_id, title, description, room_type, target_language, source_language, cefr_level,
      max_participants, is_private, status, livekit_room_name, image_url, image_file_id, created_at, started_at, ended_at
    )
    values (
      room_host_id,
      case idx % 5
        when 0 then 'Four-person pronunciation sprint'
        when 1 then 'Travel phrase practice room'
        when 2 then 'Story retell circle'
        when 3 then 'Cafe roleplay room'
        else 'Study group warm-up'
      end,
      'Seeded room for checking the voice/video rooms list, history, participant counts, and moderation controls.',
      case when idx % 3 = 0 then 'voice' else 'video' end,
      (select target_language from users where id = room_host_id),
      'English',
      case idx % 6 when 0 then 'A1' when 1 then 'A2' when 2 then 'B1' when 3 then 'B2' when 4 then 'C1' else 'C2' end,
      2 + (idx % 3),
      idx % 4 = 0,
      case when idx <= 6 then 'active' when idx <= 8 then 'ended' else 'cancelled' end,
      'seed-livekit-room-' || idx,
      'https://images.unsplash.com/photo-' ||
        case idx % 6
          when 0 then '1516321318423-f06f85e504b3'
          when 1 then '1522202176988-66273c2fd55f'
          when 2 then '1517245386807-bb43f82c33c4'
          when 3 then '1523240795612-9a054b0db644'
          when 4 then '1500530855697-b586d89ba3ee'
          else '1517048676732-d65bc937f952'
        end || '?auto=format&fit=crop&w=720&q=80',
      'seed/voice-video-room-' || idx || '.jpg',
      now() - ((idx * 3) || ' hours')::interval,
      case when idx <= 6 then now() - ((idx * 7) || ' minutes')::interval else now() - ((idx * 8) || ' hours')::interval end,
      case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else null end
    )
    returning id into room_id;

    insert into voice_video_room_participants (room_id, user_id, role, joined_at, left_at, status, created_at)
    values (
      room_id,
      room_host_id,
      'host',
      coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes'),
      case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else null end,
      case when idx > 6 then 'left' else 'joined' end,
      now() - ((idx * 3) || ' hours')::interval
    )
    returning id into room_participant_id;

    insert into voice_video_room_sessions (
      room_id, user_id, participant_id, livekit_identity, started_at, ended_at, duration_seconds, billed_minutes, coins_charged, status
    )
    values (
      room_id,
      room_host_id,
      room_participant_id,
      'seed-room-' || idx || '-host',
      coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes'),
      case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '3 minutes' end,
      case when idx > 6 then 300 else 180 end,
      case when idx > 6 then 5 else 3 end,
      case when idx > 6 then 5000 else 3000 end,
      'completed'
    )
    returning id into room_session_id;

    insert into voice_video_room_coin_transactions (user_id, room_id, session_id, coins)
    values (room_host_id, room_id, room_session_id, case when idx > 6 then 5000 else 3000 end);

    for room_guest_id in
      select id
        from users
       where id <> room_host_id
         and target_language = (select target_language from users where id = room_host_id)
       order by display_name
       limit (1 + (idx % 3))
    loop
      insert into voice_video_room_participants (room_id, user_id, role, joined_at, left_at, status, created_at)
      values (
        room_id,
        room_guest_id,
        'participant',
        coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '2 minutes',
        case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else null end,
        case when idx > 6 then 'left' else 'joined' end,
        now() - ((idx * 3) || ' hours')::interval
      )
      returning id into room_participant_id;

      insert into voice_video_room_sessions (
        room_id, user_id, participant_id, livekit_identity, started_at, ended_at, duration_seconds, billed_minutes, coins_charged, status
      )
      values (
        room_id,
        room_guest_id,
        room_participant_id,
        'seed-room-' || idx || '-' || room_guest_id::text,
        coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '2 minutes',
        case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '4 minutes' end,
        case when idx > 6 then 240 else 180 end,
        case when idx > 6 then 4 else 3 end,
        case when idx > 6 then 4000 else 3000 end,
        'completed'
      )
      returning id into room_session_id;

      insert into voice_video_room_coin_transactions (user_id, room_id, session_id, coins)
      values (room_guest_id, room_id, room_session_id, case when idx > 6 then 4000 else 3000 end);
    end loop;
  end loop;

  for teacher_user_id in
    select id from users order by display_name limit 8
  loop
    idx := idx + 1;
    insert into teacher_subscriptions (
      user_id, plan_key, status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at
    )
    values (
      teacher_user_id,
      case when idx % 2 = 0 then 'teacher_pro' else 'teacher' end,
      'active',
      'cus_seed_' || replace(teacher_user_id::text, '-', ''),
      'sub_seed_' || replace(teacher_user_id::text, '-', ''),
      now() + interval '24 days',
      now() - interval '20 days',
      now() - interval '2 days'
    );

    insert into teacher_profiles (
      user_id, display_name, headline, bio, teaching_style, experience_summary, certifications,
      native_language, timezone, country, city, hourly_rate_usd, trial_rate_usd,
      min_lesson_minutes, max_lesson_minutes, group_lesson_enabled, group_max_students,
      video_intro_url, video_provider, image_url, image_file_id, status, created_at, updated_at
    )
    values (
      teacher_user_id,
      (select display_name from users where id = teacher_user_id),
      case (select target_language from users where id = teacher_user_id)
        when 'Japanese' then 'Practical Japanese through story retells and sentence repair'
        when 'Spanish' then 'Warm Spanish conversation practice for travel and cafes'
        when 'French' then 'Gentle French lessons for weekend-life conversations'
        when 'Korean' then 'Korean study partner for reading, shadowing, and recall'
        else 'Conversation lessons built around useful sentences'
      end,
      'I teach with short stories, concrete correction, and repeatable sentences. Each lesson ends with a small set of phrases the student can review inside LinguaStories.',
      'Low-pressure speaking, quick pronunciation feedback, roleplay, and one focused correction at a time.',
      'More than 800 online language sessions taught across travel, workplace, exam-prep, and daily-life topics.',
      'LinguaStories verified teacher profile. Conversation coaching, CEFR-aligned feedback, and live classroom facilitation.',
      (select native_language from users where id = teacher_user_id),
      case idx % 4 when 0 then 'Asia/Tokyo' when 1 then 'America/New_York' when 2 then 'Europe/Paris' else 'Asia/Seoul' end,
      case idx % 4 when 0 then 'Japan' when 1 then 'United States' when 2 then 'France' else 'South Korea' end,
      case idx % 4 when 0 then 'Tokyo' when 1 then 'New York' when 2 then 'Paris' else 'Seoul' end,
      16 + (idx * 3),
      8 + idx,
      30,
      case when idx % 3 = 0 then 90 else 60 end,
      idx % 2 = 0,
      case when idx % 2 = 0 then 4 else 1 end,
      case when idx % 2 = 0 then 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' else 'https://vimeo.com/76979871' end,
      case when idx % 2 = 0 then 'youtube' else 'vimeo' end,
      'https://images.unsplash.com/photo-' ||
        case idx % 8
          when 0 then '1494790108377-be9c29b29330'
          when 1 then '1500648767791-00dcc994a43e'
          when 2 then '1517841905240-472988babdf9'
          when 3 then '1544005313-94ddf0286df2'
          when 4 then '1527980965255-d3b416303d12'
          when 5 then '1506794778202-cad84cf45f1d'
          when 6 then '1547425260-76bcadfb4f2c'
          else '1531123897727-8f129e1688ce'
        end || '?auto=format&fit=crop&w=520&q=80',
      'seed/teacher-profile-' || idx || '.jpg',
      'published',
      now() - ((idx * 4) || ' days')::interval,
      now() - ((idx * 2) || ' hours')::interval
    )
    returning id into teacher_profile_id;

    insert into teacher_profile_languages (teacher_profile_id, language, role, cefr_level)
    values
      (teacher_profile_id, (select target_language from users where id = teacher_user_id), 'teaches', case idx % 6 when 0 then 'A1' when 1 then 'A2' when 2 then 'B1' when 3 then 'B2' when 4 then 'C1' else 'C2' end),
      (teacher_profile_id, (select native_language from users where id = teacher_user_id), 'speaks', 'Native'),
      (teacher_profile_id, 'English', 'speaks', 'C1')
    on conflict do nothing;

    insert into teacher_profile_tags (teacher_profile_id, tag)
    values
      (teacher_profile_id, 'conversation'),
      (teacher_profile_id, 'story retell'),
      (teacher_profile_id, 'pronunciation'),
      (teacher_profile_id, case idx % 4 when 0 then 'travel' when 1 then 'workplace' when 2 then 'exam prep' else 'daily life' end)
    on conflict do nothing;

    insert into teacher_lesson_settings (
      teacher_profile_id, trial_enabled, one_on_one_enabled, group_enabled, supported_durations, buffer_minutes, advance_notice_hours
    )
    values (teacher_profile_id, true, true, idx % 2 = 0, array[30, 45, 60], 10 + (idx % 3) * 5, 6 + (idx % 4) * 3);

    insert into teacher_booking_rules (
      teacher_user_id, teacher_profile_id, min_booking_notice_minutes, max_advance_booking_days,
      buffer_before_minutes, buffer_after_minutes, cancellation_cutoff_minutes, reschedule_cutoff_minutes,
      supported_durations
    )
    values (
      teacher_user_id, teacher_profile_id, (6 + (idx % 4) * 3) * 60, 30,
      10 + (idx % 3) * 5, 10 + (idx % 3) * 5, 720, 720, array[30, 45, 60]
    )
    on conflict on constraint teacher_booking_rules_teacher_profile_id_key do update
      set min_booking_notice_minutes = excluded.min_booking_notice_minutes,
          buffer_before_minutes = excluded.buffer_before_minutes,
          buffer_after_minutes = excluded.buffer_after_minutes,
          supported_durations = excluded.supported_durations,
          updated_at = now();

    insert into teacher_availability_rules (teacher_profile_id, weekday, start_time, end_time, timezone)
    values
      (teacher_profile_id, 1, '09:00', '12:00', 'UTC'),
      (teacher_profile_id, 3, '18:00', '21:00', 'UTC'),
      (teacher_profile_id, 6, '10:00', '14:00', 'UTC');

    insert into teacher_unavailable_blocks (teacher_profile_id, teacher_user_id, title, starts_at, ends_at, timezone, reason)
    values (teacher_profile_id, teacher_user_id, 'Vacation block', now() + interval '9 days', now() + interval '9 days 3 hours', 'UTC', 'Seeded vacation block');

    insert into teacher_resources (teacher_user_id, teacher_profile_id, title, resource_type, url, body, visibility)
    values
      (teacher_user_id, teacher_profile_id, 'First lesson phrase sheet', 'link', 'https://example.com/resources/first-lesson', 'Starter prompts for a focused first lesson.', 'lesson_students'),
      (teacher_user_id, teacher_profile_id, 'Correction symbols', 'text', null, 'Underline the phrase to repeat. Star the phrase to save. Circle the sound to shadow.', 'teacher_only');

    select id into teacher_resource_id
      from teacher_resources
     where teacher_resources.teacher_user_id = seed_data.teacher_user_id
       and title = 'First lesson phrase sheet'
     order by created_at desc
     limit 1;

    insert into lesson_templates (teacher_user_id, teacher_profile_id, title, target_language, level, lesson_type, body)
    values
      (teacher_user_id, teacher_profile_id, 'Story retell and repair', (select target_language from users where id = teacher_user_id), 'A2', 'one_on_one', '1. Warm-up question. 2. Student retells a short story. 3. Teacher repairs one sentence. 4. Student repeats and saves the phrase.'),
      (teacher_user_id, teacher_profile_id, 'Group roleplay rotation', (select target_language from users where id = teacher_user_id), 'B1', 'group', '1. Assign roles. 2. Rotate speaking turns. 3. Capture three useful phrases. 4. End with one group shadowing round.');

    select id into lesson_template_id
      from lesson_templates
     where lesson_templates.teacher_user_id = seed_data.teacher_user_id
       and title = 'Story retell and repair'
     order by created_at desc
     limit 1;

    insert into lesson_template_resources (lesson_template_id, teacher_resource_id)
    values (lesson_template_id, teacher_resource_id)
    on conflict do nothing;
  end loop;

  for idx in 1..36 loop
    select tp.id, tp.user_id
      into teacher_profile_id, teacher_user_id
      from teacher_profiles tp
      order by tp.created_at, tp.display_name
      offset ((idx - 1) % greatest((select count(*) from teacher_profiles), 1))
      limit 1;

    select u.id
      into student_user_id
      from users u
     where u.id <> teacher_user_id
       and u.target_language = (select language from teacher_profile_languages tpl where tpl.teacher_profile_id = seed_data.teacher_profile_id and role = 'teaches' limit 1)
     order by u.display_name
     offset ((idx - 1) % greatest((select count(*) from users where id <> teacher_user_id), 1))
     limit 1;

    if student_user_id is null then
      select id into student_user_id from users where id <> teacher_user_id order by display_name limit 1;
    end if;

    insert into lesson_bookings (
      teacher_profile_id, teacher_user_id, student_user_id, lesson_type, title, target_language,
      starts_at, ends_at, duration_minutes, max_students, status, payment_status,
      lesson_price_usd, platform_fee_usd, total_student_charge_usd, teacher_payout_usd,
      stripe_checkout_session_id, stripe_payment_intent_id, livekit_room_name, created_at, updated_at
    )
    values (
      teacher_profile_id,
      teacher_user_id,
      student_user_id,
      case when idx % 9 = 0 then 'trial' when idx % 7 = 0 then 'group' else 'one_on_one' end,
      case idx % 5
        when 0 then 'Story retell and correction'
        when 1 then 'Travel roleplay lesson'
        when 2 then 'Pronunciation and shadowing'
        when 3 then 'Saved sentence review'
        else 'Conversation confidence lesson'
      end,
      (select language from teacher_profile_languages tpl where tpl.teacher_profile_id = seed_data.teacher_profile_id and role = 'teaches' limit 1),
      now() + (((idx - 18) * 10) || ' hours')::interval,
      now() + (((idx - 18) * 10 + case when idx % 3 = 0 then 90 else 60 end) || ' hours')::interval,
      case when idx % 3 = 0 then 90 else 60 end,
      case when idx % 7 = 0 then 4 else 1 end,
      case when idx < 18 then 'completed' when idx = 18 then 'active' when idx % 11 = 0 then 'cancelled_by_student' when idx % 5 = 0 then 'pending_payment' else 'confirmed' end,
      case when idx % 5 = 0 then 'pending' when idx % 11 = 0 then 'refunded' else 'paid' end,
      18 + (idx % 8) * 4,
      0.50,
      18.50 + (idx % 8) * 4,
      18 + (idx % 8) * 4,
      'cs_seed_' || idx,
      case when idx % 5 = 0 then null else 'pi_seed_' || idx end,
      'seed-classroom-' || idx,
      now() - ((idx + 3) || ' days')::interval,
      now() - ((idx % 5) || ' hours')::interval
    )
    returning id into lesson_id;

    insert into lesson_participants (lesson_booking_id, user_id, role, joined_at, left_at)
    values
      (seed_data.lesson_id, seed_data.teacher_user_id, 'teacher', case when idx <= 18 then (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id) else null end, case when idx < 18 then (select lb.ends_at from lesson_bookings lb where lb.id = seed_data.lesson_id) else null end),
      (seed_data.lesson_id, seed_data.student_user_id, 'student', case when idx <= 18 then (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id) + interval '3 minutes' else null end, case when idx < 18 then (select lb.ends_at from lesson_bookings lb where lb.id = seed_data.lesson_id) else null end);

    insert into lesson_payments (
      lesson_booking_id, student_user_id, teacher_user_id, lesson_price_usd, platform_fee_usd,
      total_student_charge_usd, teacher_payout_usd, status, stripe_checkout_session_id, stripe_payment_intent_id
    )
    select lb.id, lb.student_user_id, lb.teacher_user_id, lb.lesson_price_usd, lb.platform_fee_usd,
           lb.total_student_charge_usd, lb.teacher_payout_usd,
           case when lb.payment_status = 'paid' then 'paid' when lb.payment_status = 'refunded' then 'refunded' else 'pending' end,
           lb.stripe_checkout_session_id, lb.stripe_payment_intent_id
      from lesson_bookings lb
     where lb.id = seed_data.lesson_id;

    insert into classroom_sessions (lesson_booking_id, livekit_room_name, started_by_user_id, started_at, ended_at, status)
    select lb.id,
           lb.livekit_room_name,
           case when lb.status in ('active', 'completed') then lb.teacher_user_id else null end,
           case when lb.status in ('active', 'completed') then lb.starts_at else null end,
           case when lb.status = 'completed' then lb.ends_at else null end,
           case when lb.status = 'active' then 'active' when lb.status = 'completed' then 'ended' else 'scheduled' end
      from lesson_bookings lb
     where lb.id = seed_data.lesson_id;

    update teacher_student_relationships tsr
       set last_lesson_at = greatest(tsr.last_lesson_at, (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id)),
           total_lessons = tsr.total_lessons + 1,
           updated_at = now()
     where tsr.teacher_profile_id = seed_data.teacher_profile_id
       and tsr.student_user_id = seed_data.student_user_id;

    if not found then
      insert into teacher_student_relationships (
        teacher_profile_id, teacher_user_id, student_user_id, first_lesson_at, last_lesson_at, total_lessons
      )
      values (
        seed_data.teacher_profile_id, seed_data.teacher_user_id, seed_data.student_user_id,
        (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id),
        (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id),
        1
      );
    end if;

    insert into lesson_notes (lesson_booking_id, author_user_id, visibility, body, created_at)
    values
      (seed_data.lesson_id, seed_data.teacher_user_id, 'shared', 'Shared note: practice the repaired sentence three times before the next lesson.', now() - interval '2 hours'),
      (seed_data.lesson_id, seed_data.teacher_user_id, 'teacher_private', 'Private note: student responds well to roleplay before correction.', now() - interval '90 minutes'),
      (seed_data.lesson_id, seed_data.student_user_id, 'shared', 'Student note: save the travel phrase and shadow it after review.', now() - interval '1 hour');

    insert into teacher_private_notes (teacher_user_id, student_user_id, lesson_booking_id, body, created_at)
    values (seed_data.teacher_user_id, seed_data.student_user_id, seed_data.lesson_id, 'Seeded CRM-style note: prefers gentle pacing and concrete examples.', now() - interval '80 minutes');

    if idx <= 18 then
      insert into teacher_reviews (teacher_profile_id, lesson_booking_id, student_user_id, rating, body, created_at)
      values (
        seed_data.teacher_profile_id,
        seed_data.lesson_id,
        seed_data.student_user_id,
        4 + (idx % 2),
        'Clear corrections, useful notes, and a friendly classroom pace.',
        now() - interval '30 minutes'
      );

      insert into lesson_coin_reward_suggestions (
        lesson_booking_id, suggested_by_user_id, recipient_user_id, amount, reason, status
      )
      values (
        seed_data.lesson_id,
        seed_data.teacher_user_id,
        seed_data.student_user_id,
        10 + (idx % 9) * 5,
        'Great lesson participation and review follow-through.',
        case when idx % 4 = 0 then 'approved' else 'pending' end
      );

      insert into teacher_payouts (teacher_user_id, lesson_booking_id, amount_usd, status, stripe_transfer_id)
      select lb.teacher_user_id,
             lb.id,
             lb.teacher_payout_usd,
             case when idx % 5 = 0 then 'pending' else 'paid' end,
             case when idx % 5 = 0 then null else 'tr_seed_' || idx end
        from lesson_bookings lb
       where lb.id = seed_data.lesson_id;
    end if;

    insert into direct_conversations (
      participant_one, participant_two, conversation_type, teacher_profile_id, lesson_booking_id, created_at, updated_at
    )
    values (seed_data.teacher_user_id, seed_data.student_user_id, 'teacher_student', seed_data.teacher_profile_id, seed_data.lesson_id, now() - interval '2 days', now() - interval '30 minutes')
    on conflict do nothing;

    select id into conversation_id
      from direct_conversations
     where least(participant_one::text, participant_two::text) = least(seed_data.teacher_user_id::text, seed_data.student_user_id::text)
       and greatest(participant_one::text, participant_two::text) = greatest(seed_data.teacher_user_id::text, seed_data.student_user_id::text)
     limit 1;

    update direct_conversations
       set conversation_type = 'teacher_student',
           teacher_profile_id = coalesce(seed_data.teacher_profile_id, direct_conversations.teacher_profile_id),
           lesson_booking_id = coalesce(seed_data.lesson_id, direct_conversations.lesson_booking_id),
           updated_at = now() - interval '30 minutes'
     where id = seed_data.conversation_id;

    insert into direct_messages (
      conversation_id, sender_id, recipient_id, body, coin_amount, message_context, read_at, created_at
    )
    values
      (seed_data.conversation_id, seed_data.student_user_id, seed_data.teacher_user_id, 'Hi, I booked this because I want help turning story sentences into speaking practice.', 0, 'teacher_student', now() - interval '45 minutes', now() - interval '2 days'),
      (seed_data.conversation_id, seed_data.teacher_user_id, seed_data.student_user_id, 'Perfect. Bring one sentence you want to use naturally, and we will repair it together.', 0, 'teacher_student', now() - interval '20 minutes', now() - interval '1 day'),
      (seed_data.conversation_id, seed_data.student_user_id, seed_data.teacher_user_id, 'Got it. I will bring a travel sentence and a shadowing question.', 0, 'teacher_student', null, now() - interval '30 minutes');
  end loop;
end $$;

commit;
