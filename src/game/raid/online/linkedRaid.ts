import type { GameState } from '../../core/state'
import { RaidLink, type TabRaid } from '../raid'
import { seatEntrant } from '../raidRoom'
import { RaidAction, type JoinRequest, type RaidRotation, type RoomView } from './protocol'

// La sala de la partida enlazada con el servidor: pedir sitio (o cambiar el Pokémon o el ataque), ponerse al día con lo
// que diga y, si deja de tenerla, seguir en local con lo que ya se sabía (raidPlay.ts).

/** El Pokémon del jugador tal y como está en su sala de la partida */
const ownEntrant = (tr: TabRaid) => tr.room.entrants.find((e) => e.member.id === tr.uid)

/** Lo que se manda al servidor para entrar en la sala de la rotación (sin quién es el jugador); null si no toca */
export function joinRequest(s: GameState, rotation: RaidRotation): Pick<JoinRequest, 'action' | 'rotation' | 'member'> | null {
  const tr = s.raids[rotation]
  const entrant = tr?.link === RaidLink.Joining ? ownEntrant(tr) : undefined
  return entrant ? { action: RaidAction.Join, rotation, member: entrant.member } : null
}

/** El servidor tiene ya el Pokémon y el ataque que el jugador ha elegido en la partida (si no, hay que volver a pedirlo) */
function upToDate(tr: TabRaid, view: RoomView): boolean {
  const mine = view.room.entrants.find((e) => e.member.id === view.you)
  return view.you === tr.uid && mine?.member.moveId === ownEntrant(tr)?.member.moveId
}

/**
 * Lo que dice el servidor de la sala, en la partida: las horas de la pelea se pasan al reloj del móvil. Si el jugador
 * ha cambiado su Pokémon o su ataque mientras tanto, se le deja el suyo y se sigue pidiendo. false si no le toca (no
 * está en ninguna sala de esa rotación o la juega en local)
 */
export function applyRoomView(s: GameState, rotation: RaidRotation, view: RoomView, now: number): boolean {
  const tr = s.raids[rotation]
  if (!tr || tr.link === RaidLink.Local) return false
  const offset = now - view.serverNow
  const room = structuredClone(view.room)
  if (room.fight) room.fight.legStarts = room.fight.legStarts.map((t) => t + offset)
  const stale = tr.link === RaidLink.Joining && !upToDate(tr, view)
  const local = ownEntrant(tr)
  if (stale && local) seatEntrant(room, local, view.you)
  const uid = stale ? tr.uid : view.you
  s.raids[rotation] = { room, uid, link: stale ? RaidLink.Joining : RaidLink.Online, pendingPick: view.yourPick, pendingCrit: view.yourCrit }
  return true
}

/** El servidor no tiene (o no admite) la sala de la rotación: se sigue en local, con bots y lo que ya se sabía */
export function dropRoom(s: GameState, rotation: RaidRotation) {
  const tr = s.raids[rotation]
  if (tr) tr.link = RaidLink.Local
}
