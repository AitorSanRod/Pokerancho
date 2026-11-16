import { species } from '../../data/species'
import { isFavorite } from '../../game/collection/dex'
import type { GameState, OwnedMon } from '../../game/core/state'
import { byPickOrder } from '../../game/team/pickOrder'
import { maxHp } from '../../game/team/stats'
import { Bar, Sprite } from './common'
import { HeartIcon } from './HeartIcon'
import './mon-picker.css'

/** Por qué un Pokémon sale desactivado: es favorito (no se puede dar) o por otra razón */
export type MonLock = 'favorite' | 'other'

interface Props {
  game: GameState
  mons: OwnedMon[]
  selectedUid?: string
  onSelect: (uid: string) => void
  /** Los que se enseñan pero no se pueden elegir; sin ella, todos se pueden */
  lockOf?: (m: OwnedMon) => MonLock | null
}

/** Cuadrícula para elegir un Pokémon (expediciones, jefes, incursiones, intercambios), favoritos primero y por nivel: sprite, nombre, nivel y PS */
export function MonPicker({ game, mons, selectedUid, onSelect, lockOf = () => null }: Props) {
  return (
    <div className="mon-picker" role="listbox">
      {byPickOrder(game, mons).map((m) => {
        const name = species(m.speciesId).name
        const selected = m.uid === selectedUid
        const favorite = isFavorite(game, m.speciesId)
        return (
          <button
            key={m.uid}
            role="option"
            aria-selected={selected}
            className={`mon-pick ${selected ? 'selected' : ''}`}
            disabled={lockOf(m) !== null}
            onClick={() => onSelect(m.uid)}
            aria-label={`${name} Nv. ${m.level}${favorite ? ', favorito' : ''}`}
          >
            {favorite && <HeartIcon size={12} className="mon-pick-heart" />}
            <Sprite id={m.speciesId} size={48} animated={false} shiny={m.shiny} />
            <span className="mon-pick-name tiny">{name}</span>
            <span className="mon-pick-level tiny">Nv. {m.level}</span>
            <Bar value={m.hp} max={maxHp(m)} kind="hp" />
          </button>
        )
      })}
    </div>
  )
}
