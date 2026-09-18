-- =====================================================
--  TIME ECHO PLATFORMER — supabase_schema.sql
--  Run this in your Supabase SQL editor (project > SQL)
-- =====================================================

-- ── Extensions ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text not null unique,
  coins            integer not null default 0,
  level_progress   integer not null default 1,
  pet              text,
  outfit           text not null default 'default',
  achievements     text not null default '[]',       -- JSON array of achievement ids
  owned_pets       text not null default '[]',       -- JSON array of pet ids
  owned_outfits    text not null default '["default"]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ── Leaderboard ───────────────────────────────────
create table if not exists public.leaderboard (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  username      text not null,
  level_number  integer not null,        -- 0 = endless mode
  score         integer not null default 0,
  time_seconds  integer not null default 0,
  echoes_used   integer not null default 0,
  mode          text not null default 'campaign', -- 'campaign' | 'endless' | 'daily'
  created_at    timestamptz not null default now()
);

create index if not exists lb_level_score  on public.leaderboard (level_number, score desc);
create index if not exists lb_mode_score   on public.leaderboard (mode, score desc);
create index if not exists lb_user         on public.leaderboard (user_id);

-- ── RPC: get top scores per level ─────────────────
create or replace function public.get_level_leaderboard(
  p_level  integer,
  p_mode   text    default 'campaign',
  p_limit  integer default 10
)
returns table (
  rank         bigint,
  user_id      uuid,
  username     text,
  score        integer,
  time_seconds integer,
  echoes_used  integer,
  created_at   timestamptz
)
language sql stable as $$
  select
    row_number() over (order by score desc) as rank,
    user_id, username, score, time_seconds, echoes_used, created_at
  from public.leaderboard
  where level_number = p_level
    and mode = p_mode
  order by score desc
  limit p_limit;
$$;

-- ── RPC: personal best per level ──────────────────
create or replace function public.get_my_best(
  p_user_id uuid,
  p_mode    text default 'campaign'
)
returns table (
  level_number  integer,
  best_score    integer,
  best_time     integer
)
language sql stable as $$
  select
    level_number,
    max(score)        as best_score,
    min(time_seconds) as best_time
  from public.leaderboard
  where user_id = p_user_id
    and mode = p_mode
  group by level_number
  order by level_number;
$$;

-- ── Row-level security ─────────────────────────────
alter table public.profiles  enable row level security;
alter table public.leaderboard enable row level security;

-- Profiles: read all, write own
create policy "profiles_read_all"
  on public.profiles for select using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Leaderboard: read all, insert own, no update/delete
create policy "lb_read_all"
  on public.leaderboard for select using (true);

create policy "lb_insert_own"
  on public.leaderboard for insert
  with check (auth.uid() = user_id);

