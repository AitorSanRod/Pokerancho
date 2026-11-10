import { TYPE_INFO } from '../../data/types'
import type { GameState } from '../../game/core/state'
import type { ActiveIncursion, IncursionProgress } from '../../game/incursion/activeIncursion'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { DamageTally } from './DamageTally'
import { Fold } from './Fold'
import { IncursionRoster } from './IncursionRoster'
import { PickButton } from './PickButton'
import { RetreatVote } from './RetreatVote'
import type { SceneState } from './sceneState'

type Props = { game: GameState; a: ActiveIncursion; p: IncursionProgress; scene: SceneState; canPick: boolean; finished: boolean }

/** Botón «Menú» de la cabecera: despliega sobre la escena tu ataque, el grupo, el daño, las pasivas y la retirada */
export function IncursionMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button className={`btn ghost small incursion-menu-btn ${open ? 'open' : ''}`} onClick={onToggle} aria-expanded={open}>
      <ItemIcon item={ICON.Menu} size={22} /> Menú
    </button>
  )
}

/** El panel que abre el menú, bajo la cabecera; la escena sigue viéndose detrás */
export function IncursionMenuPanel({ game, a, p, scene, canPick, finished }: Props) {
  const nicknames = a.online?.nicknames ?? {}
  const moveOf = (id: string) => scene.party.find((m) => m.id === id)?.moveId ?? ''
  return (
    <div className="incursion-menu-panel">
      {canPick && <PickButton game={game} a={a} scene={scene} />}
      <Fold title="Grupo y rivales">
        <IncursionRoster party={scene.party} foes={scene.foes} moveOf={moveOf} uid={a.uid} nicknames={nicknames} />
      </Fold>
      <Fold title="Daño del grupo">
        <DamageTally p={p} party={scene.party} uid={a.uid} nicknames={nicknames} />
      </Fold>
      {scene.passives.length > 0 && (
        <Fold title={`Pasivas del grupo (${scene.passives.length})`}>
          <div className="incursion-passives">
            {scene.passives.map((ps) => (
              <span key={ps.type} className="incursion-passive tiny" style={{ ['--type-color' as string]: TYPE_INFO[ps.type].color }}>
                {TYPE_INFO[ps.type].name} {ps.level}
              </span>
            ))}
          </div>
        </Fold>
      )}
      {!finished && (
        <Fold title="Retirada">
          <RetreatVote a={a} />
        </Fold>
      )}
    </div>
  )
}
