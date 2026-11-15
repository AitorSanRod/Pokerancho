import { stateFromSaved } from '../game/core/cloudSave'
import type { GameState } from '../game/core/state'
import { backupTeam } from '../game/core/teamBackup'

// La partida en el almacenamiento del navegador: la partida entera y, aparte, la copia del equipo (ver teamBackup.ts).

const SAVE_KEY = 'pokerancho-save'
/** Copia del equipo que sobrevive aunque la partida no se pueda leer (ver teamBackup.ts) */
const TEAM_KEY = 'pokerancho-team'

/** Lo mínimo del almacenamiento que hace falta (`localStorage`, o uno falso en los tests) */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>

function readSafely(storage: SaveStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    // Guardado corrupto o almacenamiento no disponible: como si no lo hubiera
    return null
  }
}

/** La partida guardada, pasada a esta versión; si no hay, una nueva con el equipo recuperado de su copia */
export const loadSaved = (storage: SaveStorage): GameState => stateFromSaved(readSafely(storage, SAVE_KEY), readSafely(storage, TEAM_KEY))

/** Guarda la partida y la copia del equipo; false si no se ha podido (sin espacio o sin almacenamiento) */
export function writeSaved(storage: SaveStorage, state: GameState): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state))
    storage.setItem(TEAM_KEY, JSON.stringify(backupTeam(state)))
    return true
  } catch {
    return false
  }
}
