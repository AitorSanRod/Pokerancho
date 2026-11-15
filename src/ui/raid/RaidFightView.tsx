import { useState, type ReactNode } from 'react'
import { incursionMove } from '../../data/incursionMoves'
import { species } from '../../data/species'
import type { GameState } from '../../game/core/state'
import { IncursionPhase } from '../../game/incursion/activeIncursion'
import type { TabRaid } from '../../game/raid/raid'
import { fightRingAt } from '../../game/raid/raidCrit'
import { RAID_REVIVES } from '../../game/raid/raidFight'
import { raidProgress } from '../../game/raid/raidPlay'
import { roomBoss, type RaidPrize } from '../../game/raid/raidRoom'
import { RAID_FIGHT_MS } from '../../game/raid/raidSchedule'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { IncursionMenu } from '../incursion/IncursionMenu'
import { IncursionStage } from '../incursion/IncursionStage'
import { IncursionStrip } from '../incursion/IncursionStrip'
import { MoveBar } from '../incursion/MoveBar'
import { sceneTargeting } from '../incursion/pickAction'
import { sceneAt } from '../incursion/sceneState'
import { TapPad } from '../incursion/TapPad'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { raidBiome } from './raidBiome'
import { RaidCritPad } from './RaidCritPad'
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
  /** Cambiar a la otra rotación (si tienes algo en ella), en la cabecera */
  switcher: ReactNode
  onCollected: (prize: RaidPrize) => void
}

/**
 * La pelea contra el jefe, como la de una incursión: la escena a pantalla completa con la sala a la izquierda y el
 * jefe a la derecha; encima, la cabecera con el tiempo que queda, los revivires, los PS de todos y el «Menú»; abajo,
 * la barra de ataques. Antes de cada turno, la ventana de toques; antes de algunos golpes tuyos, el anillo crítico
 */
export function RaidFightView({ game, tr, rotation, switcher, onCollected }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const boss = roomBoss(tr.room)
  const fight = tr.room.fight!
  const p = raidProgress(tr, game.lastTick)!
  const scene = sceneAt(fight, p, RAID_REVIVES)
  const mine = scene.party.find((m) => m.id === tr.uid)
  const myMonUp = !!mine && mine.hp > 0 && !mine.out
  const finished = p.phase === IncursionPhase.Finished
  const choosing = myMonUp && !finished
  const pilot = raidPilot(tr, rotation)
  const tap = p.tap
  const ring = choosing && !tap ? fightRingAt(p.record.legs[0], tr.uid, tr.room.id, p.legMs) : null
  const nicknames = Object.fromEntries(tr.room.entrants.filter((e) => e.member.id !== tr.uid).map((e) => [e.member.id, e.trainer]))
  const overlay =
    tap && myMonUp ? (
      <TapPad move={incursionMove(tr.pendingPick?.moveId ?? mine!.moveId!)} windowKey={`${tr.room.id}:${tap.turn}`} msLeft={tap.msLeft} onGoal={() => raidTapGoal(tr, rotation, tap.turn)} />
    ) : (
      ring && <RaidCritPad key={ring.seq} ring={ring} legStart={fight.legStarts[0]} legMs={p.legMs} lastTick={game.lastTick} onCrit={() => raidCritHit(tr, rotation)} />
    )

  return (
    <div className="screen incursion-view raid-fight">
      <IncursionStage biome={raidBiome(boss.speciesId)} scene={scene} uid={tr.uid} targeting={choosing && !tap && !ring ? sceneTargeting(pilot, scene) : null} overlay={overlay} />
      <div className="incursion-hud">
        <header className="incursion-head">
          <span className="incursion-head-title small">
            <strong>{species(boss.speciesId).name}</strong> Nv. {boss.level} · {formatClock(Math.max(0, fight.legStarts[0] + RAID_FIGHT_MS - game.lastTick))}
          </span>
          <span className="incursion-revives" title="Revivires de la sala">
            <ItemIcon item={ICON.Revive} size={22} off={scene.revives === 0} /> ×{scene.revives}
          </span>
          {switcher}
          <IncursionMenu open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
        </header>
        <IncursionStrip party={scene.party} foes={scene.foes} uid={tr.uid} />
        {p.phase === IncursionPhase.Waiting && <p className="incursion-hud-note">Esperando a los toques de la sala…</p>}
        {tr.pendingCrit && !finished && <p className="incursion-hud-note raid-crit-note">¡Tu próximo golpe será crítico!</p>}
        {menuOpen && <RaidFightMenu p={p} scene={scene} uid={tr.uid} nicknames={nicknames} />}
      </div>
      {choosing && <MoveBar game={game} pilot={pilot} scene={scene} />}
      {finished && (
        <div className="incursion-finale">
          <RaidFinale rotation={rotation} bossSpeciesId={boss.speciesId} p={p} party={scene.party} onCollected={onCollected} />
        </div>
      )}
    </div>
  )
}
