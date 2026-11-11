-- Partidas más seguras: regalos del servidor para un solo jugador, copias de las partidas por si hay que recuperar
-- algo y la devolución de los Pokémon que algunos jugadores perdieron al sincronizar la partida entre versiones.

-- Regalo para un jugador (su cuenta); NULL, para todos (worker/serverGifts.ts)
ALTER TABLE server_gifts ADD COLUMN user_id TEXT REFERENCES users (id) ON DELETE CASCADE;

-- Copias de la partida en la nube de cada cuenta, como mucho una por hora y de los últimos días (worker/db/saves.ts):
-- antes de cambiar la de `saves` se guarda aquí la que había. Se recuperan a mano (ver docs/servidor.md)
CREATE TABLE save_history (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  saved_at INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (user_id, saved_at)
);

-- Devolución de los Pokémon perdidos (nivel y ★ de su última pelea en una raid; del Geodude no quedó el nivel). Solo
-- se pone si la cuenta existe, así esta migración también vale en una base de datos vacía. Se ofrecen hasta el 31 de
-- enero de 2027
INSERT INTO server_gifts (id, title, goods, expires_at, user_id)
SELECT
  'perdon-partida-cristobal',
  'Perdona: tu partida se guardó mal al cambiar de versión y perdiste a Butterfree y Geodude. ¡Aquí los tienes de vuelta!',
  '{"mons":[{"speciesId":12,"level":13,"stars":2},{"speciesId":74,"level":15,"stars":0}]}',
  1801440000000,
  id
FROM users WHERE id = '8ef5a769-cc35-4c7e-8ece-e4125a920813';

INSERT INTO server_gifts (id, title, goods, expires_at, user_id)
SELECT
  'perdon-partida-tucho',
  'Perdona: tu partida se guardó mal al cambiar de versión y perdiste a Sylveon. ¡Aquí lo tienes de vuelta!',
  '{"mons":[{"speciesId":700,"level":17,"stars":4}]}',
  1801440000000,
  id
FROM users WHERE id = 'c29cb4d6-bee9-4438-be70-fb57f8d4403b';
