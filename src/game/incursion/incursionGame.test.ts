import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IncursionId } from '../../data/incursions'
import { POKEMON } from '../../data/pokemon'
import { boostedMoney } from '../battle/rewards'
import { seqRng } from '../core/test-utils'
import { initialState, MonPlace, monPlace, type GameState } from '../core/state'
import { createMon } from '../team/mons'
import { incursionProgress, IncursionPhase, recordOf, REGROUP_MS } from './activeIncursion'
import { advanceIncursion, scoreIncursionTap, chooseIncursionMove, collectIncursion, continueIncursion, incursionBlocker, retreatIncursion, startIncursion } from './incursionGame'
import { LegOutcome } from './incursionLeg'
import { defeatedFoes, newDiscoveries } from './foeDiscovery'
import { eventStartMs, legDuration } from './incursionTimeline'
import { PARTY_SIZE } from './party'
import { noTurnOrders, TAP_WINDOW_MS } from './tapWindow'
import { repertoire } from './repertoire'
import { STAR_ITEM_IDS } from '../../data/starItems'
import { starItemsOf } from '../collection/starItems'
import { TEST_INCURSION } from './incursion-test-mock'
import { noEarnings } from './incursionRewards'

vi.mock('../../data/incursions', () => import('./incursion-test-mock'))

const ID = IncursionId.Prueba
const LEVEL = 20
const NOW = 1_000_000
let s: GameState
let uid: string
let move: string

beforeEach(() => {
  s = initialState()
  const mon = createMon(POKEMON.Snorlax, LEVEL, 0)
  s.owned.push(mon)
  s.activeUid = mon.uid
  uid = mon.uid
  move = repertoire(mon.speciesId, LEVEL)[0].id
  s.incursionKeys[ID] = 1
})

const start = () => startIncursion(s, ID, uid, move, NOW, seqRng(0.5))
/** Deja pasar sin tocar las ventanas de toques del tramo y dice cuándo acaba */
function endOfLeg(leg: number): number {
  for (;;) {
    const a = s.incursion!
    const played = recordOf(a).legs[leg]
    const end = a.legStarts[leg] + legDuration(played)
    if (played.outcome !== LegOutcome.Waiting) return end
    advanceIncursion(s, end)
  }
}

/** Hora a la que empieza la ventana de toques en la que está parado el tramo */
function openWindowAt(leg: number): number {
  const played = recordOf(s.incursion!).legs[leg]
  return s.incursion!.legStarts[leg] + eventStartMs(played, played.events.length - 1)
}

describe('entrar en una incursión', () => {
  it('hace falta una llave, el nivel justo y un movimiento que conozca', () => {
    expect(incursionBlocker(s, ID, uid, move)).toBeNull()
    expect(incursionBlocker(s, ID, uid, 'no-existe')).not.toBeNull()
    s.owned[0].level = 5
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
    s.owned[0].level = 90
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
    s.owned[0].level = LEVEL
    s.incursionKeys[ID] = 0
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
  })

  it('gasta la llave, completa el grupo con bots y el Pokémon sale del rancho', () => {
    start()
    expect(s.incursionKeys[ID]).toBe(0)
    expect(s.incursion!.members).toHaveLength(PARTY_SIZE)
    expect(monPlace(s, uid)).toBe(MonPlace.Incursion)
    expect(incursionBlocker(s, ID, uid, move)).not.toBeNull()
  })
})

