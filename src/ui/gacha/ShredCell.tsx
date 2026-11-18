import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { isSeen, knownName } from '../../game/collection/dex'
import type { GameState } from '../../game/core/state'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Casilla de la trituradora, como las de la Pokédex: al tocarla se elige cuántos de sus tickets triturar */
export function ShredCell({ game, speciesId, count, onPick }: { game: GameState; speciesId: number; count: number; onPick: () => void }) {
  const name = knownName(game, speciesId)
  return (
    <button
      className="dex-cell caught"
      style={{ ['--rarity' as string]: RARITY_INFO[rarityOf(species(speciesId))].color }}
      onClick={onPick}
      aria-label={`Triturar tickets de ${name}`}
    >
      <Sprite id={speciesId} size={72} animated={false} silhouette={!isSeen(game, speciesId)} />
      <span className="tiny">{name}</span>
      <span className="dex-pieces tiny">
        <ItemIcon item={ICON.Piece} size={14} /> {count}
      </span>
    </button>
  )
}
