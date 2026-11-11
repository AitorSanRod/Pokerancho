import { Nature } from '../../data/natures'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'

// Menta aleatoria: se compra en la Tienda, se guarda en la Mochila y se gasta al usarla en la ficha de un Pokémon, que
// pasa a tener otra naturaleza al azar (nunca la que ya tenía).

/** ₽ que cuesta cada Menta aleatoria en la tienda (sin límite de compra) */
export const MINT_PRICE = 20_000

const ALL_NATURES = Object.values(Nature)

export const mintsOf = (s: GameState): number => s.mints

/** Compra una menta; false si no hay ₽ */
export function buyMint(s: GameState): boolean {
  if (s.money < MINT_PRICE) return false
  s.money -= MINT_PRICE
  s.mints += 1
  return true
}

/** Por qué no se puede usar una menta en ese Pokémon (null si se puede) */
export function mintBlocker(s: GameState, uid: string): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  if (mintsOf(s) < 1) return 'No te quedan mentas.'
  const place = monPlace(s, uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return `${species(mon.speciesId).name} tiene que estar en el rancho o en la Caja.`
  return null
}

/** Gasta una menta y da al Pokémon otra naturaleza al azar, distinta de la que tenía; null si no se puede */
export function applyMint(s: GameState, uid: string, rng: Rng = Math.random): Nature | null {
  if (mintBlocker(s, uid)) return null
  const mon = findMon(s, uid)!
  const others = ALL_NATURES.filter((n) => n !== mon.nature)
  s.mints -= 1
  mon.nature = others[Math.floor(rng() * others.length)]
  return mon.nature
}
