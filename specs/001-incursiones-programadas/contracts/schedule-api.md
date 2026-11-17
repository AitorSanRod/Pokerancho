# Contrato: `POST /api/incursion-schedule`

Protocolo en `src/game/incursion/schedule/scheduleProtocol.ts` y validación en `scheduleRequests.ts` (comunes al móvil
y al Worker). Servidor en `worker/incursionSchedule.ts` + `worker/db/schedules.ts`. Como `/api/incursion`: JSON, como
mucho 8 KB, reintento si otro escribió la misma programación a la vez (versión), toda petición con límite de tiempo
(`net/apiFetch.ts`).

## Petición

Todas llevan `playerId` y `nickname`.

| `action` | Campos | Efecto |
|---|---|---|
| `board` | — | Lista: programaciones no empezadas ni canceladas + las del jugador (también empezadas sin liquidar, ver `mine`) |
| `create` | `incursionId`, `startAt`, `bond` | Crea con el jugador en el hueco 1 |
| `join` | `scheduleId`, `bond` | Ocupa un hueco |
| `leave` | `scheduleId` | Baja (solo en `Open`, no el creador) |
| `cancel` | `scheduleId` | Cancela (creador, `Open`/`Committed`) |
| `sync` | `scheduleId` | Vista de una programación (sala) |
| `checkin` | `scheduleId` | Checkin (`CheckIn`) |
| `mark` | `scheduleId`, `incursionId`, `member: MemberState` | Pokémon y ataque marcados (no fijado) |
| `lock` | `scheduleId` | Fijar |

## Respuesta

```ts
type ScheduleResponse =
  | { board: { open: ScheduleView[]; mine: ScheduleView[]; serverNow: number } }
  | { schedule: ScheduleView; group?: GroupView } // create, join, leave, cancel, sync, checkin, mark, lock; con group si ya empezó y está dentro
  | { refused: ScheduleRefusal }              // regla no cumplida (el móvil ya lo comprueba antes; carreras)
  | { gone: true }                            // no existe o ya no está en ella
```

`ScheduleView`: `id`, `incursionId`, `startAt`, `creator` (apodo), `yoursToCancel`, `seats` (apodo, `checkedIn`,
`locked`, especie, nivel y shiny marcados; sin `bond` ajeno), `phase`, `you` (`{ bond, checkedIn, locked, memberId,
moveId } | null`), `shares` (la parte del
reparto de quien pregunta, desde la hora de comienzo: empezada o cancelada por `nobody`), `cancelledBy` (`creator` | `nobody` | null), `serverNow`.

`ScheduleRefusal` (diccionario `as const`): `Full`, `AlreadyIn`, `NotIn`, `TooManyCreated`, `TooManyJoined`, `Overlap`,
`BadSlot`, `NotCreator`, `WrongPhase`, `Locked`, `BadMember`.

## Reglas del servidor

- Toda regla sale de `schedule/` (fases, topes, separación, `mayKnow`, nivel de entrada); el Worker solo lee y guarda.
- `create`/`join`/`leave`/`cancel` programan o borran avisos (ver [push.md](push.md)).
- Primera `sync`/`board` tras `startAt`: `startSchedule` → guarda el grupo y `groupId` (una sola vez, con versión).
- Consultas sin cambios no escriben.
- `/api/incursion` pierde `queue` y `leave` (400 «Petición no válida»); `sync`, `move`, `ready`, `vote`, `tap`, `pick`
  siguen igual sobre `groupId`.

## D1 (migración `0019_incursion_schedules.sql`)

```
incursion_schedules (id TEXT PK, data TEXT, version INTEGER, start_at INTEGER, updated_at INTEGER)
incursion_schedule_seats (schedule_id TEXT, player_id TEXT, PRIMARY KEY (schedule_id, player_id))  -- topes y «mías» sin leer todo
DROP TABLE incursion_queue
```

Índices: `start_at` (tablón) y `player_id` (mías). La limpieza del cron borra las de `updated_at` más viejo que
`SCHEDULE_TTL_MS` tras empezar o cancelar.