describe('incursión en curso', () => {
  it('tras el primer tramo llega la sala de reorganizar y, al acabar su plazo, sigue sola', () => {
    start()
    expect(incursionProgress(s.incursion!, NOW).phase).toBe(IncursionPhase.Playing)
    const end = endOfLeg(0)
    expect(incursionProgress(s.incursion!, end).phase).toBe(IncursionPhase.Regroup)
    advanceIncursion(s, end + REGROUP_MS)
    expect(s.incursion!.legStarts).toEqual([NOW, end + REGROUP_MS])
  })

  it('al reorganizar puede cambiar de movimiento y seguir sin esperar', () => {
    start()
    const other = repertoire(POKEMON.Snorlax, LEVEL)[1].id
    const end = endOfLeg(0)
    chooseIncursionMove(s, other, end)
    continueIncursion(s, end + 1)
    expect(s.incursion!.orders[1].moves[uid]).toBe(other)
    expect(s.incursion!.legStarts[1]).toBe(end + 1)
  })

  it('al terminarla cobra lo ganado y el Pokémon vuelve al rancho', () => {
    start()
    continueIncursion(s, endOfLeg(0))
    const finish = endOfLeg(1)
    const { earned } = recordOf(s.incursion!)
    const money = s.money
    expect(collectIncursion(s, finish - 1)).toBeNull()
    expect(collectIncursion(s, finish)).toEqual(earned)
    expect(s.money).toBe(money + boostedMoney(earned.money))
    expect(starItemsOf(s, STAR_ITEM_IDS[0])).toBe(earned.starItems[STAR_ITEM_IDS[0]])
    expect(s.incursion).toBeNull()
    expect(monPlace(s, uid)).toBe(MonPlace.Ranch)
  })

  it('una gratuita entra sin llave y solo paga la primera vez', () => {
    TEST_INCURSION.free = true
    try {
      s.incursionKeys[ID] = 0
      const play = () => {
        start()
        continueIncursion(s, endOfLeg(0))
        return collectIncursion(s, endOfLeg(1))
      }
      const first = play()!
      expect(first.money).toBeGreaterThan(0)
      const money = s.money
      expect(play()).toEqual(noEarnings())
      expect(s.money).toBe(money)
    } finally {
      delete TEST_INCURSION.free
    }
  })

  it('al recoger se descubren los rivales derrotados, pero no las especies de las piezas', () => {
    start()
    continueIncursion(s, endOfLeg(0))
    const end = endOfLeg(1)
    const p = incursionProgress(s.incursion!, end)
    const defeated = defeatedFoes(p)
    const seen = [...s.seen, ...newDiscoveries(s, p)]
    expect(defeated.length).toBeGreaterThan(0)
    collectIncursion(s, end)
    expect(s.seen).toEqual(seen)
    expect(s.seen).toEqual(expect.arrayContaining(defeated))
  })

  it('antes de cada turno se para en la ventana de toques; si no llega a los toques, se cierra sin potenciar', () => {
    start()
    const played = recordOf(s.incursion!).legs[0]
    expect(played.outcome).toBe(LegOutcome.Waiting)
    const opens = openWindowAt(0)
    expect(incursionProgress(s.incursion!, opens + 1).phase).toBe(IncursionPhase.Tap)
    advanceIncursion(s, opens + TAP_WINDOW_MS)
    expect(s.incursion!.orders[0].turns[0]).toEqual(noTurnOrders())
  })

  it('lo conseguido en la ventana abierta va a sus órdenes: a medias, al cerrarse; entero o acabado el reto, ya', () => {
    start()
    const opens = openWindowAt(0)
    scoreIncursionTap(s, 1, true, opens - 1)
    expect(s.incursion!.orders[0].turns).toEqual([])
    scoreIncursionTap(s, 0.4, false, opens + 1)
    scoreIncursionTap(s, 0.2, false, opens + 2)
    expect(s.incursion!.orders[0].turns).toEqual([])
    advanceIncursion(s, opens + TAP_WINDOW_MS)
    expect(s.incursion!.orders[0].turns[0].taps).toEqual({ [uid]: 0.4 })
    expect(s.incursion!.pendingTap).toBe(0)
  })

  it('con el reto acabado, la ventana se cierra ya aunque no sea entero', () => {
    start()
    const opens = openWindowAt(0)
    scoreIncursionTap(s, 0.5, true, opens + 1)
    expect(s.incursion!.orders[0].turns[0].taps).toEqual({ [uid]: 0.5 })
  })

  it('al retirarse se termina en ese momento, con lo ganado hasta entonces', () => {
    start()
    retreatIncursion(s, NOW)
    expect(incursionProgress(s.incursion!, NOW).phase).toBe(IncursionPhase.Finished)
    const money = s.money
    collectIncursion(s, NOW)
    expect(s.money).toBe(money)
  })
})
