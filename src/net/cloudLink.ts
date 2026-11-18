import { isSyncSnapshot } from '../game/core/cloudChoice'
import type { SyncSnapshot } from '../game/core/cloudChoice'
import type { CloudLink, CloudSave } from '../game/core/cloudSave'
import { adoptOwnUpload, isPendingList, withPending, type PendingUpload } from '../game/core/pendingUpload'

// Lo que el dispositivo recuerda de la nube (ver CloudLink), aparte de la partida: de qué cuenta es, qué revisión vio y
// qué había aquí entonces (una instantánea que no tenga la forma esperada se descarta)

const LINK_KEY = 'pokerancho-cloud'

export function readLink(): CloudLink | null {
  try {
    const link = JSON.parse(localStorage.getItem(LINK_KEY) ?? 'null') as CloudLink | null
    if (link?.snapshot && !isSyncSnapshot(link.snapshot)) delete link.snapshot
    if (link?.pending && !isPendingList(link.pending)) delete link.pending
    return link
  } catch {
    return null
  }
}

export function writeLink(link: CloudLink | null) {
  try {
    if (link) localStorage.setItem(LINK_KEY, JSON.stringify(link))
    else localStorage.removeItem(LINK_KEY)
  } catch {
    // Sin almacenamiento: se volverá a preguntar al entrar
  }
}

/** La revisión de la nube vista por última vez, si el enlace es de esa cuenta */
export function revisionFor(userId: string | null): number | null {
  const link = readLink()
  return link && link.userId === userId ? link.revision : null
}

/** Apunta la revisión de la nube que es igual a la partida de aquí, con lo que había aquí entonces */
export const linkTo = (userId: string, revision: number, snapshot: SyncSnapshot) => writeLink({ userId, revision, snapshot })

/** Apunta una subida que sale ahora (solo si el enlace ya es de esa cuenta), por si su respuesta no llega */
export function notePending(userId: string, pending: PendingUpload) {
  const link = readLink()
  if (link?.userId === userId) writeLink(withPending(link, pending))
}

/** Si la partida de la nube es una subida de aquí sin confirmar, se adopta su revisión; dice si lo era */
export function adoptIfOwn(cloud: CloudSave | null): boolean {
  const adopted = adoptOwnUpload(readLink(), cloud)
  if (adopted) writeLink(adopted)
  return !!adopted
}
