import { useState } from 'react'
import { incursionMove } from '../../data/incursionMoves'
import { species } from '../../data/species'
import { findMon, type GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { leaveRaid, RaidLink, raidRoomBlocker } from '../../game/raid/raid'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { nickname } from '../../net/identity'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { BigAction } from '../shared/sheet/MonSheet'
import { NicknameDialog } from './NicknameDialog'
import { RaidJoinDialog } from './RaidJoinDialog'

/** Con la sala abierta: tu Pokémon en ella (cambiarlo o salir) o el botón para entrar */
export function RaidEntry({ game, rotation, now }: { game: GameState; rotation: RaidRotation; now: number }) {
  const [dialog, setDialog] = useState<'join' | 'name' | 'leave' | null>(null)
  const own = game.raids[rotation]
  const mon = own && findMon(game, own.uid)
  const blocker = raidRoomBlocker(game, rotation, now)
  // La primera vez se elige el apodo con el que te verán los demás jugadores
  const open = () => setDialog(nickname() ? 'join' : 'name')
  const moveId = own?.room.entrants.find((e) => e.member.id === own.uid)?.member.moveId

  return (
    <>
      {mon && moveId ? (
        <div className="row gap raid-entry">
          <Sprite id={mon.speciesId} size={56} animated={false} shiny={mon.shiny} />
          <span className="grow small">
            <strong>{species(mon.speciesId).name}</strong> Nv. {mon.level}
            <br />
            Empieza con {incursionMove(moveId).name}
            {own.link === RaidLink.Joining && <em className="muted"> · avisando al servidor…</em>}
          </span>
        </div>
      ) : (
        blocker && <p className="small muted">{blocker}</p>
      )}
      {!blocker && <BigAction icon={ICON.Raid} label={own ? 'Cambiar Pokémon o ataque' : 'Entrar en la sala'} className={own ? '' : 'primary'} onClick={open} />}
      {own && !blocker && <BigAction icon={ICON.Ranch} label="Salir de la sala" onClick={() => setDialog('leave')} />}
      {dialog === 'name' && <NicknameDialog onDone={() => setDialog('join')} onCancel={() => setDialog(null)} />}
      {dialog === 'join' && <RaidJoinDialog game={game} rotation={rotation} now={now} onClose={() => setDialog(null)} />}
      {dialog === 'leave' && mon && (
        <ConfirmDialog
          title="¿Salir de la sala?"
          confirmLabel="Salir"
          cancelLabel="Quedarme"
          onConfirm={() => {
            act((s) => leaveRaid(s, rotation))
            setDialog(null)
          }}
          onCancel={() => setDialog(null)}
        >
          <p className="small confirm-text">{species(mon.speciesId).name} vuelve al rancho. Puedes volver a entrar mientras la sala siga abierta.</p>
        </ConfirmDialog>
      )}
    </>
  )
}
