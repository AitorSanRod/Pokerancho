import { markEvolutionLines } from '../collection/dex'
import { unlockReachedRoutes } from '../run/routeUnlocks'
import { cancelBlockedExpeditions } from '../team/expedition'
import { rehomeOverflow } from '../team/ranches'
import { migrateSave } from './saveMigration'
import { backupTeam, parseTeamBackup, restoreTeam, type TeamBackup } from './teamBackup'
import { initialState, restoreState, SAVE_VERSION, TutorialStep, type GameState } from './state'

// La partida en la nube de una cuenta (worker/save.ts). Gana la última que se sube: cada copia lleva una
// revisión y el servidor solo acepta subir encima de la que el dispositivo vio por última vez y desde una app que no sea
// más vieja que la que guardó la de la nube. Nunca se baja sin preguntar si aquí hay progreso que la nube no tiene.

/** Bytes como mucho de una partida subida (la de un jugador avanzado ocupa unas decenas de KB) */
export const MAX_SAVE_BYTES = 1024 * 1024

/** La partida en la nube: la de esta versión y la copia del equipo, por si es de otra (ver teamBackup.ts) */
export interface CloudSave {
  save: GameState
  team: TeamBackup
  /** Sube en uno con cada copia aceptada */
  revision: number
  /** Hora real (ms) a la que se subió */
  updatedAt: number
}

/** Lo que el dispositivo recuerda de la nube: de qué cuenta es su partida y qué revisión vio por última vez */
export interface CloudLink {
  userId: string
  revision: number
}

export const CloudAction = { Upload: 'upload', Download: 'download', Ask: 'ask' } as const
export type CloudAction = (typeof CloudAction)[keyof typeof CloudAction]

/** Por qué el servidor no acepta una subida aparte de que otro dispositivo subiera antes (va en el 409) */
export const SaveRejection = {
  /** La partida de la nube se guardó con una versión más nueva de la app: hay que actualizar esta antes de subir */
  OutdatedApp: 'outdated-app',
} as const
export type SaveRejection = (typeof SaveRejection)[keyof typeof SaveRejection]

/** Una partida recién empezada, aún sin inicial: no hay nada que perder si se cambia por la de la nube */
const isFreshGame = (s: GameState): boolean => s.tutorial === TutorialStep.Starter

/** La partida de la nube es de una versión de la app más nueva que esta: no se sabe leer entera y no se carga */
export const isFromNewerApp = (cloud: CloudSave): boolean => Number.isInteger(cloud.save?.version) && cloud.save.version > SAVE_VERSION

/** Los Pokémon de una partida de la nube por uid (puede ser de otra versión: solo se fía de lo que tenga buena forma) */
function monsByUid(save: unknown): Map<string, { level: number; stars: number }> {
  const owned = (save as Partial<GameState> | null)?.owned
  return new Map(Array.isArray(owned) ? owned.filter((m) => typeof m?.uid === 'string').map((m) => [m.uid, m]) : [])
}

/**
 * Aquí hay progreso que la partida de la nube no tiene (Pokémon que no están, con más nivel o ★, o rutas completadas):
 * bajarla sin preguntar lo perdería (p. ej. al jugar sin conexión mientras otro dispositivo subía la suya)
 */
export function hasUnsavedProgress(local: GameState, cloud: CloudSave): boolean {
  const inCloud = monsByUid(cloud.save)
  const ahead = local.owned.some((m) => {
    const there = inCloud.get(m.uid)
    return !there || m.level > there.level || m.stars > there.stars
  })
  const routes = Array.isArray(cloud.save?.completedRoutes) ? new Set(cloud.save.completedRoutes) : new Set<string>()
  return ahead || local.completedRoutes.some((r) => !routes.has(r))
}

/**
 * Qué hacer al conectar con la cuenta `userId`: sin copia en la nube, subir la de aquí; si la de aquí ya es de esa
 * cuenta, bajar la de la nube si otro dispositivo ha subido después (o preguntar si aquí hay progreso que la nube no
 * tiene) y, si no, subir; si no, preguntar (salvo que la de aquí esté sin empezar)
 */
