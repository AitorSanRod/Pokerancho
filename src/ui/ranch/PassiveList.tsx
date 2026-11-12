import type { PassiveLevel } from '../../data/passives'
import { Rarity, RARITY_INFO } from '../../data/species'
import type { PokeType } from '../../data/types'
import type { GameState } from '../../game/core/state'
import { legendaryTypes, passiveThreshold, ranchPassives, ranchTypeCounts } from '../../game/team/ranchPassives'
import { TypeBadge } from '../shared/common'
import { passiveText } from '../shared/passiveText'

/** «común ×1, raro ×2…»: lo que cuenta cada rareza (sin el legendario, que va aparte) */
const WEIGHT_TEXT = [Rarity.Common, Rarity.Rare, Rarity.Epic]
  .map((r) => `${RARITY_INFO[r].name.toLowerCase()} ×${RARITY_INFO[r].passiveWeight}`)
  .join(', ')

/**
 * Pasivas del rancho, una fila por tipo de los Pokémon que viven en él: cuántos hay, cuántos hacen falta para el
 * siguiente nivel y qué da (lo activo resaltado; lo que falta, en gris como objetivo).
 */
export function PassiveList({ game, ranch }: { game: GameState; ranch: number }) {
  const counts = Object.entries(ranchTypeCounts(game, ranch)) as [PokeType, number][]
  const active = new Map(ranchPassives(game, ranch).map((p) => [p.type, p.level]))
  counts.sort((a, b) => (active.get(b[0]) ?? 0) - (active.get(a[0]) ?? 0) || b[1] - a[1])

  if (counts.length === 0) return <p className="small muted">Sin Pokémon en este rancho.</p>
  return (
    <div className="passive-list">
      {legendaryTypes(game, ranch).size > 0 && (
        <p className="tiny muted">Un legendario sube la pasiva de sus tipos al nivel máximo.</p>
      )}
      <p className="tiny muted">Cada Pokémon cuenta según su rareza: {WEIGHT_TEXT}.</p>
      {counts.map(([type, count]) => {
        const level = active.get(type)
        const next = (level === 2 ? null : level === 1 ? 2 : 1) as PassiveLevel | null
        return (
          <div key={type} className={`passive-row ${level ? 'on' : ''}`}>
            <TypeBadge type={type} />
            <span className="grow small">
              {level ? <strong>Nv. {level}: {passiveText(type, level)}</strong> : <span className="muted">{passiveText(type, 1)}</span>}
              {next && (
                <span className="tiny muted">
                  {' '}
                  · {count}/{passiveThreshold(game, ranch, type, next)} para el nivel {next}
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
