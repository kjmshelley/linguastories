create extension if not exists pgcrypto;

drop table if exists
  user_sentence_review_results,
  user_saved_sentence_decks,
  sentence_deck_items,
  sentence_deck_topics,
  sentence_decks,
  user_sentence_reviews,
  sentences,
  story_comments,
  user_story_states,
  story_translations,
  stories,
  story_categories,
  user_learning_path_progress,
  learning_path_items,
  learning_paths,
  goal_supports,
  goal_templates,
  goals,
  voice_video_room_coin_transactions,
  lesson_coin_reward_suggestions,
  post_appreciations,
  coin_transactions,
  coin_rules,
  wallets
cascade;

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
  timezone text not null default 'UTC',
  site_language text not null default 'en-US',
  currency text not null default 'USD',
  current_streak integer default 0,
  longest_streak integer default 0,
  listening_time integer default 0,
  learner_subscription_tier text not null default 'free' check (learner_subscription_tier in ('free')),
  learner_subscription_status text not null default 'active' check (learner_subscription_status in ('active', 'past_due', 'canceled', 'incomplete')),
  created_at timestamptz default now()
);

create table if not exists supported_languages (
  code text unique,
  name text unique not null,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table if exists supported_languages
  add column if not exists code text;

update supported_languages
   set code = case name
     when 'Arabic' then 'ar-SA'
     when 'Dutch' then 'nl-NL'
     when 'English' then 'en-US'
     when 'French' then 'fr-FR'
     when 'German' then 'de-DE'
     when 'Hindi' then 'hi-IN'
     when 'Indonesian' then 'id-ID'
     when 'Italian' then 'it-IT'
     when 'Japanese' then 'ja-JP'
     when 'Korean' then 'ko-KR'
     when 'Mandarin Chinese' then 'zh-CN'
     when 'Polish' then 'pl-PL'
     when 'Portuguese' then 'pt-PT'
     when 'Russian' then 'ru-RU'
     when 'Spanish' then 'es-ES'
     when 'Swedish' then 'sv-SE'
     when 'Thai' then 'th-TH'
     when 'Turkish' then 'tr-TR'
     when 'Vietnamese' then 'vi-VN'
     else code
   end
 where code is null;

do $$
begin
  alter table supported_languages
    add constraint supported_languages_code_key unique (code);
exception
  when duplicate_object or duplicate_table then null;
end $$;

insert into supported_languages (code, name, sort_order, active)
values
  ('af', 'Afrikaans', 1, true),
  ('sq', 'Albanian', 2, true),
  ('am', 'Amharic', 3, true),
  ('ar-SA', 'Arabic', 4, true),
  ('hy', 'Armenian', 5, true),
  ('az', 'Azerbaijani', 6, true),
  ('eu', 'Basque', 7, true),
  ('be', 'Belarusian', 8, true),
  ('bn', 'Bengali', 9, true),
  ('bs', 'Bosnian', 10, true),
  ('bg', 'Bulgarian', 11, true),
  ('my', 'Burmese', 12, true),
  ('ca', 'Catalan', 13, true),
  ('ceb', 'Cebuano', 14, true),
  ('zh-CN', 'Chinese', 15, true),
  ('hr', 'Croatian', 16, true),
  ('cs', 'Czech', 17, true),
  ('da', 'Danish', 18, true),
  ('nl-NL', 'Dutch', 19, true),
  ('en-US', 'English', 20, true),
  ('eo', 'Esperanto', 21, true),
  ('et', 'Estonian', 22, true),
  ('fil', 'Filipino', 23, true),
  ('fi', 'Finnish', 24, true),
  ('fr-FR', 'French', 25, true),
  ('gl', 'Galician', 26, true),
  ('ka', 'Georgian', 27, true),
  ('de-DE', 'German', 28, true),
  ('el', 'Greek', 29, true),
  ('gu', 'Gujarati', 30, true),
  ('ht', 'Haitian Creole', 31, true),
  ('ha', 'Hausa', 32, true),
  ('he', 'Hebrew', 33, true),
  ('hi-IN', 'Hindi', 34, true),
  ('hmn', 'Hmong', 35, true),
  ('hu', 'Hungarian', 36, true),
  ('is', 'Icelandic', 37, true),
  ('ig', 'Igbo', 38, true),
  ('id-ID', 'Indonesian', 39, true),
  ('ga', 'Irish', 40, true),
  ('it-IT', 'Italian', 41, true),
  ('ja-JP', 'Japanese', 42, true),
  ('jv', 'Javanese', 43, true),
  ('kn', 'Kannada', 44, true),
  ('kk', 'Kazakh', 45, true),
  ('km', 'Khmer', 46, true),
  ('ko-KR', 'Korean', 47, true),
  ('ku', 'Kurdish', 48, true),
  ('ky', 'Kyrgyz', 49, true),
  ('lo', 'Lao', 50, true),
  ('la', 'Latin', 51, true),
  ('lv', 'Latvian', 52, true),
  ('lt', 'Lithuanian', 53, true),
  ('lb', 'Luxembourgish', 54, true),
  ('mk', 'Macedonian', 55, true),
  ('mg', 'Malagasy', 56, true),
  ('ms', 'Malay', 57, true),
  ('ml', 'Malayalam', 58, true),
  ('mt', 'Maltese', 59, true),
  ('mi', 'Maori', 60, true),
  ('mr', 'Marathi', 61, true),
  ('mn', 'Mongolian', 62, true),
  ('ne', 'Nepali', 63, true),
  ('no', 'Norwegian', 64, true),
  ('ny', 'Nyanja', 65, true),
  ('ps', 'Pashto', 66, true),
  ('fa', 'Persian', 67, true),
  ('pl-PL', 'Polish', 68, true),
  ('pt-PT', 'Portuguese', 69, true),
  ('pa', 'Punjabi', 70, true),
  ('ro', 'Romanian', 71, true),
  ('ru-RU', 'Russian', 72, true),
  ('sm', 'Samoan', 73, true),
  ('gd', 'Scottish Gaelic', 74, true),
  ('sr', 'Serbian', 75, true),
  ('st', 'Sesotho', 76, true),
  ('sn', 'Shona', 77, true),
  ('sd', 'Sindhi', 78, true),
  ('si', 'Sinhala', 79, true),
  ('sk', 'Slovak', 80, true),
  ('sl', 'Slovenian', 81, true),
  ('so', 'Somali', 82, true),
  ('es-ES', 'Spanish', 83, true),
  ('su', 'Sundanese', 84, true),
  ('sw', 'Swahili', 85, true),
  ('sv-SE', 'Swedish', 86, true),
  ('tg', 'Tajik', 87, true),
  ('ta', 'Tamil', 88, true),
  ('te', 'Telugu', 89, true),
  ('th-TH', 'Thai', 90, true),
  ('tr-TR', 'Turkish', 91, true),
  ('uk-UA', 'Ukrainian', 92, true),
  ('ur', 'Urdu', 93, true),
  ('uz', 'Uzbek', 94, true),
  ('vi-VN', 'Vietnamese', 95, true),
  ('cy', 'Welsh', 96, true),
  ('xh', 'Xhosa', 97, true),
  ('yi', 'Yiddish', 98, true),
  ('yo', 'Yoruba', 99, true),
  ('zu', 'Zulu', 100, true),
  ('ak', 'Akan', 101, true),
  ('as', 'Assamese', 102, true),
  ('ay', 'Aymara', 103, true),
  ('bm', 'Bambara', 104, true),
  ('bho', 'Bhojpuri', 105, true),
  ('co', 'Corsican', 106, true),
  ('dv', 'Divehi', 107, true),
  ('ee', 'Ewe', 108, true),
  ('fy', 'Frisian', 109, true),
  ('rw', 'Kinyarwanda', 110, true)
on conflict (code) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    active = true;

do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('users', 'native_language'),
      ('users', 'target_language'),
      ('user_languages', 'language'),
      ('posts', 'target_language'),
      ('teacher_profiles', 'native_language'),
      ('teacher_profile_languages', 'language'),
      ('lesson_bookings', 'target_language'),
      ('lesson_templates', 'target_language'),
      ('voice_video_rooms', 'target_language'),
      ('voice_video_rooms', 'source_language')
    ) as language_columns(table_name, column_name)
  loop
    if exists (
      select 1
        from information_schema.columns
       where table_schema = 'public'
         and table_name = target.table_name
         and column_name = target.column_name
    ) then
      execute format(
        $sql$
          update %I
             set %I = case %I
               when 'en-GB' then 'en-US'
               when 'en-AU' then 'en-US'
               when 'es-MX' then 'es-ES'
               when 'zh-TW' then 'zh-CN'
               when 'fr-BE' then 'fr-FR'
               else %I
             end
           where %I in ('en-GB', 'en-AU', 'es-MX', 'zh-TW', 'fr-BE')
        $sql$,
        target.table_name,
        target.column_name,
        target.column_name,
        target.column_name,
        target.column_name
      );
    end if;
  end loop;
