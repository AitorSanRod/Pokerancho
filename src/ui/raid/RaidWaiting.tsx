import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { RAID_LATE_JOIN_MIN_HP } from '../../game/raid/raidLateJoin'
import { cycleBoss } from '../../game/raid/rotationBosses'
import { cycleAt, cycleEnd } from '../../game/raid/raidSchedule'
import { formatClock, formatPercent } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { MonSection } from '../shared/sheet/MonSheet'
import { RaidBossStage } from './RaidBossStage'
import { RaidEntry } from './RaidEntry'

/**
 * Con la pelea en marcha y sin Pokémon tuyo dentro: el jefe con el que se lucha, entrar en su pelea (en el sitio de un
 * bot, mientras le quede vida de sobra) y cuánto falta para que abra la sala del siguiente
 */
export function RaidWaiting({ game, rotation, now }: { game: GameState; rotation: RaidRotation; now: number }) {
  const cycle = cycleAt(now)
  const boss = cycleBoss(rotation, cycle)
  const next = species(cycleBoss(rotation, cycle + 1).speciesId).name
  return (
    <>
      <RaidBossStage speciesId={boss.speciesId} />
      <div className="raid-summary">
        <div className="row between">
          <strong>
            {species(boss.speciesId).name} Nv. {boss.level}
          </strong>
          <span className="small muted with-icon">
            <ItemIcon item={ICON.Raid} size={18} /> Pelea en curso
          </span>
        </div>
        <p className="small muted">
          Aún puedes entrar mientras al jefe le quede más del {formatPercent(RAID_LATE_JOIN_MIN_HP)} de su vida: tu Pokémon ocupa el sitio de
          un bot en el siguiente turno y su premio va por la vida que le quitéis desde que entra.
        </p>
      </div>
      <div className="mon-card">
        <MonSection title="Tu Pokémon">
          <RaidEntry game={game} rotation={rotation} now={now} />
        </MonSection>
        <p className="small muted">
          Siguiente jefe: {next}. Su sala abre en {formatClock(cycleEnd(cycle) - now)}.
        </p>
      </div>
    </>
  )
}
