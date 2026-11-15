import { describe, expect, it } from 'vitest'
import { EventKind } from './events'
import { ally, enemy, field, member } from './incursion-test-utils'
import { applyJoins } from './joins'
import { botId } from './party'

describe('entrar en plena pelea', () => {
  it('ocupa el sitio del último bot y lo anuncia', () => {
    const party = [ally('p1'), ally(botId(0)), ally(botId(1))]
    const roster = party.map((f) => member(f.id))
    const { bf, events } = field(party, [enemy('foe')])
    applyJoins(bf, roster, [member('nuevo')])
    expect(bf.party.map((f) => f.id)).toEqual(['p1', botId(0), 'nuevo'])
    expect(roster.map((m) => m.id)).toEqual(['p1', botId(0), 'nuevo'])
    expect(events.find((e) => e.kind === EventKind.Join)).toMatchObject({ actor: botId(1), target: 'nuevo' })
  })

  it('sin bots, o si ya está en el grupo, no entra', () => {
    const party = [ally('p1'), ally('p2')]
    const { bf, events } = field(party, [enemy('foe')])
    applyJoins(bf, party.map((f) => member(f.id)), [member('nuevo'), member('p1')])
    expect(bf.party.map((f) => f.id)).toEqual(['p1', 'p2'])
    expect(events.some((e) => e.kind === EventKind.Join)).toBe(false)
  })
})
