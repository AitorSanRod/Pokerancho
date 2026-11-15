import { species } from '../../data/species'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { cycleBoss } from '../../game/raid/rotationBosses'
import { cycleAt, cycleEnd } from '../../game/raid/raidSchedule'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RaidBossStage } from './RaidBossStage'

/** Con la pelea en marcha y sin Pokémon tuyo dentro: el siguiente jefe en silueta y cuánto falta para que abra su sala */
export function RaidWaiting({ rotation, now }: { rotation: RaidRotation; now: number }) {
  const cycle = cycleAt(now)
  const current = species(cycleBoss(rotation, cycle).speciesId).name
  return (
    <>
      <RaidBossStage speciesId={cycleBoss(rotation, cycle + 1).speciesId} silhouette />
      <div className="raid-summary">
        <div className="row between">
          <strong>Siguiente jefe</strong>
          <span className="small muted with-icon">
            <ItemIcon item={ICON.Raid} size={18} /> Jefe comunitario
          </span>
        </div>
        <p className="raid-eta">Su sala abre en {formatClock(cycleEnd(cycle) - now)}</p>
        <p className="small muted">Ahora se está luchando contra {current}: la sala se cierra al empezar la pelea.</p>
      </div>
    </>
  )
}
