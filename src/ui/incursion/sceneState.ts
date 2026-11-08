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
  status: StatusId | null
  boss: boolean
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
}

function partyAtStart(a: ActiveIncursion, p: IncursionProgress): SceneMon[] {
  const members = p.leg === 0 ? a.members : p.record.legs[p.leg - 1].next.members
  return members.map((m) => ({
    id: m.id, team: Team.Party, speciesId: m.speciesId, name: species(m.speciesId).name, level: m.level,
    hp: Math.round(m.hpFraction * 100), maxHp: 100, out: m.out, status: m.status, boss: false,
  }))
}

function apply(scene: SceneState, e: IncursionEvent) {
  if (e.kind === EventKind.Room) {
    scene.room = e.room ?? scene.room
    scene.foes = []
    for (const f of e.fighters ?? []) {
      const mon: SceneMon = { ...f, status: null }
      if (f.team === Team.Foe) scene.foes.push(mon)
      else scene.party = scene.party.map((p) => (p.id === f.id ? { ...mon, status: p.status } : p))
    }
  }
  if (e.kind === EventKind.Passives && e.passives) scene.passives = e.passives
  if (e.kind === EventKind.Revive && e.revives !== undefined) scene.revives = e.revives
  const target = [...scene.party, ...scene.foes].find((m) => m.id === e.target)
  if (!target) return
  if (e.hp !== undefined) Object.assign(target, { hp: e.hp, maxHp: e.maxHp ?? target.maxHp })
  if (e.kind === EventKind.Status && e.status) target.status = e.status
  if (e.kind === EventKind.Revive) Object.assign(target, { out: false, status: null })
  if (e.kind === EventKind.Out) target.out = true
}

export function sceneAt(a: ActiveIncursion, p: IncursionProgress): SceneState {
  const leg = p.record.legs[p.leg]
  const startRevives = p.leg === 0 ? INCURSION_REVIVES : p.record.legs[p.leg - 1].next.revives
  const startRoom = p.leg === 0 ? 0 : p.record.legs[p.leg - 1].next.room
  const scene: SceneState = { room: startRoom, party: partyAtStart(a, p), foes: [], revives: startRevives, passives: [], current: null, seq: 0 }
  const seen = eventsStarted(leg, p.legMs)
  for (const e of leg.events.slice(0, seen)) apply(scene, e)
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
