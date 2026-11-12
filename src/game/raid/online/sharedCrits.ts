import { TAP_CRIT_MULT } from '../../battle/attack'
import type { Rng } from '../../core/random'
import { hitOnBoss } from '../raidCombat'
import type { SharedRoom } from './sharedRoom'

// Toques críticos que manda un móvil (ver raid/raidCrit.ts). El servidor no ve los toques: se fía de cuántos son, pero
// como mucho uno por ronda jugada desde la última vez que los apuntó, y pone él el daño de más (el golpe de ahora del
// Pokémon contra el jefe, con su parte de crítico). Un crítico puede tumbar al jefe: la sala queda acabada como si
// hubiera caído en una ronda (isOver) y cada jugador lo ve al consultar.

/**
 * Apunta `count` críticos del Pokémon `uid` del jugador en la sala: daño de más al jefe y a la cuenta de su daño.
 * Devuelve cuántos ha aceptado
 */
export function creditCrits(room: SharedRoom, playerId: string, uid: string, count: number, rng: Rng): number {
  const seat = room.seats[`${playerId}/${uid}`]
  const { raid } = room
  const member = seat && raid.members.find((m) => m.id === seat.memberId)
  if (!seat || !member || member.left || count <= 0 || raid.hp === 0) return 0
  const allowed = Math.min(count, raid.round - (seat.critRound ?? raid.round))
  let accepted = 0
  for (; accepted < allowed && raid.hp > 0; accepted++) {
    const bonus = Math.min(raid.hp, Math.round(hitOnBoss(raid, member, seat.passives, rng) * (TAP_CRIT_MULT - 1)))
    raid.hp -= bonus
    member.damage += bonus
  }
  if (accepted > 0) seat.critRound = raid.round
  return accepted
}
