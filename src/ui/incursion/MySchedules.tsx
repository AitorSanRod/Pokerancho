import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { checkInOpensAt, isPending, leaveDeadline, SchedulePhase } from '../../game/incursion/schedule/scheduleRules'
import type { ScheduleView } from '../../game/incursion/schedule/scheduleView'
import { cancelScheduled, checkInScheduled, leaveScheduled } from '../../net/incursionBoard'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { formatClock, formatMoney, formatWhen } from '../shared/format'
import { ScheduleCard } from './ScheduleCard'
import { REFUSAL_TEXT, scheduleName, settledText } from './scheduleText'

/** Mis incursiones: las creadas y aceptadas con su cuenta atrás y lo que se puede hacer; debajo, cómo acabaron las últimas */
export function MySchedules({ game, views, now }: { game: GameState; views: ScheduleView[]; now: number }) {
  const pending = views.filter((v) => isPending(v.phase))
  const done = views.filter((v) => !isPending(v.phase))
  return (
    <>
      {pending.length === 0 && <p className="small muted center">No estás apuntado a ninguna incursión. Mira el tablón o programa una.</p>}
      {pending.map((v) => (
        <ScheduleCard key={v.id} game={game} view={v}>
          <MineActions view={v} now={now} />
        </ScheduleCard>
      ))}
      {done.length > 0 && <h4 className="small">Terminadas</h4>}
      {done.map((v) => (
        <p key={v.id} className="card small">
          <strong>{scheduleName(v)}</strong> ({formatWhen(v.startAt)}): {settledText(v)}
        </p>
      ))}
    </>
  )
}

function MineActions({ view, now }: { view: ScheduleView; now: number }) {
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (op: (id: string) => Promise<keyof typeof REFUSAL_TEXT | null>) => {
    setConfirm(false)
    const refused = await op(view.id)
    setError(refused ? REFUSAL_TEXT[refused] : null)
  }
  const roomOpen = view.phase === SchedulePhase.CheckIn
  const canLeave = view.phase === SchedulePhase.Open
  const canCancel = view.yoursToCancel && !roomOpen

  return (
    <>
      <p className="small">
        {roomOpen ? `¡Sala abierta! Empieza en ${formatClock(view.startAt - now)}` : `La sala abre en ${formatClock(checkInOpensAt(view.startAt) - now)}`}
        {view.you && ` · Fianza: ${formatMoney(view.you.bond)}`}
      </p>
      {!view.yoursToCancel && (
        <p className="tiny muted">{canLeave ? `Puedes darte de baja con la fianza devuelta hasta ${formatWhen(leaveDeadline(view.startAt))}.` : 'Ya no puedes darte de baja.'}</p>
      )}
      {error && <p className="notice small">{error}</p>}
      <div className="row gap">
        {roomOpen && (
          <button className="btn go grow" onClick={() => void run(checkInScheduled)}>
            Entrar a la sala
          </button>
        )}
        {canLeave && !view.yoursToCancel && (
          <button className="btn grow" onClick={() => setConfirm(true)}>
            Darse de baja
          </button>
        )}
        {canCancel && (
          <button className="btn grow" onClick={() => setConfirm(true)}>
            Cancelar
          </button>
        )}
      </div>
      {confirm && (
        <ConfirmDialog
          title={view.yoursToCancel ? `Cancelar ${scheduleName(view)}` : `Darse de baja de ${scheduleName(view)}`}
          confirmLabel={view.yoursToCancel ? 'Cancelarla' : 'Darse de baja'}
          cancelLabel="Volver"
          onConfirm={() => void run(view.yoursToCancel ? cancelScheduled : leaveScheduled)}
          onCancel={() => setConfirm(false)}
        >
          <p className="small">{view.yoursToCancel ? 'Se avisa a los apuntados y todos recuperan su fianza.' : 'Recuperas tu fianza y dejas el hueco libre.'}</p>
        </ConfirmDialog>
      )}
    </>
  )
}
