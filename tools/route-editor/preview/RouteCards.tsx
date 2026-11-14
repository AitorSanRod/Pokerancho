import type { Route } from '../../../src/data/maps'
import { RouteLock, RouteRow, RouteRowTitle } from '../../../src/ui/route/RouteRow'

/** La línea de la ruta en la lista del juego, en sus tres estados: por hacer, completada y bloqueada */
export function RouteCards({ route }: { route: Route }) {
  return (
    <div className="route-list">
      <RouteRow route={route} onClick={() => undefined}>
        <RouteRowTitle route={route} />
      </RouteRow>
      <RouteRow route={route} onClick={() => undefined}>
        <RouteRowTitle route={route} />
        <span className="route-done" title="Completada">
          ✓
        </span>
      </RouteRow>
      <RouteRow route={route} locked>
        <RouteRowTitle route={route} />
        <RouteLock />
      </RouteRow>
    </div>
  )
}
