# Tasks: Incursiones programadas

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: obligatorios para la lógica de `src/game` y del Worker (constitución, Principio VII): leen las constantes de
`scheduleRules.ts` y usan `game/core/test-map.ts` y `seqRng`; nunca fijan números ni nombres. La UI se verifica con
`npm run dev` en viewport móvil y `npm run smoke`.

**Formato**: `- [ ] Txxx [P] [USn] descripción con ruta`. `[P]`: fichero distinto y sin dependencias pendientes.

---

## Phase 1: Setup

- [X] T001 Crear la rama `001-incursiones-programadas` desde `constitucion` y la carpeta `src/game/incursion/schedule/` (vacía hasta T004)
- [X] T002 [P] Crear `migrations/0019_incursion_schedules.sql`: tablas `incursion_schedules` (id, data, version, start_at, updated_at) e `incursion_schedule_seats` (schedule_id, player_id) con índices por `start_at` y `player_id`, y `DROP TABLE incursion_queue` (ver contracts/schedule-api.md › D1)
- [X] T003 [P] Añadir `PushTopic.Incursion = 'incursion'` a `PUSH_TOPICS` (no a `CLIENT_TOPICS`) en `src/game/core/push.ts` y su caso en `src/game/core/push.test.ts` — Nota: no existía `push.test.ts` en `src/game/core`; el tema se prueba en `schedule/schedulePushes.test.ts` y en `worker/push/push.test.ts`.

---

## Phase 2: Foundational (bloquea todas las historias)

**Objetivo**: reglas puras de la programación, partida 65 sin cola y protocolo común.

