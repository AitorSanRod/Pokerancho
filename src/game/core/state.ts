import type { FormItem } from '../../data/forms'
import type { IncursionId } from '../../data/incursions'
import type { Nature } from '../../data/natures'
import { RouteId } from '../../data/maps'
import type { Potion } from '../../data/potions'
import type { RanchBackdrop } from '../../data/ranchBackdrops'
import type { RanchTypeId } from '../../data/ranchTypes'
import { baseSpeciesOf } from '../../data/species'
import type { StarItem } from '../../data/starItems'
import type { Tm } from '../../data/tms'
import type { Stone } from '../../data/stones'
import type { BattleRecord } from '../battle/battle'
import type { ActiveIncursion } from '../incursion/activeIncursion'
import type { IncursionQueue } from '../incursion/online/linkedIncursion'
import { RaidRotation } from '../raid/online/protocol'
import type { Raid, RaidPrize } from '../raid/raidRoom'
import type { UpgradeId } from '../team/upgrades'

export interface OwnedMon {
  uid: string
  speciesId: number
  level: number
  /** EXP acumulada dentro del nivel actual */
  exp: number
  hp: number
  /** Estrellas conseguidas combinando piezas en la Pokédex */
  stars: number
  /** Sube una stat y baja otra (ver team/natures.ts); los de antes de las naturalezas, neutra */
  nature: Nature
  /** Índice del rancho al que pertenece (aunque esté fuera, su hueco sigue ocupado); null si está en la Caja */
  ranch: number | null
  /** Posición en la hierba elegida arrastrándolo, en % del prado; null para la que sale de su uid */
  spot: RanchSpot | null
  /** Ataques de incursión aprendidos con una MT (ver incursion/tms.ts): los tiene para siempre */
  tmMoves: Tm[]
}

export interface RanchSpot {
  x: number
  y: number
}

/** `raid`: luchando contra el jefe comunitario de la parada (ver raid/routeRaid.ts) */
type RunPhase = 'walking' | 'raid' | 'complete' | 'fainted'

/** Paso del tutorial inicial (ver tutorial.ts); null cuando ya se juega con libertad */
export const TutorialStep = { Starter: 'starter', Combine: 'combine', Route: 'route' } as const
export type TutorialStep = (typeof TutorialStep)[keyof typeof TutorialStep]

/** Victorias seguidas contra el jefe de una parada y cuándo fue la última (ms reales) */
export interface RouteRaidStreak {
  count: number
  lastAt: number
}

/** Poción usada en una parada de curación: PS recuperados y milisegundos reales que quedan de la parada */
export interface StopHeal {
  potion: Potion
  hp: number
  msLeft: number
}

export interface Run {
  routeId: string
  /** Nodos elegidos antes de salir, del inicio al final */
  path: string[]
  /** Índice en `path` del último nodo alcanzado */
  stop: number
  /** Pasos dados en el tramo actual */
  steps: number
  phase: RunPhase
  /** Último combate, para que la UI lo reproduzca */
  lastBattle: BattleRecord | null
  /** Milisegundos reales que quedan del combate en curso; mientras sea > 0 no se dan pasos */
  battleMsLeft: number
  /** Sala del jefe comunitario de la parada en la que está luchando (fase `raid`) */
  raid: Raid | null
  /**
   * Vida del jefe comunitario (fracción de la total) cuando el Pokémon gastó sus vidas y volvió al principio de la
   * ruta; al llegar de nuevo a la parada entra en una sala con el jefe lo más cerca posible de ella. null si no
   */
  raidRejoinHp: number | null
  /** Cura de la parada de poción en la que está parado el Pokémon; mientras `msLeft` sea > 0 no se dan pasos */
  heal: StopHeal | null
  /** Ruta que se ha desbloqueado al completar esta por primera vez (null si no ha desbloqueado ninguna) */
  unlocked: string | null
  /**
   * Lo ganado en la ruta; `pieces` son las especies de las piezas soltadas (una entrada por pieza) y `raidBosses`, los
   * jefes comunitarios derrotados en ella (su premio ya va sumado en lo demás)
   */
  earned: {
    money: number
    tickets: number
    pieces: number[]
    exp: number
    levelsGained: number
    wins: number
    battles: number
    raidBosses: number[]
    /** Fracción más baja del dinero que han dado los jefes de la ruta por repetirla seguida (1: entero) */
    raidMoneyMult: number
    /** Especies vistas por primera vez en esta ruta, en el orden en que aparecieron */
    discovered: number[]
  }
}

