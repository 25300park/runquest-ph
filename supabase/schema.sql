create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  level int not null default 1,
  xp int not null default 0,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  subscription_type text not null default 'free' check (subscription_type in ('free', 'premium')),
  subscription_status text not null default 'free' check (subscription_status in ('free', 'pending', 'active', 'expired', 'canceled')),
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'premium_30_day')),
  premium_expires_at timestamp with time zone,
  payment_provider text,
  payment_customer_id text,
  payment_reference text,
  home_region text not null default 'Philippines' check (home_region in ('Philippines', 'Korea', 'Global')),
  referral_code text unique,
  referred_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null check (area in ('BGC', 'Makati', 'MOA')),
  difficulty text not null check (difficulty in ('Easy', 'Normal', 'Hard', 'Challenge')),
  distance float8 not null default 0,
  created_by uuid references public.users(id) on delete set null,
  status text not null default 'pending_review' check (status in ('draft', 'pending_review', 'approved', 'rejected', 'deleted')),
  verified boolean not null default false,
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
  status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
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
  total_xp int not null default 0,
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
  contribution_score float8 not null default 0,
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

create table if not exists public.guild_scores (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  week_start date not null default date_trunc('week', now())::date,
  total_xp int not null default 0,
  total_distance float8 not null default 0,
  rank_score float8 not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null references public.users(id) on delete cascade,
  referral_code text not null,
  reward_xp int not null default 100,
  status text not null default 'pending' check (status in ('pending', 'rewarded', 'blocked')),
  created_at timestamp with time zone not null default now(),
  unique (referred_user_id)
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
alter table public.equipment_items add column if not exists token_price int not null default 0;
alter table public.equipment_items add column if not exists drop_rate float8 not null default 0.05;
alter table public.users add column if not exists role text not null default 'user' check (role in ('admin', 'user'));
alter table public.users add column if not exists status text not null default 'active' check (status in ('active', 'suspended', 'banned'));
alter table public.users add column if not exists subscription_type text not null default 'free' check (subscription_type in ('free', 'premium'));
alter table public.users add column if not exists subscription_status text not null default 'free' check (subscription_status in ('free', 'pending', 'active', 'expired', 'canceled'));
alter table public.users add column if not exists subscription_plan text not null default 'free' check (subscription_plan in ('free', 'premium_30_day'));
alter table public.users add column if not exists premium_expires_at timestamp with time zone;
alter table public.users add column if not exists payment_provider text;
alter table public.users add column if not exists payment_customer_id text;
alter table public.users add column if not exists payment_reference text;
alter table public.users add column if not exists home_region text not null default 'Philippines' check (home_region in ('Philippines', 'Korea', 'Global'));
alter table public.users add column if not exists referral_code text unique;
alter table public.users add column if not exists referred_by uuid references public.users(id) on delete set null;
insert into public.users (id, email, name, role, status)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'name', 'RunQuest Admin'),
  'admin',
  'active'
from auth.users
where email = 'runner@runquest.ph'
on conflict (id) do update
set
  email = excluded.email,
  role = 'admin',
  status = 'active';
update public.users
set role = 'admin', status = 'active'
where email = 'runner@runquest.ph';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    case when new.email = 'runner@runquest.ph' then 'admin' else 'user' end,
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(public.users.name, excluded.name),
    role = case when excluded.email = 'runner@runquest.ph' then 'admin' else public.users.role end,
    status = case when excluded.email = 'runner@runquest.ph' then 'active' else public.users.status end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.courses add column if not exists status text not null default 'pending_review' check (status in ('draft', 'pending_review', 'approved', 'rejected', 'deleted'));
alter table public.courses add column if not exists verified boolean not null default false;
alter table public.characters add column if not exists status text not null default 'active' check (status in ('active', 'suspended', 'banned'));

