import { node, type Route } from '../../data/maps'
import { choosePath, forksOn, type BranchSummary } from '../../game/run/routeBranches'
import './route-branches.css'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** «3 combates · 1 entrenador · 1 cura» */
function summaryText({ fights, trainers, heals }: BranchSummary): string {
  const parts = [plural(fights, 'combate', 'combates')]
  if (trainers > 0) parts.push(plural(trainers, 'entrenador', 'entrenadores'))
  if (heals > 0) parts.push(plural(heals, 'cura', 'curas'))
  return parts.join(' · ')
}

/**
 * En el diálogo de comenzar, cada bifurcación del camino con sus caminos: su nombre, qué tiene de especial y sus paradas.
 * Elegir uno cambia el camino desde ahí (las siguientes bifurcaciones conservan lo elegido). Sin bifurcaciones, nada
 */
export function RouteBranchPicker({ route: r, path, onPick }: { route: Route; path: string[]; onPick: (path: string[]) => void }) {
  const forks = forksOn(r, path)
  if (forks.length === 0) return null
  return (
    <div className="route-branches">
      {forks.map((fork) => (
        <div key={fork.at} className="route-branch" role="radiogroup" aria-label={`Camino desde ${node(r, fork.at).name}`}>
          <div className="label">Camino desde {node(r, fork.at).name}</div>
          <div className="route-branch-options">
            {fork.options.map((option) => (
              <button
                key={option.to}
                type="button"
                role="radio"
                aria-checked={option.to === fork.chosen}
                className={`route-branch-option ${option.to === fork.chosen ? 'chosen' : ''}`}
                onClick={() => onPick(choosePath(r, path, fork.at, option.to))}
              >
                <strong>{option.label}</strong>
                {option.hint && <span className="small">{option.hint}</span>}
                <span className="tiny muted">{summaryText(option.summary)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
