create extension if not exists pgcrypto;

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan text not null,
  status text not null default 'active',
  amount integer not null default 0,
  cycle text not null default 'one_time',
  payapp_mul_no text,
  payapp_pay_state integer,
  started_at timestamptz default now(),
  trial_ends_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_email_created_at on subscriptions(email, created_at desc);

create table if not exists payment_logs (
  id uuid primary key default gen_random_uuid(),
  email text,
  plan text,
  amount integer,
  status text,
  payapp_mul_no text,
  payapp_pay_state integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  module_id text not null,
  lesson_id text not null,
  completed boolean not null default false,
  score integer,
  updated_at timestamptz not null default now(),
  unique(email, module_id, lesson_id)
);

create table if not exists roleplay_usage (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  used_date date not null,
  used_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(email, used_date)
);

alter table user_profiles enable row level security;
alter table subscriptions enable row level security;
alter table lesson_progress enable row level security;
alter table roleplay_usage enable row level security;

create policy if not exists "user_profiles_select_own" on user_profiles for select using (auth.jwt() ->> 'email' = email);
create policy if not exists "user_profiles_update_own" on user_profiles for update using (auth.jwt() ->> 'email' = email);
create policy if not exists "subscriptions_select_own" on subscriptions for select using (auth.jwt() ->> 'email' = email);
create policy if not exists "lesson_progress_select_own" on lesson_progress for select using (auth.jwt() ->> 'email' = email);
create policy if not exists "lesson_progress_upsert_own" on lesson_progress for insert with check (auth.jwt() ->> 'email' = email);
create policy if not exists "roleplay_usage_select_own" on roleplay_usage for select using (auth.jwt() ->> 'email' = email);
