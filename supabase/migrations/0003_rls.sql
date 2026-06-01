-- ============================================================================
-- PORRAPP · 0003_rls.sql
-- Row Level Security: la base de datos se protege sola.
-- Regla de oro de las predicciones:
--   · Siempre puedes leer TU predicción.
--   · Sólo puedes leer la de OTRO si el partido YA ha empezado.
-- Esto se aplica AQUÍ, en la base de datos, no en el frontend.
-- ============================================================================

-- Activar RLS en todo
alter table public.profiles                enable row level security;
alter table public.tournaments             enable row level security;
alter table public.tournament_members      enable row level security;
alter table public.tournament_invites      enable row level security;
alter table public.teams                   enable row level security;
alter table public.players                 enable row level security;
alter table public.competitions            enable row level security;
alter table public.tournament_teams        enable row level security;
alter table public.groups                  enable row level security;
alter table public.group_standings         enable row level security;
alter table public.matchdays               enable row level security;
alter table public.matches                 enable row level security;
alter table public.match_predictions       enable row level security;
alter table public.general_questions       enable row level security;
alter table public.general_question_options enable row level security;
alter table public.general_answers         enable row level security;
alter table public.scoring_rules           enable row level security;
alter table public.phase_multipliers       enable row level security;
alter table public.points_ledger           enable row level security;
alter table public.rankings_snapshots      enable row level security;
alter table public.powerups                enable row level security;
alter table public.tournament_powerups     enable row level security;
alter table public.chests                  enable row level security;
alter table public.user_powerup_inventory  enable row level security;
alter table public.powerup_assignments     enable row level security;
alter table public.powerup_uses            enable row level security;
alter table public.match_powerup_effects   enable row level security;
alter table public.achievements            enable row level security;
alter table public.user_achievements       enable row level security;
alter table public.api_sync_logs           enable row level security;
alter table public.audit_logs              enable row level security;
alter table public.settings                enable row level security;

-- ---------- PROFILES ----------
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid());

-- ---------- TOURNAMENTS ----------
create policy tournaments_member_read on public.tournaments
  for select using (public.is_member(id) or created_by = auth.uid());
create policy tournaments_create on public.tournaments
  for insert with check (created_by = auth.uid());
create policy tournaments_admin_update on public.tournaments
  for update using (public.is_admin(id));
create policy tournaments_admin_delete on public.tournaments
  for delete using (public.is_admin(id));

-- ---------- TOURNAMENT_MEMBERS ----------
create policy members_read on public.tournament_members
  for select using (public.is_member(tournament_id) or user_id = auth.uid());
-- admin invita / gestiona; un usuario normal se une vía RPC join_tournament_by_code
create policy members_admin_insert on public.tournament_members
  for insert with check (public.is_admin(tournament_id));
create policy members_update on public.tournament_members
  for update using (public.is_admin(tournament_id) or user_id = auth.uid());
create policy members_delete on public.tournament_members
  for delete using (public.is_admin(tournament_id) or user_id = auth.uid());

-- ---------- INVITES ----------
create policy invites_admin_all on public.tournament_invites
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

-- ---------- DATOS DEPORTIVOS (lectura para miembros; escritura: admin / servicio) ----------
-- teams/players/competitions son globales: lectura para cualquier usuario autenticado.
create policy teams_read   on public.teams        for select using (auth.uid() is not null);
create policy players_read on public.players       for select using (auth.uid() is not null);
create policy comp_read    on public.competitions  for select using (auth.uid() is not null);

create policy tteams_read on public.tournament_teams
  for select using (public.is_member(tournament_id));
create policy tteams_admin on public.tournament_teams
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

create policy groups_read on public.groups
  for select using (public.is_member(tournament_id));
create policy groups_admin on public.groups
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

create policy standings_read on public.group_standings
  for select using (exists (select 1 from groups g
    where g.id = group_id and public.is_member(g.tournament_id)));

-- ---------- MATCHDAYS / MATCHES ----------
create policy matchdays_read on public.matchdays
  for select using (public.is_member(tournament_id));
create policy matchdays_admin on public.matchdays
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

create policy matches_read on public.matches
  for select using (public.is_member(tournament_id));
create policy matches_admin on public.matches
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

-- ---------- MATCH_PREDICTIONS  (★ el núcleo de la privacidad ★) ----------
-- LECTURA: tu propia predicción SIEMPRE; la de otros SÓLO si el partido empezó.
create policy predictions_read on public.match_predictions
  for select using (
    user_id = auth.uid()
    or (public.is_member(tournament_id) and public.match_has_started(match_id))
  );
