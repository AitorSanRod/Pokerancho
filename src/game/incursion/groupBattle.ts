import type { Rng } from '../core/random'
import { roomOutcome, type Battlefield } from './battlefield'
import { bossesUp, bossTurnStart, isAreaTurn } from './bossMechanics'
import { EventKind } from './events'
import { isUp, stat, type GroupFighter } from './fighter'
import { applyGroupPassives, groupPassives, samePassives } from './groupPassives'
import { endOfTurn, loseTurn } from './groupStatus'
import { performMove } from './moveEffects'
import { resolveFallen } from './revives'
import { applyPicks } from './movePicks'
import { anyPlayerUp, noTurnOrders, type TurnOrders } from './tapWindow'

// Un combate de sala: el grupo contra los rivales, por turnos. Al empezar el turno vuelven los caídos (si quedan
// revivires) y se recalculan las pasivas; después viene la ventana de toques (ver tapWindow.ts), actúan todos por
// Velocidad y al final pesan los estados.

/** Turnos tras los que el grupo pierde la sala (con la furia de los jefes no debería llegarse) */
export const MAX_ROOM_TURNS = 80

/** Recalcula las pasivas del grupo con los que siguen dentro; si cambian, lo anuncia */
export function refreshPassives(bf: Battlefield) {
  const passives = groupPassives(bf.party)
  if (samePassives(passives, bf.passives)) return
  bf.passives = passives
  applyGroupPassives(bf.party, passives)
  bf.log({ kind: EventKind.Passives, passives, text: 'Cambian las pasivas del grupo.' })
}

/** Orden del turno: por Velocidad (con sus cambios y pasivas); los empates, al azar */
function turnOrder(bf: Battlefield, rng: Rng): GroupFighter[] {
  const tiebreak = new Map([...bf.party, ...bf.foes].map((f) => [f, rng()]))
  return [...bf.party, ...bf.foes].filter(isUp).sort((a, b) => stat(b, 'spe') - stat(a, 'spe') || tiebreak.get(a)! - tiebreak.get(b)!)
}

/**
 * Juega la sala. `tapWindow` abre la ventana de toques del turno y da sus órdenes (quién potenció su ataque y quién
 * cambió de ataque u objetivo); si aún no se
 * sabe (undefined), la sala se para ahí: 'waiting'
 */
export function fightRoom(bf: Battlefield, rng: Rng, tapWindow: () => TurnOrders | undefined): 'win' | 'lose' | 'waiting' {
  for (bf.turn = 1; bf.turn <= MAX_ROOM_TURNS; bf.turn++) {
    resolveFallen(bf)
    refreshPassives(bf)
    for (const boss of bossesUp(bf)) bossTurnStart(bf, boss)
    const orders = anyPlayerUp(bf) ? tapWindow() : noTurnOrders()
    if (!orders) return 'waiting'
    bf.boosted = orders.boosted
    applyPicks(bf, orders.picks)
    for (const f of turnOrder(bf, rng)) {
      if (!isUp(f) || loseTurn(bf, f, rng)) continue
      performMove(bf, f, rng, isAreaTurn(bf, f))
      const outcome = roomOutcome(bf)
      if (outcome) return outcome
    }
    endOfTurn(bf)
    const outcome = roomOutcome(bf)
    if (outcome) return outcome
  }
  return 'lose'
}
