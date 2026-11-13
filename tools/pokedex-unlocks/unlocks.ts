// Cómo se consigue cada especie en el juego, sacado de los datos reales (nada escrito a mano aquí).
//
// Reglas (game/collection): crear un Pokémon pide sus tickets (el gacha da de todas las especies) y haberlo visto,
// y solo se ve en un combate de ruta, en un jefe de ruta o en un jefe comunitario (ni la torre ni las incursiones
// cuentan). Además, el inicial del tutorial y evolucionar uno que ya se tiene.

import { evolutionsOf, EVOLVING_SPECIES, type Evolution } from '../../src/data/evolutions'
import { INCURSIONS, type FoeSlot } from '../../src/data/incursions'
import { findRoute, KANTO, NodeKind, type Route } from '../../src/data/maps'
import { HARD_RAID_BOSSES, RAID_BOSSES } from '../../src/data/raidBosses'
import { SPECIES, STARTERS, species } from '../../src/data/species'
import { STONE_IDS, STONES } from '../../src/data/stones'
import { initialState } from '../../src/game/core/state'
import { MAX_LEVEL } from '../../src/game/team/stats'

export const Status = { Create: 'create', Evolve: 'evolve', None: 'none' } as const
export type Status = (typeof Status)[keyof typeof Status]

export const STATUS_LABELS: Record<Status, string> = {
  [Status.Create]: 'Se puede crear',
  [Status.Evolve]: 'Solo evolucionando',
  [Status.None]: 'No desbloqueable',
}

/** Una forma de verlo o conseguirlo: «Ruta 1» · «salvaje» */
export interface Source {
  where: string
  how: string
}

export interface SpeciesUnlock {
  id: number
  status: Status
  /** Dónde se ve (y por tanto se puede crear con tickets) */
  seen: Source[]
  /** De qué especie sale al evolucionar, si esa se puede conseguir */
  evolvesFrom: Source[]
  /** Dónde aparece sin que cuente como visto, o en rutas a las que no se llega: pista para los no desbloqueables */
  hints: Source[]
}

/** Rutas a las que se llega desde las abiertas al empezar, siguiendo `unlocks` */
function reachableRoutes(): Route[] {
  const queue = [...initialState().unlockedRoutes]
  const found: Route[] = []
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const r = findRoute(id)
    if (!r || found.includes(r)) continue
    found.push(r)
    if (r.unlocks) queue.push(r.unlocks)
  }
  return found
}

/** Especies que se ven en cada parada de la ruta, con cómo salen */
function routeSightings(r: Route): [number, Source][] {
  return r.nodes.flatMap((n): [number, Source][] => {
    if (n.kind === NodeKind.Raid && n.boss) return [[n.boss.speciesId, { where: r.name, how: 'jefe comunitario' }]]
    if (n.boss) return [[n.boss.speciesId, { where: r.name, how: 'jefe' }]]
    if (n.kind !== NodeKind.Wild) return []
    return (n.encounters ?? r.encounters).map((e): [number, Source] => [e.speciesId, { where: r.name, how: `salvaje (${e.chance}%)` }])
  })
}

const foeIds = (slot: FoeSlot): number[] => ('pool' in slot ? slot.pool.map((o) => o.foe.speciesId) : [slot.speciesId])

function incursionSightings(): [number, Source][] {
  return INCURSIONS.flatMap((inc) =>
    inc.rooms.flatMap((room) => ('foes' in room ? room.foes.flatMap(foeIds) : [])).map((id): [number, Source] => [id, { where: `Incursión ${inc.name}`, how: 'rival (no cuenta como visto)' }]),
  )
}

function seenSources(): Map<number, Source[]> {
  const reachable = reachableRoutes()
  const sightings: [number, Source][] = [
    ...STARTERS.map((id): [number, Source] => [id, { where: 'Tutorial', how: 'inicial' }]),
    ...reachable.flatMap(routeSightings),
    ...RAID_BOSSES.map((b): [number, Source] => [b.speciesId, { where: 'Raids', how: 'jefe de la rotación en orden' }]),
    ...HARD_RAID_BOSSES.map((b): [number, Source] => [b.speciesId, { where: 'Raids', how: 'jefe de la rotación difícil' }]),
  ]
  return groupById(sightings)
}

function hintSources(): Map<number, Source[]> {
  const reachable = reachableRoutes()
  const unreachable = KANTO.routes.filter((r) => !reachable.includes(r))
  const lost = unreachable.flatMap(routeSightings).map(([id, src]): [number, Source] => [id, { ...src, how: `${src.how}, ruta sin acceso` }])
  return groupById([...lost, ...incursionSightings()])
}

function groupById(pairs: [number, Source][]): Map<number, Source[]> {
  const map = new Map<number, Source[]>()
  for (const [id, src] of pairs) {
    const list = map.get(id) ?? []
    if (!list.some((s) => s.where === src.where && s.how === src.how)) list.push(src)
    map.set(id, list)
  }
  return map
}

const evolutionHow = (e: Evolution): string => (e.stone ? `con ${STONES[e.stone].name}` : `nivel ${e.level}`)

/** Una evolución se puede hacer si el nivel existe y el objeto se vende en la tienda */
const canEvolve = (e: Evolution): boolean => (e.stone ? STONE_IDS.includes(e.stone) : e.level <= MAX_LEVEL)

/** Especies a las que se llega evolucionando desde las conseguibles, hasta que no salga ninguna nueva */
function evolutionSources(obtainable: Set<number>): Map<number, Source[]> {
  const sources = new Map<number, Source[]>()
  for (let grew = true; grew; ) {
    grew = false
    for (const from of EVOLVING_SPECIES.filter((id) => obtainable.has(id))) {
      for (const evo of evolutionsOf(from).filter(canEvolve)) {
        const list = sources.get(evo.into) ?? []
        if (list.some((s) => s.where === species(from).name)) continue
        sources.set(evo.into, [...list, { where: species(from).name, how: evolutionHow(evo) }])
        grew ||= !obtainable.has(evo.into)
        obtainable.add(evo.into)
      }
    }
  }
  return sources
}

export function speciesUnlocks(): SpeciesUnlock[] {
  const seen = seenSources()
  const hints = hintSources()
  const evolved = evolutionSources(new Set(seen.keys()))
  return SPECIES.map((sp) => {
    const seenHere = seen.get(sp.id) ?? []
    const evolvesFrom = evolved.get(sp.id) ?? []
    const status = seenHere.length > 0 ? Status.Create : evolvesFrom.length > 0 ? Status.Evolve : Status.None
    return { id: sp.id, status, seen: seenHere, evolvesFrom, hints: hints.get(sp.id) ?? [] }
  })
}
