import { TM_IDS, tmName, TMS, type Tm } from '../../data/tms'
import { ItemIcon } from '../shared/ItemIcon'

interface Props {
  selected: Tm | null
  onPick: (tm: Tm) => void
  /** Cuántas tiene el jugador de cada una, para ofrecerlas; sin él se pueden pedir todas */
  held?: (tm: Tm) => number
}

/** Elegir una MT en un intercambio (las que no se tienen salen apagadas al ofrecer) */
export function TmChoice({ selected, onPick, held }: Props) {
  return (
    <div className="trade-species-grid">
      {TM_IDS.map((tm) => {
        const off = held !== undefined && held(tm) < 1
        return (
          <button key={tm} className={`trade-species ${selected === tm ? 'selected' : ''}`} disabled={off} onClick={() => onPick(tm)} aria-label={tmName(tm)}>
            <ItemIcon item={TMS[tm].item} size={36} off={off} />
            <span className="tiny">{held ? `×${held(tm)}` : tmName(tm)}</span>
          </button>
        )
      })}
    </div>
  )
}
