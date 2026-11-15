import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import type { TowerRun } from './towerRun'

// Huevo Suerte de la torre: al ganar un piso a veces (towerRewards.ts › TOWER_EGG_CHANCE) aparece en la escena unos
// segundos. Si se toca, va a la Mochila; si no, se pierde, también con la app cerrada (como en las rutas, run/expBoost.ts).

/** Milisegundos reales que se queda el huevo en la escena de la torre para tocarlo (sigan los combates o no) */
export const TOWER_EGG_VISIBLE_MS = 6_000

/** El huevo en la escena: cuánto le queda y dónde sale, de 0 (izquierda) a 1 (derecha) */
export interface TowerEgg {
  msLeft: number
  spot: number
}

/** Sale un huevo en la escena (si ya había uno, lo sustituye) */
export function spawnTowerEgg(t: TowerRun, rng: Rng = Math.random) {
  t.egg = { msLeft: TOWER_EGG_VISIBLE_MS, spot: rng() }
}

/** Pasan `ms` reales: el huevo que no se toca a tiempo se va */
export function passEggTime(t: TowerRun, ms: number) {
  if (!t.egg) return
  t.egg.msLeft -= ms
  if (t.egg.msLeft <= 0) t.egg = null
}

/** Tocar el huevo mientras está en la escena (con la subida en curso) lo guarda en la Mochila */
export function catchTowerEgg(s: GameState): boolean {
  const t = s.tower
  if (!t?.egg || t.end !== null) return false
  t.egg = null
  t.earned.eggs += 1
  s.luckyEggs += 1
  return true
}
