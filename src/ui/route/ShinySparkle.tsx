import type { CSSProperties } from 'react'
import './shiny-sparkle.css'

/** Estrellas alrededor del Pokémon: posición (px desde el centro del sprite), tamaño (px) y retraso (s) de cada una */
const STARS: [x: number, y: number, size: number, delay: number][] = [
  [-34, -30, 18, 0],
  [30, -38, 14, 0.12],
  [38, 4, 20, 0.24],
  [-40, 10, 12, 0.32],
  [4, -52, 16, 0.42],
  [-14, 26, 10, 0.5],
  [22, 30, 12, 0.6],
]

/** Segundos que esperan las estrellas: lo que tarda el rival en entrar (enemy-enter de battle.css) */
const ENTER_DELAY = 0.45

/** Destello de estrellas sobre un Pokémon shiny al aparecer; se ve una vez y queda invisible */
export function ShinySparkle() {
  return (
    <span className="shiny-sparkle" aria-hidden="true">
      {STARS.map(([x, y, size, delay], i) => (
        <i key={i} style={{ '--x': `${x}px`, '--y': `${y}px`, '--size': `${size}px`, animationDelay: `${ENTER_DELAY + delay}s` } as CSSProperties} />
      ))}
    </span>
  )
}
