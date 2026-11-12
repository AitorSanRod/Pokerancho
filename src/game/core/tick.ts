import { refreshMissions } from '../collection/missionPicks'
import { advanceIncursion } from '../incursion/incursionGame'
import { advanceRaid } from '../raid/raid'
import { roomAt, ROOM_KEYS } from '../raid/online/linkedRoom'
import { settleRaidCrit } from '../raid/raidCrit'
import { advanceRun } from '../run/run'
import { advanceExpeditions } from '../team/expedition'
import { advanceTower } from '../tower/tower'
import { restInRanch } from '../team/ranch'
import type { GameState } from './state'

/** El progreso con la app cerrada se calcula hasta este máximo */
export const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000

/** El toque crítico de las salas en las que está el jugador, con la ronda que se veía (antes de jugar la siguiente) */
function settleRaidCrits(s: GameState, now: number) {
  for (const key of ROOM_KEYS) {
    const raid = roomAt(s, key)
    if (raid) settleRaidCrit(s, raid, now)
  }
}

/** Avanza el juego hasta `now`: la ruta en curso, las expediciones, los jefes comunitarios, la incursión, el descanso del rancho y las misiones del día */
export function tick(s: GameState, now: number) {
  const dt = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS)
  settleRaidCrits(s, now)
  s.lastTick = now
  const minutes = (dt / 60000) * s.timeScale

  if (s.run) advanceRun(s, dt)
  advanceExpeditions(s, minutes)
  advanceRaid(s, dt * s.timeScale)
  advanceIncursion(s, now)
  advanceTower(s, dt)
  restInRanch(s, minutes)
  refreshMissions(s, now)
}
