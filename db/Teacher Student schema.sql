create extension if not exists pgcrypto;

create table if not exists teacher_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text unique not null check (plan_key in ('starter', 'pro')),
  name text not null,
  monthly_price_usd numeric(10, 2) not null check (monthly_price_usd >= 0),
  stripe_price_id text,
  can_create_group_lessons boolean not null default false,
  active boolean not null default true,
  created_at timestamptz default now()
);

insert into teacher_subscription_plans (plan_key, name, monthly_price_usd, can_create_group_lessons)
values
  ('starter', 'Starter', 2.99, false),
  ('pro', 'Pro', 6.99, true)
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
  city text,
  hourly_rate_usd numeric(10, 2) not null check (hourly_rate_usd >= 1),
  trial_rate_usd numeric(10, 2) check (trial_rate_usd is null or trial_rate_usd >= 0),
  min_lesson_minutes integer not null default 30 check (min_lesson_minutes in (15, 30, 45, 60, 90)),
  max_lesson_minutes integer not null default 60 check (max_lesson_minutes in (15, 30, 45, 60, 90)),
  group_lesson_enabled boolean not null default false,
  group_max_students integer not null default 1 check (group_max_students between 1 and 8),
  video_intro_url text,
  video_provider text check (video_provider in ('youtube', 'vimeo')),
  image_url text,
  image_file_id text,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (char_length(display_name) between 2 and 120),
  check (char_length(headline) between 3 and 160),
  check (char_length(bio) between 20 and 3000),
  check (max_lesson_minutes >= min_lesson_minutes)
);

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
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  lesson_type text not null default 'one_on_one' check (lesson_type in ('trial', 'one_on_one', 'group')),
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table if not exists lesson_coin_reward_suggestions (
  id uuid primary key default gen_random_uuid(),
  lesson_booking_id uuid not null references lesson_bookings(id) on delete cascade,
  suggested_by_user_id uuid not null references users(id) on delete cascade,
  recipient_user_id uuid not null references users(id) on delete cascade,
  amount integer not null check (amount between 1 and 100),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  check (suggested_by_user_id <> recipient_user_id)
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
  drop constraint if exists direct_messages_coin_amount_check;

alter table if exists direct_messages
  add constraint direct_messages_coin_amount_check check (coin_amount >= 0);

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
