import { useState, type CSSProperties } from 'react'
import { incursionMove } from '../../data/incursionMoves'
import { findMon, type GameState } from '../../game/core/state'
import { IncursionPhase } from '../../game/incursion/activeIncursion'
import type { TabRaid } from '../../game/raid/raid'
import { fightRingAt } from '../../game/raid/raidCrit'
import { RAID_REVIVES_EACH } from '../../game/raid/raidFight'
import { raidMoveChoices } from '../../game/raid/raidMoves'
import { raidProgress } from '../../game/raid/raidPlay'
import { roomBoss, type RaidPrize } from '../../game/raid/raidRoom'
import { RAID_FIGHT_MS } from '../../game/raid/raidSchedule'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { IncursionStage } from '../incursion/IncursionStage'
import { pickNow } from '../incursion/pickAction'
import { sceneAt } from '../incursion/sceneState'
import { TapPad } from '../incursion/TapPad'
import { RouteMoveBar } from '../route/RouteMoveBar'
import { towerMoveBarRoom } from '../tower/towerMoveBarRoom'
import { raidBiome } from './raidBiome'
import { RaidCritPad } from './RaidCritPad'
import { RaidFightHud } from './RaidFightHud'
import { RaidFightMenu } from './RaidFightMenu'
import { RaidFinale } from './RaidFinale'
import { raidCritHit, raidPilot, raidTapGoal } from './raidPilot'
import '../incursion/incursion.css'
import '../incursion/incursion-view.css'
import './raid.css'

interface Props {
  game: GameState
  tr: TabRaid
  rotation: RaidRotation
  onCollected: (prize: RaidPrize) => void
}

/**
 * La pelea contra el jefe: la escena con la sala a la izquierda y el jefe a la derecha; encima, la cabecera como la de
 * una ruta (el jefe, su vida y el tiempo que queda); abajo, la barra de ataques de daño, como en las rutas. Antes de
 * cada turno, la ventana de toques; antes de algunos golpes tuyos, el anillo crítico
 */
export function RaidFightView({ game, tr, rotation, onCollected }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const boss = roomBoss(tr.room)
  const fight = tr.room.fight!
  const p = raidProgress(tr, game.lastTick)!
  const scene = sceneAt(fight, p)
  const mine = scene.party.find((m) => m.id === tr.uid)
  const mon = findMon(game, tr.uid)
  const myMonUp = !!mine && mine.hp > 0 && !mine.out
  const finished = p.phase === IncursionPhase.Finished
  const pilot = raidPilot(tr, rotation)
  const picked = pickNow(pilot, scene)
  const choosing = myMonUp && !finished && !!mon && !!picked
  const tap = p.tap
  const ring = choosing && !tap ? fightRingAt(p.record.legs[0], tr.uid, tr.room.id, p.legMs) : null
  const nicknames = Object.fromEntries(tr.room.entrants.filter((e) => e.member.id !== tr.uid).map((e) => [e.member.id, e.trainer]))
  const overlay =
    tap && myMonUp ? (
      <TapPad move={incursionMove(tr.pendingPick?.moveId ?? mine!.moveId!)} windowKey={`${tr.room.id}:${tap.turn}`} msLeft={tap.msLeft} onGoal={() => raidTapGoal(tr, rotation, tap.turn)} />
    ) : (
      ring && <RaidCritPad key={ring.seq} ring={ring} legStart={fight.legStarts[0]} legMs={p.legMs} lastTick={game.lastTick} onCrit={() => raidCritHit(tr, rotation)} />
    )
  const barRoom = choosing && mon ? ({ ['--move-bar-room' as string]: `${towerMoveBarRoom(mon)}px` } as CSSProperties) : undefined

  return (
    <div className="screen incursion-view raid-fight" style={barRoom}>
      <IncursionStage biome={raidBiome(boss.speciesId)} scene={scene} uid={tr.uid} targeting={null} overlay={overlay} />
      <RaidFightHud boss={boss} scene={scene} revives={mine?.revives ?? RAID_REVIVES_EACH} msLeft={Math.max(0, fight.legStarts[0] + RAID_FIGHT_MS - game.lastTick)} menuOpen={menuOpen} onMenu={() => setMenuOpen((o) => !o)}>
        {tr.pendingJoin && !finished && <p className="incursion-hud-note">Tu Pokémon entra en la pelea en el próximo turno…</p>}
        {p.phase === IncursionPhase.Waiting && <p className="incursion-hud-note">Esperando a los toques de la sala…</p>}
        {tr.pendingCrit && !finished && <p className="incursion-hud-note raid-crit-note">¡Tu próximo golpe será crítico!</p>}
        {menuOpen && <RaidFightMenu p={p} scene={scene} uid={tr.uid} nicknames={nicknames} />}
      </RaidFightHud>
      {choosing && mon && picked && (
        <RouteMoveBar
          mon={mon}
          moveId={picked.next.moveId}
          inUseId={picked.applied.moveId}
          moves={raidMoveChoices(mon)}
          onPick={(moveId) => pilot.choose({ moveId, target: null })}
        />
      )}
      {finished && (
        <div className="incursion-finale">
          <RaidFinale rotation={rotation} tr={tr} p={p} party={scene.party} onCollected={onCollected} />
        </div>
      )}
    </div>
  )
}
