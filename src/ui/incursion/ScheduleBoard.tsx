import { useState } from 'react'
import { type GameState } from '../../game/core/state'
import { canAffordEntry } from '../../game/incursion/keys'
import { scheduleBlocker } from '../../game/incursion/schedule/linkedSchedule'
import { BOND_FRACTION, bondFor, CHECKIN_OPEN_MS } from '../../game/incursion/schedule/scheduleRules'
import type { ScheduleView } from '../../game/incursion/schedule/scheduleView'
import { joinScheduled } from '../../net/incursionBoard'
import { nickname } from '../../net/identity'
import { NicknameDialog } from '../raid/NicknameDialog'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { goToShop } from '../shared/navigation'
import { formatMinutes, formatMoney, formatPercent } from '../shared/format'
import { ScheduleCard } from './ScheduleCard'
import { boardBlocker, REFUSAL_TEXT, scheduleName } from './scheduleText'

/** Tablón: las incursiones programadas por otros, para aceptarlas */
export function ScheduleBoard({ game, views, onJoined }: { game: GameState; views: ScheduleView[]; onJoined: () => void }) {
  const open = views.filter((v) => !v.you)
  if (open.length === 0) return <p className="small muted center">No hay incursiones programadas. ¡Programa tú una!</p>
  return (
    <>
      {open.map((v) => (
        <ScheduleCard key={v.id} game={game} view={v}>
          <JoinAction game={game} view={v} onJoined={onJoined} />
        </ScheduleCard>
      ))}
    </>
  )
}

function JoinAction({ game, view, onJoined }: { game: GameState; view: ScheduleView; onJoined: () => void }) {
  const [dialog, setDialog] = useState<'name' | 'confirm' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const blocker = boardBlocker(view) ?? scheduleBlocker(game, view.incursionId)
  const bond = bondFor(game.money)

  const join = async () => {
    setDialog(null)
    const refused = await joinScheduled(view.id)
    if (refused) setError(REFUSAL_TEXT[refused])
    else onJoined()
  }

  if (blocker)
    return (
      <>
        <p className="notice small">{blocker}</p>
        {!canAffordEntry(game, view.incursionId) && (
          <button className="btn primary" onClick={() => goToShop('keys')}>
            Comprar llave
          </button>
        )}
      </>
    )
  return (
    <>
      {error && <p className="notice small">{error}</p>}
      <button className="btn go" onClick={() => setDialog(nickname() ? 'confirm' : 'name')}>
        Aceptar · fianza {formatMoney(bond)}
      </button>
      {dialog === 'name' && <NicknameDialog onDone={() => setDialog('confirm')} onCancel={() => setDialog(null)} />}
      {dialog === 'confirm' && (
        <ConfirmDialog title={`Apuntarse a ${scheduleName(view)}`} confirmLabel="Aceptar" onConfirm={() => void join()} onCancel={() => setDialog(null)}>
          <p className="small">
            Se retienen {formatMoney(bond)} (el {formatPercent(BOND_FRACTION)} de tu dinero) como fianza. Te los devolvemos al hacer el checkin en la sala,
            que abre {formatMinutes(CHECKIN_OPEN_MS / 60_000)} antes. Si no te presentas, se reparten entre los que sí vengan.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
