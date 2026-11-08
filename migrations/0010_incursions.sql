-- Incursiones con otros jugadores (worker/incursion.ts). La cola: quién espera qué incursión con qué Pokémon; al
-- formarse el grupo, su fila lleva el id del grupo hasta que el jugador lo recoge. Los grupos: la incursión en JSON,
-- con versión para no pisar a otro jugador que escriba a la vez.
CREATE TABLE incursion_queue (
  player_id TEXT PRIMARY KEY,
  incursion_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  member TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,
  group_id TEXT
);
CREATE INDEX incursion_queue_waiting ON incursion_queue (incursion_id, group_id, joined_at);

CREATE TABLE incursion_groups (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX incursion_groups_updated ON incursion_groups (updated_at);
