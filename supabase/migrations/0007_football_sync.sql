-- 0007_football_sync.sql
-- Configuración de sincronización con una API de fútbol (Fase 9).

-- Config por torneo. La CLAVE de la API nunca se guarda aquí: vive solo en las
-- variables de entorno del servidor.
alter table public.tournaments
  add column if not exists api_provider     text,            -- 'footballdata' | 'openfootball' | 'mock' | null
  add column if not exists api_competition  text,            -- p.ej. 'WC' (football-data) o '2026' (openfootball)
  add column if not exists api_sync_enabled boolean not null default false;

-- Idempotencia: un partido externo se mapea a una sola fila por torneo.
-- Índice no parcial: varios NULL siguen permitidos (partidos manuales/mock),
-- pero permite el upsert ON CONFLICT (tournament_id, external_id).
create unique index if not exists matches_tournament_external_key
  on public.matches (tournament_id, external_id);

-- Los equipos son globales; el external_id lleva prefijo de proveedor para no
-- colisionar entre proveedores (p.ej. 'footballdata:759').
create unique index if not exists teams_external_id_key
  on public.teams (external_id);

-- Nombre de jornada estable por torneo (para upsert de jornadas en el sync).
create unique index if not exists matchdays_tournament_name_key
  on public.matchdays (tournament_id, name);
