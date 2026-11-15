import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { RAID_ROTATIONS, type RaidRotation } from '../../game/raid/online/protocol'
import type { RaidPrize } from '../../game/raid/raidRoom'
import { cycleBoss } from '../../game/raid/rotationBosses'
import { cycleAt, RaidStage, stageAt } from '../../game/raid/raidSchedule'
import { serverNow, useRaidBoard } from '../../net/raidBoard'
import { Sprite } from '../shared/common'
import { RewardOverlay } from '../shared/RewardOverlay'
import { raidPrizeRewards } from '../shared/rewardItems'
import { RaidFightView } from './RaidFightView'
import { RaidLobby } from './RaidLobby'
import { RaidPrizeBanner } from './RaidPrizes'
import { RaidWaiting } from './RaidWaiting'
import { ROTATION_LABEL } from './rotations'
import './raid.css'

/** Tamaño del jefe en la pestaña de su rotación */
const TAB_SPRITE_SIZE = 24

/** La rotación con la que se abre: la primera en la que esté tu Pokémon */
const firstTab = (game: GameState): RaidRotation => RAID_ROTATIONS.find((r) => game.raids[r]) ?? RAID_ROTATIONS[0]

/**
 * Pestaña Ruta › Raids: una pestaña por rotación de jefes, todas con el mismo calendario (raidSchedule.ts). Con la sala
 * abierta se entra con un Pokémon y su ataque; al empezar, la pelea bajo las pestañas, y aún se puede entrar en ella
 * en el sitio de un bot (raidLateJoin.ts). Con servidor, la sala es la suya, con otros jugadores; sin él, en local con bots
 */
export function RaidScreen({ game }: { game: GameState }) {
  const board = useRaidBoard()
  const [tab, setTab] = useState<RaidRotation>(() => firstTab(game))
  const [collected, setCollected] = useState<RaidPrize | null>(null)
  if (game.tutorial !== null) {
    return (
      <div className="screen scroll">
        <p className="notice">Termina el tutorial para luchar contra los jefes comunitarios.</p>
      </div>
    )
  }

  const now = serverNow(board)
  const tr = game.raids[tab]
  const overlay = collected && <RewardOverlay title="¡Premio del jefe!" items={raidPrizeRewards([collected])} onClose={() => setCollected(null)} />
  const tabs = <RotationTabs game={game} tab={tab} now={now} onTab={setTab} />

  // En la pelea siguen arriba las pestañas de las rotaciones: se puede ir a ver (o a entrar en) la otra
  if (tr?.room.fight) {
    return (
      <div className="screen raid-screen raid-fighting">
        {overlay}
        {tabs}
        <RaidFightView game={game} tr={tr} rotation={tab} onCollected={setCollected} />
      </div>
    )
  }

  const fightRunning = !tr && stageAt(cycleAt(now), now) === RaidStage.Fight
  return (
    <div className="screen raid-screen">
      {overlay}
      {tabs}
      <RaidPrizeBanner game={game} />
      {fightRunning ? <RaidWaiting game={game} rotation={tab} now={now} /> : <RaidLobby game={game} rotation={tab} board={board} now={now} />}
    </div>
  )
}

/** Una pestaña por rotación, con su jefe de ahora (o el que está luchando tu Pokémon) */
function RotationTabs({ game, tab, now, onTab }: { game: GameState; tab: RaidRotation; now: number; onTab: (r: RaidRotation) => void }) {
  return (
    <div className="segmented raid-tabs">
      {RAID_ROTATIONS.map((rotation) => {
        const cycle = game.raids[rotation]?.room.cycle ?? cycleAt(now)
        return (
          <button key={rotation} className={tab === rotation ? 'active' : ''} onClick={() => onTab(rotation)}>
            <Sprite id={cycleBoss(rotation, cycle).speciesId} size={TAB_SPRITE_SIZE} animated={false} />
            {ROTATION_LABEL[rotation]}
            {game.raids[rotation] && <span className="dot" />}
          </button>
        )
      })}
    </div>
  )
}