end $$;

delete from supported_languages
 where code is null
    or code not in (
      'af', 'sq', 'am', 'ar-SA', 'hy', 'az', 'eu', 'be', 'bn', 'bs',
      'bg', 'my', 'ca', 'ceb', 'zh-CN', 'hr', 'cs', 'da', 'nl-NL', 'en-US',
      'eo', 'et', 'fil', 'fi', 'fr-FR', 'gl', 'ka', 'de-DE', 'el', 'gu',
      'ht', 'ha', 'he', 'hi-IN', 'hmn', 'hu', 'is', 'ig', 'id-ID', 'ga',
      'it-IT', 'ja-JP', 'jv', 'kn', 'kk', 'km', 'ko-KR', 'ku', 'ky', 'lo',
      'la', 'lv', 'lt', 'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi',
      'mr', 'mn', 'ne', 'no', 'ny', 'ps', 'fa', 'pl-PL', 'pt-PT', 'pa',
      'ro', 'ru-RU', 'sm', 'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk',
      'sl', 'so', 'es-ES', 'su', 'sw', 'sv-SE', 'tg', 'ta', 'te', 'th-TH',
      'tr-TR', 'uk-UA', 'ur', 'uz', 'vi-VN', 'cy', 'xh', 'yi', 'yo', 'zu',
      'ak', 'as', 'ay', 'bm', 'bho', 'co', 'dv', 'ee', 'fy', 'rw'
    );

