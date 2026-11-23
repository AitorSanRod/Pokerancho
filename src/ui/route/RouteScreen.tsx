import { useEffect, useState } from 'react'
import { activeMon, type GameState } from '../../game/core/state'
import { isExpeditionDone } from '../../game/team/expedition'
import { ExpeditionScreen } from '../expeditions/ExpeditionScreen'
import { TowerScreen } from '../tower/TowerScreen'
import { IconTabs } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { routeSpots, type RouteSpot } from '../shared/navigation'
import { pendingKey, useUnseen } from '../shared/useUnseen'
import { RouteMap } from './RouteMap'
import { RunView } from './RunView'
import './route.css'

/** Pestaña Ruta: la ruta del Pokémon activo (mapa o ruta en curso), las expediciones del resto y la torre */
export function RouteScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<RouteSpot>(() => routeSpots.take() ?? 'route')
  useEffect(() => routeSpots.listen(setTab), [])
  const mon = activeMon(game)
  const returned = game.expeditions.filter(isExpeditionDone)
  const returnedUnseen = useUnseen('route:expeditions', pendingKey(returned.map((e) => e.uid)), tab === 'expeditions')

  return (
    <div className="screen tabbed">
      <IconTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'route', icon: ICON.Route, label: 'Ruta', live: game.run !== null },
          { id: 'expeditions', icon: ICON.Expedition, label: 'Expediciones', count: returnedUnseen ? returned.length : 0 },
          { id: 'tower', icon: ICON.Tower, label: 'Torre', live: game.tower !== null && game.tower.end === null },
        ]}
      />
      <div className="tabbed-body">
        {tab === 'tower' ? (
          <TowerScreen game={game} />
        ) : tab === 'expeditions' ? (
          <ExpeditionScreen game={game} />
        ) : game.run && mon ? (
          <RunView game={game} run={game.run} mon={mon} />
        ) : (
          <RouteMap game={game} />
        )}
      </div>
    </div>
  )
}
