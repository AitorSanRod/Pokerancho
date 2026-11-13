import type { ActiveIncursion, IncursionProgress } from '../../game/incursion/activeIncursion'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { DamageTally } from './DamageTally'
import { Fold } from './Fold'
import { GroupPassiveList } from './GroupPassiveList'
import { IncursionRoster } from './IncursionRoster'
import { RetreatVote } from './RetreatVote'
import type { SceneState } from './sceneState'

type Props = { a: ActiveIncursion; p: IncursionProgress; scene: SceneState; finished: boolean }

/** Botón «Menú» de la cabecera: despliega sobre la escena el grupo, el daño, las pasivas y la retirada */
export function IncursionMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button className={`btn ghost small incursion-menu-btn ${open ? 'open' : ''}`} onClick={onToggle} aria-expanded={open}>
      <ItemIcon item={ICON.Menu} size={22} /> Menú
    </button>
  )
}

/** El panel que abre el menú, bajo la cabecera; la escena sigue viéndose detrás */
export function IncursionMenuPanel({ a, p, scene, finished }: Props) {
  const nicknames = a.online?.nicknames ?? {}
  const moveOf = (id: string) => scene.party.find((m) => m.id === id)?.moveId ?? ''
  return (
    <div className="incursion-menu-panel">
      <Fold title="Grupo y rivales">
        <IncursionRoster party={scene.party} foes={scene.foes} moveOf={moveOf} uid={a.uid} nicknames={nicknames} />
      </Fold>
      <Fold title="Daño del grupo">
        <DamageTally p={p} party={scene.party} uid={a.uid} nicknames={nicknames} />
      </Fold>
      {scene.passives.length > 0 && (
        <Fold title={`Pasivas del grupo (${scene.passives.length})`}>
          <GroupPassiveList passives={scene.passives} />
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
