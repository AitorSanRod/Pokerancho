import { RANCH_BACKDROPS, type RanchBackdrop } from '../../data/ranchBackdrops'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { ranchBackdrop, setRanchBackdrop } from '../../game/team/ranchBackdrops'
import { RANCH_BACKDROP_IMAGES } from './ranchLooks'

/** Fondo del rancho: una miniatura de cada uno; tocarla lo pone */
export function RanchBackdropPicker({ game, ranch }: { game: GameState; ranch: number }) {
  const current = ranchBackdrop(game, ranch)

  return (
    <div className="ranch-backdrops" role="radiogroup" aria-label="Fondo del rancho">
      {(Object.keys(RANCH_BACKDROPS) as RanchBackdrop[]).map((id) => (
        <button
          key={id}
          className={`ranch-backdrop ${id === current ? 'selected' : ''}`}
          role="radio"
          aria-checked={id === current}
          onClick={() => act((s) => setRanchBackdrop(s, ranch, id))}
        >
          <span className="ranch-backdrop-thumb" style={{ backgroundImage: `url(${RANCH_BACKDROP_IMAGES[id]})` }} />
          <span className="tiny">{RANCH_BACKDROPS[id].name}</span>
        </button>
      ))}
    </div>
  )
}
