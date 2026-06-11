create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text unique not null,
  password_hash text not null,
  avatar text,
  avatar_url text,
  avatar_box_file_id text,
  bio text,
  native_language text,
  target_language text not null,
  current_level text default 'A1',
  current_streak integer default 0,
  longest_streak integer default 0,
  listening_time integer default 0,
  shadowing_time integer default 0,
  created_at timestamptz default now()
);

create table if not exists supported_languages (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table if exists users
  add column if not exists avatar_url text;

alter table if exists users
  add column if not exists avatar_box_file_id text;

create table if not exists user_languages (
  user_id uuid not null references users(id) on delete cascade,
  language text not null,
  current_level text default 'A1',
  current_streak integer default 0,
  longest_streak integer default 0,
  listening_time integer default 0,
  shadowing_time integer default 0,
  profile_visibility text default 'Private' check (profile_visibility in ('Public', 'Private')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, language)
);

alter table if exists user_languages
  add column if not exists profile_visibility text default 'Private';

insert into user_languages (
  user_id,
  language,
  current_level,
  current_streak,
  longest_streak,
  listening_time,
  shadowing_time,
  profile_visibility,
  active
)
select
  id,
  target_language,
  current_level,
  current_streak,
  longest_streak,
  listening_time,
  shadowing_time,
  'Private',
  true
from users
where target_language is not null
on conflict (user_id, language) do nothing;

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists wallets (
  user_id uuid primary key references users(id) on delete cascade,
  balance integer default 0 check (balance >= 0),
  lifetime_earned integer default 0 check (lifetime_earned >= 0),
  lifetime_spent integer default 0 check (lifetime_spent >= 0),
  daily_earned integer default 0 check (daily_earned >= 0),
  weekly_earned integer default 0 check (weekly_earned >= 0)
);

create table if not exists coin_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text unique not null,
  label text unique not null,
  amount integer not null,
  rule_type text not null check (rule_type in ('earn', 'spend')),
  trigger_event text,
  active boolean default true,
  created_at timestamptz default now()
);

alter table if exists coin_rules
  add column if not exists rule_key text;

alter table if exists coin_rules
  add column if not exists active boolean default true;

alter table if exists coin_rules
  add column if not exists trigger_event text;

create table if not exists coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  coin_rule_id uuid references coin_rules(id) on delete set null,
  amount integer not null,
  label text not null,
  created_at timestamptz default now()
);

alter table if exists coin_transactions
  add column if not exists coin_rule_id uuid;

do $$
begin
  alter table coin_transactions
    add constraint coin_transactions_coin_rule_id_fkey
    foreign key (coin_rule_id) references coin_rules(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create table if not exists sentences (
  id uuid primary key default gen_random_uuid(),
  source_language text not null default 'English',
  target_language text not null default 'Japanese',
  target text not null,
  translation text not null,
  romanization text,
  audio_url text,
  image_url text,
  video_url text,
  level text not null,
  topic text not null,
  difficulty integer default 1 check (difficulty between 1 and 5),
  notes text,
  source text,
  variations jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_sentence_reviews (
  user_id uuid references users(id) on delete cascade,
  sentence_id uuid references sentences(id) on delete cascade,
  state text default 'New' check (state in ('New', 'Learning', 'Review', 'Mastered')),
  due_date date default current_date,
  last_rating text check (last_rating is null or last_rating in ('Again', 'Hard', 'Good', 'Easy')),
  saved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, sentence_id)
);

create table if not exists sentence_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  deck_kind text not null default 'User' check (deck_kind in ('System', 'User')),
  name text not null,
  description text,
  coins integer not null default 0 check (coins >= 0),
  level text not null default 'A1' check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  visibility text not null default 'Private' check (visibility in ('Private', 'Public')),
  source_language text not null default 'English',
  target_language text not null default 'Japanese',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((deck_kind = 'System' and user_id is null and visibility = 'Public') or (deck_kind = 'User' and user_id is not null))
);

