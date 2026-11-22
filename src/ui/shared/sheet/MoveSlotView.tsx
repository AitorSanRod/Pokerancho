import type { IncursionMove } from '../../../data/incursionMoves'
import { equipMove, equippedMoves, lockedCheckinMove, loadoutBlocker, MoveSection, slotOptions } from '../../../game/combat/moveLoadout'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../store/store'
import { MoveBarMoves } from '../../incursion/MoveBarMoves'
import { MoveDetail } from './MoveDetail'
import { originText, SECTION_LOOK } from './moveSections'

interface Props {
  game: GameState
  mon: OwnedMon
  section: MoveSection
  slot: number
  onDone: () => void
}

/**
 * Un hueco de la «i»: arriba, todos los datos del ataque que lleva; debajo, los que puede poner (al tocar uno, entra en
 * el hueco), los que ya lleva en otro hueco y los que aprenderá, estos dos últimos desactivados y al final
 */
export function MoveSlotView({ game, mon, section, slot, onDone }: Props) {
  const look = SECTION_LOOK[section]
  const current: IncursionMove | undefined = equippedMoves(mon, section)[slot]
  const { open, equipped, later } = slotOptions(mon, section)
  const others = equipped.filter((mv) => mv.id !== current?.id)
  const pinned = section === MoveSection.Incursion && current !== undefined && current.id === lockedCheckinMove(game, mon.uid)
  const blocker = loadoutBlocker(game, mon.uid) ?? (pinned ? 'Entra en la incursión con este ataque, ya fijado: cambia otro hueco.' : null)
  const laterLevel = new Map(later.map((f) => [f.move.id, f.level]))
  const listed = [...open, ...others, ...later.map((f) => f.move)]
  const meta = (mv: IncursionMove) => (laterLevel.has(mv.id) ? `Nv. ${laterLevel.get(mv.id)}` : others.includes(mv) ? 'Ya lo lleva' : look.meta(mv))
  const pickable = (mv: IncursionMove) => !blocker && open.includes(mv)

  const pick = (moveId: string) => {
    if (act((s) => equipMove(s, mon.uid, section, slot, moveId))) onDone()
  }

  return (
    <div className="move-slot-view">
      <h3>
        {look.title} · hueco {slot + 1}
      </h3>
      {current ? <MoveDetail move={current} origin={originText(mon.speciesId, section, current.id)} taps={look.taps} /> : <p className="notice small">Hueco libre</p>}
      {blocker && <p className="notice small">{blocker}</p>}
      <div className="label">{current ? 'Cambiar por' : 'Elige uno'}</div>
      <div className="moves-info-body">
        {listed.length > 0 ? (
          <MoveBarMoves moves={listed} meta={meta} disabledOf={(mv) => !pickable(mv)} onPick={pick} />
        ) : (
          <p className="tiny muted">No sabe otros.</p>
        )}
      </div>
      <button className="btn" onClick={onDone}>
        Atrás
      </button>
    </div>
  )
}
