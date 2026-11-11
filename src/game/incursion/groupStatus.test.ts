import { describe, expect, it } from 'vitest'
import { seededRng, type Rng } from '../core/random'
import { STATUS_INFO, StatusId } from '../../data/passives'
import { EventKind } from './events'
import type { GroupFighter } from './fighter'
import { BOSS_MAX_STATUSES, BOSS_STATUS_DAMAGE_CAP, CONFUSION_SELF_HIT, endOfTurn, FREEZE_MAX_TURNS, hasStatus, inflict, loseTurn, SLEEP_WAKE_CHANCES, STATUS_MAX_TURNS } from './groupStatus'
import { ally, enemy, field } from './incursion-test-utils'
import { leaveRoom } from './restRooms'
import { inflictTarget } from './targeting'

/** Un estado que no quita PS ni hace perder el turno por sí solo al final del turno */
const STATUS = StatusId.Paralysis
/** Estados distintos, tantos como le caben a un jefe y uno más */
const MANY = Object.values(StatusId).slice(0, BOSS_MAX_STATUSES + 1)

/** Los estados que quitan PS al final del turno */
const damageOf = (s: StatusId) => STATUS_INFO[s].damagePerTurn ?? 0
const DAMAGING = Object.values(StatusId).filter((s) => damageOf(s) > 0)

const boss = (id = 'j'): GroupFighter => enemy(id, { boss: {} })
const statusesOf = (f: GroupFighter) => f.statuses.map((a) => a.status)

describe('estados alterados en incursiones', () => {
  it('duran como mucho STATUS_MAX_TURNS turnos y luego se le pasan', () => {
    const a = ally('a')
    const { bf, events } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(hasStatus(a, STATUS)).toBe(true)
    endOfTurn(bf)
    expect(a.statuses).toEqual([])
    expect(events.some((e) => e.kind === EventKind.Recover && e.target === a.id)).toBe(true)
  })

  it('volver a ponerle el mismo estado lo renueva; otro distinto no entra', () => {
    const a = ally('a')
    const { bf } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(inflict(bf, a, STATUS)).toBe(true)
    expect(a.statuses[0].turns).toBe(STATUS_MAX_TURNS)
    expect(inflict(bf, a, StatusId.Burn)).toBe(false)
    expect(statusesOf(a)).toEqual([STATUS])
  })

  it('un jefe lleva hasta BOSS_MAX_STATUSES estados distintos a la vez', () => {
    const j = boss()
    const { bf } = field([ally('a')], [j])
    const accepted = MANY.map((s) => inflict(bf, j, s))
    expect(accepted).toEqual(MANY.map((_, i) => i < BOSS_MAX_STATUSES))
    expect(statusesOf(j)).toEqual(MANY.slice(0, BOSS_MAX_STATUSES))
    expect(inflict(bf, j, MANY[0])).toBe(true)
    expect(j.statuses).toHaveLength(BOSS_MAX_STATUSES)
  })

  it('cada estado del jefe se le pasa a su tiempo', () => {
    const j = boss()
    const { bf } = field([ally('a')], [j])
    inflict(bf, j, STATUS)
    endOfTurn(bf)
    inflict(bf, j, StatusId.Confusion)
    for (let i = 1; i < STATUS_MAX_TURNS; i++) endOfTurn(bf)
    expect(statusesOf(j)).toEqual([StatusId.Confusion])
  })

  it('a un jefe, cada estado que hace daño le quita como mucho BOSS_STATUS_DAMAGE_CAP de sus PS', () => {
    const j = boss()
    const { bf, events } = field([ally('a')], [j])
    DAMAGING.forEach((s) => inflict(bf, j, s))
    endOfTurn(bf)
    const hits = events.filter((e) => e.kind === EventKind.Hit && e.target === j.id)
    expect(hits).toHaveLength(DAMAGING.length)
    for (const e of hits) expect(e.amount).toBeLessThanOrEqual(Math.floor(j.maxHp * BOSS_STATUS_DAMAGE_CAP))
  })

  it('a un jefe confuso, golpearse le quita lo de siempre (sin tope)', () => {
    const j = boss()
    const { bf } = field([ally('a')], [j])
    inflict(bf, j, StatusId.Confusion)
    const before = j.hp
    expect(loseTurn(bf, j, () => 0)).toBe(true)
    expect(before - j.hp).toBe(Math.max(1, Math.floor(j.maxHp * CONFUSION_SELF_HIT)))
  })

  it('a los demás, el daño de estado no lleva tope', () => {
    const e = enemy('e')
    const { bf, events } = field([ally('a')], [e])
    const [worst] = [...DAMAGING].sort((x, y) => damageOf(y) - damageOf(x))
    inflict(bf, e, worst)
    endOfTurn(bf)
    const hit = events.find((ev) => ev.kind === EventKind.Hit && ev.target === e.id)
    expect(hit?.amount).toBe(Math.max(1, Math.floor(e.maxHp * damageOf(worst))))
  })

  it('los estados se siguen dirigiendo a un jefe que ya tiene uno', () => {
    const a = ally('a')
    const j = boss()
    const { bf } = field([a], [j])
    inflict(bf, j, STATUS)
    expect(inflictTarget(bf, a, () => 0)).toBe(j)
  })

  it('al acabar la sala se quitan', () => {
    const a = ally('a')
    const { bf } = field([a], [enemy('e')])
    inflict(bf, a, STATUS)
    leaveRoom(bf)
    expect(a.statuses).toEqual([])
  })
})

