import { describe, expect, it } from 'vitest'
import { Nature, NEUTRAL_NATURE } from '../../data/natures'
import { initialState, type GameState } from '../core/state'
import { RouteId } from '../../data/maps'
import { seqRng, testExpedition } from '../core/test-utils'
import { applyMint, buyMint, MINT_PRICES, mintBlocker, MintKind, mintsOf } from './mints'
import { createMon } from './mons'

function withMon(nature: Nature = Nature.Serious): { s: GameState; uid: string } {
  const s = initialState()
  const mon = createMon(1, 10, 0, nature)
  s.owned.push(mon)
  s.activeUid = mon.uid
  return { s, uid: mon.uid }
}

describe('Menta aleatoria', () => {
  it('se compra por su precio y se guarda', () => {
    const s = initialState()
    s.money = MINT_PRICES[MintKind.Random]
    expect(buyMint(s, MintKind.Random)).toBe(true)
    expect(s.money).toBe(0)
    expect(mintsOf(s, MintKind.Random)).toBe(1)
    expect(buyMint(s, MintKind.Random)).toBe(false)
    expect(mintsOf(s, MintKind.Random)).toBe(1)
  })

  it('se gasta y cambia la naturaleza a otra distinta', () => {
    const { s, uid } = withMon(Nature.Serious)
    s.mints = 2
    for (const roll of [0, 0.5, 0.999]) {
      s.owned[0].nature = Nature.Serious
      const nature = applyMint(s, uid, MintKind.Random, seqRng(roll))
      expect(nature).not.toBeNull()
      expect(nature).not.toBe(Nature.Serious)
      expect(s.owned[0].nature).toBe(nature)
      s.mints = 2
    }
    applyMint(s, uid, MintKind.Random)
    expect(mintsOf(s, MintKind.Random)).toBe(1)
  })

  it('no se usa sin mentas', () => {
    const { s, uid } = withMon()
    expect(mintBlocker(s, uid, MintKind.Random)).not.toBeNull()
    expect(applyMint(s, uid, MintKind.Random)).toBeNull()
    expect(s.owned[0].nature).toBe(Nature.Serious)
  })

  it('no se usa fuera del rancho ni en un Pokémon que no existe', () => {
    const { s, uid } = withMon()
    s.mints = 1
    expect(mintBlocker(s, 'nadie', MintKind.Random)).not.toBeNull()
    s.expeditions.push(testExpedition(uid, RouteId.PuebloPaleta, { durationMin: 1, elapsedMin: 0 }))
    expect(applyMint(s, uid, MintKind.Random)).toBeNull()
    expect(mintsOf(s, MintKind.Random)).toBe(1)
  })
})

describe('Menta neutra', () => {
  it('se compra por su precio, aparte de la aleatoria', () => {
    const s = initialState()
    s.money = MINT_PRICES[MintKind.Neutral]
    expect(buyMint(s, MintKind.Neutral)).toBe(true)
    expect(s.money).toBe(0)
    expect(mintsOf(s, MintKind.Neutral)).toBe(1)
    expect(mintsOf(s, MintKind.Random)).toBe(0)
  })

  it('pone la naturaleza neutra y se gasta', () => {
    const { s, uid } = withMon(Nature.Bold)
    s.neutralMints = 1
    expect(applyMint(s, uid, MintKind.Neutral)).toBe(NEUTRAL_NATURE)
    expect(s.owned[0].nature).toBe(NEUTRAL_NATURE)
    expect(mintsOf(s, MintKind.Neutral)).toBe(0)
  })

  it('no se usa en un Pokémon que ya es neutro (y no se gasta)', () => {
    const { s, uid } = withMon(NEUTRAL_NATURE)
    s.neutralMints = 1
    expect(mintBlocker(s, uid, MintKind.Neutral)).not.toBeNull()
    expect(applyMint(s, uid, MintKind.Neutral)).toBeNull()
    expect(mintsOf(s, MintKind.Neutral)).toBe(1)
  })

  it('no se usa fuera del rancho', () => {
    const { s, uid } = withMon(Nature.Bold)
    s.neutralMints = 1
    s.expeditions.push(testExpedition(uid, RouteId.PuebloPaleta, { durationMin: 1, elapsedMin: 0 }))
    expect(applyMint(s, uid, MintKind.Neutral)).toBeNull()
    expect(s.owned[0].nature).toBe(Nature.Bold)
  })
})
