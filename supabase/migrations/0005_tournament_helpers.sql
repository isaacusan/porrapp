-- 0005_tournament_helpers.sql
-- Read helpers for the tournaments UI. Both are SECURITY DEFINER and therefore
-- filter explicitly by auth.uid() / invite_code so they never leak data.

-- 1) The tournaments the current user actively belongs to, with their role and
--    the number of active members. One round-trip for the dashboard.
create or replace function public.my_tournaments()
returns table (
  id           uuid,
  name         text,
  description  text,
  logo_url     text,
  status       tournament_status,
  role         member_role,
  member_count bigint,
  created_by   uuid,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id, t.name, t.description, t.logo_url, t.status,
    tm.role,
    (select count(*) from tournament_members x
       where x.tournament_id = t.id and x.status = 'active') as member_count,
    t.created_by, t.created_at
  from tournament_members tm
  join tournaments t on t.id = tm.tournament_id
  where tm.user_id = auth.uid()
    and tm.status = 'active'
    and t.deleted_at is null
  order by t.created_at desc;
$$;

-- 2) A safe public-ish preview of a tournament from its invite code, so the
--    "join" screen can greet the user with the tournament name and size
--    BEFORE they are a member. Exposes only non-sensitive fields.
create or replace function public.tournament_preview_by_code(p_code text)
returns table (
  name         text,
  description  text,
  member_count bigint,
  status       tournament_status
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.name, t.description,
    (select count(*) from tournament_members x
       where x.tournament_id = t.id and x.status = 'active') as member_count,
    t.status
  from tournaments t
  where t.invite_code = upper(trim(p_code))
    and t.deleted_at is null
  limit 1;
$$;

grant execute on function public.my_tournaments() to authenticated;
grant execute on function public.tournament_preview_by_code(text) to authenticated;
