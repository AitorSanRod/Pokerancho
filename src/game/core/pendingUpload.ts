import { isSyncSnapshot, syncSnapshot, type SyncSnapshot } from './cloudChoice'
import type { CloudLink, CloudSave } from './cloudSave'
import type { GameState } from './state'

// Subidas a la nube enviadas cuya respuesta no ha llegado: al ocultar o recargar la app (p. ej. al actualizarla) el
// navegador suele cortar la página antes de leerla, aunque el servidor ya la haya guardado. Si luego la nube tiene una
// de ellas, es la de este dispositivo y no la de otro: se adopta su revisión sin bajar nada ni avisar.

/** Subidas sin confirmar que se recuerdan como mucho (las más recientes) */
export const MAX_PENDING_UPLOADS = 3

export interface PendingUpload {
  /** La revisión que le da el servidor si la acepta */
  revision: number
  /** `lastTick` de la partida subida: la distingue de la que suba otro dispositivo con la misma revisión */
  lastTick: number
  /** Lo que había aquí al subirla */
  snapshot: SyncSnapshot
}

/** La revisión que da el servidor a una subida encima de `base` (null: la primera) */
export const nextRevision = (base: number | null): number => (base ?? 0) + 1

export const pendingUpload = (base: number | null, s: GameState): PendingUpload => ({
  revision: nextRevision(base),
  lastTick: s.lastTick,
  snapshot: syncSnapshot(s),
})

/** El enlace con una subida más sin confirmar (solo las últimas MAX_PENDING_UPLOADS) */
export const withPending = (link: CloudLink, pending: PendingUpload): CloudLink => ({
  ...link,
  pending: [...(link.pending ?? []), pending].slice(-MAX_PENDING_UPLOADS),
})

/** Si la partida de la nube es una subida sin confirmar de aquí, el enlace queda en su revisión, ya sin pendientes */
export function adoptOwnUpload(link: CloudLink | null, cloud: CloudSave | null): CloudLink | null {
  const own = cloud && link?.pending?.find((p) => p.revision === cloud.revision && p.lastTick === cloud.save?.lastTick)
  return link && own ? { userId: link.userId, revision: own.revision, snapshot: own.snapshot } : null
}

/** Las subidas sin confirmar guardadas tienen la forma esperada (si no, se descartan) */
export function isPendingList(v: unknown): v is PendingUpload[] {
  const valid = (p: Partial<PendingUpload> | null) =>
    !!p && Number.isInteger(p.revision) && typeof p.lastTick === 'number' && isSyncSnapshot(p.snapshot)
  return Array.isArray(v) && v.every(valid)
}
