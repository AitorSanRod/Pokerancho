import { route } from '../../data/maps'
import type { OwnedMon, Run } from '../../game/core/state'
import { endRun } from '../../game/run/run'
import { act } from '../../store/store'
import { badgeReward } from '../profile/badgeReward'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { discoveryReward, earningsRewards, levelUpReward, raidBossReward, repeatNote } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { routeStars } from '../../game/run/routeStars'
import { starGoalText } from './starText'

/** Las estrellas conseguidas al completar la ruta esta vez (su premio ya va en el dinero y los tickets) */
function starRewards(run: Run): RewardItem[] {
  const stars = routeStars(route(run.routeId)).filter((star) => run.earned.stars.includes(star.key))
  return stars.map((star) => ({
    key: `star-${star.key}`,
    icon: <ItemIcon item={ICON.Star} size={96} />,
    title: '¡Nueva estrella!',
    detail: starGoalText(star),
    color: '#c8a800',
  }))
}

/** Al terminar la ruta, sus premios pasan de uno en uno; ya estaban sumados en el estado */
export function RunSummary({ run, mon }: { run: Run; mon: OwnedMon }) {
  const complete = run.phase === 'complete'
  const items = [...run.earned.discovered.map(discoveryReward), ...run.earned.raidBosses.map(raidBossReward), ...earningsRewards(run.earned)]
  if (run.earned.raidMoneyMult < 1) {
    items.push({ key: 'repeat', icon: <ItemIcon item={ICON.Money} size={96} off />, title: 'Menos dinero del jefe', detail: repeatNote(run.earned.raidMoneyMult), color: '#6a6a80' })
  }
  items.push(...starRewards(run))
  if (run.earned.badge) items.push(badgeReward(run.earned.badge))
  if (run.earned.levelsGained > 0) items.push(levelUpReward(mon.speciesId, mon.level))
  for (const id of run.unlocked) {
    items.push({ key: `unlock-${id}`, icon: <ItemIcon item={ICON.Route} size={96} />, title: 'Nueva ruta', detail: route(id).name, color: '#2f9e8f' })
  }
  if (!complete) {
    items.push({ key: 'rest', icon: <ItemIcon item={ICON.Rest} size={96} />, title: 'A descansar', detail: 'Se recuperará en el rancho', color: '#6a6a80' })
  }
  return (
    <RewardOverlay
      title={complete ? '¡Ruta completada!' : 'Tu Pokémon se debilitó…'}
      items={items}
      onClose={() => act(endRun)}
    />
  )
}
