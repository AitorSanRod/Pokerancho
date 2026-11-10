-- El ranking de daño pasa a ser semanal y a contar también los jefes de incursión (worker/db/damageRanking.ts). El daño
-- se guarda por semana (`week`: lunes a las 00:00 UTC, en ms); lo de semanas pasadas se borra al rehacer la foto. Lo
-- apuntado hasta ahora queda en la semana en curso.
CREATE TABLE boss_damage (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  uid TEXT NOT NULL,
  species_id INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  PRIMARY KEY (user_id, week, uid)
);
CREATE INDEX boss_damage_week ON boss_damage (week);

INSERT INTO boss_damage (user_id, week, uid, species_id, damage)
SELECT user_id, CAST(strftime('%s', date('now', '-6 days', 'weekday 1')) AS INTEGER) * 1000, uid, species_id, damage FROM raid_damage;

DROP TABLE raid_damage;
