import { useState, type CSSProperties } from 'react'
import type { Move } from '../../data/moves'
import { isShowdownGif, sprite } from '../../data/species'
import { animatedSrc, markMissing } from './animatedSprite'
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
 * Tamaño y posición de la imagen. Sin `fit`, a la escala del lienzo de 96. Con `fit`, el lado mayor del cuerpo
 * (`body`, medido en el PNG estático) mide `fit` × size. En el PNG, `body` es además el recorte: se desplaza para que
 * el Pokémon quede centrado y apoyado abajo. El GIF ocupa todo lo que se mueve en la animación (alas, saltos…), así
 * que se escala por el cuerpo y se coloca entero, centrado y apoyado abajo.
 */
function imageStyle(natural: Natural, size: number, fit: number | undefined, body: SpriteBounds | null, isGif: boolean): CSSProperties {
  if (fit === undefined) return canvasStyle(natural, size, isGif ? body : null)
  const whole = { x: 0, y: 0, w: natural.w, h: natural.h }
  const scale = (fit * size) / Math.max((body ?? whole).w, (body ?? whole).h)
  const b = isGif ? whole : (body ?? whole)
  return {
    width: natural.w * scale,
    height: natural.h * scale,
    position: 'relative',
    left: (natural.w / 2 - (b.x + b.w / 2)) * scale,
    top: (natural.h - (b.y + b.h)) * scale,
  }
}

/**
 * Un GIF de Showdown pasado a la escala del lienzo de 96: su lado mayor mide lo que el del cuerpo en el PNG (sin
 * contorno, cabe en el lienzo).
 */
function toCanvas(natural: Natural, body: SpriteBounds | null): Natural {
  const side = Math.max(natural.w, natural.h)
  const scale = body ? Math.max(body.w, body.h) / side : Math.min(1, SPRITE_CANVAS / side)
  return { src: natural.src, w: natural.w * scale, h: natural.h * scale }
}

/**
 * A la escala del lienzo de 96. Con `body` (el contorno del PNG), el GIF sube lo que el PNG deja de margen
 * transparente abajo: así los pies quedan a la misma altura al cambiar de una imagen a la otra.
 */
function canvasStyle(natural: Natural, size: number, body: SpriteBounds | null): CSSProperties {
  const scale = size / SPRITE_CANVAS
  const lift = body ? (SPRITE_CANVAS - (body.y + body.h)) * scale : 0
  return { width: natural.w * scale, height: natural.h * scale, position: 'relative', top: -lift }
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
  grounded = false,
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
  /** Sin `fit`: el GIF apoya los pies donde los tiene el PNG estático (para alternar entre los dos sin saltos) */
  grounded?: boolean
}) {
  // Si un GIF animado no existe o falla, se prueba el siguiente y, si no queda ninguno, el sprite estático
  const [, setMisses] = useState(0)
  const gif = animated ? animatedSrc(id, shiny, back) : null
  // Tamaño real de la imagen cargada; hasta saberlo no se muestra, para que no salte de tamaño
  const [natural, setNatural] = useState<Natural | null>(null)
  const staticSrc = back ? sprite.back(id, shiny) : sprite.front(id, shiny)
  const src = gif ?? staticSrc
  const showdown = gif !== null && isShowdownGif(gif)
  // El cuerpo se mide siempre en el PNG estático (misma escala que el GIF, pero sin el margen de la animación)
  const layout = fit !== undefined || grounded
  const body = useSpriteBounds(staticSrc, layout || showdown)
  const loaded = natural?.src === src && body !== undefined ? natural : null
  const fail = () => {
    if (!gif) return
    markMissing(gif)
    setMisses((n) => n + 1)
  }

  return (
    <span className={`sprite ${silhouette ? 'silhouette' : ''} ${className}`} style={{ width: size, height: size }}>
      <img
        src={src}
        alt=""
        draggable={false}
        onError={fail}
        onLoad={(e) => setNatural({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        style={
          loaded
            ? imageStyle(showdown ? toCanvas(loaded, body ?? null) : loaded, size, fit, layout ? (body ?? null) : null, gif !== null)
            : { visibility: 'hidden' }
        }
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
export function MoveChip({ move: mv }: { move: Move }) {
  return (
    <div className="move-chip" style={{ ['--type-color' as string]: TYPE_INFO[mv.type].color }}>
      <span className="move-name">{mv.name}</span>
      <span className="move-meta">
        {TYPE_INFO[mv.type].name} · Pot. {mv.power}
      </span>
    </div>
  )
}

