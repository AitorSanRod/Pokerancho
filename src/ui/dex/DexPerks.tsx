import { TYPE_INFO } from '../../data/types'
import { ALL_TYPES, typeCollection } from '../../game/collection/typeCollection'
import type { GameState } from '../../game/core/state'
import { LEVEL_MILESTONES, MILESTONE_STAT_BONUS, STAR_TYPE_BONUS, STAR_TYPE_BONUS_MAX, starTypeBonuses } from '../../game/team/milestones'
import { formatBonus } from '../shared/format'
import { Foldout } from '../shared/Foldout'
import { TypeBadge } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/**
 * Desplegable «Mejoras» de la Pokédex: por cada tipo, el daño de más de sus ataques por la colección (y lo que falta
 * para el siguiente corte) y las stats de más por sus especies con 5 ★; debajo, cómo funcionan los hitos de nivel
 */
export function DexPerks({ game }: { game: GameState }) {
  const stars = starTypeBonuses(game)
  const rows = ALL_TYPES.map((type) => ({ ...typeCollection(game, type), stars: stars[type] ?? 0 })).filter((r) => r.total > 0)
  const active = rows.filter((r) => r.damage > 0 || r.stars > 0).length

  return (
    <Foldout
      kicker="Pokédex"
      title="Mejoras"
      className="dex-perks"
      art={<ItemIcon item={ICON.Perks} size={72} className="dex-perks-art" />}
      aside={
        <>
          <strong>{active}</strong>/{rows.length}
        </>
      }
      defaultOpen={false}
    >
      <p className="small muted">
        Capturar especies de un tipo hace que sus ataques peguen más. Cada especie con 5 ★ da {formatBonus(STAR_TYPE_BONUS)} de
        stats a todos los Pokémon de sus tipos (hasta {formatBonus(STAR_TYPE_BONUS_MAX)} por tipo).
      </p>
      <div className="dex-perk-list">
        {rows.map((r) => (
          <div key={r.type} className="dex-perk-row" style={{ ['--type-color' as string]: TYPE_INFO[r.type].color }}>
            <TypeBadge type={r.type} />
            <span className="grow">
              <span className="small">
                <strong>{r.caught}</strong>/{r.total} capturados
              </span>
              <span className="tiny muted">{r.next ? `Siguiente: ${formatBonus(r.next.damage)} de daño al ${Math.round(r.next.share * 100)} %` : '¡Colección completa!'}</span>
            </span>
            <span className={`dex-perk-value ${r.damage > 0 ? 'on' : ''}`}>{r.damage > 0 ? `${formatBonus(r.damage)} daño` : '—'}</span>
            {r.stars > 0 && <span className="dex-perk-value on">{formatBonus(r.stars)} stats</span>}
          </div>
        ))}
      </div>
      <p className="small muted">
        Hitos de nivel: al llegar a {LEVEL_MILESTONES.map((l) => `Nv. ${l}`).join(', ')}, cada Pokémon gana{' '}
        {formatBonus(MILESTONE_STAT_BONUS)} en todas sus stats. Se ven en su ficha.
      </p>
    </Foldout>
  )
}
