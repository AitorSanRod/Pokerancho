import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import type { Item } from '../../data/items'
import { ITEM } from '../../data/items'
import { legSteps, node, NodeKind, route } from '../../data/maps'
import type { Run } from '../../game/core/state'
import { ItemIcon } from '../shared/ItemIcon'
import './stop-track.css'

/** Icono de cada tipo de parada en el mapa de la ruta en curso */
const STOP_ICON: Record<NodeKind, Item> = {
  [NodeKind.Start]: ITEM.TownMap,
  [NodeKind.Wild]: ITEM.PokeBall,
  [NodeKind.Boss]: ITEM.RelicCrown,
  [NodeKind.Raid]: ITEM.DynamaxBand,
  [NodeKind.Heal]: ITEM.Potion,
}

/** Lo andado del tramo hacia la parada siguiente (0–1); fuera de un tramo, nada */
function legFraction(run: Run): number {
  if (run.phase !== 'walking' || run.stop >= run.path.length - 1) return 0
  const needed = legSteps(route(run.routeId), run.path, run.stop + 1)
  return Math.min(1, run.steps / needed)
}

/** Desplaza el mapa para que la parada actual quede en el centro cuando no caben todas */
function useCenterCurrent(stop: number) {
  const track = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const list = track.current
    const current = list?.querySelector<HTMLElement>('.stop-dot.current')
    if (!list || !current) return
    const left = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2
    list.scrollTo({ left, behavior: 'smooth' })
  }, [stop])
  return track
}

/**
 * Mapa horizontal del camino elegido: las paradas ya alcanzadas enseñan qué eran y las que faltan, un «?». La línea
 * entre paradas se va llenando con los pasos, así que también marca el avance del tramo en curso. Si la ruta es
 * larga, se desplaza con el dedo y sigue sola a la parada actual
 */
export function StopTrack({ run }: { run: Run }) {
  const r = route(run.routeId)
  const leg = legFraction(run)
  const track = useCenterCurrent(run.stop)
  return (
    <ol ref={track} className="stop-track" aria-label={`Parada ${run.stop} de ${run.path.length - 1}`}>
      {run.path.map((id, i) => {
        const reached = i <= run.stop
        const state = i === run.stop ? 'current' : reached ? 'passed' : 'unknown'
        const fill = reached ? 1 : i === run.stop + 1 ? leg : 0
        const n = node(r, id)
        return (
          <Fragment key={`${id}:${i}`}>
            {i > 0 && <li className="stop-link" style={{ '--fill': fill } as CSSProperties} aria-hidden />}
            <li className={`stop-dot ${state}`} title={reached ? n.name : undefined}>
              {reached ? <ItemIcon item={STOP_ICON[n.kind]} size={20} /> : '?'}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
