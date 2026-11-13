import { ITEM } from '../../../data/items'
import { ItemIcon } from '../../shared/ItemIcon'
import type { GymScene } from './gymScene'
import { LEADER_SPRITES } from './leaderSprites'
import './gym.css'

/** El líder detrás de su Pokémon, con sus Poké Balls: llenas las que le quedan y apagadas las de los ya vencidos */
export function GymLeader({ gym }: { gym: GymScene }) {
  return (
    <div className="gym-leader">
      {LEADER_SPRITES[gym.gymId] && <img key={gym.index} className="gym-leader-sprite" src={LEADER_SPRITES[gym.gymId]} alt={gym.leader} />}
      <div className="gym-leader-team" aria-label={`Le quedan ${gym.total - gym.index} Pokémon`}>
        {Array.from({ length: gym.total }, (_, i) => (
          <ItemIcon key={i} item={ITEM.PokeBall} size={18} off={i < gym.index} />
        ))}
      </div>
    </div>
  )
}
