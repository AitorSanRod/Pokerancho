import type { BattleRecord } from '../battle/battle'
import type { BattleSetup } from '../run/battleReplay'
import type { TowerEgg } from './towerEgg'
import type { FloorPrize, TowerEarned } from './towerRewards'

// Forma de una subida a la torre infinita (lo que se guarda en GameState.tower); las reglas, en tower.ts

/** Cómo acabó la subida: cayó o la abandonó */
export const TowerEnd = { Fainted: 'fainted', Left: 'left' } as const
export type TowerEnd = (typeof TowerEnd)[keyof typeof TowerEnd]

export interface TowerRun {
  /** El Pokémon que sube (el compañero al empezar) */
  uid: string
  /** Ataque elegido (de su repertorio de incursión) */
  moveId: string
  /** Piso en el que está luchando o, entre combates, el siguiente (1 = el primero) */
  floor: number
  /** PS que le quedan a la copia del Pokémon (en la escala del combate); null, todos */
  hp: number | null
  lastBattle: BattleRecord | null
  /** Cómo empezó el combate del piso, para volver a jugarlo al cambiar de ataque (run/battleReplay.ts); null si no hay */
  battle: BattleSetup | null
  /** Lo que da ganar el combate en curso */
  prize: FloorPrize | null
  /** Milisegundos reales que quedan del combate del piso; 0 entre pisos */
  battleMsLeft: number
  /** Milisegundos reales de paseo que quedan, entre pisos, hasta empezar el siguiente */
  gapMsLeft: number
  /** Huevo Suerte en la escena, esperando a que se toque (towerEgg.ts); null si no hay */
  egg: TowerEgg | null
  /** Récord de siempre antes de esta subida, para avisar de uno nuevo al acabar (los premios de piso van por el de la semana) */
  startBest: number
  earned: TowerEarned
  /** null mientras sube */
  end: TowerEnd | null
}
