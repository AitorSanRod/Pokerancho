import type { Badge } from '../../data/badges'
import type { Encounter } from '../../data/maps'
import type { Potion } from '../../data/potions'
import type { BattleRecord } from '../battle/battle'
import type { Trainer } from '../../data/trainers'
import type { PokeType } from '../../data/types'
import type { ExpBoost } from '../run/expBoost'
import type { SurpriseKind } from '../run/runSurprise'
import type { RunGym } from '../run/runGym'
import type { RunTrainer } from '../run/runTrainer'
import type { RouteBattleSetup } from '../run/tapCrit'
import type { ExpeditionFocus } from '../team/expeditionFocus'

// La ruta en curso y las expediciones, tal y como se guardan en la partida (los reexporta state.ts)

export type RunPhase = 'walking' | 'complete' | 'fainted'

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

/** Parada sorpresa de esta salida (ver run/runSurprise.ts) */
export interface RunSurprise {
  kind: SurpriseKind
  /** Índice en `path` de la parada de salvajes que sustituye */
  stop: number
  /** En una horda, los salvajes que quedan por salir tras el que lucha */
  left: number
  /** El entrenador rival que reta (su equipo sale de los salvajes de la parada); null en las demás sorpresas */
  trainer: Trainer | null
}

/** Cofre de la parada sorpresa: lo que traía (ya sumado) y los milisegundos reales que quedan de la parada */
export interface StopChest {
  money: number
  tickets: number
  /** Especies de los tickets de especie, uno por entrada */
  pieces: number[]
  msLeft: number
}

export interface Run {
  routeId: string
  /** Nodos elegidos antes de salir, del inicio al final */
  path: string[]
  /** Nivel con el que salió el Pokémon (para las estrellas de nivel, ver run/routeStars.ts) */
  startLevel: number
  /** Tipos de las pasivas de rancho con las que ha luchado en la ruta (para las estrellas de pasivas) */
  passiveTypes: PokeType[]
  /** PS más bajos a los que ha llegado en la ruta, en % de sus PS máximos (para las estrellas de PS) */
  lowestHp: number
  /** Parada sorpresa de esta salida; null si no le ha tocado ninguna */
  surprise: RunSurprise | null
  /** Cofre que está abriendo en la parada sorpresa; mientras `msLeft` sea > 0 no se dan pasos */
  chest: StopChest | null
  /** Índice en `path` del último nodo alcanzado */
  stop: number
  /** Pasos dados en el tramo actual */
  steps: number
  phase: RunPhase
  /** Último combate, para que la UI lo reproduzca */
  lastBattle: BattleRecord | null
  /** Cómo empezó el último combate, para repetirlo con los toques críticos (ver run/tapCrit.ts) */
  battleSetup: RouteBattleSetup | null
  /** Milisegundos reales que quedan del combate en curso; mientras sea > 0 no se dan pasos */
  battleMsLeft: number

  /** Cura de la parada de poción en la que está parado el Pokémon; mientras `msLeft` sea > 0 no se dan pasos */
  heal: StopHeal | null
  /** Huevo Suerte: si sale en esta ruta y dónde, y si la ruta va con uno usado (ver run/expBoost.ts) */
  boost: ExpBoost
  /** Rutas que se han desbloqueado al completar esta por primera vez (la siguiente y las opcionales) */
  unlocked: string[]
  /** Ataque elegido para sus combates (de su repertorio de incursión; ver run/runMove.ts) */
  moveId: string
  /** Combate contra el líder en la parada de gimnasio: qué Pokémon suyo toca (ver run/runGym.ts); null fuera */
  gym: RunGym | null
  /** Combate contra el entrenador de la parada: qué Pokémon suyo toca (ver run/runTrainer.ts); null fuera */
  trainer: RunTrainer | null
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
    /** Medalla ganada en esta ruta (la primera victoria contra el líder del gimnasio); null si ninguna */
    badge: Badge | null
    /** Estrellas de la ruta conseguidas al completarla esta vez (sus claves, ver run/routeStars.ts) */
    stars: string[]
  }
}

/** Un Pokémon del rancho haciendo una ruta por su cuenta durante un tiempo fijo */
/**
 * Condiciones de una expedición, fijadas al mandarla: un cambio posterior en la ruta o en las reglas vale para las
 * siguientes, y la que ya está fuera termina como empezó (aunque su ruta ya no exista)
 */
export interface ExpeditionTerms {
  routeName: string
  levels: [number, number]
  encounters: Encounter[]
  /** Pasos medios entre paradas de la ruta (para el ₽ de cada victoria) */
  legSteps: number
  battles: number
  /** Multiplicadores de EXP, ₽ y botín (duración y enfoque) */
  expMult: number
  moneyMult: number
  lootMult: number
}

export interface Expedition {
  uid: string
  routeId: string
  /** Minutos de juego que dura */
  durationMin: number
  /** Qué se quiere sacar de ella (ver team/expeditionFocus.ts) */
  focus: ExpeditionFocus
  elapsedMin: number
  terms: ExpeditionTerms
}
