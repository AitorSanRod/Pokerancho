import { useSyncExternalStore } from 'react'
import type { CloudSave } from '../game/core/cloudSave'

// Lo que la UI ve de la partida en la nube (lo cambia net/cloudSync.ts): cuándo se guardó, si hay que elegir partida,
// avisos y si hace falta actualizar la app para seguir guardando.

export interface CloudState {
  /** Hora real (ms) de la última vez que la partida quedó igual aquí y en la nube */
  syncedAt: number | null
  /** Hay dos partidas distintas (la de la nube y la de aquí, con progreso que la otra no tiene): el jugador elige */
  choice: CloudSave | null
  notice: string | null
  /** La última vez no se pudo hablar con el servidor */
  failing: boolean
  /**
   * La partida de la nube se guardó con una versión más nueva de la app: no se sube ni se baja hasta actualizar (la de
   * aquí sigue intacta y se sube después, ya pasada a la versión nueva)
   */
  outdated: boolean
  /** El jugador ha dicho «Más tarde» al aviso de actualizar: se vuelve a avisar al volver a la app */
  outdatedDismissed: boolean
}

let cloud: CloudState = { syncedAt: null, choice: null, notice: null, failing: false, outdated: false, outdatedDismissed: false }
const listeners = new Set<() => void>()

export const cloudState = (): CloudState => cloud

export function updateCloud(patch: Partial<CloudState>) {
  cloud = { ...cloud, ...patch }
  listeners.forEach((l) => l())
}

export const dismissCloudNotice = () => updateCloud({ notice: null })

export const dismissOutdated = () => updateCloud({ outdatedDismissed: true })

export function useCloud(): CloudState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => cloud,
  )
}
