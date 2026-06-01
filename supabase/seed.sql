-- ============================================================================
-- PORRAPP · seed.sql
-- Datos de prueba para que la app funcione SIN API configurada.
-- Ejecutar tras las 3 migraciones. Es idempotente (se puede repetir).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CATÁLOGO DE POWERUPS (22)  · target: self|other|info|none
-- ----------------------------------------------------------------------------
insert into public.powerups (key, name, description, rarity, target, effect_type, default_probability, config) values
('double_or_nothing','Doble o Nada','Duplica los puntos conseguidos en un partido. Si no consigue ninguno, se queda en 0.','rare','self','multiply_points',1.0,'{"factor":2}'),
('var_savior','VAR Salvador','Si fallas por un solo gol de diferencia, mejora tu puntuación al siguiente nivel de acierto.','rare','self','upgrade_tier',1.0,'{}'),
('ghost_goal','Gol Fantasma','Suma +1 gol a tu predicción en un equipo elegido antes del cierre.','common','self','adjust_own_goal',1.5,'{"delta":1}'),
('def_scissors','Tijera Defensiva','Resta -1 gol a tu predicción en un equipo elegido antes del cierre.','common','self','adjust_own_goal',1.5,'{"delta":-1}'),
('leader_curse','Maldición del Líder','Elige a otro usuario y un partido: sin ver su predicción, se le resta 1 gol a uno de sus equipos.','epic','other','adjust_other_goal',0.6,'{"delta":-1}'),
('stand_push','Empujón de Grada','Elige a otro usuario y un partido: sin ver su predicción, se le suma 1 gol a uno de sus equipos.','epic','other','adjust_other_goal',0.6,'{"delta":1}'),
('anti_zero_shield','Escudo Anti-Cero','Si en un partido obtendrías 0 puntos, recibes 1.','common','self','min_points',1.5,'{"min":1}'),
('epic_comeback','Remontada Épica','Si aciertas el resultado exacto, ganas +3 puntos extra. (Más probable en la parte baja.)','epic','self','exact_bonus',0.4,'{"bonus":3}'),
('hawk_eye','Ojo de Halcón','Ves el % de predicciones a local/empate/visitante de un partido, sin revelar usuarios.','rare','info','reveal_aggregate',1.0,'{}'),
('blind_copy','Copia Ciega','Copia la predicción de un usuario por encima de ti, sin verla hasta el cierre del partido.','rare','other','copy_prediction',0.8,'{}'),
('late_change','Cambio Tardío','Edita tu predicción hasta 10 min antes del partido aunque hubiera cerrado antes. Nunca tras el inicio real.','common','self','extend_deadline',1.2,'{"minutes":10}'),
('goal_prophet','Profeta del Gol','Si aciertas los goles de un equipo, recibes +2 en vez de +1.','rare','self','team_goals_boost',1.0,'{"points":2}'),
('padlock','Candado','Protege tu predicción frente a powerups ofensivos de otros usuarios.','common','self','protect',1.3,'{}'),
('rebound','Rebote','Si alguien intenta modificar tu predicción con un powerup ofensivo, se anula y se le aplica a él.','epic','self','reflect',0.5,'{}'),
('all_in','All-in','Triplica los puntos del partido si aciertas el resultado exacto. Si no, puntúa normal o 0 (según admin).','legendary','self','multiply_if_exact',0.3,'{"factor":3}'),
('draw_joker','Comodín del Empate','Si el partido acaba en empate y no lo habías predicho, recibes 1 punto.','common','self','draw_consolation',1.2,'{"points":1}'),
('soft_steal','Robo Suave','Si aciertas el signo, ganas +1 y el líder pierde -1 (nunca por debajo de 0 en ese partido).','epic','other','steal_from_leader',0.5,'{"amount":1}'),
('bench_inspiration','Inspiración del Banquillo','Aplica un pequeño bonus +1 a tu predicción antes de empezar el partido.','common','self','flat_bonus',1.4,'{"bonus":1}'),
('lightning_lock','Cierre Relámpago','Bloquea tu predicción y la protege de cambios accidentales.','common','self','self_lock',1.3,'{}'),
('second_chance','Segunda Oportunidad','Recupera una predicción no enviada con una automática del admin (con límite).','rare','self','auto_recover',0.7,'{"limit":1}'),
('golden_glove','Guante de Oro','Si aciertas que un equipo queda a cero, ganas +1 extra.','common','self','clean_sheet_bonus',1.2,'{"bonus":1}'),
('controlled_jinx','Gafe Controlado','Elige un usuario y un partido: si ese usuario falla por completo, tú ganas +1.','rare','other','jinx',0.7,'{"bonus":1}')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- LOGROS (visuales)
-- ----------------------------------------------------------------------------
insert into public.achievements (key, name, description, icon) values
('first_exact','Primer acierto exacto','Tu primer marcador clavado.','🎯'),
('draw_king','Rey del Empate','Acertaste varios empates.','🤝'),
('goal_prophet','Profeta del Gol','Aciertas goles con maestría.','⚽'),
('matchday_comeback','Remontador de la Jornada','La mayor subida de una jornada.','🚀'),
('official_jinx','Gafe Oficial','La peor jornada... con estilo.','🐈‍⬛'),
('visionary','Visionario','Acertaste un resultado improbable.','🔮'),
('underdog','Nadie creía en ti','Remontaste desde el fondo.','🐢'),
('three_streak','Tres aciertos seguidos','Racha de 3.','🔥'),
('var_loves_you','El VAR te ama','La suerte estuvo de tu lado.','📺'),
('fighting_last','Farolillo peleón','Último, pero sin rendirse.','🏮'),
('leader_hunter','Cazador del líder','Le quitaste puntos al líder.','🏹'),
('matchday_unbeaten','Invicto de la jornada','Puntuaste en todos los partidos.','🛡️')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- MUNDIAL MOCK · usa identificadores fijos para poder referenciarlos
-- (en producción esto lo rellena la API o el admin)
-- ----------------------------------------------------------------------------
insert into public.competitions (id, name, season)
values ('00000000-0000-0000-0000-0000000000c1','Mundial PORRAPP (mock)','2026')
on conflict (id) do nothing;

