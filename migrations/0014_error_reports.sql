-- Errores que envían los jugadores desde la pantalla «Algo ha fallado» (worker/errorReport.ts). El mismo error
-- (mensaje y pila iguales) mientras siga activo no crea otra fila: suma `count` y actualiza `last_at`.
-- `active` = 1 mientras está por arreglar; al corregirlo, se pone a 0 (ver docs/servidor.md › Mantenimiento) y, si
-- vuelve a pasar, entra como una fila nueva.
CREATE TABLE error_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  stack TEXT NOT NULL,
  component TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  -- Cuenta del jugador si tenía la sesión abierta; NULL si no
  user_id TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  first_at INTEGER NOT NULL,
  last_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX error_reports_active ON error_reports (active, last_at);
