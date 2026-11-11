import { CloudAction, cloudAction, cloudUpload, hasUnsavedProgress, isFromNewerApp, SaveRejection, stateFromSaved, type CloudSave } from '../game/core/cloudSave'
import { getState, replaceState } from '../game/core/store'
import { account, AccountStatus, refreshAccount, subscribeAccount } from './account'
import { readLink, writeLink } from './cloudLink'
import { cloudState, updateCloud } from './cloudState'

// Mantiene la partida de la cuenta en la nube (worker/save.ts): al entrar o al volver a la app baja la de la nube si
// otro dispositivo ha jugado después; con la app delante la sube cada poco y al ocultarla. Nunca se pierde lo jugado
// aquí sin preguntar: si la de la nube no tiene progreso de aquí, el jugador elige. Si la de la nube es de una versión
// más nueva de la app, no se toca nada hasta actualizar (ver cloudState.ts › outdated).

const SAVE_API = '/api/save'
/** Milisegundos reales entre subidas con la app delante */
const UPLOAD_EVERY_MS = 2 * 60_000
/** Cada cuánto se mira si toca subir */
const LOOP_MS = 15_000
/** Bytes como mucho para subir con keepalive al ocultar la app (el navegador no deja más) */
const KEEPALIVE_MAX_BYTES = 60_000

const OTHER_DEVICE_NOTICE = 'Has jugado con tu cuenta en otro dispositivo, así que hemos cargado esa partida, que es la más reciente.'

let busy = false
let lastUploadAt = 0

const userId = () => (account().status === AccountStatus.SignedIn ? account().user!.id : null)

/** La app está sin actualizar para la partida de la nube: se deja de sincronizar y se avisa (otra vez si lo había quitado) */
const markOutdated = () => updateCloud({ outdated: true, outdatedDismissed: false, choice: null })

/** La partida de la nube pasa a ser la de aquí (si esta app sabe leerla) */
function loadCloudSave(saved: CloudSave, notice: string | null = null) {
  if (isFromNewerApp(saved)) return markOutdated()
  replaceState(stateFromSaved(saved.save, saved.team))
  writeLink({ userId: userId()!, revision: saved.revision })
  updateCloud({ syncedAt: Date.now(), choice: null, notice: notice ?? cloudState().notice })
}

/** Hay otra partida en la nube: se baja si aquí no hay nada que perder y, si lo hay, el jugador elige */
function resolveConflict(saved: CloudSave, notice: string | null) {
  if (isFromNewerApp(saved)) return markOutdated()
  if (hasUnsavedProgress(getState(), saved)) return updateCloud({ choice: saved })
  loadCloudSave(saved, notice)
}

/** Sin sesión válida (ha caducado o se cerró en otro sitio): se vuelve a preguntar quién es y se para */
const SESSION_LOST = 401

async function checked(res: Response): Promise<Response> {
  if (res.status === SESSION_LOST) await refreshAccount()
  if (!res.ok && res.status !== 409) throw new Error(`${SAVE_API}: ${res.status}`)
  return res
}

async function fetchCloud(): Promise<CloudSave | null> {
  const res = await checked(await fetch(SAVE_API, { cache: 'no-store' }))
  return ((await res.json()) as { cloud: CloudSave | null }).cloud
}

interface Rejected {
  cloud: CloudSave | null
  code?: SaveRejection
}

/** Sube la partida de aquí encima de la revisión `base` de la nube */
async function upload(base: number | null, keepalive = false) {
  const body = JSON.stringify({ baseRevision: base, ...cloudUpload(getState()) })
  lastUploadAt = Date.now()
  const res = await checked(
    await fetch(SAVE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: keepalive && body.length <= KEEPALIVE_MAX_BYTES }),
  )
  if (res.status === 409) {
    const rejected = (await res.json()) as Rejected
    if (rejected.code === SaveRejection.OutdatedApp) markOutdated()
    else if (rejected.cloud) resolveConflict(rejected.cloud, OTHER_DEVICE_NOTICE)
    return
  }
  writeLink({ userId: userId()!, revision: ((await res.json()) as { revision: number }).revision })
  updateCloud({ syncedAt: Date.now(), outdated: false })
}

