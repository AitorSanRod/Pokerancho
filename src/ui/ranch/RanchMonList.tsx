import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { ranchMonsByLevel } from '../../game/team/ranches'
import { passiveWeightOf } from '../../game/team/ranchPassives'
import { Sprite, TypeBadge } from '../shared/common'

/** Sección «Pokémon» del panel del rancho: los suyos por nivel, con sus tipos y lo que suma cada uno a las pasivas */
export function RanchMonList({ game, ranch }: { game: GameState; ranch: number }) {
  const mons = ranchMonsByLevel(game, ranch)
  if (mons.length === 0) return <p className="tiny muted">Aún no hay Pokémon en este rancho.</p>
  return (
    <>
      <p className="tiny muted">Cada uno suma a las pasivas de sus tipos según su rareza.</p>
      <ul className="ranch-mon-list">
        {mons.map((m) => {
          const sp = species(m.speciesId)
          return (
            <li key={m.uid} className="ranch-mon-row small">
              <Sprite id={m.speciesId} size={32} animated={false} shiny={m.shiny} />
              <span className="grow">
                {sp.name} <span className="muted">Nv. {m.level}</span>
              </span>
              <span className="ranch-mon-types">
                {sp.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </span>
              <strong className="ranch-mon-weight" title="Lo que suma a cada uno de sus tipos para las pasivas">
                +{passiveWeightOf(m.speciesId)}
              </strong>
            </li>
          )
        })}
      </ul>
    </>
  )
}
