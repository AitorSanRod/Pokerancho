import { act } from '../../game/core/store'
import { BOOST_EXP_MULT, catchExpBoost } from '../../game/run/expBoost'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './exp-boost.css'

/**
 * El objeto de la bonificación de EXP, saltando en la escena mientras se puede tocar (`spot`: de 0, izquierda, a 1,
 * derecha). Tocarlo no cuenta como un paso
 */
export function ExpBoostSpawn({ spot }: { spot: number }) {
  return (
    <button
      className="exp-boost-spawn"
      style={{ left: `${12 + spot * 70}%` }}
      aria-label="Bonificación de EXP"
      onPointerDown={(e) => {
        e.stopPropagation()
        act(catchExpBoost)
      }}
    >
      <ItemIcon item={ICON.ExpBoost} size={56} />
    </button>
  )
}

/** Aviso en la cabecera de la ruta mientras dura la bonificación, con lo que le queda */
export function ExpBoostBadge({ msLeft }: { msLeft: number }) {
  return (
    <div className="exp-boost-badge">
      <ItemIcon item={ICON.ExpBoost} size={22} />
      <strong>EXP ×{BOOST_EXP_MULT}</strong>
      <span className="grow tiny">Cada toque da EXP</span>
      <strong>{Math.ceil(msLeft / 1000)} s</strong>
    </div>
  )
}
