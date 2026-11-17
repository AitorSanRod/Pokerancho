# Implementation Plan: Incursiones programadas

**Branch**: `001-incursiones-programadas` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-incursiones-programadas/spec.md`

## Summary

Sustituir la cola automática de las incursiones con otros jugadores por **incursiones programadas**: un jugador elige
incursión y franja de 15 min, ocupa un hueco y deja una fianza del 10 % de su dinero; se avisa a todos los suscritos;
otros la aceptan desde un tablón con los premios a la vista; 10 min antes se abre la sala del checkin (devuelve la
fianza, marca el primer Pokémon apto, «Fijar») y a la hora el servidor forma el grupo con quien hizo el checkin y bots,
repartiendo las fianzas de los ausentes. Desde ahí, la incursión es la de hoy. Sin servidor se sigue jugando al momento
con bots.

Enfoque: reglas puras nuevas en `src/game/incursion/schedule/` compartidas con el Worker; la programación se guarda en
D1 como JSON con versión (patrón de `incursion_groups`); fases calculadas con la hora y arranque perezoso (sin cron);
la fianza vive en la partida y cada móvil la liquida al leer la vista del servidor. Detalle en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7 (Node `>=22.13`)

**Primary Dependencies**: React 19, Vite 8 (PWA), Vitest, oxlint; Worker de Cloudflare con D1; push VAPID. Sin
dependencias nuevas.

**Storage**: partida en `localStorage` (y en la nube con cuenta); D1: tabla nueva `incursion_schedules` (+ índice de
huecos por jugador), se borra `incursion_queue`.

**Testing**: Vitest (`*.test.ts` junto a cada fichero de `src/game`; `worker/*.test.ts` con `node:sqlite`); UI con
`npm run dev` en viewport móvil y `npm run smoke`.

**Target Platform**: PWA móvil en vertical; Worker de Cloudflare (plan gratuito).

**Project Type**: juego web (cliente PWA + servidor Worker que comparten `src/game` y `src/data`).

**Performance Goals**: aviso de incursión nueva en < 2 min (cron de 1 min ya existente); arranque a la hora ± 1 min
(perezoso, con `legStarts = startAt`); tablón refrescado cada 60 s, sala cada 3 s.

**Constraints**: plan gratuito (consultas sin cambios no escriben; 1 inserción de aviso por suscriptor y
programación); sin anti-trampas; partidas reales que migrar; móviles sin actualizar.

**Scale/Scope**: decenas de jugadores; ≤ 3 programaciones creadas por jugador; 5 huecos por programación.

## Constitution Check

*GATE: antes de la fase 0 y otra vez tras el diseño.*

| Principio | Cumple | Cómo |
|---|---|---|
| I. Lo que existe se preserva y se negocia | ✅ | «Choques con el diseño actual» en la spec, aprobados por el usuario (2026-11-17). R5 afina dos casos límite (llave y Pokémon reservados durante la sala) con el mismo resultado visible: se comunica al usuario |
| II. Identidad idle y móvil | ✅ | Se decide antes (Pokémon y ataque en la sala; luego automático). Pantallas con `IconTabs`, toques de 44 px, iconos de objetos (sin emojis: el candado es un icono, no 🔒) |
| III. Capas y lógica pura | ✅ | Reglas en `game/incursion/schedule/` con `rng` inyectable; Worker y UI solo leen y guardan / llaman `act()` |
| IV. La partida nunca se pierde | ✅ | `SAVE_VERSION` 65 con paso de migración y test; `RULES` para los ids; `CARRIED_SINCE`; la cola guardada se descarta sin gastar llave; fianzas sin registro se devuelven |
| V. Se juega sin servidor | ✅ | Sin servidor, «Jugar ya» con bots; peticiones con límite de tiempo; migración nueva en `migrations/`; consultas sin cambios no escriben |
| VI. Código limpio | ✅ | Ficheros < 200 líneas (carpeta `schedule/` y componentes nuevos); constantes con nombre; diccionarios `as const` (`SchedulePhase`, `ScheduleAction`, `ScheduleRefusal`) |
| VII. Tests sin fijar contenido | ✅ | Tests leen las constantes y usan `test-map.ts`; `seqRng` para el arranque |
| VIII. Documentación viva | ✅ | `docs/incursiones.md`, `docs/diseno.md`, `docs/servidor.md`, tabla de `CLAUDE.md`, anuncio y Tutoriales en el mismo cambio |

Re-check tras la fase 1: sin violaciones; no hace falta «Complexity Tracking».

## Project Structure

### Documentation (this feature)

```text
specs/001-incursiones-programadas/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── schedule-api.md
│   ├── push.md
│   └── ui.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/game/incursion/schedule/          # NUEVO, puro, compartido con el Worker
├── scheduleRules.ts (+ .test)        # constantes, franjas, fases, topes, separación, fianza
├── scheduledIncursion.ts (+ .test)   # ScheduledIncursion y operaciones: crear, aceptar, baja, cancelar, checkin, marcar, fijar
├── scheduleStart.ts (+ .test)        # arrancar: grupo con checkins + bots; reparto de fianzas (bondShares)
├── scheduleProtocol.ts               # peticiones, vistas, ScheduleRefusal
├── scheduleRequests.ts (+ .test)     # validar peticiones
├── scheduleView.ts (+ .test)         # vista de una programación para un jugador
├── schedulePushes.ts (+ .test)       # avisos (como raidPushes.ts)
└── linkedSchedule.ts (+ .test)       # en la partida: retener, devolver, liquidar, checkin, reservas
src/game/incursion/online/linkedIncursion.ts   # sin cola: se une al grupo por incursionCheckin
src/game/incursion/online/sharedIncursion.ts   # formGroup recibe la hora de inicio; fuera pickGroup/Queued
src/game/incursion/online/protocol.ts          # fuera Queue/Leave/QueueView
src/game/incursion/incursionGame.ts            # incursionBlocker sin cola; «Jugar ya»
src/game/core/{state,saveMigration,progressCarry,wallet,push}.ts
src/game/trade/                                # la llave reservada no se ofrece
src/net/{incursionScheduleApi,incursionBoard,incursionSync}.ts
src/ui/incursion/{IncursionScreen,IncursionTabs,ScheduleBoard,ScheduleCard,MySchedules,ScheduleDialog,ScheduleRoom,BondNote,IncursionPrizes,IncursionList}.tsx
src/ui/settings/NotificationsDialog.tsx, src/ui/shared/navigation.ts, public/sw-notifications.js
worker/{incursionSchedule.ts (+ .test), incursion.ts, index.ts, scheduled.ts}
worker/db/{schedules.ts, incursions.ts, ranking.ts}, worker/push/store.ts (cancelJobs)
migrations/0019_incursion_schedules.sql
```

**Structure Decision**: la del proyecto (`data → game → store → net → ui`, `worker → game → data`), con la carpeta de
dominio nueva `game/incursion/schedule/` junto a `online/`.

## Phases (resumen para /speckit-tasks)

1. **Reglas puras** (`schedule/`): constantes, fases, operaciones, arranque y reparto, con tests.
2. **Partida**: `GameState` 65, migración, `holdMoney`, `linkedSchedule`, reservas de Pokémon y llave, quitar la cola.
3. **Servidor**: migración 0019, `db/schedules.ts`, ruta, arranque perezoso, avisos y `cancelJobs`, ranking con
   fianzas, limpieza; `/api/incursion` sin cola.
4. **Cliente de red**: API, tablón cada 60 s, sala cada 3 s, aplicar vistas.
5. **Pantallas**: subpestañas, tablón, mis incursiones, programar, sala, avisos con destino, ajustes.
6. **Documentación, anuncio y Tutoriales**.

## Complexity Tracking

Sin violaciones.