create table if not exists sentence_deck_topics (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references sentence_decks(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sentence_deck_items (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references sentence_decks(id) on delete cascade,
  topic_id uuid references sentence_deck_topics(id) on delete cascade,
  sentence_id uuid not null references sentences(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (deck_id, sentence_id)
);

create table if not exists user_sentence_review_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deck_id uuid references sentence_decks(id) on delete cascade,
  topic_id uuid references sentence_deck_topics(id) on delete set null,
  sentence_item_id uuid references sentence_deck_items(id) on delete cascade,
  sentence_id uuid references sentences(id) on delete cascade,
  response text not null check (response in ('show_again', 'hard', 'easy', 'known')),
  reviewed_at timestamptz not null default now()
);

create table if not exists story_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

insert into story_categories (name, slug, sort_order)
values
  ('Travel', 'travel', 10),
  ('Workplace', 'workplace', 20)
on conflict (slug) do nothing;

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references story_categories(id) on delete set null,
  source_language text not null,
  topic text not null,
  image_path_file_id text,
  audio_url text,
  video_url text,
  unlock_cost integer default 20 check (unlock_cost >= 0),
  reward_coins integer default 15 check (reward_coins >= 0),
  created_at timestamptz default now()
);

create table if not exists story_translations (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  target_language text not null,
  level text not null,
  title text not null,
  text text not null,
  source_text text,
  romanization text,
  reading_time text,
  highlights jsonb default '[]'::jsonb,
  key_sentences jsonb default '[]'::jsonb,
  key_words jsonb default '[]'::jsonb,
  grammar_points jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique (story_id, target_language, level)
);

alter table if exists stories
  add column if not exists category_id uuid references story_categories(id) on delete set null;

alter table if exists stories
  add column if not exists source_language text;

update stories
   set source_language = 'English'
 where source_language is null;

alter table if exists stories
  alter column source_language set not null;

alter table if exists stories
  add column if not exists image_path_file_id text;

alter table if exists stories
  add column if not exists video_url text;

update stories
   set category_id = story_categories.id
  from story_categories
 where stories.category_id is null
   and lower(stories.topic) = lower(story_categories.name);

create table if not exists user_story_states (
  user_id uuid references users(id) on delete cascade,
  story_id uuid references stories(id) on delete cascade,
  unlocked boolean default false,
  completed boolean default false,
  liked boolean default false,
  favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, story_id)
);

alter table if exists user_story_states
  add column if not exists liked boolean default false,
  add column if not exists favorite boolean default false;

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  goal_scope text not null default 'Language' check (goal_scope in ('Global', 'Language')),
  target_language text,
  title text not null,
  type text not null,
  target integer not null check (target > 0),
  progress integer default 0 check (progress >= 0),
  visibility text default 'Public' check (visibility in ('Public', 'Private')),
  reward integer default 25 check (reward >= 0),
  completed boolean default false,
  due_date date not null default (current_date + 30),
  created_at timestamptz default now()
);

create table if not exists goal_supports (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  supporter_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  amount integer not null check (amount > 0),
  message text,
  created_at timestamptz default now(),
  check (supporter_id <> recipient_id)
);

create table if not exists goal_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  target integer not null check (target > 0),
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  body text not null,
  target_language text,
  image_path_file_id text,
  image_thumb_path_file_id text,
  sentence_id uuid references sentences(id) on delete set null,
  story_id uuid references stories(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  created_at timestamptz default now()
);

alter table if exists posts
  add column if not exists target_language text;

alter table if exists posts
  add column if not exists image_path_file_id text;

alter table if exists posts
  add column if not exists image_thumb_path_file_id text;

alter table if exists posts
  add column if not exists sentence_id uuid references sentences(id) on delete set null;

alter table if exists posts
  add column if not exists story_id uuid references stories(id) on delete set null;

alter table if exists posts
  add column if not exists goal_id uuid references goals(id) on delete set null;

create table if not exists post_likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

delete from post_likes pl
using posts p
where p.id = pl.post_id
  and p.user_id = pl.user_id;

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  check (char_length(body) <= 255)
);

alter table if exists post_comments
  drop constraint if exists post_comments_body_255_check;

alter table if exists post_comments
  add constraint post_comments_body_255_check check (char_length(body) <= 255);

create table if not exists post_views (
  post_id uuid references posts(id) on delete cascade,
  viewer_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, viewer_id)
);

