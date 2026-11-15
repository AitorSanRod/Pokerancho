import { useState } from 'react'
import { createPortal } from 'react-dom'
import { pathFrom, pathSpecies, type Route } from '../../data/maps'
import { species } from '../../data/species'
import { TutorialStep, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../store/store'
import { pathRaidMoneyMult } from '../../game/raid/routeRaidStreak'
import { startRun } from '../../game/run/run'
import { gymLevelBlocker, routeGym } from '../../game/run/runGym'
import { defaultRouteMove, pickRouteMove } from '../../game/run/runMove'
import { RouteMoveBar } from './RouteMoveBar'
import { maxHp } from '../../game/team/stats'
import { Bar, Sprite } from '../shared/common'
import { PixelQuestion } from '../shared/PixelQuestion'
import { HealButton } from '../shared/sheet/HealButton'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { repeatNote } from '../shared/rewardItems'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { TutorialHint } from '../shared/TutorialHint'
import '../shared/overlays.css'
import '../shared/sheet/mon-sheet.css'
import './route-start.css'

/**
 * Confirmación antes de salir: el paisaje de la ruta con el Pokémon que va, y los Pokémon que pueden aparecer (los no
 * vistos, como ¿ pixelada). Se sale siempre por el camino principal. La poción de la esquina, como en la ficha, lo cura
 * antes de salir.
 */
export function RouteStartDialog({ game, route: r, mon, onClose }: { game: GameState; route: Route; mon: OwnedMon; onClose: () => void }) {
  const path = pathFrom(r)
  const sp = species(mon.speciesId)
  const hpMax = maxHp(mon)
  const guided = game.tutorial === TutorialStep.Route
  const raidMoney = pathRaidMoneyMult(game, r, path, game.lastTick)
  const gym = routeGym(r)
  const tooStrong = gymLevelBlocker(game, r)
  const [moveId, setMoveId] = useState(() => defaultRouteMove(mon))
  const start = () =>
    act((s) => {
      startRun(s, r.id, path)
      pickRouteMove(s, moveId, Date.now())
    })

  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card route-start" role="dialog" aria-modal="true" aria-label={`Comenzar ${r.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="mon-screen-top">
          <HeroLayout
            compact
            scenery={BIOME_SCENERY[r.biome]}
            name={r.name}
            subtitle={`Nv. ${r.levels[0]}–${r.levels[1]}`}
            footer={
              <>
                <Bar value={mon.hp} max={hpMax} kind="hp" />
                <span className="small">
                  {Math.floor(mon.hp)} / {hpMax} PS
                </span>
              </>
            }
          >
            <Sprite id={mon.speciesId} size={96} className="mon-hero-sprite idle-bounce" shiny={mon.shiny} />
          </HeroLayout>
          <div className="mon-hero-corner bottom-left">
            <HealButton game={game} mon={mon} />
          </div>
        </div>
        <div className="route-start-body">
          <p className="small center">
            {gym ? (
              <>
                Sale <strong>{sp.name}</strong> (Nv. {mon.level}) contra <strong>{gym.leader}</strong> y sus {gym.team.length} Pokémon, uno tras otro. Solo
                entran Pokémon de hasta Nv. {gym.maxLevel}.
              </>
            ) : (
              <>
                Sale <strong>{sp.name}</strong> (Nv. {mon.level}) con el ataque que elijas.
              </>
            )}
          </p>
          {tooStrong && <p className="notice small">{tooStrong}</p>}
          {!tooStrong && <RouteMoveBar mon={mon} moveId={moveId} inline onPick={setMoveId} />}
          <div className="label">Pueden aparecer</div>
          <div className="route-start-species">
            {pathSpecies(r, path).map((id) =>
              game.seen.includes(id) ? <Sprite key={id} id={id} size={48} animated={false} /> : <PixelQuestion key={id} size={40} />,
            )}
          </div>
          {raidMoney < 1 && <p className="small center muted">{repeatNote(raidMoney)}</p>}
          {guided && <TutorialHint>Tu Pokémon caminará solo y combatirá en cada parada. ¡Pulsa «¡En marcha!» y a partir de aquí juega a tu aire!</TutorialHint>}
          <div className="row gap confirm-actions">
            <button className="btn grow" onClick={onClose}>
              Cancelar
            </button>
            <button className={`btn primary grow ${guided ? 'tutorial-target' : ''}`} disabled={!!tooStrong} onClick={start}>
              ¡En marcha!
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