/** Un Pokémon del rancho haciendo una ruta por su cuenta durante un tiempo fijo */
export interface Expedition {
  uid: string
  routeId: string
  /** Minutos de juego que dura */
  durationMin: number
  elapsedMin: number
}

export interface GameState {
  version: number
  money: number
  tickets: number
  owned: OwnedMon[]
  activeUid: string | null
  /** Especies vistas en una ruta o un jefe (más el inicial y las capturadas) */
  seen: number[]
  caught: number[]
  /** Piezas de gacha por especie (speciesId → cantidad) */
  pieces: Record<number, number>
  /** Trozos de MissingNo: se obtienen triturando piezas y se cambian por piezas de cualquier Pokémon */
  missingnoShards: number
  /** Especies marcadas como favoritas en la Pokédex: sus piezas no se pueden triturar */
  favorites: number[]
  /** Nivel comprado de cada mejora de la tienda */
  upgrades: Partial<Record<UpgradeId, number>>
  /** Objetos de tipo de rancho comprados (cuentan también los colocados) */
  ranchTypeItems: Partial<Record<RanchTypeId, number>>
  /** Tipo de rancho colocado en cada rancho, por su índice; sin entrada, rancho normal */
  ranchTypeOf: Partial<Record<number, RanchTypeId>>
  /** Espacios de más de cada rancho, por su índice, comprados con la Ampliación de rancho de la tienda */
  ranchExtraSlots: Partial<Record<number, number>>
  /** Nombre que el jugador ha puesto a cada rancho, por su índice; sin entrada, «Rancho N» (ver ranchNames.ts) */
  ranchNames: Partial<Record<number, string>>
  /** Fondo que el jugador ha elegido para cada rancho, por su índice; sin entrada, el de por defecto (ver ranchBackdrops.ts) */
  ranchBackdropOf: Partial<Record<number, RanchBackdrop>>
  /** Objetos evolutivos (piedras y otros) comprados y aún sin gastar */
  stones: Partial<Record<Stone, number>>
  /** Objetos de forma comprados (ver team/forms.ts): no se gastan, se usan siempre que se quiera */
  formItems: FormItem[]
  /** Mentas aleatorias compradas y aún sin usar (ver team/mints.ts) */
  mints: number
  /** Objetos estelares sin gastar (ver collection/starItems.ts) */
  starItems: Partial<Record<StarItem, number>>
  /** Tiradas seguidas del gacha sin que haya salido cada objeto estelar con garantía */
  gachaPity: Partial<Record<StarItem, number>>
  /** MTs sin usar (ver incursion/tms.ts) */
  tms: Partial<Record<Tm, number>>
  /** Llaves de incursión compradas y aún sin gastar, por incursión */
  incursionKeys: Partial<Record<IncursionId, number>>
  /** Incursiones gratuitas cuyo premio ya se cobró: las siguientes veces no dan nada (ver incursion/freeIncursions.ts) */
  freeIncursionsPlayed: IncursionId[]
  /** La incursión en la que está un Pokémon del jugador (ver incursion/incursionGame.ts); null si ninguna */
  incursion: ActiveIncursion | null
  /** Regalos del servidor ya recogidos, por su id (ver collection/serverGifts.ts) */
  claimedServerGifts: string[]
  /** Buscando grupo para una incursión con otros jugadores (ver incursion/online/linkedIncursion.ts); null si no */
  incursionQueue: IncursionQueue | null
  tutorial: TutorialStep | null
  unlockedRoutes: string[]
  completedRoutes: string[]
  run: Run | null
  expeditions: Expedition[]
  /**
   * Salas de la pestaña Raids, una por rotación de jefes (se puede luchar en las dos a la vez). Sin servidor solo se
   * juega la ordenada; con él, solo están las salas con un Pokémon del jugador dentro
   */
  raids: TabRaids
  /** Premios de los jefes de la pestaña Raids derrotados, pendientes de recoger allí */
  raidPrizes: RaidPrize[]
  /** Salas compartidas del servidor que el jugador ha dejado sin que el servidor lo sepa aún (ver net/raidSync.ts) */
  roomsToLeave: string[]
  /** Racha de victorias seguidas contra el jefe de cada parada (`ruta/parada`), para rebajar su dinero (ver routeRaidStreak.ts) */
  routeRaidStreaks: Record<string, RouteRaidStreak>
  /**
   * La pestaña Raids la lleva el servidor (net/raidFeed.ts lo sabe al hablar con él): sin un Pokémon propio dentro no
   * se juega nada aquí y el jefe que se ve es el del servidor. false: sin servidor, todo en local con bots
   */
  raidServer: boolean
  /**
   * Sello de intercambios: sube con cada intercambio que el servidor aplica a la partida de la nube (ver
   * trade/tradeOps.ts). El servidor no deja subir una partida con un sello más viejo que el suyo: así no vuelve lo ya dado
   */
  tradeStamp: number
  /** Multiplicador de tiempo (x1 = tiempo real); solo se puede cambiar en desarrollo, desde la barra superior */
  timeScale: number
  lastTick: number
}

