import { act } from '../../store/store'
import { RaidLink, type TabRaid } from '../../game/raid/raid'
import { markRaidCrit, scoreRaidTap, setRaidPick } from '../../game/raid/raidPlay'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { sendRaidCrit, sendRaidPick, sendRaidTap } from '../../net/raidSync'
import type { FightPilot } from '../incursion/pickAction'

// Lo que decide el jugador en la pelea del jefe de una rotación: se apunta en la partida y, si la sala es del servidor,
// también se le avisa.

const online = (tr: TabRaid) => tr.link === RaidLink.Online

/** Su ataque y a quién va, para la barra de ataques y la escena (como en una incursión) */
export const raidPilot = (tr: TabRaid, rotation: RaidRotation): FightPilot => ({
  uid: tr.uid,
  orders: tr.room.fight?.orders ?? [],
  pendingPick: tr.pendingPick,
  choose: (pick) => {
    act((s) => setRaidPick(s, rotation, pick, Date.now()))
    if (online(tr)) void sendRaidPick(rotation, pick.moveId, pick.target)
  },
})

/** Lo que lleva conseguido en el reto de la ventana `turn` y si lo ha acabado */
export function raidTapScore(tr: TabRaid, rotation: RaidRotation, turn: number, score: number, done: boolean) {
  if (online(tr)) void sendRaidTap(rotation, turn, score)
  else act((s) => scoreRaidTap(s, rotation, score, done, Date.now()))
}

/** Ha acertado el anillo: su primer golpe del turno siguiente será crítico */
export function raidCritHit(tr: TabRaid, rotation: RaidRotation) {
  act((s) => markRaidCrit(s, rotation, Date.now()))
  if (online(tr)) void sendRaidCrit(rotation)
}
