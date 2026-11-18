import type { PassiveRef } from '../passives'
import { GYMS, type GymId } from '../gyms'
import type { Potion } from '../potions'
import type { RaidTier } from '../raidBosses'
import { TRAINERS, type TrainerId } from '../trainers'

export interface Encounter {
  speciesId: number
  /** Probabilidad de que salga, en %. Los de una misma lista suman 100 */
  chance: number
}

/**
 * Tipos de parada. `Raid`: jefe comunitario; un combate como el de un jefe y, al vencerlo, el premio de su tabla de
 * raids (ver game/raid/routeRaid.ts). `Heal`: sin combate, el Pokémon se para y se cura con la poción de la parada (ver
 * game/run/runHeal.ts). `Gym`: el líder del gimnasio (`gym`, ver data/gyms.ts) saca su equipo uno tras otro y el
 * jugador puede cambiar de ataque en cualquier momento (ver game/run/runGym.ts). `Trainer`: un entrenador (`trainer`, ver
 * data/trainers.ts) saca su equipo uno tras otro y cada Pokémon suyo da más EXP (ver game/run/runTrainer.ts). Previstos
 * para más adelante: cofre y especial
 */
export const NodeKind = { Start: 'start', Wild: 'wild', Boss: 'boss', Raid: 'raid', Heal: 'heal', Gym: 'gym', Trainer: 'trainer' } as const
export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind]

/** Fondo de la escena de caminar (ver src/ui/route/pixelScene/). PalletTown es solo de Pueblo Paleta */
export const Biome = { Meadow: 'meadow', PalletTown: 'pallet-town', PewterCity: 'pewter-city', CeruleanCity: 'cerulean-city', Forest: 'forest', Cave: 'cave', MtMoon: 'mt-moon', Sea: 'sea', Lab: 'lab', VermilionCity: 'vermilion-city', MeadowDusk: 'meadow-dusk', Ship: 'ship' } as const
export type Biome = (typeof Biome)[keyof typeof Biome]

/** Rutas por su id. El valor se guarda en la partida: no cambiarlo sin subir SAVE_VERSION */
export const RouteId = {
  PuebloPaleta: 'pueblo-paleta',
  Ruta1: 'ruta-1',
  Ruta1Boss: 'ruta-1-boss',
  BosqueVerde: 'bosque-verde',
  CiudadPlateada: 'ciudad-plateada',
  CiudadPlateada3: 'ciudad-plateada3',
  Ruta3: 'ruta-3',
  Ruta4: 'ruta-4',
  MonteMoon: 'monte-moon',
  RutaMarina: 'ruta-marina',
  CiudadCeleste: 'ciudad-celeste',
  GimnasioPlateada: 'gimnasio-plateada',
  GimnasioCeleste: 'gimnasio-celeste',
  Ruta5: 'ruta-5',
  Ruta6: 'ruta-6',
  GimnasioCarmin: 'gimnasio-carmin',
  SSAnne: 'ss-anne',
  SSAnne2: 'ss-anne2',
  TunelRoca: 'tunel-roca',
  PuebloLavanda: 'pueblo-lavanda',
  CiudadAzulona: 'ciudad-azulona'
} as const
export type RouteId = (typeof RouteId)[keyof typeof RouteId]

/**
 * Elemento que se ve en la escena al llegar a una parada (cartel, casa, fuente…). Cada escena dibuja los suyos
 * (`landmarks` de src/ui/route/pixelScene/scenes/<bioma>); el de una parada tiene que existir en la escena de su ruta.
 */
export const StopLandmark = { Sign: 'sign', House: 'house', Fountain: 'fountain', Log: 'log', Museum: 'museum', Gym: 'gym', Bench: 'bench', Luggage: 'luggage' } as const
export type StopLandmark = (typeof StopLandmark)[keyof typeof StopLandmark]

