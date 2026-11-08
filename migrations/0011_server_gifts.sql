-- Las incursiones empezadas antes de dejar un ataque de apoyo por tipo guardaban Pokémon con ataques que ya no existen
-- y daban «Movimiento desconocido»: se cierran todas (grupos y cola). La app descarta la suya al subir de versión.
DELETE FROM incursion_groups;
DELETE FROM incursion_queue;

-- Regalos del servidor para todos los jugadores (worker/serverGifts.ts): cada uno se recoge una vez en Notificaciones.
-- `goods` es el contenido en JSON (ver src/game/collection/serverGifts.ts) y `expires_at`, hasta cuándo se ofrece (ms).
CREATE TABLE server_gifts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  goods TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Compensación por las incursiones cerradas: una llave de cada incursión, hasta el 10 de diciembre de 2026
INSERT INTO server_gifts (id, title, goods, expires_at) VALUES (
  'llaves-incursiones-1',
  'Perdón por las incursiones cerradas: una llave de cada incursión',
  '{"incursionKeys":{"prueba":1,"cueva-helada":1}}',
  1796860800000
);
