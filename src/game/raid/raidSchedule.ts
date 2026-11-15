// El calendario de los jefes de la pestaña Raids, igual para todos y sin guardar nada: la hora real se parte en ciclos
// de RAID_CYCLE_MS. Cada ciclo empieza con la sala abierta (RAID_LOBBY_MS: se entra y se elige ataque) y sigue con la
// pelea (RAID_FIGHT_MS como mucho); al acabar el ciclo abre la sala del siguiente jefe.

/** Milisegundos reales que la sala está abierta antes de que empiece la pelea */
export const RAID_LOBBY_MS = 30 * 60_000
/** Milisegundos reales que dura como mucho la pelea: pasado este tiempo ya no empieza otro turno y el jefe se escapa */
export const RAID_FIGHT_MS = 30 * 60_000
/** Milisegundos reales de un ciclo entero: sala y pelea */
export const RAID_CYCLE_MS = RAID_LOBBY_MS + RAID_FIGHT_MS

/** En qué parte del ciclo se está: con la sala abierta o con la pelea en marcha */
export const RaidStage = { Lobby: 'lobby', Fight: 'fight' } as const
export type RaidStage = (typeof RaidStage)[keyof typeof RaidStage]

/** El ciclo en que cae la hora real `now` */
export const cycleAt = (now: number): number => Math.floor(now / RAID_CYCLE_MS)

/** Hora real a la que abre la sala del ciclo */
export const lobbyStart = (cycle: number): number => cycle * RAID_CYCLE_MS

/** Hora real a la que empieza la pelea del ciclo */
export const fightStart = (cycle: number): number => lobbyStart(cycle) + RAID_LOBBY_MS

/** Hora real a la que acaba el ciclo (y abre la sala del siguiente) */
export const cycleEnd = (cycle: number): number => lobbyStart(cycle + 1)

/** La parte del ciclo `cycle` a la hora `now` (antes de empezar, la sala; después de acabar, la pelea) */
export const stageAt = (cycle: number, now: number): RaidStage => (now < fightStart(cycle) ? RaidStage.Lobby : RaidStage.Fight)