/** Rival fijo de una parada de jefe; `passives` son sus pasivas de tipo, escritas a mano (sin ellas no tiene) */
export interface Boss {
  speciesId: number
  level: number
  passives?: PassiveRef[]
  /** Tabla de premios (`RAID_PRIZE_TABLES`) si es jefe comunitario: obligatoria en las paradas `NodeKind.Raid` */
  tier?: RaidTier
}

interface RouteEdge {
  to: string
  steps: number
}

/**
 * Las rutas son grafos: un nodo con varios `next` es una bifurcación y el jugador elige el camino antes de
 * salir. Las rutas actuales son caminos únicos.
 */
export interface RouteNode {
  id: string
  name: string
  kind: NodeKind
  next: RouteEdge[]
  /** Niveles que se suman a los salvajes de esta parada (no afecta a los jefes, que llevan su propio nivel) */
  levelBonus?: number
  /**
   * Multiplicador de stats del rival de esta parada (1 = stats completas). Sin él, los salvajes usan el de por defecto
   * (`runBattle.ts › WILD_STAT_MULT`) y los jefes de ruta, 1. No afecta a los jefes comunitarios (`NodeKind.Raid`)
   */
  statMult?: number
  /** Si se define, sustituye a los encuentros de la ruta */
  encounters?: Encounter[]
  /** Obligatorio en las paradas de jefe y de jefe comunitario: siempre sale este Pokémon a este nivel */
  boss?: Boss
  /** Obligatoria en las paradas de curación (`NodeKind.Heal`): la poción que usa el Pokémon al llegar */
  potion?: Potion
  /** Obligatorio en las paradas de gimnasio (`NodeKind.Gym`): de qué gimnasio es su líder */
  gym?: GymId
  /** Obligatorio en las paradas de entrenador (`NodeKind.Trainer`): qué entrenador espera en ella */
  trainer?: TrainerId
  /** Elemento que aparece en la escena al acercarse a esta parada y que se queda a su lado mientras está en ella */
  landmark?: StopLandmark
}

/** Imagen de ambientación de la ruta en la lista de rutas (se ve difuminada detrás de su línea) */
export interface RouteBackdrop {
  image: string
  /** Qué franja de la imagen se ve, en % de su alto: 0 enseña la parte de arriba y 100 la de abajo */
  focusY: number
}

export interface Route {
  id: RouteId
  name: string
  description: string
  /** Fondo animado que se ve mientras el Pokémon camina */
  biome: Biome
  backdrop?: RouteBackdrop
  levels: [number, number]
  encounters: Encounter[]
  nodes: RouteNode[]
  /**
   * Premio por completar la ruta, solo la primera vez (al repetirla se gana solo lo de sus combates).
   * `exp` es también la base de la EXP de sus expediciones.
   */
  reward: { tickets: number; money: number; exp: number }
  unlocks?: RouteId
}

export interface GameMap {
  id: string
  name: string
  routes: Route[]
}

/** Pokémon que salen y su probabilidad en %: `enc([POKEMON.Pidgey, 30], [POKEMON.Rattata, 70])` */
export const enc = (...chances: [speciesId: number, chance: number][]): Encounter[] =>
  chances.map(([speciesId, chance]) => ({ speciesId, chance }))

/** Jefe de una parada: `boss(POKEMON.Pidgeotto, 7)` */
export const boss = (speciesId: number, level: number, passives?: PassiveRef[]): Boss => ({ speciesId, level, passives })

/** Jefe comunitario de una parada `NodeKind.Raid`: `raidBoss(POKEMON.Pidgeotto, 12, RaidTier.Low)` */
export const raidBoss = (speciesId: number, level: number, tier: RaidTier): Boss => ({ speciesId, level, tier })

/** Atajo para un camino sin bifurcar: cada nodo enlaza con el siguiente de la lista */
type Stop = Omit<RouteNode, 'next'> & { steps: number }
export function chain(...stops: Stop[]): RouteNode[] {
  return stops.map(({ steps: _steps, ...stop }, i) => {
    const next = stops[i + 1]
    return { ...stop, next: next ? [{ to: next.id, steps: next.steps }] : [] }
  })
}

