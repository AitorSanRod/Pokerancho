import { route } from '../../data/maps'
import type { OwnedMon, Run } from '../../game/core/state'
import { endRun } from '../../game/run/run'
import { act } from '../../store/store'
import { badgeReward } from '../profile/badgeReward'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { discoveryReward, earningsRewards, levelUpReward, raidBossReward, repeatNote } from '../shared/rewardItems'
import { RewardOverlay } from '../shared/RewardOverlay'

/** Al terminar la ruta, sus premios pasan de uno en uno; ya estaban sumados en el estado */
export function RunSummary({ run, mon }: { run: Run; mon: OwnedMon }) {
  const complete = run.phase === 'complete'
  const items = [...run.earned.discovered.map(discoveryReward), ...run.earned.raidBosses.map(raidBossReward), ...earningsRewards(run.earned)]
  if (run.earned.raidMoneyMult < 1) {
    items.push({ key: 'repeat', icon: <ItemIcon item={ICON.Money} size={96} off />, title: 'Menos dinero del jefe', detail: repeatNote(run.earned.raidMoneyMult), color: '#6a6a80' })
  }
  if (run.earned.badge) items.push(badgeReward(run.earned.badge))
  if (run.earned.levelsGained > 0) items.push(levelUpReward(mon.speciesId, mon.level))
  if (run.unlocked) {
    items.push({ key: 'unlock', icon: <ItemIcon item={ICON.Route} size={96} />, title: 'Nueva ruta', detail: route(run.unlocked).name, color: '#2f9e8f' })
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
