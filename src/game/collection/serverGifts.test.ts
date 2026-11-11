import { describe, expect, it } from 'vitest'
import { INCURSIONS, MAX_KEYS } from '../../data/incursions'
import { SPECIES } from '../../data/species'
import { initialState, ownedOfSpecies } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { keysOf } from '../incursion/keys'
import { createMon } from '../team/mons'
import { BOX_SLOTS } from '../team/ranches'
import { MAX_LEVEL, MAX_STARS } from '../team/stats'
import { DUPLICATE_MONEY } from '../trade/tradeReceive'
import { claimServerGift, parseServerGifts, pendingServerGifts, serverGiftBlocker, type ServerGift } from './serverGifts'

const ID = INCURSIONS[0].id
const [STARTER, GIFTED] = SPECIES.map((sp) => sp.id)
const gift: ServerGift = { id: 'regalo-1', title: 'Un regalo', incursionKeys: { [ID]: 1 }, mons: [] }
const monGift: ServerGift = { id: 'perdon-1', title: 'Te devolvemos tu Pokémon', incursionKeys: {}, mons: [{ speciesId: GIFTED, level: 13, exp: 0, stars: 2 }] }

describe('regalos del servidor', () => {
  it('se descarta lo que no tiene buena forma y las incursiones que no existen', () => {
    const parsed = parseServerGifts([gift, { id: 'MAL ID', title: 'x', incursionKeys: {} }, { ...gift, id: 'otro', incursionKeys: { quitada: 2, [ID]: -1 } }, 'basura'])
    expect(parsed).toEqual([gift, { id: 'otro', title: gift.title, incursionKeys: {}, mons: [] }])
    expect(parseServerGifts(null)).toEqual([])
  })

  it('los Pokémon de especies que no existen o con nivel o ★ fuera de rango se descartan o se arreglan', () => {
    const mons = [{ speciesId: -1, level: 5 }, { speciesId: GIFTED, level: MAX_LEVEL + 1 }, { speciesId: GIFTED, level: 7, stars: MAX_STARS + 1 }]
    const [parsed] = parseServerGifts([{ ...monGift, mons }])
    expect(parsed.mons).toEqual([{ speciesId: GIFTED, level: 7, exp: 0, stars: 0 }])
  })

  it('se recoge una sola vez y deja de estar pendiente', () => {
    const s = initialState()
    expect(pendingServerGifts(s, [gift])).toHaveLength(1)
    expect(claimServerGift(s, gift)).toBe(true)
    expect(keysOf(s, ID)).toBe(1)
    expect(claimServerGift(s, gift)).toBe(false)
    expect(keysOf(s, ID)).toBe(1)
    expect(pendingServerGifts(s, [gift])).toEqual([])
  })

  it('las llaves no pasan del máximo', () => {
    const s = initialState()
    s.incursionKeys[ID] = MAX_KEYS
    claimServerGift(s, gift)
    expect(keysOf(s, ID)).toBe(MAX_KEYS)
  })

  it('devuelve el Pokémon con su nivel y ★, y lo da por capturado', () => {
    const s = initialState()
    chooseStarter(s, STARTER)
    expect(claimServerGift(s, monGift)).toBe(true)
    expect(ownedOfSpecies(s, GIFTED)).toMatchObject({ level: 13, stars: 2 })
    expect(s.caught).toContain(GIFTED)
  })

  it('si ya se tiene la especie, se da lo mismo que por un repetido de un intercambio', () => {
    const s = initialState()
    chooseStarter(s, GIFTED)
    const money = s.money
    expect(claimServerGift(s, monGift)).toBe(true)
    expect(s.owned).toHaveLength(1)
    expect(s.money).toBe(money + DUPLICATE_MONEY)
  })

  it('sin sitio para el Pokémon no se recoge y se dice por qué', () => {
    const s = initialState()
    chooseStarter(s, STARTER)
    const fillers = SPECIES.filter((sp) => sp.id !== GIFTED && sp.id !== STARTER)
    for (let i = 0; i < BOX_SLOTS; i++) s.owned.push(createMon(fillers[i].id, 5, null))
    for (let i = BOX_SLOTS; !serverGiftBlocker(s, monGift) && i < fillers.length; i++) s.owned.push(createMon(fillers[i].id, 5, 0))
    expect(serverGiftBlocker(s, monGift)).not.toBeNull()
    expect(claimServerGift(s, monGift)).toBe(false)
    expect(pendingServerGifts(s, [monGift])).toHaveLength(1)
  })
})