create table if not exists post_appreciations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  amount integer not null check (amount > 0),
  message text,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id)
);

alter table if exists post_appreciations
  add column if not exists message text;

create table if not exists saved_posts (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table if not exists story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_comment_id uuid references story_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  check (body <> '')
);

create table if not exists user_follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists direct_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references users(id) on delete cascade,
  participant_two uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (participant_one <> participant_two)
);

create unique index if not exists idx_direct_conversations_pair_unique
  on direct_conversations (
    least(participant_one::text, participant_two::text),
    greatest(participant_one::text, participant_two::text)
  );

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references direct_conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  body text not null,
  coin_amount integer not null default 1 check (coin_amount = 1),
  read_at timestamptz,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id),
  check (body <> ''),
  check (char_length(body) <= 1000)
);

create table if not exists learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_language text not null default 'Japanese',
  description text,
  level text,
  unlocks_advanced_content boolean default true,
  created_at timestamptz default now()
);

create table if not exists learning_path_items (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references learning_paths(id) on delete cascade,
  label text not null,
  sort_order integer default 1
);

create table if not exists user_learning_path_progress (
  user_id uuid references users(id) on delete cascade,
  path_id uuid references learning_paths(id) on delete cascade,
  progress integer default 0 check (progress between 0 and 100),
  updated_at timestamptz default now(),
  primary key (user_id, path_id)
);

alter table if exists sentences
  add column if not exists source_language text not null default 'English';

alter table if exists sentences
  add column if not exists target_language text not null default 'Japanese';

alter table if exists sentences
  add column if not exists image_url text;

alter table if exists sentences
  add column if not exists video_url text;

alter table if exists sentences
  add column if not exists updated_at timestamptz default now();

alter table if exists sentence_decks
  add column if not exists deck_kind text not null default 'User';

alter table if exists sentence_decks
  add column if not exists source_language text not null default 'English';

alter table if exists sentence_decks
  add column if not exists target_language text not null default 'Japanese';

alter table if exists sentence_decks
  add column if not exists image_url text;

alter table if exists sentence_decks
  drop constraint if exists sentence_decks_deck_kind_check;

update sentence_decks
   set deck_kind = 'User'
 where deck_kind is null
    or deck_kind not in ('System', 'User');

alter table if exists sentence_decks
  add constraint sentence_decks_deck_kind_check check (deck_kind in ('System', 'User'));

alter table if exists sentence_decks
  drop constraint if exists sentence_decks_kind_owner_check;

alter table if exists sentence_decks
  add constraint sentence_decks_kind_owner_check check (
    (deck_kind = 'System' and user_id is null and visibility = 'Public')
    or (deck_kind = 'User' and user_id is not null)
  );

do $$
begin
  if to_regclass('public.sentence_packs') is not null then
    execute $migrate_sentence_packs$
      insert into sentence_decks (
        deck_kind,
        name,
        description,
        coins,
        level,
        visibility,
        source_language,
        target_language,
        created_at,
        updated_at
      )
      select
        'System',
        p.title,
        'Official LinguaStories learning material.',
        greatest(count(s.id)::int * 10, 0),
        coalesce(min(p.level), 'A1'),
        'Public',
        'English',
        p.target_language,
        min(p.created_at),
        now()
      from sentence_packs p
      left join sentences s on s.pack_id = p.id
      where not exists (
        select 1
          from sentence_decks d
         where d.deck_kind = 'System'
           and d.name = p.title
           and d.target_language = p.target_language
      )
      group by p.id, p.title, p.target_language
    $migrate_sentence_packs$;

    execute $migrate_sentence_pack_items$
      insert into sentence_deck_items (deck_id, sentence_id, sort_order)
      select d.id,
             s.id,
             row_number() over (partition by d.id order by s.created_at, s.id)::int
        from sentence_packs p
        join sentence_decks d
          on d.deck_kind = 'System'
         and d.name = p.title
         and d.target_language = p.target_language
        join sentences s on s.pack_id = p.id
       where not exists (
         select 1
           from sentence_deck_items i
          where i.deck_id = d.id
            and i.sentence_id = s.id
       )
    $migrate_sentence_pack_items$;

    alter table sentences drop constraint if exists sentences_pack_id_fkey;
    alter table sentences drop column if exists pack_id;
    drop table if exists sentence_packs cascade;
  end if;