/** Lo que el dispositivo cree que es la última revisión de la nube de esta cuenta */
const knownRevision = () => {
  const link = readLink()
  return link?.userId === userId() ? link.revision : null
}

/** Una operación con la nube a la vez; los fallos de red solo se anotan (se reintenta más tarde) */
async function exclusive(run: () => Promise<void>) {
  if (busy || !userId()) return
  busy = true
  try {
    await run()
    updateCloud({ failing: false })
  } catch {
    updateCloud({ failing: true })
  } finally {
    busy = false
  }
}

/** Milisegundos entre miradas a si ha acabado la operación con la nube en curso */
const WAIT_STEP_MS = 100

/**
 * Para los intercambios: espera a que no haya otra operación con la nube, sube la partida y, con la nube ya igual que
 * aquí, hace `run` con su revisión. `run` cambia la partida igual que el servidor y llama a `adoptRevision` con la
 * nueva. Si algo falla a medias, se vuelve a mirar la nube (si el servidor llegó a cambiarla, se baja)
 */
export async function withCloudInSync<T>(run: (revision: number, adoptRevision: (revision: number) => void) => Promise<T>): Promise<T> {
  while (busy) await new Promise((resolve) => setTimeout(resolve, WAIT_STEP_MS))
  if (!userId() || cloudState().choice) throw new Error('Sin partida en la nube')
  if (cloudState().outdated) throw new Error('Actualiza la app para usar los intercambios')
  busy = true
  try {
    await upload(knownRevision())
    const revision = knownRevision()
    if (revision === null || cloudState().choice || cloudState().outdated) throw new Error('Sin partida en la nube')
    return await run(revision, (next) => writeLink({ userId: userId()!, revision: next }))
  } catch (e) {
    busy = false
    void connect()
    throw e
  } finally {
    busy = false
  }
}

/** Al entrar en la cuenta o volver a la app: subir, bajar o preguntar (ver cloudAction) */
const connect = () =>
  exclusive(async () => {
    const saved = await fetchCloud()
    if (saved && isFromNewerApp(saved)) return markOutdated()
    const action = cloudAction(readLink(), userId()!, saved, getState())
    if (action === CloudAction.Upload) await upload(saved?.revision ?? null)
    else if (action === CloudAction.Download) loadCloudSave(saved!)
    else updateCloud({ choice: saved })
  })

/** Sube si toca (no mientras el jugador elige partida ni con la app sin actualizar) */
const uploadNow = (keepalive = false) => (cloudState().choice || cloudState().outdated ? Promise.resolve() : exclusive(() => upload(knownRevision(), keepalive)))

/** Subir ya, sin esperar a la siguiente vez (botón «Guardar ahora») */
export const saveNow = () => uploadNow()

/** El jugador elige entre la partida de la nube y la de aquí */
export function chooseSave(keepCloud: boolean) {
  const saved = cloudState().choice
  if (!saved) return
  if (keepCloud) return loadCloudSave(saved)
  updateCloud({ choice: null })
  void exclusive(() => upload(saved.revision))
}

/** Antes de salir de la cuenta se sube lo último; la partida sigue aquí, ya sin cuenta */
export async function beforeSignOut() {
  await uploadNow()
  writeLink(null)
  updateCloud({ syncedAt: null, choice: null, outdated: false })
}

/** Arranca la sincronización (una vez, en App); devuelve cómo pararla */
export function startCloudSync(): () => void {
  let lastUser: string | null = null
  const onAccount = () => {
    if (userId() && userId() !== lastUser) void connect()
    lastUser = userId()
  }
  const unsubscribe = subscribeAccount(onAccount)
  const id = setInterval(() => {
    if (!document.hidden && Date.now() - lastUploadAt >= UPLOAD_EVERY_MS) void uploadNow()
  }, LOOP_MS)
  const onVisibility = () => void (document.hidden ? uploadNow(true) : connect())
  document.addEventListener('visibilitychange', onVisibility)
  onAccount()
  return () => {
    unsubscribe()
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
