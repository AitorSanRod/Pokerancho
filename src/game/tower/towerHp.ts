import type { OwnedMon } from '../core/state'
import { battleMoment } from '../run/battleTimeline'
import { maxHp } from '../team/stats'
import type { TowerRun } from './towerRun'

// PS de la torre: la subida empieza con los PS que tiene el Pokémon y, al acabar (cae o se abandona), se queda con los
// que le quedan, como al salir de una ruta. En combate van en la escala del combate (con la pasiva de PS y las mejoras).

/** PS que le quedan ahora en la escala del combate: los del momento del combate en curso o, entre pisos, los de la subida (null, todos) */
function hpNow(t: TowerRun): number | null {
  const b = t.lastBattle
  if (t.battleMsLeft > 0 && b) return b.events[battleMoment(b, t.battleMsLeft).index].playerHp
  return t.hp
}

/** Deja al Pokémon con los PS con los que acaba la subida, vueltos a su escala */
export function keepTowerHp(t: TowerRun, mon: OwnedMon) {
  const hp = hpNow(t)
  const combatMax = t.lastBattle?.player.maxHp
  mon.hp = hp === null || !combatMax ? maxHp(mon) : Math.min(maxHp(mon), Math.round((hp * maxHp(mon)) / combatMax))
}
