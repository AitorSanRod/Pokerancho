import { saveSummary, stateFromSaved, type CloudSave, type SaveSummary } from '../../game/core/cloudSave'
import type { GameState } from '../../game/core/state'
import { chooseSave } from '../../net/cloudSync'
import { AccountModal } from './AccountModal'

const day = (ms: number) => new Date(ms).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * Hay dos partidas distintas (la de la cuenta y la de este dispositivo, con progreso que la otra no tiene, p. ej. por
 * jugar sin conexión mientras otro dispositivo guardaba): se elige cuál se queda (la otra se pierde)
 */
export function CloudChoiceDialog({ cloud, local }: { cloud: CloudSave; local: GameState }) {
  return (
    <AccountModal title="¿Con qué partida sigues?">
      <p className="small confirm-text">
        Tu cuenta tiene una partida guardada en la nube y en este dispositivo hay otra con cosas que aquella no tiene (por ejemplo, si has jugado sin
        conexión o en otro dispositivo). Mira cuál va más avanzada: la que no elijas se perderá.
      </p>
      <div className="cloud-choice">
        <SummaryCard title="En la nube" summary={saveSummary(stateFromSaved(cloud.save, cloud.team))} onPick={() => chooseSave(true)} />
        <SummaryCard title="En este dispositivo" summary={saveSummary(local)} onPick={() => chooseSave(false)} />
      </div>
    </AccountModal>
  )
}

function SummaryCard({ title, summary, onPick }: { title: string; summary: SaveSummary; onPick: () => void }) {
  return (
    <div className="cloud-choice-card">
      <strong>{title}</strong>
      <span className="tiny">{summary.mons} Pokémon · Nv. máx. {summary.topLevel}</span>
      <span className="tiny">₽ {summary.money} · {summary.completedRoutes} rutas</span>
      <span className="tiny muted">Jugada el {day(summary.playedAt)}</span>
      <button className="btn primary small" onClick={onPick}>
        Usar esta
      </button>
    </div>
  )
}
