import { SaveSide } from '../../game/core/cloudChoice'
import { saveSummary, stateFromSaved, type CloudSave, type SaveSummary } from '../../game/core/cloudSave'
import type { GameState } from '../../game/core/state'
import { chooseSave } from '../../net/cloudSync'
import { AccountModal } from './AccountModal'
import { formatMoney } from '../shared/format'

const day = (ms: number) => new Date(ms).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * Hay dos partidas distintas (la de la cuenta y la de este dispositivo, cada una con progreso que la otra no tiene, p. ej.
 * por jugar sin conexión mientras otro dispositivo guardaba): se elige cuál se queda (la otra se pierde). Se marca como
 * recomendada la que se jugó después.
 */
export function CloudChoiceDialog({
  cloud,
  local,
  recommended,
  localPlayedAt,
}: {
  cloud: CloudSave
  local: GameState
  recommended: SaveSide | null
  localPlayedAt: number | null
}) {
  return (
    <AccountModal title="¿Con qué partida sigues?">
      <p className="small confirm-text">
        Tu cuenta tiene una partida guardada en la nube y en este dispositivo hay otra con cosas que aquella no tiene (por ejemplo, si has jugado sin
        conexión o en otro dispositivo). Te recomendamos la más reciente; mira cuál va más avanzada: la que no elijas se perderá.
      </p>
      <div className="cloud-choice">
        <SummaryCard
          title="En la nube"
          summary={{ ...saveSummary(stateFromSaved(cloud.save, cloud.team)), playedAt: cloud.updatedAt }}
          recommended={recommended === SaveSide.Cloud}
          onPick={() => chooseSave(true)}
        />
        <SummaryCard
          title="En este dispositivo"
          summary={{ ...saveSummary(local), playedAt: localPlayedAt ?? local.lastTick }}
          recommended={recommended === SaveSide.Local}
          onPick={() => chooseSave(false)}
        />
      </div>
    </AccountModal>
  )
}

function SummaryCard({ title, summary, recommended, onPick }: { title: string; summary: SaveSummary; recommended: boolean; onPick: () => void }) {
  return (
    <div className={`cloud-choice-card ${recommended ? 'recommended' : ''}`}>
      {recommended && <span className="cloud-choice-badge tiny">Más reciente</span>}
      <strong>{title}</strong>
      <span className="tiny">{summary.mons} Pokémon · Nv. máx. {summary.topLevel}</span>
      <span className="tiny">{formatMoney(summary.money)} · {summary.completedRoutes} rutas</span>
      <span className="tiny muted">Jugada el {day(summary.playedAt)}</span>
      <button className={`btn small ${recommended ? 'primary' : ''}`} onClick={onPick}>
        Usar esta
      </button>
    </div>
  )
}
