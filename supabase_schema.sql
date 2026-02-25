-- GoTraining Supabase Schema
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 1. 用户资料表 (扩展 auth.users)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  email text not null default '',
  role text not null default 'user',
  last_login_at timestamptz,
  created_at timestamptz default now()
);

-- 2. 练习会话表
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  username text default '',
  mode text not null default '',
  started_at timestamptz default now(),
  ended_at timestamptz,
  problems_attempted jsonb default '[]'::jsonb,
  problems_solved jsonb default '[]'::jsonb,
  mistakes integer default 0,
  accuracy integer default 0
);

-- 3. 用户统计表
create table if not exists user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text default '',
  total_sessions integer default 0,
  total_attempted integer default 0,
  total_solved integer default 0,
  total_mistakes integer default 0,
  overall_accuracy integer default 0,
  mode_stats jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 4. RLS 策略 (行级安全)
alter table user_profiles enable row level security;
alter table practice_sessions enable row level security;
alter table user_stats enable row level security;

-- user_profiles: 用户只能读写自己的资料
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

-- practice_sessions: 用户只能操作自己的会话
create policy "Users can view own sessions" on practice_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on practice_sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on practice_sessions
  for update using (auth.uid() = user_id);

-- user_stats: 用户只能操作自己的统计
create policy "Users can view own stats" on user_stats
  for select using (auth.uid() = user_id);
create policy "Users can upsert own stats" on user_stats
  for insert with check (auth.uid() = user_id);
create policy "Users can update own stats" on user_stats
  for update using (auth.uid() = user_id);

-- 5. 索引
create index if not exists idx_sessions_user_id on practice_sessions(user_id);
create index if not exists idx_sessions_started_at on practice_sessions(started_at);
