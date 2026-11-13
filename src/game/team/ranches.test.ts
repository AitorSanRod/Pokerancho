import { describe, expect, it } from 'vitest'
import { RouteId } from '../../data/maps'
import { Rarity, rarityOf, SPECIES } from '../../data/species'
import { initialState, MonPlace, monPlace } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { startRun } from '../run/run'
import { createMon, NEW_MON_LEVEL } from './mons'
import { ExpeditionFocus } from './expeditionFocus'
import { BOX_SLOTS, boxedMons, fitsInRanch, moveBlocker, moveMon, placeMon, RANCH_SLOTS, ranchCapacity, ranchCount, ranchWithRoom, rehomeOverflow, usedSlots } from './ranches'

const [ONE_SLOT, LEGENDARY] = [SPECIES[0].id, SPECIES.find((sp) => rarityOf(sp) === Rarity.Legendary)!.id]

/** Partida con un activo y `extra` Pokémon más en el primer rancho */
function stateWithTeam(extra = 1) {
  const s = initialState()
  chooseStarter(s, ONE_SLOT)
  for (let i = 0; i < extra; i++) s.owned.push(createMon(ONE_SLOT, NEW_MON_LEVEL))
  return s
}

const fillRanch = (s: ReturnType<typeof initialState>, ranch = 0) => {
  while (usedSlots(s, ranch) < RANCH_SLOTS) s.owned.push(createMon(ONE_SLOT, NEW_MON_LEVEL, ranch))
}

describe('espacios del rancho', () => {
  it('cada Pokémon ocupa un espacio, sea cual sea su rareza', () => {
    const s = stateWithTeam(0)
    s.owned.push(createMon(LEGENDARY, NEW_MON_LEVEL))
    expect(usedSlots(s, 0)).toBe(2)
  })

  it('los que están fuera siguen ocupando su espacio', () => {
    const s = stateWithTeam()
    const before = usedSlots(s, 0)
    startRun(s, RouteId.PuebloPaleta)
    s.expeditions.push({ uid: s.owned[1].uid, routeId: RouteId.PuebloPaleta, durationMin: 15, focus: ExpeditionFocus.Exp, elapsedMin: 0 })
    expect(usedSlots(s, 0)).toBe(before)
  })

  it('un rancho lleno no admite más; se usa el siguiente si se ha comprado', () => {
    const s = stateWithTeam(0)
    fillRanch(s)
    expect(fitsInRanch(s, 0)).toBe(false)
    expect(ranchWithRoom(s)).toBeNull()
    s.upgrades.ranches = 1
    expect(ranchCount(s)).toBe(2)
    expect(ranchWithRoom(s)).toBe(1)
  })
})

describe('moveMon', () => {
  it('a la Caja: queda guardado y no cuenta en el rancho', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    expect(moveMon(s, mon.uid, null)).toBe(true)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Box)
    expect(boxedMons(s)).toEqual([mon])
    expect(usedSlots(s, 0)).toBe(1)
  })

  it(`la Caja admite ${BOX_SLOTS} Pokémon, ocupen lo que ocupen en el rancho`, () => {
    const s = stateWithTeam(BOX_SLOTS + 1)
    for (const m of s.owned.slice(1, BOX_SLOTS + 1)) expect(moveMon(s, m.uid, null)).toBe(true)
    expect(moveBlocker(s, s.owned[BOX_SLOTS + 1].uid, null)).toMatch(/llena/)
  })

  it('si se guarda el activo, pasa a serlo otro del rancho al azar', () => {
    const s = stateWithTeam(2)
    const [active, , last] = s.owned
    moveMon(s, active.uid, null, seqRng(0.99))
    expect(s.activeUid).toBe(last.uid)
  })

  it('no guarda al activo si no hay nadie más en el rancho', () => {
    const s = stateWithTeam(0)
    expect(moveBlocker(s, s.owned[0].uid, null)).not.toBeNull()
    expect(moveMon(s, s.owned[0].uid, null)).toBe(false)
  })

  it('a otro rancho solo si es tuyo y cabe; los que están fuera no se mueven', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    expect(moveMon(s, mon.uid, 1)).toBe(false)
    s.upgrades.ranches = 1
    fillRanch(s, 1)
    expect(moveBlocker(s, mon.uid, 1)).toMatch(/cabe/)
    s.owned = s.owned.filter((m) => m.ranch !== 1)
    s.expeditions.push({ uid: mon.uid, routeId: RouteId.PuebloPaleta, durationMin: 15, focus: ExpeditionFocus.Exp, elapsedMin: 0 })
    expect(moveBlocker(s, mon.uid, 1)).toMatch(/fuera/)
    s.expeditions = []
    expect(moveMon(s, mon.uid, 1)).toBe(true)
    expect(mon.ranch).toBe(1)
  })

  it('de la Caja vuelve a un rancho con hueco', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    moveMon(s, mon.uid, null)
    expect(moveMon(s, mon.uid, 0)).toBe(true)
    expect(monPlace(s, mon.uid)).toBe(MonPlace.Ranch)
  })
})

describe('rehomeOverflow', () => {
  /** Rancho 0 con `over` espacios de más que su capacidad */
  function overfull(over: number) {
    const s = stateWithTeam(0)
    fillRanch(s)
    for (let i = 0; i < over; i++) s.owned.push(createMon(ONE_SLOT, NEW_MON_LEVEL))
    return s
  }

  it('sin ranchos de más, no toca nada', () => {
    const s = stateWithTeam(2)
    expect(rehomeOverflow(s)).toBe(0)
    expect(s.owned.every((m) => m.ranch === 0)).toBe(true)
  })

  it('lo que sobra va al siguiente rancho con hueco, empezando por los últimos', () => {
    const s = overfull(2)
    s.upgrades.ranches = 1
    const last = s.owned.slice(-2)
    expect(rehomeOverflow(s)).toBe(2)
    expect(usedSlots(s, 0)).toBe(ranchCapacity(s, 0))
    expect(last.map((m) => m.ranch)).toEqual([1, 1])
  })

  it('sin hueco en ningún rancho, a la Caja aunque se pase de su límite; el activo no se mueve', () => {
    const s = overfull(BOX_SLOTS + 1)
    rehomeOverflow(s)
    expect(usedSlots(s, 0)).toBe(ranchCapacity(s, 0))
    expect(boxedMons(s)).toHaveLength(BOX_SLOTS + 1)
    expect(s.owned[0].ranch).toBe(0)
  })
})

describe('placeMon', () => {
  it('guarda dónde se suelta, dentro del prado', () => {
    const s = stateWithTeam()
    const mon = s.owned[1]
    placeMon(s, mon.uid, { x: 30, y: 140 })
    expect(mon.spot).toEqual({ x: 30, y: 100 })
    moveMon(s, mon.uid, null)
    expect(mon.spot).toBeNull()
  })
})
