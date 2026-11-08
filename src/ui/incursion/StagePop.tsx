import type { ReactNode } from 'react'
import { STATUS_INFO } from '../../data/passives'
import type { MissReason } from '../../game/battle/battle'
import { EventKind, type IncursionEvent } from '../../game/incursion/events'

// Lo que flota sobre un Pokémon de la incursión al pasarle algo, con las mismas clases que el combate de ruta (BattlePop).

const MISS_POP: Record<MissReason, string> = { miss: '¡Fallo!', dodge: '¡Esquivado!', immune: 'No afecta' }

const isHeavy = (e: IncursionEvent) => e.kind === EventKind.Hit && (!!e.crit || (e.eff ?? 1) > 1)

function hitNote(e: IncursionEvent): string {
  if (e.status) return STATUS_INFO[e.status].name
  const eff = e.eff ?? 1
  return [e.crit ? '¡Crítico!' : '', eff > 1 ? '¡Muy eficaz!' : eff < 1 ? 'Poco eficaz' : ''].filter(Boolean).join(' ')
}

function popContent(e: IncursionEvent): ReactNode {
  switch (e.kind) {
    case EventKind.Hit: {
      const note = hitNote(e)
      return (
        <>
          <b>-{e.amount ?? 0}</b>
          {note && <small>{note}</small>}
        </>
      )
    }
    case EventKind.Miss:
      return MISS_POP[e.miss ?? 'miss']
    case EventKind.Heal:
      return `+${e.amount ?? 0} PS`
    case EventKind.Status:
      return e.status ? `¡${STATUS_INFO[e.status].name}!` : null
    case EventKind.Revive:
      return '¡Vuelve!'
    case EventKind.Taunt:
      return 'Provoca'
    default:
      return null
  }
}

/** Clase del número: los golpes fuertes, más grandes; los poco eficaces, más pequeños; curas en verde y estados en violeta */
function popClass(e: IncursionEvent): string {
  if (e.kind === EventKind.Heal || e.kind === EventKind.Revive) return 'heal'
  if (e.kind === EventKind.Status) return 'status'
  if (e.kind !== EventKind.Hit) return 'miss'
  return isHeavy(e) ? 'hit heavy' : (e.eff ?? 1) < 1 ? 'hit weak' : 'hit'
}

/** Número o aviso del evento `e` sobre su Pokémon; `seq` reinicia la animación en cada evento */
export function StagePop({ e, seq }: { e: IncursionEvent; seq: number }) {
  const content = popContent(e)
  if (!content) return null
  return (
    <span key={seq} className={`battle-pop ${popClass(e)}`}>
      {content}
    </span>
  )
}