- [X] T004 [P] Crear `src/game/incursion/schedule/scheduleRules.ts` con las constantes de data-model.md › Constantes (`BOND_FRACTION`, `SLOT_MS`, `MIN_LEAD_MS`, `MAX_LEAD_MS`, `CHECKIN_OPEN_MS`, `LEAVE_DEADLINE_MS`, `MAX_CREATED`, `MAX_JOINED`, `SCHEDULE_GAP_MS`, `SCHEDULE_TTL_MS`, cada una con `/** */`), `bondFor(money)`, `isValidSlot(startAt, now)` (data-model.md › ScheduledIncursion.startAt), el diccionario `SchedulePhase` y `schedulePhase(sched, now)` (data-model.md › Fases)
- [X] T005 [P] Tests de T004 en `src/game/incursion/schedule/scheduleRules.test.ts`: franjas válidas e inválidas, antelación mínima y máxima, cada frontera de fase, fianza redondeada hacia abajo y con 0 ₽
- [X] T006 Crear `src/game/incursion/schedule/scheduledIncursion.ts`: tipos `ScheduledIncursion` y `ScheduleSeat` (data-model.md › ScheduledIncursion.id, .incursionId, .startAt, .creatorId, .seats, .cancelled, .groupId, .updatedAt; ScheduleSeat.playerId, .nickname, .bond, .joinedAt, .checkedIn, .member, .locked) y el diccionario `ScheduleRefusal` (contracts/schedule-api.md)
- [X] T007 Crear `src/game/incursion/schedule/scheduleProtocol.ts` con `ScheduleAction`, peticiones, `ScheduleView`, `ScheduleResponse` (contracts/schedule-api.md › Petición y Respuesta) y `src/game/incursion/schedule/scheduleRequests.ts` que las valida (ids, `bond` entero ≥ 0 por data-model.md › ScheduleSeat.bond, `member` con `mayKnow`)
- [X] T008 [P] Tests de `scheduleRequests.ts` en `src/game/incursion/schedule/scheduleRequests.test.ts`
- [X] T009 Quitar la cola del protocolo: fuera `IncursionAction.Queue/Leave`, `QueueRequest`, `LeaveRequest`, `QueueView`, `QUEUE_MAX_MS`, `QUEUE_STALE_MS` en `src/game/incursion/online/protocol.ts`; fuera `Queued` y `pickGroup`, y `formGroup` recibe la hora de inicio y los miembros (sin cola) en `src/game/incursion/online/sharedIncursion.ts`; actualizar `requests.ts` y sus tests (`requests.test.ts`, `sharedIncursion.test.ts`)
- [X] T010 Partida 65: en `src/game/core/state.ts` quitar `incursionQueue`, añadir `incursionBonds: HeldBond[]` y `incursionCheckin: ScheduleCheckin | null` (data-model.md › Partida.incursionBonds, Partida.incursionCheckin) con los tipos `HeldBond` (data-model.md › HeldBond.scheduleId, .incursionId, .startAt, .amount, .refunded) y `ScheduleCheckin` (data-model.md › ScheduleCheckin.scheduleId, .incursionId, .startAt, .uid, .moveId, .locked) en `src/game/incursion/schedule/linkedSchedule.ts`, con su valor inicial, `SAVE_VERSION = 65`, y `monPlace` devuelve `MonPlace.Incursion` para `incursionCheckin.uid`
- [X] T011 Migración 64→65 en `src/game/core/saveMigration.ts` (quita `incursionQueue` sin gastar llave, añade los campos nuevos), reglas de `incursionId` en `RULES` (data-model.md › HeldBond.incursionId: una fianza con `incursionId` desconocido se devuelve al dinero al migrar; ScheduleCheckin.incursionId desconocido ⇒ `incursionCheckin: null`), y en `src/game/core/progressCarry.ts` sustituir `incursionQueue` por `incursionCheckin: 65`
- [X] T012 [P] Tests de la migración en `src/game/core/saveMigration.test.ts`: partida 64 con cola → 65 sin cola, llaves intactas, fianza de incursión desconocida devuelta, campos nuevos vacíos — Nota: los tests de la migración están en `schedule/scheduleSalvage.test.ts` (con `migrateSave`), para no agrandar `saveMigration.test.ts`.
- [X] T013 Sin cola en la partida: en `src/game/incursion/online/linkedIncursion.ts` quitar `IncursionQueue`, `enterQueue`, `leaveQueue`, `queueRequest`, `playQueueLocally`; `applyGroupView` se une al grupo si `incursionCheckin.scheduleId` coincide con la vista (gasta la llave y limpia `incursionCheckin`); en `src/game/incursion/incursionGame.ts` `incursionBlocker` deja de mirar la cola; actualizar `linkedIncursion.test.ts`
- [X] T014 [P] `holdMoney(s, amount)` (retiene sin contar para la misión de gastar) y `releaseMoney(s, amount)` en `src/game/core/wallet.ts` con tests en `src/game/core/wallet.test.ts`
- [X] T015 Servidor sin cola: en `worker/incursion.ts` quitar `queue` y `leave` (petición de cola ⇒ 400); en `worker/db/incursions.ts` quitar lo de `incursion_queue` y que `deleteIdleIncursions` borre también programaciones viejas (data-model.md › ScheduledIncursion.updatedAt con `SCHEDULE_TTL_MS`); actualizar `worker/incursion.test.ts`
- [X] T016 Cliente sin cola: en `src/net/incursionSync.ts` quitar la consulta de la cola; borrar `src/ui/incursion/IncursionQueueView.tsx` y su uso en `src/ui/incursion/IncursionScreen.tsx`; `IncursionPrep` sin servidor o en la gratuita llama a `startIncursion` («Jugar ya»)

**Checkpoint**: `npm run check` en verde; sin servidor las incursiones se juegan al momento con bots.

---

## Phase 3: User Story 1 — Programar una incursión y apuntarse (P1) 🎯 MVP

**Objetivo**: crear, aceptar, darse de baja y cancelar, con fianza, topes y tablón.

**Test independiente**: A programa para dentro de 30 min y B acepta: 2/5 en las dos, a cada uno le baja un 10 % el dinero; B sin Pokémon apto no puede (quickstart.md pasos 1–4).

### Tests

