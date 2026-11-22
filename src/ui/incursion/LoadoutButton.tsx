import { useState } from 'react'
import { MoveSection } from '../../game/combat/moveLoadout'
import type { GameState, OwnedMon } from '../../game/core/state'
import { MovesInfo } from '../shared/sheet/MovesInfo'

/** «Cambiar ataques» antes de entrar en una incursión: abre los 4 que lleva, los mismos de la «i» de su ficha */
export function LoadoutButton({ game, mon, onClosed }: { game: GameState; mon: OwnedMon; onClosed?: () => void }) {
  const [open, setOpen] = useState(false)
  const close = () => {
    setOpen(false)
    onClosed?.()
  }
  return (
    <>
      <button className="btn small" onClick={() => setOpen(true)}>
        Cambiar ataques
      </button>
      {open && <MovesInfo game={game} speciesId={mon.speciesId} mon={mon} only={MoveSection.Incursion} onClose={close} />}
    </>
  )
}
