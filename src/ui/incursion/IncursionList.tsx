import { useState } from 'react'
import { INCURSIONS, IncursionTier, RoomKind, type Incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { keysOf } from '../../game/incursion/keys'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { IncursionInfo } from './IncursionInfo'
import { IncursionPrep } from './IncursionPrep'

const TIER_NAME: Record<IncursionTier, string> = { [IncursionTier.Easy]: 'Fácil', [IncursionTier.Medium]: 'Media', [IncursionTier.Hard]: 'Difícil' }

/** Pestaña Incursiones sin ninguna en curso: la información y cada incursión con sus llaves */
export function IncursionList({ game }: { game: GameState }) {
  const [info, setInfo] = useState(false)
  const [chosen, setChosen] = useState<Incursion | null>(null)

  return (
    <div className="screen scroll incursion-list">
      <button className="btn incursion-info-btn" onClick={() => setInfo(true)}>
        Cómo funcionan las incursiones
      </button>
      {INCURSIONS.map((inc) => (
        <IncursionCard key={inc.id} inc={inc} keys={keysOf(game, inc.id)} onEnter={() => setChosen(inc)} />
      ))}
      {info && <IncursionInfo onClose={() => setInfo(false)} />}
      {chosen && <IncursionPrep game={game} inc={chosen} onClose={() => setChosen(null)} />}
    </div>
  )
}

function IncursionCard({ inc, keys, onEnter }: { inc: Incursion; keys: number; onEnter: () => void }) {
  const battles = inc.rooms.filter((r) => r.kind === RoomKind.Battle).length
  return (
    <article className="card incursion-card">
      <div className="incursion-card-art" style={{ backgroundImage: `url(${BIOME_SCENERY[inc.biome]})` }}>
        <h3>{inc.name}</h3>
        <span className="incursion-card-tier tiny">{TIER_NAME[inc.tier]}</span>
      </div>
      <div className="incursion-card-body">
        <p className="small">{inc.description}</p>
        <p className="tiny muted">
          Nv. {inc.minLevel}–{inc.maxLevel} · {inc.rooms.length} salas, {battles} de combate
        </p>
        <div className="row gap incursion-card-actions">
          <span className="incursion-keys small">
            <ItemIcon item={ICON.Incursion} size={24} off={keys === 0} /> ×{keys}
          </span>
          <button className="btn primary grow" disabled={keys === 0} onClick={onEnter}>
            {keys === 0 ? 'Compra una llave en la Tienda' : 'Preparar'}
          </button>
        </div>
      </div>
    </article>
  )
}
