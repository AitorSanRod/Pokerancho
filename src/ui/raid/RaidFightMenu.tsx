import type { IncursionProgress } from '../../game/incursion/activeIncursion'
import { DamageTally } from '../incursion/DamageTally'
import { Fold } from '../incursion/Fold'
import { GroupPassiveList } from '../incursion/GroupPassiveList'
import { IncursionRoster } from '../incursion/IncursionRoster'
import type { SceneState } from '../incursion/sceneState'

interface Props {
  p: IncursionProgress
  scene: SceneState
  uid: string
  /** Apodo de cada jugador por su Pokémon */
  nicknames: Record<string, string>
}

/** El panel del botón «Menú» en la pelea del jefe: la sala y el jefe, quién hace más daño y las pasivas de la sala */
export function RaidFightMenu({ p, scene, uid, nicknames }: Props) {
  const moveOf = (id: string) => scene.party.find((m) => m.id === id)?.moveId ?? ''
  return (
    <div className="incursion-menu-panel">
      <Fold title="Sala y jefe">
        <IncursionRoster party={scene.party} foes={scene.foes} moveOf={moveOf} uid={uid} nicknames={nicknames} />
      </Fold>
      <Fold title="Daño de la sala">
        <DamageTally p={p} party={scene.party} uid={uid} nicknames={nicknames} />
      </Fold>
      {scene.passives.length > 0 && (
        <Fold title={`Pasivas de la sala (${scene.passives.length})`}>
          <GroupPassiveList passives={scene.passives} />
        </Fold>
      )}
    </div>
  )
}
