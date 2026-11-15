import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { BOOST_EXP_MULT, catchExpBoost } from '../../game/run/expBoost'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './exp-boost.css'

/**
 * El Huevo Suerte, saltando en la escena mientras se puede tocar (`spot`: de 0, izquierda, a 1, derecha). Tocarlo lo
 * guarda en la Mochila y no cuenta como un paso. `onCatch`, la acción que lo recoge (por defecto, la de la ruta; en la
 * torre, la suya)
 */
export function ExpBoostSpawn({ spot, onCatch = catchExpBoost }: { spot: number; onCatch?: (s: GameState) => boolean }) {
  return (
    <button
      className="exp-boost-spawn"
      style={{ left: `${12 + spot * 70}%` }}
      aria-label="Huevo Suerte"
      onPointerDown={(e) => {
        e.stopPropagation()
        act(onCatch)
      }}
    >
      <ItemIcon item={ICON.ExpBoost} size={56} />
    </button>
  )
}

/** Aviso en la cabecera de la ruta: va con un Huevo Suerte usado o se ha cogido el de esta ruta */
export function ExpBoostBadge({ active }: { active: boolean }) {
  return (
    <div className="exp-boost-badge">
      <ItemIcon item={ICON.ExpBoost} size={22} />
      {active ? (
        <>
          <strong>EXP ×{BOOST_EXP_MULT}</strong>
          <span className="grow tiny">Cada toque da EXP · rivales con EXP de tu nivel</span>
        </>
      ) : (
        <span className="grow tiny">¡Huevo Suerte guardado en la Mochila!</span>
      )}
    </div>
  )
}
