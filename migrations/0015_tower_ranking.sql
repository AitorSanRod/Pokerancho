-- Ranking de la torre infinita (worker/db/towerRanking.ts): el piso más alto de cada cuenta, sacado de su partida en
-- la nube; la tarea programada lo rehace cada hora junto al del dinero.

-- Puesto de cada cuenta que entra (con apodo, visible, con algún piso y con la partida subida hace poco); los empates
-- comparten puesto
CREATE TABLE tower_ranking (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  floor INTEGER NOT NULL
);
CREATE INDEX tower_ranking_rank ON tower_ranking (rank);
