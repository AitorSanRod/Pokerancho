import type { StatusId } from '../../data/passives'
import type { ActiveIncursion, IncursionProgress } from '../../game/incursion/activeIncursion'
import { EventKind, type IncursionEvent } from '../../game/incursion/events'
import { Team } from '../../game/incursion/fighter'
import type { GroupPassive } from '../../game/incursion/groupPassives'
import { eventsStarted } from '../../game/incursion/incursionTimeline'
import { INCURSION_REVIVES } from '../../game/incursion/revives'
import { species } from '../../data/species'

// Cómo está la incursión en el momento que se ve: se repasan los eventos ya empezados del tramo (cada uno trae los
// PS de a quién le pasa), sin recalcular nada del combate.

export interface SceneMon {
  id: string
  team: Team
  speciesId: number
  name: string
  level: number
  hp: number
  maxHp: number
  out: boolean
  /** Estados alterados, del más antiguo al más nuevo (un jefe puede llevar varios) */
  statuses: StatusId[]
  boss: boolean
  /** Del grupo: con los colores shiny */
  shiny?: boolean
  /** Del grupo: el ataque que lleva (cambia si el jugador lo cambia en plena pelea) */
  moveId?: string
}

export interface SceneState {
  /** Índice de la sala en la que está el grupo */
  room: number
  party: SceneMon[]
  /** Rivales de la sala de combate en curso (vacío en las demás salas) */
  foes: SceneMon[]
  revives: number
  passives: GroupPassive[]
  /** El evento que se está viendo y su número de orden en el tramo (para reiniciar animaciones) */
  current: IncursionEvent | null
  seq: number
  /** El ataque que se está viendo: desde que se lanza hasta el siguiente (para su nombre sobre quien lo usa) */
  move: { actor: string; moveId: string; seq: number } | null
  /** El rival en juego: el último al que se ha golpeado o que ha actuado (su marcador se ve a la derecha) */
  focusFoe: string | null
  /** Número de orden del evento con que empezó la sala */
  roomSeq: number
}

function partyAtStart(a: ActiveIncursion, p: IncursionProgress): SceneMon[] {
  const members = p.leg === 0 ? a.members : p.record.legs[p.leg - 1].next.members
  return members.map((m) => ({
    id: m.id, team: Team.Party, speciesId: m.speciesId, name: species(m.speciesId).name, level: m.level,
    hp: Math.round(m.hpFraction * 100), maxHp: 100, out: m.out, statuses: m.status ? [m.status] : [], boss: false, moveId: m.moveId, shiny: m.shiny,
  }))
}

function apply(scene: SceneState, e: IncursionEvent, seq: number) {
  if (e.kind === EventKind.Move && e.actor && e.moveId) {
    scene.move = { actor: e.actor, moveId: e.moveId, seq }
    const user = scene.party.find((p) => p.id === e.actor)
    if (user) user.moveId = e.moveId
  }
  if (e.kind === EventKind.Room) {
    Object.assign(scene, { room: e.room ?? scene.room, roomSeq: seq, move: null, focusFoe: null })
    scene.foes = []
    for (const f of e.fighters ?? []) {
      const mon: SceneMon = { ...f, statuses: [] }
      if (f.team === Team.Foe) scene.foes.push(mon)
      else scene.party = scene.party.map((p) => (p.id === f.id ? { ...mon, statuses: p.statuses, moveId: p.moveId, shiny: p.shiny } : p))
    }
  }
  const foe = scene.foes.find((m) => m.id === e.target || (e.kind === EventKind.Move && m.id === e.actor))
  if (foe) scene.focusFoe = foe.id
  if (e.kind === EventKind.Passives && e.passives) scene.passives = e.passives
  if (e.kind === EventKind.Revive && e.revives !== undefined) scene.revives = e.revives
  const target = [...scene.party, ...scene.foes].find((m) => m.id === e.target)
  if (!target) return
  if (e.hp !== undefined) Object.assign(target, { hp: e.hp, maxHp: e.maxHp ?? target.maxHp })
  const others = target.statuses.filter((s) => s !== e.status)
  if (e.kind === EventKind.Status && e.status) target.statuses = [...others, e.status]
  if (e.kind === EventKind.Recover) target.statuses = others
  if (e.kind === EventKind.Revive) target.statuses = []
  if (e.kind === EventKind.Revive) target.out = false
  if (e.kind === EventKind.Out) target.out = true
}

export function sceneAt(a: ActiveIncursion, p: IncursionProgress): SceneState {
  const leg = p.record.legs[p.leg]
  const startRevives = p.leg === 0 ? INCURSION_REVIVES : p.record.legs[p.leg - 1].next.revives
  const startRoom = p.leg === 0 ? 0 : p.record.legs[p.leg - 1].next.room
  const scene: SceneState = {
    room: startRoom, party: partyAtStart(a, p), foes: [], revives: startRevives, passives: [], current: null, seq: 0, move: null,
    focusFoe: null, roomSeq: 0,
  }
  const seen = eventsStarted(leg, p.legMs)
  leg.events.slice(0, seen).forEach((e, i) => apply(scene, e, i + 1))
  scene.current = seen > 0 ? leg.events[seen - 1] : null
  scene.seq = seen
  return scene
}

/** Lo que se cuenta del evento que se está viendo; los golpes, con quién pierde cuántos PS */
export function eventLine(scene: SceneState): string {
  const e = scene.current
  if (!e) return ''
  if (e.kind !== EventKind.Hit) return e.text
  const name = [...scene.party, ...scene.foes].find((m) => m.id === e.target)?.name ?? ''
  return [`${name} pierde ${e.amount ?? 0} PS`, e.text].filter(Boolean).join(' · ')
}
