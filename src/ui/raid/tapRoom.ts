import { act } from '../../game/core/store'
import { roomAt, type RoomKey } from '../../game/raid/online/linkedRoom'
import { tapRaid } from '../../game/raid/raidCrit'

/** Toque en la pelea contra el jefe de la sala de `key`: es para el crítico (no sale la flecha de los pasos) */
export function tapRoom(key: RoomKey): boolean {
  act((s) => {
    const raid = roomAt(s, key)
    if (raid) tapRaid(s, raid, Date.now())
  })
  return false
}
