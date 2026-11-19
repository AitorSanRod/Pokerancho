import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../../game/core/state'
import { brokenStars, type RouteStar } from '../../game/run/routeStars'
import { starGoalText } from './starText'
import './star-fail-toast.css'

/** Milisegundos que se ve el aviso de una estrella perdida */
const TOAST_MS = 1500

/**
 * Las estrellas que se pierden mientras se juega la ruta, una a una: lo que ya no se cumplía al salir no avisa. Como en
 * una misma ruta una estrella perdida no se recupera, si la lista encoge es que ha empezado otra (al reiniciarla)
 */
function useNewlyBroken(game: GameState): RouteStar | null {
  const broken = brokenStars(game)
  const keys = broken.map((star) => star.key).join('|')
  const known = useRef<Set<string> | null>(null)
  const [shown, setShown] = useState<string | null>(null)
  useEffect(() => {
    const now = new Set(keys ? keys.split('|') : [])
    const before = known.current
    known.current = now
    if (!before || [...before].some((key) => !now.has(key))) return
    const fresh = [...now].find((key) => !before.has(key))
    if (fresh) setShown(fresh)
  }, [keys])
  useEffect(() => {
    if (!shown) return
    const timer = setTimeout(() => setShown(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [shown])
  return broken.find((star) => star.key === shown) ?? null
}

/** Aviso flotante en la ruta en curso: «Reto fallado» con la estrella que ya no se puede conseguir en esta salida */
export function StarFailToast({ game }: { game: GameState }) {
  const star = useNewlyBroken(game)
  if (!star) return null
  return (
    <div key={star.key} className="star-fail-toast" role="status" style={{ ['--toast-ms' as string]: `${TOAST_MS}ms` }}>
      <span className="star-fail-mark" aria-hidden>
        ★
      </span>
      <span>
        <strong>Reto fallado</strong>
        <small>{starGoalText(star)}</small>
      </span>
    </div>
  )
}
