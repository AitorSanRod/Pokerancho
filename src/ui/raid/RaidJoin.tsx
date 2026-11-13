import { useState } from 'react'
import { species } from '../../data/species'
import { findMon, type GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { joinRaid, leaveRaid, monRaidBlocker, raidRoomBlocker } from '../../game/raid/raid'
import { isEnding } from '../../game/raid/raidEnding'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { playerMembers } from '../../game/raid/raidEngine'
import { spentMember, TAB_RAID_LIVES } from '../../game/raid/raidLives'
import { earnsPrize, presenceShare, RAID_MIN_PRESENCE } from '../../game/raid/raidPrizes'
import { RaidMemberKind, type Raid, type RaidMember } from '../../game/raid/raidRoom'
import { nickname } from '../../net/identity'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Sprite } from '../shared/common'
import { formatPercent } from '../shared/format'
import { ICON } from '../shared/icons'
import { MonPicker } from '../shared/MonPicker'
import { BigAction } from '../shared/sheet/MonSheet'
import { NicknameDialog } from './NicknameDialog'
import { RaidLinkNote } from './RaidLinkNote'

/**
 * Tu Pokémon en la sala de la rotación: su participación y retirarlo, o elegir a uno de los que pueden ir y mandarlo. `onJoin`: cómo se manda
 * (con servidor, a la sala que se está viendo); sin él, a la sala de la partida
 */
export function RaidJoin({ game, raid, rotation, onJoin }: { game: GameState; raid: Raid; rotation: RaidRotation; onJoin?: (uid: string) => void }) {
  // Solo cuenta como tuyo si está en la partida de este dispositivo (con cuenta, puede estar luchando desde otro)
  const mine = playerMembers(raid).find((m) => findMon(game, m.id))
  return mine ? <InRaid game={game} raid={raid} uid={mine.id} /> : <JoinPicker game={game} raid={raid} rotation={rotation} onJoin={onJoin} />
}

function InRaid({ game, raid, uid }: { game: GameState; raid: Raid; uid: string }) {
  const [confirming, setConfirming] = useState(false)
  const member = playerMembers(raid)[0]
  const mon = findMon(game, uid)!
  const name = species(mon.speciesId).name

  return (
    <>
      <p className="small">
        {name} lleva el {formatPercent(presenceShare(member, raid.elapsedMs))} de la pelea y ha hecho {member.damage} de daño. Recibe recompensas si llega al{' '}
        {formatPercent(RAID_MIN_PRESENCE)} o si sigue dentro cuando caiga el jefe.
        {member.lives !== null && ` Le quedan ${member.lives} de ${TAB_RAID_LIVES} vidas.`}
      </p>
      <RaidLinkNote raid={raid} />
      {/* Mientras se ve el final de la pelea ya no se puede retirar */}
      {!isEnding(raid) && <BigAction icon={ICON.Ranch} label={`Retirar a ${name}`} onClick={() => setConfirming(true)} />}
      {confirming && (
        <ConfirmDialog
          title="¿Retirarlo de la pelea?"
          confirmLabel="Retirar"
          cancelLabel="Que siga"
          onConfirm={() => {
            act((s) => leaveRaid(s, uid))
            setConfirming(false)
          }}
          onCancel={() => setConfirming(false)}
        >
          <div className="row gap">
            <Sprite id={mon.speciesId} size={64} animated={false} shiny={mon.shiny} />
            <p className="small confirm-text">
              Vuelve al rancho con los PS que le queden.{' '}
              {earnsPrize({ ...member, left: true }, raid.elapsedMs)
                ? 'Ya ha luchado lo suficiente: cobrará cuando caiga el jefe.'
                : `Si se va ahora no cobrará: aún no llega al ${formatPercent(RAID_MIN_PRESENCE)} de la pelea.`}
            </p>
          </div>
        </ConfirmDialog>
      )}
    </>
  )
}

/** Los Pokémon que pueden ir contra el jefe ahora mismo, los de más nivel primero */
const eligibleMons = (game: GameState, rotation: RaidRotation, raid: Raid) =>
  game.owned.filter((m) => monRaidBlocker(game, m.uid, rotation, raid) === null).sort((a, b) => b.level - a.level || b.hp - a.hp)

/** Por qué no hay ningún Pokémon que pueda ir (los de rutas, expediciones u otros jefes no están en el rancho) */
const noneEligible = (raid: Raid) =>
  raid.boss.minLevel
    ? `Ningún Pokémon libre en el rancho puede ir: hace falta Nv. ${raid.boss.minLevel}, no estar debilitado y no haber gastado sus vidas contra este jefe.`
    : 'No queda ningún Pokémon libre en el rancho que no esté debilitado ni haya gastado sus vidas contra este jefe.'

function JoinPicker({ game, raid, rotation, onJoin }: { game: GameState; raid: Raid; rotation: RaidRotation; onJoin?: (uid: string) => void }) {
  const [selectedUid, setSelectedUid] = useState('')
  // La primera vez se elige el apodo con el que te verán los demás jugadores
  const [naming, setNaming] = useState(false)
  const roomBlocker = raidRoomBlocker(game, rotation, raid)
  const mons = roomBlocker ? [] : eligibleMons(game, rotation, raid)
  const own = game.raids[rotation]
  const spent = spentMember(game, raid) ?? (own ? spentMember(game, own) : undefined)
  const mon = mons.find((m) => m.uid === selectedUid) ?? mons[0]
  const send = () => {
    setNaming(false)
    if (onJoin) onJoin(mon.uid)
    else act((s) => joinRaid(s, mon.uid))
  }
  const secured = raid.members.some((m) => m.kind === RaidMemberKind.Player && earnsPrize(m, raid.elapsedMs))

  return (
    <>
      {spent && <SpentNote game={game} member={spent} />}
      {secured && <p className="small muted">Ya tienes asegurado el premio de este jefe.</p>}
      {roomBlocker ? (
        <p className="small muted">{roomBlocker}</p>
      ) : !mon ? (
        <p className="small muted">{noneEligible(raid)}</p>
      ) : (
        <>
          {raid.boss.minLevel && <p className="small muted">Pueden entrar Pokémon del rancho de Nv. {raid.boss.minLevel} o más.</p>}
          <MonPicker mons={mons} selectedUid={mon.uid} onSelect={setSelectedUid} />
          <BigAction
            icon={ICON.Raid}
            label={`Mandar a ${species(mon.speciesId).name}`}
            className="primary"
            onClick={() => (nickname() ? send() : setNaming(true))}
          />
        </>
      )}
      {naming && <NicknameDialog onDone={send} onCancel={() => setNaming(false)} />}
    </>
  )
}

/** Aviso de que a ese Pokémon lo han sacado de la sala por gastar sus vidas */
function SpentNote({ game, member }: { game: GameState; member: RaidMember }) {
  const name = species(findMon(game, member.id)!.speciesId).name
  return (
    <p className="small">
      <strong>¡Sin vidas!</strong> {name} ha caído {TAB_RAID_LIVES} veces y ha vuelto al rancho. Si había luchado lo suficiente, su premio está en
      Notificaciones.
    </p>
  )
}
