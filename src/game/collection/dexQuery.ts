import { Rarity, rarityOf, type SPECIES } from '../../data/species'
import { ownedOfSpecies, type GameState } from '../core/state'
import { isFavorite, isSeen } from './dex'
import { canCombine, piecesOf } from './pieces'

type DexSpecies = (typeof SPECIES)[number]

/** Orden de las casillas dentro de cada Pokédex */
export const DexSort = { Number: 'number', Owned: 'owned', Tickets: 'tickets', Rarity: 'rarity', Name: 'name' } as const
export type DexSort = (typeof DexSort)[keyof typeof DexSort]

/** Qué casillas se enseñan */
export const DexFilter = {
  All: 'all',
  Owned: 'owned',
  Missing: 'missing',
  Tickets: 'tickets',
  Ready: 'ready',
  Favorites: 'favorites',
} as const
export type DexFilter = (typeof DexFilter)[keyof typeof DexFilter]

export interface DexQuery {
  /** Nombre (solo de las vistas, para no destripar las demás) o número */
  text: string
  sort: DexSort
  filter: DexFilter
}

export const DEFAULT_DEX_QUERY: DexQuery = { text: '', sort: DexSort.Number, filter: DexFilter.All }

/** Sin mayúsculas ni tildes, para comparar lo escrito con un nombre */
export const plainText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** Si la consulta deja fuera alguna casilla o cambia el orden (la Pokédex entonces abre todo lo que encuentra) */
export const isDexQueryActive = (q: DexQuery): boolean => plainText(q.text) !== '' || q.filter !== DexFilter.All

const isOwned = (s: GameState, id: number): boolean => ownedOfSpecies(s, id) !== undefined

const FILTER_TEST: Record<DexFilter, (s: GameState, id: number) => boolean> = {
  [DexFilter.All]: () => true,
  [DexFilter.Owned]: isOwned,
  [DexFilter.Missing]: (s, id) => !isOwned(s, id),
  [DexFilter.Tickets]: (s, id) => piecesOf(s, id) > 0,
  [DexFilter.Ready]: canCombine,
  [DexFilter.Favorites]: isFavorite,
}

function matchesText(s: GameState, sp: DexSpecies, text: string): boolean {
  const query = plainText(text).replace(/^#/, '')
  if (!query) return true
  if (/^\d+$/.test(query)) return String(sp.id).includes(String(Number(query)))
  return isSeen(s, sp.id) && plainText(sp.name).includes(query)
}

const RARITY_RANK: Record<Rarity, number> = Object.fromEntries(Object.values(Rarity).map((r, i) => [r, i])) as Record<Rarity, number>

/** Cuánto «pesa» cada especie en cada orden: de mayor a menor; a igualdad, por número */
const SORT_KEY: Record<Exclude<DexSort, typeof DexSort.Number | typeof DexSort.Name>, (s: GameState, sp: DexSpecies) => number> = {
  [DexSort.Owned]: (s, sp) => (isOwned(s, sp.id) ? 1 : 0),
  [DexSort.Tickets]: (s, sp) => piecesOf(s, sp.id),
  [DexSort.Rarity]: (_, sp) => RARITY_RANK[rarityOf(sp)],
}

function sortDex(s: GameState, list: DexSpecies[], sort: DexSort): DexSpecies[] {
  const byNumber = (a: DexSpecies, b: DexSpecies) => a.id - b.id
  if (sort === DexSort.Number) return [...list].sort(byNumber)
  // Las no vistas no tienen nombre: al final, por número
  if (sort === DexSort.Name) {
    const name = (sp: DexSpecies) => (isSeen(s, sp.id) ? sp.name : null)
    return [...list].sort((a, b) => {
      const [na, nb] = [name(a), name(b)]
      if (na === null || nb === null) return na === nb ? byNumber(a, b) : na === null ? 1 : -1
      return na.localeCompare(nb, 'es')
    })
  }
  const key = SORT_KEY[sort]
  return [...list].sort((a, b) => key(s, b) - key(s, a) || byNumber(a, b))
}

/** Las casillas de una Pokédex que cumplen la consulta, ya ordenadas */
export function applyDexQuery(s: GameState, list: DexSpecies[], q: DexQuery): DexSpecies[] {
  const test = FILTER_TEST[q.filter]
  return sortDex(
    s,
    list.filter((sp) => test(s, sp.id) && matchesText(s, sp, q.text)),
    q.sort,
  )
}
