import { RoomKind, type IncursionRoom } from '../../data/incursions'
import { restore, type Battlefield } from './battlefield'
import { isUp } from './fighter'
import { clearStatus } from './groupStatus'
import { raise, resolveFallen } from './revives'
import { noStages } from './statStages'

// Lo que pasa en las salas sin combate y al salir de una sala de combate.

type RestRoom = Extract<IncursionRoom, { kind: typeof RoomKind.Heal | typeof RoomKind.Revive }>

export function restRoom(bf: Battlefield, room: RestRoom) {
  if (room.kind === RoomKind.Heal) {
    for (const f of bf.party.filter(isUp)) restore(bf, f, f.maxHp * room.heal)
    return
  }
  for (const f of bf.party.filter((p) => p.hp === 0)) raise(bf, f, room.hp)
}

/**
 * Al ganar una sala: vuelven los caídos que aún tienen revivir (no se quedan a 0 entre salas) y se pierden los cambios
 * de stats, la provocación y los estados alterados
 */
export function leaveRoom(bf: Battlefield) {
  resolveFallen(bf)
  for (const f of bf.party) {
    f.stages = noStages()
    f.taunt = null
    clearStatus(f)
    f.target = null
  }
  bf.foes = []
}