create table if not exists public.admin_economy_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value float8 not null default 1,
  description text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value float8 not null default 1,
  description text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text,
  auth text,
  permission text not null default 'default' check (permission in ('default', 'granted', 'denied')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.migration_history (
  id uuid primary key default gen_random_uuid(),
  change_type text not null,
  executed_at timestamp with time zone not null default now(),
  status text not null default 'pending' check (status in ('pending', 'passed', 'failed', 'rolled_back')),
  details jsonb not null default '{}'::jsonb
);

insert into public.system_settings (setting_key, setting_value, description)
values
  ('xp_multiplier', 1, 'Global XP reward multiplier'),
  ('token_rate', 10, 'RunToken reward rate per km'),
  ('reward_curve', 1, 'Global reward curve tuning factor'),
  ('difficulty_balance', 1, 'AI economy difficulty balance factor')
on conflict (setting_key) do nothing;

insert into public.migration_history (change_type, status, details)
values (
  'launch_schema_baseline',
  'passed',
  jsonb_build_object('source', 'supabase/schema.sql', 'notes', 'Production launch baseline')
);

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

create table if not exists public.race_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  start_time timestamp with time zone not null default now(),
  status text not null default 'waiting' check (status in ('waiting', 'running', 'finished', 'cancelled')),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.race_participants (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.race_sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  distance float8 not null default 0,
  pace float8 not null default 0,
  position jsonb,
  finished_at timestamp with time zone
);

create table if not exists public.map_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coordinates jsonb not null default '[]'::jsonb,
  controlling_guild uuid references public.guilds(id) on delete set null,
  region text not null default 'Global'
);

create table if not exists public.zone_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  zone_id uuid not null references public.map_zones(id) on delete cascade,
  activity_score float8 not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone,
  active boolean not null default true
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete set null,
  name text not null,
  event_type text not null default 'weekly' check (event_type in ('weekly', 'monthly', 'guild', 'special')),
  xp_bonus_multiplier float8 not null default 1,
  starts_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone,
  active boolean not null default true
);

create table if not exists public.season_scores (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  total_xp int not null default 0,
  total_distance float8 not null default 0,
  rank_score float8 not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  payment_provider text not null default 'manual',
  payment_reference text,
  event_type text not null,
  plan text not null default 'free',
  status text not null default 'free',
  amount_cents int not null default 0,
  currency text not null default 'PHP',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.premium_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_date timestamp with time zone not null default now(),
  end_date timestamp with time zone not null,
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  payment_provider text not null check (payment_provider in ('paymongo', 'xendit', 'manual')),
  transaction_id text not null,
  created_at timestamp with time zone not null default now(),
  unique (payment_provider, transaction_id)
);

create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  source text not null default 'manual',
  amount_cents int not null default 0,
  currency text not null default 'PHP',
  event_type text not null,
  occurred_at timestamp with time zone not null default now()
);

create table if not exists public.payment_fraud_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  payment_provider text not null default 'manual',
  transaction_id text,
  fraud_score int not null default 0 check (fraud_score >= 0 and fraud_score <= 100),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  action text not null default 'allow' check (action in ('allow', 'review', 'block')),
  reasons jsonb not null default '[]'::jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.subscription_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  from_plan text not null default 'free',
  to_plan text not null,
  change_type text not null check (change_type in ('upgrade', 'downgrade', 'renewal', 'enterprise_upgrade')),
  effective_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.enterprise_accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  billing_email text,
  status text not null default 'active' check (status in ('active', 'overdue', 'suspended', 'cancelled')),
  seats int not null default 1,
  price_per_seat_cents int not null default 0,
  currency text not null default 'PHP',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.enterprise_users (
  id uuid primary key default gen_random_uuid(),
  enterprise_account_id uuid not null references public.enterprise_accounts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  joined_at timestamp with time zone not null default now(),
  unique (enterprise_account_id, user_id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  enterprise_account_id uuid references public.enterprise_accounts(id) on delete cascade,
  invoice_number text not null unique,
  amount_cents int not null default 0,
  currency text not null default 'PHP',
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'void', 'overdue')),
  due_date date,
  paid_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.ai_revenue_optimizations (
  id uuid primary key default gen_random_uuid(),
  segment text not null default 'all_users',
  input_hash text not null,
  churn_probability float8 not null default 0,
  conversion_rate float8 not null default 0,
  engagement_level text not null default 'medium' check (engagement_level in ('low', 'medium', 'high')),
  pricing_suggestion jsonb not null default '{}'::jsonb,
  discount_triggers jsonb not null default '[]'::jsonb,
  upgrade_prompts jsonb not null default '[]'::jsonb,
  retention_strategy text,
  expires_at timestamp with time zone not null default now() + interval '7 days',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.kpi_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  period text not null default 'daily' check (period in ('daily', 'weekly', 'monthly')),
  metrics jsonb not null default '{}'::jsonb,
  summary text,
  anomalies jsonb not null default '[]'::jsonb,
  source text not null default 'manual',
  created_at timestamp with time zone not null default now(),
  unique (report_date, period)
);