- [X] T017 [P] [US1] Tests de operaciones en `src/game/incursion/schedule/scheduledIncursion.test.ts`: crear (creador en el hueco 1), aceptar (orden, lleno, repetido), topes `MAX_CREATED`/`MAX_JOINED`, separación `SCHEDULE_GAP_MS`, baja solo en `Open` y no el creador, cancelar solo el creador hasta `CheckIn`
- [X] T018 [P] [US1] Tests de la partida en `src/game/incursion/schedule/linkedSchedule.test.ts`: retener fianza (data-model.md › Partida.incursionBonds), devolverla al darse de baja o cancelar, `gone` devuelve lo no devuelto, no se retiene dos veces por la misma programación, crear y aceptar exigen un Pokémon dentro del nivel de entrada (FR-009b)

### Implementación

- [X] T019 [US1] Operaciones `createSchedule`, `joinSchedule`, `leaveSchedule`, `cancelSchedule` que devuelven `ScheduleRefusal | null` en `src/game/incursion/schedule/scheduledIncursion.ts` (data-model.md › tabla de acciones)
- [X] T020 [P] [US1] `scheduleView(sched, playerId, now)` en `src/game/incursion/schedule/scheduleView.ts` (sin `bond` ajeno; contracts/schedule-api.md › ScheduleView) con tests en `scheduleView.test.ts`
- [X] T021 [US1] Partida en `src/game/incursion/schedule/linkedSchedule.ts`: `scheduleBlocker(s, incursionId)` (Pokémon apto, entrada), `holdBond` (sin duplicar: data-model.md › HeldBond.scheduleId, única), `applyScheduleView` para baja, cancelación y `gone` (data-model.md › HeldBond.amount, .refunded)
- [X] T022 [US1] `worker/db/schedules.ts`: cargar y guardar con versión, alta y baja en `incursion_schedule_seats`, tablón (no empezadas, por `start_at`) y «mías» por jugador
- [X] T023 [US1] Ruta `POST /api/incursion-schedule` en `worker/incursionSchedule.ts` (acciones `board`, `create`, `join`, `leave`, `cancel`, `sync`; reintento por versión; consultas sin cambios no escriben) y registrarla en `worker/index.ts`
- [X] T024 [P] [US1] Tests del Worker en `worker/incursionSchedule.test.ts` (con `node:sqlite`): crear, aceptar, lleno, topes, baja, cancelación, carrera de dos `join` al último hueco
- [X] T025 [P] [US1] Ranking de dinero con fianzas retenidas (suma de `incursionBonds[].amount` con `json_each`) en `worker/db/ranking.ts` y su test en `worker/ranking.test.ts`
- [X] T026 [US1] Cliente en `src/net/incursionScheduleApi.ts` (con `postJson` y límite de tiempo) y `src/net/incursionBoard.ts` (cada 60 s con la pestaña a la vista y al volver; aplica `applyScheduleView` con `act()`)
- [X] T027 [US1] Subpestañas en `src/ui/incursion/IncursionTabs.tsx` con `IconTabs` (Tablón, Mis incursiones, Programar; abre Mis incursiones si hay alguna, si no Tablón; sin servidor solo Programar) y `IncursionScreen.tsx` que las usa (contracts/ui.md)
- [X] T028 [P] [US1] `src/ui/incursion/ScheduleCard.tsx` y `ScheduleBoard.tsx`: hora local, n/5 con apodos, creador, nivel, llave, fianza que pagaría, motivo de no poder y «Aceptar» con `ConfirmDialog`; sin apodo, antes de aceptar se pide con `ui/raid/NicknameDialog`
- [X] T029 [P] [US1] `src/ui/incursion/MySchedules.tsx`: cuenta atrás, «Baja con devolución hasta HH:MM» / «Ya no puedes darte de baja», Darse de baja / Cancelar
- [X] T030 [P] [US1] `src/ui/incursion/ScheduleDialog.tsx`: franjas de 15 min hasta 7 días, fianza que se retendrá, motivo si no se puede, apodo con `ui/raid/NicknameDialog` si falta; y en `src/ui/incursion/IncursionList.tsx` el botón «Programar» (con servidor, no gratuita) o «Jugar ya»
- [X] T031 [US1] Estilos en `src/ui/incursion/incursion.css` (o `schedule.css` si pasa de 200 líneas); revisar en viewport móvil