alter table if exists supported_languages
  alter column code set not null;

alter table if exists users
  add column if not exists avatar_url text;

alter table if exists users
  add column if not exists avatar_box_file_id text;

alter table if exists users
  add column if not exists learner_subscription_tier text not null default 'free';

alter table if exists users
  add column if not exists learner_subscription_status text not null default 'active';

alter table if exists users
  add column if not exists timezone text not null default 'UTC';

alter table if exists users
  add column if not exists site_language text not null default 'en-US';

alter table if exists users
  add column if not exists currency text not null default 'USD';

alter table if exists users
  drop column if exists shadowing_time;

alter table if exists users
  drop constraint if exists users_learner_subscription_tier_check;

update users
   set learner_subscription_tier = 'free'
 where learner_subscription_tier <> 'free';

alter table if exists users
  add constraint users_learner_subscription_tier_check check (learner_subscription_tier in ('free'));

alter table if exists users
  drop constraint if exists users_learner_subscription_status_check;

alter table if exists users
  add constraint users_learner_subscription_status_check check (learner_subscription_status in ('active', 'past_due', 'canceled', 'incomplete'));

create table if not exists user_languages (
  user_id uuid not null references users(id) on delete cascade,
  language text not null,
  current_level text default 'A1',
  current_streak integer default 0,
  longest_streak integer default 0,
  listening_time integer default 0,
  profile_visibility text default 'Private' check (profile_visibility in ('Public', 'Private')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, language)
);

alter table if exists user_languages
  add column if not exists profile_visibility text default 'Private';

alter table if exists user_languages
  drop column if exists shadowing_time;

insert into user_languages (
  user_id,
  language,
  current_level,
  current_streak,
  longest_streak,
  listening_time,
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

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  body text not null,
  target_language text,
  image_path_file_id text,
  image_thumb_path_file_id text,
  created_at timestamptz default now()
);

alter table if exists posts
  add column if not exists target_language text;

alter table if exists posts
  add column if not exists image_path_file_id text;

alter table if exists posts
  add column if not exists image_thumb_path_file_id text;

alter table if exists posts
  drop column if exists sentence_id;

alter table if exists posts
  drop column if exists story_id;

alter table if exists posts
  drop column if exists goal_id;

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

drop table if exists saved_posts;
drop table if exists post_views;

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
  read_at timestamptz,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id),
  check (body <> ''),
  check (char_length(body) <= 1000)
);

alter table if exists direct_messages
  drop column if exists coin_amount;

create table if not exists teacher_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text unique not null check (plan_key in ('teacher')),
  name text not null,
  monthly_price_usd numeric(10, 2) not null check (monthly_price_usd >= 0),
  stripe_price_id text,
  can_create_group_lessons boolean not null default false,
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table if exists teacher_subscription_plans
  drop constraint if exists teacher_subscription_plans_plan_key_check;

insert into teacher_subscription_plans (plan_key, name, monthly_price_usd, can_create_group_lessons)
values
  ('teacher', 'Teacher', 0, false)
on conflict (plan_key) do update
set name = excluded.name,
    monthly_price_usd = excluded.monthly_price_usd,
    can_create_group_lessons = excluded.can_create_group_lessons,
    active = true;

create table if not exists teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  headline text not null,
  bio text not null,
  teaching_style text,
  experience_summary text,
  certifications text,
  native_language text not null,
  timezone text not null default 'UTC',
  country text,
  professional_tutor boolean not null default true,
  speaking_practice_only boolean not null default false,
  hourly_rate_usd numeric(10, 2) not null check (hourly_rate_usd >= 1),
  trial_rate_usd numeric(10, 2) check (trial_rate_usd is null or trial_rate_usd >= 0),
  min_lesson_minutes integer not null default 30 check (min_lesson_minutes in (15, 30, 45, 60, 90)),
  max_lesson_minutes integer not null default 60 check (max_lesson_minutes in (15, 30, 45, 60, 90)),
  group_lesson_enabled boolean not null default false,
  group_max_students integer not null default 1 check (group_max_students between 1 and 8),
  video_intro_url text,
  video_provider text check (video_provider in ('youtube', 'vimeo')),
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (char_length(display_name) between 2 and 120),
  check (char_length(headline) between 3 and 160),
  check (char_length(bio) between 20 and 3000),
  check (max_lesson_minutes >= min_lesson_minutes)
);

alter table if exists teacher_profiles
  drop column if exists image_url,
  drop column if exists image_file_id;

alter table if exists teacher_profiles
  drop column if exists city;

