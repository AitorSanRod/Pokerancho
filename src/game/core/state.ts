import type { Badge } from '../../data/badges'
import type { FormItem } from '../../data/forms'
import type { IncursionId } from '../../data/incursions'
import { RouteId } from '../../data/maps'
import type { RanchBackdrop } from '../../data/ranchBackdrops'
import type { RanchTypeId } from '../../data/ranchTypes'
import { baseSpeciesOf } from '../../data/species'
import type { StarItem } from '../../data/starItems'
import type { Tm } from '../../data/tms'
import type { Stone } from '../../data/stones'
import type { DailyMissions } from '../collection/missions'
import type { ActiveIncursion } from '../incursion/activeIncursion'
import type { IncursionQueue } from '../incursion/online/linkedIncursion'
import type { TowerRun } from '../tower/towerRun'
import { noTabRaids, type TabRaids } from '../raid/raid'
import type { RaidPrize } from '../raid/raidRoom'
import type { UpgradeId } from '../team/upgrades'
import type { OwnedMon } from './monTypes'
import type { Expedition, RouteRaidStreak, Run } from './runTypes'

// Los tipos de los Pokémon, la ruta y las expediciones están en sus ficheros; se reexportan para importarlos de aquí
export type { OwnedMon, RanchSpot } from './monTypes'
export type { Expedition, ExpeditionTerms, RouteRaidStreak, Run, RunPhase, StopHeal } from './runTypes'

/** Paso del tutorial inicial (ver tutorial.ts); null cuando ya se juega con libertad */
export const TutorialStep = { Starter: 'starter', Combine: 'combine', Route: 'route' } as const
export type TutorialStep = (typeof TutorialStep)[keyof typeof TutorialStep]

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
  /** Huevos Suerte cogidos en ruta y aún sin usar (ver run/expBoost.ts) */
  luckyEggs: number
  /** Se ha usado un Huevo Suerte: la próxima ruta que se empiece irá con su bonificación */
  luckyEggArmed: boolean
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
  /** Misiones del día (ver collection/missions.ts); null hasta que salen las primeras */
  missions: DailyMissions | null
  /** Torre infinita en curso o su resumen al acabar (ver tower/tower.ts); null si no */
  tower: TowerRun | null
  /** Piso más alto superado en la torre infinita (los premios de piso se dan por encima) */
  towerBest: number
  /** Piso más alto superado esta semana (`week`, ver core/ranking.ts › rankingWeek): el que sale en su ranking, de cero cada lunes */
  towerWeek: { week: number; best: number }
  /** Medallas de gimnasio ganadas, en el orden en que se ganaron (ver data/badges.ts) */
  badges: Badge[]
  /** Buscando grupo para una incursión con otros jugadores (ver incursion/online/linkedIncursion.ts); null si no */
  incursionQueue: IncursionQueue | null
  tutorial: TutorialStep | null
  unlockedRoutes: string[]
  completedRoutes: string[]
  run: Run | null
  expeditions: Expedition[]
  /**
   * Salas de la pestaña Raids en las que está el jugador, una por rotación de jefes (puede estar en las dos a la vez):
   * con servidor, el reflejo de la suya; sin él, la local con bots (ver raid/raid.ts)
   */
  raids: TabRaids
  /** Premios de los jefes de la pestaña Raids que no se recogieron al terminar la pelea, pendientes en Notificaciones */
  raidPrizes: RaidPrize[]
  /** Salas del servidor que el jugador ha dejado sin que el servidor lo sepa aún (ver net/raidSync.ts) */
  roomsToLeave: string[]
  /** Racha de victorias seguidas contra el jefe de cada parada (`ruta/parada`), para rebajar su dinero (ver routeRaidStreak.ts) */
  routeRaidStreaks: Record<string, RouteRaidStreak>
  /**
   * Sello de intercambios: sube con cada intercambio que el servidor aplica a la partida de la nube (ver
   * trade/tradeOps.ts). El servidor no deja subir una partida con un sello más viejo que el suyo: así no vuelve lo ya dado
   */
  tradeStamp: number
  /** Multiplicador de tiempo (x1 = tiempo real); solo se puede cambiar en desarrollo, desde la barra superior */
  timeScale: number
  lastTick: number
}

export const SAVE_VERSION = 64

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
    luckyEggs: 0,
    luckyEggArmed: false,
    starItems: {},
    gachaPity: {},
    tms: {},
    incursionKeys: {},
    freeIncursionsPlayed: [],
    incursion: null,
    incursionQueue: null,
    claimedServerGifts: [],
    missions: null,
    tower: null,
    towerBest: 0,
    towerWeek: { week: 0, best: 0 },
    badges: [],
    tutorial: TutorialStep.Starter,
    unlockedRoutes: [RouteId.PuebloPaleta],
    completedRoutes: [],
    run: null,
    expeditions: [],
    raids: noTabRaids(),
    raidPrizes: [],
    roomsToLeave: [],
    routeRaidStreaks: {},
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

export const MonPlace = { Ranch: 'ranch', Run: 'run', Expedition: 'expedition', Raid: 'raid', Incursion: 'incursion', Tower: 'tower', Box: 'box' } as const
export type MonPlace = (typeof MonPlace)[keyof typeof MonPlace]

/** Dónde está un Pokémon: solo los que están en el rancho se pueden curar, entrenar o enviar */
export function monPlace(s: GameState, uid: string): MonPlace {
  if (s.run && uid === s.activeUid) return MonPlace.Run
  if (s.expeditions.some((e) => e.uid === uid)) return MonPlace.Expedition
  if (Object.values(s.raids).some((r) => r?.uid === uid)) return MonPlace.Raid
  if (s.tower?.end === null && s.tower.uid === uid) return MonPlace.Tower
  if (s.incursion?.uid === uid || s.incursionQueue?.uid === uid) return MonPlace.Incursion
  if (findMon(s, uid)?.ranch === null) return MonPlace.Box
  return MonPlace.Ranch
}

/** Recupera una partida guardada de esta versión; los campos que falten toman su valor inicial */
export function restoreState(saved: GameState): GameState | null {
  return saved.version === SAVE_VERSION ? { ...initialState(), ...saved } : null
}
