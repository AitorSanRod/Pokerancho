import { species } from '../../data/species'
import type { DamageRankingView, RankingView, TopMon, TowerRankingView } from '../../game/core/ranking'
import { Sprite } from '../shared/common'
import { RankingBoard } from './RankingBoard'

// Los rankings sobre el mismo tablero: dinero, daño semanal a los jefes (con el Pokémon que más daño ha hecho) y torre

const amount = (n: number) => n.toLocaleString('es-ES')

export const MoneyBoard = ({ view }: { view: RankingView }) => <RankingBoard view={view} score={(s) => `₽ ${amount(s.money)}`} />

export const DamageBoard = ({ view }: { view: DamageRankingView }) => (
  <RankingBoard view={view} score={(s) => amount(s.damage)} detail={(s) => <TopMonLine mon={s.topMon} />} />
)

export const TowerBoard = ({ view }: { view: TowerRankingView }) => <RankingBoard view={view} score={(s) => `Piso ${amount(s.floor)}`} />

/** Tamaño (px) del sprite del Pokémon que más daño ha hecho */
const TOP_MON_SPRITE = 28

function TopMonLine({ mon }: { mon: TopMon }) {
  return (
    <span className="tiny muted ranking-mon">
      <Sprite id={mon.speciesId} size={TOP_MON_SPRITE} animated={false} />
      {species(mon.speciesId).name} · {amount(mon.damage)}
    </span>
  )
}
