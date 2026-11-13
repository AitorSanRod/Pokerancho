import { Rarity, RARITY_INFO, SPECIES, rarityOf } from '../../data/species'
import type { StarItem } from '../../data/starItems'
import type { Rng } from '../core/random'
import type { GameState } from '../core/state'
import { addPieces } from './pieces'
import { rollStarItem } from './starItems'
import { spendMoney } from '../core/wallet'
import { MissionKind } from '../../data/dailyMissions'
import { advanceMission } from './missions'

/** Piezas que da cada tirada; cada una sortea su rareza y su especie por separado */
export const PIECES_PER_PULL = 5

/** Probabilidad (0-1) de que una tirada cambie una de sus piezas por dinero; como mucho una casilla por tirada */
export const MONEY_SLOT_CHANCE = 0.15

/** Premios de dinero de esa casilla: ₽ que da y peso relativo de que salga (los grandes, más raros) */
export const MONEY_PRIZES: readonly { amount: number; weight: number }[] = [
  { amount: 100, weight: 35 },
  { amount: 250, weight: 25 },
  { amount: 400, weight: 18 },
  { amount: 500, weight: 15 },
  { amount: 1000, weight: 7 },
]

export interface PieceDrop {
  speciesId: number
  rarity: Rarity
}

const POOLS = Object.fromEntries(
  (Object.keys(RARITY_INFO) as Rarity[]).map((r) => [r, SPECIES.filter((s) => rarityOf(s) === r)]),
) as Record<Rarity, typeof SPECIES>

type SpeciesEntry = (typeof SPECIES)[number]

/** Rareza al azar con las probabilidades del gacha, entre las de `allowed` (de la más alta a la más baja) */
function rollRarity(rng: Rng, allowed: Rarity[]): Rarity {
  let roll = rng() * allowed.reduce((sum, r) => sum + RARITY_INFO[r].rate, 0)
  for (const r of allowed) {
    roll -= RARITY_INFO[r].rate
    if (roll < 0) return r
  }
  return allowed[allowed.length - 1]
}

const BY_RARITY_DESC: Rarity[] = [Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Common]

/**
 * Una especie al azar por rareza, con las probabilidades del gacha. Con `keep`, solo entre las que lo cumplen: las
 * rarezas que se quedan sin ninguna no salen y las demás se reparten su probabilidad
 */
export function rollPiece(rng: Rng, keep: (sp: SpeciesEntry) => boolean = () => true): PieceDrop {
  const pools = BY_RARITY_DESC.map((r) => [r, POOLS[r].filter(keep)] as const).filter(([, pool]) => pool.length > 0)
  const rarity = rollRarity(rng, pools.map(([r]) => r))
  const pool = pools.find(([r]) => r === rarity)![1]
  return { speciesId: pool[Math.floor(rng() * pool.length)].id, rarity }
}

function rollMoney(rng: Rng): number {
  let roll = rng() * MONEY_PRIZES.reduce((sum, p) => sum + p.weight, 0)
  for (const p of MONEY_PRIZES) {
    roll -= p.weight
    if (roll < 0) return p.amount
  }
  return MONEY_PRIZES[MONEY_PRIZES.length - 1].amount
}

export interface PullResult {
  pieces: PieceDrop[]
  /** ₽ de cada casilla de dinero que salió (como mucho una por tirada) */
  money: number[]
  /** Objetos estelares que salieron (como mucho uno por tirada, en otra casilla) */
  starItems: StarItem[]
}

/** Gasta hasta `count` tickets (los que haya) y devuelve las piezas, el dinero y los objetos estelares obtenidos */
export function pull(s: GameState, count = 1, rng: Rng = Math.random): PullResult {
  const result: PullResult = { pieces: [], money: [], starItems: [] }
  for (; count > 0 && s.tickets > 0; count--) {
    s.tickets--
    advanceMission(s, MissionKind.PullGacha)
    const hasMoney = rng() < MONEY_SLOT_CHANCE
    if (hasMoney) result.money.push(rollMoney(rng))
    const item = rollStarItem(s, rng)
    if (item) result.starItems.push(item)
    const prizeSlots = (hasMoney ? 1 : 0) + (item ? 1 : 0)
    for (let i = prizeSlots; i < PIECES_PER_PULL; i++) result.pieces.push(rollPiece(rng))
  }
  for (const d of result.pieces) addPieces(s, d.speciesId, 1)
  for (const amount of result.money) s.money += amount
  return result
}

/** ₽ que cuesta cada ticket de gacha */
export const TICKET_PRICE = 1000

/** Cuántos tickets de gacha se pueden comprar ahora con el dinero que hay */
export const maxTicketsToBuy = (s: GameState): number => Math.floor(s.money / TICKET_PRICE)

/** Compra `count` tickets de gacha de una vez; si no llega el dinero para todos, no compra ninguno */
export function buyTicket(s: GameState, count = 1): boolean {
  if (count < 1 || count > maxTicketsToBuy(s)) return false
  spendMoney(s, count * TICKET_PRICE)
  s.tickets += count
  return true
}
