import { incursionMove } from '../../data/incursionMoves'
import { species } from '../../data/species'
import { isBot } from '../../game/incursion/party'
import type { MemberState } from '../../game/incursion/fighter'
import { PLAYER_TRAINER } from '../../game/raid/raid'
import { botTrainer } from '../../game/raid/raidBots'
import { roomMembers } from '../../game/raid/raidLobby'
import { RAID_ROOM_SIZE, type RaidRoom } from '../../game/raid/raidRoom'
import { nickname } from '../../net/identity'
import { BackdropRow } from '../route/RouteRow'
import { Bar, Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { TYPE_SCENERY } from '../shared/sheet/scenery'
import './raid-roster.css'

/**
 * Quién hay en la sala abierta, una línea por Pokémon como las de rutas y expediciones: el paisaje de su tipo
 * difuminado detrás, el Pokémon, su entrenador, su ataque y sus PS. Primero los jugadores, después los bots que han
 * llegado; al final, los sitios que quedan libres
 */
export function RaidRoster({ room, now, uid }: { room: RaidRoom; now: number; uid: string | null }) {
  const members = roomMembers(room, now)
  const trainerOf = (m: MemberState) => {
    if (isBot(m.id)) return botTrainer(room, Number(m.id.split('-')[1]))
    const trainer = room.entrants.find((e) => e.member.id === m.id)?.trainer ?? ''
    return m.id === uid && trainer === PLAYER_TRAINER ? (nickname() ?? trainer) : trainer
  }
  const free = RAID_ROOM_SIZE - members.length
  return (
    <div className="route-list raid-roster">
      {members.map((m) => (
        <MemberRow key={m.id} m={m} trainer={trainerOf(m)} mine={m.id === uid} />
      ))}
      {free > 0 && <p className="tiny muted center">{free === 1 ? 'Queda 1 sitio libre' : `Quedan ${free} sitios libres`}: van llegando bots hasta llenar la sala.</p>}
    </div>
  )
}

function MemberRow({ m, trainer, mine }: { m: MemberState; trainer: string; mine: boolean }) {
  const sp = species(m.speciesId)
  const bot = isBot(m.id)
  return (
    <BackdropRow image={TYPE_SCENERY[sp.types[0]]} className={`raid-row ${bot ? 'bot' : mine ? 'player' : 'guest'}`}>
      <Sprite id={m.speciesId} size={56} animated={false} className="raid-row-sprite" shiny={m.shiny} />
      <span className="grow small raid-row-info">
        <strong>{trainer}</strong>
        <span className="raid-row-pill">
          {sp.name} Nv. {m.level} · {incursionMove(m.moveId).name}
        </span>
        <Bar value={m.hpFraction} max={1} kind="hp" />
      </span>
      {bot ? (
        <span className="raid-tag bot">
          <ItemIcon item={ICON.Bot} size={20} />
          Bot
        </span>
      ) : (
        mine && <span className="raid-tag mine">Tú</span>
      )}
    </BackdropRow>
  )
}
