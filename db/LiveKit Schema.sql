create table if not exists voice_video_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  room_type text not null check (room_type in ('voice', 'video')),
  target_language text not null default 'Japanese',
  source_language text not null default 'English',
  cefr_level text not null default 'A1' check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  max_participants integer not null default 4 check (max_participants between 2 and 8),
  is_private boolean not null default false,
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled')),
  livekit_room_name text unique not null,
  image_url text,
  image_file_id text,
  created_at timestamptz not null default now(),
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
  coins_charged integer not null default 0 check (coins_charged >= 0 and coins_charged <= 6000),
  status text not null default 'active' check (status in ('active', 'completed', 'timed_out', 'disconnected', 'failed')),
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_voice_video_active_session
  on voice_video_room_sessions (user_id)
  where status = 'active';

create table if not exists voice_video_room_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  room_id uuid not null references voice_video_rooms(id) on delete cascade,
  session_id uuid not null unique references voice_video_room_sessions(id) on delete cascade,
  coins integer not null check (coins > 0),
  transaction_type text not null default 'debit' check (transaction_type in ('debit')),
  reason text not null default 'voice_video_room_usage',
  created_at timestamptz not null default now()
);

create index if not exists idx_voice_video_rooms_active
  on voice_video_rooms (status, created_at desc);

create index if not exists idx_voice_video_rooms_filters
  on voice_video_rooms (target_language, source_language, cefr_level, room_type)
  where status = 'active' and is_private = false;

create index if not exists idx_voice_video_room_sessions_user_created
  on voice_video_room_sessions (user_id, created_at desc);

create index if not exists idx_voice_video_room_coin_transactions_user_created
  on voice_video_room_coin_transactions (user_id, created_at desc);
