import { seededRng } from '../core/random'
import { IncursionPhase } from '../incursion/activeIncursion'
import { settleGroupTaps } from '../incursion/tapSettle'
import { noTurnOrders } from '../incursion/tapWindow'
import { RAID_ROTATIONS, type RaidRotation } from './online/protocol'
import { finalBossHp, fightProgress, raidSource } from './raidFight'
import { fightDue, startFight } from './raidLobby'
import { newRoom, roomBoss, roomFull, type RaidEntrant, type RaidRoom } from './raidRoom'

// Entrar en la pelea ya empezada, igual en la partida y en el servidor: mientras al jefe le quede más de
// RAID_LATE_JOIN_MIN_HP de su vida y quede algún bot en la sala, el jugador ocupa el sitio del último bot en la
// siguiente ventana de toques (incursion/joins.ts). Su premio va por la vida que le quite la sala desde que entra.

/** Fracción de la vida del jefe por encima de la cual aún se puede entrar en la pelea empezada */
export const RAID_LATE_JOIN_MIN_HP = 0.5

/** Por qué no se puede entrar ya en la pelea de esa sala; null si se puede. Con la pelea por empezar, también null */
export function lateJoinBlocker(room: RaidRoom, now: number): string | null {
  if (roomFull(room)) return 'La sala está llena de jugadores.'
  if (!room.fight) return null
  const p = fightProgress(room.fight, roomBoss(room), now)
  if (p.phase === IncursionPhase.Finished) return 'La pelea ya ha terminado: espera a que abra la próxima sala.'
  if (finalBossHp(p) <= RAID_LATE_JOIN_MIN_HP) return 'Al jefe le queda poca vida: ya no se puede entrar. Espera a la próxima sala.'
  return null
}

/** Pone al día la pelea de la sala sin jugadores mirando: empieza a su hora y se cierran sin nada las ventanas pasadas */
export function catchUpFight(room: RaidRoom, now: number) {
  if (fightDue(room, now)) startFight(room)
  if (room.fight) settleGroupTaps(room.fight, raidSource(roomBoss(room)), now, 0, noTurnOrders())
}

/**
 * La sala local de una rotación para entrar en la pelea ya empezada: solo bots desde el principio, puesta al día. Su
 * semilla sale del ciclo y la rotación, para que la vida del jefe que se ve antes de entrar sea la misma al entrar
 */
export function lateLocalRoom(id: string, rotation: RaidRotation, cycle: number, now: number): RaidRoom {
  const room = newRoom(id, rotation, cycle, Math.floor(seededRng(cycle * RAID_ROTATIONS.length + RAID_ROTATIONS.indexOf(rotation))() * 2 ** 31))
  catchUpFight(room, now)
  return room
}

/** Sienta al Pokémon en la pelea empezada: entra en la próxima ventana. false si ya no se puede */
export function seatLate(room: RaidRoom, entrant: RaidEntrant, now: number): boolean {
  if (!room.fight || lateJoinBlocker(room, now) || room.entrants.some((e) => e.member.id === entrant.member.id)) return false
  room.entrants.push(entrant)
  return true
}
