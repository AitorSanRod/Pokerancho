import { useState } from 'react'
import { incursion } from '../../data/incursions'
import { canEnter } from '../../game/incursion/entry'
import { canAffordEntry } from '../../game/incursion/keys'
import { PARTY_SIZE } from '../../game/incursion/party'
import { monRepertoire } from '../../game/incursion/repertoire'
import type { ScheduleCheckin } from '../../game/incursion/schedule/linkedSchedule'
import { checkinMonBlocker, lockCheckinMon, markCheckinMon } from '../../game/incursion/schedule/scheduleCheckin'
import type { SeatView } from '../../game/incursion/schedule/scheduleView'
import { findMon, MonPlace, monPlace, type GameState } from '../../game/core/state'
import { useScheduleBoard } from '../../net/incursionBoard'
import { syncScheduleRoomNow } from '../../net/scheduleSync'
import { act } from '../../store/store'
import { Sprite } from '../shared/common'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { MonPicker } from '../shared/MonPicker'
import { goToShop } from '../shared/navigation'
import { MovePicker } from './MovePicker'

/** Sala del checkin, a pantalla de la pestaña: cuenta atrás, los huecos y el Pokémon y el ataque con los que entras */
export function ScheduleRoom({ game, c }: { game: GameState; c: ScheduleCheckin }) {
  const { board, clockOffset } = useScheduleBoard()
  const view = board?.mine.find((v) => v.id === c.scheduleId)
  const inc = incursion(c.incursionId)
  const left = c.startAt - (game.lastTick + clockOffset)
  const seats: (SeatView | null)[] = Array.from({ length: PARTY_SIZE }, (_, i) => view?.seats[i] ?? null)

  return (
    <div className="screen scroll schedule-room">
      <h3 className="center">{inc.name}</h3>
      <p className="center small">{left > 0 ? `Empieza en ${formatClock(left)}` : 'Empezando…'}</p>
      <ul className="schedule-seats">
        {seats.map((s, i) => (
          <SeatRow key={i} seat={s} />
        ))}
      </ul>
      <YourPick game={game} c={c} />
    </div>
  )
}

function SeatRow({ seat }: { seat: SeatView | null }) {
  if (!seat) return <li className="schedule-seat muted small">Hueco libre: lo ocupará un bot</li>
  return (
    <li className="schedule-seat small">
      {seat.speciesId ? <Sprite id={seat.speciesId} size={40} shiny={seat.shiny} /> : <span className="schedule-seat-empty" />}
      <span className="grow">
        <strong>{seat.nickname}</strong>
        {seat.level && ` · Nv. ${seat.level}`}
      </span>
      {!seat.checkedIn && <span className="tiny muted">sin checkin</span>}
      {seat.locked && <ItemIcon item={ICON.Locked} size={24} />}
    </li>
  )
}

/** Tu parte: aviso si falta la llave o no hay Pokémon; si no, elegir Pokémon y ataque, y fijarlos */
function YourPick({ game, c }: { game: GameState; c: ScheduleCheckin }) {
  const [confirm, setConfirm] = useState(false)
  const inc = incursion(c.incursionId)
  if (!canAffordEntry(game, inc.id)) {
    return (
      <div className="schedule-room-you">
        <p className="notice small">Sin llave no podrás entrar: tu hueco lo ocupará un bot. Si la compras antes de la hora, podrás elegir tu Pokémon.</p>
        <button className="btn primary" onClick={() => goToShop('keys')}>
          Comprar llave
        </button>
      </div>
    )
  }
  const mons = game.owned.filter((m) => m.uid === c.uid || monPlace(game, m.uid) === MonPlace.Ranch)
  const mon = c.uid ? findMon(game, c.uid) : undefined
  const moves = mon ? monRepertoire(mon) : []
  const mark = (uid: string, moveId: string) => {
    act((s) => markCheckinMon(s, uid, moveId))
    syncScheduleRoomNow()
  }
  const pickMon = (uid: string) => {
    const next = findMon(game, uid)
    if (next) mark(uid, monRepertoire(next)[0]?.id ?? '')
  }
  const lock = () => {
    setConfirm(false)
    act(lockCheckinMon)
    syncScheduleRoomNow()
  }

  return (
    <div className="schedule-room-you">
      <div className="label">Tu Pokémon {c.locked && '(fijado)'}</div>
      {c.locked && mon ? (
        <p className="small center">
          <Sprite id={mon.speciesId} size={64} shiny={mon.shiny} /> Entras con él: ya no se puede cambiar.
        </p>
      ) : (
        <>
          <MonPicker
            game={game}
            mons={mons}
            selectedUid={c.uid ?? undefined}
            onSelect={pickMon}
            lockOf={(m) => (canEnter(inc, m.level) && !checkinMonBlocker(game, inc.id, m.uid, monRepertoire(m)[0]?.id ?? '') ? null : 'other')}
          />
          {!mon && <p className="notice small">Ninguno de tus Pokémon del rancho puede entrar ahora (nivel o PS).</p>}
          {mon && c.moveId && <MovePicker moves={moves} selectedId={c.moveId} onSelect={(moveId) => mark(mon.uid, moveId)} />}
          <p className="tiny muted">Si no lo fijas, entras con el que tengas marcado a la hora de comienzo.</p>
          <button className="btn primary" disabled={!mon} onClick={() => setConfirm(true)}>
            Fijar
          </button>
        </>
      )}
      {confirm && (
        <ConfirmDialog title="Fijar tu Pokémon" confirmLabel="Fijar" onConfirm={lock} onCancel={() => setConfirm(false)}>
          <p className="small">Después ya no podrás cambiar de Pokémon ni de ataque hasta que empiece.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
