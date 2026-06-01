-- ============================================================================
-- PORRAPP · 0002_functions_triggers.sql
-- Funciones auxiliares (usadas por las políticas RLS) y triggers.
-- IMPORTANTE: las funciones de pertenencia son SECURITY DEFINER para que
-- puedan consultar las tablas sin disparar las propias políticas RLS
-- (esto evita recursión infinita en las políticas).
-- ============================================================================

-- ¿Soy miembro activo de este torneo?
create or replace function public.is_member(tid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tournament_members
    where tournament_id = tid and user_id = auth.uid() and status = 'active'
  );
$$;

-- ¿Soy admin activo de este torneo?
create or replace function public.is_admin(tid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tournament_members
    where tournament_id = tid and user_id = auth.uid()
      and role = 'admin' and status = 'active'
  );
$$;

-- ¿Ha empezado ya el partido? (clave para revelar predicciones)
create or replace function public.match_has_started(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches
    where id = mid
      and (locked = true or status in ('live','finished') or kickoff_at <= now())
  );
$$;

-- ¿Están cerradas las preguntas generales de este torneo?
create or replace function public.questions_closed(tid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tournaments
    where id = tid and questions_locked_at is not null and questions_locked_at <= now()
  );
$$;

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  create trigger trg_touch_tournaments before update on public.tournaments
    for each row execute function public.touch_updated_at();
  create trigger trg_touch_matches before update on public.matches
    for each row execute function public.touch_updated_at();
  create trigger trg_touch_predictions before update on public.match_predictions
    for each row execute function public.touch_updated_at();
  create trigger trg_touch_profiles before update on public.profiles
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Al crear un torneo: configurar al creador como admin + defaults
-- ----------------------------------------------------------------------------
create or replace function public.setup_new_tournament()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text;
  p record;
begin
  select username into uname from profiles where id = new.created_by;

  insert into tournament_members (tournament_id, user_id, role, status, display_name)
  values (new.id, new.created_by, 'admin', 'active', coalesce(uname, 'Admin'));

  insert into scoring_rules (tournament_id) values (new.id)
  on conflict do nothing;

  insert into phase_multipliers (tournament_id, phase, multiplier) values
    (new.id,'group',1.0),(new.id,'round32',1.25),(new.id,'round16',1.5),
    (new.id,'quarter',2.0),(new.id,'semi',2.5),(new.id,'third_place',2.0),(new.id,'final',3.0)
  on conflict do nothing;

  -- copiar el catálogo de powerups al torneo (todos activados por defecto)
  for p in select id, default_probability from powerups loop
    insert into tournament_powerups (tournament_id, powerup_id, enabled, probability)
    values (new.id, p.id, true, p.default_probability)
    on conflict do nothing;
  end loop;

  return new;
end $$;

do $$ begin
  create trigger trg_setup_tournament after insert on public.tournaments
    for each row execute function public.setup_new_tournament();
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Crear perfil automáticamente al registrarse en Supabase Auth
-- (el username se pasa en raw_user_meta_data al hacer el signUp)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text,1,8)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

do $$ begin
  create trigger trg_on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- RPC: unirse a un torneo por código (validación segura en el servidor)
-- ----------------------------------------------------------------------------
create or replace function public.join_tournament_by_code(p_code text, p_display_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  t record;
  uname text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  select * into t from tournaments where invite_code = upper(p_code) and deleted_at is null;
  if not found then raise exception 'Código de torneo no válido'; end if;

  -- ¿bloqueado?
  if exists (select 1 from tournament_members
             where tournament_id = t.id and user_id = auth.uid() and status = 'banned') then
    raise exception 'Has sido bloqueado en este torneo';
  end if;

  select username into uname from profiles where id = auth.uid();
  insert into tournament_members (tournament_id, user_id, role, status, display_name)
  values (t.id, auth.uid(), 'participant', 'active', coalesce(p_display_name, uname, 'Jugador'))
  on conflict (tournament_id, user_id)
  do update set status = 'active';   -- reactivar si se había ido

  return t.id;
end $$;

-- ----------------------------------------------------------------------------
-- RPC para el ADMIN: quién ha enviado predicción (SIN ver el marcador)
-- Devuelve sólo user_id + submitted. Imposible filtrar marcadores con esto.
-- ----------------------------------------------------------------------------
create or replace function public.match_prediction_status(p_match_id uuid)
returns table (user_id uuid, display_name text, submitted boolean)
language plpgsql stable security definer set search_path = public as $$
declare tid uuid;
begin
  select tournament_id into tid from matches where id = p_match_id;
  if not public.is_admin(tid) then raise exception 'Solo el admin'; end if;

  return query
  select m.user_id, m.display_name,
         exists(select 1 from match_predictions p
                where p.match_id = p_match_id and p.user_id = m.user_id) as submitted
  from tournament_members m
  where m.tournament_id = tid and m.status = 'active';
end $$;

grant execute on function public.join_tournament_by_code(text, text) to authenticated;
grant execute on function public.match_prediction_status(uuid) to authenticated;
