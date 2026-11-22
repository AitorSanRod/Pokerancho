import { useState } from 'react'
import { MoveSection } from '../../../game/combat/moveLoadout'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { Modal } from '../Modal'
import { MoveLoadoutSection } from './MoveLoadoutSection'
import { MoveSlotView } from './MoveSlotView'
import { SpeciesMoveList } from './SpeciesMoveList'
import './moves-info.css'

interface Props {
  game: GameState
  speciesId: number
  /** Tu Pokémon: se ven y se cambian los que lleva; sin él (Pokédex), todo lo que aprende la especie */
  mon?: OwnedMon
  /** Solo una sección (antes de entrar en una incursión) */
  only?: MoveSection
  onClose: () => void
}

interface OpenSlot {
  section: MoveSection
  slot: number
}

/** La «i» de los ataques: dos secciones, rutas e incursiones, con los ataques que lleva en cada una */
export function MovesInfo({ game, speciesId, mon, only, onClose }: Props) {
  const [open, setOpen] = useState<OpenSlot | null>(null)
  const sections = only ? [only] : Object.values(MoveSection)
  if (mon && open) {
    return (
      <Modal className="moves-info" label="Elegir ataque" onClose={onClose}>
        <MoveSlotView game={game} mon={mon} section={open.section} slot={open.slot} onDone={() => setOpen(null)} />
      </Modal>
    )
  }
  return (
    <Modal className="moves-info" label="Sus ataques" onClose={onClose}>
      <h3>Sus ataques</h3>
      <div className="moves-info-body">
        {sections.map((section) =>
          mon ? (
            <MoveLoadoutSection key={section} mon={mon} section={section} onSlot={(slot) => setOpen({ section, slot })} />
          ) : (
            <SpeciesMoveList key={section} speciesId={speciesId} section={section} />
          ),
        )}
      </div>
      <button className="btn primary" onClick={onClose}>
        Entendido
      </button>
    </Modal>
  )
}
