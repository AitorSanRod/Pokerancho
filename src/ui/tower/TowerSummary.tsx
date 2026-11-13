import type { OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { closeTower, TowerEnd, type TowerRun } from '../../game/tower/tower'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { earningsRewards, giftRewards, levelUpReward } from '../shared/rewardItems'

/** Al acabar la subida, sus premios pasan de uno en uno, como al final de una ruta; ya estaban sumados en el estado */
export function TowerSummary({ tower, mon }: { tower: TowerRun; mon: OwnedMon | null }) {
  const e = tower.earned
  const won = tower.floor - 1
  // earningsRewards empieza por las victorias, que aquí ya cuenta floorReward
  const items: RewardItem[] = [
    floorReward(tower, won),
    ...earningsRewards({ wins: won, exp: e.exp, money: e.money, tickets: 0, pieces: e.pieces }).slice(1),
    ...e.prizes.flatMap((p, i) => giftRewards(p).map((item) => ({ ...item, key: `prize-${i}-${item.key}`, detail: 'Premio de piso' }))),
  ]
  if (mon && e.levelsGained > 0) items.push(levelUpReward(mon.speciesId, mon.level))
  return (
    <RewardOverlay
      title={tower.end === TowerEnd.Left ? 'Subida terminada' : 'Tu Pokémon se debilitó…'}
      items={items}
      onClose={() => act(closeTower)}
    />
  )
}

/** Hasta dónde llegó: pisos superados y si es récord */
function floorReward(tower: TowerRun, won: number): RewardItem {
  const record = won > tower.startBest
  return {
    key: 'floor',
    icon: <ItemIcon item={ICON.Tower} size={96} />,
    title: `${won} ${won === 1 ? 'piso superado' : 'pisos superados'}`,
    detail: record ? '¡Nuevo récord!' : tower.end === TowerEnd.Left ? `Abandonaste antes del piso ${tower.floor}` : `Cayó en el piso ${tower.floor}`,
    color: record ? '#d8a020' : '#6a6a80',
  }
}