create table if not exists public.board_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  company_health_score int not null default 0 check (company_health_score >= 0 and company_health_score <= 100),
  revenue_trend jsonb not null default '{}'::jsonb,
  user_growth jsonb not null default '{}'::jsonb,
  risk_indicators jsonb not null default '[]'::jsonb,
  ai_insights jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  unique (report_date)
);

create table if not exists public.ai_business_strategies (
  id uuid primary key default gen_random_uuid(),
  strategy_week date not null,
  input_hash text not null,
  recommendations jsonb not null default '[]'::jsonb,
  pricing_adjustments jsonb not null default '{}'::jsonb,
  feature_priorities jsonb not null default '[]'::jsonb,
  growth_strategies jsonb not null default '[]'::jsonb,
  explainability jsonb not null default '{}'::jsonb,
  expires_at timestamp with time zone not null default now() + interval '7 days',
  created_at timestamp with time zone not null default now(),
  unique (strategy_week, input_hash)
);

create table if not exists public.company_valuations (
  id uuid primary key default gen_random_uuid(),
  valuation_date date not null,
  arr_cents int not null default 0,
  mrr_growth_rate float8 not null default 0,
  churn_rate float8 not null default 0,
  user_growth_rate float8 not null default 0,
  engagement_score float8 not null default 0,
  valuation_low_cents int not null default 0,
  valuation_high_cents int not null default 0,
  risk_adjusted_valuation_cents int not null default 0,
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  unique (valuation_date)
);

create table if not exists public.global_expansion_intelligence (
  id uuid primary key default gen_random_uuid(),
  report_month text not null,
  top_regions jsonb not null default '[]'::jsonb,
  recommended_next_market text,
  localization_readiness jsonb not null default '{}'::jsonb,
  demand_prediction jsonb not null default '{}'::jsonb,
  expansion_roadmap jsonb not null default '[]'::jsonb,
  expected_revenue_impact_cents int not null default 0,
  created_at timestamp with time zone not null default now(),
  unique (report_month)
);

create table if not exists public.ai_personalization_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  subscription_plan text not null default 'free',
  input_hash text not null,
  plan jsonb not null default '{}'::jsonb,
  expires_at timestamp with time zone not null default now() + interval '7 days',
  created_at timestamp with time zone not null default now()
);

create table if not exists public.leaderboard_global (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  region text not null default 'Global' check (region in ('Philippines', 'Korea', 'Global')),
  timezone text not null default 'UTC',
  total_distance float8 not null default 0,
  total_xp int not null default 0,
  level int not null default 1,
  weekly_score float8 not null default 0,
  season_score float8 not null default 0,
  week_start date not null default date_trunc('week', now())::date,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.leaderboard_region (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  region text not null check (region in ('Philippines', 'Korea')),
  timezone text not null default 'UTC',
  weekly_score float8 not null default 0,
  season_score float8 not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  campaign_type text not null check (campaign_type in ('inactivity', 'milestone', 'leaderboard', 'weekly_summary')),
  channel text not null default 'push' check (channel in ('push', 'email')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'skipped')),
  payload jsonb not null default '{}'::jsonb,
  scheduled_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.seasonal_guilds (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  total_xp int not null default 0,
  total_distance float8 not null default 0,
  wins int not null default 0
);

create table if not exists public.guild_wars (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) on delete cascade,
  guild_a uuid references public.guilds(id) on delete cascade,
  guild_b uuid references public.guilds(id) on delete cascade,
  winner uuid references public.guilds(id) on delete set null,
  duration int not null default 0,
  score jsonb not null default '{}'::jsonb,
  starts_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone
);

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade,
  seller_id uuid references public.users(id) on delete cascade,
  price int not null default 0,
  rarity text not null default 'common',
  status text not null default 'listed' check (status in ('listed', 'sold', 'cancelled')),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.users(id) on delete set null,
  seller_id uuid references public.users(id) on delete set null,
  item_id uuid references public.items(id) on delete set null,
  price int not null default 0,
  timestamp timestamp with time zone not null default now()
);

