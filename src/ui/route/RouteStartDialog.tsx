import { useState } from 'react'
import { pathFrom, pathSpecies, pathStopCount, type Route } from '../../data/maps'
import { species } from '../../data/species'
import { TutorialStep, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../store/store'
import { pathRaidMoneyMult } from '../../game/raid/routeRaidStreak'
import { startRun } from '../../game/run/run'
import { routeGym } from '../../game/run/runGym'
import { routeLevelBlocker, routeMaxLevel } from '../../game/run/routeLevelCap'
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
import { Modal } from '../shared/Modal'
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
  const cap = routeMaxLevel(r)
  const tooStrong = routeLevelBlocker(game, r)
  const stops = game.completedRoutes.includes(r.id) ? pathStopCount(path) : null
  const [moveId, setMoveId] = useState(() => defaultRouteMove(mon))
  const start = () =>
    act((s) => {
      startRun(s, r.id, path)
      pickRouteMove(s, moveId, Date.now())
    })

  return (
    <Modal className="route-start" label={`Comenzar ${r.name}`} onClose={onClose}>
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
              entran Pokémon de hasta Nv. {cap}.
            </>
          ) : (
            <>
              Sale <strong>{sp.name}</strong> (Nv. {mon.level}) con el ataque que elijas.
              {cap !== null && <> Solo salen Pokémon de hasta Nv. {cap}.</>}
            </>
          )}
        </p>
        {stops !== null && <p className="small center muted">{stops} {stops === 1 ? 'parada' : 'paradas'}</p>}
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
    </Modal>
  )
}
