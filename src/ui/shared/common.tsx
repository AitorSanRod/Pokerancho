import { useState, type CSSProperties } from 'react'
import { move } from '../../data/moves'
import { sprite } from '../../data/species'
import { TYPE_INFO, type PokeType } from '../../data/types'
import { useSpriteBounds, type SpriteBounds } from './spriteBounds'

/**
 * Lienzo de referencia de los sprites: los PNG miden 96×96 y los GIF animados están recortados de ese mismo lienzo,
 * así que dibujar cada imagen a su tamaño real × (size / 96) mantiene la escala entre Pokémon.
 */
const SPRITE_CANVAS = 96

interface Natural {
  src: string
  w: number
  h: number
}

/**
 * Tamaño y posición de la imagen. Sin `fit`, a la escala del lienzo de 96. Con `fit`, el lado mayor del Pokémon mide
 * `fit` × size; si la imagen trae margen (`bounds`), se desplaza para que el Pokémon quede centrado y apoyado abajo.
 */
function imageStyle(natural: Natural, size: number, fit: number | undefined, bounds: SpriteBounds | null): CSSProperties {
  if (fit === undefined) return { width: natural.w * (size / SPRITE_CANVAS), height: natural.h * (size / SPRITE_CANVAS) }
  const b = bounds ?? { x: 0, y: 0, w: natural.w, h: natural.h }
  const scale = (fit * size) / Math.max(b.w, b.h)
  return {
    width: natural.w * scale,
    height: natural.h * scale,
    position: 'relative',
    left: (natural.w / 2 - (b.x + b.w / 2)) * scale,
    top: (natural.h - (b.y + b.h)) * scale,
  }
}

/**
 * Sprite de un Pokémon en una caja de size×size: la imagen va a escala (un Koffing es más pequeño que un Onix),
 * centrada y apoyada en el borde de abajo; los Pokémon grandes pueden sobresalir de la caja.
 * `fit` (0–1): en vez de la escala del sprite, el Pokémon ocupa esa parte de la caja (ver spriteSizes.ts › battleFit).
 */
export function Sprite({
  id,
  back = false,
  animated = true,
  size = 96,
  fit,
  className = '',
  silhouette = false,
  shiny = false,
}: {
  id: number
  back?: boolean
  animated?: boolean
  size?: number
  fit?: number
  className?: string
  silhouette?: boolean
  /** Con los colores shiny */
  shiny?: boolean
}) {
  // Si el GIF animado no existe o falla, se usa el sprite estático
  const [fallback, setFallback] = useState(!animated)
  // Tamaño real de la imagen cargada; hasta saberlo no se muestra, para que no salte de tamaño
  const [natural, setNatural] = useState<Natural | null>(null)
  const src = fallback
    ? back ? sprite.back(id, shiny) : sprite.front(id, shiny)
    : back ? sprite.animatedBack(id, shiny) : sprite.animated(id, shiny)
  // Los GIF ya vienen recortados; los PNG se miden para quitarles el margen
  const bounds = useSpriteBounds(src, fit !== undefined && fallback)
  const loaded = natural?.src === src && bounds !== undefined ? natural : null

  return (
    <span className={`sprite ${silhouette ? 'silhouette' : ''} ${className}`} style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        draggable={false}
        onError={() => setFallback(true)}
        onLoad={(e) => setNatural({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        style={loaded ? imageStyle(loaded, size, fit, bounds ?? null) : { visibility: 'hidden' }}
      />
    </span>
  )
}

export function Bar({ value, max, kind }: { value: number; max: number; kind: 'hp' | 'exp' | 'steps' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const tone = kind !== 'hp' ? kind : pct > 50 ? 'hp-ok' : pct > 20 ? 'hp-mid' : 'hp-low'
  return (
    <div className="bar">
      {/* Estela de los PS: va detrás y baja con retraso, así se ve el trozo que se acaba de perder */}
      {kind === 'hp' && <div className="bar-ghost" style={{ width: `${pct}%` }} />}
      <div className={`bar-fill ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function TypeBadge({ type }: { type: PokeType }) {
  return (
    <span className="type-badge" style={{ background: TYPE_INFO[type].color }}>
      {TYPE_INFO[type].name}
    </span>
  )
}

/** Ficha de un movimiento (solo informativa: cada Pokémon tiene un único ataque fijo) */
export function MoveChip({ id }: { id: string }) {
  const mv = move(id)
  return (
    <div className="move-chip" style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}>
      <span className="move-name">{mv.name}</span>
      <span className="move-meta">
        {TYPE_INFO[mv.type].name} · Pot. {mv.power}
      </span>
    </div>
  )
}