create table if not exists public.gps_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  character_id uuid references public.characters(id) on delete set null,
  race_id uuid references public.race_sessions(id) on delete set null,
  provider text not null default 'browser_geolocation' check (provider in ('browser_geolocation', 'apple_healthkit', 'google_fit')),
  status text not null default 'active' check (status in ('active', 'completed', 'flagged')),
  total_distance float8 not null default 0,
  average_pace float8 not null default 0,
  elevation_gain float8 not null default 0,
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone
);

create table if not exists public.gps_points (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.gps_sessions(id) on delete cascade,
  lat float8 not null,
  lng float8 not null,
  speed_kmh float8 not null default 0,
  pace float8 not null default 0,
  elevation float8,
  accuracy float8,
  recorded_at timestamp with time zone not null default now()
);

create table if not exists public.anti_cheat_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.gps_sessions(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  character_id uuid references public.characters(id) on delete set null,
  cheat_score float8 not null default 0,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  flagged boolean not null default false,
  reason text,
  xp_multiplier float8 not null default 1,
  created_at timestamp with time zone not null default now()
);

alter table public.anti_cheat_reports add column if not exists risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high'));

create table if not exists public.flagged_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.gps_sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  character_id uuid references public.characters(id) on delete set null,
  flag_type text not null,
  severity float8 not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  character_id uuid references public.characters(id) on delete set null,
  session_id uuid references public.gps_sessions(id) on delete set null,
  message text not null,
  message_type text not null default 'motivation',
  pace_target float8,
  fatigue_level float8 not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.run_token_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  balance int not null default 0,
  lifetime_earned int not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.run_token_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.run_token_wallets(id) on delete cascade,
  amount int not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
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
create index if not exists idx_guild_scores_week_rank on public.guild_scores(week_start, rank_score desc);
create index if not exists idx_referrals_referrer on public.referrals(referrer_user_id);
create index if not exists idx_referrals_referred on public.referrals(referred_user_id);
create index if not exists idx_item_ownership_character_id on public.item_ownership(character_id);
create index if not exists idx_item_ownership_item_id on public.item_ownership(item_id);
create index if not exists idx_item_drops_character_id on public.item_drops(character_id);
create index if not exists idx_character_items_character_id on public.character_items(character_id);
create index if not exists idx_character_items_item_id on public.character_items(item_id);
create index if not exists idx_race_sessions_status on public.race_sessions(status);
create index if not exists idx_race_participants_race_id on public.race_participants(race_id);
create index if not exists idx_map_zones_region on public.map_zones(region);
create index if not exists idx_zone_activity_zone_id on public.zone_activity(zone_id);
create index if not exists idx_seasonal_guilds_season_id on public.seasonal_guilds(season_id);
create index if not exists idx_events_active on public.events(active, starts_at);
create index if not exists idx_season_scores_rank on public.season_scores(season_id, rank_score desc);
create index if not exists idx_subscription_events_created on public.subscription_events(created_at desc);
create index if not exists idx_premium_passes_user_status on public.premium_passes(user_id, status, end_date desc);
create index if not exists idx_premium_passes_transaction on public.premium_passes(payment_provider, transaction_id);
create index if not exists idx_revenue_events_occurred on public.revenue_events(occurred_at desc);
create index if not exists idx_payment_fraud_logs_risk on public.payment_fraud_logs(risk_level, created_at desc);
create index if not exists idx_payment_fraud_logs_user on public.payment_fraud_logs(user_id, created_at desc);
create index if not exists idx_subscription_changes_user on public.subscription_changes(user_id, created_at desc);
create index if not exists idx_enterprise_accounts_status on public.enterprise_accounts(status);
create index if not exists idx_enterprise_users_account on public.enterprise_users(enterprise_account_id);
create index if not exists idx_invoices_enterprise_status on public.invoices(enterprise_account_id, status);
create index if not exists idx_ai_revenue_optimizations_segment on public.ai_revenue_optimizations(segment, expires_at desc);
create index if not exists idx_kpi_reports_date on public.kpi_reports(report_date desc, period);
create index if not exists idx_board_reports_date on public.board_reports(report_date desc);
create index if not exists idx_ai_business_strategies_week on public.ai_business_strategies(strategy_week desc, expires_at desc);
create index if not exists idx_company_valuations_date on public.company_valuations(valuation_date desc);
create index if not exists idx_global_expansion_month on public.global_expansion_intelligence(report_month desc);
create index if not exists idx_ai_personalization_user on public.ai_personalization_cache(user_id, expires_at desc);
create index if not exists idx_leaderboard_global_region_score on public.leaderboard_global(region, weekly_score desc);
create index if not exists idx_leaderboard_region_score on public.leaderboard_region(region, weekly_score desc);
create index if not exists idx_marketing_campaigns_user_status on public.marketing_campaigns(user_id, status);
create index if not exists idx_guild_wars_season_id on public.guild_wars(season_id);
create index if not exists idx_marketplace_items_status on public.marketplace_items(status);
create index if not exists idx_transactions_item_id on public.transactions(item_id);
create index if not exists idx_gps_sessions_character_id on public.gps_sessions(character_id);
create index if not exists idx_gps_sessions_race_id on public.gps_sessions(race_id);
create index if not exists idx_gps_points_session_id on public.gps_points(session_id);
create index if not exists idx_anti_cheat_reports_session_id on public.anti_cheat_reports(session_id);
create index if not exists idx_flagged_sessions_session_id on public.flagged_sessions(session_id);
create index if not exists idx_ai_coach_messages_character_id on public.ai_coach_messages(character_id);
create index if not exists idx_run_token_wallets_character_id on public.run_token_wallets(character_id);
create index if not exists idx_run_token_transactions_wallet_id on public.run_token_transactions(wallet_id);
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_characters_status on public.characters(status);
create index if not exists idx_admin_audit_logs_admin_user_id on public.admin_audit_logs(admin_user_id);
create index if not exists idx_admin_economy_settings_key on public.admin_economy_settings(setting_key);
create index if not exists idx_system_settings_key on public.system_settings(setting_key);
create index if not exists idx_migration_history_executed_at on public.migration_history(executed_at desc);

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
alter table public.guild_scores enable row level security;
alter table public.referrals enable row level security;
alter table public.item_ownership enable row level security;
alter table public.item_drops enable row level security;
alter table public.items enable row level security;
alter table public.character_items enable row level security;
alter table public.race_sessions enable row level security;
alter table public.race_participants enable row level security;
alter table public.map_zones enable row level security;
alter table public.zone_activity enable row level security;
alter table public.seasons enable row level security;
alter table public.events enable row level security;
alter table public.season_scores enable row level security;
alter table public.subscription_events enable row level security;
alter table public.premium_passes enable row level security;
alter table public.revenue_events enable row level security;
alter table public.payment_fraud_logs enable row level security;
alter table public.subscription_changes enable row level security;
alter table public.enterprise_accounts enable row level security;
alter table public.enterprise_users enable row level security;
alter table public.invoices enable row level security;
alter table public.ai_revenue_optimizations enable row level security;
alter table public.kpi_reports enable row level security;
alter table public.board_reports enable row level security;
alter table public.ai_business_strategies enable row level security;
alter table public.company_valuations enable row level security;
alter table public.global_expansion_intelligence enable row level security;
alter table public.ai_personalization_cache enable row level security;
alter table public.leaderboard_global enable row level security;
alter table public.leaderboard_region enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.seasonal_guilds enable row level security;
alter table public.guild_wars enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.transactions enable row level security;
alter table public.gps_sessions enable row level security;
alter table public.gps_points enable row level security;
alter table public.anti_cheat_reports enable row level security;
alter table public.flagged_sessions enable row level security;
alter table public.ai_coach_messages enable row level security;
alter table public.run_token_wallets enable row level security;
alter table public.run_token_transactions enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_economy_settings enable row level security;
alter table public.system_settings enable row level security;
alter table public.migration_history enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

