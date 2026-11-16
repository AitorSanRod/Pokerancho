import { useEffect, useRef } from 'react'

// El botón «Atrás» del móvil (y Escape en el ordenador) cierra lo último que se abrió encima de la pantalla —ficha,
// panel o diálogo— en lugar de salir de la app. Cada capa abierta deja una entrada en el historial del navegador; al
// cerrarla con su propio botón, la app vuelve atrás para quitar esa entrada sin cerrar ninguna otra.
// `history.back()` no es inmediato: hasta que llega su `popstate`, las entradas de las capas nuevas esperan. Si no,
// la vuelta atrás pendiente se aplicaría sobre la entrada nueva y podría sacar al jugador de la app.

interface Layer {
  close: () => void
  /** Ya tiene su entrada en el historial (si no, espera a que acabe una vuelta atrás de la app) */
  inHistory: boolean
}

/** Capas abiertas, de la de abajo a la de arriba */
const layers: Layer[] = []
/** Vueltas atrás que ha pedido la propia app y aún no han llegado */
let pendingBacks = 0
let listening = false

function pushPendingEntries() {
  if (pendingBacks > 0) return
  for (const layer of layers) {
    if (layer.inHistory) continue
    history.pushState({ layer: true }, '')
    layer.inHistory = true
  }
}

function onPopState() {
  if (pendingBacks > 0) {
    pendingBacks--
    pushPendingEntries()
    return
  }
  layers.pop()?.close()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') layers.at(-1)?.close()
}

function listen() {
  if (listening) return
  listening = true
  window.addEventListener('popstate', onPopState)
  window.addEventListener('keydown', onKeyDown)
}

function open(layer: Layer) {
  listen()
  layers.push(layer)
  pushPendingEntries()
}

/** La capa se ha cerrado sin «Atrás» (su botón, tocar fuera…): quita su entrada del historial si la tenía */
function closedByApp(layer: Layer) {
  const index = layers.indexOf(layer)
  // Ya no está: la cerró «Atrás» y su entrada ya se fue
  if (index === -1) return
  layers.splice(index, 1)
  if (!layer.inHistory) return
  pendingBacks++
  history.back()
}

/**
 * Mientras el componente está montado, «Atrás» y Escape llaman a `onClose`. Sin `onClose` (algo que no se puede
 * cerrar, como elegir partida) no hace nada. Si «Atrás» no lo cierra del todo (vuelve a un paso anterior), cambiar
 * `step` deja otra entrada en el historial para el siguiente «Atrás».
 */
export function useBackToClose(onClose: (() => void) | undefined, step?: string) {
  const latest = useRef(onClose)
  useEffect(() => {
    latest.current = onClose
  })
  const closable = onClose !== undefined

  useEffect(() => {
    if (!closable) return
    const layer: Layer = { close: () => latest.current?.(), inHistory: false }
    open(layer)
    return () => closedByApp(layer)
  }, [closable, step])
}
