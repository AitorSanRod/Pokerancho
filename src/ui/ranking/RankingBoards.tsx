import { species } from '../../data/species'
import type { DamageRankingView, RankingView, TopMon, TowerRankingView } from '../../game/core/ranking'
import { Sprite } from '../shared/common'
import { RankingBoard } from './RankingBoard'
import { formatCount } from '../shared/format'

// Los rankings sobre el mismo tablero: dinero, daño semanal a los jefes (con el Pokémon que más daño ha hecho) y torre


export const MoneyBoard = ({ view }: { view: RankingView }) => <RankingBoard view={view} score={(s) => `₽ ${formatCount(s.money)}`} />

export const DamageBoard = ({ view }: { view: DamageRankingView }) => (
  <RankingBoard view={view} score={(s) => formatCount(s.damage)} detail={(s) => <TopMonLine mon={s.topMon} />} />
)

export const TowerBoard = ({ view }: { view: TowerRankingView }) => <RankingBoard view={view} score={(s) => `Piso ${formatCount(s.floor)}`} />

/** Tamaño (px) del sprite del Pokémon que más daño ha hecho */
const TOP_MON_SPRITE = 28

function TopMonLine({ mon }: { mon: TopMon }) {
  return (
    <span className="tiny muted ranking-mon">
      <Sprite id={mon.speciesId} size={TOP_MON_SPRITE} animated={false} />
      {species(mon.speciesId).name} · {formatCount(mon.damage)}
    </span>
  )
}