export function cloudAction(link: CloudLink | null, userId: string, cloud: CloudSave | null, local: GameState): CloudAction {
  if (!cloud) return CloudAction.Upload
  if (link?.userId !== userId) return isFreshGame(local) ? CloudAction.Download : CloudAction.Ask
  if (cloud.revision <= link.revision) return CloudAction.Upload
  return hasUnsavedProgress(local, cloud) ? CloudAction.Ask : CloudAction.Download
}

/** Lo que se sube: la partida y la copia del equipo */
export const cloudUpload = (s: GameState) => ({ save: s, team: backupTeam(s) })

/**
 * La partida guardada: si es de esta versión, tal cual; si es de otra, pasada a esta sin perder nada de lo que siga
 * existiendo (saveMigration.ts). Si la partida no se puede leer o se ha quedado sin Pokémon, el equipo sale de su copia.
 * En las dos se abren las rutas que tocan por las ya completadas (rutas añadidas después) y se da por capturada la
 * línea evolutiva anterior de lo capturado. Lo que no cabe en su rancho se recoloca (ranches.ts › rehomeOverflow) y se
 * quitan las expediciones a rutas a las que ya no se puede mandar (expedition.ts › cancelBlockedExpeditions)
 */
export function stateFromSaved(saved: unknown, team: unknown): GameState {
  const s = (saved && typeof saved === 'object' ? restoreState(saved as GameState) : null) ?? salvaged(saved, team)
  unlockReachedRoutes(s)
  markEvolutionLines(s)
  rehomeOverflow(s)
  cancelBlockedExpeditions(s)
  return s
}

/** Partida de otra versión (o ilegible), pasada a esta; sin Pokémon, el equipo sale de su copia */
function salvaged(saved: unknown, team: unknown): GameState {
  const s = migrateSave(saved) ?? initialState()
  const backup = parseTeamBackup(team)
  if (s.owned.length === 0 && backup) restoreTeam(s, backup)
  return s
}

/** Lo que se enseña de una partida para elegir entre la de aquí y la de la nube */
export interface SaveSummary {
  mons: number
  topLevel: number
  money: number
  completedRoutes: number
  /** Hora real (ms) de la última vez que se jugó */
  playedAt: number
}

export function saveSummary(s: GameState): SaveSummary {
  return {
    mons: s.owned.length,
    topLevel: Math.max(0, ...s.owned.map((m) => m.level)),
    money: s.money,
    completedRoutes: s.completedRoutes.length,
    playedAt: s.lastTick,
  }
}

/** Subida que acepta el servidor: la revisión sobre la que se sube (null, la primera) y la partida */
interface SaveUpload {
  baseRevision: number | null
  save: GameState
  team: TeamBackup
}

/** Comprueba la forma de una subida (la partida es del propio jugador: solo se mira que sea una partida) */
export function parseUpload(body: unknown): SaveUpload | null {
  if (!body || typeof body !== 'object') return null
  const { baseRevision, save, team } = body as Record<string, unknown>
  const validBase = baseRevision === null || (Number.isInteger(baseRevision) && (baseRevision as number) >= 0)
  const validSave = !!save && typeof save === 'object' && Number.isInteger((save as GameState).version)
  const backup = parseTeamBackup(team)
  return validBase && validSave && backup ? { baseRevision: baseRevision as number | null, save: save as GameState, team: backup } : null
}

/**
 * La partida en la nube con la línea evolutiva anterior de lo capturado ya capturada: el servidor la repasa al leerla,
 * así las partidas de antes de esta regla salen bien en cualquier dispositivo. Si no tiene la forma esperada, tal cual
 */
export function withEvolutionLines(cloud: CloudSave): CloudSave {
  const { caught, seen } = cloud.save as Partial<GameState>
  if (!Array.isArray(caught) || !Array.isArray(seen)) return cloud
  markEvolutionLines(cloud.save)
  return cloud
}
