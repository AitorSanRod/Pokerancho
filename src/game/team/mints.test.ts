import { describe, expect, it } from 'vitest'
import { Nature } from '../../data/natures'
import { initialState, type GameState } from '../core/state'
import { seqRng } from '../core/test-utils'
import { applyMint, buyMint, MINT_PRICE, mintBlocker, mintsOf } from './mints'
import { ExpeditionFocus } from './expeditionFocus'
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
    s.money = MINT_PRICE
    expect(buyMint(s)).toBe(true)
    expect(s.money).toBe(0)
    expect(mintsOf(s)).toBe(1)
    expect(buyMint(s)).toBe(false)
    expect(mintsOf(s)).toBe(1)
  })

  it('se gasta y cambia la naturaleza a otra distinta', () => {
    const { s, uid } = withMon(Nature.Serious)
    s.mints = 2
    for (const roll of [0, 0.5, 0.999]) {
      s.owned[0].nature = Nature.Serious
      const nature = applyMint(s, uid, seqRng(roll))
      expect(nature).not.toBeNull()
      expect(nature).not.toBe(Nature.Serious)
      expect(s.owned[0].nature).toBe(nature)
      s.mints = 2
    }
    applyMint(s, uid)
    expect(mintsOf(s)).toBe(1)
  })

  it('no se usa sin mentas', () => {
    const { s, uid } = withMon()
    expect(mintBlocker(s, uid)).not.toBeNull()
    expect(applyMint(s, uid)).toBeNull()
    expect(s.owned[0].nature).toBe(Nature.Serious)
  })

  it('no se usa fuera del rancho ni en un Pokémon que no existe', () => {
    const { s, uid } = withMon()
    s.mints = 1
    expect(mintBlocker(s, 'nadie')).not.toBeNull()
    s.expeditions.push({ uid, routeId: 'ruta', durationMin: 1, focus: ExpeditionFocus.Exp, elapsedMin: 0 })
    expect(applyMint(s, uid)).toBeNull()
    expect(mintsOf(s)).toBe(1)
  })
})
