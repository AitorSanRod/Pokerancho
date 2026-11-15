import { describe, expect, it } from 'vitest'
import { POKEMON } from '../../data/pokemon'
import { markSeen } from '../collection/dex'
import { initialState } from '../core/state'
import type { IncursionProgress } from './activeIncursion'
import { EventKind, type FighterView, type IncursionEvent } from './events'
import { Team } from './fighter'
import { defeatedFoes, discoverDefeatedFoes, newDiscoveries } from './foeDiscovery'
import { eventStartMs } from './incursionTimeline'
import type { LegResult } from './incursionLeg'

const fighter = (id: string, team: Team, speciesId: number): FighterView => ({
  id, team, speciesId, name: id, level: 10, hp: 10, maxHp: 10, out: false, boss: false,
})
const room = (...fighters: FighterView[]): IncursionEvent => ({ kind: EventKind.Room, text: '', room: 0, fighters })
const faint = (target: string): IncursionEvent => ({ kind: EventKind.Faint, text: '', target })
const leg = (...events: IncursionEvent[]) => ({ events }) as unknown as LegResult

const ALLY = fighter('yo', Team.Party, POKEMON.Snorlax)
// Primer tramo: cae un rival y un compañero; segundo: el mismo id es otro rival, que cae al final
const FIRST = leg(room(ALLY, fighter('r0', Team.Foe, POKEMON.Pidgey)), faint('r0'), faint('yo'))
const SECOND = leg(room(ALLY, fighter('r0', Team.Foe, POKEMON.Rattata)), faint('r0'))

/** Progreso en el segundo tramo a los `legMs` de empezar */
const progressAt = (legMs: number) => ({ record: { legs: [FIRST, SECOND] }, leg: 1, legMs }) as unknown as IncursionProgress
const lastFaintMs = eventStartMs(SECOND, SECOND.events.length - 1)

describe('rivales descubiertos en una incursión', () => {
  it('cuentan los rivales que han caído hasta lo que se ve, no los del grupo', () => {
    expect(defeatedFoes(progressAt(lastFaintMs - 1))).toEqual([POKEMON.Pidgey])
    expect(defeatedFoes(progressAt(lastFaintMs))).toEqual([POKEMON.Pidgey, POKEMON.Rattata])
  })

  it('los ya vistos no son nuevos; al descubrir se apuntan en la Pokédex', () => {
    const s = initialState()
    markSeen(s, POKEMON.Pidgey)
    const p = progressAt(lastFaintMs)
    expect(newDiscoveries(s, p)).toEqual([POKEMON.Rattata])
    discoverDefeatedFoes(s, p)
    expect(s.seen).toEqual([POKEMON.Pidgey, POKEMON.Rattata])
    expect(newDiscoveries(s, p)).toEqual([])
  })
})
