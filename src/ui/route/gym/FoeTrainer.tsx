import { ITEM } from '../../../data/items'
import { ItemIcon } from '../../shared/ItemIcon'
import type { TrainerScene } from './trainerScene'
import './gym.css'

/** El líder o el entrenador detrás de su Pokémon, con sus Poké Balls: llenas las que le quedan y apagadas las de los ya vencidos */
export function FoeTrainer({ trainer }: { trainer: TrainerScene }) {
  return (
    <div className="gym-leader">
      {trainer.sprite && <img key={trainer.index} className="gym-leader-sprite" src={trainer.sprite} alt={trainer.name} />}
      <div className="gym-leader-team" aria-label={`Le quedan ${trainer.total - trainer.index} Pokémon`}>
        {Array.from({ length: trainer.total }, (_, i) => (
          <ItemIcon key={i} item={ITEM.PokeBall} size={18} off={i < trainer.index} />
        ))}
      </div>
    </div>
  )
}
