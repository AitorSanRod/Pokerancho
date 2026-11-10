import type { GameState, OwnedMon } from '../../../game/core/state'
import { expToNext, MAX_LEVEL } from '../../../game/team/stats'
import { MonSection } from './MonSheet'
import { TrainControl } from './TrainControl'

interface Props {
  game: GameState
  mon: OwnedMon
  /** Sesiones de entrenamiento elegidas sin aceptar: la cabecera las enseña en el arco de EXP */
  sessions: number
  onSessionsChange: (sessions: number) => void
}

const amount = (n: number) => n.toLocaleString('es-ES')

/** EXP que lleva y la que necesita para el siguiente nivel */
function expText(mon: OwnedMon): string {
  if (mon.level >= MAX_LEVEL) return 'EXP: nivel máximo'
  return `EXP: ${amount(mon.exp)} / ${amount(expToNext(mon.level))}`
}

/** Sección «Cuidados»: EXP y entrenar (solo si está en el rancho); curar es la poción de la cabecera (HealButton) */
export function CareSection({ game, mon, sessions, onSessionsChange }: Props) {
  return (
    <MonSection title="Cuidados">
      <p className="mon-care-exp">{expText(mon)}</p>
      <TrainControl game={game} mon={mon} sessions={sessions} onChange={onSessionsChange} />
    </MonSection>
  )
}
