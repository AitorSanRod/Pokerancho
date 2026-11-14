import { Fragment } from 'react'
import type { Route } from '../../../src/data/maps'
import { STOP_ICON } from '../../../src/ui/route/stopIcons'
import { ItemIcon } from '../../../src/ui/shared/ItemIcon'
import '../../../src/ui/route/stop-track.css'

/**
 * El mapa de paradas de la ruta en curso, como se ve en el juego pero con todas a la vista. Tocar una la elige para la
 * escena; debajo, su nombre y los pasos desde la anterior
 */
export function StopStrip({ route, selected, onSelect }: { route: Route; selected: number; onSelect: (i: number) => void }) {
  const node = route.nodes[selected]
  const steps = selected > 0 ? route.nodes[selected - 1].next[0]?.steps : 0
  return (
    <>
      <ol className="stop-track preview-track">
        {route.nodes.map((n, i) => (
          <Fragment key={`${n.id}:${i}`}>
            {i > 0 && <li className="stop-link" style={{ ['--fill' as string]: i <= selected ? 1 : 0 }} aria-hidden />}
            <li className={`stop-dot ${i === selected ? 'current' : 'passed'}`} title={n.name} onClick={() => onSelect(i)}>
              <ItemIcon item={STOP_ICON[n.kind]} size={20} />
            </li>
          </Fragment>
        ))}
      </ol>
      {node && (
        <p className="preview-stop-name">
          <b>
            {selected}. {node.name || 'Sin nombre'}
          </b>
          {selected > 0 && <span> · {steps} pasos desde la anterior</span>}
        </p>
      )}
    </>
  )
}
