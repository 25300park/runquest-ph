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

create index if not exists idx_courses_area on public.courses(area);
create index if not exists idx_course_points_course_id on public.course_points(course_id);
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_course_id on public.activities(course_id);
create index if not exists idx_characters_user_id on public.characters(user_id);
create index if not exists idx_character_stats_character_id on public.character_stats(character_id);
create index if not exists idx_character_equipment_character_id on public.character_equipment(character_id);
create index if not exists idx_character_equipment_item_id on public.character_equipment(item_id);

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.course_points enable row level security;
alter table public.activities enable row level security;
alter table public.characters enable row level security;
alter table public.character_stats enable row level security;
alter table public.equipment_items enable row level security;
alter table public.character_equipment enable row level security;

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
