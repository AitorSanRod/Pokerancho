import { useState } from 'react'
import { INCURSIONS, IncursionTier, RoomKind, type Incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { foeLevels } from '../../game/incursion/entry'
import { freePrizeSpent } from '../../game/incursion/freeIncursions'
import { canAffordEntry, keysOf, needsKey } from '../../game/incursion/keys'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { goToShop } from '../shared/navigation'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { IncursionInfo } from './IncursionInfo'
import { IncursionPrep } from './IncursionPrep'

const TIER_NAME: Record<IncursionTier, string> = { [IncursionTier.VeryEasy]: 'Muy fácil', [IncursionTier.Easy]: 'Fácil', [IncursionTier.Medium]: 'Media', [IncursionTier.Hard]: 'Difícil' }

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
        <IncursionCard key={inc.id} game={game} inc={inc} onEnter={() => setChosen(inc)} />
      ))}
      {info && <IncursionInfo onClose={() => setInfo(false)} />}
      {chosen && <IncursionPrep game={game} inc={chosen} onClose={() => setChosen(null)} />}
    </div>
  )
}

function IncursionCard({ game, inc, onEnter }: { game: GameState; inc: Incursion; onEnter: () => void }) {
  const battles = inc.rooms.filter((r) => r.kind === RoomKind.Battle).length
  const keys = keysOf(game, inc.id)
  return (
    <article className="card incursion-card">
      <div className="incursion-card-art" style={{ backgroundImage: `url(${BIOME_SCENERY[inc.biome]})` }}>
        <h3>{inc.name}</h3>
        <span className="incursion-card-tier tiny">{TIER_NAME[inc.tier]}</span>
      </div>
      <div className="incursion-card-body">
        <p className="small">{inc.description}</p>
        <p className="tiny muted">
          Entran Nv. {inc.minLevel}–{inc.maxLevel} · Rivales Nv. {foeLevels(inc).join('–')} · {inc.rooms.length} salas, {battles} de combate
        </p>
        <div className="row gap incursion-card-actions">
          {needsKey(inc.id) ? (
            <span className="incursion-keys small">
              <ItemIcon item={ICON.Incursion} size={24} off={keys === 0} /> ×{keys}
            </span>
          ) : (
            <span className="incursion-keys small">{freePrizeSpent(game, inc.id) ? 'Gratis · premios ya cobrados' : 'Gratis'}</span>
          )}
          {!canAffordEntry(game, inc.id) ? (
            <button className="btn primary grow" onClick={() => goToShop('keys')}>
              Comprar llave
            </button>
          ) : (
            <button className="btn go grow" onClick={onEnter}>
              Entrar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
