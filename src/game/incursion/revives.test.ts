import { describe, expect, it } from 'vitest'
import { hurt } from './battlefield'
import { EventKind } from './events'
import { ally, enemy, field } from './incursion-test-utils'
import { resolveFallen, REVIVE_HP } from './revives'

const knock = (bf: Parameters<typeof hurt>[0], f: Parameters<typeof hurt>[1]) => hurt(bf, f, f.hp, { kind: EventKind.Hit, text: '' })

describe('revivires del grupo', () => {
  it('los caídos vuelven en el orden en que cayeron mientras queden revivires', () => {
    const [a, b] = [ally('a'), ally('b')]
    const { bf, events } = field([a, b], [enemy('e')], 1)
    knock(bf, b)
    knock(bf, a)
    resolveFallen(bf)
    expect(b.hp).toBe(Math.round(b.maxHp * REVIVE_HP))
    expect(a.out).toBe(true)
    expect(bf.revives).toBe(0)
    expect(events.find((e) => e.kind === EventKind.Revive)?.revives).toBe(0)
  })

  it('sin revivires, el caído se queda fuera mirando', () => {
    const a = ally('a')
    const { bf, events } = field([a], [enemy('e')], 0)
    knock(bf, a)
    resolveFallen(bf)
    expect(a.out).toBe(true)
    expect(events.some((e) => e.kind === EventKind.Out)).toBe(true)
  })
})