/**
 * Imagen propia de `src/assets`, escrita como `asset(new URL('../../assets/…', import.meta.url))` y no con `import`:
 * Vite la convierte igual en la URL publicada, y el servidor (worker/), que también lee los mapas, no tiene que
 * empaquetar imágenes
 */
export const asset = (url: URL): string => url.href

export function node(r: Route, id: string): RouteNode {
  const n = r.nodes.find((n) => n.id === id)
  if (!n) throw new Error(`Nodo desconocido: ${r.id}/${id}`)
  return n
}

function startNode(r: Route): RouteNode {
  return r.nodes.find((n) => n.kind === NodeKind.Start) ?? r.nodes[0]
}

/** Camino desde `fromId` hasta un final tomando siempre la primera opción de cada bifurcación */
export function pathFrom(r: Route, fromId = startNode(r).id): string[] {
  const path = [fromId]
  for (let n = node(r, fromId); n.next.length > 0; n = node(r, n.next[0].to)) path.push(n.next[0].to)
  return path
}

/** Paradas de un camino: todos sus nodos menos el de salida (como las cuenta el mapa de la ruta en curso) */
export const pathStopCount = (path: string[]): number => Math.max(0, path.length - 1)

/** Un camino válido empieza en el inicio, sigue aristas existentes y acaba en un nodo final */
export function isValidPath(r: Route, path: string[]): boolean {
  if (path[0] !== startNode(r).id || !path.every((id) => r.nodes.some((n) => n.id === id))) return false
  const linked = path.every((id, i) => i === 0 || node(r, path[i - 1]).next.some((e) => e.to === id))
  return linked && node(r, path[path.length - 1]).next.length === 0
}

/** Especies que pueden salir en un camino, sin repetir y por orden de aparición: los salvajes de cada parada y los jefes */
export function pathSpecies(r: Route, path: string[]): number[] {
  const ids = path.flatMap((id) => {
    const n = node(r, id)
    if (n.boss) return [n.boss.speciesId]
    if (n.gym) return GYMS[n.gym].team.map((b) => b.speciesId)
    if (n.trainer) return TRAINERS[n.trainer].team.map((b) => b.speciesId)
    return n.kind === NodeKind.Wild ? (n.encounters ?? r.encounters).map((e) => e.speciesId) : []
  })
  return [...new Set(ids)]
}

/** Especies salvajes de la ruta, sin repetir: las de la ruta y las de cada parada de salvajes que lleve las suyas */
export function wildSpecies(r: Route): number[] {
  const lists = [r.encounters, ...r.nodes.filter((n) => n.kind === NodeKind.Wild).map((n) => n.encounters ?? [])]
  return [...new Set(lists.flat().map((e) => e.speciesId))]
}

/** Ruta en la que solo luchan líderes de gimnasio o entrenadores (ni salvajes ni jefes): no lleva salvajes ni expediciones */
export const onlyTrainerFights = (r: Route): boolean => !r.nodes.some((n) => n.kind === NodeKind.Wild || n.kind === NodeKind.Boss || n.kind === NodeKind.Raid)

/** Paradas con combate de la ruta (la de entrenador cuenta como una, aunque saque varios Pokémon) */
const FIGHT_STOPS: NodeKind[] = [NodeKind.Wild, NodeKind.Boss, NodeKind.Trainer]

/** Pasos medios que se andan por combate en el camino principal (los de expediciones, que no recorren tramos) */
export function averageLegSteps(r: Route): number {
  const path = pathFrom(r)
  const steps = path.slice(1).reduce((sum, _, i) => sum + legSteps(r, path, i + 1), 0)
  const fights = path.filter((id) => FIGHT_STOPS.includes(node(r, id).kind)).length
  return steps / Math.max(1, fights)
}

/** Pasos del tramo que llega al nodo `path[i]` */
export function legSteps(r: Route, path: string[], i: number): number {
  return node(r, path[i - 1]).next.find((e) => e.to === path[i])!.steps
}