create table if not exists teacher_profile_languages (
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  language text not null,
  role text not null check (role in ('teaches', 'speaks')),
  cefr_level text check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native')),
  primary key (teacher_profile_id, language, role)
);

create table if not exists teacher_profile_tags (
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  tag text not null,
  primary key (teacher_profile_id, tag)
);

create table if not exists teacher_lesson_settings (
  teacher_profile_id uuid primary key references teacher_profiles(id) on delete cascade,
  trial_enabled boolean not null default true,
  one_on_one_enabled boolean not null default true,
  group_enabled boolean not null default false,
  supported_durations integer[] not null default array[30, 60],
  buffer_minutes integer not null default 10 check (buffer_minutes between 0 and 120),
  advance_notice_hours integer not null default 12 check (advance_notice_hours between 0 and 720),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists teacher_booking_rules (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id) on delete cascade,
  teacher_profile_id uuid references teacher_profiles(id) on delete cascade,
  min_booking_notice_minutes integer not null default 720 check (min_booking_notice_minutes between 0 and 43200),
  max_advance_booking_days integer not null default 30 check (max_advance_booking_days between 1 and 365),
  buffer_before_minutes integer not null default 10 check (buffer_before_minutes between 0 and 240),
  buffer_after_minutes integer not null default 10 check (buffer_after_minutes between 0 and 240),
  cancellation_cutoff_minutes integer not null default 720 check (cancellation_cutoff_minutes between 0 and 43200),
  reschedule_cutoff_minutes integer not null default 720 check (reschedule_cutoff_minutes between 0 and 43200),
  supported_durations integer[] not null default array[30, 60],
  auto_confirm_bookings boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (teacher_profile_id)
);

create table if not exists teacher_availability_rules (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'UTC',
  active boolean not null default true,
  created_at timestamptz default now(),
  check (end_time > start_time)
);

create table if not exists teacher_unavailable_blocks (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  teacher_user_id uuid references users(id) on delete cascade,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  reason text,
  is_full_day boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (ends_at > starts_at)
);

create table if not exists teacher_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_key text not null references teacher_subscription_plans(plan_key),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_teacher_subscriptions_user_active
  on teacher_subscriptions (user_id)
  where status in ('active', 'past_due', 'incomplete');

update teacher_subscriptions set plan_key = 'teacher' where plan_key <> 'teacher';

delete from teacher_subscription_plans where plan_key <> 'teacher';

alter table if exists teacher_subscription_plans
  drop constraint if exists teacher_subscription_plans_plan_key_check;

alter table if exists teacher_subscription_plans
  add constraint teacher_subscription_plans_plan_key_check check (plan_key in ('teacher'));