-- Equipos (Grupo A y Grupo B)
insert into public.teams (id, name, short_name, country, flag_url) values
('00000000-0000-0000-0000-0000000000a1','España','ESP','España','🇪🇸'),
('00000000-0000-0000-0000-0000000000a2','Argentina','ARG','Argentina','🇦🇷'),
('00000000-0000-0000-0000-0000000000a3','Croacia','CRO','Croacia','🇭🇷'),
('00000000-0000-0000-0000-0000000000a4','Japón','JPN','Japón','🇯🇵'),
('00000000-0000-0000-0000-0000000000b1','Francia','FRA','Francia','🇫🇷'),
('00000000-0000-0000-0000-0000000000b2','Brasil','BRA','Brasil','🇧🇷'),
('00000000-0000-0000-0000-0000000000b3','Marruecos','MAR','Marruecos','🇲🇦'),
('00000000-0000-0000-0000-0000000000b4','México','MEX','México','🇲🇽')
on conflict (id) do nothing;

-- Jugadores (para la pregunta de máximo goleador)
insert into public.players (id, name, team_id, position) values
('00000000-0000-0000-0000-0000000000f1','Lamine Yamal','00000000-0000-0000-0000-0000000000a1','FWD'),
('00000000-0000-0000-0000-0000000000f2','Lionel Messi','00000000-0000-0000-0000-0000000000a2','FWD'),
('00000000-0000-0000-0000-0000000000f3','Kylian Mbappé','00000000-0000-0000-0000-0000000000b1','FWD'),
('00000000-0000-0000-0000-0000000000f4','Vinícius Jr.','00000000-0000-0000-0000-0000000000b2','FWD')
on conflict (id) do nothing;

-- A partir de aquí, todo cuelga de un torneo de ejemplo creado por el primer
-- usuario que se registre. Lo dejamos como función para llamarla tras el alta.
-- (Ver README: paso "Probar creación de torneo".)

-- Función de ayuda: rellena un torneo concreto con el Mundial mock.
create or replace function public.seed_mock_world_cup(p_tournament uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  md1 uuid; md2 uuid; oct uuid;
begin
  -- Solo el admin del torneo puede cargar el Mundial de prueba.
  if not public.is_admin(p_tournament) then
    raise exception 'Solo el admin puede cargar partidos en este torneo';
  end if;
  -- No duplicar si ya hay partidos.
  if exists (select 1 from matches where tournament_id = p_tournament) then
    raise exception 'Este torneo ya tiene partidos cargados';
  end if;
  -- equipos del torneo + grupos
  insert into groups (tournament_id, name, label) values
    (p_tournament,'Grupo A','A'),(p_tournament,'Grupo B','B') on conflict do nothing;

  insert into tournament_teams (tournament_id, team_id, group_label)
  select p_tournament, id, case when id::text like '%a%' then 'A' else 'B' end
  from teams where id in (
    '00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2',
    '00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000a4',
    '00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000b3','00000000-0000-0000-0000-0000000000b4')
  on conflict do nothing;

  -- jornadas
  insert into matchdays (tournament_id, name, phase, order_index, status)
    values (p_tournament,'Jornada 1','group',1,'finished') returning id into md1;
  insert into matchdays (tournament_id, name, phase, order_index, status)
    values (p_tournament,'Jornada 2','group',2,'open') returning id into md2;
  insert into matchdays (tournament_id, name, phase, order_index, status)
    values (p_tournament,'Octavos','round16',3,'upcoming') returning id into oct;

  -- Jornada 1: YA jugada (predicciones visibles + resultados) → ayer
  insert into matches (tournament_id, matchday_id, phase, home_team_id, away_team_id, kickoff_at, status, home_score, away_score, finished_at) values
    (p_tournament, md1,'group','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a3', now()-interval '1 day', 'finished', 2, 1, now()-interval '22 hours'),
    (p_tournament, md1,'group','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a4', now()-interval '1 day', 'finished', 0, 0, now()-interval '22 hours'),
    (p_tournament, md1,'group','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000b3', now()-interval '1 day', 'finished', 3, 1, now()-interval '22 hours');

  -- Jornada 2: ABIERTA (predicciones editables) → en 2-3 días
  insert into matches (tournament_id, matchday_id, phase, home_team_id, away_team_id, kickoff_at, status) values
    (p_tournament, md2,'group','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a4', now()+interval '2 days', 'scheduled'),
    (p_tournament, md2,'group','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000b4', now()+interval '2 days', 'scheduled'),
    (p_tournament, md2,'group','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a3', now()+interval '3 days', 'scheduled');

  -- Octavos: futuro lejano (eliminatoria)
  insert into matches (tournament_id, matchday_id, phase, home_team_id, away_team_id, kickoff_at, status) values
    (p_tournament, oct,'round16','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b4', now()+interval '8 days', 'scheduled');

  -- preguntas generales de ejemplo
  insert into general_questions (tournament_id, type, prompt, points, order_index) values
    (p_tournament,'team','¿Quién ganará el Mundial?',10,1),
    (p_tournament,'team','¿Quién será finalista?',6,2),
    (p_tournament,'player','¿Máximo goleador del torneo?',8,3),
    (p_tournament,'number','¿Total de goles del torneo? (aprox.)',5,4);
end $$;

grant execute on function public.seed_mock_world_cup(uuid) to authenticated;
