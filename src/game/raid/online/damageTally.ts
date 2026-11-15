import type { MonDamage } from '../../core/ranking'
import { IncursionPhase } from '../../incursion/activeIncursion'
import { bossDamage } from '../../incursion/online/bossDamage'
import { fightProgress } from '../raidFight'
import { roomBoss } from '../raidRoom'
import type { SharedRaid } from './sharedRaid'

// El daño de una sala de la pestaña Raids para el ranking de daño (worker/db/damageRanking.ts): se apunta una sola
// vez, al terminar la pelea, con lo que le quitó al jefe cada Pokémon de cada jugador (los bots no cuentan).

/** La pelea ha terminado y su daño aún no está apuntado */
export const damageDue = (room: SharedRaid, now: number): boolean =>
  room.damagePending && !!room.fight && fightProgress(room.fight, roomBoss(room), now).phase === IncursionPhase.Finished

/** Si la pelea ha terminado y su daño aún no está apuntado, lo devuelve y la marca como apuntada; si no, lista vacía */
export function takeDamageTally(room: SharedRaid, now: number): MonDamage[] {
  if (!damageDue(room, now)) return []
  const p = fightProgress(room.fight!, roomBoss(room), now)
  room.damagePending = false
  const damage = bossDamage(p, room.seats)
  return room.seats.flatMap((seat) => {
    const dealt = Math.round(damage.get(seat.memberId) ?? 0)
    const speciesId = room.fight!.members.find((m) => m.id === seat.memberId)?.speciesId
    return speciesId !== undefined && dealt > 0 ? [{ playerId: seat.playerId, uid: seat.memberId, speciesId, damage: dealt }] : []
  })
}
