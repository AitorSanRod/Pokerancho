import type { Route } from '../../data/maps'
import type { GameState } from '../../game/core/state'
import { hasStar, meetsNow, routeSpecies, routeStars, starCount, starPrize, StarGoal, unseenRouteSpecies } from '../../game/run/routeStars'
import { starGoalText } from './starText'
import { formatMoney } from '../shared/format'
import './route-stars.css'

/** Estrellas de la ruta en su tarjeta de la lista: ★★☆ */
export function RouteStarCount({ game, route: r }: { game: GameState; route: Route }) {
  const total = routeStars(r).length
  const earned = starCount(game, r)
  return (
    <span className="route-stars" aria-label={`${earned} de ${total} estrellas`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < earned ? 'on' : ''} aria-hidden>
          ★
        </span>
      ))}
    </span>
  )
}

function StarPrize({ route: r }: { route: Route }) {
  const prize = starPrize(r)
  return (
    <span className="tiny muted">
      +{prize.tickets} tickets · +{formatMoney(prize.money)}
    </span>
  )
}

/** Cuántas especies de la ruta faltan por descubrir, junto al objetivo de verlas todas */
function SeenProgress({ game, route: r }: { game: GameState; route: Route }) {
  const total = routeSpecies(r).length
  return (
    <span className="tiny muted">
      {total - unseenRouteSpecies(game, r).length}/{total} descubiertas
    </span>
  )
}

/** Si el compañero que va a salir cumple ya lo que pide (en las que se sabe antes de salir) */
function ReadyNote({ ready }: { ready: boolean | null }) {
  if (ready === null) return null
  return <span className={`tiny route-star-ready ${ready ? 'yes' : 'no'}`}>{ready ? 'Tu compañero lo cumple' : 'Tu compañero no lo cumple'}</span>
}

/** Las tres estrellas de la ruta en el diálogo de comenzar: qué pide cada una, su premio, si ya está y si se puede ahora */
export function RouteStarList({ game, route: r }: { game: GameState; route: Route }) {
  return (
    <ul className="route-star-list">
      {routeStars(r).map((star) => {
        const done = hasStar(game, r, star)
        return (
          <li key={star.key} className={done ? 'done' : ''}>
            <span className={`route-star-mark ${done ? 'on' : ''}`} aria-hidden>
              ★
            </span>
            <span className="grow">
              <span className="small">{starGoalText(star)}</span>
              <span className="route-star-meta">
                {done ? <span className="tiny">Conseguida</span> : <StarPrize route={r} />}
                {star.goal === StarGoal.SeeAll && !done && <SeenProgress game={game} route={r} />}
                {!done && <ReadyNote ready={meetsNow(game, star)} />}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
