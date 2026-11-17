import { refreshMissions } from '../collection/missionPicks'
import { advanceIncursion } from '../incursion/incursionGame'
import { expireSchedules } from '../incursion/schedule/linkedSchedule'
import { advanceRaids } from '../raid/raidPlay'
import { advanceRun } from '../run/run'
import { advanceExpeditions } from '../team/expedition'
import { advanceTower } from '../tower/tower'
import { restInRanch } from '../team/ranch'
import type { GameState } from './state'

/** El progreso con la app cerrada se calcula hasta este máximo */
export const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000

/**
 * Combates que la pantalla pide que esperen (p. ej. hasta tener la imagen del rival): mientras, su tiempo no corre y
 * el combate se ve entero al empezar. Con la app cerrada no espera nadie
 */
export interface BattleHold {
  run: boolean
  tower: boolean
}

const NO_HOLD: BattleHold = { run: false, tower: false }

/** Avanza el juego hasta `now`: la ruta en curso, las expediciones, los jefes comunitarios, la incursión, el descanso del rancho y las misiones del día */
export function tick(s: GameState, now: number, hold: BattleHold = NO_HOLD) {
  const dt = Math.min(Math.max(0, now - s.lastTick), MAX_OFFLINE_MS)
  s.lastTick = now
  const minutes = (dt / 60000) * s.timeScale

  if (s.run && !(hold.run && s.run.battleMsLeft > 0)) advanceRun(s, dt)
  advanceExpeditions(s, minutes)
  advanceRaids(s, now)
  advanceIncursion(s, now)
  expireSchedules(s, now)
  if (!(hold.tower && s.tower && s.tower.battleMsLeft > 0)) advanceTower(s, dt)
  restInRanch(s, minutes)
  refreshMissions(s, now)
}
