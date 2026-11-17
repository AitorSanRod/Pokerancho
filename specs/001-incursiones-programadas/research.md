# Research: Incursiones programadas

Decisiones técnicas para cumplir [spec.md](spec.md) sobre lo que ya hay (cola y grupos en `worker/incursion.ts`,
`game/incursion/online/`, avisos en `worker/push/`). No quedan «NEEDS CLARIFICATION».

## R1. Dónde vive la regla y dónde el estado

- **Decision**: las reglas (franjas, plazos, fianza, topes, fases, reparto, arranque del grupo) en una carpeta nueva y
  pura `src/game/incursion/schedule/`, que usan móvil y Worker. El servidor guarda cada incursión programada como un
  JSON con versión en D1 (como `incursion_groups`), y la partida guarda solo lo suyo: fianzas retenidas y su checkin.
- **Rationale**: Principios III y V (reglas compartidas en `src/game`, el servidor valida y guarda). Copiar el patrón de
  `sharedIncursion.ts` + `db/incursions.ts` (lectura, cambio puro, escritura con versión y reintento) evita inventar.
- **Alternatives**: tablas normalizadas (programación + huecos): más SQL y más escrituras por petición; descartado.

## R2. Cuándo pasa de fase y cuándo arranca (sin cron)

- **Decision**: las fases se calculan con la hora (`schedulePhase(sched, now)`): Abierta → Sin bajas ni cancelación (desde
  3 h antes del comienzo) → Sala (10 min antes) → Empezada / Cancelada. El grupo se forma **perezosamente** en la primera petición
  de cualquier apuntado después de la hora de comienzo, con `legStarts = [startAt]` (no la hora de la petición), así que
  todos ven la misma línea de tiempo aunque nadie consulte justo a la hora. Igual que las raids («cada consulta cierra lo
  pasado»).
- **Rationale**: el plan gratuito no quiere escrituras sin cambios; el cron de cada minuto ya existe pero no hace falta
  para jugar. El cron solo borra lo viejo (`deleteIdleIncursions` amplía su limpieza).
- **Alternatives**: arrancar desde el cron cada minuto: escribe aunque nadie mire y añade hasta 1 min de retraso.

## R3. Fianza: quién la cobra y quién la devuelve

- **Decision**: la fianza es dinero de la partida (local). Al crear o aceptar, el móvil la retiene
  (`wallet.ts › holdMoney`, sin contar para la misión de gastar) y la apunta en `GameState.incursionBonds`. El servidor
  apunta en el hueco la cantidad que el móvil declara (sin anti-trampas, Principio V). La devolución al hacer el checkin
  y el reparto al empezar los aplica **cada móvil** al leer la vista del servidor, que dice si su checkin consta y su
  parte del reparto (`bondShares`, cálculo puro común). Una fianza se liquida una sola vez (se quita de
  `incursionBonds`).
- **Rationale**: el dinero vive en la partida; los regalos del servidor por jugador exigen cuenta (`server_gifts.user_id`)
  y las incursiones van por `playerId` sin cuenta. Así funciona sin cuenta y con la app cerrada (se liquida al volver).
- **Alternatives**: repartir con regalos del servidor: solo con cuenta; descartado.
- **Caducidad**: el servidor guarda la programación terminada `SCHEDULE_TTL_MS` (7 días) tras empezar; una fianza cuyo
  registro ya no existe (`gone`) se devuelve entera, para no perder dinero (Principio IV) — favorece al jugador en un caso
  raro.

## R4. Ranking de dinero con fianzas retenidas

- **Decision**: el ranking suma `money` + las fianzas de `incursionBonds` de la partida guardada (SQL con `json_each`).
- **Rationale**: que apuntarse no baje puestos; la fianza sigue siendo suya hasta que se liquida.
- **Alternatives**: ignorarlo (baja temporal): confuso para el jugador.

## R5. La llave y el Pokémon durante la sala

- **Decision** (aprobada por el usuario, 2026-11-17): el checkin no exige la llave (recupera la fianza), pero marcar
  Pokémon sí; sin llave se avisa y se puede marcar en cuanto la consiga.
  Desde el checkin hasta empezar, una llave de esa incursión queda **reservada** (no se puede ofrecer en intercambios) y
  el Pokémon marcado queda en `MonPlace.Incursion` (no puede salir de expedición, torre…). La llave se gasta al aplicar
  el grupo en la partida (`applyGroupView`, como hoy).
- **Rationale**: como el móvil puede estar cerrado a la hora de comienzo, el servidor arranca con lo último que el móvil
  declaró; reservar llave y Pokémon durante ≤ 10 min evita que esa declaración quede falsa.
  Recogido en los casos límite de la spec.
- **Alternatives**: volver a comprobar a la hora: imposible con la app cerrada.

## R6. Pokémon y ataque marcados al hacer el checkin

- **Decision**: el primero de `byPickOrder` entre los del rancho que pasan `incursionBlocker` (nivel, PS, en el rancho),
  con su primer ataque (`monRepertoire`, el mismo que propone hoy `IncursionPrep`). Cada cambio manda al servidor la
  instantánea `MemberState` (como hoy `queueRequest`). «Fijar» bloquea en la partida y en el servidor.
- **Rationale**: reutiliza el selector y la preparación actuales (Principio VI).

## R7. Avisos

- **Decision**: tema nuevo `PushTopic.Incursion` (interruptor en Ajustes › Notificaciones). Al crear: `enqueue(db, 'all',
  job, creatorId)` con `dueAt = now`. Al aceptar o crear: aviso de sala abierta a ese jugador con
  `dueAt = startAt − CHECKIN_OPEN_MS` y clave `incursion-open:<id>`; al darse de baja o cancelar se borran esos avisos
  (función nueva `cancelJobs` en `worker/push/store.ts`). El aviso lleva un destino (`go`) que el service worker pasa a
  la app para abrir Tablón o Mis incursiones (`public/sw-notifications.js` + `ui/shared/navigation.ts`).
- **Rationale**: todo existe ya (`push_jobs` con `due_at`, audiencia `'all'`); el cron ya manda los que tocan.
- **Consumo**: 1 inserción en `push_jobs` por suscriptor y programación; con 3 creadas por jugador como tope, aceptable.

## R8. Fin de la cola automática

- **Decision**: se quitan `IncursionAction.Queue/Leave`, `incursion_queue` (migración nueva la borra) y
  `GameState.incursionQueue`. Al migrar la partida (SAVE_VERSION 65) una cola guardada se descarta sin gastar llave. Un
  móvil sin actualizar que pida `queue` recibe 400; la app ya tiene aviso de versión nueva (`UpdatePrompt`).
  `playQueueLocally` se sustituye por jugar al momento con bots (`startIncursion`) cuando no hay servidor o la incursión
  es gratuita.
- **Rationale**: FR-030, aprobado por el usuario.

## R9. Consultas

- **Decision**: tablón y «Mis incursiones»: cada 60 s con la pestaña a la vista y al volver a ella (como
  `net/tradeBoard.ts`); en la sala, cada 3 s (`QUICK_SYNC_MS`); empezada, lo de hoy (`net/incursionSync.ts`). Las
  consultas sin cambios no escriben (salvo el arranque perezoso).
- **Rationale**: plan gratuito (Principio V).

## R10. Choque de horario

- **Decision**: no se puede crear ni aceptar una incursión si el jugador ya está apuntado a otra cuyo comienzo esté a
  menos de `SCHEDULE_GAP_MS` (45 min: la duración máxima de 25 min más la sala de 10 y margen).
- **Rationale**: cubre el caso límite «dos incursiones a la vez» con una constante con nombre.