**Checkpoint**: US1 jugable con dos navegadores (`npm run preview`).

---

## Phase 4: User Story 2 — Checkin en la sala y entrada con un Pokémon (P1)

**Objetivo**: sala 10 min antes, devolución de fianza, Pokémon marcado y «Fijar», arranque a la hora con reparto.

**Test independiente**: con una programación aceptada, a 10 min se entra, se recupera la fianza, se cambia de Pokémon, se fija y a la hora empieza con ese Pokémon; la fianza de quien no vino se reparte (quickstart.md pasos 5–9).

### Tests

- [X] T032 [P] [US2] Tests de arranque y reparto en `src/game/incursion/schedule/scheduleStart.test.ts`: grupo con los del checkin y Pokémon + bots, `legStarts = [startAt]`, nadie con Pokémon ⇒ cancelada; `bondShares` con 0, 1 y varios checkins y redondeo, también cuando se cancela por falta de Pokémon marcados, y sin reparto si cancela el creador
- [X] T033 [P] [US2] Tests de checkin, marcar y fijar en `src/game/incursion/schedule/scheduledIncursion.test.ts` (fase `CheckIn`, fijado no cambia, `member` fuera de nivel o con ataque que no sabe ⇒ `BadMember`)
- [X] T034 [P] [US2] Tests de la partida en `src/game/incursion/schedule/linkedSchedule.test.ts`: primer Pokémon de `byPickOrder` que pasa `incursionBlocker` con su primer ataque; devolución una sola vez; reparto suma `shares` y quita la fianza; Pokémon reservado y llave reservada

### Implementación

- [X] T035 [US2] `checkInSchedule`, `markSchedule`, `lockSchedule` en `src/game/incursion/schedule/scheduledIncursion.ts` (data-model.md › ScheduleSeat.checkedIn, .member, .locked) — Nota: en `schedule/scheduleRoom.ts` (aparte, para que `scheduledIncursion.ts` no pase de 200 líneas).
- [X] T036 [US2] `startSchedule(sched, now, rng)` y `bondShares(sched)` en `src/game/incursion/schedule/scheduleStart.ts` (usa `formGroup` y `fillWithBots`; data-model.md › ScheduledIncursion.groupId, .cancelled; el reparto se hace también al cancelar por falta de Pokémon marcados, data-model.md › Reparto)
- [X] T037 [US2] Partida en `src/game/incursion/schedule/linkedSchedule.ts`: `checkIn(s, …)` crea `incursionCheckin` (data-model.md › Partida.incursionCheckin; ScheduleCheckin.uid y .moveId null sin llave o sin Pokémon disponible) con el Pokémon por defecto, `markMon`, `lockMon`, `memberRequest` (instantánea como el antiguo `queueRequest`) y `applyScheduleView` con devolución y `shares` (también si llega cancelada por `nobody`: contracts/schedule-api.md › ScheduleView.shares)
- [X] T038 [P] [US2] Llave reservada: no se puede ofrecer la última llave de la incursión con checkin en `src/game/trade/tradeGive.ts` (y su test) — Nota: sin cambios de código: las llaves no son un bien de intercambio (`GoodKind`) y el Pokémon marcado ya está fuera del rancho (`MonPlace.Incursion`), así que nada puede gastarlos; la única otra forma de usar la llave («Jugar ya») queda bloqueada con el checkin (`incursionBlocker`).
- [X] T039 [US2] Worker: acciones `checkin`, `mark`, `lock` y arranque perezoso (primera petición tras `startAt` guarda el grupo en `incursion_groups` y `groupId`, una sola vez) en `worker/incursionSchedule.ts`; respuesta `{ group, schedule }`
- [X] T040 [P] [US2] Tests del Worker en `worker/incursionSchedule.test.ts`: checkin fuera de plazo, arranque perezoso idéntico con dos peticiones, nadie con checkin ⇒ cancelada
- [X] T041 [US2] Cliente: en `src/net/incursionBoard.ts` (o `src/net/scheduleRoomSync.ts` si crece) consulta cada 3 s en la sala y, al recibir `group`, `applyGroupView` y pasa a la sincronización de hoy (`src/net/incursionSync.ts`)
- [X] T042 [US2] `src/ui/incursion/ScheduleRoom.tsx`: cuenta atrás, 5 huecos (apodo, sprite, Nv., candado, «sin checkin»), aviso si falta llave (sin llave no se puede marcar hasta conseguirla), Cambiar con `MonPicker`/`MovePicker`, Fijar con confirmación; «Entrar a la sala» de `MySchedules.tsx` hace el checkin; `IncursionScreen.tsx` muestra la sala si hay `incursionCheckin`
- [X] T043 [P] [US2] `src/ui/incursion/BondNote.tsx`: fianza retenida, devuelta y reparto recibido (también en `IncursionSummary.tsx`) — Nota: en lugar de `BondNote`, «Mis incursiones» muestra «Terminadas» con qué pasó con la fianza (`scheduleText.ts › settledText`).