drop policy if exists "Users are readable by everyone" on public.users;
create policy "Users are readable by everyone"
on public.users for select
using (true);

drop policy if exists "Authenticated users can create own user profile" on public.users;
create policy "Authenticated users can create own user profile"
on public.users for insert
with check (auth.uid() = id and role = 'user');

drop policy if exists "Users can update own basic profile" on public.users;
create policy "Users can update own basic profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id and role = 'user');

drop policy if exists "Users are manageable by admins" on public.users;
create policy "Users are manageable by admins"
on public.users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Courses are readable by everyone" on public.courses;
create policy "Courses are readable by everyone"
on public.courses for select
using (true);

drop policy if exists "Courses are insertable by everyone in prototype" on public.courses;
create policy "Courses are insertable by everyone in prototype"
on public.courses for insert
with check (true);

drop policy if exists "Courses are manageable by admins" on public.courses;
create policy "Courses are manageable by admins"
on public.courses for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Course points are readable by everyone" on public.course_points;
create policy "Course points are readable by everyone"
on public.course_points for select
using (true);

drop policy if exists "Course points are insertable by everyone in prototype" on public.course_points;
create policy "Course points are insertable by everyone in prototype"
on public.course_points for insert
with check (true);

drop policy if exists "Course points are manageable by admins" on public.course_points;
create policy "Course points are manageable by admins"
on public.course_points for all
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists "Character equipment is deleteable by admins" on public.character_equipment;
create policy "Character equipment is deleteable by admins"
on public.character_equipment for delete
using (public.is_admin());

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

