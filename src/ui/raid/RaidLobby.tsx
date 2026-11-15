import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { roomMembers } from '../../game/raid/raidLobby'
import { RAID_ROOM_SIZE } from '../../game/raid/raidRoom'
import { cycleBoss } from '../../game/raid/rotationBosses'
import { cycleAt, fightStart, RAID_FIGHT_MS, RaidStage, stageAt } from '../../game/raid/raidSchedule'
import type { BoardState } from '../../net/raidBoard'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { MonSection } from '../shared/sheet/MonSheet'
import { RaidBossStage } from './RaidBossStage'
import { RaidEntry } from './RaidEntry'
import { RaidRoster } from './RaidRoster'

/** Cuántos esperan, según el servidor: «12 jugadores en 2 salas» */
function waitingText(board: BoardState, rotation: RaidRotation, cycle: number): string | null {
  const row = board.board?.rotations.find((r) => r.rotation === rotation && r.cycle === cycle)
  if (!row || row.players === 0) return null
  return `${row.players} ${row.players === 1 ? 'jugador' : 'jugadores'} en ${row.rooms} ${row.rooms === 1 ? 'sala' : 'salas'}`
}

/**
 * La sala abierta de una rotación: el jefe, cuánto falta para la pelea, quién hay ya (si estás dentro) y tu Pokémon.
 * Sin Pokémon tuyo dentro y con la pelea ya en marcha, la espera de la próxima sala
 */
export function RaidLobby({ game, rotation, board, now }: { game: GameState; rotation: RaidRotation; board: BoardState; now: number }) {
  const own = game.raids[rotation]
  const cycle = own?.room.cycle ?? cycleAt(now)
  const boss = cycleBoss(rotation, cycle)
  const msLeft = fightStart(cycle) - now
  const waiting = waitingText(board, rotation, cycle)
  const lobbyOpen = stageAt(cycle, now) === RaidStage.Lobby

  return (
    <>
      <RaidBossStage speciesId={boss.speciesId} />
      <div className="raid-summary">
        <div className="row between">
          <strong>
            {species(boss.speciesId).name} Nv. {boss.level}
          </strong>
          <span className="small muted with-icon">
            <ItemIcon item={ICON.Raid} size={18} /> Jefe comunitario
          </span>
        </div>
        <p className="raid-eta">{lobbyOpen ? `La pelea empieza en ${formatClock(msLeft)}` : 'La pelea está empezando…'}</p>
        <p className="small muted">
          Pelea de hasta {Math.round(RAID_FIGHT_MS / 60_000)} min, como el jefe de una incursión: tú eliges el ataque, tocas para potenciarlo y aciertas el
          anillo para un golpe crítico. El premio va por la parte de su vida que le quitéis.
          {waiting && ` Ahora hay ${waiting}.`}
        </p>
      </div>
      <div className="mon-card">
        <MonSection title="Tu Pokémon">
          <RaidEntry game={game} rotation={rotation} now={now} />
        </MonSection>
        {own ? (
          <MonSection title={`En la sala · ${roomMembers(own.room, now).length}/${RAID_ROOM_SIZE}`}>
            <RaidRoster room={own.room} now={now} uid={own.uid} />
          </MonSection>
        ) : (
          <p className="small muted">
            Al entrar te sientas en la sala con más jugadores. Los bots llenan los huecos y dejan su sitio a cada jugador que llega.
          </p>
        )}
      </div>
    </>
  )
}
