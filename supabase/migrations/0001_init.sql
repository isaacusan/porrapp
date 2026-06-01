-- ============================================================================
-- PORRAPP · 0001_init.sql
-- Esquema base: extensiones, tipos y tablas.
-- Ejecutar en el SQL Editor de Supabase (o vía CLI) ANTES que el resto.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- TIPOS (enums)
-- ----------------------------------------------------------------------------
do $$ begin
  create type member_role     as enum ('admin', 'participant');
  create type member_status   as enum ('active', 'banned', 'left');
  create type tournament_status as enum ('draft', 'open', 'in_progress', 'finished', 'archived');
  create type match_phase      as enum ('group','round32','round16','quarter','semi','third_place','final');
  create type match_status     as enum ('scheduled','live','finished','postponed','cancelled');
  create type matchday_status  as enum ('upcoming','open','in_progress','closed','finished');
  create type question_type    as enum ('team','player','team_ordered','player_multi','number');
  create type ledger_source    as enum ('match','question','powerup','manual','streak');
  create type powerup_target    as enum ('self','other','info','none');
  create type powerup_rarity    as enum ('common','rare','epic','legendary');
  create type inventory_status as enum ('stored','used','expired');
  create type missing_policy    as enum ('zero','auto_random','auto_limited','emergency_joker');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- PERFILES  (extiende auth.users de Supabase Auth)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  email       text,
  avatar_id   text default 'avatar-01',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- ----------------------------------------------------------------------------
-- TORNEOS
-- ----------------------------------------------------------------------------
create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  logo_url        text,
  start_date      timestamptz,
  invite_code     text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  status          tournament_status not null default 'open',
  powerups_enabled boolean not null default true,
  -- comportamiento si un usuario no envía predicción
  missing_prediction_policy missing_policy not null default 'zero',
  auto_predictions_limit    int not null default 0,
  questions_locked_at       timestamptz,            -- cierre de preguntas generales
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.tournament_members (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          member_role   not null default 'participant',
  status        member_status not null default 'active',
  display_name  text not null,                 -- nombre visible POR torneo (editable)
  avatar_id     text default 'avatar-01',
  joined_at     timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create table if not exists public.tournament_invites (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  email         text,
  token         text unique not null default replace(gen_random_uuid()::text,'-',''),
  created_by    uuid references auth.users(id),
  accepted_by   uuid references auth.users(id),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DATOS DEPORTIVOS  (poblados por API o manualmente por el admin)
-- ----------------------------------------------------------------------------
create table if not exists public.competitions (
  id          uuid primary key default gen_random_uuid(),
  external_id text,
  name        text not null,
  season      text,
  created_at  timestamptz not null default now()
);

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  external_id text,
  name        text not null,
  short_name  text,
  country     text,
  flag_url    text,
  created_at  timestamptz not null default now()
);

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  external_id text,
  name        text not null,
  team_id     uuid references public.teams(id) on delete set null,
  position    text,
  created_at  timestamptz not null default now()
);

create table if not exists public.tournament_teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  group_label   text,                          -- 'A','B',...
  unique (tournament_id, team_id)
);

create table if not exists public.groups (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,                 -- 'Grupo A'
  label         text not null,                 -- 'A'
  unique (tournament_id, label)
);

create table if not exists public.group_standings (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups(id) on delete cascade,
  team_id   uuid not null references public.teams(id) on delete cascade,
  played int default 0, won int default 0, drawn int default 0, lost int default 0,
  gf int default 0, ga int default 0, points int default 0, rank int,
  unique (group_id, team_id)
);

-- ----------------------------------------------------------------------------
-- JORNADAS Y PARTIDOS
-- ----------------------------------------------------------------------------
create table if not exists public.matchdays (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,                 -- 'Jornada 1', 'Octavos'...
  phase         match_phase not null default 'group',
  order_index   int not null default 0,
  status        matchday_status not null default 'upcoming',
  created_at    timestamptz not null default now()
);

