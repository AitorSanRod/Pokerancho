import { useState } from 'react'
import { MoveSection, speciesMoveList } from '../../../game/combat/moveLoadout'
import { MoveBarMoves } from '../../incursion/MoveBarMoves'
import { MoveDetail } from './MoveDetail'
import { SECTION_LOOK } from './moveSections'

/** Una sección de la «i» en la Pokédex: todo lo que puede llegar a llevar, con su nivel; al tocar uno, sus datos */
export function SpeciesMoveList({ speciesId, section }: { speciesId: number; section: MoveSection }) {
  const look = SECTION_LOOK[section]
  const list = speciesMoveList(speciesId, section)
  const [shownId, setShownId] = useState<string | null>(null)
  const shown = list.find((m) => m.move.id === shownId)
  const levelOf = new Map(list.map((m) => [m.move.id, m.level]))
  return (
    <section className="moves-info-section">
      <h4>{look.title}</h4>
      <p className="tiny muted">{look.hint}</p>
      {shown && <MoveDetail move={shown.move} origin={`Desde Nv. ${shown.level}`} taps={look.taps} />}
      <MoveBarMoves
        moves={list.map((m) => m.move)}
        selectedId={shownId}
        meta={(mv) => `Nv. ${levelOf.get(mv.id)}`}
        onPick={(id) => setShownId(id === shownId ? null : id)}
      />
    </section>
  )
}