create table if not exists lesson_bookings (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  teacher_user_id uuid not null references users(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  lesson_type text not null default 'one_on_one' check (lesson_type in ('trial', 'one_on_one', 'group')),
  title text not null,
  target_language text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes in (15, 30, 45, 60, 90)),
  max_students integer not null default 1 check (max_students between 1 and 8),
  status text not null default 'pending_payment' check (status in ('pending_payment', 'confirmed', 'pending_teacher_approval', 'cancelled_by_student', 'cancelled_by_teacher', 'reschedule_requested', 'rescheduled', 'active', 'completed', 'no_show_student', 'no_show_teacher', 'expired_payment', 'failed_payment', 'canceled', 'no_show')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  lesson_price_usd numeric(10, 2) not null check (lesson_price_usd >= 0),
  platform_fee_usd numeric(10, 2) not null default 0.50 check (platform_fee_usd = 0.50),
  total_student_charge_usd numeric(10, 2) not null check (total_student_charge_usd >= 0.50),
  teacher_payout_usd numeric(10, 2) not null check (teacher_payout_usd >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  payment_expires_at timestamptz,
  cancel_reason text,
  cancelled_at timestamptz,
  cancelled_by_user_id uuid references users(id) on delete set null,
  refund_status text check (refund_status in ('none', 'pending_manual_review', 'refunded', 'not_required')),
  livekit_room_name text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (teacher_user_id <> student_user_id),
  check (ends_at > starts_at)
);

create table if not exists teacher_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null unique references users(id) on delete cascade,
  stripe_account_id text unique,
  onboarding_complete boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  requirements_due text[] not null default '{}',
  disabled_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_teacher_payout_accounts_teacher_user_id
  on teacher_payout_accounts(teacher_user_id);

alter table if exists lesson_bookings
  drop constraint if exists lesson_bookings_status_check;

alter table if exists lesson_bookings
  add constraint lesson_bookings_status_check check (status in (
    'pending_payment',
    'confirmed',
    'pending_teacher_approval',
    'cancelled_by_student',
    'cancelled_by_teacher',
    'reschedule_requested',
    'rescheduled',
    'active',
    'completed',
    'no_show_student',
    'no_show_teacher',
    'expired_payment',
    'failed_payment',
    'canceled',
    'no_show'
  ));

alter table if exists lesson_bookings
  add column if not exists payment_expires_at timestamptz;

alter table if exists lesson_bookings
  add column if not exists cancel_reason text;

alter table if exists lesson_bookings
  add column if not exists cancelled_at timestamptz;

alter table if exists lesson_bookings
  add column if not exists cancelled_by_user_id uuid references users(id) on delete set null;

alter table if exists lesson_bookings
  add column if not exists refund_status text check (refund_status in ('none', 'pending_manual_review', 'refunded', 'not_required'));

create table if not exists lesson_reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lesson_bookings(id) on delete cascade,
  requested_by_user_id uuid not null references users(id) on delete cascade,
  proposed_start_time timestamptz not null,
  proposed_end_time timestamptz not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  responded_by_user_id uuid references users(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (proposed_end_time > proposed_start_time)
);

create table if not exists lesson_participants (
  id uuid primary key default gen_random_uuid(),
  lesson_booking_id uuid not null references lesson_bookings(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz default now(),
  unique (lesson_booking_id, user_id)
);

create table if not exists lesson_payments (
  id uuid primary key default gen_random_uuid(),
  lesson_booking_id uuid not null references lesson_bookings(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  teacher_user_id uuid not null references users(id) on delete cascade,
  lesson_price_usd numeric(10, 2) not null,
  platform_fee_usd numeric(10, 2) not null default 0.50 check (platform_fee_usd = 0.50),
  total_student_charge_usd numeric(10, 2) not null,
  teacher_payout_usd numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists classroom_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_booking_id uuid not null references lesson_bookings(id) on delete cascade,
  livekit_room_name text not null unique,
  started_by_user_id uuid references users(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'ended', 'expired')),
  created_at timestamptz default now()
);

create table if not exists teacher_student_relationships (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  teacher_user_id uuid not null references users(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  first_lesson_at timestamptz,
  last_lesson_at timestamptz,
  total_lessons integer not null default 0 check (total_lessons >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (teacher_profile_id, student_user_id),
  check (teacher_user_id <> student_user_id)
);

create table if not exists teacher_private_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  lesson_booking_id uuid references lesson_bookings(id) on delete set null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (char_length(body) between 1 and 4000)
);

create table if not exists lesson_notes (
  id uuid primary key default gen_random_uuid(),
  lesson_booking_id uuid not null references lesson_bookings(id) on delete cascade,
  author_user_id uuid not null references users(id) on delete cascade,
  visibility text not null default 'shared' check (visibility in ('shared', 'teacher_private')),
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (char_length(body) between 1 and 4000)
);

create table if not exists teacher_resources (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id) on delete cascade,
  teacher_profile_id uuid references teacher_profiles(id) on delete cascade,
  title text not null,
  resource_type text not null default 'link' check (resource_type in ('link', 'text')),
  url text,
  body text,
  visibility text not null default 'teacher_only' check (visibility in ('teacher_only', 'lesson_students')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lesson_templates (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id) on delete cascade,
  teacher_profile_id uuid references teacher_profiles(id) on delete cascade,
  title text not null,
  target_language text,
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native')),
  lesson_type text not null default 'one_on_one' check (lesson_type in ('trial', 'one_on_one', 'group')),
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists lesson_templates
  drop constraint if exists lesson_templates_level_check;

alter table if exists lesson_templates
  add constraint lesson_templates_level_check check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'));

create table if not exists lesson_template_resources (
  lesson_template_id uuid not null references lesson_templates(id) on delete cascade,
  teacher_resource_id uuid not null references teacher_resources(id) on delete cascade,
  primary key (lesson_template_id, teacher_resource_id)
);

create table if not exists teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references teacher_profiles(id) on delete cascade,
  lesson_booking_id uuid references lesson_bookings(id) on delete set null,
  student_user_id uuid not null references users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz default now(),
  unique (teacher_profile_id, lesson_booking_id, student_user_id)
);

create table if not exists teacher_payouts (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id) on delete cascade,
  lesson_booking_id uuid references lesson_bookings(id) on delete set null,
  amount_usd numeric(10, 2) not null check (amount_usd >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_transfer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists direct_conversations
  add column if not exists conversation_type text not null default 'community'
    check (conversation_type in ('teacher_student', 'community_follower', 'community'));

alter table if exists direct_conversations
  add column if not exists teacher_profile_id uuid references teacher_profiles(id) on delete set null;

alter table if exists direct_conversations
  add column if not exists lesson_booking_id uuid references lesson_bookings(id) on delete set null;

alter table if exists direct_messages
  add column if not exists message_context text not null default 'community'
    check (message_context in ('teacher_student', 'community_follower', 'community'));

alter table if exists teacher_unavailable_blocks
  add column if not exists teacher_user_id uuid references users(id) on delete cascade;

alter table if exists teacher_unavailable_blocks
  add column if not exists title text;

alter table if exists teacher_unavailable_blocks
  add column if not exists timezone text not null default 'UTC';

alter table if exists teacher_unavailable_blocks
  add column if not exists is_full_day boolean not null default false;

alter table if exists teacher_unavailable_blocks
  add column if not exists updated_at timestamptz default now();

update teacher_unavailable_blocks tub
   set teacher_user_id = tp.user_id,
       timezone = coalesce(nullif(tub.timezone, ''), tp.timezone),
       title = coalesce(nullif(tub.title, ''), tub.reason, 'Unavailable')
  from teacher_profiles tp
 where tp.id = tub.teacher_profile_id
   and tub.teacher_user_id is null;

insert into teacher_booking_rules (
  teacher_user_id,
  teacher_profile_id,
  min_booking_notice_minutes,
  max_advance_booking_days,
  buffer_before_minutes,
  buffer_after_minutes,
  supported_durations
)
select tp.user_id,
       tp.id,
       coalesce(tls.advance_notice_hours, 12) * 60,
       30,
       coalesce(tls.buffer_minutes, 10),
       coalesce(tls.buffer_minutes, 10),
       coalesce(tls.supported_durations, array[tp.min_lesson_minutes, tp.max_lesson_minutes])
  from teacher_profiles tp
  left join teacher_lesson_settings tls on tls.teacher_profile_id = tp.id
on conflict (teacher_profile_id) do nothing;

create index if not exists idx_teacher_profiles_user on teacher_profiles (user_id, status);
create index if not exists idx_teacher_profiles_status_rate on teacher_profiles (status, hourly_rate_usd);
create index if not exists idx_teacher_profile_languages_language on teacher_profile_languages (language, role);
create index if not exists idx_teacher_availability_profile on teacher_availability_rules (teacher_profile_id, weekday);
create index if not exists idx_teacher_booking_rules_profile on teacher_booking_rules (teacher_profile_id);
create index if not exists idx_teacher_unavailable_profile_time on teacher_unavailable_blocks (teacher_profile_id, starts_at, ends_at);
create index if not exists idx_lesson_bookings_student on lesson_bookings (student_user_id, starts_at desc);
create index if not exists idx_lesson_bookings_teacher on lesson_bookings (teacher_user_id, starts_at desc);
create index if not exists idx_lesson_bookings_status on lesson_bookings (status, starts_at);
create index if not exists idx_lesson_reschedule_lesson_status on lesson_reschedule_requests (lesson_id, status);
create index if not exists idx_classroom_sessions_booking on classroom_sessions (lesson_booking_id);
create index if not exists idx_teacher_students_teacher on teacher_student_relationships (teacher_user_id, updated_at desc);
create index if not exists idx_teacher_private_notes_teacher_student on teacher_private_notes (teacher_user_id, student_user_id, updated_at desc);
create index if not exists idx_lesson_notes_booking on lesson_notes (lesson_booking_id, created_at desc);
create index if not exists idx_direct_conversations_context on direct_conversations (conversation_type, teacher_profile_id, lesson_booking_id);

-- Combined voice/video room schema

create table if not exists voice_video_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  room_type text not null check (room_type in ('voice', 'video')),
  target_language text not null default 'ja-JP',
  source_language text not null default 'en-US',
  cefr_level text not null default 'A1' check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native')),
  max_participants integer not null default 4 check (max_participants between 2 and 4),
  is_private boolean not null default false,
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled')),
  livekit_room_name text unique not null,
  image_url text,
  image_file_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists voice_video_room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references voice_video_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'participant' check (role in ('host', 'participant')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  status text not null default 'joined' check (status in ('joined', 'left', 'kicked', 'timed_out')),
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_voice_video_active_participant
  on voice_video_room_participants (room_id, user_id)
  where status = 'joined';

create table if not exists voice_video_room_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references voice_video_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  participant_id uuid references voice_video_room_participants(id) on delete set null,
  livekit_identity text unique not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0 and duration_seconds <= 360),
  billed_minutes integer not null default 0 check (billed_minutes >= 0 and billed_minutes <= 6),
  status text not null default 'active' check (status in ('active', 'completed', 'timed_out', 'disconnected', 'failed')),
  created_at timestamptz not null default now()
);

alter table if exists voice_video_rooms
  drop constraint if exists voice_video_rooms_cefr_level_check;

alter table if exists voice_video_rooms
  add constraint voice_video_rooms_cefr_level_check check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'));

create unique index if not exists uniq_voice_video_active_session
  on voice_video_room_sessions (user_id)
  where status = 'active';

create index if not exists idx_voice_video_rooms_active
  on voice_video_rooms (status, created_at desc);

create index if not exists idx_voice_video_rooms_filters
  on voice_video_rooms (target_language, source_language, cefr_level, room_type)
  where status = 'active' and is_private = false;

create index if not exists idx_voice_video_room_sessions_user_created
  on voice_video_room_sessions (user_id, created_at desc);

alter table if exists voice_video_rooms
  alter column max_participants set default 4;

alter table if exists voice_video_rooms
  add column if not exists started_at timestamptz;

update voice_video_rooms
   set max_participants = 4
 where max_participants > 4;

do $$
begin
  alter table voice_video_rooms
    drop constraint if exists voice_video_rooms_max_participants_check;
  alter table voice_video_rooms
    add constraint voice_video_rooms_max_participants_check
    check (max_participants between 2 and 4);
end $$;

-- Account subscription and billing lifecycle schema

create table if not exists subscription_tiers (
  tier_key text primary key,
  name text not null,
  monthly_price_usd numeric(10, 2) not null check (monthly_price_usd >= 0),
  yearly_price_usd numeric(10, 2) not null check (yearly_price_usd >= 0),
  trial_eligible boolean not null default false,
  trial_length_days integer not null default 0 check (trial_length_days >= 0 and trial_length_days <= 365),
  permissions jsonb not null default '[]'::jsonb check (jsonb_typeof(permissions) = 'array'),
  feature_flags jsonb not null default '{}'::jsonb check (jsonb_typeof(feature_flags) = 'object'),
  account_type text not null check (account_type in ('learner', 'teacher')),
  signup_visible boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  payment_provider_price_id_monthly text,
  payment_provider_price_id_yearly text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into subscription_tiers (
  tier_key, name, monthly_price_usd, yearly_price_usd, trial_eligible, trial_length_days,
  permissions, feature_flags, account_type, signup_visible, sort_order
)
values
  (
    'free', 'Free Membership', 0, 0, false, 0,
    '["voice_video_rooms","connect","community_posts","find_teacher","my_schedule","practice"]'::jsonb,
    '{"dashboard":true,"connect":true,"communityPosts":true,"voiceVideoRooms":true,"findTeacher":true,"mySchedule":true,"practice":true,"maxLanguageProfiles":10,"canEditLanguageProfiles":true,"canDeleteLanguageProfiles":true,"teacherWorkspace":false,"groupLessons":false}'::jsonb,
    'learner', true, 10
  ),
  (
    'teacher', 'Teacher', 0, 0, false, 0,
    '["voice_video_rooms","teacher_workspace","teacher_profile","connect","community_posts","find_teacher","my_schedule","practice","language_profiles"]'::jsonb,
    '{"dashboard":true,"connect":true,"communityPosts":true,"voiceVideoRooms":true,"findTeacher":true,"mySchedule":true,"practice":true,"maxLanguageProfiles":null,"canEditLanguageProfiles":true,"canDeleteLanguageProfiles":true,"teacherWorkspace":true,"groupLessons":false}'::jsonb,
    'teacher', true, 20
  )
on conflict (tier_key) do update
set name = excluded.name,
    monthly_price_usd = excluded.monthly_price_usd,
    yearly_price_usd = excluded.yearly_price_usd,
    trial_eligible = excluded.trial_eligible,
    trial_length_days = excluded.trial_length_days,
    permissions = excluded.permissions,
    feature_flags = excluded.feature_flags,
    account_type = excluded.account_type,
    signup_visible = excluded.signup_visible,
    sort_order = excluded.sort_order,
    active = true,
    updated_at = now();

create table if not exists user_accounts (
  user_id uuid primary key references users(id) on delete cascade,
  subscription_tier text not null references subscription_tiers(tier_key),
  account_state text not null check (account_state in ('active', 'trialing', 'trial_cancelled', 'past_due', 'deactivated', 'canceled')),
  billing_status text not null check (billing_status in ('none', 'trialing', 'active', 'past_due', 'payment_required', 'canceled', 'deactivated')),
  subscription_status text not null check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  renewal_date timestamptz,
  cancellation_date timestamptz,
  payment_provider_customer_id text,
  payment_provider_subscription_id text unique,
  payment_provider_payment_method_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((account_state in ('trialing', 'trial_cancelled')) = (trial_start_date is not null and trial_end_date is not null)),
  check (trial_end_date is null or trial_start_date is null or trial_end_date > trial_start_date)
);

create index if not exists idx_user_accounts_tier on user_accounts (subscription_tier);
create index if not exists idx_user_accounts_state on user_accounts (account_state, billing_status);
create index if not exists idx_user_accounts_trial_end on user_accounts (trial_end_date) where account_state in ('trialing', 'trial_cancelled');
create index if not exists idx_user_accounts_renewal on user_accounts (renewal_date) where subscription_status = 'active';
create index if not exists idx_user_accounts_provider_customer on user_accounts (payment_provider_customer_id);

update user_accounts
   set subscription_tier = coalesce((
     select case when st.account_type = 'teacher' then 'teacher' else 'free' end
       from subscription_tiers st
      where st.tier_key = user_accounts.subscription_tier
   ), 'free'),
       updated_at = now()
 where subscription_tier not in ('free', 'teacher');

delete from subscription_tiers
 where tier_key not in ('free', 'teacher');

create table if not exists account_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists idx_account_events_user_created on account_events (user_id, created_at desc);
create index if not exists idx_account_events_type_created on account_events (event_type, created_at desc);

create table if not exists billing_webhook_events (
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  primary key (provider, provider_event_id)
);

create table if not exists billing_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_payment_method_id text not null,
  brand text,
  last4 text,
  exp_month integer check (exp_month is null or exp_month between 1 and 12),
  exp_year integer check (exp_year is null or exp_year >= 2000),
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_method_id)
);

create unique index if not exists idx_billing_payment_methods_default
  on billing_payment_methods (user_id)
  where is_default = true and status = 'active';

create table if not exists billing_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_invoice_id text,
  amount_due_usd numeric(10, 2) not null default 0 check (amount_due_usd >= 0),
  amount_paid_usd numeric(10, 2) not null default 0 check (amount_paid_usd >= 0),
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible', 'refunded')),
  hosted_invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_invoice_id)
);

create index if not exists idx_billing_invoices_user_created on billing_invoices (user_id, created_at desc);

create table if not exists account_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  tone text not null default 'neutral' check (tone in ('neutral', 'good', 'urgent')),
  email_queued boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_account_notifications_user_created on account_notifications (user_id, created_at desc);

create table if not exists email_notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  notification_id uuid references account_notifications(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

insert into user_accounts (
  user_id, subscription_tier, account_state, billing_status, subscription_status,
  subscription_start_date, created_at, updated_at
)
select
  u.id,
  'free',
  case when coalesce(u.learner_subscription_status, 'active') = 'past_due' then 'past_due' else 'active' end,
  case when coalesce(u.learner_subscription_status, 'active') = 'past_due' then 'past_due' else 'none' end,
  case when coalesce(u.learner_subscription_status, 'active') = 'past_due' then 'past_due' else 'none' end,
  u.created_at,
  u.created_at,
  now()
from users u
on conflict (user_id) do nothing;

do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('users', 'native_language'),
      ('users', 'target_language'),
      ('user_languages', 'language'),
      ('posts', 'target_language'),
      ('teacher_profiles', 'native_language'),
      ('teacher_profile_languages', 'language'),
      ('lesson_bookings', 'target_language'),
      ('lesson_templates', 'target_language'),
      ('voice_video_rooms', 'target_language'),
      ('voice_video_rooms', 'source_language')
    ) as language_columns(table_name, column_name)
  loop
    if exists (
      select 1
        from information_schema.columns
       where table_schema = 'public'
         and table_name = target.table_name
         and column_name = target.column_name
    ) then
      execute format(
        $sql$
          update %I
             set %I = case %I
               when 'Arabic' then 'ar-SA'
               when 'Dutch' then 'nl-NL'
               when 'English' then 'en-US'
               when 'French' then 'fr-FR'
               when 'German' then 'de-DE'
               when 'Hindi' then 'hi-IN'
               when 'Indonesian' then 'id-ID'
               when 'Italian' then 'it-IT'
               when 'Japanese' then 'ja-JP'
               when 'Korean' then 'ko-KR'
               when 'Mandarin Chinese' then 'zh-CN'
               when 'Polish' then 'pl-PL'
               when 'Portuguese' then 'pt-PT'
               when 'Russian' then 'ru-RU'
               when 'Spanish' then 'es-ES'
               when 'Swedish' then 'sv-SE'
               when 'Thai' then 'th-TH'
               when 'Turkish' then 'tr-TR'
               when 'Vietnamese' then 'vi-VN'
               else %I
             end
           where %I in (
             'Arabic', 'Dutch', 'English', 'French', 'German', 'Hindi',
             'Indonesian', 'Italian', 'Japanese', 'Korean', 'Mandarin Chinese',
             'Polish', 'Portuguese', 'Russian', 'Spanish', 'Swedish', 'Thai',
             'Turkish', 'Vietnamese'
           )
        $sql$,
        target.table_name,
        target.column_name,
        target.column_name,
        target.column_name,
        target.column_name
      );
    end if;
  end loop;
end $$;

do $$
declare
  fk record;
begin
  for fk in
    select * from (values
      ('users', 'native_language', 'users_native_language_fkey'),
      ('users', 'target_language', 'users_target_language_fkey'),
      ('user_languages', 'language', 'user_languages_language_fkey'),
      ('posts', 'target_language', 'posts_target_language_fkey'),
      ('teacher_profiles', 'native_language', 'teacher_profiles_native_language_fkey'),
      ('teacher_profile_languages', 'language', 'teacher_profile_languages_language_fkey'),
      ('lesson_bookings', 'target_language', 'lesson_bookings_target_language_fkey'),
      ('lesson_templates', 'target_language', 'lesson_templates_target_language_fkey'),
      ('voice_video_rooms', 'target_language', 'voice_video_rooms_target_language_fkey'),
      ('voice_video_rooms', 'source_language', 'voice_video_rooms_source_language_fkey')
    ) as language_fks(table_name, column_name, constraint_name)
  loop
    if exists (
      select 1
        from information_schema.columns
       where table_schema = 'public'
         and table_name = fk.table_name
         and column_name = fk.column_name
    ) then
      begin
        execute format(
          'alter table %I add constraint %I foreign key (%I) references supported_languages(code) not valid',
          fk.table_name,
          fk.constraint_name,
          fk.column_name
        );
      exception
        when duplicate_object then null;
      end;
    end if;
  end loop;
end $$;
