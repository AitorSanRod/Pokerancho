import { useRef, useState, type PointerEvent, type ReactNode, type Ref } from 'react'
import type { Biome } from '../../data/maps'
import { Sprite } from '../shared/common'
import { PIXEL, pixelSceneFor, usePixelScene, type SceneLandmark } from './pixelScene'
import { battleFit, ENEMY_SPRITE_SIZE } from './spriteSizes'
import './scene.css'

/** Altura del suelo sobre un fondo estático, en % del alto de la escena: donde pisan los Pokémon de la imagen */
const STILL_GROUND = '18%'

interface Floater {
  id: number
  x: number
  y: number
}

interface WalkSceneProps {
  biome: Biome
  /** Imagen fija de fondo (gimnasios y Alto Mando, ver gymScenery.ts): sustituye al paisaje pixel art del bioma */
  still?: string | null
  speciesId?: number
  /** El Pokémon que camina, con los colores shiny */
  shiny?: boolean
  moving: boolean
  speed: number
  /** Animación del Pokémon (p. ej. al atacar en un combate) */
  walkerClass?: string
  onStep?: () => boolean | void
  floaterText?: string
  landmark?: SceneLandmark | null
  signText?: string
  /** Lo que va sobre el Pokémon que camina (p. ej. la subida de nivel) */
  walkerOverlay?: ReactNode
  children?: ReactNode
}

/**
 * Escena de caminar: el Pokémon avanza hacia la derecha mientras el paisaje pixel art del bioma (`pixelScene/`) se
 * desplaza en parallax, pintado en dos lienzos animados (detrás y delante del Pokémon); con `still`, sobre esa imagen
 * fija. `speed` multiplica la velocidad del scroll (Pokémon más rápidos = paisaje más rápido). `children` se pinta
 * sobre el suelo (p. ej. el combate) y puede usar `--ground` para colocarse a la altura del Pokémon. Sin `speciesId` no
 * camina nadie (p. ej. en la pelea contra un jefe comunitario, que pinta a los suyos). `landmark`: elemento de la
 * parada a la que se acerca o en la que está (cartel, casa…), que entra una vez por parada. `signText`: lo que pone el
 * cartel (el nombre de la ruta). `onStep` devuelve false si el toque no contó (no sale la flecha). `floaterText`: lo que sale donde se toca (por defecto, una flecha).
 */
export function WalkScene(props: WalkSceneProps) {
  return props.still ? <StillScene {...props} still={props.still} /> : <PixelScene {...props} />
}

function PixelScene(props: WalkSceneProps) {
  const scene = pixelSceneFor(props.biome, props.signText)
  const { container, back, front } = usePixelScene(scene, props.moving, props.speed, PIXEL, props.landmark ?? null)
  return (
    <SceneFrame
      {...props}
      frameRef={container}
      ground={`${scene.walkerBottom * PIXEL}px`}
      className={scene.surf ? 'surf' : ''}
      back={<canvas ref={back} className="scene-canvas" />}
      front={<canvas ref={front} className="scene-canvas front" />}
    />
  )
}

function StillScene(props: WalkSceneProps & { still: string }) {
  return <SceneFrame {...props} ground={STILL_GROUND} className="still" back={<div className="scene-still" style={{ backgroundImage: `url(${props.still})` }} />} />
}

/** Lo común a las dos escenas: el Pokémon que camina, lo que va encima y los toques */
function SceneFrame({
  speciesId,
  shiny = false,
  moving,
  walkerClass = '',
  onStep,
  floaterText = '»',
  walkerOverlay,
  children,
  frameRef,
  ground,
  className,
  back,
  front,
}: WalkSceneProps & { frameRef?: Ref<HTMLDivElement>; ground: string; className: string; back: ReactNode; front?: ReactNode }) {
  const [floaters, setFloaters] = useState<Floater[]>([])
  const nextId = useRef(0)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!onStep) return
    if (onStep() === false) return
    navigator.vibrate?.(8)
    const rect = e.currentTarget.getBoundingClientRect()
    const f = { id: nextId.current++, x: e.clientX - rect.left, y: e.clientY - rect.top }
    setFloaters((fs) => [...fs.slice(-8), f])
    setTimeout(() => setFloaters((fs) => fs.filter((x) => x.id !== f.id)), 700)
  }

  return (
    <div ref={frameRef} className={`scene ${moving ? '' : 'paused'} ${className}`} style={{ ['--ground' as string]: ground }} onPointerDown={onPointerDown}>
      {back}
      {speciesId !== undefined && (
        <div className={`scene-walker ${walkerClass}`}>
          <div className="scene-shadow" />
          <Sprite id={speciesId} size={ENEMY_SPRITE_SIZE} fit={battleFit(speciesId)} shiny={shiny} />
          {walkerOverlay}
        </div>
      )}
      {front}
      {children}
      {floaters.map((f) => (
        <span key={f.id} className={`floater ${floaterText.length > 1 ? 'text' : ''}`} style={{ left: f.x, top: f.y }}>
          {floaterText}
        </span>
      ))}
    </div>
  )
}