-- INSERTAR: sólo la tuya y sólo si el partido NO ha empezado.
create policy predictions_insert on public.match_predictions
  for insert with check (
    user_id = auth.uid()
    and public.is_member(tournament_id)
    and not public.match_has_started(match_id)
  );
-- EDITAR: sólo la tuya y sólo si el partido NO ha empezado.
create policy predictions_update on public.match_predictions
  for update using (user_id = auth.uid() and not public.match_has_started(match_id))
  with check (user_id = auth.uid() and not public.match_has_started(match_id));

-- ---------- GENERAL_QUESTIONS ----------
create policy questions_read on public.general_questions
  for select using (public.is_member(tournament_id));
create policy questions_admin on public.general_questions
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

create policy qoptions_read on public.general_question_options
  for select using (exists (select 1 from general_questions q
    where q.id = question_id and public.is_member(q.tournament_id)));
create policy qoptions_admin on public.general_question_options
  for all using (exists (select 1 from general_questions q
    where q.id = question_id and public.is_admin(q.tournament_id)))
  with check (exists (select 1 from general_questions q
    where q.id = question_id and public.is_admin(q.tournament_id)));

-- ---------- GENERAL_ANSWERS  (visibles a otros sólo tras el cierre) ----------
create policy answers_read on public.general_answers
  for select using (
    user_id = auth.uid()
    or (public.is_member(tournament_id) and public.questions_closed(tournament_id))
  );
create policy answers_insert on public.general_answers
  for insert with check (
    user_id = auth.uid() and public.is_member(tournament_id)
    and not public.questions_closed(tournament_id)
  );
create policy answers_update on public.general_answers
  for update using (user_id = auth.uid() and not public.questions_closed(tournament_id))
  with check (user_id = auth.uid() and not public.questions_closed(tournament_id));

-- ---------- SCORING / MULTIPLIERS ----------
create policy scoring_read on public.scoring_rules
  for select using (public.is_member(tournament_id));
create policy scoring_admin on public.scoring_rules
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

create policy mult_read on public.phase_multipliers
  for select using (public.is_member(tournament_id));
create policy mult_admin on public.phase_multipliers
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

-- ---------- LEDGER / RANKINGS (historial público dentro del torneo) ----------
create policy ledger_read on public.points_ledger
  for select using (public.is_member(tournament_id));
create policy ranks_read on public.rankings_snapshots
  for select using (public.is_member(tournament_id));

-- ---------- POWERUPS ----------
create policy powerups_read on public.powerups for select using (auth.uid() is not null);

create policy tpowerups_read on public.tournament_powerups
  for select using (public.is_member(tournament_id));
create policy tpowerups_admin on public.tournament_powerups
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

create policy chests_read on public.chests
  for select using (user_id = auth.uid() or public.is_admin(tournament_id));
create policy chests_update on public.chests
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- inventario: el dueño lo ve; el admin también (lo pediste explícitamente)
create policy inv_read on public.user_powerup_inventory
  for select using (user_id = auth.uid() or public.is_admin(tournament_id));

create policy assign_read on public.powerup_assignments
  for select using (user_id = auth.uid() or public.is_admin(tournament_id));

-- los usos de powerup son visibles para los miembros (transparencia)
create policy uses_read on public.powerup_uses
  for select using (public.is_member(tournament_id));

create policy effects_read on public.match_powerup_effects
  for select using (public.match_has_started(match_id)
    and exists (select 1 from matches m where m.id = match_id and public.is_member(m.tournament_id)));

-- ---------- LOGROS ----------
create policy ach_read on public.achievements for select using (auth.uid() is not null);
create policy uach_read on public.user_achievements
  for select using (public.is_member(tournament_id));

-- ---------- LOGS ----------
create policy sync_read on public.api_sync_logs
  for select using (tournament_id is null or public.is_admin(tournament_id));
create policy audit_read on public.audit_logs
  for select using (public.is_admin(tournament_id));   -- sólo admin ve auditoría

-- ---------- SETTINGS ----------
create policy settings_read on public.settings
  for select using (public.is_member(tournament_id));
create policy settings_admin on public.settings
  for all using (public.is_admin(tournament_id)) with check (public.is_admin(tournament_id));

-- NOTA: el rol service_role (servidor: sync API, recálculo, reseteo de
-- contraseña por el admin) ignora RLS por diseño y se usa SÓLO en el backend,
-- nunca en el navegador.
