import { ALL_TYPES, typeCollection } from '../../game/collection/typeCollection'
import type { GameState } from '../../game/core/state'
import { fiveStarCountByType, starTypeBonuses } from '../../game/team/milestones'
import { Foldout } from '../shared/Foldout'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { DexPerkRow } from './DexPerkRow'
import { DexPerkRules } from './DexPerkRules'

/**
 * Desplegable «Mejoras» de la Pokédex: arriba, las tres mejoras explicadas (qué dan, a quién y cómo); debajo, por cada
 * tipo, el daño de más de sus ataques por la colección y las stats de más de sus Pokémon por las especies con 5 ★
 */
export function DexPerks({ game }: { game: GameState }) {
  const stars = starTypeBonuses(game)
  const counts = fiveStarCountByType(game)
  const rows = ALL_TYPES.map((type) => ({ ...typeCollection(game, type), stars: stars[type] ?? 0, starCount: counts[type] ?? 0 })).filter(
    (r) => r.total > 0,
  )
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
        Bonos permanentes que tus Pokémon llevan a todos los combates: rutas, torre, raids e incursiones. Hay tres y cada uno
        afecta a algo distinto.
      </p>
      <DexPerkRules />
      <h4 className="dex-perk-title">Por tipo</h4>
      <div className="dex-perk-list">
        {rows.map((r) => (
          <DexPerkRow key={r.type} row={r} />
        ))}
      </div>
    </Foldout>
  )
}