end $$;

alter table if exists stories
  add column if not exists source_language text;

update stories
   set source_language = 'English'
 where source_language is null;

alter table if exists stories
  alter column source_language set not null;

create table if not exists story_translations (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories(id) on delete cascade,
  target_language text not null,
  level text not null,
  title text not null,
  text text not null,
  source_text text,
  romanization text,
  reading_time text,
  highlights jsonb default '[]'::jsonb,
  key_sentences jsonb default '[]'::jsonb,
  key_words jsonb default '[]'::jsonb,
  grammar_points jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique (story_id, target_language, level)
);

do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_name = 'stories'
       and column_name = 'target_language'
  ) then
    execute $migrate_base$
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
        id,
        target_language,
        level,
        title,
        text,
        translation,
        reading_time,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb
      from stories
      where target_language is not null
      on conflict (story_id, target_language, level) do update
      set title = excluded.title,
          text = excluded.text,
          source_text = excluded.source_text,
          reading_time = excluded.reading_time,
          highlights = excluded.highlights,
          key_sentences = excluded.key_sentences,
          key_words = excluded.key_words,
          grammar_points = excluded.grammar_points
    $migrate_base$;

    execute $migrate_levels$
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
        s.target_language,
        versions.level,
        coalesce(versions.content ->> 'title', s.title),
        coalesce(versions.content ->> 'text', s.text),
        coalesce(versions.content ->> 'translation', s.translation),
        coalesce(versions.content ->> 'readingTime', s.reading_time),
        coalesce(versions.content -> 'highlights', '[]'::jsonb),
        coalesce(versions.content -> 'keySentences', '[]'::jsonb),
        coalesce(versions.content -> 'keyWords', versions.content -> 'highlights', '[]'::jsonb),
        coalesce(versions.content -> 'grammarPoints', '[]'::jsonb)
      from stories s
      cross join lateral jsonb_each(coalesce(s.level_versions, '{}'::jsonb)) as versions(level, content)
      where s.target_language is not null
        and coalesce(versions.content ->> 'text', '') <> ''
      on conflict (story_id, target_language, level) do update
      set title = excluded.title,
          text = excluded.text,
          source_text = excluded.source_text,
          reading_time = excluded.reading_time,
          highlights = excluded.highlights,
          key_sentences = excluded.key_sentences,
          key_words = excluded.key_words,
          grammar_points = excluded.grammar_points
    $migrate_levels$;

    drop index if exists idx_stories_language;
    alter table stories drop column target_language;
  end if;
end $$;

alter table if exists stories
  drop column if exists level;

alter table if exists stories
  drop column if exists highlights;

alter table if exists stories
  drop column if exists key_sentences;

alter table if exists stories
  drop column if exists key_words;

alter table if exists stories
  drop column if exists grammar_points;

alter table if exists stories
  drop column if exists image_url;

alter table if exists stories
  drop column if exists text;

alter table if exists stories
  drop column if exists translation;

alter table if exists stories
  drop column if exists reading_time;

alter table if exists stories
  drop column if exists level_versions;

alter table if exists goals
  add column if not exists target_language text;

alter table if exists goals
  alter column target_language drop not null;

alter table if exists goals
  add column if not exists goal_scope text not null default 'Language';

alter table if exists goals
  add column if not exists due_date date;

update goals
   set due_date = current_date + 30
 where due_date is null;

alter table if exists goals
  alter column due_date set not null;

alter table if exists goals
  drop constraint if exists goals_goal_scope_check;

update goals
   set goal_scope = case when target_language is null then 'Global' else 'Language' end
 where goal_scope is null
    or goal_scope not in ('Global', 'Language');

alter table if exists goals
  add constraint goals_goal_scope_check check (goal_scope in ('Global', 'Language'));

alter table if exists goals
  drop constraint if exists goals_scope_language_check;

alter table if exists goals
  add constraint goals_scope_language_check check (
    (goal_scope = 'Global' and target_language is null)
    or (goal_scope = 'Language' and target_language is not null)
  );

