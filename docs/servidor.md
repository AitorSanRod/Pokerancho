# Servidor en Cloudflare (plan gratuito, sin tarjeta)

Pokérancho se publica como un **Worker de Cloudflare**: sirve la web (`dist/`) y una pequeña API en `/api/*` con una
base de datos **D1** (SQLite). Por la API van:

- **Salas compartidas** de los jefes de la pestaña Raids, sin cuenta.
- **Cuentas opcionales** con email y contraseña, para guardar la partida en la nube y seguirla en otro dispositivo.
  Los correos de confirmar la cuenta y recuperar la contraseña los manda **Brevo** (gratis, sin tarjeta).

Sin servidor (p. ej. con `npm run dev`) se juega todo igual en local: raids con bots y sin cuentas.

Cómo funciona por dentro: [arquitectura.md › Salas con servidor](arquitectura.md#salas-con-servidor) y
[› Cuentas](arquitectura.md#cuentas-y-partida-en-la-nube).

## Qué hay montado

| Pieza | Dónde |
|---|---|
| Configuración del Worker: nombre, web, base de datos | `wrangler.jsonc` |
| Esquema de la base de datos (cuentas, sesiones, partidas, salas) | `migrations/0001_init.sql` |
| Entrada del Worker y rutas de la API | `worker/index.ts` |
| Salas de la pestaña Raids: `POST /api/raid` (cuántos esperan, entrar, salir, ponerse al día, toques, ataque y crítico). Una consulta sin cambios no escribe en D1; las salas de ciclos ya jugados las borra la tarea programada. Las tablas, en `migrations/0018_raid_schedule.sql` | `worker/raid.ts` + `worker/db/rooms.ts` |
| Incursiones con otros jugadores: `POST /api/incursion-schedule` (incursiones programadas: tablón, crear, aceptar, baja, cancelar, sala del checkin; a la hora, la primera consulta forma el grupo; avisos push del tema `incursion`) y `POST /api/incursion` (el grupo: reorganizar, votos, toques). Una consulta sin cambios no escribe en D1; la tarea programada borra los grupos sin consultas en 24 h y las programadas 7 días después de su hora | `worker/incursionSchedule.ts` + `worker/db/schedules.ts`, `worker/incursion.ts` + `worker/db/incursions.ts`; tablas en `migrations/0010_incursions.sql` y `0019_incursion_schedules.sql` (la cola ya no existe) |
| Partida en la nube: `GET` / `POST /api/save` (solo con sesión) | `worker/save.ts` + `worker/db/saves.ts` |
| Cuentas: `/api/auth/*` (crear, confirmar, entrar, salir, recuperar, apodo) | `worker/auth/` + `worker/db/users.ts` |
| Regalos para todos o para un jugador: `GET /api/server-gifts` (los de todos, sin cuenta; los de un jugador, con su sesión; cada partida apunta los que ya recogió). Se ponen y caducan con una migración en la tabla `server_gifts` (ver `migrations/0011_server_gifts.sql` y `0013_save_safety.sql`) | `worker/serverGifts.ts`, `src/game/collection/serverGifts.ts` |
| Obsequio diario: `GET` / `POST /api/gift` (solo con sesión) | `worker/gift.ts` + `worker/db/gifts.ts` |
| Intercambios: `GET` (tablón) / `POST /api/trade` (anunciar, aceptar, retirar, recoger; solo con sesión) | `worker/trade.ts` + `worker/tradeActions.ts` + `worker/db/trades.ts`, `tradeWrites.ts`; tablas en `migrations/0007_trades.sql` |
| Rankings de dinero y de daño a jefes: `GET /api/ranking` (solo con sesión, apodo y sin ocultarse; las fotos se rehacen cada hora). El daño lo apunta el propio servidor, en su semana, al terminar la pelea de cada sala de la pestaña Raids (al guardar la sala) y cada incursión (al guardar el grupo): una escritura por Pokémon de jugador con cuenta. La foto solo cuenta la semana en curso (desde el lunes a las 00:00 UTC) y borra las anteriores | `worker/ranking.ts` + `worker/db/ranking.ts`, `worker/db/damageRanking.ts`; tablas en `migrations/0008_ranking.sql`, `0009_damage_ranking.sql` y `0012_weekly_boss_damage.sql` |
| Errores de los jugadores: `POST /api/error-report` (botón «Enviar error» de la pantalla «Algo ha fallado»; sin cuenta también, con sesión se apunta de quién es). El mismo error activo suma en su fila en vez de crear otra | `worker/errorReport.ts`, `src/game/core/errorReport.ts`; tabla en `migrations/0014_error_reports.sql` |
| Notificaciones push: `/api/push/*` y el envío (VAPID, cifrado) | `worker/push/` |
| Tarea programada cada minuto (borrar salas de raid viejas, anuncios caducados, ranking cada hora, avisos que tocan) | `worker/scheduled.ts`, `triggers` en `wrangler.jsonc` |
| Correos (Brevo) y su texto / cupo (250 al día entre todos y 5 por hora desde una IP, para no pasar de los 300 diarios del plan gratuito) | `worker/mail.ts` / `worker/db/mailLog.ts` (tabla `mail_log`, `migrations/0017_mail_log.sql`) |
| Lógica del juego que usa el servidor (con tests) | `src/game/raid/online/`, `src/game/core/cloudSave.ts`, `accountRules.ts`, `ranking.ts` |
| Cliente: cuenta, partida en la nube, id y apodo, cada cuánto consulta | `src/net/` |

## Paso a paso: publicar

Necesitas Node 22 (ver `.nvmrc`) y el repositorio en GitHub.

### 1. Cuentas gratuitas

1. **Cloudflare**: crea una cuenta en <https://dash.cloudflare.com/sign-up>. No pide tarjeta.
2. **Brevo** (correos): crea una cuenta en <https://www.brevo.com/> con el plan *Free*. Tampoco pide tarjeta.

### 2. Crear la base de datos (desde tu ordenador, una vez)

En la carpeta del proyecto:

```bash
npm install
npx wrangler login              # abre el navegador para autorizar a Wrangler en tu cuenta de Cloudflare
npx wrangler d1 create pokerancho
```

El último comando escribe un `database_id` (un id largo con guiones). Pégalo en `wrangler.jsonc`, en
`d1_databases[0].database_id`, en lugar del de ceros. Después crea las tablas en la base de datos de verdad:

```bash
npm run db:migrate              # aplica migrations/ a la base de datos remota
```

Haz commit y push del `wrangler.jsonc` con el id.

### 3. Conectar el repositorio (despliegue automático)

1. En el panel de Cloudflare: *Workers & Pages → Create → Workers → Import a repository*.
2. Conecta GitHub, autoriza el acceso y elige el repositorio.
3. Configuración del proyecto:
   - *Project name*: `pokerancho` (tiene que coincidir con `name` de `wrangler.jsonc`).
   - *Build command*: `npm run ci:build` (pasa `npm run check` antes de compilar: con un test roto no se publica nada).
   - *Deploy command*: `npm run ci:deploy` (aplica las migraciones que falten y después publica el Worker).
   - Si el despliegue falla al migrar por permisos, dale al token de *Workers Builds* (*Settings → Builds → API token*)
     también el permiso *D1 → Edit*.
4. *Save and Deploy*. En un par de minutos la web queda en `https://pokerancho.<tu-subdominio>.workers.dev`.

Desde entonces, cada push a `main` vuelve a desplegar solo, siempre que pase `npm run check`, y con la base de datos al
día. GitHub Actions (`.github/workflows/check.yml`) pasa también `npm run check` en cada push y pull request, para
verlo en GitHub.

### 4. Activar los correos (Brevo)

1. En Brevo: *Settings → Senders, domains & dedicated IPs → Senders → Add a sender*. Pon tu email (puede ser un
   Gmail) y confírmalo con el correo que te mandan. Ese será el remitente.
2. En Brevo: *SMTP & API → API keys → Generate a new API key*. Cópiala: solo se ve una vez.
3. En Cloudflare: *Workers & Pages → pokerancho → Settings → Variables and Secrets → Add*, dos veces, como tipo
   **Secret** (los secretos no se borran al desplegar):
   - `BREVO_API_KEY`: la clave de Brevo.
   - `MAIL_FROM`: el email del remitente verificado.

Sin estos dos secretos la web funciona, pero los correos no salen: el enlace se escribe en los registros del
Worker (*pokerancho → Logs*), útil para probar.

### 5. Activar las notificaciones push

Hacen falta unas claves VAPID (con ellas el servidor firma los avisos). Se generan y se guardan como secreto de una
vez, sin que se vean, desde la carpeta del proyecto:

```bash
node scripts/make-vapid-key.mjs | npx wrangler secret put VAPID_KEY
```

No hay que hacer nada más: la tarea programada de cada minuto ya va en `wrangler.jsonc`. No cambies las claves después:
cada navegador tendría que volver a activar los avisos. Sin ellas, Ajustes › Notificaciones dice que no puede conectar.

### 6. Probarlo

1. Abre la web en el móvil y en el ordenador (o en una ventana de incógnito: cuenta como otro jugador).
2. **Raids**: en los dos, termina el tutorial, ve a *Ruta › Raids* y, con la sala abierta (la primera media hora de
   cada hora UTC), entra con un Pokémon (la primera vez pide el apodo). Los dos aparecen en la misma sala.
3. **Cuenta**: *Ajustes (engranaje) › Cuenta › Crear una cuenta*. Llega un correo (mira en spam); al abrir el
   enlace vuelves a la web con la sesión iniciada y la partida se sube sola. En otro dispositivo, en la pantalla del
   inicial, pulsa «¿Ya tienes cuenta? Entrar» y sigues con esa partida.
4. Instálala como app desde el móvil («Añadir a pantalla de inicio»).

## Probar en local

- `npm run dev`: solo la app, en <http://localhost:5173>. Sin servidor: raids con bots locales y sin cuentas.
- Con servidor: `npm run db:migrate:local` (una vez, crea la base de datos local en `.wrangler/`) y luego
  `npm run preview`, que compila y arranca el Worker en <http://localhost:8787> con el mismo runtime que Cloudflare (escucha en `0.0.0.0`: desde el móvil, `http://<IP del PC>:8787`).
  Los correos no salen: el enlace aparece en la terminal.

## Cambiar la base de datos

Un cambio de tablas es un fichero nuevo en `migrations/` (`0003_….sql`, el siguiente número libre); nunca se edita uno ya aplicado. El
despliegue lo aplica solo antes de publicar el código (`npm run ci:deploy`, y también `npm run deploy` a mano); para
probar en local, `npm run db:migrate:local`.

## Lo que gasta del plan gratuito

Límites del plan gratuito de Cloudflare (se renuevan cada día; si se pasan, la API falla hasta el día siguiente y
**no se cobra nada**):

| Recurso | Límite gratis | Qué lo gasta |
|---|---|---|
| Peticiones al Worker | 100 000 / día | Solo `/api/*`: la web la sirve Cloudflare sin pasar por el Worker |
| CPU por petición | 10 ms | Cerrar las ventanas de toques de una sala simula su pelea (media hora como mucho, unos pocos ms) |
| Filas escritas en D1 | 100 000 / día | Cada consulta de sala y cada subida de partida escriben una; los rankings, una por cuenta activa y ranking cada hora (24 al día); el daño a jefes, una por Pokémon de jugador con cuenta al terminar cada jefe o incursión |
| Filas leídas en D1 | 5 millones / día | Sobra |
| Almacenamiento D1 | 5 GB | Una sala ocupa unos KB; una partida, decenas de KB (máx. 1 MB, `MAX_SAVE_BYTES`) |
| Tarea programada (cron) | Incluida | Una ejecución por minuto (≈ 1 440 al día), con poca CPU: borra salas viejas y manda como mucho 20 avisos |
| Correos (Brevo) | 300 / día | Crear cuenta, entrar sin confirmar y recuperar contraseña (como mucho uno por minuto y cuenta) |

Lo que consulta cada jugador (solo con la app delante; cerrada, las ventanas de toques se cierran solas al pasar):

| Situación | Peticiones por hora |
|---|---|
| Con un Pokémon en una sala abierta (cada 30 s; una sala por rotación) | ≈ 120 por sala |
| En la pelea de un jefe (cada 10 s; cada 3 s con la ventana de toques abierta y enseguida al cerrarse, para saber el resultado) | ≈ 1500 mientras dura (media hora como mucho) |
| Mirando la pestaña Raids sin estar en una sala (cada 20 s) | ≈ 180 |
| Con cuenta: subir la partida (cada 2 min) | ≈ 30 |
| Con cuenta: tablón de intercambios y Notificaciones (cada 60 s, `REFRESH_EVERY_MS` en `src/net/tradeBoard.ts`) | ≈ 60 |
| En la sala del checkin de una incursión programada (cada 3 s, como mucho 10 min) o en su sala de reorganizar (cada 3 s, como mucho 90 s) | ≈ 1200 mientras dura |
| Mirando el tablón de incursiones (cada 30 s, `REFRESH_EVERY_MS` en `src/net/incursionBoard.ts`; solo lee) o con fianzas retenidas (cada 60 s, `BONDS_SYNC_MS` en `src/net/scheduleSync.ts`) | ≈ 120 / ≈ 60 |
| Jugando un tramo de incursión (cada 10 s, `PLAY_SYNC_MS` en `src/net/incursionSync.ts`) | ≈ 360 |
| Sin Pokémon en salas y sin cuenta | 0 |

Con 100 000 peticiones al día caben ≈ 65 horas diarias de alguien jugando la pelea de un jefe: de sobra para poco
tráfico. Si se quedara corto, sube `FIGHT_SYNC_MS` y `TAP_SYNC_MS` en `src/net/raidSync.ts` o `UPLOAD_EVERY_MS` en
`src/net/cloudSync.ts`. El consumo se ve en *Workers & Pages → pokerancho → Metrics* y en *D1 → pokerancho*.

## Mantenimiento

- **Registros y errores**: *Workers & Pages → pokerancho → Logs*.
- **Errores enviados por los jugadores** (tabla `error_reports`, desde la consola de D1). Los que faltan por arreglar,
  primero los más repetidos: `SELECT id, count, message, stack, datetime(last_at / 1000, 'unixepoch') AS last FROM error_reports WHERE active = 1 ORDER BY count DESC;`.
  Al corregir uno (y publicarlo), márcalo como inactivo: `UPDATE error_reports SET active = 0 WHERE id = 7;`. Si vuelve
  a pasar, entra como una fila nueva y activa.
- **Ver o tocar los datos**: *Storage & Databases → D1 → pokerancho → Console*. Por ejemplo, borrar una cuenta (con
  su partida y sesiones): `DELETE FROM users WHERE email = 'alguien@ejemplo.com';`. Borrar todas las salas (los
  jugadores que estuvieran dentro siguen en local): `DELETE FROM rooms;`.
- **Cambias el juego** (jefes, reglas, `RAID_ROOM_SIZE`…): el Worker usa el mismo código de `src/game` y `src/data`,
  así que se actualiza con cada despliegue. Ojo con desplegar en plena pelea: si cambia cómo se juega, el móvil y el
  servidor simulan lo mismo solo cuando los dos tienen la versión nueva.
- **Cambias `SAVE_VERSION`**: las partidas de la nube de otra versión se migran igual que las del navegador, sin perder
  nada. El servidor no deja que una app sin actualizar suba encima de una partida guardada con una versión más nueva
  (responde 409 con `outdated-app` y la app pide actualizar, sin perder lo jugado en el móvil).
- **Recuperar una partida**: la tabla `save_history` guarda, de cada cuenta, una copia por hora de los últimos 3 días
  (la que había antes de cada subida). Para ver las de alguien:
  `SELECT h.saved_at, h.revision, length(h.data) FROM save_history h JOIN users u ON u.id = h.user_id WHERE u.nickname = 'Apodo' ORDER BY h.saved_at DESC;`.
  Mejor que pisar su partida (el móvil podría subir encima la suya), devuélvele lo perdido con un regalo.
- **Regalar algo a un jugador** (p. ej. para compensar algo que falló): `npm run gift -- --id … --title … --goods '{…}'
  --days 14 --nickname Apodo` (sin `--nickname`, para todos; `--dry` enseña el SQL; detalles en `scripts/server-gift.mjs`).
  También vale una migración con una fila en `server_gifts` con su `user_id` (sin él, es para todos). `goods` admite `money` (₽, como mucho un millón), `incursionKeys`
  y `mons` (`speciesId`, `level`, `stars`); le sale en Notificaciones. Ejemplo: `migrations/0013_save_safety.sql`.

## Límites que conviene saber

- **No hay protección contra trampas**: la partida la juega el navegador y el servidor solo la guarda. Quien sepa
  mandar peticiones a mano puede inventarse su partida o el nivel de su Pokémon en las raids. El servidor valida que
  los datos tengan sentido (especie existente, nivel 1–100, apodo limpio), pero no puede comprobar la partida.
- **Contraseñas**: se guardan con PBKDF2-SHA256 de 100 000 iteraciones (lo máximo que deja Cloudflare), nunca en
  claro. Si al entrar apareciera un error 1102 (CPU agotada), baja `PASSWORD_ITERATIONS` en
  `worker/auth/crypto.ts`: cada contraseña guarda sus iteraciones y las ya creadas siguen valiendo.
- **Correos a spam**: sin dominio propio, Brevo manda desde tu email verificado y algunos correos pueden acabar en
  spam. Con un dominio propio se puede verificar en Brevo y mejora.
- **Sin cuenta, todo está en el navegador**: si se borran los datos del sitio se pierde la partida y el dispositivo
  es un jugador nuevo para las raids. Con cuenta se recupera entrando otra vez.
- **No es tiempo real al milisegundo**: el servidor cierra las ventanas de toques cuando alguien consulta y cada
  cliente pregunta cada pocos segundos; si el resultado de una ventana tarda, se ve «Esperando a los toques de la sala…».
