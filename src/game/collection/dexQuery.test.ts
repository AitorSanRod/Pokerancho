import { describe, expect, it } from 'vitest'
import { Rarity, SPECIES, species } from '../../data/species'
import { TYPE_INFO } from '../../data/types'
import { initialState } from '../core/state'
import { chooseStarter, speciesOfRarity } from '../core/test-utils'
import { createMon } from '../team/mons'
import { markSeen, toggleFavorite } from './dex'
import { applyDexQuery, DEFAULT_DEX_QUERY, DexFilter, DexSort, isDexQueryActive, ownedLevel, plainText, TYPES_BY_NAME, type DexQuery } from './dexQuery'
import { addPieces, canCombine, PIECES_PER_COMBINE } from './pieces'

const [A, B, C, D] = SPECIES.slice(0, 4)
const LIST = [A, B, C, D]
const ids = (q: Partial<DexQuery>, s = initialState()) => applyDexQuery(s, LIST, { ...DEFAULT_DEX_QUERY, ...q }).map((sp) => sp.id)

describe('consulta de la Pokédex', () => {
  it('sin consulta, enseña todo por número', () => {
    expect(ids({})).toEqual([A.id, B.id, C.id, D.id])
    expect(isDexQueryActive(DEFAULT_DEX_QUERY)).toBe(false)
  })

  it('busca por número, con o sin almohadilla y ceros', () => {
    expect(ids({ text: `#${String(C.id).padStart(3, '0')}` })).toContain(C.id)
    expect(isDexQueryActive({ ...DEFAULT_DEX_QUERY, text: '1' })).toBe(true)
  })

  it('busca por nombre solo entre las vistas, sin tildes ni mayúsculas', () => {
    const s = initialState()
    const text = plainText(B.name).toUpperCase()
    expect(ids({ text }, s)).not.toContain(B.id)
    markSeen(s, B.id)
    expect(ids({ text }, s)).toContain(B.id)
  })

  it('filtra los que tienes, los que faltan, con tickets, listos y favoritos', () => {
    const s = initialState()
    chooseStarter(s, A.id)
    addPieces(s, B.id, 1)
    addPieces(s, C.id, PIECES_PER_COMBINE)
    markSeen(s, D.id)
    toggleFavorite(s, D.id)
    expect(ids({ filter: DexFilter.Owned }, s)).toEqual([A.id])
    expect(ids({ filter: DexFilter.Missing }, s)).toEqual([B.id, C.id, D.id])
    expect(ids({ filter: DexFilter.Tickets }, s)).toEqual([B.id, C.id])
    expect(ids({ filter: DexFilter.Ready }, s)).toEqual(LIST.filter((sp) => canCombine(s, sp.id)).map((sp) => sp.id))
    expect(ids({ filter: DexFilter.Ready }, s)).not.toContain(B.id)
    expect(ids({ filter: DexFilter.Favorites }, s)).toEqual([D.id])
  })

  it('ordena por los que tienes y por más tickets, a igualdad por número', () => {
    const s = initialState()
    chooseStarter(s, C.id)
    addPieces(s, B.id, 1)
    addPieces(s, D.id, 3)
    expect(ids({ sort: DexSort.Owned }, s)).toEqual([C.id, A.id, B.id, D.id])
    expect(ids({ sort: DexSort.Tickets }, s)).toEqual([D.id, B.id, A.id, C.id])
  })

  it('ordena por rareza, de más rara a más común', () => {
    const rare = species(speciesOfRarity(Rarity.Legendary))
    const common = species(speciesOfRarity(Rarity.Common))
    const sorted = applyDexQuery(initialState(), [common, rare], { ...DEFAULT_DEX_QUERY, sort: DexSort.Rarity })
    expect(sorted.map((sp) => sp.id)).toEqual([rare.id, common.id])
  })

  it('ordena por nombre las vistas y deja al final las que no', () => {
    const s = initialState()
    for (const sp of [B, C, D]) markSeen(s, sp.id)
    const named = [B, C, D].sort((x, y) => x.name.localeCompare(y.name, 'es')).map((sp) => sp.id)
    expect(ids({ sort: DexSort.Name }, s)).toEqual([...named, A.id])
  })

  it('ordena por nivel solo los que tienes, de mayor a menor', () => {
    const s = initialState()
    s.owned.push(createMon(B.id, 7, null), createMon(C.id, 12, null), createMon(D.id, 3, null), createMon(B.id, 9, null))
    expect(ids({ sort: DexSort.Level }, s)).toEqual([C.id, B.id, D.id])
    expect(ownedLevel(s, B.id)).toBe(9)
    expect(ownedLevel(s, A.id)).toBe(0)
    expect(isDexQueryActive({ ...DEFAULT_DEX_QUERY, sort: DexSort.Level })).toBe(true)
  })

  it('los tipos van por orden alfabético de su nombre', () => {
    const names = TYPES_BY_NAME.map((type) => TYPE_INFO[type].name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')))
  })

  it('filtra por un tipo, solo entre las vistas', () => {
    const s = initialState()
    const sp = SPECIES.find((x) => x.types.length === 2)!
    const [, second] = sp.types
    const q = { filter: DexFilter.Type, type: second }
    expect(applyDexQuery(s, [sp], { ...DEFAULT_DEX_QUERY, ...q })).toEqual([])
    markSeen(s, sp.id)
    expect(applyDexQuery(s, [sp], { ...DEFAULT_DEX_QUERY, ...q })).toEqual([sp])
  })

  it('con todos los tipos, ordena por el que va antes en el alfabeto y deja al final las no vistas', () => {
    const s = initialState()
    const first = (sp: (typeof SPECIES)[number]) => Math.min(...sp.types.map((t) => TYPES_BY_NAME.indexOf(t)))
    const seen = SPECIES.slice(0, 30)
    const unseen = SPECIES[30]
    for (const sp of seen) markSeen(s, sp.id)
    const sorted = applyDexQuery(s, [unseen, ...seen], { ...DEFAULT_DEX_QUERY, filter: DexFilter.Type, type: null })
    const ranks = sorted.slice(0, -1).map(first)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(sorted.at(-1)).toBe(unseen)
  })
})
