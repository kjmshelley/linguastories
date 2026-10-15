create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text unique not null,
  password_hash text not null,
  avatar text,
  native_language text not null default 'en-US',
  target_language text not null default 'zh-TW',
  site_language text not null default 'en-US',
  created_at timestamptz not null default now()
);

alter table users add column if not exists avatar text;
alter table users add column if not exists native_language text not null default 'en-US';
alter table users add column if not exists target_language text not null default 'zh-TW';
alter table users add column if not exists site_language text not null default 'en-US';
alter table users add column if not exists created_at timestamptz not null default now();

create table if not exists supported_languages (
  code text primary key,
  name text unique not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table supported_languages add column if not exists code text;
alter table supported_languages add column if not exists active boolean not null default true;
alter table supported_languages add column if not exists sort_order integer not null default 0;
create unique index if not exists supported_languages_code_key on supported_languages (code);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx on user_sessions (user_id);
create index if not exists user_sessions_expires_at_idx on user_sessions (expires_at);
