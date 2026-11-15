import type { Move } from '../../data/moves'
import { species } from '../../data/species'
import { activeMon, type GameState, type OwnedMon } from '../core/state'
import { towerMove, towerMoveChoices } from '../tower/towerMoves'
import { switchPlayerMove } from './battleReplay'
import { battleElapsed, critOrdinals, replayBattle } from './tapCrit'

// El ataque con el que lucha el Pokémon en la ruta (salvajes, jefes, entrenadores y líderes): uno de daño de su
// repertorio de incursión, como en la torre. Se elige al salir y se cambia cuando se quiera; en pleno combate vale
// desde su siguiente ataque (el combate se vuelve a jugar con los mismos dados: lo ya visto no cambia).

/** Peso de un ataque de su tipo al elegir el de salida (el mismo bonus que en el daño) */
const STAB_SCORE = 1.5

/** Ataque con el que sale si no se elige otro: el de más potencia, contando el bonus por ser de su tipo */
export function defaultRouteMove(mon: OwnedMon): string {
  const types = species(mon.speciesId).types
  const score = (id: string) => {
    const mv = towerMove(mon, id)
    return mv.power * (types.includes(mv.type) ? STAB_SCORE : 1)
  }
  return towerMoveChoices(mon).map((m) => m.id).sort((a, b) => score(b) - score(a))[0] ?? ''
}

/** El ataque elegido como ataque de combate (si ya no lo sabe, el suyo de siempre) */
export const routeMove = (s: GameState): Move => towerMove(activeMon(s)!, s.run!.moveId)

/** Elige el ataque de la ruta en curso: en pleno combate, desde el siguiente ataque de su Pokémon */
export function pickRouteMove(s: GameState, moveId: string, now: number) {
  const run = s.run
  const mon = activeMon(s)
  if (!run || !mon || !towerMoveChoices(mon).some((m) => m.id === moveId)) return
  run.moveId = moveId
  if (run.battleSetup && run.lastBattle && run.battleMsLeft > 0) switchMidBattle(s, now)
}

function switchMidBattle(s: GameState, now: number) {
  const run = s.run!
  const elapsed = battleElapsed(s, now)
  const crits = critOrdinals(run.lastBattle!, run.battleSetup!)
  switchPlayerMove(run.battleSetup!, run.lastBattle!, elapsed, routeMove(s))
  replayBattle(s, crits, elapsed, now)
}