drop policy if exists "Guild scores are readable by everyone" on public.guild_scores;
create policy "Guild scores are readable by everyone"
on public.guild_scores for select
using (true);

drop policy if exists "Guild scores are writable by everyone in prototype" on public.guild_scores;
create policy "Guild scores are writable by everyone in prototype"
on public.guild_scores for all
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

drop policy if exists "Race sessions are open in prototype" on public.race_sessions;
create policy "Race sessions are open in prototype" on public.race_sessions for all using (true) with check (true);
drop policy if exists "Race participants are open in prototype" on public.race_participants;
create policy "Race participants are open in prototype" on public.race_participants for all using (true) with check (true);
drop policy if exists "Map zones are open in prototype" on public.map_zones;
create policy "Map zones are open in prototype" on public.map_zones for all using (true) with check (true);
drop policy if exists "Zone activity is open in prototype" on public.zone_activity;
create policy "Zone activity is open in prototype" on public.zone_activity for all using (true) with check (true);
drop policy if exists "Seasons are open in prototype" on public.seasons;
create policy "Seasons are open in prototype" on public.seasons for all using (true) with check (true);
drop policy if exists "Seasonal guilds are open in prototype" on public.seasonal_guilds;
create policy "Seasonal guilds are open in prototype" on public.seasonal_guilds for all using (true) with check (true);
drop policy if exists "Guild wars are open in prototype" on public.guild_wars;
create policy "Guild wars are open in prototype" on public.guild_wars for all using (true) with check (true);
drop policy if exists "Marketplace items are open in prototype" on public.marketplace_items;
create policy "Marketplace items are open in prototype" on public.marketplace_items for all using (true) with check (true);
drop policy if exists "Transactions are open in prototype" on public.transactions;
create policy "Transactions are open in prototype" on public.transactions for all using (true) with check (true);
drop policy if exists "GPS sessions are open in prototype" on public.gps_sessions;
create policy "GPS sessions are open in prototype" on public.gps_sessions for all using (true) with check (true);
drop policy if exists "GPS points are open in prototype" on public.gps_points;
create policy "GPS points are open in prototype" on public.gps_points for all using (true) with check (true);
drop policy if exists "Anti cheat reports are open in prototype" on public.anti_cheat_reports;
create policy "Anti cheat reports are open in prototype" on public.anti_cheat_reports for all using (true) with check (true);
drop policy if exists "Flagged sessions are open in prototype" on public.flagged_sessions;
create policy "Flagged sessions are open in prototype" on public.flagged_sessions for all using (true) with check (true);
drop policy if exists "AI coach messages are open in prototype" on public.ai_coach_messages;
create policy "AI coach messages are open in prototype" on public.ai_coach_messages for all using (true) with check (true);
drop policy if exists "Run token wallets are open in prototype" on public.run_token_wallets;
create policy "Run token wallets are open in prototype" on public.run_token_wallets for all using (true) with check (true);
drop policy if exists "Run token transactions are open in prototype" on public.run_token_transactions;
create policy "Run token transactions are open in prototype" on public.run_token_transactions for all using (true) with check (true);
drop policy if exists "Admin audit logs are admin only" on public.admin_audit_logs;
create policy "Admin audit logs are admin only" on public.admin_audit_logs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin economy settings are admin only" on public.admin_economy_settings;
create policy "Admin economy settings are admin only" on public.admin_economy_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "System settings are admin only" on public.system_settings;
create policy "System settings are admin only" on public.system_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Migration history is admin readable" on public.migration_history;
create policy "Migration history is admin readable" on public.migration_history for select using (public.is_admin());

