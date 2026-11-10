import { STAR_ITEM_IDS, STAR_ITEMS, type StarItem } from '../../data/starItems'
import { ItemIcon } from '../shared/ItemIcon'

interface Props {
  selected: StarItem | null
  onPick: (item: StarItem) => void
  /** Cuántos tiene el jugador de cada uno, para ofrecerlos; sin él se pueden pedir todos */
  held?: (item: StarItem) => number
}

/** Elegir un objeto estelar en un intercambio (los que no se tienen salen apagados al ofrecer) */
export function StarItemChoice({ selected, onPick, held }: Props) {
  return (
    <div className="trade-species-grid">
      {STAR_ITEM_IDS.map((id) => (
        <button
          key={id}
          className={`trade-species ${selected === id ? 'selected' : ''}`}
          disabled={held !== undefined && held(id) < 1}
          onClick={() => onPick(id)}
          aria-label={STAR_ITEMS[id].name}
        >
          <ItemIcon item={STAR_ITEMS[id].item} size={36} off={held !== undefined && held(id) < 1} />
          <span className="tiny">{held ? `×${held(id)}` : STAR_ITEMS[id].name}</span>
        </button>
      ))}
    </div>
  )
}
