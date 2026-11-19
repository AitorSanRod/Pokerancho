import type { CSSProperties } from 'react'
import type { StopChest } from '../../game/core/state'
import { CHEST_STOP_MS } from '../../game/run/runSurprise'
import { formatMoney } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import './chest-stop.css'

/**
 * Cofre de una parada sorpresa: sale sobre el Pokémon, salta y deja ver lo que traía. Dura lo mismo que la parada
 * (CHEST_STOP_MS); lo ganado ya está sumado y sale también en el resumen de la ruta
 */
export function ChestStop({ chest }: { chest: StopChest }) {
  const style = { ['--chest-ms' as string]: `${CHEST_STOP_MS}ms` } as CSSProperties
  const pieces = chest.pieces.length
  return (
    <div className="chest-stop" style={style}>
      <div className="chest-icon">
        <ItemIcon item={ICON.Chest} size={56} />
      </div>
      <span className="chest-loot">
        ¡Un cofre!
        <small>
          +{formatMoney(chest.money)} · +{chest.tickets} {chest.tickets === 1 ? 'ticket' : 'tickets'}
          {pieces > 0 && ` · ${pieces} de especie`}
        </small>
      </span>
    </div>
  )
}
