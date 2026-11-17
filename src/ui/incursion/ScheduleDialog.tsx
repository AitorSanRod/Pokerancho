import { useMemo, useState } from 'react'
import type { Incursion } from '../../data/incursions'
import type { GameState } from '../../game/core/state'
import { scheduleBlocker } from '../../game/incursion/schedule/linkedSchedule'
import { BOND_FRACTION, bondFor, CHECKIN_OPEN_MS, validSlots } from '../../game/incursion/schedule/scheduleRules'
import { scheduleIncursion } from '../../net/incursionBoard'
import { nickname } from '../../net/identity'
import { NicknameDialog } from '../raid/NicknameDialog'
import { formatMinutes, formatMoney, formatPercent } from '../shared/format'
import { Modal } from '../shared/Modal'
import { REFUSAL_TEXT } from './scheduleText'

const dayOf = (t: number) => new Date(t).toDateString()
const DAY_LABEL = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const TIME_LABEL = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

/** Programar una incursión: día y franja de hora; avisa de la fianza que se retiene */
export function ScheduleDialog({ game, inc, now, onClose, onDone }: { game: GameState; inc: Incursion; now: number; onClose: () => void; onDone: () => void }) {
  const slots = useMemo(() => validSlots(now), [now])
  const days = useMemo(() => [...new Set(slots.map(dayOf))], [slots])
  const [day, setDay] = useState(days[0])
  const times = slots.filter((t) => dayOf(t) === day)
  const [startAt, setStartAt] = useState(times[0])
  const [naming, setNaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocker = scheduleBlocker(game, inc.id)
  const bond = bondFor(game.money)

  const pickDay = (d: string) => {
    setDay(d)
    setStartAt(slots.find((t) => dayOf(t) === d) ?? slots[0])
  }
  const submit = async () => {
    if (!nickname()) return setNaming(true)
    const refused = await scheduleIncursion(inc.id, startAt)
    if (refused) return setError(REFUSAL_TEXT[refused])
    onDone()
  }

  return (
    <Modal className="schedule-dialog" label={`Programar ${inc.name}`} onClose={onClose}>
      <h3>Programar {inc.name}</h3>
      <div className="schedule-dialog-body">
        <label className="small">
          Día
          <select value={day} onChange={(e) => pickDay(e.target.value)}>
            {days.map((d) => (
              <option key={d} value={d}>
                {DAY_LABEL.format(new Date(d))}
              </option>
            ))}
          </select>
        </label>
        <label className="small">
          Hora
          <select value={startAt} onChange={(e) => setStartAt(Number(e.target.value))}>
            {times.map((t) => (
              <option key={t} value={t}>
                {TIME_LABEL.format(t)}
              </option>
            ))}
          </select>
        </label>
        <p className="tiny muted">
          Ocupas un hueco y se retienen {formatMoney(bond)} (el {formatPercent(BOND_FRACTION)} de tu dinero) como fianza: te los devolvemos al hacer el checkin
          en la sala, que abre {formatMinutes(CHECKIN_OPEN_MS / 60_000)} antes. Se avisa a quien tenga activadas las notificaciones de incursiones.
        </p>
        {(blocker || error) && <p className="notice small">{blocker ?? error}</p>}
        <div className="row gap confirm-actions">
          <button className="btn grow" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary grow" disabled={!!blocker || !startAt} onClick={() => void submit()}>
            Programar
          </button>
        </div>
      </div>
      {naming && <NicknameDialog onDone={() => setNaming(false)} onCancel={() => setNaming(false)} />}
    </Modal>
  )
}