drop policy if exists "Referrals are readable by authenticated users" on public.referrals;
create policy "Referrals are readable by authenticated users"
on public.referrals for select
using (auth.role() = 'authenticated');

drop policy if exists "Referrals are writable by authenticated users" on public.referrals;
create policy "Referrals are writable by authenticated users"
on public.referrals for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Events are readable by everyone" on public.events;
create policy "Events are readable by everyone"
on public.events for select
using (true);

drop policy if exists "Events are manageable by admins" on public.events;
create policy "Events are manageable by admins"
on public.events for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Season scores are readable by everyone" on public.season_scores;
create policy "Season scores are readable by everyone"
on public.season_scores for select
using (true);

drop policy if exists "Season scores are writable by authenticated users" on public.season_scores;
create policy "Season scores are writable by authenticated users"
on public.season_scores for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Push subscriptions are readable by owner" on public.push_subscriptions;
create policy "Push subscriptions are readable by owner"
on public.push_subscriptions for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Push subscriptions are writable by owner" on public.push_subscriptions;
create policy "Push subscriptions are writable by owner"
on public.push_subscriptions for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Subscription events are admin readable" on public.subscription_events;
create policy "Subscription events are admin readable"
on public.subscription_events for select
using (public.is_admin());

drop policy if exists "Subscription events are service writable" on public.subscription_events;
create policy "Subscription events are service writable"
on public.subscription_events for insert
with check (true);

drop policy if exists "Premium passes are owner readable" on public.premium_passes;
create policy "Premium passes are owner readable"
on public.premium_passes for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Premium passes are service writable" on public.premium_passes;
create policy "Premium passes are service writable"
on public.premium_passes for insert
with check (true);

drop policy if exists "Premium passes are admin manageable" on public.premium_passes;
create policy "Premium passes are admin manageable"
on public.premium_passes for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Revenue events are admin readable" on public.revenue_events;
create policy "Revenue events are admin readable"
on public.revenue_events for select
using (public.is_admin());

drop policy if exists "Revenue events are service writable" on public.revenue_events;
create policy "Revenue events are service writable"
on public.revenue_events for insert
with check (true);

drop policy if exists "Payment fraud logs are admin readable" on public.payment_fraud_logs;
create policy "Payment fraud logs are admin readable"
on public.payment_fraud_logs for select
using (public.is_admin());

drop policy if exists "Payment fraud logs are service writable" on public.payment_fraud_logs;
create policy "Payment fraud logs are service writable"
on public.payment_fraud_logs for insert
with check (true);

drop policy if exists "Subscription changes are admin readable" on public.subscription_changes;
create policy "Subscription changes are admin readable"
on public.subscription_changes for select
using (public.is_admin());

