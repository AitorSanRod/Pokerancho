// Una sola pestaña juega la partida: si se abre en otra (o en la app instalada y el navegador a la vez), las dos
// guardarían en el mismo sitio y la última pisaría lo de la primera. Con Web Locks, la primera se queda con el cerrojo
// y la segunda pregunta si se quiere jugar en ella; si sí, se lo quita a la otra, que guarda y deja de jugar.

const LOCK_NAME = 'pokerancho-partida'
const CHANNEL_NAME = 'pokerancho-pestanas'
/** Lo que se espera a que la otra pestaña confirme que ha guardado antes de cargar la partida aquí */
const HANDOVER_WAIT_MS = 1_500
const SAVED = 'saved'

/** Si el navegador sabe repartir la partida entre pestañas (sin Web Locks se juega como siempre, sin aviso) */
export const canLockTab = (): boolean => typeof navigator !== 'undefined' && !!navigator.locks

/**
 * Se queda con la partida mientras la pestaña esté abierta. `steal`: quitándosela a otra. `onLost` se llama si otra
 * se la quita después; antes de eso hay que guardar lo de aquí (se avisa a la otra en cuanto vuelve `onLost`)
 */
function hold(steal: boolean, onLost: () => void): Promise<boolean> {
  return new Promise((resolve) => {
    const options: LockOptions = steal ? { steal: true } : { ifAvailable: true }
    navigator.locks
      .request(LOCK_NAME, options, (lock) => {
        resolve(!!lock)
        // Mientras no se resuelve, el cerrojo es de esta pestaña
        return lock ? new Promise<never>(() => {}) : undefined
      })
      .catch(() => {
        // Otra pestaña ha robado el cerrojo
        onLost()
        new BroadcastChannel(CHANNEL_NAME).postMessage(SAVED)
      })
  })
}

/** Intenta quedarse con la partida; false si ya está abierta en otra pestaña */
export const claimTab = (onLost: () => void): Promise<boolean> => hold(false, onLost)

/** Se la quita a la otra pestaña y espera (un rato como mucho) a que esta haya guardado lo suyo */
export async function takeOverTab(onLost: () => void): Promise<void> {
  const channel = new BroadcastChannel(CHANNEL_NAME)
  const saved = new Promise<void>((resolve) => {
    channel.onmessage = (e) => e.data === SAVED && resolve()
    setTimeout(resolve, HANDOVER_WAIT_MS)
  })
  await hold(true, onLost)
  await saved
  channel.close()
}
