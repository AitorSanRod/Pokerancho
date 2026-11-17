# Data Model: Incursiones programadas

Tipos en `src/game/incursion/schedule/` salvo que se diga otra cosa. Constantes de balance con nombre y `/** */`.

## Constantes (`schedule/scheduleRules.ts`)

| Constante | Valor | Efecto |
|---|---|---|
| `BOND_FRACTION` | 0.1 | Parte del dinero que se retiene como fianza (hacia abajo, ₽ enteros) |
| `SLOT_MS` | 15 min | Franjas de hora de comienzo (:00, :15, :30, :45) |
| `MIN_LEAD_MS` | 15 min | Antelación mínima al programar |
| `MAX_LEAD_MS` | 7 días | Antelación máxima |
| `CHECKIN_OPEN_MS` | 10 min | La sala abre esto antes del comienzo |
| `LEAVE_DEADLINE_MS` | 1 h | Hasta esto antes de abrir la sala se puede dar de baja con devolución |
| `MAX_CREATED` | 3 | Programadas creadas pendientes por jugador |
| `MAX_JOINED` | 5 | Aceptadas pendientes por jugador (sin contar las creadas) |
| `SCHEDULE_GAP_MS` | 45 min | Separación mínima entre los comienzos de dos incursiones de un jugador |
| `SCHEDULE_TTL_MS` | 7 días | Lo que el servidor guarda una programación ya empezada o cancelada; sin noticias suyas, también lo que dura en la partida un checkin o una fianza sin liquidar |

## ScheduledIncursion (servidor; tabla `incursion_schedules`, JSON con versión)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Hex al azar, como los grupos |
| `incursionId` | `IncursionId` | No gratuita (`needsKey`) |
| `startAt` | number (ms) | Múltiplo de `SLOT_MS` |
| `creatorId` | string | `playerId` del creador; ocupa `seats[0]` |
| `seats` | `ScheduleSeat[]` | 1–5, por orden de aceptación |
| `cancelledBy` | `ScheduleCancel` \| null | `creator` (antes de abrir la sala) o `nobody` (nadie con Pokémon marcado a la hora); null si no se canceló |
| `groupId` | string \| null | Grupo formado al empezar (`incursion_groups`) |
| `updatedAt` | number | Para la limpieza |

### ScheduleSeat

| Campo | Tipo | Notas |
|---|---|---|
| `playerId`, `nickname` | string | Identidad de raids (`net/identity.ts`) |
| `bond` | number | Fianza declarada por el móvil (≥ 0, entera) |
| `joinedAt` | number | Orden de los huecos |
| `checkedIn` | boolean | Hizo el checkin dentro de la sala |
| `member` | `MemberState` \| null | Pokémon y ataque marcados (instantánea, con `hpFraction`) |
| `locked` | boolean | Ha pulsado «Fijar» |

### Fases (`schedulePhase(sched, now)`)

```
Open ──(startAt − CHECKIN_OPEN_MS − LEAVE_DEADLINE_MS)──► Committed ──(startAt − CHECKIN_OPEN_MS)──► CheckIn ──(startAt)──► Started
  │                                                         │
  └── cancelar (creador) ──► Cancelled ◄────────────────────┘ (cancelar solo hasta CheckIn)
                                         CheckIn ──(startAt, nadie con checkin y Pokémon)──► Cancelled
```

| Acción | Fases en que vale | Validación |
|---|---|---|
| Crear | — | Franja válida y en plazo; topes; separación; incursión con llave; el móvil comprueba Pokémon apto (FR-009b) |
| Aceptar | Open, Committed | Hueco libre; no está ya; topes; separación |
| Darse de baja | Open | No es el creador |
| Cancelar | Open, Committed | Es el creador |
| Checkin | CheckIn | Está apuntado (sin llave también: recupera la fianza, pero no puede marcar) |
| Marcar Pokémon/ataque | CheckIn | Checkin hecho, no fijado; `mayKnow` del ataque; nivel dentro de la entrada; el móvil comprueba la llave |
| Fijar | CheckIn | Checkin hecho y Pokémon marcado |