drop policy if exists "Subscription changes are service writable" on public.subscription_changes;
create policy "Subscription changes are service writable"
on public.subscription_changes for insert
with check (true);

drop policy if exists "Enterprise accounts are admin only" on public.enterprise_accounts;
create policy "Enterprise accounts are admin only"
on public.enterprise_accounts for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Enterprise users are admin only" on public.enterprise_users;
create policy "Enterprise users are admin only"
on public.enterprise_users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Invoices are admin only" on public.invoices;
create policy "Invoices are admin only"
on public.invoices for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "AI revenue optimizations are admin readable" on public.ai_revenue_optimizations;
create policy "AI revenue optimizations are admin readable"
on public.ai_revenue_optimizations for select
using (public.is_admin());

drop policy if exists "AI revenue optimizations are service writable" on public.ai_revenue_optimizations;
create policy "AI revenue optimizations are service writable"
on public.ai_revenue_optimizations for insert
with check (true);

drop policy if exists "KPI reports are admin readable" on public.kpi_reports;
create policy "KPI reports are admin readable"
on public.kpi_reports for select
using (public.is_admin());

drop policy if exists "KPI reports are service writable" on public.kpi_reports;
create policy "KPI reports are service writable"
on public.kpi_reports for insert
with check (true);

drop policy if exists "Board reports are admin readable" on public.board_reports;
create policy "Board reports are admin readable"
on public.board_reports for select
using (public.is_admin());

drop policy if exists "Board reports are service writable" on public.board_reports;
create policy "Board reports are service writable"
on public.board_reports for insert
with check (true);

drop policy if exists "AI business strategies are admin readable" on public.ai_business_strategies;
create policy "AI business strategies are admin readable"
on public.ai_business_strategies for select
using (public.is_admin());

drop policy if exists "AI business strategies are service writable" on public.ai_business_strategies;
create policy "AI business strategies are service writable"
on public.ai_business_strategies for insert
with check (true);

drop policy if exists "Company valuations are admin readable" on public.company_valuations;
create policy "Company valuations are admin readable"
on public.company_valuations for select
using (public.is_admin());

drop policy if exists "Company valuations are service writable" on public.company_valuations;
create policy "Company valuations are service writable"
on public.company_valuations for insert
with check (true);

drop policy if exists "Global expansion intelligence is admin readable" on public.global_expansion_intelligence;
create policy "Global expansion intelligence is admin readable"
on public.global_expansion_intelligence for select
using (public.is_admin());

drop policy if exists "Global expansion intelligence is service writable" on public.global_expansion_intelligence;
create policy "Global expansion intelligence is service writable"
on public.global_expansion_intelligence for insert
with check (true);

drop policy if exists "AI personalization cache owner readable" on public.ai_personalization_cache;
create policy "AI personalization cache owner readable"
on public.ai_personalization_cache for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "AI personalization cache owner writable" on public.ai_personalization_cache;
create policy "AI personalization cache owner writable"
on public.ai_personalization_cache for all
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Global leaderboard is readable by everyone" on public.leaderboard_global;
create policy "Global leaderboard is readable by everyone"
on public.leaderboard_global for select
using (true);

drop policy if exists "Global leaderboard is writable by authenticated users" on public.leaderboard_global;
create policy "Global leaderboard is writable by authenticated users"
on public.leaderboard_global for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Regional leaderboard is readable by everyone" on public.leaderboard_region;
create policy "Regional leaderboard is readable by everyone"
on public.leaderboard_region for select
using (true);

drop policy if exists "Regional leaderboard is writable by authenticated users" on public.leaderboard_region;
create policy "Regional leaderboard is writable by authenticated users"
on public.leaderboard_region for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Marketing campaigns are owner readable" on public.marketing_campaigns;
create policy "Marketing campaigns are owner readable"
on public.marketing_campaigns for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Marketing campaigns are writable by authenticated users" on public.marketing_campaigns;
create policy "Marketing campaigns are writable by authenticated users"
on public.marketing_campaigns for all
using (auth.role() = 'authenticated' or public.is_admin())
with check (auth.role() = 'authenticated' or public.is_admin());
