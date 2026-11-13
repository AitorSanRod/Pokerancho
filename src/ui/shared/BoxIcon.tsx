import { useState } from 'react'
import { sprite } from '../../data/species'
import './box-icon.css'

/** Icono pequeño de la caja de los juegos de GBA, en pixel art; si no lo hay, el sprite normal */
export function BoxIcon({ id, size = 32 }: { id: number; size?: number }) {
  const [fallback, setFallback] = useState(false)
  return (
    <img
      className="box-icon"
      src={fallback ? sprite.front(id) : sprite.icon(id)}
      alt=""
      draggable={false}
      width={size}
      height={size}
      onError={() => setFallback(true)}
    />
  )
}
