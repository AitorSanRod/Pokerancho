// Lo que guarda el formulario. Todo se escribe con las claves de los diccionarios del juego (`Pikachu`, `Forest`,
// `Sign`…) para que el código generado use `POKEMON.Pikachu`, `Biome.Forest`, `StopLandmark.Sign`.

import type { Route, RouteNode } from '../../src/data/maps'
import type { PokeType } from '../../src/data/types'
import { DICTS, keyOf } from './catalog'
import { loadStored, store } from './mode'

export interface EncDraft {
  species: string
  chance: number
}

export interface PassiveDraft {
  type: PokeType
  level: 1 | 2
}

export interface BossDraft {
  species: string
  level: number
  passives: PassiveDraft[]
  tier: string
  soloMinutes: number | null
}

export interface NodeDraft {
  id: string
  name: string
  kind: string
  steps: number
  landmark: string
  levelBonus: number | null
  statMult: number | null
  ownEncounters: boolean
  encounters: EncDraft[]
  boss: BossDraft
  potion: string
}

export interface RouteDraft {
  comment: string
  idKey: string
  /** Valor del RouteId si la ruta es nueva (la clave no está en `RouteId`) */
  idValue: string
  name: string
  description: string
  biome: string
  useBackdrop: boolean
  /** Fichero de `src/assets/routes/` */
  backdropFile: string
  focusY: number
  levels: [number, number]
  encounters: EncDraft[]
  reward: { tickets: number; money: number; exp: number }
  unlocks: string
  nodes: NodeDraft[]
}

const emptyBoss = (): BossDraft => ({ species: '', level: 10, passives: [], tier: 'Low', soloMinutes: null })

export const emptyNode = (id: string, kind = 'Wild', steps = 20): NodeDraft => ({
  id,
  name: '',
  kind,
  steps,
  landmark: '',
  levelBonus: null,
  statMult: null,
  ownEncounters: false,
  encounters: [{ species: '', chance: 100 }],
  boss: emptyBoss(),
  potion: 'Potion',
})

export const emptyRoute = (): RouteDraft => ({
  comment: '',
  idKey: '',
  idValue: '',
  name: '',
  description: '',
  biome: 'Meadow',
  useBackdrop: false,
  backdropFile: '',
  focusY: 40,
  levels: [5, 8],
  encounters: [{ species: '', chance: 100 }],
  reward: { tickets: 2, money: 400, exp: 250 },
  unlocks: '',
  nodes: [{ ...emptyNode('s', 'Start', 0), name: 'Inicio' }, emptyNode('a')],
})

const encDrafts = (list: Route['encounters']): EncDraft[] =>
  list.map((e) => ({ species: keyOf(DICTS.POKEMON, e.speciesId), chance: e.chance }))

function nodeDraft(n: RouteNode, steps: number): NodeDraft {
  const b = n.boss
  return {
    ...emptyNode(n.id, keyOf(DICTS.NodeKind, n.kind), steps),
    name: n.name,
    landmark: keyOf(DICTS.StopLandmark, n.landmark),
    levelBonus: n.levelBonus ?? null,
    statMult: n.statMult ?? null,
    ownEncounters: !!n.encounters,
    encounters: n.encounters ? encDrafts(n.encounters) : [{ species: '', chance: 100 }],
    boss: b
      ? { species: keyOf(DICTS.POKEMON, b.speciesId), level: b.level, passives: [...(b.passives ?? [])], tier: keyOf(DICTS.RaidTier, b.tier) || 'Low', soloMinutes: b.soloMinutes ?? null }
      : emptyBoss(),
    potion: keyOf(DICTS.Potion, n.potion) || 'Potion',
  }
}

/** Nombre del fichero de una imagen ya publicada por Vite (`/src/assets/routes/route-1.webp?…` → `route-1.webp`) */
const fileOf = (url: string) => url.split('?')[0].split('/').pop() ?? ''

/** Borrador a partir de una ruta del juego. Las rutas son caminos únicos: los pasos de cada parada salen del enlace anterior */
export function fromRoute(r: Route): RouteDraft {
  const stepsTo = (n: RouteNode, i: number) => (i === 0 ? 0 : (r.nodes[i - 1].next.find((e) => e.to === n.id)?.steps ?? 0))
  return {
    ...emptyRoute(),
    idKey: keyOf(DICTS.RouteId, r.id),
    name: r.name,
    description: r.description,
    biome: keyOf(DICTS.Biome, r.biome),
    useBackdrop: !!r.backdrop,
    backdropFile: r.backdrop ? fileOf(r.backdrop.image) : '',
    focusY: r.backdrop?.focusY ?? 40,
    levels: [...r.levels],
    encounters: encDrafts(r.encounters),
    reward: { ...r.reward },
    unlocks: keyOf(DICTS.RouteId, r.unlocks),
    nodes: r.nodes.map((n, i) => nodeDraft(n, stepsTo(n, i))),
  }
}

/** ¿Es un camino sin bifurcar (lo único que sabe escribir el editor, con `chain`)? */
export const isChain = (r: Route) => r.nodes.every((n, i) => n.next.length === (i === r.nodes.length - 1 ? 0 : 1) && (!n.next[0] || n.next[0].to === r.nodes[i + 1].id))

const STORAGE_KEY = 'route-editor-draft'

export const loadDraft = (): RouteDraft => loadStored(STORAGE_KEY, emptyRoute)
export const saveDraft = (d: RouteDraft) => store(STORAGE_KEY, d)
