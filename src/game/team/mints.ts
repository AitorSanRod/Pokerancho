import { Nature, NEUTRAL_NATURE } from '../../data/natures'
import { species } from '../../data/species'
import type { Rng } from '../core/random'
import { findMon, MonPlace, monPlace, type GameState } from '../core/state'
import { spendMoney } from '../core/wallet'

// Mentas: se compran en la Tienda, se guardan en la Mochila y se gastan al usarlas en la ficha de un Pokémon. La
// aleatoria le da otra naturaleza al azar (nunca la que ya tenía); la neutra le pone la naturaleza neutra.

export const MintKind = { Random: 'random', Neutral: 'neutral' } as const
export type MintKind = (typeof MintKind)[keyof typeof MintKind]

/** ₽ que cuesta cada Menta aleatoria en la tienda (sin límite de compra) */
export const MINT_PRICE = 20_000
/** ₽ que cuesta cada Menta neutra en la tienda (sin límite de compra) */
export const NEUTRAL_MINT_PRICE = 10_000
export const MINT_PRICES: Record<MintKind, number> = { [MintKind.Random]: MINT_PRICE, [MintKind.Neutral]: NEUTRAL_MINT_PRICE }

const ALL_NATURES = Object.values(Nature)

/** Dónde se guarda en la partida cuántas hay de cada una */
const MINT_FIELD = { [MintKind.Random]: 'mints', [MintKind.Neutral]: 'neutralMints' } as const satisfies Record<MintKind, keyof GameState>

export const mintsOf = (s: GameState, kind: MintKind): number => s[MINT_FIELD[kind]]

/** Compra una menta de ese tipo; false si no hay ₽ */
export function buyMint(s: GameState, kind: MintKind): boolean {
  if (s.money < MINT_PRICES[kind]) return false
  spendMoney(s, MINT_PRICES[kind])
  s[MINT_FIELD[kind]] += 1
  return true
}

/** Por qué no se puede usar una menta de ese tipo en ese Pokémon (null si se puede) */
export function mintBlocker(s: GameState, uid: string, kind: MintKind): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  if (mintsOf(s, kind) < 1) return 'No te quedan mentas.'
  const place = monPlace(s, uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return `${species(mon.speciesId).name} tiene que estar en el rancho o en la Caja.`
  if (kind === MintKind.Neutral && mon.nature === NEUTRAL_NATURE) return 'Ya tiene una naturaleza neutra.'
  return null
}

/** Gasta una menta y da al Pokémon su nueva naturaleza (al azar y distinta de la que tenía, o la neutra); null si no se puede */
export function applyMint(s: GameState, uid: string, kind: MintKind, rng: Rng = Math.random): Nature | null {
  if (mintBlocker(s, uid, kind)) return null
  const mon = findMon(s, uid)!
  const others = ALL_NATURES.filter((n) => n !== mon.nature)
  s[MINT_FIELD[kind]] -= 1
  mon.nature = kind === MintKind.Neutral ? NEUTRAL_NATURE : others[Math.floor(rng() * others.length)]
  return mon.nature
}
