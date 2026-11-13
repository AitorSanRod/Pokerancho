-- Premios semanales de los rankings ya repartidos (worker/db/rankingAwards.ts): uno por ranking y semana, para no
-- repartirlos dos veces. Los premios en sí van a server_gifts, uno por cuenta.
CREATE TABLE ranking_awards (
  board TEXT NOT NULL,
  week INTEGER NOT NULL,
  awarded_at INTEGER NOT NULL,
  PRIMARY KEY (board, week)
);