### Al empezar (`startSchedule(sched, now, rng)` → `SharedIncursion | null`)

- Entran los huecos con `checkedIn && member`; los demás huecos, bots (`fillWithBots`).
- `legStarts = [startAt]`; el grupo se guarda en `incursion_groups` y `groupId` en la programación.
- Ninguno ⇒ `cancelledBy = nobody`, sin grupo (y sin gastar llaves); el reparto se hace igual.

### Reparto (`bondShares(sched)` → `Record<playerId, number>`)

- Se calcula a la hora de comienzo, haya grupo o se cancele por falta de Pokémon marcados.
- `forfeited` = suma de `bond` de los huecos sin `checkedIn`.
- Cada hueco con `checkedIn` recibe `floor(forfeited / nCheckedIn)`; con 0 checkins, nadie (se pierde).
- Solo una programación cancelada por el creador no reparte: todos recuperan su `bond`.

## Partida (`GameState`, SAVE_VERSION 64 → 65)

| Campo | Tipo | Notas |
|---|---|---|
| `incursionBonds` | `HeldBond[]` | Nuevo; vacío al empezar. Una por programación creada o aceptada sin liquidar |
| `incursionCheckin` | `ScheduleCheckin \| null` | Nuevo; null al empezar. Como mucho uno (la sala abierta) |
| `incursionQueue` | — | **Se quita.** Migración: se descarta sin gastar llave |

### HeldBond (fianza retenida)

| Campo | Tipo | Notas |
|---|---|---|
| `scheduleId` | string | Programación del servidor; única dentro de `incursionBonds` |
| `incursionId` | `IncursionId` | Validado en `RULES` (si no existe, la fianza se devuelve al migrar) |
| `startAt` | number (ms) | Para mostrarla y ordenar |
| `amount` | number | Entero ≥ 0, `floor(money × BOND_FRACTION)` al retener |
| `refunded` | boolean | Ya devuelta por el checkin (queda hasta cobrar el reparto) |

### ScheduleCheckin (checkin hecho, en la sala)

| Campo | Tipo | Notas |
|---|---|---|
| `scheduleId` | string | La misma que su `HeldBond` |
| `incursionId` | `IncursionId` | Validado en `RULES` |
| `startAt` | number (ms) | Fin de la sala |
| `uid` | string \| null | Pokémon marcado; null si no tiene llave o ningún Pokémon disponible. Si no es null, `MonPlace.Incursion` y una llave reservada |
| `moveId` | string \| null | Ataque marcado; null si `uid` es null |
| `locked` | boolean | Ha fijado; solo con `uid` |

Reglas de la partida (`schedule/linkedSchedule.ts` las fianzas y `schedule/scheduleCheckin.ts` el checkin, puras; la sala en el servidor, en `schedule/scheduleRoom.ts`):

- Retener: al leer una vista en `Open`/`Committed` con hueco y sin fianza apuntada, `holdMoney(s, you.bond)` (como mucho lo que tenga, sin misión) y la apunta.
- `applyScheduleView(s, view)`: si `view.you.checkedIn` y la fianza no está `refunded` ⇒ devuelve `amount`; si
  `view.shares` llega (a la hora de comienzo: empezada o cancelada por `nobody`) ⇒ suma su parte y quita la fianza; si cancelada por el creador o baja ⇒ devuelve y
  quita; si `gone` ⇒ devuelve lo no devuelto y quita (R3).
- `applyGroupView` se une al grupo si `incursionCheckin.scheduleId` coincide (en lugar de `incursionQueue`), gasta la
  llave y limpia `incursionCheckin`.

Migración (`core/saveMigration.ts`, con `schedule/scheduleSalvage.ts`): sin paso propio (el rescate campo a campo ya
quita `incursionQueue` y pone `incursionBonds: []`, `incursionCheckin: null`); `RULES` rescata las fianzas válidas y
las de una incursión desconocida vuelven al dinero (`refundLostBonds`); el checkin va en `IN_PROGRESS`; `CARRIED_SINCE.incursionQueue` se sustituye por
`incursionCheckin: 65`; `CARRIED_SINCE.incursion` no cambia (la incursión en curso se juega igual).