alter table if exists learning_paths
  add column if not exists target_language text not null default 'Japanese';


create index if not exists idx_coin_transactions_user_created on coin_transactions (user_id, created_at desc);
create index if not exists idx_coin_transactions_rule on coin_transactions (coin_rule_id);
create index if not exists idx_coin_rules_key on coin_rules (rule_key);
create unique index if not exists idx_coin_rules_rule_key_unique on coin_rules (rule_key);
create index if not exists idx_coin_rules_trigger_event on coin_rules (trigger_event);
insert into coin_rules (rule_key, label, amount, rule_type, trigger_event)
values ('follow_learner', 'Follow Learner', 1, 'earn', 'learner_followed')
on conflict (rule_key) do update
set label = excluded.label,
    amount = excluded.amount,
    rule_type = excluded.rule_type,
    trigger_event = excluded.trigger_event,
    active = true;
insert into coin_rules (rule_key, label, amount, rule_type, trigger_event)
values
  ('sentence_deck_completed', 'Sentence Deck Completed', 10, 'earn', 'sentence_deck_completed'),
  ('receive_like', 'Receive Like', 1, 'earn', 'moment_liked'),
  ('receive_comment', 'Receive Comment', 1, 'earn', 'moment_commented'),
  ('moment_appreciation_sent', 'Moment Appreciation Sent', -1, 'spend', 'moment_appreciation_sent'),
  ('moment_appreciation_received', 'Moment Appreciation Received', 1, 'earn', 'moment_appreciation_received')
on conflict (rule_key) do update
set label = excluded.label,
    amount = excluded.amount,
    rule_type = excluded.rule_type,
    trigger_event = excluded.trigger_event,
    active = true;

update coin_rules
   set active = false
 where rule_key = 'sentence_pack_completed';
create index if not exists idx_user_sessions_hash on user_sessions (token_hash);
create index if not exists idx_user_sessions_expires on user_sessions (expires_at);
drop index if exists idx_sentences_pack;
create index if not exists idx_sentences_language on sentences (target_language);
create index if not exists idx_reviews_user_due on user_sentence_reviews (user_id, due_date);
create index if not exists idx_stories_category on stories (category_id);
create index if not exists idx_story_translations_story_language on story_translations (story_id, target_language);
create index if not exists idx_story_translations_language_level on story_translations (target_language, level);
create index if not exists idx_story_states_user on user_story_states (user_id);
create index if not exists idx_goals_user on goals (user_id);
create index if not exists idx_goals_user_scope on goals (user_id, goal_scope);
create index if not exists idx_goals_user_language on goals (user_id, target_language);
create index if not exists idx_goal_supports_goal on goal_supports (goal_id, created_at desc);
create index if not exists idx_goal_supports_supporter on goal_supports (supporter_id, created_at desc);
create index if not exists idx_goal_supports_recipient on goal_supports (recipient_id, created_at desc);
create index if not exists idx_posts_created on posts (created_at desc);
create index if not exists idx_posts_story on posts (story_id, created_at desc);
create index if not exists idx_posts_goal on posts (goal_id);
create index if not exists idx_posts_sentence on posts (sentence_id);
create index if not exists idx_post_appreciations_post on post_appreciations (post_id, created_at desc);
create index if not exists idx_post_appreciations_sender on post_appreciations (sender_id, created_at desc);
create index if not exists idx_post_appreciations_recipient on post_appreciations (recipient_id, created_at desc);
create index if not exists idx_story_comments_story on story_comments (story_id, created_at);
create index if not exists idx_story_comments_parent on story_comments (parent_comment_id);
create index if not exists idx_user_follows_follower on user_follows (follower_id);
create index if not exists idx_user_follows_following on user_follows (following_id);
create index if not exists idx_user_languages_user on user_languages (user_id);
create index if not exists idx_direct_conversations_participant_one on direct_conversations (participant_one, updated_at desc);
create index if not exists idx_direct_conversations_participant_two on direct_conversations (participant_two, updated_at desc);
create index if not exists idx_direct_messages_conversation_created on direct_messages (conversation_id, created_at asc);
create index if not exists idx_direct_messages_recipient_unread on direct_messages (recipient_id, read_at);