export const SAVE_VERSION = 46

export type TabRaids = Record<RaidRotation, Raid | null>

/** Ninguna sala en la pestaña Raids */
export const noTabRaids = (): TabRaids => ({ [RaidRotation.Ordered]: null, [RaidRotation.Hard]: null })

export function initialState(): GameState {
  return {
    version: SAVE_VERSION,
    money: 240,
    tickets: 1,
    owned: [],
    activeUid: null,
    seen: [],
    caught: [],
    pieces: {},
    missingnoShards: 0,
    favorites: [],
    upgrades: {},
    ranchTypeItems: {},
    ranchTypeOf: {},
    ranchExtraSlots: {},
    ranchNames: {},
    ranchBackdropOf: {},
    stones: {},
    formItems: [],
    mints: 0,
    starItems: {},
    gachaPity: {},
    tms: {},
    incursionKeys: {},
    freeIncursionsPlayed: [],
    incursion: null,
    incursionQueue: null,
    claimedServerGifts: [],
    tutorial: TutorialStep.Starter,
    unlockedRoutes: [RouteId.PuebloPaleta],
    completedRoutes: [],
    run: null,
    expeditions: [],
    raids: noTabRaids(),
    raidPrizes: [],
    roomsToLeave: [],
    routeRaidStreaks: {},
    raidServer: false,
    tradeStamp: 0,
    timeScale: 1,
    lastTick: Date.now(),
  }
}

export function findMon(s: GameState, uid: string): OwnedMon | undefined {
  return s.owned.find((m) => m.uid === uid)
}

/** El Pokémon del jugador de esa especie, esté en la forma que esté (Rotom o Rotom Calor cuentan como Rotom) */
export function ownedOfSpecies(s: GameState, speciesId: number): OwnedMon | undefined {
  const base = baseSpeciesOf(speciesId)
  return s.owned.find((m) => baseSpeciesOf(m.speciesId) === base)
}

export function activeMon(s: GameState): OwnedMon | null {
  return (s.activeUid && findMon(s, s.activeUid)) || null
}

export const MonPlace = { Ranch: 'ranch', Run: 'run', Expedition: 'expedition', Raid: 'raid', Incursion: 'incursion', Box: 'box' } as const
export type MonPlace = (typeof MonPlace)[keyof typeof MonPlace]

/** Dónde está un Pokémon: solo los que están en el rancho se pueden curar, entrenar o enviar */
export function monPlace(s: GameState, uid: string): MonPlace {
  if (s.run && uid === s.activeUid) return MonPlace.Run
  if (s.expeditions.some((e) => e.uid === uid)) return MonPlace.Expedition
  if (Object.values(s.raids).some((r) => r?.members.some((m) => m.id === uid && !m.left))) return MonPlace.Raid
  if (s.incursion?.uid === uid || s.incursionQueue?.uid === uid) return MonPlace.Incursion
  if (findMon(s, uid)?.ranch === null) return MonPlace.Box
  return MonPlace.Ranch
}

/** Recupera una partida guardada de esta versión; los campos que falten toman su valor inicial */
export function restoreState(saved: GameState): GameState | null {
  return saved.version === SAVE_VERSION ? { ...initialState(), ...saved } : null
}