**Checkpoint**: recorrido completo de quickstart.md con servidor.

---

## Phase 5: User Story 3 — Aviso de incursión programada (P2)

**Objetivo**: aviso a todos los suscritos al programar; aviso de sala abierta a los apuntados; abrir la subpestaña correcta.

**Test independiente**: con dos móviles suscritos, uno programa y el otro recibe el aviso; si acepta, recibe el de sala abierta.

- [X] T044 [P] [US3] `src/game/incursion/schedule/schedulePushes.ts` con los avisos de contracts/push.md (nueva, sala abierta, cancelada; con destino `go`) y tests en `schedulePushes.test.ts`
- [X] T045 [US3] `cancelJobs(db, playerIds, topic, key)` en `worker/push/store.ts` y su test en `worker/push/push.test.ts`
- [X] T046 [US3] Programar y borrar avisos en `create`, `join`, `leave` y `cancel` de `worker/incursionSchedule.ts` (aviso nuevo a `'all'` salvo el creador; sala abierta con `dueAt = startAt − CHECKIN_OPEN_MS`)
- [X] T047 [P] [US3] Destino del aviso: `public/sw-notifications.js` abre o enfoca la app con `?go=…` y `src/ui/shared/navigation.ts` lleva a Ruta › Incursiones en Tablón o Mis incursiones (FR-032)
- [X] T048 [P] [US3] Interruptor «Incursiones programadas» en `src/ui/settings/NotificationsDialog.tsx`

---

## Phase 6: User Story 4 — Ver los premios en el anuncio (P2)

**Objetivo**: los premios de cada sala y el final, en la tarjeta del tablón y en Mis incursiones.

**Test independiente**: la tarjeta lista los mismos premios que la ficha de información de la incursión.

- [X] T049 [US4] Sacar la lista de premios de `src/ui/incursion/IncursionInfo.tsx` a `src/ui/incursion/IncursionPrizes.tsx` (premios por sala y final) y usarla en `IncursionInfo.tsx` — Nota: `IncursionInfo` no listaba premios; `IncursionPrizes.tsx` es nuevo (salas de combate en total y premio final con su probabilidad).
- [X] T050 [US4] Mostrar `IncursionPrizes` (plegada, «Premios ▸») en `src/ui/incursion/ScheduleCard.tsx`

---

## Phase 7: Polish & transversal

