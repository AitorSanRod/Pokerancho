import { useState } from 'react'
import { species } from '../../data/species'
import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../store/store'
import { joinRaid, raidBlocker } from '../../game/raid/raid'
import { raidMoveChoices } from '../../game/raid/raidMoves'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { cycleBoss } from '../../game/raid/rotationBosses'
import { cycleAt, RaidStage, stageAt } from '../../game/raid/raidSchedule'
import { Sprite } from '../shared/common'
import { MonPicker } from '../shared/MonPicker'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { RouteMoveBar } from '../route/RouteMoveBar'
import { raidBiome } from './raidBiome'
import { Modal } from '../shared/Modal'
import '../route/route-start.css'

interface Props {
  game: GameState
  rotation: RaidRotation
  /** Hora real (la del servidor, si se sabe) */
  now: number
  onClose: () => void
}

/** Los que pueden ir: los del rancho y el que ya está en la sala (para cambiarle el ataque), los de más nivel primero */
function candidates(game: GameState, rotation: RaidRotation): OwnedMon[] {
  const own = game.raids[rotation]?.uid
  return game.owned.filter((m) => m.uid === own || monPlace(game, m.uid) === MonPlace.Ranch).sort((a, b) => b.level - a.level)
}

/** Entrar en la sala abierta (o cambiar tu Pokémon o su ataque): quién va y con qué ataque empieza la pelea */
export function RaidJoinDialog({ game, rotation, now, onClose }: Props) {
  const own = game.raids[rotation]
  const ownMove = own?.room.entrants.find((e) => e.member.id === own.uid)?.member.moveId ?? null
  const boss = cycleBoss(rotation, cycleAt(now))
  const late = stageAt(cycleAt(now), now) === RaidStage.Fight
  const mons = candidates(game, rotation)
  const fits = (m: OwnedMon) => m.level >= (boss.minLevel ?? 0) && m.hp >= 1
  const [uid, setUid] = useState(own?.uid ?? mons.find(fits)?.uid)
  const [moveId, setMoveId] = useState<string | null>(ownMove)
  const mon = mons.find((m) => m.uid === uid)
  const moves = mon ? raidMoveChoices(mon) : []
  const move = moves.find((mv) => mv.id === moveId) ?? moves[0]
  const blocker = !mon || !move ? 'Ninguno de tus Pokémon del rancho puede ir contra este jefe.' : raidBlocker(game, rotation, mon.uid, move.id, now)

  const send = () => {
    if (!mon || !move) return
    act((s) => joinRaid(s, rotation, mon.uid, move.id, now))
    onClose()
  }

  return (
    <Modal className="route-start" label="Entrar en la sala" onClose={onClose}>
      <HeroLayout compact scenery={BIOME_SCENERY[raidBiome(boss.speciesId)]} name={species(boss.speciesId).name} subtitle={`Nv. ${boss.level}`}>
        {mon && <Sprite key={mon.uid} id={mon.speciesId} size={96} className="mon-hero-sprite idle-bounce" shiny={mon.shiny} />}
      </HeroLayout>
      <div className="route-start-body">
        <div className="label">¿Quién va?</div>
        <MonPicker mons={mons} selectedUid={mon?.uid} onSelect={setUid} lockOf={(m) => (fits(m) ? null : 'other')} />
        {mon && move && <RouteMoveBar mon={mon} moveId={move.id} moves={moves} inline onPick={setMoveId} />}
        <p className="tiny muted">
          {boss.minLevel ? `Hace falta Nv. ${boss.minLevel}. ` : ''}
          {late
            ? 'La pelea ya ha empezado: entras en el siguiente turno, en el sitio de un bot, y ya no se sale hasta que acabe. El ataque se cambia cuando quieras.'
            : 'Hasta que empiece la pelea puedes cambiar de Pokémon o de ataque, o salir; en la pelea, el ataque se cambia cuando quieras.'}
        </p>
        {blocker && <p className="notice small">{blocker}</p>}
        <div className="row gap confirm-actions">
          <button className="btn grow" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary grow" disabled={!!blocker} onClick={send}>
            {own ? 'Cambiar' : 'Entrar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
