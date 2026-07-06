create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  level int not null default 1,
  xp int not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null check (area in ('BGC', 'Makati', 'MOA')),
  difficulty text not null check (difficulty in ('Easy', 'Normal', 'Hard', 'Challenge')),
  distance float8 not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.course_points (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lat float8 not null,
  lng float8 not null,
  order_index int not null,
  type text not null check (type in ('start', 'checkpoint', 'finish'))
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  distance float8 not null default 0,
  duration int not null default 0,
  xp_earned int not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  level int not null default 1,
  xp int not null default 0,
  avatar_base_url text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.character_stats (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  total_distance float8 not null default 0,
  total_runs int not null default 0,
  total_xp int not null default 0,
  streak_days int not null default 0
);

create table if not exists public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('shoes', 'backpack', 'hat', 'accessory')),
  rarity text not null default 'common',
  speed_bonus float8 not null default 0,
  xp_bonus float8 not null default 0,
  image_url text
);

create table if not exists public.character_equipment (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  item_id uuid not null references public.equipment_items(id) on delete cascade,
  equipped boolean not null default false
);

create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  region text not null default 'Global' check (region in ('BGC', 'Makati', 'MOA', 'Global')),
  total_distance float8 not null default 0,
  total_xp int not null default 0,
  level int not null default 1,
  streak_bonus int not null default 0,
  weekly_score float8 not null default 0,
  week_start date not null default date_trunc('week', now())::date,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader_id uuid references public.users(id) on delete set null,
  shared_xp int not null default 0,
  total_distance float8 not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'officer', 'member')),
  contributed_xp int not null default 0,
  contributed_distance float8 not null default 0,
  joined_at timestamp with time zone not null default now()
);

create table if not exists public.guild_challenges (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  name text not null,
  target_distance float8 not null default 0,
  target_xp int not null default 0,
  progress_distance float8 not null default 0,
  progress_xp int not null default 0,
  starts_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone
);

create table if not exists public.item_ownership (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  item_id uuid not null references public.equipment_items(id) on delete cascade,
  serial_number int not null default 1,
  upgrade_level int not null default 0,
  trade_locked boolean not null default false,
  acquired_at timestamp with time zone not null default now()
);

create table if not exists public.item_drops (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete cascade,
  item_id uuid not null references public.equipment_items(id) on delete cascade,
  source text not null default 'run_reward',
  rarity_roll float8 not null default 0,
  created_at timestamp with time zone not null default now()
);

alter table public.leaderboard add column if not exists distance_total float8 not null default 0;
alter table public.leaderboard add column if not exists xp_total int not null default 0;
alter table public.guilds add column if not exists total_xp int not null default 0;
alter table public.guild_members add column if not exists contribution_score float8 not null default 0;
alter table public.equipment_items add column if not exists stamina_bonus float8 not null default 0;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('shoe', 'hat', 'backpack', 'accessory')),
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  xp_bonus float8 not null default 0,
  speed_bonus float8 not null default 0,
  stamina_bonus float8 not null default 0,
  image_url text
);

create table if not exists public.character_items (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  equipped boolean not null default false,
  upgrade_level int not null default 0,
  acquired_at timestamp with time zone not null default now()
);

create index if not exists idx_courses_area on public.courses(area);
create index if not exists idx_course_points_course_id on public.course_points(course_id);
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_course_id on public.activities(course_id);
create index if not exists idx_characters_user_id on public.characters(user_id);
create index if not exists idx_character_stats_character_id on public.character_stats(character_id);
create index if not exists idx_character_equipment_character_id on public.character_equipment(character_id);
create index if not exists idx_character_equipment_item_id on public.character_equipment(item_id);
create index if not exists idx_leaderboard_region_score on public.leaderboard(region, weekly_score desc);
create index if not exists idx_leaderboard_character_id on public.leaderboard(character_id);
create index if not exists idx_guild_members_guild_id on public.guild_members(guild_id);
create index if not exists idx_guild_members_character_id on public.guild_members(character_id);
create index if not exists idx_guild_challenges_guild_id on public.guild_challenges(guild_id);
create index if not exists idx_item_ownership_character_id on public.item_ownership(character_id);
create index if not exists idx_item_ownership_item_id on public.item_ownership(item_id);
create index if not exists idx_item_drops_character_id on public.item_drops(character_id);
create index if not exists idx_character_items_character_id on public.character_items(character_id);
create index if not exists idx_character_items_item_id on public.character_items(item_id);

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.course_points enable row level security;
alter table public.activities enable row level security;
alter table public.characters enable row level security;
alter table public.character_stats enable row level security;
alter table public.equipment_items enable row level security;
alter table public.character_equipment enable row level security;
alter table public.leaderboard enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_challenges enable row level security;
alter table public.item_ownership enable row level security;
alter table public.item_drops enable row level security;
alter table public.items enable row level security;
alter table public.character_items enable row level security;

drop policy if exists "Users are readable by everyone" on public.users;
create policy "Users are readable by everyone"
on public.users for select
using (true);

drop policy if exists "Courses are readable by everyone" on public.courses;
create policy "Courses are readable by everyone"
on public.courses for select
using (true);

drop policy if exists "Courses are insertable by everyone in prototype" on public.courses;
create policy "Courses are insertable by everyone in prototype"
on public.courses for insert
with check (true);