- [X] T051 [P] Documentación: `docs/incursiones.md` (Decisiones tomadas, Recorrido del jugador, Llaves y premios, Números, protocolo sin cola), `docs/diseno.md` (fila Incursiones de «Sistemas»), `docs/servidor.md` (tablas nuevas), `docs/arquitectura.md` si cambia el flujo
- [X] T052 [P] Tabla de `CLAUDE.md`: fila de incursiones con `schedule/`, `incursionSchedule.ts`, `db/schedules.ts`, pantallas nuevas y sin la cola
- [X] T053 [P] Anuncio de la novedad en `src/data/announcements.ts`
- [X] T054 Tutoriales: actualizar la guía de incursiones en `src/ui/tutorials/guides/`, escenario de sala en `scripts/tutorial-shots/demoSave` y rehacer capturas con `npm run shots`
- [X] T055 Revisión con la skill `revision-limpia` (ficheros < 200 líneas, constantes, sin código muerto de la cola) — Nota: ficheros nuevos < 200 líneas; `state.ts` (205) y `saveMigration.ts` (239) ya pasaban de 200 antes y crecen 3 líneas cada uno.
- [X] T056 `npm run check` y `npm run smoke` en verde; recorrido manual de quickstart.md con `npm run preview` en viewport móvil, comprobando que el aviso de incursión nueva llega en menos de 2 min (SC-002) y que empieza a su hora (SC-004)

---

## Dependencies & Execution Order

- **Setup (T001–T003)** → **Foundational (T004–T016)** → historias.
- **US1 (T017–T031)**: tras Foundational. Es el MVP.
- **US2 (T032–T043)**: necesita US1 (no hay sala sin programación aceptada).
- **US3 (T044–T048)**: necesita las acciones del Worker de US1 (T023); el aviso de sala abierta tiene sentido con US2.
- **US4 (T049–T050)**: solo necesita `ScheduleCard` (T028).
- **Polish (T051–T056)**: al final.

Dentro de cada historia: tests → reglas puras → partida → Worker → cliente → pantallas.

## Parallel Examples

- Foundational: T004 + T005, T008, T012, T014 a la vez (ficheros distintos); T009 → T013 → T015/T016 en orden.
- US1: T017, T018, T020, T024, T025 a la vez; luego T028, T029, T030 a la vez.
- US2: T032, T033, T034, T038, T040 a la vez; T043 en paralelo con T042.
- US3: T044, T047, T048 a la vez; T045 → T046.

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 → se puede programar, aceptar, darse de baja y cancelar con fianza. Aún no se
   juega: no desplegar solo con esto (sin cola y sin sala no habría incursiones con otros).
2. **Primer despliegue**: + US2 (sala y arranque) → el modo completo sustituye a la cola.
3. **+ US3 y US4** (avisos y premios), que pueden ir en el mismo despliegue.
4. Polish antes de hacer push a `main` (despliega solo).

## Phase 8: Convergence

- [X] T057 CRITICAL: Añadir tests de `checkinMonBlocker`, `markCheckinMon` y `lockCheckinMon` (no cambia si está fijado, rechaza un Pokémon fuera del rancho o sin llave, acepta el ya marcado, fijar sin Pokémon no hace nada) en `src/game/incursion/schedule/scheduleCheckin.test.ts` per Constitution VII (missing)
- [X] T058 Que el checkin no caduque mientras el servidor pueda tener el grupo: en `src/game/incursion/schedule/linkedSchedule.ts › expireSchedules`, quitar `incursionCheckin` solo cuando el servidor diga que se decidió sin grupo para él o que ya no existe, o pasado `SCHEDULE_TTL_MS` (no `CHECKIN_STALE_MS`, 1 h, que deja fuera del grupo a quien vuelve más tarde con la app cerrada); ajustar su test, data-model.md y `docs/incursiones.md` per spec Edge Cases «La app cerrada a la hora de comienzo» (contradicts)
- [X] T059 Sustituir las claves sueltas `'incursions/board'` y `'incursions/mine'` de `PUSH_SPOTS` en `src/ui/shared/navigation.ts` por el diccionario `PushGo` de `game/incursion/schedule/schedulePushes.ts` per Constitution VI (contradicts)
- [X] T060 Proponer con `/speckit-constitution` la enmienda (PATCH) que cambia `IncursionQueue` por `ScheduleCheckin` en la lista de lo que va a medias del Principio IV de `.specify/memory/constitution.md` per Constitution VIII (partial)