create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  matchday_id   uuid references public.matchdays(id) on delete set null,
  external_id   text,
  phase         match_phase not null default 'group',
  home_team_id  uuid references public.teams(id),
  away_team_id  uuid references public.teams(id),
  kickoff_at    timestamptz not null,
  status        match_status not null default 'scheduled',
  -- marcador final (a 90' en eliminatorias)
  home_score    int,
  away_score    int,
  -- en eliminatoria: equipo que pasa de ronda (si empate a 90')
  advancing_team_id uuid references public.teams(id),
  is_knockout   boolean generated always as (phase <> 'group') stored,
  locked        boolean not null default false, -- cierre manual de predicciones
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PREDICCIONES  (la tabla más sensible → protegida por RLS en 0003)
-- ----------------------------------------------------------------------------
create table if not exists public.match_predictions (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  match_id      uuid not null references public.matches(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  home_goals    int not null,
  away_goals    int not null,
  advancing_team_id uuid references public.teams(id),  -- sólo eliminatorias
  is_auto       boolean not null default false,        -- predicción automática
  submitted_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (match_id, user_id),
  check (home_goals >= 0 and away_goals >= 0)
);

-- ----------------------------------------------------------------------------
-- PREGUNTAS GENERALES
-- ----------------------------------------------------------------------------
create table if not exists public.general_questions (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  type          question_type not null,
  prompt        text not null,
  points        int not null default 5,
  active        boolean not null default true,
  order_index   int not null default 0,
  resolved      boolean not null default false,
  correct_answer jsonb,                          -- {team_ids:[...]} | {player_id} | {value}
  created_at    timestamptz not null default now()
);

create table if not exists public.general_question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.general_questions(id) on delete cascade,
  label       text not null,
  team_id     uuid references public.teams(id),
  player_id   uuid references public.players(id),
  order_index int default 0
);

create table if not exists public.general_answers (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  question_id   uuid not null references public.general_questions(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  answer        jsonb not null,                  -- {team_ids:[...]} | {player_id} | {value}
  submitted_at  timestamptz not null default now(),
  unique (question_id, user_id)
);

-- ----------------------------------------------------------------------------
-- PUNTUACIÓN
-- ----------------------------------------------------------------------------
create table if not exists public.scoring_rules (
  tournament_id uuid primary key references public.tournaments(id) on delete cascade,
  exact_points        int not null default 5,
  sign_points         int not null default 2,
  goal_diff_points    int not null default 3,
  team_goals_points   int not null default 1,
  knockout_advance_points int not null default 2,
  streak_bonus_enabled boolean not null default false,
  streak_bonus_points  int not null default 3,
  streak_length        int not null default 3,
  updated_at          timestamptz not null default now()
);

create table if not exists public.phase_multipliers (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  phase         match_phase not null,
  multiplier    numeric(4,2) not null default 1.0,
  unique (tournament_id, phase)
);

create table if not exists public.points_ledger (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  source        ledger_source not null,
  match_id      uuid references public.matches(id) on delete cascade,
  question_id   uuid references public.general_questions(id) on delete cascade,
  powerup_use_id uuid,
  points        int not null default 0,
  multiplier_applied numeric(4,2) default 1.0,
  note          text,
  breakdown     jsonb,                           -- detalle visible en el historial
  created_at    timestamptz not null default now()
);

create table if not exists public.rankings_snapshots (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  matchday_id   uuid references public.matchdays(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  position      int not null,
  previous_position int,
  points        int not null default 0,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- POWERUPS Y COFRES
-- ----------------------------------------------------------------------------
create table if not exists public.powerups (         -- catálogo global de plantillas
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text not null,
  rarity      powerup_rarity not null default 'common',
  target      powerup_target not null default 'self',
  effect_type text not null,                     -- identificador lógico del efecto
  default_probability numeric(5,2) not null default 1.0,
  config      jsonb not null default '{}'::jsonb
);

create table if not exists public.tournament_powerups (  -- los activos en cada torneo
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  powerup_id    uuid not null references public.powerups(id) on delete cascade,
  enabled       boolean not null default true,
  probability   numeric(5,2) not null default 1.0,
  name_override text,
  description_override text,
  config_override jsonb,
  unique (tournament_id, powerup_id)
);

create table if not exists public.chests (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  matchday_id   uuid not null references public.matchdays(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  opened        boolean not null default false,
  opened_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (matchday_id, user_id)
);

create table if not exists public.user_powerup_inventory (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  tournament_powerup_id uuid not null references public.tournament_powerups(id) on delete cascade,
  status        inventory_status not null default 'stored',
  source        text,                            -- 'chest','admin','starter'
  acquired_at   timestamptz not null default now()
);

create table if not exists public.powerup_assignments (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  matchday_id   uuid references public.matchdays(id) on delete cascade,
  chest_id      uuid references public.chests(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  tournament_powerup_id uuid not null references public.tournament_powerups(id),
  assigned_at   timestamptz not null default now()
);

create table if not exists public.powerup_uses (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  inventory_id  uuid references public.user_powerup_inventory(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  match_id      uuid references public.matches(id) on delete cascade,
  target_user_id uuid references auth.users(id),
  target_team_id uuid references public.teams(id),
  used_at       timestamptz not null default now(),
  effect_summary text,
  points_delta  int default 0
);

create table if not exists public.match_powerup_effects (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  powerup_use_id uuid references public.powerup_uses(id) on delete cascade,
  effect        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- LOGROS
-- ----------------------------------------------------------------------------
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text not null,
  icon        text
);

create table if not exists public.user_achievements (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at     timestamptz not null default now(),
  unique (tournament_id, user_id, achievement_id)
);

-- ----------------------------------------------------------------------------
-- LOGS Y AJUSTES
-- ----------------------------------------------------------------------------
create table if not exists public.api_sync_logs (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  provider      text,
  status        text not null,                   -- 'success' | 'error'
  message       text,
  items_synced  int default 0,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action        text not null,
  entity        text,
  entity_id     text,
  details       jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.settings (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  key           text not null,
  value         jsonb,
  unique (tournament_id, key)
);

-- ----------------------------------------------------------------------------
-- ÍNDICES útiles
-- ----------------------------------------------------------------------------
create index if not exists idx_members_tournament on public.tournament_members(tournament_id);
create index if not exists idx_members_user on public.tournament_members(user_id);
create index if not exists idx_matches_tournament on public.matches(tournament_id);
create index if not exists idx_matches_kickoff on public.matches(kickoff_at);
create index if not exists idx_predictions_match on public.match_predictions(match_id);
create index if not exists idx_predictions_user on public.match_predictions(user_id);
create index if not exists idx_ledger_tournament_user on public.points_ledger(tournament_id, user_id);
