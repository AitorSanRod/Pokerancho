import { describe, expect, it } from 'vitest'
import { IncursionPrizeKind, RoomKind } from '../../data/incursions'
import { POKEMON } from '../../data/pokemon'
import { EventKind } from './events'
import { battleRoom, HIT, member, NO_TAPS, testIncursion, weakFoe } from './incursion-test-utils'
import { LegOutcome, simulateLeg, type LegStart } from './incursionLeg'
import { INCURSION_REVIVES } from './revives'

const SEED = 7
const MONEY = 10
const start = (members = [member('a'), member('b')]): LegStart => ({ room: 0, members, revives: INCURSION_REVIVES })

/** Un rival que no se puede ganar: un jefe enorme de nivel muy alto con furia desde el primer turno */
const hopeless = battleRoom([
  { speciesId: POKEMON.Mewtwo, level: 100, moveId: HIT, hpMult: 50, boss: { enrage: { fromTurn: 1, every: 1, atk: 1 } } },
])

describe('tramo de incursión', () => {
  it('con la misma entrada y semilla sale siempre lo mismo', () => {
    const inc = testIncursion([battleRoom([weakFoe(), weakFoe()])])
    expect(simulateLeg(inc, start(), SEED, NO_TAPS)).toEqual(simulateLeg(inc, start(), SEED, NO_TAPS))
  })

  it('al superar las salas gana lo de cada una y, al final, el premio', () => {
    const prize = { kind: IncursionPrizeKind.Money, amount: 1000, chance: 1 } as const
    const inc = testIncursion([battleRoom([weakFoe()], MONEY), battleRoom([weakFoe()], MONEY)], [prize])
    const leg = simulateLeg(inc, start(), SEED, NO_TAPS)
    expect(leg.outcome).toBe(LegOutcome.Win)
    expect(leg.earned.money).toBe(2 * MONEY)
    expect(leg.prize?.money).toBe(prize.amount)
    expect(leg.events.filter((e) => e.kind === EventKind.Cleared)).toHaveLength(2)
  })

  it('una sala de reorganizar corta el tramo y el siguiente empieza tras ella', () => {
    const inc = testIncursion([battleRoom([weakFoe()]), { kind: RoomKind.Regroup, name: '' }, battleRoom([weakFoe()])])
    const leg = simulateLeg(inc, start(), SEED, NO_TAPS)
    expect(leg.outcome).toBe(LegOutcome.Regroup)
    expect(leg.next.room).toBe(2)
    expect(leg.prize).toBeNull()
  })

  it('si el grupo cae sin revivires, pierde y se queda con lo ganado antes', () => {
    const inc = testIncursion([battleRoom([weakFoe()], MONEY), hopeless])
    const leg = simulateLeg(inc, start(), SEED, NO_TAPS)
    expect(leg.outcome).toBe(LegOutcome.Lose)
    expect(leg.earned.money).toBe(MONEY)
    expect(leg.next.revives).toBe(0)
    expect(leg.next.members.every((m) => m.hpFraction === 0)).toBe(true)
  })

  it('antes de cada turno abre la ventana de toques y se para si aún no se sabe quién potenció su ataque', () => {
    const inc = testIncursion([battleRoom([weakFoe()])])
    const leg = simulateLeg(inc, start(), SEED, () => undefined)
    expect(leg.outcome).toBe(LegOutcome.Waiting)
    expect(leg.events.at(-1)?.kind).toBe(EventKind.TapWindow)
    expect(leg.turns).toEqual([])
  })

  it('sin Pokémon de jugadores en pie no hay ventanas de toques (los bots no tocan)', () => {
    const inc = testIncursion([battleRoom([weakFoe()])])
    const leg = simulateLeg(inc, start([member('bot-0'), member('bot-1')]), SEED, () => undefined)
    expect(leg.outcome).toBe(LegOutcome.Win)
    expect(leg.events.some((e) => e.kind === EventKind.TapWindow)).toBe(false)
  })

  it('la sala de curar recupera PS a los que siguen en pie', () => {
    const hurt = { ...member('a'), hpFraction: 0.2 }
    const inc = testIncursion([{ kind: RoomKind.Heal, name: '', heal: 0.5 }, { kind: RoomKind.Regroup, name: '' }])
    const leg = simulateLeg(inc, start([hurt]), SEED, NO_TAPS)
    expect(leg.next.members[0].hpFraction).toBeCloseTo(0.7, 1)
  })

  it('la sala de revivir levanta también a los que ya no volvían', () => {
    const gone = { ...member('a'), hpFraction: 0, out: true }
    const inc = testIncursion([{ kind: RoomKind.Revive, name: '', hp: 0.5 }, { kind: RoomKind.Regroup, name: '' }])
    const leg = simulateLeg(inc, start([gone, member('b')]), SEED, NO_TAPS)
    expect(leg.next.members[0].out).toBe(false)
    expect(leg.next.members[0].hpFraction).toBeCloseTo(0.5, 1)
  })
})
