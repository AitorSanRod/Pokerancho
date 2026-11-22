import { equippedMoves, MoveSection, SECTION_SLOTS } from '../../../game/combat/moveLoadout'
import type { OwnedMon } from '../../../game/core/state'
import { MoveBarMoves } from '../../incursion/MoveBarMoves'
import { SECTION_LOOK } from './moveSections'

interface Props {
  mon: OwnedMon
  section: MoveSection
  onSlot: (slot: number) => void
}

const chosenByHand = (mon: OwnedMon, section: MoveSection) => (section === MoveSection.Route ? mon.routeMoves : mon.incursionMoves) !== null

/** Una sección de la «i» con los ataques que lleva, en sus huecos: al tocar uno, se elige otro para ese hueco */
export function MoveLoadoutSection({ mon, section, onSlot }: Props) {
  const look = SECTION_LOOK[section]
  const moves = equippedMoves(mon, section)
  return (
    <section className="moves-info-section">
      <h4>{look.title}</h4>
      <p className="tiny muted">{look.hint}</p>
      <MoveBarMoves
        moves={moves}
        meta={look.meta}
        emptySlots={SECTION_SLOTS[section] - moves.length}
        onEmpty={onSlot}
        onPick={(id) => onSlot(moves.findIndex((mv) => mv.id === id))}
      />
      {!chosenByHand(mon, section) && <p className="tiny muted">Los elige el juego y se ponen al día al subir de nivel, hasta que cambies alguno.</p>}
    </section>
  )
}
