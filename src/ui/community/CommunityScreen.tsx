import { useEffect, useState } from 'react'
import type { GameState } from '../../game/core/state'
import { RAID_ROTATIONS } from '../../game/raid/online/protocol'
import { IncursionScreen } from '../incursion/IncursionScreen'
import { RaidScreen } from '../raid/RaidScreen'
import { IconTabs } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { communitySpots, type CommunitySpot } from '../shared/navigation'
import { pendingKey, useUnseen } from '../shared/useUnseen'

/** La subpestaña con la que se abre: la pedida, la de lo que tenga en curso o, si no, Incursiones */
function firstSpot(game: GameState): CommunitySpot {
  const asked = communitySpots.take()
  if (asked) return asked
  const inRaid = RAID_ROTATIONS.some((r) => game.raids[r])
  const inIncursion = game.incursion !== null || game.incursionCheckin !== null
  return inRaid && !inIncursion ? 'raid' : 'incursion'
}

/** Pestaña Comunidad: lo que se juega con otros jugadores a una hora (incursiones programadas y jefes de raid) */
export function CommunityScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<CommunitySpot>(() => firstSpot(game))
  useEffect(() => communitySpots.listen(setTab), [])
  const prizes = game.raidPrizes
  const prizesUnseen = useUnseen('route:raid', pendingKey(prizes.map((p) => `${p.bossSpeciesId}:${p.uid}`)), tab === 'raid')

  return (
    <div className="screen tabbed">
      <IconTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'incursion', icon: ICON.Incursion, label: 'Incursiones', live: game.incursion !== null || game.incursionCheckin !== null },
          { id: 'raid', icon: ICON.Raid, label: 'Raids', count: prizesUnseen ? prizes.length : 0, live: RAID_ROTATIONS.some((r) => game.raids[r]) },
        ]}
      />
      <div className="tabbed-body">{tab === 'raid' ? <RaidScreen game={game} /> : <IncursionScreen game={game} />}</div>
    </div>
  )
}
