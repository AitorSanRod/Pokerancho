import type { PassiveLevel } from '../../data/passives'
import { Rarity, RARITY_INFO } from '../../data/species'
import type { PokeType } from '../../data/types'
import type { GameState } from '../../game/core/state'
import { passiveThreshold, ranchPassives, ranchTypeCounts } from '../../game/team/ranchPassives'
import { TypeBadge } from '../shared/common'
import { MAX_PASSIVE_LEVEL, passiveLines, usefulLevel } from '../shared/passiveText'
import './passive-table.css'

/** «común ×1, raro ×2…»: lo que cuenta cada rareza */
const WEIGHT_TEXT = Object.values(Rarity)
  .map((r) => `${RARITY_INFO[r].name.toLowerCase()} ×${RARITY_INFO[r].passiveWeight}`)
  .join(', ')

interface RowProps {
  game: GameState
  ranch: number
  type: PokeType
  weight: number
  level: PassiveLevel | undefined
}

/** Cuánto lleva y cuánto falta para el siguiente nivel; en el máximo, solo el nivel */
function Progress({ game, ranch, type, weight, level }: RowProps) {
  const next = level === MAX_PASSIVE_LEVEL ? null : (((level ?? 0) + 1) as PassiveLevel)
  return (
    <span className="tiny muted">
      {level ? `Nv. ${level}` : 'Sin activar'}
      {next && ` · ${weight}/${passiveThreshold(game, ranch, type, next)} para el nivel ${next}`}
    </span>
  )
}

/** Una fila: el tipo, lo que hace y cuánto; si aún no da nada, lo del siguiente nivel útil, apagado */
function PassiveRow(props: RowProps) {
  const { type, level } = props
  const active = level !== undefined && passiveLines(type, level).length > 0
  const shown = active ? level : usefulLevel(type, level && level < MAX_PASSIVE_LEVEL ? ((level + 1) as PassiveLevel) : 1)
  const lines = passiveLines(type, shown)
  return (
    <tr className={active ? 'on' : ''}>
      <td>
        <TypeBadge type={type} />
      </td>
      <td>
        <div className="passive-cell">
          {lines.map((l) => (
            <span key={l.label} className="passive-effect small">
              {l.label}
            </span>
          ))}
          {!active && shown !== (level ?? 0) + 1 && <span className="tiny muted">Desde el nivel {shown}</span>}
          <Progress {...props} />
        </div>
      </td>
      <td className="passive-value">
        <div className="passive-cell">
          {lines.map((l) => (
            <strong key={l.label} className="small">
              {l.value}
            </strong>
          ))}
        </div>
      </td>
    </tr>
  )
}

/**
 * Pasivas del rancho en una tabla, una fila por tipo de los Pokémon que viven en él: qué hace, cuánto y lo que falta
 * para el siguiente nivel (lo activo resaltado; lo que aún no, apagado como objetivo).
 */
export function PassiveList({ game, ranch }: { game: GameState; ranch: number }) {
  const weights = Object.entries(ranchTypeCounts(game, ranch)) as [PokeType, number][]
  const active = new Map(ranchPassives(game, ranch).map((p) => [p.type, p.level]))
  weights.sort((a, b) => (active.get(b[0]) ?? 0) - (active.get(a[0]) ?? 0) || b[1] - a[1])

  if (weights.length === 0) return <p className="small muted">Sin Pokémon en este rancho.</p>
  return (
    <div className="passive-list">
      <p className="tiny muted">Cada Pokémon cuenta según su rareza: {WEIGHT_TEXT}.</p>
      <table className="passive-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Efecto</th>
            <th className="passive-value">Valor</th>
          </tr>
        </thead>
        <tbody>
          {weights.map(([type, weight]) => (
            <PassiveRow key={type} game={game} ranch={ranch} type={type} weight={weight} level={active.get(type)} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
