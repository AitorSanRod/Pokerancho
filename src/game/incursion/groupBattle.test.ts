import { describe, expect, it } from 'vitest'
import { move } from '../../data/incursionMoves'
import { seqRng } from '../core/test-utils'
import { stat } from './fighter'
import { turnOrder } from './groupBattle'
import { ally, enemy, field } from './incursion-test-utils'

const QUICK = move('prueba-rapido', 'Rápido', 'normal', 40, [], { priority: 1 })
const PLAIN = move('prueba-normal', 'Normal', 'normal', 40)

describe('orden del turno', () => {
  it('sin prioridad, primero el más rápido', () => {
    const slow = Object.assign(ally('lento'), { move: PLAIN })
    const fast = Object.assign(enemy('rapido'), { move: PLAIN })
    slow.base.spe = 10
    fast.base.spe = 100
    const { bf } = field([slow], [fast])
    expect(turnOrder(bf, seqRng(0.5)).map((f) => f.id)).toEqual(['rapido', 'lento'])
  })

  it('un ataque con prioridad va antes aunque sea más lento', () => {
    const slow = Object.assign(ally('lento'), { move: QUICK })
    const fast = Object.assign(enemy('rapido'), { move: PLAIN })
    slow.base.spe = 10
    fast.base.spe = 100
    const { bf } = field([slow], [fast])
    expect(turnOrder(bf, seqRng(0.5)).map((f) => f.id)).toEqual(['lento', 'rapido'])
  })

  it('las etapas de Velocidad cuentan para el orden', () => {
    const a = Object.assign(ally('a'), { move: PLAIN })
    const b = Object.assign(enemy('b'), { move: PLAIN })
    a.base.spe = 60
    b.base.spe = 100
    a.stages.spe = 2
    const { bf } = field([a], [b])
    expect(stat(a, 'spe')).toBeGreaterThan(stat(b, 'spe'))
    expect(turnOrder(bf, seqRng(0.5))[0].id).toBe('a')
  })
})
