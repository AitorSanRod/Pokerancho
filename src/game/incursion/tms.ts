import { species } from '../../data/species'
import { TM_IDS, TMS, type Tm } from '../../data/tms'
import { findMon, type GameState, type OwnedMon } from '../core/state'
import { canLearn, monKnows } from './repertoire'

// MTs (data/tms.ts): se ganan en las incursiones, se intercambian y se gastan al enseñar su ataque a un Pokémon que
// pueda aprenderla. Lo sabe para siempre: a cualquier nivel, aunque evolucione y aunque cambie de dueño.

export const tmsOf = (s: GameState, tm: Tm): number => s.tms[tm] ?? 0

export function addTms(s: GameState, tm: Tm, count: number) {
  s.tms[tm] = tmsOf(s, tm) + count
}

/** Si esa especie puede aprender la MT: tiene alguno de sus tipos */
export const tmFits = (speciesId: number, tm: Tm): boolean => species(speciesId).types.some((t) => TMS[tm].types.includes(t))

/** Las MTs que tiene el jugador y que ese Pokémon puede aprender (las de un ataque que ya sabe, no) */
export const teachableTms = (s: GameState, mon: OwnedMon): Tm[] =>
  TM_IDS.filter((tm) => tmsOf(s, tm) > 0 && tmFits(mon.speciesId, tm) && !monKnows(mon, tm))

/** Enseña la MT al Pokémon y la gasta; false si no puede (no la tiene, no la puede aprender o ya sabe el ataque) */
export function teachTm(s: GameState, uid: string, tm: Tm): boolean {
  const mon = findMon(s, uid)
  if (!mon || !teachableTms(s, mon).includes(tm)) return false
  s.tms[tm] = tmsOf(s, tm) - 1
  mon.tmMoves.push(tm)
  return true
}

/**
 * Si un Pokémon de esa especie y nivel puede llevar ese ataque: de su repertorio o de una MT que pueda aprender. Para el
 * servidor, que no ve las MTs aprendidas de cada Pokémon (como con su nivel, se fía de la partida)
 */
export const mayKnow = (speciesId: number, level: number, moveId: string): boolean =>
  canLearn(speciesId, level, moveId) || TM_IDS.some((tm) => tm === moveId && tmFits(speciesId, tm))
