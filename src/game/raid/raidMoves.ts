import { combatMove } from '../../data/combatMoves'
import { hitsAllies, moveClass, MoveClass, type IncursionMove } from '../../data/incursionMoves'
import { combatMoveChoices } from '../combat/combatRepertoire'
import type { OwnedMon } from '../core/state'
import { botMove } from '../incursion/party'
import { repertoire } from '../incursion/repertoire'

// Los ataques de la pelea de la pestaña Raids. El jugador lleva los de combate, como en las rutas y la torre
// (combat/combatRepertoire.ts), y solo de daño (RAID_DAMAGE_ONLY a false le abre los de cura y estado); los bots, de su
// repertorio de incursión, su golpe más fuerte y, unos pocos, uno de cura.

/** En la pelea del jefe el jugador solo lleva ataques de daño: al entrar y en plena pelea */
export const RAID_DAMAGE_ONLY = true
/** Bots de la sala que llevan un ataque de cura, si su especie lo tiene, como mucho; el resto, su golpe más fuerte */
export const RAID_BOT_HEALERS = 2

const allowed = (mv: IncursionMove) => !RAID_DAMAGE_ONLY || moveClass(mv) === MoveClass.Damage
const heals = (mv: IncursionMove) => moveClass(mv) === MoveClass.Heal

/** Los ataques que puede llevar ese Pokémon contra el jefe */
export const raidMoveChoices = (mon: Pick<OwnedMon, 'speciesId' | 'level' | 'tmMoves'>): IncursionMove[] => combatMoveChoices(mon).filter(allowed)

/** Ese ataque vale en la pelea del jefe (que lo conozca se mira aparte) */
export const raidMoveAllowed = (moveId: string): boolean => allowed(combatMove(moveId))

/**
 * El ataque de un bot, viendo lo que llevan los que llegaron antes (`taken`): uno de cura si su especie lo tiene y aún
 * no hay RAID_BOT_HEALERS curando; si no, su golpe más fuerte que no dé a su grupo. Con los de apoyo abiertos al
 * jugador, el de siempre de los bots (cura o provoca si nadie lo hace, ver incursion/party.ts)
 */
export function raidBotMove(speciesId: number, level: number, taken: IncursionMove[]): string {
  if (!RAID_DAMAGE_ONLY) return botMove(speciesId, level, taken)
  const moves = repertoire(speciesId, level)
  const heal = moves.find(heals)
  if (heal && taken.filter(heals).length < RAID_BOT_HEALERS) return heal.id
  const strikes = moves.filter((mv) => moveClass(mv) === MoveClass.Damage && !hitsAllies(mv))
  if (strikes.length === 0) return botMove(speciesId, level, taken)
  return strikes.reduce((a, b) => (b.power > a.power ? b : a)).id
}