/** Turnos seguidos que pierde dormido o congelado hasta librarse (y actuar), con ese azar */
function heldFor(status: StatusId, rng: Rng): number {
  const a = ally('a')
  const { bf } = field([a], [enemy('e')])
  inflict(bf, a, status)
  let lost = 0
  while (loseTurn(bf, a, rng)) lost++
  expect(hasStatus(a, status)).toBe(false)
  return lost
}

/** Justo por encima de una probabilidad: no se cumple */
const above = (chance: number) => () => chance + (1 - chance) / 2

describe('sueño y congelación en incursiones', () => {
  it('dormido, el primer turno nunca se despierta; el siguiente, con la suerte justa, se despierta y ataca', () => {
    expect(heldFor(StatusId.Sleep, () => 0)).toBe(1)
  })

  it('dormido, sin suerte, pierde un turno por cada probabilidad de SLEEP_WAKE_CHANCES y luego se despierta seguro', () => {
    expect(heldFor(StatusId.Sleep, () => 0.999)).toBe(SLEEP_WAKE_CHANCES.length)
  })

  it('cada turno dormido se despierta con su probabilidad de SLEEP_WAKE_CHANCES', () => {
    SLEEP_WAKE_CHANCES.forEach((chance, turn) => {
      if (chance === 0) return
      const misses = Array.from({ length: turn }, (_, i) => above(SLEEP_WAKE_CHANCES[i])())
      const rolls = [...misses, chance / 2]
      expect(heldFor(StatusId.Sleep, () => rolls.shift() ?? 0)).toBe(turn)
    })
  })

  it('congelado, pierde de 1 a FREEZE_MAX_TURNS turnos, todos igual de probables', () => {
    const TRIALS = 3000
    const rng = seededRng(7)
    const counts = new Map<number, number>()
    for (let i = 0; i < TRIALS; i++) {
      const lost = heldFor(StatusId.Freeze, rng)
      counts.set(lost, (counts.get(lost) ?? 0) + 1)
    }
    expect([...counts.keys()].sort()).toEqual(Array.from({ length: FREEZE_MAX_TURNS }, (_, i) => i + 1))
    for (const n of counts.values()) expect(Math.abs(n / TRIALS - 1 / FREEZE_MAX_TURNS)).toBeLessThan(0.05)
  })

  it('al librarse lo avisa, y la escena puede quitar el estado', () => {
    const a = ally('a')
    const { bf, events } = field([a], [enemy('e')])
    inflict(bf, a, StatusId.Sleep)
    while (loseTurn(bf, a, () => 0.999));
    expect(events.at(-1)).toMatchObject({ kind: EventKind.Recover, status: StatusId.Sleep, target: a.id })
  })
})
