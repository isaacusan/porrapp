-- 0006_ranking.sql
-- Standings for a tournament, computed from the points ledger. One function
-- covers the three views the app needs:
--   · General    -> call with both filters null
--   · Por jornada -> pass p_matchday
--   · Por fase    -> pass p_phase
-- Ties share a position (rank()), e.g. two players on 12 pts are both 1st.

create or replace function public.tournament_ranking(
  p_tournament uuid,
  p_matchday   uuid       default null,
  p_phase      match_phase default null
)
returns table (
  user_id      uuid,
  display_name text,
  avatar_id    text,
  points       bigint,
  played       bigint,
  exact_hits   bigint,
  "position"   bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      tm.user_id,
      tm.display_name,
      tm.avatar_id,
      coalesce(sum(l.points), 0)                                   as points,
      count(distinct l.match_id) filter (where l.source = 'match') as played,
      count(*) filter (
        where l.source = 'match'
          and l.breakdown @> '[{"label":"Resultado exacto"}]'::jsonb
      )                                                            as exact_hits
    from tournament_members tm
    left join points_ledger l
      on  l.tournament_id = tm.tournament_id
      and l.user_id       = tm.user_id
      and (p_matchday is null
           or l.match_id in (select id from matches where matchday_id = p_matchday))
      and (p_phase is null
           or l.match_id in (select id from matches where phase = p_phase))
    where tm.tournament_id = p_tournament
      and tm.status = 'active'
      and public.is_member(p_tournament)   -- only members get standings
    group by tm.user_id, tm.display_name, tm.avatar_id
  )
  select
    user_id, display_name, avatar_id, points, played, exact_hits,
    rank() over (order by points desc) as "position"
  from totals
  order by points desc, exact_hits desc, display_name;
$$;

grant execute on function public.tournament_ranking(uuid, uuid, match_phase) to authenticated;
