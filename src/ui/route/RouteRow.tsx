import { useState, type ReactNode } from 'react'
import type { Route } from '../../data/maps'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './route.css'

interface BackdropRowProps {
  image?: string
  /** Qué franja de la imagen se ve, en % de su alto */
  focusY?: number
  className?: string
  /** Con `onClick`, la tarjeta entera es el botón (con una flecha a la derecha, salvo con `noArrow`) */
  onClick?: () => void
  noArrow?: boolean
  disabled?: boolean
  children: ReactNode
}

/**
 * Tarjeta de una línea sobre una imagen difuminada: base de las listas de rutas, de expediciones y de la sala de un
 * jefe. Si se puede tocar, es un botón entero en vez de llevar uno dentro, para que el texto tenga todo el ancho
 */
export function BackdropRow({ image, focusY = 50, className = '', onClick, noArrow = false, disabled = false, children }: BackdropRowProps) {
  const backdrop = image && (
    <span className="route-backdrop" style={{ backgroundImage: `url(${image})`, backgroundPositionY: `${focusY}%` }} aria-hidden="true" />
  )
  if (!onClick) {
    return (
      <div className={`card route-row ${className}`}>
        {backdrop}
        {children}
      </div>
    )
  }
  return (
    <button type="button" className={`card route-row tappable ${className}`} disabled={disabled} onClick={onClick}>
      {backdrop}
      {children}
      {!noArrow && <span className="route-go" aria-hidden="true" />}
    </button>
  )
}

/** Por qué no se puede entrar en una ruta del mapa aún sin desbloquear */
export const PREVIOUS_ROUTE_REASON = 'Completa la ruta anterior para desbloquearla.'

interface RouteRowProps {
  route: Route
  /** Bloqueada, y por qué: se ve apagada, con el candado, y al tocarla lo dice */
  lockReason?: string
  className?: string
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
}

/** Línea sobre la imagen de la zona de la ruta; bloqueada, tocarla muestra el motivo en vez de entrar */
export function RouteRow({ route: r, lockReason, className = '', onClick, disabled, children }: RouteRowProps) {
  const [showingReason, setShowingReason] = useState(false)
  return (
    <BackdropRow
      image={r.backdrop?.image}
      focusY={r.backdrop?.focusY}
      className={`${lockReason ? 'locked' : ''} ${className}`}
      onClick={lockReason ? () => setShowingReason((v) => !v) : onClick}
      noArrow={!!lockReason}
      disabled={!lockReason && disabled}
    >
      {children}
      {lockReason && <RouteLock reason={lockReason} />}
      {lockReason && showingReason && <span className="route-lock-reason small">{lockReason}</span>}
    </BackdropRow>
  )
}

/** Nombre y niveles de la ruta, como los muestra cada línea */
export function RouteRowTitle({ route: r }: { route: Route }) {
  return (
    <>
      <strong className="grow">{r.name}</strong>
      <span className="small route-levels">
        Nv. {r.levels[0]}–{r.levels[1]}
      </span>
    </>
  )
}

/** Candado de una ruta en la que aún no se puede entrar; `reason`, por qué (se lee al tocar la línea) */
function RouteLock({ reason }: { reason: string }) {
  return (
    <span className="route-lock" aria-label={`Bloqueada: ${reason}`}>
      <ItemIcon item={ICON.Locked} size={32} />
    </span>
  )
}