drop policy if exists "Course points are readable by everyone" on public.course_points;
create policy "Course points are readable by everyone"
on public.course_points for select
using (true);

drop policy if exists "Course points are insertable by everyone in prototype" on public.course_points;
create policy "Course points are insertable by everyone in prototype"
on public.course_points for insert
with check (true);

drop policy if exists "Activities are readable by everyone in prototype" on public.activities;
create policy "Activities are readable by everyone in prototype"
on public.activities for select
using (true);

drop policy if exists "Activities are insertable by everyone in prototype" on public.activities;
create policy "Activities are insertable by everyone in prototype"
on public.activities for insert
with check (true);

drop policy if exists "Characters are readable by everyone in prototype" on public.characters;
create policy "Characters are readable by everyone in prototype"
on public.characters for select
using (true);

drop policy if exists "Characters are insertable by everyone in prototype" on public.characters;
create policy "Characters are insertable by everyone in prototype"
on public.characters for insert
with check (true);

drop policy if exists "Characters are updateable by everyone in prototype" on public.characters;
create policy "Characters are updateable by everyone in prototype"
on public.characters for update
using (true)
with check (true);

drop policy if exists "Character stats are readable by everyone in prototype" on public.character_stats;
create policy "Character stats are readable by everyone in prototype"
on public.character_stats for select
using (true);

drop policy if exists "Character stats are insertable by everyone in prototype" on public.character_stats;
create policy "Character stats are insertable by everyone in prototype"
on public.character_stats for insert
with check (true);

drop policy if exists "Character stats are updateable by everyone in prototype" on public.character_stats;
create policy "Character stats are updateable by everyone in prototype"
on public.character_stats for update
using (true)
with check (true);

drop policy if exists "Equipment items are readable by everyone" on public.equipment_items;
create policy "Equipment items are readable by everyone"
on public.equipment_items for select
using (true);

drop policy if exists "Equipment items are insertable by everyone in prototype" on public.equipment_items;
create policy "Equipment items are insertable by everyone in prototype"
on public.equipment_items for insert
with check (true);

drop policy if exists "Character equipment is readable by everyone in prototype" on public.character_equipment;
create policy "Character equipment is readable by everyone in prototype"
on public.character_equipment for select
using (true);

drop policy if exists "Character equipment is insertable by everyone in prototype" on public.character_equipment;
create policy "Character equipment is insertable by everyone in prototype"
on public.character_equipment for insert
with check (true);

drop policy if exists "Character equipment is updateable by everyone in prototype" on public.character_equipment;
create policy "Character equipment is updateable by everyone in prototype"
on public.character_equipment for update
using (true)
with check (true);

drop policy if exists "Leaderboard is readable by everyone" on public.leaderboard;
create policy "Leaderboard is readable by everyone"
on public.leaderboard for select
using (true);

drop policy if exists "Leaderboard is writable by everyone in prototype" on public.leaderboard;
create policy "Leaderboard is writable by everyone in prototype"
on public.leaderboard for all
using (true)
with check (true);

drop policy if exists "Guilds are readable by everyone" on public.guilds;
create policy "Guilds are readable by everyone"
on public.guilds for select
using (true);

drop policy if exists "Guilds are writable by everyone in prototype" on public.guilds;
create policy "Guilds are writable by everyone in prototype"
on public.guilds for all
using (true)
with check (true);

drop policy if exists "Guild members are readable by everyone" on public.guild_members;
create policy "Guild members are readable by everyone"
on public.guild_members for select
using (true);

drop policy if exists "Guild members are writable by everyone in prototype" on public.guild_members;
create policy "Guild members are writable by everyone in prototype"
on public.guild_members for all
using (true)
with check (true);

drop policy if exists "Guild challenges are readable by everyone" on public.guild_challenges;
create policy "Guild challenges are readable by everyone"
on public.guild_challenges for select
using (true);

drop policy if exists "Guild challenges are writable by everyone in prototype" on public.guild_challenges;
create policy "Guild challenges are writable by everyone in prototype"
on public.guild_challenges for all
using (true)
with check (true);

drop policy if exists "Item ownership is readable by everyone" on public.item_ownership;
create policy "Item ownership is readable by everyone"
on public.item_ownership for select
using (true);

drop policy if exists "Item ownership is writable by everyone in prototype" on public.item_ownership;
create policy "Item ownership is writable by everyone in prototype"
on public.item_ownership for all
using (true)
with check (true);

drop policy if exists "Item drops are readable by everyone" on public.item_drops;
create policy "Item drops are readable by everyone"
on public.item_drops for select
using (true);

drop policy if exists "Item drops are insertable by everyone in prototype" on public.item_drops;
create policy "Item drops are insertable by everyone in prototype"
on public.item_drops for insert
with check (true);

drop policy if exists "Items are readable by everyone" on public.items;
create policy "Items are readable by everyone"
on public.items for select
using (true);

drop policy if exists "Items are writable by everyone in prototype" on public.items;
create policy "Items are writable by everyone in prototype"
on public.items for all
using (true)
with check (true);

drop policy if exists "Character items are readable by everyone" on public.character_items;
create policy "Character items are readable by everyone"
on public.character_items for select
using (true);

drop policy if exists "Character items are writable by everyone in prototype" on public.character_items;
create policy "Character items are writable by everyone in prototype"
on public.character_items for all
using (true)
with check (true);
