-- Incursiones programadas (worker/incursionSchedule.ts): sustituyen a la cola automática. Cada una, en JSON con versión
-- para no pisar a otro jugador que escriba a la vez (ver src/game/incursion/schedule/scheduledIncursion.ts); los huecos,
-- aparte, para saber las de un jugador (topes, «Mis incursiones») sin leerlas todas.
CREATE TABLE incursion_schedules (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  start_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX incursion_schedules_start ON incursion_schedules (start_at);

CREATE TABLE incursion_schedule_seats (
  schedule_id TEXT NOT NULL REFERENCES incursion_schedules (id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  PRIMARY KEY (schedule_id, player_id)
);
CREATE INDEX incursion_schedule_seats_player ON incursion_schedule_seats (player_id);

-- La cola automática ya no existe: quien estuviera esperando no había gastado la llave
DROP TABLE incursion_queue;
