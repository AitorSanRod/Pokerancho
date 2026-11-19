import { IncursionId } from '../../data/incursions'
import { route } from '../../data/maps'
import { RAID_ROTATIONS } from '../raid/online/protocol'
import type { GameState } from './state'

// Lo que estaba a medias (ruta, salas de raid, incursión, torre) sigue al actualizar la app mientras su forma y sus
// reglas no hayan cambiado desde la versión con la que se guardó. Si una de ellas cambia, se sube aquí su versión
// (a la nueva SAVE_VERSION) y las partidas de antes la pierden, como siempre (ver saveMigration.ts).

type Save = Record<string, unknown>

/** Lo que puede seguir a medias de una versión a otra */
export type CarriedKey = 'run' | 'raids' | 'incursion' | 'incursionCheckin' | 'tower'

/**
 * SAVE_VERSION en la que cambió por última vez la forma o las reglas de cada cosa a medias: una partida guardada con
 * esa versión o una posterior la conserva. Se cambia (a la SAVE_VERSION nueva) al tocar Run, Raid, ActiveIncursion,
 * ScheduleCheckin o TowerRun, o algo que haga que lo guardado ya no se juegue igual
 */
export const CARRIED_SINCE: Record<CarriedKey, number> = {
  run: 67,
  raids: 64,
  incursion: 58,
  incursionCheckin: 65,
  tower: 64,
}

const isRecord = (v: unknown): v is Save => typeof v === 'object' && v !== null && !Array.isArray(v)
const isIncursionId = (v: unknown) => (Object.values(IncursionId) as unknown[]).includes(v)

/** La ruta sigue existiendo y tiene todas las paradas del camino elegido */
function routeHasPath(routeId: unknown, path: unknown): boolean {
  try {
    const r = route(routeId as string)
    return Array.isArray(path) && path.every((id) => r.nodes.some((n) => n.id === id))
  } catch {
    return false
  }
}

/** Si lo guardado aún encaja con la partida: lo que nombra (Pokémon, ruta, incursión) sigue existiendo */
function stillFits(key: CarriedKey, v: unknown, save: Save, uids: Set<unknown>): boolean {
  if (v === null) return true
  if (!isRecord(v)) return false
  switch (key) {
    case 'run':
      return uids.has(save.activeUid) && routeHasPath(v.routeId, v.path)
    case 'raids':
      return RAID_ROTATIONS.every((r) => v[r] === null || (isRecord(v[r]) && uids.has((v[r] as Save).uid)))
    case 'tower':
      return uids.has(v.uid)
    case 'incursion':
      return uids.has(v.uid) && isIncursionId(v.incursionId)
    case 'incursionCheckin':
      return (v.uid === null || uids.has(v.uid)) && isIncursionId(v.incursionId)
  }
}

/** Lo que estaba a medias en la partida guardada con `version` y puede seguir en esta */
export function carriedProgress(save: Save, version: number): Partial<GameState> {
  const owned = Array.isArray(save.owned) ? save.owned : []
  const uids = new Set(owned.map((m) => (isRecord(m) ? m.uid : null)))
  const kept: Save = {}
  for (const key of Object.keys(CARRIED_SINCE) as CarriedKey[]) {
    if (version >= CARRIED_SINCE[key] && key in save && stillFits(key, save[key], save, uids)) kept[key] = save[key]
  }
  return kept as Partial<GameState>
}
