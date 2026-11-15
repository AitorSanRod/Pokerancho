import type { GameState } from '../core/state'
import { elapsedAt, msLeftAt, playSetup, switchPlayerMove } from '../run/battleReplay'
import { towerActive, towerMon } from './tower'
import { knowsTowerMove, towerMove } from './towerMoves'

// Cambiar el ataque de la torre en cualquier momento de la subida: entre pisos, para el siguiente; en pleno combate,
// desde el siguiente ataque de su Pokémon (el piso se vuelve a jugar con los mismos dados: lo ya visto no cambia).

export function setTowerMove(s: GameState, moveId: string, now: number) {
  const t = s.tower
  const mon = towerMon(s)
  if (!t || !towerActive(s) || !mon || !knowsTowerMove(mon, moveId)) return
  t.moveId = moveId
  if (t.battle && t.lastBattle && t.battleMsLeft > 0) switchMidFloor(s, now)
}

function switchMidFloor(s: GameState, now: number) {
  const t = s.tower!
  const record = t.lastBattle!
  const elapsed = elapsedAt(record, t.battleMsLeft, s.lastTick, now)
  switchPlayerMove(t.battle!, record, elapsed, towerMove(towerMon(s)!, t.moveId))
  const result = playSetup(t.battle!)
  Object.assign(record, { events: result.events, outcome: result.outcome })
  t.hp = result.playerHp
  t.battleMsLeft = msLeftAt(record, elapsed, s.lastTick, now)
}
